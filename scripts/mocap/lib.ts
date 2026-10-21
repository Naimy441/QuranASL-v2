// Shared retargeting: MediaPipe Holistic capture → avatar motion clip.
// Used for single signs (retarget.ts) and whole ayat (scripts/bsl/retarget-ayat.ts).
import * as THREE from "three";
import { BODY } from "../../src/lib/asl/body";

type P = [number, number, number];
export interface Frame { pw?: number[][]; pi?: number[][]; lh?: number[][]; rh?: number[][]; fc?: number[][] }
export interface Capture { src: string; fps: number; w: number; h: number; faceIdx: number[]; frames: Frame[] }
export interface Clip { id: string; src: string; fps: number; seg: [number, number]; R: number[][] | null; L: number[][] | null; face: number[][] }

const D = 180 / Math.PI;
const v = (a: number[]) => new THREE.Vector3(a[0], a[1], a[2]);
/** MediaPipe (x right, y down, z away) → avatar (x = signer's left, y up, z toward viewer) */
const toAv = (a: number[]) => new THREE.Vector3(a[0], -a[1], -a[2]);
const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));
const ang = (a: THREE.Vector3, b: THREE.Vector3) => a.angleTo(b) * D;

interface HandSample { pos: THREE.Vector3; X: THREE.Vector3; Y: THREE.Vector3; Z: THREE.Vector3; shape: number[] | null }

/** Rig joint parameters (degrees) from 21 hand landmarks expressed in avatar axes. */
export function handParams(lm: THREE.Vector3[], isRight: boolean) {
  const s = isRight ? 1 : -1;
  const Y = lm[9].clone().sub(lm[0]).normalize();
  const Z = new THREE.Vector3().crossVectors(lm[5].clone().sub(lm[0]), lm[17].clone().sub(lm[0]));
  if (!isRight) Z.negate();
  Z.addScaledVector(Y, -Z.dot(Y)).normalize();
  const X = new THREE.Vector3().crossVectors(Y, Z);
  const local = lm.map((p) => {
    const d = p.clone().sub(lm[0]);
    return new THREE.Vector3(d.dot(X), d.dot(Y), d.dot(Z));
  });
  const shape: number[] = [];
  const fingers: [number, number, number, number, number][] = [
    [5, 6, 7, 8, 1], [9, 10, 11, 12, 0.15], [13, 14, 15, 16, -1], [17, 18, 19, 20, -1],
  ];
  for (const [m, p, d, t, dir] of fingers) {
    const v1 = local[p].clone().sub(local[m]), v2 = local[d].clone().sub(local[p]), v3 = local[t].clone().sub(local[d]);
    const mcp = Math.atan2(v1.z, v1.y) * D;
    const lat = Math.asin(clamp(v1.x / (v1.length() || 1), -1, 1)) * D;
    const spread = dir === 0.15 ? 0 : clamp(s * dir * lat - (dir > 0 ? 4 : 6), -10, 25);
    shape.push(clamp(mcp, -15, 100), clamp(ang(v1, v2), 0, 115), clamp(ang(v2, v3), 0, 95), spread);
  }
  const u = local[2].clone().sub(local[1]).normalize();
  const b = Math.asin(clamp(u.z, -1, 1)) * D;
  const a = Math.atan2(s * u.x, u.y) * D;
  const t1 = local[3].clone().sub(local[2]), t2 = local[4].clone().sub(local[3]);
  shape.push(clamp(a, -45, 80), clamp(b, -10, 80), 0, clamp(ang(u, t1), 0, 80), clamp(ang(t1, t2), 0, 90));
  return { X, Y, Z, shape };
}

function smooth(arr: (number[] | null)[], win = 2): (number[] | null)[] {
  return arr.map((x, i) => {
    if (!x) return x;
    const acc = x.map(() => 0);
    let n = 0;
    for (let k = -win; k <= win; k++) {
      const y = arr[i + k];
      if (!y) continue;
      y.forEach((val, j) => (acc[j] += val));
      n++;
    }
    return acc.map((val) => val / n);
  });
}

/** Fill gaps by linear interpolation; hold ends. */
function fill(arr: (number[] | null)[]): number[][] | null {
  const idx = arr.map((x, i) => (x ? i : -1)).filter((i) => i >= 0);
  if (!idx.length) return null;
  return arr.map((x, i) => {
    if (x) return x;
    const prev = [...idx].reverse().find((j) => j < i);
    const next = idx.find((j) => j > i);
    if (prev === undefined) return arr[next!]!;
    if (next === undefined) return arr[prev]!;
    const t = (i - prev) / (next - prev);
    return arr[prev]!.map((val, j) => val + (arr[next]![j] - val) * t);
  });
}

const r3 = (x: number) => Math.round(x * 1000) / 1000;
const r1 = (x: number) => Math.round(x * 10) / 10;


/** Per-frame activity: how high the higher wrist is between hip (0) and shoulder (1). */
export function activity(cap: Capture): number[] {
  return cap.frames.map((f) => {
    if (!f.pi) return 0;
    const hipY = (f.pi[23]?.[1] ?? 1) + (f.pi[24]?.[1] ?? 1);
    const shY = f.pi[11][1] + f.pi[12][1];
    const h = (hipY - shY) / 2 || 0.3;
    const lift = (w: number) => (hipY / 2 - f.pi![w][1]) / h;
    return Math.max(lift(15), lift(16));
  });
}

/** Runs of frames where the hands are raised (gaps under `gap` seconds are bridged). */
export function activeSegments(cap: Capture, act: number[], thr = 0.3, gap = 0.3): [number, number][] {
  const n = act.length;
  const on = act.map((a) => a > thr);
  const segs: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    if (!on[i]) continue;
    let j = i;
    while (j + 1 < n && (on[j + 1] || on.slice(j + 1, j + 1 + Math.round(cap.fps * gap)).some(Boolean))) j++;
    segs.push([i, j]);
    i = j;
  }
  return segs;
}

/** Retarget frames [s0, s1] of a capture onto the avatar. Returns null without a dominant hand. */
export function retargetRange(cap: Capture, s0: number, s1: number, id: string, act = activity(cap)): Clip | null {
  const F = cap.frames;
  // ---- per-frame samples ----
  const avMid = new THREE.Vector3(0, BODY.shoulder.y, BODY.shoulder.z);
  const tracks: Record<"R" | "L", (number[] | null)[]> = { R: [], L: [] };
  const faces: (number[] | null)[] = [];
  let browBase: number[] = [], mouthBase: number[] = [];
  for (let i = s0; i <= s1; i++) {
    const f = F[i];
    if (!f.pw || !f.pi) {
      tracks.R.push(null);
      tracks.L.push(null);
      faces.push(null);
      continue;
    }
    const Ls = v(f.pw[11]), Rs = v(f.pw[12]);
    const mid = Ls.clone().add(Rs).multiplyScalar(0.5);
    const scale = (2 * BODY.shoulder.x) / (Ls.distanceTo(Rs) || 0.35);
    // assign holistic hands to pose wrists by image proximity
    const hands = [f.lh, f.rh].filter(Boolean) as number[][][];
    for (const side of ["R", "L"] as const) {
      const wIdx = side === "R" ? 16 : 15;
      const wImg = f.pi[wIdx];
      const hand = hands.find((h) => Math.hypot(h[0][0] - wImg[0], h[0][1] - wImg[1]) < 0.08);
      const wrist = toAv(f.pw[wIdx].slice(0, 3).map((x, k) => x - mid.getComponent(k))).multiplyScalar(scale).add(avMid);
      // MediaPipe depth for hands in front of the chest is shallow; keep hands out of the body.
      if (wrist.y > 1.0 && wrist.y < 1.75) wrist.z = Math.max(wrist.z + 0.06, 0.16);
      if (hand) {
        const lm = hand.map((p) => toAv([p[0] * cap.w, p[1] * cap.h, p[2] * cap.w]));
        const hp = handParams(lm, side === "R");
        tracks[side].push([wrist.x, wrist.y, wrist.z, ...hp.X.toArray(), ...hp.Y.toArray(), ...hp.Z.toArray(), ...hp.shape]);
      } else {
        tracks[side].push(act[i] > 0.25 ? null : [wrist.x, wrist.y, wrist.z, NaN]);
      }
    }
    // face channels
    if (f.fc) {
      const P = (k: number) => f.fc![cap.faceIdx.indexOf(k)];
      const fh = Math.hypot(P(10)[0] - P(152)[0], (P(10)[1] - P(152)[1]) * cap.h / cap.w) || 0.1;
      const by = (P(105)[1] + P(66)[1] + P(107)[1] + P(334)[1] + P(296)[1] + P(336)[1]) / 6;
      const ey = (P(159)[1] + P(386)[1]) / 2;
      const brow = ((ey - by) * cap.h / cap.w) / fh;
      const mouth = ((P(14)[1] - P(13)[1]) * cap.h / cap.w) / fh;
      const width = Math.abs(P(291)[0] - P(61)[0]) / fh;
      const eyeOpen = (((P(145)[1] - P(159)[1]) + (P(374)[1] - P(386)[1])) / 2 * cap.h / cap.w) / fh;
      const yaw = ((P(1)[0] - (P(234)[0] + P(454)[0]) / 2) / (Math.abs(P(454)[0] - P(234)[0]) || 0.1));
      const roll = Math.atan2((P(263)[1] - P(33)[1]) * cap.h, (P(263)[0] - P(33)[0]) * cap.w);
      const pitch = ((P(1)[1] - (P(168)[1] + P(13)[1]) / 2) * cap.h / cap.w) / fh;
      faces.push([brow, mouth, width, eyeOpen, yaw, roll, pitch]);
    } else faces.push(null);
  }
  // baseline from the whole clip (median)
  const med = (k: number) => {
    const xs = faces.filter(Boolean).map((x) => x![k]).sort((a, b) => a - b);
    return xs[Math.floor(xs.length / 2)] ?? 0;
  };
  browBase = [med(0)];
  mouthBase = [med(1), med(2), med(3), med(6)];

  const out: Clip = {
    id, src: cap.src, fps: cap.fps, seg: [r3(s0 / cap.fps), r3(s1 / cap.fps)], R: null, L: null, face: [],
  };
  for (const side of ["R", "L"] as const) {
    const raw = tracks[side];
    // frames with only a wrist (hand at rest, not tracked) keep the wrist and get a relaxed hand
    const full = raw.map((x) => (x && Number.isNaN(x[3]) ? null : x));
    const filled = fill(smooth(full, 2));
    if (!filled) continue;
    const used = full.filter(Boolean).length / raw.length;
    if (side === "L" && used < 0.25) continue; // non-dominant hand essentially idle
    out[side] = filled.map((x) => {
      const X = new THREE.Vector3(x[3], x[4], x[5]).normalize();
      const Y = new THREE.Vector3(x[6], x[7], x[8]).normalize();
      const Z = new THREE.Vector3().crossVectors(X, Y).normalize();
      const X2 = new THREE.Vector3().crossVectors(Y, Z);
      const q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(X2, Y, Z));
      return [r3(x[0]), r3(x[1]), r3(x[2]), r3(q.x), r3(q.y), r3(q.z), r3(q.w), ...x.slice(12).map(r1)];
    });
  }
  if (!out.R) return null;
  out.face = (fill(smooth(faces, 2)) ?? []).map((x) => [
    r3(clamp((x[0] - browBase[0]) / 0.03, 0, 1)), // browUp
    r3(clamp((browBase[0] - x[0]) / 0.02, 0, 1)), // browDown
    r3(clamp((x[1] - mouthBase[0]) / 0.09, 0, 1)), // mouthOpen
    r3(clamp((x[2] - mouthBase[1]) / 0.05, -1, 1)), // smile (+) / purse (-)
    r3(clamp(1 - x[3] / (mouthBase[2] || 0.05), 0, 1)), // eyesClosed
    r3(clamp(x[4] * 1.2, -0.5, 0.5)), // headYaw
    r3(clamp(x[5], -0.4, 0.4)), // headRoll
    r3(clamp((x[6] - mouthBase[3]) * 3, -0.3, 0.3)), // headPitch
  ]);
  return out;
}

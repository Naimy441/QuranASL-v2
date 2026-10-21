// Shared retargeting: MediaPipe Holistic capture → avatar motion clip.
// Used for single signs (retarget.ts) and whole ayat (scripts/bsl/retarget-ayat.ts).
import * as THREE from "three";
import { BODY } from "../../src/lib/asl/body";
import { elbowSwivel } from "../../src/lib/avatar/elbow";
import { buildHandRig, type HandRig } from "../../src/lib/avatar/handRig";
import type { Handshape } from "../../src/lib/asl/types";
import { bodyModel, bodySDF } from "../../src/lib/asl/physical";

const SKIN_BODY = bodyModel("none");
const CLOTHED = bodyModel("hijab");
const _sn = new THREE.Vector3(), _sp = new THREE.Vector3();
/** z of the front of the face / body at (x, y), or null when nothing is there. */
function frontZ(x: number, y: number, body = SKIN_BODY): number | null {
  let lo = -0.05, hi = 0.45;
  if (bodySDF(_sp.set(x, y, lo), body, null, _sn) > 0) return null;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (bodySDF(_sp.set(x, y, mid), body, null, _sn) > 0) hi = mid;
    else lo = mid;
  }
  return hi;
}

const rigs: Record<"R" | "L", HandRig> = { R: buildHandRig("R"), L: buildHandRig("L") };
/** MediaPipe hand landmark → [rig joint index (0-3 fingers, 4 thumb), joint] */
const LM_JOINT: Record<number, [number, "mcp" | "pip" | "dip" | "tip"]> = {
  1: [4, "mcp"], 2: [4, "pip"], 3: [4, "dip"], 4: [4, "tip"],
  5: [0, "mcp"], 6: [0, "pip"], 7: [0, "dip"], 8: [0, "tip"], 9: [1, "mcp"], 10: [1, "pip"], 11: [1, "dip"], 12: [1, "tip"],
  13: [2, "mcp"], 14: [2, "pip"], 15: [2, "dip"], 16: [2, "tip"], 17: [3, "mcp"], 18: [3, "pip"], 19: [3, "dip"], 20: [3, "tip"],
};
const CONTACT_LM = [4, 8, 12, 16, 20, 6, 10, 3, 5, 9, 13, 17];
/** Position of a landmark's joint on the avatar hand (hand space) for a captured shape. */
function jointLocal(side: "R" | "L", shape: number[], lm: number) {
  const rig = rigs[side];
  const f = (k: number) => [shape[k], shape[k + 1], shape[k + 2], shape[k + 3]] as [number, number, number, number];
  rig.setShape({ i: f(0), m: f(4), r: f(8), p: f(12), t: [shape[16], shape[17], shape[18], shape[19], shape[20]] } as Handshape);
  rig.root.updateMatrixWorld(true);
  const [j, k] = LM_JOINT[lm];
  return rig.joints[j][k].getWorldPosition(new THREE.Vector3());
}

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

/** Zero-phase Gaussian smoothing over present samples (gaps are not bridged). sigma in frames. */
function smooth(arr: (number[] | null)[], sigma = 1.2): (number[] | null)[] {
  const win = Math.max(1, Math.ceil(sigma * 2.5));
  const w = Array.from({ length: 2 * win + 1 }, (_, k) => Math.exp(-((k - win) ** 2) / (2 * sigma * sigma)));
  return arr.map((x, i) => {
    if (!x) return x;
    const acc = x.map(() => 0);
    let n = 0;
    for (let k = -win; k <= win; k++) {
      const y = arr[i + k];
      if (!y) continue;
      const wk = w[k + win];
      y.forEach((val, j) => (acc[j] += val * wk));
      n += wk;
    }
    return acc.map((val) => val / n);
  });
}

/** Drop isolated tracking glitches: a sample that jumps away and straight back (handedness swaps, misdetections). */
function despike(arr: (number[] | null)[], maxJump: number): (number[] | null)[] {
  const out = arr.slice();
  const d = (a: number[], b: number[]) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  for (let i = 1; i < arr.length - 1; i++) {
    const a = arr[i - 1], x = arr[i], b = arr[i + 1];
    if (!a || !x || !b) continue;
    if (d(a, x) > maxJump && d(x, b) > maxJump && d(a, b) < maxJump) out[i] = null;
  }
  return out;
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


// Avatar positions of the face landmarks used as anchors (torso space, x/y only).
const AV_FACE = { nose: [0, 1.604], top: 1.70, chin: 1.522 };

/**
 * Image → avatar (x, y) for one frame. Signing space is anchored to the shoulders
 * (scale = shoulder width), and blends to a face-anchored frame (scale = face height,
 * origin = nose tip) for hands near the head, so a fingertip on the chin in the
 * video lands on the avatar's chin.
 */
function anchors(f: Frame, cap: Capture) {
  const px = (p: number[]) => [p[0] * cap.w, p[1] * cap.h];
  const ls = px(f.pi![11]), rs = px(f.pi![12]);
  const ms = [(ls[0] + rs[0]) / 2, (ls[1] + rs[1]) / 2];
  const ks = (2 * BODY.shoulder.x) / (Math.hypot(ls[0] - rs[0], ls[1] - rs[1]) || 1);
  const P = (k: number) => px(f.fc![cap.faceIdx.indexOf(k)]);
  const nose = P(1), top = P(10), chin = P(152), fl = P(234), fr = P(454);
  const fh = Math.hypot(top[0] - chin[0], top[1] - chin[1]) || 1;
  const kf = (AV_FACE.top - AV_FACE.chin) / fh;
  const fc = [(fl[0] + fr[0]) / 2, (top[1] + chin[1]) / 2];
  const fw = Math.abs(fr[0] - fl[0]) / 2 || fh / 2.4;
  /** 1 when a point is on the face oval, 0 beyond ~1.4 face radii */
  const faceDist = (p: number[]) => Math.hypot((p[0] - fc[0]) / fw, (p[1] - fc[1]) / (fh / 2));
  const faceW = (pts: number[][]) => {
    const d = Math.min(...pts.map(faceDist));
    return d <= 1 ? 1 : d >= 2.2 ? 0 : 1 - (d - 1) / 1.2;
  };
  const fn = (p: number[], near: number[][]) => {
    const sx = (p[0] - ms[0]) * ks, sy = BODY.shoulder.y - (p[1] - ms[1]) * ks;
    const fx = AV_FACE.nose[0] + (p[0] - nose[0]) * kf, fy = AV_FACE.nose[1] - (p[1] - nose[1]) * kf;
    const w = faceW(near);
    return [sx + (fx - sx) * w, sy + (fy - sy) * w];
  };
  return Object.assign(fn, { faceW, faceDist });
}

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
  const tracks: Record<"R" | "L", (number[] | null)[]> = { R: [], L: [] };
  const faces: (number[] | null)[] = [];
  let browBase: number[] = [], mouthBase: number[] = [];
  for (let i = s0; i <= s1; i++) {
    const f = F[i];
    if (!f.pw || !f.pi || !f.fc) {
      tracks.R.push(null);
      tracks.L.push(null);
      faces.push(null);
      continue;
    }
    const img = (p: number[]) => [p[0] * cap.w, p[1] * cap.h];
    const map = anchors(f, cap);
    // Holistic labels hands by the pose wrist they were cropped from; trust that unless the hand is
    // far from its wrist (then try the other label). Both labels on one hand = hands pressed together.
    const near = (h: number[][] | undefined, w: number[], r: number) => !!h && Math.hypot(h[0][0] - w[0], h[0][1] - w[1]) < r;
    const dup = !!f.lh && !!f.rh && Math.hypot(f.lh[0][0] - f.rh[0][0], f.lh[0][1] - f.rh[0][1]) < 0.02;
    for (const side of ["R", "L"] as const) {
      const wIdx = side === "R" ? 16 : 15, eIdx = side === "R" ? 14 : 13, sIdx = side === "R" ? 12 : 11;
      const wImg = f.pi[wIdx];
      const own = side === "R" ? f.rh : f.lh, other = side === "R" ? f.lh : f.rh;
      const hand = near(own, wImg, dup ? 0.2 : 0.16) ? own : !dup && near(other, wImg, 0.06) ? other : undefined;
      // x, y: from the image (reliable), anchored to the shoulders and, near the head, to the face
      const anchorPts = hand ? hand.map(img) : [img(wImg)];
      const wxy = map(hand ? img(hand[0]) : img(wImg), anchorPts);
      const S = new THREE.Vector3(side === "R" ? -BODY.shoulder.x : BODY.shoulder.x, BODY.shoulder.y, BODY.shoulder.z);
      // z: from arm reach (elbow angle is far more reliable than MediaPipe's absolute depth)
      const pw = f.pw;
      const vis = Math.min(pw[eIdx][3] ?? 1, pw[wIdx][3] ?? 1);
      const u1 = v(pw[sIdx]).sub(v(pw[eIdx])), u2 = v(pw[wIdx]).sub(v(pw[eIdx]));
      const elbow = u1.angleTo(u2);
      const reach = Math.sqrt(BODY.upperArm ** 2 + BODY.forearm ** 2 - 2 * BODY.upperArm * BODY.forearm * Math.cos(elbow));
      const planar = Math.hypot(wxy[0] - S.x, wxy[1] - S.y);
      let dz = Math.sqrt(Math.max(0, reach * reach - planar * planar));
      if (vis < 0.5) {
        // elbow not visible: fall back to MediaPipe depth relative to the shoulders
        const mid = v(pw[11]).add(v(pw[12])).multiplyScalar(0.5);
        const sw = v(pw[11]).distanceTo(v(pw[12])) || 0.35;
        dz = Math.max(0.05, (-(pw[wIdx][2] - mid.z) * (2 * BODY.shoulder.x)) / sw);
      }
      const fw = map.faceW(anchorPts);
      let hp: ReturnType<typeof handParams> | null = null;
      let contact: { off: THREE.Vector3; x: number; y: number } | null = null;
      if (hand) {
        const lm = hand.map((p) => toAv([p[0] * cap.w, p[1] * cap.h, p[2] * cap.w]));
        hp = handParams(lm, side === "R");
        if (fw > 0) {
          // near the face, place the part of the hand closest to the face (fingertip on the chin...) exactly,
          // and hang the avatar's own hand from it, rather than trusting the wrist and the hand's proportions
          const c = CONTACT_LM.reduce((a, b) => (map.faceDist(img(hand[b])) < map.faceDist(img(hand[a])) ? b : a));
          const ac = map(img(hand[c]), anchorPts);
          const Z = new THREE.Vector3().crossVectors(hp.X, hp.Y).normalize();
          const q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3().crossVectors(hp.Y, Z), hp.Y, Z));
          const off = jointLocal(side, hp.shape, c).applyQuaternion(q);
          wxy[0] += (ac[0] - off.x - wxy[0]) * fw;
          wxy[1] += (ac[1] - off.y - wxy[1]) * fw;
          contact = { off, x: wxy[0] + off.x, y: wxy[1] + off.y };
        }
      }
      const planar2 = Math.hypot(wxy[0] - S.x, wxy[1] - S.y);
      if (vis >= 0.5) dz = Math.sqrt(Math.max(0, reach * reach - planar2 * planar2));
      const wrist = new THREE.Vector3(wxy[0], wxy[1], S.z + dz);
      // hand over the face in the image: it is touching or just in front of it
      if (contact) {
        // a hand overlapping the face in the video is touching it or within a few cm (ASL locations
        // on the face are contact locations): put the touching landmark on the avatar's face surface
        const zs = frontZ(contact.x, contact.y);
        const zc = wrist.z + contact.off.z;
        if (zs !== null) {
          const gap = zc - zs;
          const w = fw * Math.min(1, Math.max(0, (0.26 - gap) / 0.1)); // full within 16 cm, none beyond 26 cm
          wrist.z += (zs + 0.008 - zc) * w;
        }
      }
      // a hand seen over the torso in a frontal video is in front of it, never inside
      const zb = frontZ(wrist.x, wrist.y, CLOTHED);
      if (zb !== null && !contact) wrist.z = Math.max(wrist.z, zb + 0.03);
      const swivel = elbowSwivel(toAv(pw[sIdx]), toAv(pw[eIdx]), toAv(pw[wIdx]));
      if (hp) {
        tracks[side].push([wrist.x, wrist.y, wrist.z, ...hp.X.toArray(), ...hp.Y.toArray(), ...hp.Z.toArray(), ...hp.shape, swivel]);
      } else {
        tracks[side].push(act[i] > 0.25 ? null : [wrist.x, wrist.y, wrist.z, NaN]); // (z already clamped above)
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
    const sigma = Math.max(0.6, 0.045 * cap.fps); // ~45 ms
    const filled = fill(smooth(despike(full, 0.12), sigma));
    if (!filled) continue;
    const used = full.filter(Boolean).length / raw.length;
    if (side === "L" && used < 0.25) continue; // non-dominant hand essentially idle
    out[side] = filled.map((x) => {
      const X = new THREE.Vector3(x[3], x[4], x[5]).normalize();
      const Y = new THREE.Vector3(x[6], x[7], x[8]).normalize();
      const Z = new THREE.Vector3().crossVectors(X, Y).normalize();
      const X2 = new THREE.Vector3().crossVectors(Y, Z);
      const q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(X2, Y, Z));
      // [pos, quat, 16 finger + 5 thumb params, elbow swivel]
      return [r3(x[0]), r3(x[1]), r3(x[2]), r3(q.x), r3(q.y), r3(q.z), r3(q.w), ...x.slice(12, 33).map(r1), r3(x[33] ?? 0)];
    });
  }
  if (!out.R) return null;
  out.face = (fill(smooth(faces, Math.max(0.6, 0.06 * cap.fps))) ?? []).map((x) => [
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

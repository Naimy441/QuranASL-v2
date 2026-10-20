import * as THREE from "three";
import { HANDSHAPES, lerpHandshape } from "./handshapes";
import { compileSign, orientQuat } from "./dsl";
import { dirVec, locVec } from "./body";
import type { CompiledSign, FaceState, Handshape, HandKey, HandSide } from "./types";

export const NEUTRAL_FACE: FaceState = {
  browUp: 0, browDown: 0, browInnerUp: 0, squint: 0, eyesWide: 0, eyesClosed: 0,
  mouthOpen: 0, smile: 0.08, frown: 0, purse: 0, puff: 0, lipsPress: 0, teeth: 0,
  headPitch: 0, headYaw: 0, headRoll: 0, torsoYaw: 0, torsoPitch: 0, torsoRoll: 0,
  gazeX: 0, gazeY: 0, nod: 0, shake: 0,
};

/** A segment of the timeline that came from one gloss token. */
export interface TimelineItem {
  index: number; // index into the source token list
  label: string;
  kind: "sign" | "fs" | "pause" | "missing";
  start: number;
  end: number;
}

export interface FaceSpan {
  start: number;
  end: number;
  face: Partial<FaceState>;
  ramp?: number;
}

export interface Timeline {
  dur: number;
  R: HandKey[];
  L: HandKey[];
  items: TimelineItem[];
  faces: FaceSpan[];
}

/** Input unit for the sequencer. */
export interface SeqUnit {
  index: number;
  label: string;
  kind: TimelineItem["kind"];
  sign?: CompiledSign; // for sign / fs / missing (placeholder motion)
  pause?: number;
  /** Mirror the sign to the other side (e.g. locus b) — not used yet */
  face?: Partial<FaceState>;
}

function restKey(side: HandSide, t: number, hold: number): HandKey {
  const p = locVec("rest", side);
  const q = orientQuat(dirVec("UI", side), dirVec("FI", side));
  return { t, hold, pos: [p[0], p[1] - 0.04, p[2] - 0.04], quat: [q.x, q.y, q.z, q.w], shape: HANDSHAPES.relaxed };
}
function readyKey(side: HandSide, t: number, hold: number): HandKey {
  const p = locVec("ready", side);
  const q = orientQuat(dirVec("UI", side), dirVec("FI", side));
  return { t, hold, pos: [p[0], p[1] - 0.05, p[2] - 0.05], quat: [q.x, q.y, q.z, q.w], shape: HANDSHAPES.relaxed };
}

const dist = (a: number[], b: number[]) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const transTime = (a: number[], b: number[]) => Math.min(0.42, Math.max(0.13, 0.12 + dist(a, b) * 0.6));

function shiftKeys(keys: HandKey[], dt: number): HandKey[] {
  return keys.map((k) => ({ ...k, t: k.t + dt }));
}

export function buildTimeline(units: SeqUnit[], opts: { lead?: number; tail?: number } = {}): Timeline {
  const lead = opts.lead ?? 0.35;
  const R: HandKey[] = [restKey("R", 0, lead)];
  const L: HandKey[] = [restKey("L", 0, lead)];
  const items: TimelineItem[] = [];
  const faces: FaceSpan[] = [];
  let cursor = lead; // end of last activity
  let lActive = false;

  for (let ui = 0; ui < units.length; ui++) {
    const u = units[ui];
    if (u.kind === "pause" || !u.sign) {
      const p = u.pause ?? 0.3;
      R[R.length - 1].hold += p;
      L[L.length - 1].hold += p;
      items.push({ index: u.index, label: u.label, kind: "pause", start: cursor, end: cursor + p });
      cursor += p;
      continue;
    }
    const s = u.sign;
    const lastR = R[R.length - 1];
    const tt = Math.max(transTime(lastR.pos, s.R[0].pos), s.L ? transTime(L[L.length - 1].pos, s.L[0].pos) : 0);
    const start = cursor + tt;
    // Extend holds of the previous keys so the transition starts at "cursor".
    lastR.hold = Math.max(lastR.hold, cursor - lastR.t);
    const lastL = L[L.length - 1];
    lastL.hold = Math.max(lastL.hold, cursor - lastL.t);

    R.push(...shiftKeys(s.R, start));
    if (s.L) {
      L.push(...shiftKeys(s.L, start));
      lActive = true;
    } else {
      // Non-dominant hand: settle into a low "ready" position unless it will be
      // needed again very soon, in which case it simply holds.
      const next = units.slice(ui + 1, ui + 3).find((x) => x.sign);
      const needSoon = !!next?.sign?.L;
      if (lActive && !needSoon) {
        L.push(readyKey("L", start + 0.15, 0));
        lActive = false;
      }
    }
    const end = start + s.dur;
    items.push({ index: u.index, label: u.label, kind: u.kind, start, end });
    if (s.face) faces.push({ start: start - 0.08, end: end + 0.04, face: s.face, ramp: 0.1 });
    if (u.face) faces.push({ start: start - 0.1, end, face: u.face, ramp: 0.12 });
    cursor = end;
  }
  const tail = opts.tail ?? 0.5;
  const lr = R[R.length - 1];
  lr.hold = Math.max(lr.hold, cursor - lr.t);
  const ll = L[L.length - 1];
  ll.hold = Math.max(ll.hold, cursor - ll.t);
  const restT = cursor + 0.45;
  R.push(restKey("R", restT, tail));
  L.push(restKey("L", restT, tail));
  return { dur: restT + tail, R, L, items, faces };
}

// ---------------------------------------------------------------------------
// Pose evaluation

export interface HandPose {
  pos: THREE.Vector3;
  quat: THREE.Quaternion;
  shape: Handshape;
}

export interface Pose {
  R: HandPose;
  L: HandPose;
  face: FaceState;
}

const ease = (u: number) => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u));
const qa = new THREE.Quaternion(), qb = new THREE.Quaternion(), qt = new THREE.Quaternion();
const axis = new THREE.Vector3();

function findSeg(keys: HandKey[], t: number) {
  // binary search for last key with k.t <= t
  let lo = 0, hi = keys.length - 1;
  if (t <= keys[0].t) return 0;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (keys[mid].t <= t) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

function wiggleShape(h: Handshape, amp: number, phase: number): Handshape {
  const w = (f: number[], o: number) => {
    const d = Math.sin(phase * Math.PI * 2 * 3 + o) * amp;
    return [f[0] + d, f[1] + d * 0.6, f[2], f[3]] as [number, number, number, number];
  };
  return { i: w(h.i, 0), m: w(h.m, 1.2), r: w(h.r, 2.4), p: w(h.p, 3.6), t: h.t };
}

export function sampleHand(keys: HandKey[], t: number, out: HandPose): HandPose {
  const i = findSeg(keys, t);
  const a = keys[i];
  const aEnd = a.t + a.hold;
  if (t <= aEnd || i === keys.length - 1) {
    out.pos.set(...a.pos);
    out.quat.set(...a.quat);
    out.shape = a.shape;
    const ov = a.overlay;
    if (ov && t >= a.t) {
      const lt = Math.min(1, (t - a.t) / Math.max(1e-3, a.hold));
      const env = Math.sin(Math.PI * Math.min(1, lt)) ** 0.5;
      if (ov.circle) {
        const n = axis.set(...ov.circle.normal);
        const e1 = new THREE.Vector3(0, 1, 0);
        if (Math.abs(n.y) > 0.9) e1.set(0, 0, 1);
        e1.addScaledVector(n, -e1.dot(n)).normalize();
        const e2 = new THREE.Vector3().crossVectors(n, e1);
        const th = lt * Math.PI * 2 * ov.circle.turns;
        const r = ov.circle.radius;
        out.pos.addScaledVector(e1, r * (Math.cos(th) - 1)).addScaledVector(e2, r * Math.sin(th));
      }
      if (ov.shake) out.pos.x += Math.sin(lt * Math.PI * 2 * 4) * ov.shake * env;
      if (ov.tap) {
        const pn = new THREE.Vector3(0, 0, 1).applyQuaternion(out.quat);
        out.pos.addScaledVector(pn, -Math.abs(Math.sin(lt * Math.PI * 2)) * ov.tap * env);
      }
      if (ov.twist) {
        const fy = new THREE.Vector3(0, 1, 0).applyQuaternion(out.quat);
        qt.setFromAxisAngle(fy, (Math.sin(lt * Math.PI * 2 * 1.5) * ov.twist * env * Math.PI) / 180);
        out.quat.premultiply(qt);
      }
      if (ov.wiggle) out.shape = wiggleShape(a.shape, ov.wiggle * env, lt);
    }
    return out;
  }
  const b = keys[i + 1];
  const span = Math.max(1e-4, b.t - aEnd);
  const u = (t - aEnd) / span;
  const e = ease(u);
  // position: quadratic bezier with optional bulge
  const ax = a.pos[0], ay = a.pos[1], az = a.pos[2];
  const bx = b.pos[0], by = b.pos[1], bz = b.pos[2];
  if (b.arc) {
    const cx = (ax + bx) / 2 + b.arc[0] * 2, cy = (ay + by) / 2 + b.arc[1] * 2, cz = (az + bz) / 2 + b.arc[2] * 2;
    const m = 1 - e;
    out.pos.set(m * m * ax + 2 * m * e * cx + e * e * bx, m * m * ay + 2 * m * e * cy + e * e * by, m * m * az + 2 * m * e * cz + e * e * bz);
  } else {
    out.pos.set(ax + (bx - ax) * e, ay + (by - ay) * e, az + (bz - az) * e);
  }
  qa.set(...a.quat);
  qb.set(...b.quat);
  out.quat.copy(qa).slerp(qb, e);
  // handshape changes lead the movement slightly
  out.shape = lerpHandshape(a.shape, b.shape, ease(Math.min(1, u * 1.35)));
  return out;
}

export function sampleFace(tl: Timeline, t: number, out: FaceState): FaceState {
  Object.assign(out, NEUTRAL_FACE);
  for (const s of tl.faces) {
    if (t < s.start || t > s.end) continue;
    const r = s.ramp ?? 0.15;
    const w = Math.min(1, (t - s.start) / r, (s.end - t) / r);
    for (const [k, v] of Object.entries(s.face)) {
      const key = k as keyof FaceState;
      const cur = out[key];
      const target = NEUTRAL_FACE[key] + (v as number) * w;
      // channels combine by taking the stronger deviation
      if (Math.abs(target - NEUTRAL_FACE[key]) > Math.abs(cur - NEUTRAL_FACE[key])) out[key] = target;
    }
  }
  return out;
}

export function makePose(): Pose {
  return {
    R: { pos: new THREE.Vector3(), quat: new THREE.Quaternion(), shape: HANDSHAPES.relaxed },
    L: { pos: new THREE.Vector3(), quat: new THREE.Quaternion(), shape: HANDSHAPES.relaxed },
    face: { ...NEUTRAL_FACE },
  };
}

export function samplePose(tl: Timeline, t: number, out: Pose): Pose {
  sampleHand(tl.R, t, out.R);
  sampleHand(tl.L, t, out.L);
  sampleFace(tl, t, out.face);
  return out;
}

/** Convenience: timeline for a single sign definition (used by previews). */
export function timelineForDef(id: string, def: string): Timeline {
  const s = compileSign(id, def);
  return buildTimeline([{ index: 0, label: id, kind: "sign", sign: s }]);
}

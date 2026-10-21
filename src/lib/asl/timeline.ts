import * as THREE from "three";
import { HANDSHAPES, blendHandshape, lerpHandshape } from "./handshapes";
import { bodyModel, bodySDF, handPenetration, type BodyModel } from "./physical";
import { angleDiff } from "../avatar/elbow";
import learned from "../avatar/learned.json";
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

export interface FaceTrack {
  start: number;
  keys: { t: number; f: Partial<FaceState> }[];
}

export interface Timeline {
  dur: number;
  R: HandKey[];
  L: HandKey[];
  items: TimelineItem[];
  faces: FaceSpan[];
  tracks: FaceTrack[];
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
  // hands folded at rest: the right hand lies on top of the left, never through it
  const up = side === "R" ? 0.03 : 0;
  return { t, hold, pos: [p[0], p[1] - 0.04 + up, p[2] - 0.04 + up * 0.3], quat: [q.x, q.y, q.z, q.w], shape: HANDSHAPES.relaxed };
}
function readyKey(side: HandSide, t: number, hold: number): HandKey {
  const p = locVec("ready", side);
  const q = orientQuat(dirVec("UI", side), dirVec("FI", side));
  return { t, hold, pos: [p[0], p[1] - 0.05, p[2] - 0.05], quat: [q.x, q.y, q.z, q.w], shape: HANDSHAPES.relaxed };
}

const dist = (a: number[], b: number[]) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
/** Transition time between signs: Fitts-like law fitted to captured human signing (learned.json). */
const FITTS = learned.timing.fitts;
export const moveTime = (d: number) => FITTS.a + FITTS.b * d;
const transTime = (a: number[], b: number[]) => Math.min(0.7, Math.max(0.2, moveTime(dist(a, b))));

function shiftKeys(keys: HandKey[], dt: number): HandKey[] {
  return keys.map((k) => ({ ...k, t: k.t + dt }));
}

export function buildTimeline(units: SeqUnit[], opts: { lead?: number; tail?: number; plan?: boolean } = {}): Timeline {
  const lead = opts.lead ?? 0.35;
  const R: HandKey[] = [restKey("R", 0, lead)];
  const L: HandKey[] = [restKey("L", 0, lead)];
  const items: TimelineItem[] = [];
  const faces: FaceSpan[] = [];
  const tracks: FaceTrack[] = [];
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
    if (s.faceTrack?.length) tracks.push({ start, keys: s.faceTrack });
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
  for (const k of R) k.v = undefined;
  for (const k of L) k.v = undefined;
  if (opts.plan !== false) {
    planPaths(R, "R");
    planPaths(L, "L");
  }
  setVelocities(R);
  setVelocities(L);
  return { dur: restT + tail, R, L, items, faces, tracks };
}

// ---------------------------------------------------------------------------
// Path planning and coarticulation

/** Conservative body for planning (hijab is the bulkiest headwear). */
const PLAN_BODY: BodyModel = bodyModel("hijab");
/** Clearance kept from the body in the middle of a movement (m). */
const CLEAR = 0.022;
const _pp = makeHandPose(), _pn = new THREE.Vector3(), _pt = new THREE.Vector3();

/**
 * Bend every movement whose straight path would cut through the body (e.g. from
 * the rest position up to the temple, across the chin, behind the other hand's
 * wrist) into an arc around it. Contacts at either end are kept: only the middle
 * of the path is required to clear the body.
 */
function planPaths(keys: HandKey[], side: HandSide) {
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1], b = keys[i];
    if (b.lin) continue;
    const t0 = a.t + a.hold, span = b.t - t0;
    if (span < 0.04) continue;
    const pa = endPen(a, side), pb = endPen(b, side);
    for (let iter = 0; iter < 3; iter++) {
      let worst = 0, wu = 0.5;
      for (const u of [0.15, 0.3, 0.45, 0.6, 0.75, 0.88]) {
        sampleSegment(a, b, u, _pp);
        const pen = handPenetration(side, _pp, PLAN_BODY);
        const allowed = Math.max(pa + (pb - pa) * u, -CLEAR * Math.sin(Math.PI * u));
        const excess = pen - allowed;
        if (excess > worst) {
          worst = excess;
          wu = u;
        }
      }
      if (worst < 0.004) break;
      // push direction: outward body normal at the deepest point of the hand (palm centre is a good proxy)
      sampleSegment(a, b, wu, _pp);
      _pt.set(0, 0.045, 0).applyQuaternion(_pp.quat).add(_pp.pos);
      bodySDF(_pt, PLAN_BODY, null, _pn);
      _pn.y = Math.max(_pn.y, 0) * 0.5; // never arc downward into the lap
      _pn.z = Math.max(_pn.z, 0.35);
      _pn.normalize();
      const e = minJerk(wu);
      const k = Math.min(0.22, (worst * 1.15) / Math.max(0.3, 4 * e * (1 - e)));
      const arc = b.arc ?? [0, 0, 0];
      b.arc = [arc[0] + _pn.x * k, arc[1] + _pn.y * k, arc[2] + _pn.z * k];
    }
  }
}

function endPen(k: HandKey, side: HandSide) {
  _pp.pos.set(...k.pos);
  _pp.quat.set(...k.quat);
  _pp.shape = k.shape;
  return handPenetration(side, _pp, PLAN_BODY);
}

/**
 * Pass-through velocities. A key with a short hold whose path carries on in
 * roughly the same direction is not a stop: the hand flows through it, as
 * signers coarticulate one sign into the next. Reversals, contacts with long
 * holds, overlays and the ends of the timeline stay full stops. Dense captured
 * motion gets Catmull-Rom velocities so it is C1-smooth instead of piecewise linear.
 */
function setVelocities(keys: HandKey[]) {
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    k.v = undefined;
    if (i === 0 || i === keys.length - 1) continue;
    const a = keys[i - 1], b = keys[i + 1];
    if (k.lin && b.lin) {
      const dt = b.t - a.t;
      if (dt > 1e-4) k.v = [(b.pos[0] - a.pos[0]) / dt, (b.pos[1] - a.pos[1]) / dt, (b.pos[2] - a.pos[2]) / dt];
      continue;
    }
    if (k.hold > 0.09 || k.overlay || b.lin) continue;
    const tin = k.t - (a.t + a.hold), tout = b.t - (k.t + k.hold);
    if (tin < 0.05 || tout < 0.05) continue;
    const din = [k.pos[0] - a.pos[0], k.pos[1] - a.pos[1], k.pos[2] - a.pos[2]];
    const dout = [b.pos[0] - k.pos[0], b.pos[1] - k.pos[1], b.pos[2] - k.pos[2]];
    const li = Math.hypot(din[0], din[1], din[2]), lo = Math.hypot(dout[0], dout[1], dout[2]);
    if (li < 0.01 || lo < 0.01) continue;
    const cos = (din[0] * dout[0] + din[1] * dout[1] + din[2] * dout[2]) / (li * lo);
    if (cos < 0.25) continue;
    // average of the two mean speeds, scaled down by how sharply the path turns
    const g = 0.5 * (cos - 0.25) / 0.75;
    k.v = [0, 1, 2].map((j) => g * 0.5 * (din[j] / tin + dout[j] / tout)) as [number, number, number];
  }
}

// ---------------------------------------------------------------------------
// Pose evaluation

export interface HandPose {
  pos: THREE.Vector3;
  quat: THREE.Quaternion;
  shape: Handshape;
  /** Captured elbow swivel and how much of it to use (0 = the rig's own elbow). */
  sw?: number;
  swW?: number;
}

export interface Pose {
  R: HandPose;
  L: HandPose;
  face: FaceState;
}

/** Minimum-jerk position profile (bell-shaped speed, as in human reaching). */
export const minJerk = (u: number) => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * u * (10 + u * (-15 + 6 * u)));
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

function makeHandPose(): HandPose {
  return { pos: new THREE.Vector3(), quat: new THREE.Quaternion(), shape: HANDSHAPES.relaxed, sw: 0, swW: 0 };
}

function setSwivel(a: HandKey, b: HandKey | null, u: number, out: HandPose) {
  const sa = a.sw, sb = b?.sw;
  if (sa == null && sb == null) {
    out.swW = 0;
    return;
  }
  if (sa != null && sb != null) {
    out.sw = sa + angleDiff(sa, sb) * u;
    out.swW = 1;
  } else if (sa != null) {
    out.sw = sa;
    out.swW = 1 - minJerk(u);
  } else {
    out.sw = sb!;
    out.swW = minJerk(u);
  }
}

/** Position of key k at local time dt after its arrival (moves through soft keys at their velocity). */
function heldPos(k: HandKey, dt: number, out: THREE.Vector3) {
  out.set(...k.pos);
  if (k.v) {
    const c = dt - k.hold / 2;
    out.x += k.v[0] * c;
    out.y += k.v[1] * c;
    out.z += k.v[2] * c;
  }
  return out;
}

const _sa = new THREE.Vector3(), _sb = new THREE.Vector3();

/** Pose on the movement from key a to key b at progress u (0..1). */
function sampleSegment(a: HandKey, b: HandKey, u: number, out: HandPose) {
  const T = Math.max(1e-4, b.t - (a.t + a.hold));
  const A = heldPos(a, a.hold, _sa), B = heldPos(b, 0, _sb);
  if (b.lin) {
    // captured motion: cubic Hermite through the samples (Catmull-Rom velocities)
    const u2 = u * u, u3 = u2 * u;
    const h00 = 2 * u3 - 3 * u2 + 1, h10 = u3 - 2 * u2 + u, h01 = -2 * u3 + 3 * u2, h11 = u3 - u2;
    const va = a.v, vb = b.v;
    out.pos.set(
      h00 * A.x + h01 * B.x + T * (h10 * (va?.[0] ?? 0) + h11 * (vb?.[0] ?? 0)),
      h00 * A.y + h01 * B.y + T * (h10 * (va?.[1] ?? 0) + h11 * (vb?.[1] ?? 0)),
      h00 * A.z + h01 * B.z + T * (h10 * (va?.[2] ?? 0) + h11 * (vb?.[2] ?? 0)),
    );
    if (!va && !vb) out.pos.lerpVectors(A, B, u);
    qa.set(...a.quat);
    qb.set(...b.quat);
    out.quat.copy(qa).slerp(qb, u);
    out.shape = lerpHandshape(a.shape, b.shape, u);
    return out;
  }
  const e = minJerk(u);
  // position: quadratic bezier with optional bulge, plus Hermite velocity terms at pass-through keys
  if (b.arc) {
    const cx = (A.x + B.x) / 2 + b.arc[0] * 2, cy = (A.y + B.y) / 2 + b.arc[1] * 2, cz = (A.z + B.z) / 2 + b.arc[2] * 2;
    const m = 1 - e;
    out.pos.set(m * m * A.x + 2 * m * e * cx + e * e * B.x, m * m * A.y + 2 * m * e * cy + e * e * B.y, m * m * A.z + 2 * m * e * cz + e * e * B.z);
  } else out.pos.lerpVectors(A, B, e);
  if (a.v || b.v) {
    const h10 = u * (1 - u) * (1 - u), h11 = u * u * (u - 1);
    if (a.v) out.pos.set(out.pos.x + T * h10 * a.v[0], out.pos.y + T * h10 * a.v[1], out.pos.z + T * h10 * a.v[2]);
    if (b.v) out.pos.set(out.pos.x + T * h11 * b.v[0], out.pos.y + T * h11 * b.v[1], out.pos.z + T * h11 * b.v[2]);
  }
  qa.set(...a.quat);
  qb.set(...b.quat);
  out.quat.copy(qa).slerp(qb, e);
  // handshape changes lead the movement slightly, finger by finger
  out.shape = blendHandshape(a.shape, b.shape, u);
  return out;
}

/** Small damped overshoot after a fast stop: hands have mass. */
function settle(keys: HandKey[], i: number, t: number, out: THREE.Vector3) {
  const k = keys[i];
  if (k.v || k.lin || i === 0) return;
  const tau = t - k.t;
  if (tau < 0 || tau > 0.28) return;
  const a = keys[i - 1];
  const T = k.t - (a.t + a.hold);
  if (T < 0.06) return;
  const dx = k.pos[0] - a.pos[0], dy = k.pos[1] - a.pos[1], dz = k.pos[2] - a.pos[2];
  const d = Math.hypot(dx, dy, dz);
  const speed = d / T;
  if (speed < 0.35) return;
  const amp = Math.min(0.005, 0.0035 * speed) * Math.exp(-tau / 0.07) * Math.sin((tau / 0.2) * Math.PI * 2);
  out.x += (dx / d) * amp;
  out.y += (dy / d) * amp;
  out.z += (dz / d) * amp;
}

/** Physiological micro-motion so a held hand is never frozen solid (~1.5 mm, ~1°). */
function tremor(side: HandSide, t: number, out: HandPose) {
  const ph = side === "R" ? 0 : 2.1;
  const n = (f1: number, f2: number, o: number) => 0.6 * Math.sin(t * f1 + ph + o) + 0.4 * Math.sin(t * f2 + ph * 1.7 + o * 2.3);
  out.pos.x += 0.0012 * n(2.3, 5.9, 0);
  out.pos.y += 0.0015 * n(1.7, 4.3, 1.3);
  out.pos.z += 0.0010 * n(2.9, 6.7, 2.6);
  qt.setFromAxisAngle(axis.set(n(1.3, 3.1, 0.4), n(1.9, 4.7, 1.1), n(1.1, 2.9, 2.2)).normalize(), 0.012 * n(1.6, 3.7, 0.9));
  out.quat.multiply(qt);
}

export function sampleHand(keys: HandKey[], t: number, out: HandPose, side: HandSide = "R"): HandPose {
  const i = findSeg(keys, t);
  const a = keys[i];
  const aEnd = a.t + a.hold;
  if (t <= aEnd || i === keys.length - 1) {
    heldPos(a, Math.max(0, Math.min(a.hold, t - a.t)), out.pos);
    settle(keys, i, t, out.pos);
    out.quat.set(...a.quat);
    out.shape = a.shape;
    setSwivel(a, null, 0, out);
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
        // ease in and out of the circling so it starts and ends at rest
        const th = minJerk(lt) * Math.PI * 2 * ov.circle.turns;
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
  } else {
    const b = keys[i + 1];
    const span = Math.max(1e-4, b.t - aEnd);
    const u = (t - aEnd) / span;
    sampleSegment(a, b, u, out);
    setSwivel(a, b, u, out);
  }
  tremor(side, t, out);
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
  for (const tr of tl.tracks ?? []) {
    const lt = t - tr.start;
    const ks = tr.keys;
    if (lt < -0.1 || lt > ks[ks.length - 1].t + 0.1) continue;
    let i = 0;
    while (i < ks.length - 2 && ks[i + 1].t < lt) i++;
    const a = ks[i], b = ks[Math.min(i + 1, ks.length - 1)];
    const u = b.t > a.t ? Math.max(0, Math.min(1, (lt - a.t) / (b.t - a.t))) : 0;
    const w = Math.min(1, (lt + 0.1) / 0.1, (ks[ks.length - 1].t + 0.1 - lt) / 0.1);
    for (const [k, va] of Object.entries(a.f)) {
      const key = k as keyof FaceState;
      const vb = (b.f[key] as number) ?? (va as number);
      const val = NEUTRAL_FACE[key] + ((va as number) + (vb - (va as number)) * u) * w;
      if (Math.abs(val - NEUTRAL_FACE[key]) > Math.abs(out[key] - NEUTRAL_FACE[key])) out[key] = val;
    }
  }
  return out;
}

export function makePose(): Pose {
  return { R: makeHandPose(), L: makeHandPose(), face: { ...NEUTRAL_FACE } };
}

export function samplePose(tl: Timeline, t: number, out: Pose): Pose {
  sampleHand(tl.R, t, out.R, "R");
  sampleHand(tl.L, t, out.L, "L");
  sampleFace(tl, t, out.face);
  return out;
}

/** Convenience: timeline for a single sign definition (used by previews). */
export function timelineForDef(id: string, def: string): Timeline {
  const s = compileSign(id, def);
  return buildTimeline([{ index: 0, label: id, kind: "sign", sign: s }]);
}

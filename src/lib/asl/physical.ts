import * as THREE from "three";
import { BODY, TORSO_DEPTH, drapeFront, torsoRadius } from "./body";
import { buildHandRig, HAND_DIMS, type HandRig } from "../avatar/handRig";
import type { FaceState, Handshape, HandSide } from "./types";

// Physical plausibility for the signer: a signed-distance model of the body that
// matches the rendered avatar (head + headwear, nose, neck, torso, hijab drape)
// and collision proxies for the hands built from the same finger kinematics the
// renderer uses. Sign definitions place hand points AT body locations; motion
// capture and transitions know nothing about the body. The solver translates each
// hand (orientation and handshape untouched, so the sign keeps its meaning) until
// nothing is inside the body or the other hand: intended contacts end up resting
// on the surface instead of sinking through it.
//
// Everything is in torso space (see types.ts): +Y up, +Z toward the viewer.

export type Headwear = "hijab" | "kufi" | "none";

/** Skin clearance kept between a hand and anything it touches (m). */
const SKIN = 0.003;

// ---------------------------------------------------------------------------
// Body

const PIVOT_Y = BODY.neckBase.y + 0.06; // head pivot (AvatarRig.headPivot)
const HEAD_C = new THREE.Vector3(0, BODY.head.y, BODY.head.z);

export interface BodyModel {
  head: [number, number, number]; // ellipsoid radii incl. headwear
  nose: { c: [number, number, number]; r: number }; // head-local
  neck: { y0: number; y1: number; r: number };
  torsoPad: number;
  drape: boolean;
}

export function bodyModel(headwear: Headwear = "hijab"): BodyModel {
  const { rx, ry, rz } = BODY.head;
  const hijab = headwear === "hijab";
  return {
    // the hijab shell is ~1.07-1.17x the head behind the face opening; the face itself stays bare
    head: hijab ? [rx * 1.1, ry * 1.1, rz * 1.0] : headwear === "kufi" ? [rx * 1.04, ry * 1.06, rz] : [rx * 1.04, ry * 1.04, rz],
    nose: { c: [0, -0.009, rz + 0.001], r: 0.016 },
    neck: { y0: BODY.neckBase.y - 0.03, y1: BODY.head.y - 0.05, r: hijab ? 0.064 : 0.048 },
    torsoPad: hijab ? 0.012 : 0.004,
    drape: hijab,
  };
}

// hijab drape over the shoulders (AvatarRig.buildHead): radius at torso-space height
const DRAPE: [number, number][] = [
  [0.226, 1.321], [0.228, 1.361], [0.226, 1.401], [0.215, 1.431], [0.196, 1.457], [0.168, 1.474], [0.14, 1.488], [0.11, 1.501], [0.085, 1.511],
];
function drapeRadius(y: number) {
  if (y < DRAPE[0][1] || y > DRAPE[DRAPE.length - 1][1]) return 0;
  for (let i = 0; i < DRAPE.length - 1; i++) {
    const [r0, y0] = DRAPE[i], [r1, y1] = DRAPE[i + 1];
    if (y <= y1) return r0 + ((r1 - r0) * (y - y0)) / (y1 - y0);
  }
  return 0;
}

// robe below the hips (radius, height above hips), flattened by 0.7
const ROBE: [number, number][] = [[0.152, 0.0], [0.17, -0.12], [0.19, -0.32]];
function robeRadius(h: number) {
  if (h >= 0) return ROBE[0][0];
  for (let i = 0; i < ROBE.length - 1; i++) {
    const [r0, y0] = ROBE[i], [r1, y1] = ROBE[i + 1];
    if (h >= y1) return r0 + ((r1 - r0) * (h - y0)) / (y1 - y0);
  }
  return ROBE[ROBE.length - 1][0];
}

/** Signed distance of (x, z) to an axis-aligned ellipse with radii a, b centred at the origin; writes the outward normal. */
function sdEllipse(x: number, z: number, a: number, b: number, n: THREE.Vector3) {
  const k0 = Math.hypot(x / a, z / b);
  const gx = x / (a * a), gz = z / (b * b);
  const k1 = Math.hypot(gx, gz);
  if (k1 < 1e-9) {
    n.set(0, 0, 1);
    return -Math.min(a, b);
  }
  n.set(gx / k1, 0, gz / k1);
  return (k0 * (k0 - 1)) / k1;
}

function sdEllipsoid(x: number, y: number, z: number, r: [number, number, number], n: THREE.Vector3) {
  const k0 = Math.hypot(x / r[0], y / r[1], z / r[2]);
  const gx = x / (r[0] * r[0]), gy = y / (r[1] * r[1]), gz = z / (r[2] * r[2]);
  const k1 = Math.hypot(gx, gy, gz);
  if (k1 < 1e-9) {
    n.set(0, 0, 1);
    return -Math.min(...r);
  }
  n.set(gx / k1, gy / k1, gz / k1);
  return (k0 * (k0 - 1)) / k1;
}

/** Head orientation for a face state (matches AvatarRig.apply, without the tiny idle sway). */
export function headQuat(f: Pick<FaceState, "headPitch" | "headYaw" | "headRoll"> | null, out = new THREE.Quaternion()) {
  if (!f) return out.identity();
  return out.setFromEuler(_e.set(f.headPitch, f.headYaw, f.headRoll));
}
const _e = new THREE.Euler();

const _hp = new THREE.Vector3(), _hn = new THREE.Vector3(), _hn2 = new THREE.Vector3(), _iq = new THREE.Quaternion();

/**
 * Signed distance from a torso-space point to the body surface (negative inside).
 * Writes the outward surface normal (torso space) to `n`.
 */
export function bodySDF(p: THREE.Vector3, m: BodyModel, headQ: THREE.Quaternion | null, n: THREE.Vector3): number {
  let best = Infinity;
  // head (rotates about the neck pivot)
  _hp.set(p.x, p.y - PIVOT_Y, p.z);
  if (headQ) _hp.applyQuaternion(_iq.copy(headQ).invert());
  _hp.y += PIVOT_Y - HEAD_C.y;
  _hp.z -= HEAD_C.z;
  if (Math.abs(_hp.y) < 0.25 && Math.abs(_hp.x) < 0.25 && Math.abs(_hp.z) < 0.3) {
    let d = sdEllipsoid(_hp.x, _hp.y, _hp.z, m.head, _hn);
    const nc = m.nose.c;
    const dn = Math.hypot(_hp.x - nc[0], _hp.y - nc[1], _hp.z - nc[2]) - m.nose.r;
    if (dn < d) {
      d = dn;
      _hn.set(_hp.x - nc[0], _hp.y - nc[1], _hp.z - nc[2]).normalize();
    }
    if (d < best) {
      best = d;
      n.copy(_hn);
      if (headQ) n.applyQuaternion(headQ);
    }
  }
  // neck: vertical capsule
  {
    const y = Math.max(m.neck.y0, Math.min(m.neck.y1, p.y));
    const dx = p.x, dy = p.y - y, dz = (p.z - 0.004) / 0.92;
    const l = Math.hypot(dx, dy, dz);
    const d = l - m.neck.r;
    if (d < best) {
      best = d;
      if (l > 1e-6) n.set(dx / l, dy / l, dz / l);
      else n.set(0, 0, 1);
    }
  }
  // torso lathe (and the robe below the hips)
  const h = p.y - BODY.hipY;
  if (h > -0.4 && h < 0.49) {
    const r = h < 0 ? robeRadius(h) : torsoRadius(h);
    if (r > 0.01) {
      const pad = m.torsoPad;
      const d = sdEllipse(p.x, p.z, r + pad, (h < 0 ? r * 0.7 : r * TORSO_DEPTH) + pad, _hn2);
      if (d < best) {
        best = d;
        n.copy(_hn2);
      }
    }
  }
  // hijab drape: a cape over the shoulders, standing proud of the upper chest
  if (m.drape) {
    const a = drapeRadius(p.y);
    if (a > 0) {
      const b = Math.min(a * 0.7, drapeFront(h) + 0.008); // local z (mesh sits 6 mm back)
      const d = sdEllipse(p.x, p.z + 0.006, a, b, _hn2);
      if (d < best) {
        best = d;
        n.copy(_hn2);
      }
    }
  }
  return best;
}

// ---------------------------------------------------------------------------
// Hands

/** Collision proxies of one posed hand: spheres (body contact) and capsules (hand-hand contact). */
export interface HandProxy {
  /** local sphere centres (hand space) and radii */
  pts: THREE.Vector3[];
  rad: number[];
  /** capsule end indices into pts, radius */
  caps: [number, number, number][];
}

const probes: Partial<Record<HandSide, HandRig>> = {};
const probe = (s: HandSide) => (probes[s] ??= buildHandRig(s));
const _wp = new THREE.Vector3(), _inv = new THREE.Matrix4();

/** Build hand-space collision proxies for a handshape (cheap: one FK pass). */
export function handProxy(side: HandSide, shape: Handshape, out?: HandProxy): HandProxy {
  const rig = probe(side);
  rig.setShape(shape);
  rig.root.updateMatrixWorld(true);
  _inv.copy(rig.root.matrixWorld).invert();
  const o = out ?? { pts: [], rad: [], caps: [] };
  let n = 0;
  const add = (v: THREE.Vector3 | null, x: number, y: number, z: number, r: number) => {
    const p = (o.pts[n] ??= new THREE.Vector3());
    if (v) p.copy(v);
    else p.set(x, y, z);
    o.rad[n] = r;
    return n++;
  };
  const world = (obj: THREE.Object3D) => obj.getWorldPosition(_wp).applyMatrix4(_inv);
  const s = side === "R" ? 1 : -1;
  const D = HAND_DIMS;
  const pr = D.palmThick / 2;
  const wrist = add(null, 0, 0.006, 0, 0.021);
  const palmC = add(null, 0, D.palmLen * 0.5, 0, pr + 0.002);
  const palmR = add(null, s * 0.026, D.palmLen * 0.45, 0, pr);
  const palmU = add(null, -s * 0.026, D.palmLen * 0.45, 0, pr);
  const caps: [number, number, number][] = [];
  const mcps: number[] = [];
  const fingers = ["i", "m", "r", "p"] as const;
  rig.joints.forEach((j, k) => {
    const thumb = k === 4;
    const r = thumb ? D.thumb.r : D.fingers[fingers[k]].r;
    const a = add(world(j.mcp), 0, 0, 0, thumb ? r * 1.1 : pr);
    const b = add(world(j.pip), 0, 0, 0, r);
    const c = add(world(j.dip), 0, 0, 0, r * 0.95);
    const d = add(world(j.tip), 0, 0, 0, r * 0.85);
    // midpoint so the long proximal segment cannot slip through a surface
    add(null, (o.pts[a].x + o.pts[b].x) / 2, (o.pts[a].y + o.pts[b].y) / 2, (o.pts[a].z + o.pts[b].z) / 2, r);
    caps.push([a, b, r], [b, c, r * 0.95], [c, d, r * 0.85]);
    if (!thumb) mcps.push(a);
  });
  caps.push([wrist, mcps[0], pr], [wrist, mcps[3], pr], [mcps[0], mcps[3], pr], [palmC, mcps[1], pr], [palmR, palmU, pr]);
  o.pts.length = n;
  o.rad.length = n;
  o.caps = caps;
  return o;
}

// ---------------------------------------------------------------------------
// Solver

export interface SolveHand {
  pos: THREE.Vector3;
  quat: THREE.Quaternion;
  shape: Handshape;
}

const _p = new THREE.Vector3(), _n = new THREE.Vector3(), _best = new THREE.Vector3();
const proxies: Record<HandSide, HandProxy> = { R: { pts: [], rad: [], caps: [] }, L: { pts: [], rad: [], caps: [] } };
const worldPts: Record<HandSide, THREE.Vector3[]> = { R: [], L: [] };

function toWorld(side: HandSide, h: SolveHand) {
  const pr = proxies[side];
  const w = worldPts[side];
  for (let i = 0; i < pr.pts.length; i++) (w[i] ??= new THREE.Vector3()).copy(pr.pts[i]).applyQuaternion(h.quat).add(h.pos);
  w.length = pr.pts.length;
}

/** Push one hand out of the body. Returns the total correction applied (m). */
function pushOutOfBody(side: HandSide, h: SolveHand, m: BodyModel, headQ: THREE.Quaternion | null): number {
  const pr = proxies[side];
  let moved = 0;
  for (let iter = 0; iter < 4; iter++) {
    let worst = 0;
    for (let i = 0; i < pr.pts.length; i++) {
      _p.copy(pr.pts[i]).applyQuaternion(h.quat).add(h.pos);
      const d = bodySDF(_p, m, headQ, _n);
      const pen = pr.rad[i] + SKIN - d;
      if (pen > worst) {
        worst = pen;
        _best.copy(_n);
      }
    }
    if (worst < 1e-4) break;
    h.pos.addScaledVector(_best, worst);
    moved += worst;
  }
  return moved;
}

// closest points between segments p1-q1 and p2-q2
const _d1 = new THREE.Vector3(), _d2 = new THREE.Vector3(), _r = new THREE.Vector3();
const _c1 = new THREE.Vector3(), _c2 = new THREE.Vector3();
function segSeg(p1: THREE.Vector3, q1: THREE.Vector3, p2: THREE.Vector3, q2: THREE.Vector3) {
  _d1.subVectors(q1, p1);
  _d2.subVectors(q2, p2);
  _r.subVectors(p1, p2);
  const a = _d1.dot(_d1), e = _d2.dot(_d2), f = _d2.dot(_r);
  let s = 0, t = 0;
  if (a <= 1e-9 && e <= 1e-9) {
    s = t = 0;
  } else if (a <= 1e-9) {
    t = Math.min(1, Math.max(0, f / e));
  } else {
    const c = _d1.dot(_r);
    if (e <= 1e-9) {
      s = Math.min(1, Math.max(0, -c / a));
    } else {
      const b = _d1.dot(_d2), den = a * e - b * b;
      s = den > 1e-9 ? Math.min(1, Math.max(0, (b * f - c * e) / den)) : 0;
      t = (b * s + f) / e;
      if (t < 0) {
        t = 0;
        s = Math.min(1, Math.max(0, -c / a));
      } else if (t > 1) {
        t = 1;
        s = Math.min(1, Math.max(0, (b - c) / a));
      }
    }
  }
  _c1.copy(p1).addScaledVector(_d1, s);
  _c2.copy(p2).addScaledVector(_d2, t);
  return _c1.distanceTo(_c2);
}

const _sep = new THREE.Vector3(), _acc = new THREE.Vector3(), _rel = new THREE.Vector3();
const _A = new THREE.Matrix3(), _Ai = new THREE.Matrix3(), _sat = new THREE.Vector3();
/**
 * Separate the two hands. wR is the share of the correction taken by the right hand.
 *
 * Least squares over every overlapping capsule pair at once: find the relative offset
 * Δ minimising Σ w_i (pen_i − n_i·Δ)² (Gauss-Newton, a few passes). Unlike pushing along
 * the deepest pair (which hops between fingers from frame to frame) or along the mean
 * normal (which makes interlocked fingers worse), this finds the one offset that best
 * satisfies all contacts, and it varies continuously with the pose: pairs fade in with
 * their penetration, so hands that touch settle smoothly.
 *
 * depthOnly (0..1) restricts the offset toward pure depth for captured motion: x/y come
 * from the video and are reliable, depth is what monocular capture gets wrong. hint keeps
 * which hand is in front stable while they stay in contact.
 */
function separateHands(R: SolveHand, L: SolveHand, wR: number, hint?: THREE.Vector3, depthOnly = 0, satBlend = false): number {
  let moved = 0;
  for (let iter = 0; iter < 6; iter++) {
    toWorld("R", R);
    toWorld("L", L);
    const a = worldPts.R, b = worldPts.L;
    if (a[1].distanceTo(b[1]) > 0.3) break; // broad phase: palms far apart
    const e = _A.elements;
    e.fill(0);
    _acc.set(0, 0, 0);
    let worst = 0, wz = 0, bz = 0;
    for (const [i0, i1, ra] of proxies.R.caps) {
      for (const [j0, j1, rb] of proxies.L.caps) {
        const d = segSeg(a[i0], a[i1], b[j0], b[j1]);
        const pen = ra + rb + SKIN - d;
        if (pen <= 0) continue;
        if (d > 1e-5) _sep.subVectors(_c1, _c2).divideScalar(d);
        else _sep.subVectors(a[1], b[1]).normalize();
        const w = Math.min(1, pen / 0.004); // fade in: continuous as contacts begin
        const nx = _sep.x, ny = _sep.y, nz = _sep.z;
        e[0] += w * nx * nx; e[3] += w * nx * ny; e[6] += w * nx * nz;
        e[4] += w * ny * ny; e[7] += w * ny * nz; e[8] += w * nz * nz;
        _acc.x += w * pen * nx; _acc.y += w * pen * ny; _acc.z += w * pen * nz;
        wz += w * nz * nz;
        bz += w * pen * nz;
        worst = Math.max(worst, pen);
      }
    }
    if (worst < 5e-4) {
      if (iter === 0) hint?.set(0, 0, 0); // apart again: forget which side was which
      break;
    }
    e[1] = e[3]; e[2] = e[6]; e[5] = e[7];
    const lam = 0.05 * (e[0] + e[4] + e[8]) + 1e-6; // damping keeps degenerate contacts (all normals alike) well posed
    e[0] += lam; e[4] += lam; e[8] += lam;
    _Ai.copy(_A).invert();
    _sep.copy(_acc).applyMatrix3(_Ai); // Δ: move R by +Δ·wR, L by −Δ·(1−wR)
    if (depthOnly > 0) {
      // the depth-only solution, signed so the hand already in front stays in front
      let dz = bz / (wz + 1e-6);
      const front = hint && hint.lengthSq() > 0.5 ? Math.sign(hint.z) : Math.sign(a[1].z - b[1].z) || 1;
      if (Math.sign(dz) !== front) dz = front * Math.max(Math.abs(dz), worst);
      _sep.lerp(_rel.set(0, 0, dz), depthOnly);
    }
    if (satBlend && depthOnly < 0.99) {
      // Deep interpenetration (fingers through a palm) makes contact normals cancel and
      // least squares stalls. Blend in the best separating axis, continuously, by how much
      // it stalls and how deep the overlap is.
      const ratio = _sep.length() / worst;
      const k = Math.min(1, Math.max(0, (0.55 - ratio) / 0.35)) * Math.min(1, Math.max(0, (worst - 0.004) / 0.008)) * (1 - depthOnly);
      if (k > 0) {
        satAxis(a, b, hint, _sat);
        _sep.lerp(_sat, k);
      }
    }
    if (iter === 0 && hint) hint.copy(_sep).normalize();
    // never move more than the deepest overlap (plus a little) in one pass
    const len = _sep.length();
    if (len > worst * 1.5) _sep.multiplyScalar((worst * 1.5) / len);
    R.pos.addScaledVector(_sep, 0.9 * wR);
    L.pos.addScaledVector(_sep, -0.9 * (1 - wR));
    moved += _sep.length() * 0.9;
  }
  return moved;
}

const AX_CAND = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1), new THREE.Vector3(1, 0, 0), new THREE.Vector3()];
const _u = new THREE.Vector3();
/**
 * Minimum translation that separates the two hands' proxy spheres along one of a few
 * candidate axes (separating-axis test): both palm normals, the line between the palms,
 * the world axes, and the previous frame's direction (hysteresis). Writes the relative
 * offset for the right hand to `out`.
 */
function satAxis(a: THREE.Vector3[], b: THREE.Vector3[], hint: THREE.Vector3 | undefined, out: THREE.Vector3) {
  const pr = proxies.R, pl = proxies.L;
  // palm normals: palm centre minus the back of the hand is close enough (hand-space +Z)
  AX_CAND[0].subVectors(a[1], a[0]).cross(_u.subVectors(a[2], a[3])).normalize();
  AX_CAND[1].subVectors(b[1], b[0]).cross(_u.subVectors(b[2], b[3])).normalize();
  AX_CAND[2].subVectors(a[1], b[1]).normalize();
  const nc = hint && hint.lengthSq() > 0.5 ? 7 : 6;
  if (nc === 7) AX_CAND[6].copy(hint!);
  let best = Infinity, bestHint = Infinity;
  for (let k = 0; k < nc; k++) {
    const u = AX_CAND[k];
    if (u.lengthSq() < 0.5) continue;
    let rMin = Infinity, rMax = -Infinity, lMin = Infinity, lMax = -Infinity;
    for (let i = 0; i < a.length; i++) {
      const p = a[i].dot(u);
      rMin = Math.min(rMin, p - pr.rad[i]);
      rMax = Math.max(rMax, p + pr.rad[i]);
    }
    for (let j = 0; j < b.length; j++) {
      const p = b[j].dot(u);
      lMin = Math.min(lMin, p - pl.rad[j]);
      lMax = Math.max(lMax, p + pl.rad[j]);
    }
    // move R to the +u side of L, or to the -u side
    const plus = lMax - rMin + SKIN, minus = rMax - lMin + SKIN;
    const need = Math.min(plus, minus);
    const sign = plus <= minus ? 1 : -1;
    if (k === 6) bestHint = plus; // the hinted direction keeps its side
    if (need < best) {
      best = need;
      out.copy(u).multiplyScalar(sign * need);
    }
  }
  // prefer the previous direction unless another axis is clearly cheaper
  if (nc === 7 && bestHint < best * 1.3) out.copy(AX_CAND[6]).multiplyScalar(bestHint);
  if (out.length() > 0.05) out.setLength(0.05);
}

export interface SolveResult {
  body: number;
  hands: number;
}

/**
 * Resolve both hands against the body and each other, in place. Call once per
 * rendered frame after sampling a pose (positions are wrist positions in torso space).
 */
export function solveHands(R: SolveHand, L: SolveHand, m: BodyModel, face: Pick<FaceState, "headPitch" | "headYaw" | "headRoll"> | null, opts: { hands?: boolean; wR?: number; hint?: THREE.Vector3; depthOnly?: number } = {}): SolveResult {
  const headQ = face && (face.headPitch || face.headYaw || face.headRoll) ? headQuat(face, _hq) : null;
  handProxy("R", R.shape, proxies.R);
  handProxy("L", L.shape, proxies.L);
  let body = pushOutOfBody("R", R, m, headQ) + pushOutOfBody("L", L, m, headQ);
  let hands = 0;
  if (opts.hands !== false) {
    // alternate the two constraints: pushing a hand out of the body can push it back into the other hand
    for (let round = 0; round < 3; round++) {
      const h = separateHands(R, L, opts.wR ?? 0.5, round === 0 ? opts.hint : undefined, opts.depthOnly ?? 0);
      hands += h;
      if (h < 1e-4) break;
      const b = pushOutOfBody("R", R, m, headQ) + pushOutOfBody("L", L, m, headQ);
      body += b;
      if (b < 1e-4) break;
    }
  }
  return { body, hands };
}
const _hq = new THREE.Quaternion();

/**
 * Compile-time hand-hand fit for one key: move the hands apart (wR = share taken by the
 * right hand) until they only touch. Signs that rest one hand on the other, cross fingers
 * or stack the hands are written with both hands at the same place; settling that once
 * here keeps the runtime solver from fighting it every frame.
 */
export function separateStatic(R: SolveHand, L: SolveHand, wR: number): number {
  handProxy("R", R.shape, proxies.R);
  handProxy("L", L.shape, proxies.L);
  let moved = 0;
  for (let i = 0; i < 4; i++) {
    const m = separateHands(R, L, wR, undefined, 0, true);
    moved += m;
    if (m < 1e-4) break;
  }
  return moved;
}

/** Deepest penetration of a posed hand into the body (positive = inside), for audits and path planning. */
export function handPenetration(side: HandSide, h: SolveHand, m: BodyModel, headQ: THREE.Quaternion | null = null): number {
  handProxy(side, h.shape, proxies[side]);
  const pr = proxies[side];
  let worst = -Infinity;
  for (let i = 0; i < pr.pts.length; i++) {
    _p.copy(pr.pts[i]).applyQuaternion(h.quat).add(h.pos);
    worst = Math.max(worst, pr.rad[i] - bodySDF(_p, m, headQ, _n));
  }
  return worst;
}

/** Deepest overlap between the two hands (positive = interpenetrating). */
export function handsOverlap(R: SolveHand, L: SolveHand): number {
  handProxy("R", R.shape, proxies.R);
  handProxy("L", L.shape, proxies.L);
  toWorld("R", R);
  toWorld("L", L);
  const a = worldPts.R, b = worldPts.L;
  if (a[1].distanceTo(b[1]) > 0.3) return -1;
  let worst = -Infinity;
  for (const [i0, i1, ra] of proxies.R.caps) for (const [j0, j1, rb] of proxies.L.caps) worst = Math.max(worst, ra + rb - segSeg(a[i0], a[i1], b[j0], b[j1]));
  return worst;
}

// ---------------------------------------------------------------------------
// Contact fitting (compile time)

const FIT_BODY = bodyModel("hijab");
const AXES = [
  [1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1],
  [1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0], [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1], [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1],
].map((a) => new THREE.Vector3(...a).normalize());
const _fq = new THREE.Quaternion(), _rq = new THREE.Quaternion(), _fpos = new THREE.Vector3();

/** Penetration of a posed hand, ignoring proxies within `skip` of the contact point. */
function contactPen(side: HandSide, q: THREE.Quaternion, pos: THREE.Vector3, contact: THREE.Vector3, skip: number, m: BodyModel) {
  const pr = proxies[side];
  let worst = -Infinity;
  for (let i = 0; i < pr.pts.length; i++) {
    _p.copy(pr.pts[i]).applyQuaternion(q).add(pos);
    if (_p.distanceTo(contact) < skip) continue;
    worst = Math.max(worst, pr.rad[i] - bodySDF(_p, m, null, _n));
  }
  return worst;
}

/**
 * A key that touches the body (fingertip on the chin, thumb on the temple...)
 * must keep that contact, but the rest of the hand may not sink into the face,
 * neck or chest. Find the smallest rotation of the hand ABOUT ITS CONTACT POINT
 * that clears the body, as a signer tilts the wrist. Returns the corrected
 * orientation and wrist position (unchanged when nothing collides).
 *
 * point: hand-space position of the contact point; target: where it touches.
 */
/** Move a contact target that lies inside the (clothed) body onto its surface. */
export function surfaceTarget(target: THREE.Vector3): THREE.Vector3 {
  for (let i = 0; i < 3; i++) {
    const d = bodySDF(target, FIT_BODY, null, _n);
    if (d >= 0) break;
    target.addScaledVector(_n, -d + 0.001);
  }
  return target;
}

export function fitContact(side: HandSide, shape: Handshape, quat: THREE.Quaternion, point: THREE.Vector3, target: THREE.Vector3, maxDeg = 55): { quat: THREE.Quaternion; pos: THREE.Vector3; pen: number; deg: number } {
  handProxy(side, shape, proxies[side]);
  const posFor = (q: THREE.Quaternion, out: THREE.Vector3) => out.copy(point).applyQuaternion(q).negate().add(target);
  const skip = 0.028;
  const pen0 = contactPen(side, quat, posFor(quat, _fpos), target, skip, FIT_BODY);
  if (pen0 <= 0.003) return { quat: quat.clone(), pos: posFor(quat, new THREE.Vector3()), pen: pen0, deg: 0 };
  // smallest angle that clears wins (least penetration among ties); otherwise the least-bad pose overall
  let best = { pen: pen0, q: quat.clone(), deg: 0 };
  for (let deg = 5; deg <= maxDeg; deg += 5) {
    let clear: typeof best | null = null;
    for (const ax of AXES) {
      _rq.setFromAxisAngle(ax, (deg * Math.PI) / 180);
      _fq.copy(_rq).multiply(quat);
      const pen = contactPen(side, _fq, posFor(_fq, _fpos), target, skip, FIT_BODY);
      if (pen <= 0.003 && (!clear || pen < clear.pen)) clear = { pen, q: _fq.clone(), deg };
      if (pen < best.pen - 0.002) best = { pen, q: _fq.clone(), deg };
    }
    if (clear) {
      best = clear;
      break;
    }
  }
  return { quat: best.q, pos: posFor(best.q, new THREE.Vector3()), pen: best.pen, deg: best.deg };
}

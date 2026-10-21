import type { HandSide } from "./types";

/** Avatar skeleton dimensions (metres, torso space). Shared by renderer and solver. */
export const BODY = {
  hipY: 0.98,
  shoulder: { x: 0.172, y: 1.425, z: -0.012 },
  upperArm: 0.285,
  forearm: 0.258,
  neckBase: { y: 1.465 },
  head: { y: 1.615, z: 0.012, rx: 0.081, ry: 0.107, rz: 0.095 },
};

/** Torso lathe profile: (radius, height above the hips). The mesh and the collision model share it. */
export const TORSO_PROFILE: [number, number][] = [
  [0.0, -0.03], [0.15, -0.03], [0.162, 0.04], [0.156, 0.12], [0.15, 0.2], [0.157, 0.28], [0.168, 0.34], [0.177, 0.39],
  [0.178, 0.425], [0.162, 0.455], [0.125, 0.474], [0.075, 0.484], [0.0, 0.488],
];
/** Front-to-back flattening of the torso lathe. */
export const TORSO_DEPTH = 0.62;

/** Torso lathe radius at height h above the hips (0 above the shoulders). */
export function torsoRadius(h: number) {
  const P = TORSO_PROFILE;
  if (h <= P[1][1]) return P[1][0];
  for (let i = 1; i < P.length - 1; i++) {
    const [r0, y0] = P[i], [r1, y1] = P[i + 1];
    if (h <= y1) return r0 + ((r1 - r0) * (h - y0)) / (y1 - y0);
  }
  return 0;
}

/** Front of the hijab drape (z) at height h above the hips: it lies on the chest and wraps the neck. */
export function drapeFront(h: number) {
  return Math.max(torsoRadius(h) * TORSO_DEPTH + 0.01, 0.066);
}

/**
 * Named body / signing-space locations. x is measured OUTWARD from the midline
 * toward the hand's own side (ipsilateral), so a single entry works for either
 * hand. Prefix a location with ^ to use the opposite (contralateral) side.
 */
export const LOCATIONS: Record<string, [number, number, number]> = {
  // head & face
  aboveHead: [0.04, 1.87, 0.1],
  headTop: [0, 1.76, 0.03],
  forehead: [0, 1.69, 0.102],
  temple: [0.066, 1.67, 0.06],
  eye: [0.032, 1.638, 0.1],
  eyes: [0, 1.638, 0.108],
  nose: [0, 1.607, 0.118],
  ear: [0.088, 1.62, 0.0],
  cheek: [0.054, 1.592, 0.086],
  mouth: [0, 1.57, 0.104],
  lips: [0, 1.57, 0.104],
  chin: [0, 1.532, 0.09],
  jaw: [0.052, 1.548, 0.058],
  face: [0, 1.61, 0.2], // in front of the face
  // neck & trunk
  neck: [0, 1.47, 0.062],
  shoulder: [0.158, 1.418, 0.05],
  chest: [0, 1.318, 0.116],
  chestHigh: [0, 1.39, 0.1],
  chestSide: [0.085, 1.32, 0.11],
  heart: [-0.062, 1.312, 0.116],
  stomach: [0, 1.13, 0.124],
  waist: [0, 1.03, 0.12],
  hip: [0.14, 1.0, 0.06],
  // signing space
  neutral: [0.03, 1.235, 0.33],
  near: [0.03, 1.25, 0.22],
  far: [0.03, 1.27, 0.46],
  high: [0.05, 1.46, 0.33],
  low: [0.03, 1.1, 0.3],
  side: [0.26, 1.25, 0.26],
  up: [0.08, 1.9, 0.26],
  fs: [0.115, 1.355, 0.28], // fingerspelling space
  rest: [0.07, 1.0, 0.17],
  ready: [0.08, 1.12, 0.22],
  // referential loci for pronouns / agreement (a = dominant side, b = other side)
  a: [0.27, 1.27, 0.42],
  b: [-0.24, 1.27, 0.42],
  c: [0.01, 1.3, 0.52],
  d: [0.33, 1.35, 0.28],
  e: [-0.3, 1.35, 0.28],
  sky: [0.12, 1.95, 0.35],
  ground: [0.04, 0.95, 0.38],
};

export type DirCode = string;

const DIR_BASE: Record<string, [number, number, number]> = {
  U: [0, 1, 0],
  D: [0, -1, 0],
  F: [0, 0, 1],
  B: [0, 0, -1],
  I: [1, 0, 0], // inward (toward the midline) in "out" units → negated below
  O: [-1, 0, 0],
};

/** +1 when "outward" for this hand points along world +X. */
export const outSign = (side: HandSide) => (side === "R" ? -1 : 1);

/** Resolve a direction code like "FU" or "I" to a unit vector for a hand. */
export function dirVec(code: string, side: HandSide): [number, number, number] {
  let x = 0, y = 0, z = 0;
  for (const ch of code.toUpperCase()) {
    const d = DIR_BASE[ch];
    if (!d) throw new Error(`Bad direction "${code}"`);
    x += d[0]; y += d[1]; z += d[2];
  }
  // DIR_BASE x is in "inward" units: I = +1 means toward midline = -outSign.
  const wx = -x * outSign(side);
  const n = Math.hypot(wx, y, z) || 1;
  return [wx / n, y / n, z / n];
}

/** Resolve a named location (with optional ^ contralateral prefix) for a hand. */
export function locVec(name: string, side: HandSide): [number, number, number] {
  let contra = false;
  if (name.startsWith("^")) { contra = true; name = name.slice(1); }
  const l = LOCATIONS[name];
  if (!l) throw new Error(`Unknown location "${name}"`);
  const out = contra ? -l[0] : l[0];
  return [out * outSign(side), l[1], l[2]];
}

/** Parse an offset string like "f5u2o3" (centimetres) into a torso-space vector. */
export function offsetVec(spec: string, side: HandSide): [number, number, number] {
  const re = /([fbudio])(-?\d+(?:\.\d+)?)/gi;
  let m: RegExpExecArray | null;
  const v: [number, number, number] = [0, 0, 0];
  while ((m = re.exec(spec))) {
    const d = dirVec(m[1].toUpperCase(), side);
    const k = parseFloat(m[2]) / 100;
    v[0] += d[0] * k; v[1] += d[1] * k; v[2] += d[2] * k;
  }
  return v;
}

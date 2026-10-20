import * as THREE from "three";
import { buildHandRig } from "../avatar/handRig";
import type { Handshape } from "../asl/types";

// MediaPipe hand landmark indices
export const FINGERS = {
  thumb: [1, 2, 3, 4],
  index: [5, 6, 7, 8],
  middle: [9, 10, 11, 12],
  ring: [13, 14, 15, 16],
  pinky: [17, 18, 19, 20],
} as const;
export type FingerName = keyof typeof FINGERS;
export const FINGER_NAMES = Object.keys(FINGERS) as FingerName[];

type P = [number, number, number];
const sub = (a: P, b: P): P => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a: P, b: P) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const len = (a: P) => Math.hypot(a[0], a[1], a[2]);
const cross = (a: P, b: P): P => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
/** θ = arccos(u·v / |u||v|), in degrees */
export const angle = (u: P, v: P) => (Math.acos(Math.max(-1, Math.min(1, dot(u, v) / (len(u) * len(v) || 1)))) * 180) / Math.PI;

export interface HandFeatures {
  /** per finger: [proximal flex, middle flex, distal flex] in degrees */
  flex: Record<FingerName, [number, number, number]>;
  /** thumb opposition: angle between thumb metacarpal and index metacarpal */
  thumbAbd: number;
  /** spread between index–middle, middle–ring, ring–pinky */
  spread: [number, number, number];
  /** unit palm normal (in the landmark coordinate frame) */
  palm: P;
  /** unit finger direction (wrist → middle MCP) */
  fingerDir: P;
}

/** Invariant hand features from 21 landmarks (world or image coordinates). */
export function handFeatures(lm: P[], isRight: boolean): HandFeatures {
  const flex = {} as HandFeatures["flex"];
  for (const f of FINGER_NAMES) {
    const [a, b, c, d] = FINGERS[f];
    const base = f === "thumb" ? lm[0] : lm[0];
    const seg0 = sub(lm[a], base), seg1 = sub(lm[b], lm[a]), seg2 = sub(lm[c], lm[b]), seg3 = sub(lm[d], lm[c]);
    flex[f] = f === "thumb" ? [angle(seg1, seg2) * 0.5, angle(seg1, seg2), angle(seg2, seg3)] : [angle(seg0, seg1), angle(seg1, seg2), angle(seg2, seg3)];
  }
  const thumbAbd = angle(sub(lm[2], lm[1]), sub(lm[5], lm[0]));
  const dir = (i: number, j: number) => sub(lm[j], lm[i]);
  const spread: [number, number, number] = [angle(dir(5, 6), dir(9, 10)), angle(dir(9, 10), dir(13, 14)), angle(dir(13, 14), dir(17, 18))];
  let n = cross(sub(lm[5], lm[0]), sub(lm[17], lm[0]));
  if (!isRight) n = [-n[0], -n[1], -n[2]];
  const nl = len(n) || 1;
  const fd = sub(lm[9], lm[0]);
  const fl = len(fd) || 1;
  return { flex, thumbAbd, spread, palm: [n[0] / nl, n[1] / nl, n[2] / nl], fingerDir: [fd[0] / fl, fd[1] / fl, fd[2] / fl] };
}

/** Landmarks of the avatar's own hand model for a handshape (hand-local frame). */
export function rigLandmarks(shape: Handshape, side: "R" | "L" = "R"): P[] {
  const rig = buildHandRig(side);
  rig.setShape(shape);
  rig.root.updateMatrixWorld(true);
  const v = new THREE.Vector3();
  const pos = (o: THREE.Object3D): P => {
    o.getWorldPosition(v);
    return [v.x, v.y, v.z];
  };
  const [i, m, r, p, t] = rig.joints;
  const lm: P[] = new Array(21);
  lm[0] = [0, 0, 0];
  lm[1] = pos(t.mcp); lm[2] = pos(t.pip); lm[3] = pos(t.dip); lm[4] = pos(t.tip);
  [i, m, r, p].forEach((f, k) => {
    const b = 5 + k * 4;
    lm[b] = pos(f.mcp); lm[b + 1] = pos(f.pip); lm[b + 2] = pos(f.dip); lm[b + 3] = pos(f.tip);
  });
  return lm;
}

export interface FingerScore { finger: FingerName; diff: number; ok: "good" | "close" | "off" }

/** Compare user features with a reference: per-finger mean absolute flex difference. */
export function compareHands(user: HandFeatures, ref: HandFeatures): { fingers: FingerScore[]; score: number } {
  const fingers = FINGER_NAMES.map((f) => {
    const w = f === "thumb" ? [0, 1, 1] : [1, 1, 0.6];
    const d = (Math.abs(user.flex[f][0] - ref.flex[f][0]) * w[0] + Math.abs(user.flex[f][1] - ref.flex[f][1]) * w[1] + Math.abs(user.flex[f][2] - ref.flex[f][2]) * w[2]) / (w[0] + w[1] + w[2]);
    const thumbExtra = f === "thumb" ? Math.abs(user.thumbAbd - ref.thumbAbd) * 0.5 : 0;
    const diff = d + thumbExtra;
    return { finger: f, diff, ok: (diff < 22 ? "good" : diff < 38 ? "close" : "off") as FingerScore["ok"] };
  });
  const mean = fingers.reduce((s, f) => s + f.diff, 0) / fingers.length;
  return { fingers, score: Math.max(0, Math.min(100, Math.round(100 - (mean - 8) * 1.6))) };
}

/** Dynamic Time Warping distance between two 2-D paths (each normalised first). */
export function dtw(a: [number, number][], b: [number, number][]): number {
  const na = normalisePath(a), nb = normalisePath(b);
  const n = na.length, m = nb.length;
  if (!n || !m) return Infinity;
  const D = new Float64Array((n + 1) * (m + 1)).fill(Infinity);
  D[0] = 0;
  for (let i = 1; i <= n; i++)
    for (let j = 1; j <= m; j++) {
      const c = Math.hypot(na[i - 1][0] - nb[j - 1][0], na[i - 1][1] - nb[j - 1][1]);
      D[i * (m + 1) + j] = c + Math.min(D[(i - 1) * (m + 1) + j], D[i * (m + 1) + j - 1], D[(i - 1) * (m + 1) + j - 1]);
    }
  return D[n * (m + 1) + m] / (n + m);
}

function normalisePath(p: [number, number][]): [number, number][] {
  if (p.length < 2) return p;
  const cx = p.reduce((s, q) => s + q[0], 0) / p.length;
  const cy = p.reduce((s, q) => s + q[1], 0) / p.length;
  const sc = Math.sqrt(p.reduce((s, q) => s + (q[0] - cx) ** 2 + (q[1] - cy) ** 2, 0) / p.length) || 1;
  return p.map((q) => [(q[0] - cx) / Math.max(sc, 0.02), (q[1] - cy) / Math.max(sc, 0.02)]);
}

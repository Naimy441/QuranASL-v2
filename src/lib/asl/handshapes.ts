import type { FingerPose, Handshape, ThumbPose } from "./types";

// Finger configurations: [MCP, PIP, DIP, spread]
const EXT: FingerPose = [0, 0, 0, 0]; // straight
const EXS: FingerPose = [0, 0, 0, 10]; // straight + spread
const FIST: FingerPose = [92, 100, 65, 0]; // fully curled into palm
const BENT: FingerPose = [85, 0, 0, 0]; // bent at the knuckle only
const CURV: FingerPose = [30, 45, 30, 0]; // gently curved (C)
const CURS: FingerPose = [25, 45, 30, 10]; // curved + spread (claw-ish)
const CLAW: FingerPose = [10, 75, 55, 10]; // hooked, spread
const HOOK: FingerPose = [10, 85, 65, 0]; // hooked (X / bent-V)
const OTIP: FingerPose = [52, 62, 40, 0]; // rounded to meet thumb (O)
const FLATO: FingerPose = [70, 15, 5, 0]; // straight fingers meeting thumb (flat-O)
const RELAX: FingerPose = [15, 18, 10, 3];

// Thumb configurations: [radial abd, palmar abd, roll, MCP, IP]
const T_SIDE: ThumbPose = [6, 8, 0, 0, 0]; // alongside index (A)
const T_ACROSS: ThumbPose = [-4, 40, 0, 50, 22]; // across front of curled fingers (S)
const T_TUCK: ThumbPose = [-10, 15, 0, 40, 15]; // folded against palm (B)
const T_OUT: ThumbPose = [58, 12, 0, 0, 0]; // out to the side (5, L, Y)
const T_C: ThumbPose = [32, 48, 0, 12, 12]; // C shape
const T_O: ThumbPose = [12, 64, 0, 22, 25]; // meets index tip (O, F)
const T_FLATO: ThumbPose = [8, 56, 0, 16, 10];
const T_E: ThumbPose = [-8, 40, 0, 55, 35]; // tucked under curled tips (E)
const T_RELAX: ThumbPose = [25, 25, 0, 8, 8];
const T_UP: ThumbPose = [10, 25, 0, 0, 0]; // thumb up (10, thumbs-up)
const T_MID: ThumbPose = [-2, 45, 0, 40, 15]; // touches middle finger (V, K, 3 variants)

const H = (i: FingerPose, m: FingerPose, r: FingerPose, p: FingerPose, t: ThumbPose): Handshape => ({ i, m, r, p, t });
const sp = (f: FingerPose, s: number): FingerPose => [f[0], f[1], f[2], s];

/**
 * ASL handshape inventory. Names follow common ASL linguistics conventions
 * (letters / numbers / descriptive names).
 */
export const HANDSHAPES: Record<string, Handshape> = {
  // --- Manual alphabet ---
  A: H(FIST, FIST, FIST, FIST, T_SIDE),
  B: H(EXT, EXT, EXT, EXT, T_TUCK),
  C: H(CURV, CURV, CURV, CURV, T_C),
  D: H(EXT, OTIP, OTIP, OTIP, T_O),
  E: H([80, 95, 70, 0], [80, 95, 70, 0], [80, 95, 70, 0], [80, 95, 70, 0], T_E),
  F: H(OTIP, EXS, EXS, sp(EXT, 14), T_O),
  G: H(EXT, FIST, FIST, FIST, [10, 12, 0, 0, 0]),
  H: H(EXT, sp(EXT, -2), FIST, FIST, T_ACROSS),
  I: H(FIST, FIST, FIST, EXT, T_ACROSS),
  K: H(EXT, [45, 0, 0, -6], FIST, FIST, [5, 40, 0, 10, 0]),
  L: H(EXT, FIST, FIST, FIST, T_OUT),
  M: H([85, 100, 50, 0], [85, 100, 50, 0], [85, 100, 50, 0], FIST, [-40, 25, 0, 40, 30]),
  N: H([85, 100, 50, 0], [85, 100, 50, 0], FIST, FIST, [-30, 25, 0, 40, 30]),
  O: H(OTIP, OTIP, OTIP, OTIP, T_O),
  P: H(EXT, [45, 0, 0, -6], FIST, FIST, [5, 40, 0, 10, 0]), // K oriented down
  Q: H(EXT, FIST, FIST, FIST, [20, 8, 0, 0, 0]), // G oriented down
  R: H([0, 0, 0, -6], [0, 0, 0, 8], FIST, FIST, T_ACROSS),
  S: H(FIST, FIST, FIST, FIST, T_ACROSS),
  T: H([70, 95, 45, 0], FIST, FIST, FIST, [-10, 35, 0, 30, 10]),
  U: H(EXT, EXT, FIST, FIST, T_ACROSS),
  V: H(EXS, EXS, FIST, FIST, T_MID),
  W: H(EXS, EXS, EXS, FIST, [-20, 40, 0, 40, 30]),
  X: H(HOOK, FIST, FIST, FIST, T_ACROSS),
  Y: H(FIST, FIST, FIST, sp(EXT, 25), T_OUT),

  // --- Numbers / other common shapes ---
  "1": H(EXT, FIST, FIST, FIST, T_ACROSS),
  "3": H(EXS, EXS, FIST, FIST, T_OUT),
  "4": H(EXS, EXS, EXS, EXS, T_TUCK),
  "5": H(sp(EXT, 12), sp(EXT, 2), sp(EXT, 10), sp(EXT, 18), T_OUT),
  "6": H(EXT, EXT, EXT, OTIP, T_O), // = W in numbers
  "7": H(EXT, EXT, OTIP, EXT, T_O),
  "8": H(EXT, OTIP, EXT, EXT, T_O),
  "9": H(OTIP, EXT, EXT, EXT, T_O), // = F
  "10": H(FIST, FIST, FIST, FIST, T_UP),
  bentB: H(BENT, BENT, BENT, BENT, T_TUCK),
  openB: H(sp(EXT, 6), sp(EXT, 1), sp(EXT, 5), sp(EXT, 9), T_OUT),
  flatB: H(EXT, EXT, EXT, EXT, [10, 10, 0, 0, 0]), // thumb alongside
  curvedB: H([30, 20, 10, 0], [30, 20, 10, 0], [30, 20, 10, 0], [30, 20, 10, 0], T_TUCK),
  bent5: H(sp(BENT, 10), sp(BENT, 2), sp(BENT, 8), sp(BENT, 14), T_OUT),
  claw5: H(CLAW, sp(CLAW, 2), CLAW, sp(CLAW, 14), [45, 30, 0, 15, 30]),
  curved5: H(CURS, sp(CURS, 2), CURS, sp(CURS, 14), T_C),
  flatO: H(FLATO, FLATO, FLATO, FLATO, T_FLATO),
  smallC: H(CURV, FIST, FIST, FIST, T_C),
  bentV: H(sp(HOOK, 10), sp(HOOK, 10), FIST, FIST, T_MID),
  bentL: H([0, 60, 30, 0], FIST, FIST, FIST, T_OUT),
  bentH: H(BENT, BENT, FIST, FIST, T_ACROSS),
  open8: H(EXT, [55, 10, 0, 2], sp(EXT, 8), sp(EXT, 15), T_OUT), // middle finger bent forward
  ILY: H(EXT, FIST, FIST, sp(EXT, 20), T_OUT),
  horns: H(EXT, FIST, FIST, sp(EXT, 20), T_ACROSS),
  baby0: H(OTIP, FIST, FIST, FIST, T_O), // small O with index
  flatF: H([60, 20, 5, 0], EXS, EXS, EXS, T_FLATO),
  closedX: H([40, 100, 70, 0], FIST, FIST, FIST, T_ACROSS),
  thumb: H(FIST, FIST, FIST, FIST, T_UP),
  relaxed: H(RELAX, RELAX, sp(RELAX, 4), sp(RELAX, 6), T_RELAX),
};

export const HANDSHAPE_NAMES = Object.keys(HANDSHAPES);

export function getHandshape(name: string): Handshape {
  const h = HANDSHAPES[name];
  if (!h) throw new Error(`Unknown handshape "${name}"`);
  return h;
}

export function lerpHandshape(a: Handshape, b: Handshape, t: number): Handshape {
  const f = (x: number[], y: number[]) => x.map((v, k) => v + (y[k] - v) * t);
  return {
    i: f(a.i, b.i) as FingerPose,
    m: f(a.m, b.m) as FingerPose,
    r: f(a.r, b.r) as FingerPose,
    p: f(a.p, b.p) as FingerPose,
    t: f(a.t, b.t) as ThumbPose,
  };
}

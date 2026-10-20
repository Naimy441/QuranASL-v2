// Core types for the parametric ASL engine.
//
// Coordinate frame ("torso space", metres): the avatar stands at the origin
// facing +Z (toward the viewer). +Y is up. The signer's RIGHT side is -X.

export type HandSide = "R" | "L";

/** [MCP flex, PIP flex, DIP flex, spread] in degrees. Spread is "away from the middle finger". */
export type FingerPose = [number, number, number, number];

/** [radial abduction, palmar abduction, roll, MCP flex, IP flex] in degrees. */
export type ThumbPose = [number, number, number, number, number];

export interface Handshape {
  i: FingerPose;
  m: FingerPose;
  r: FingerPose;
  p: FingerPose;
  t: ThumbPose;
}

/** Point on the hand that is placed at the target location. */
export type HandPoint =
  | "palm" // centre of palm surface
  | "back" // centre of back of hand
  | "wrist"
  | "tipI" | "tipM" | "tipR" | "tipP" | "tipT" // fingertips
  | "pipI" | "pipM" // middle knuckles (for bent hands)
  | "knuckles" // MCP row, back side
  | "heel" // heel of the palm
  | "radial" // index/thumb edge of hand
  | "ulnar"; // pinky edge of hand

export interface Vec3 { x: number; y: number; z: number }

/** Movement overlays applied while a key is held. */
export interface Overlay {
  circle?: { normal: [number, number, number]; radius: number; turns: number };
  wiggle?: number; // finger wiggle amplitude (deg)
  twist?: number; // wrist twist amplitude (deg) about finger axis
  shake?: number; // small side-to-side tremble amplitude (m)
  tap?: number; // small repeated contact movement amplitude (m)
}

/** A compiled hand key: where the hand should be at a time. */
export interface HandKey {
  t: number; // arrival time (s, relative to sign start)
  hold: number; // hold duration after arrival (s)
  pos: [number, number, number]; // wrist position (torso space)
  quat: [number, number, number, number]; // hand orientation
  shape: Handshape;
  /** Bezier bulge for the segment ARRIVING at this key (torso space, metres). */
  arc?: [number, number, number];
  overlay?: Overlay;
  /** Linear (un-eased) interpolation into this key — used for dense captured motion. */
  lin?: boolean;
}

export type FaceKey =
  | "browUp" | "browDown" | "squint" | "eyesWide" | "eyesClosed"
  | "mouthOpen" | "smile" | "frown" | "purse" | "puff" | "lipsPress" | "teeth";

export interface FaceState {
  browUp: number; browDown: number; browInnerUp: number;
  squint: number; eyesWide: number; eyesClosed: number;
  mouthOpen: number; smile: number; frown: number; purse: number; puff: number; lipsPress: number; teeth: number;
  headPitch: number; headYaw: number; headRoll: number; // radians
  torsoYaw: number; torsoPitch: number; torsoRoll: number;
  gazeX: number; gazeY: number; // -1..1
  nod: number; shake: number; // oscillation amplitudes (radians)
}

/** A sign compiled into time-stamped key tracks. */
export interface CompiledSign {
  id: string;
  dur: number;
  R: HandKey[];
  L: HandKey[] | null; // null = non-dominant hand not used
  face?: Partial<FaceState>;
  /** Time-varying facial grammar (captured signs). */
  faceTrack?: { t: number; f: Partial<FaceState> }[];
}

export interface SignEntry {
  id: string; // gloss, e.g. "MERCY" or "ALLAH.gdm"
  def: string; // DSL source
  gloss?: string; // display label
  en?: string[]; // English words this sign can render
  conf?: "high" | "med" | "low";
  src?: string; // provenance note
  note?: string;
  cat?: string;
  /** Captured motion (from video) — overrides parametric def when present. */
  mocap?: string;
}

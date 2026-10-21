import type { CompiledSign, FaceState, Handshape, HandKey } from "./types";

/** Retargeted motion-capture clip (see scripts/mocap/retarget.ts). */
export interface MocapClip {
  id: string;
  src: string;
  fps: number;
  seg: [number, number];
  R: number[][] | null; // [px,py,pz,qx,qy,qz,qw, 16 finger params, 5 thumb params, elbow swivel?]
  L: number[][] | null;
  face: number[][]; // [browUp, browDown, mouthOpen, smile, eyesClosed, headYaw, headRoll, headPitch]
}

const clips = new Map<string, MocapClip>();
let loading: Promise<void> | null = null;

export function registerMocap(c: MocapClip) {
  clips.set(c.id, c);
}
export const hasMocap = (id: string) => clips.has(id);
export const getMocap = (id: string) => clips.get(id);
export const mocapIds = () => [...clips.keys()];

/** Load every clip listed in /data/mocap/index.json (browser). Safe to call repeatedly. */
export function loadAllMocap(base = "/data/mocap"): Promise<void> {
  if (loading) return loading;
  loading = fetch(`${base}/index.json`)
    .then((r) => (r.ok ? r.json() : []))
    .then((ids: string[]) =>
      Promise.all(ids.map((id) => fetch(`${base}/${encodeURIComponent(id)}.json`).then((r) => r.json()).then(registerMocap).catch(() => {}))),
    )
    .then(() => undefined)
    .catch(() => undefined);
  return loading;
}

function shapeFrom(a: number[]): Handshape {
  const f = (k: number) => [a[k], a[k + 1], a[k + 2], a[k + 3]] as [number, number, number, number];
  return { i: f(7), m: f(11), r: f(15), p: f(19), t: [a[23], a[24], a[25], a[26], a[27]] };
}

/** Convert a clip to a compiled sign; every frame becomes a linearly interpolated key. */
export function mocapSign(c: MocapClip, step = 2): CompiledSign {
  const dt = 1 / c.fps;
  const track = (rows: number[][]): HandKey[] => {
    const keys: HandKey[] = [];
    for (let i = 0; i < rows.length; i += step) {
      const a = rows[i];
      keys.push({ t: i * dt, hold: 0, pos: [a[0], a[1], a[2]], quat: [a[3], a[4], a[5], a[6]], shape: shapeFrom(a), lin: true, sw: a[28] });
    }
    const last = rows.length - 1;
    if (last % step) {
      const a = rows[last];
      keys.push({ t: last * dt, hold: 0, pos: [a[0], a[1], a[2]], quat: [a[3], a[4], a[5], a[6]], shape: shapeFrom(a), lin: true, sw: a[28] });
    }
    keys[0].lin = false;
    return keys;
  };
  const R = track(c.R!);
  const L = c.L ? track(c.L) : null;
  const dur = R[R.length - 1].t;
  const faceTrack = c.face.map((x, i) => ({
    t: i * dt,
    f: {
      browUp: x[0], browDown: x[1], mouthOpen: x[2], smile: Math.max(0, x[3]), purse: Math.max(0, -x[3]),
      eyesClosed: x[4] > 0.6 ? x[4] : 0, headYaw: -x[5], headRoll: -x[6] * 0.6, headPitch: x[7],
    } as Partial<FaceState>,
  }));
  return { id: c.id, dur, R, L, faceTrack };
}

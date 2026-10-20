import * as THREE from "three";
import { HANDSHAPES } from "./handshapes";
import { dirVec, locVec, offsetVec } from "./body";
import { buildHandRig, type HandRig } from "../avatar/handRig";
import type { CompiledSign, FaceState, HandKey, HandPoint, HandSide, Overlay } from "./types";

/*
 * Sign definition DSL
 * -------------------
 *   DEF   := TRACK ( "|" TRACK )? ( ";" FLAG* )?
 *   TRACK := KEY ( ">" KEY )*
 *   KEY   := space separated tokens, any of:
 *     <handshape>            e.g. B, 5, flatO, bentV           (inherits from previous key)
 *     @<loc>[:<offset>]      e.g. @chin, @neutral:f5u3, @^shoulder, @base.palm:u2
 *     p:<dir>                palm facing direction  (U D F B I O, combinable: "FI")
 *     f:<dir>                extended-finger direction
 *     at:<point>             hand point placed at the location (palm, tipI, tipT, ...)
 *     d:<sec>                duration of the movement INTO this key   (default .24)
 *     h:<sec>                hold after arriving                       (default .06)
 *     ~arc:<offset>          curved path bulge, e.g. ~arc:u4
 *     ~circle:<dir><cm>x<n>  circle during hold, e.g. ~circle:F6x2
 *     ~wiggle[:deg] ~twist:<deg> ~shake[:cm] ~tap[:cm]
 *   FLAGS: sym (other hand mirrors), alt (mirrors, half-cycle offset),
 *          x2 / x3 (repeat movement), face:browUp=.6,squint=.3
 *
 * Directions: U up, D down, F forward, B back (toward body), I inward (toward
 * midline), O outward. Offsets in cm: f b u d i o.
 */

const DEFAULT_D = 0.24;
const DEFAULT_H = 0.06;

interface RawKey {
  hs?: string;
  loc?: string;
  off?: string;
  palm?: string;
  fing?: string;
  at?: HandPoint;
  d?: number;
  h?: number;
  arc?: string;
  overlay?: { circle?: string; wiggle?: number; twist?: number; shake?: number; tap?: number };
}

interface ParsedDef {
  dom: RawKey[];
  nd: RawKey[] | null;
  flags: Set<string>;
  face?: Partial<FaceState>;
  repeat: number;
}

export class DslError extends Error {}

function parseKey(src: string): RawKey {
  const k: RawKey = {};
  for (const tok of src.trim().split(/\s+/).filter(Boolean)) {
    if (tok.startsWith("@")) {
      const [loc, off] = tok.slice(1).split(":");
      k.loc = loc;
      k.off = off;
    } else if (tok.startsWith("p:")) k.palm = tok.slice(2);
    else if (tok.startsWith("f:")) k.fing = tok.slice(2);
    else if (tok.startsWith("at:")) k.at = tok.slice(3) as HandPoint;
    else if (tok.startsWith("d:")) k.d = parseFloat(tok.slice(2));
    else if (tok.startsWith("h:")) k.h = parseFloat(tok.slice(2));
    else if (tok.startsWith("~")) {
      const [name, arg] = tok.slice(1).split(":");
      k.overlay ??= {};
      if (name === "arc") k.arc = arg;
      else if (name === "circle") k.overlay.circle = arg ?? "F5x1";
      else if (name === "wiggle") k.overlay.wiggle = arg ? parseFloat(arg) : 14;
      else if (name === "twist") k.overlay.twist = arg ? parseFloat(arg) : 35;
      else if (name === "shake") k.overlay.shake = arg ? parseFloat(arg) / 100 : 0.015;
      else if (name === "tap") k.overlay.tap = arg ? parseFloat(arg) / 100 : 0.02;
      else throw new DslError(`Unknown modifier ~${name}`);
    } else if (HANDSHAPES[tok]) k.hs = tok;
    else throw new DslError(`Unknown token "${tok}"`);
  }
  return k;
}

export function parseDef(def: string): ParsedDef {
  // Each hand's part may carry ";flags" — flags apply to the whole sign.
  const parts = def.split("|").map((p) => p.split(";"));
  const domSrc = parts[0][0];
  const ndSrc = parts[1]?.[0];
  const flagStr = parts.map((p) => p.slice(1).join(" ")).join(" ");
  const flags = new Set<string>();
  let face: Partial<FaceState> | undefined;
  let repeat = 1;
  for (const f of flagStr.trim().split(/\s+/).filter(Boolean)) {
    if (f.startsWith("face:")) {
      face = {};
      for (const kv of f.slice(5).split(",")) {
        const [k, v] = kv.split("=");
        (face as Record<string, number>)[k] = parseFloat(v);
      }
    } else if (/^x\d$/.test(f)) repeat = parseInt(f.slice(1));
    else flags.add(f);
  }
  const track = (s: string) => s.split(">").map(parseKey);
  return { dom: track(domSrc), nd: ndSrc && ndSrc.trim() ? track(ndSrc) : null, flags, face, repeat };
}

// ---------------------------------------------------------------------------

const probes: Partial<Record<HandSide, HandRig>> = {};
function probe(side: HandSide) {
  return (probes[side] ??= buildHandRig(side));
}

const _x = new THREE.Vector3(), _y = new THREE.Vector3(), _z = new THREE.Vector3();
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _p = new THREE.Vector3();

export function orientQuat(palm: [number, number, number], fing: [number, number, number]): THREE.Quaternion {
  _y.set(...fing).normalize();
  _z.set(...palm);
  _z.addScaledVector(_y, -_z.dot(_y));
  if (_z.lengthSq() < 1e-6) {
    // palm parallel to fingers: pick any perpendicular
    _z.set(0, 0, 1).addScaledVector(_y, -_y.z);
    if (_z.lengthSq() < 1e-6) _z.set(1, 0, 0);
  }
  _z.normalize();
  _x.crossVectors(_y, _z);
  _m.makeBasis(_x, _y, _z);
  return new THREE.Quaternion().setFromRotationMatrix(_m);
}

const POINTED = new Set(["1", "D", "G", "L", "X", "bentL", "Q", "baby0", "closedX"]);
const SPACE = new Set(["neutral", "near", "far", "high", "low", "side", "up", "fs", "rest", "ready", "a", "b", "c", "d", "e", "sky", "ground", "face", "aboveHead"]);

function defaultPoint(hs: string, loc: string): HandPoint {
  const bare = loc.replace(/^\^/, "");
  if (SPACE.has(bare) || bare.startsWith("base")) return "palm";
  if (POINTED.has(hs)) return "tipI";
  return "palm";
}

/** Resolved state of a key before timing. */
interface Resolved {
  hs: string;
  target: [number, number, number]; // location of the hand point
  at: HandPoint;
  palm: string;
  fing: string;
  d: number;
  h: number;
  arc?: [number, number, number];
  overlay?: Overlay;
  baseRef?: { point: HandPoint; off: [number, number, number] };
}

function resolveTrack(keys: RawKey[], side: HandSide, id: string): Resolved[] {
  const out: Resolved[] = [];
  let prev: Resolved | null = null;
  keys.forEach((k, idx) => {
    const hs = k.hs ?? prev?.hs;
    const palm = k.palm ?? prev?.palm;
    const fing = k.fing ?? prev?.fing;
    if (!hs || !palm || !fing) throw new DslError(`${id}: first key needs handshape, p:, f:`);
    let target = prev?.target;
    let baseRef = prev?.baseRef;
    let locName = k.loc;
    if (k.loc) {
      const off = k.off ? offsetVec(k.off, side) : ([0, 0, 0] as [number, number, number]);
      if (k.loc.startsWith("base")) {
        const point = (k.loc.split(".")[1] ?? "palm") as HandPoint;
        baseRef = { point, off };
        target = [0, 0, 0];
      } else {
        const l = locVec(k.loc, side);
        target = [l[0] + off[0], l[1] + off[1], l[2] + off[2]];
        baseRef = undefined;
      }
    } else if (k.off && prev) {
      // offset relative to previous position
      const off = offsetVec(k.off, side);
      if (prev.baseRef) baseRef = { point: prev.baseRef.point, off: [prev.baseRef.off[0] + off[0], prev.baseRef.off[1] + off[1], prev.baseRef.off[2] + off[2]] };
      else target = [prev.target[0] + off[0], prev.target[1] + off[1], prev.target[2] + off[2]];
    }
    if (!target) throw new DslError(`${id}: first key needs a location`);
    locName ??= "";
    const at = k.at ?? (k.loc ? defaultPoint(hs, locName) : prev?.at ?? "palm");
    let overlay: Overlay | undefined;
    if (k.overlay) {
      overlay = {};
      if (k.overlay.circle) {
        const m = /^([UDFBIO]+)(\d+(?:\.\d+)?)(?:x(\d+(?:\.\d+)?))?$/i.exec(k.overlay.circle);
        if (!m) throw new DslError(`${id}: bad circle ${k.overlay.circle}`);
        overlay.circle = { normal: dirVec(m[1], side), radius: parseFloat(m[2]) / 100, turns: m[3] ? parseFloat(m[3]) : 1 };
      }
      if (k.overlay.wiggle) overlay.wiggle = k.overlay.wiggle;
      if (k.overlay.twist) overlay.twist = k.overlay.twist;
      if (k.overlay.shake) overlay.shake = k.overlay.shake;
      if (k.overlay.tap) overlay.tap = k.overlay.tap;
    }
    const defaultHold = overlay?.circle ? 0.32 * overlay.circle.turns : overlay && (overlay.wiggle || overlay.twist || overlay.shake || overlay.tap) ? 0.4 : DEFAULT_H;
    const r: Resolved = {
      hs, target, at, palm, fing, baseRef,
      d: idx === 0 ? 0 : k.d ?? DEFAULT_D,
      h: k.h ?? defaultHold,
      arc: k.arc ? offsetVec(k.arc, side) : undefined,
      overlay,
    };
    out.push(r);
    prev = r;
  });
  return out;
}

function repeatTrack(r: Resolved[], n: number): Resolved[] {
  if (n <= 1 || r.length < 2) return r.map((k) => ({ ...k, h: n > 1 && k.overlay ? k.h : k.h }));
  const out = [...r];
  for (let i = 1; i < n; i++) {
    for (let j = 0; j < r.length; j++) {
      const k = r[j];
      out.push({ ...k, d: j === 0 ? Math.max(0.14, r[1].d * 0.8) : k.d * 0.8, h: Math.min(k.h, 0.05) });
    }
  }
  return out;
}

function timeTrack(r: Resolved[], side: HandSide, base: HandKey[] | null): HandKey[] {
  const rig = probe(side);
  let t = 0;
  return r.map((k) => {
    t += k.d;
    const shape = HANDSHAPES[k.hs];
    rig.setShape(shape);
    const q = orientQuat(dirVec(k.palm, side), dirVec(k.fing, side));
    let target = k.target;
    if (k.baseRef && base) {
      const bk = sampleKeysLinear(base, t);
      const brig = probe(side === "R" ? "L" : "R");
      brig.setShape(bk.shape);
      const bp = brig.point(k.baseRef.point, _p).applyQuaternion(_q.set(...bk.quat));
      target = [bk.pos[0] + bp.x + k.baseRef.off[0], bk.pos[1] + bp.y + k.baseRef.off[1], bk.pos[2] + bp.z + k.baseRef.off[2]];
    }
    const pt = rig.point(k.at, _p).applyQuaternion(q);
    const key: HandKey = {
      t,
      hold: k.h,
      pos: [target[0] - pt.x, target[1] - pt.y, target[2] - pt.z],
      quat: [q.x, q.y, q.z, q.w],
      shape,
      arc: k.arc,
      overlay: k.overlay,
    };
    t += k.h;
    return key;
  });
}

function sampleKeysLinear(keys: HandKey[], t: number): HandKey {
  if (t <= keys[0].t) return keys[0];
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1], b = keys[i];
    const aEnd = a.t + a.hold;
    if (t <= aEnd) return a;
    if (t < b.t) {
      const u = (t - aEnd) / Math.max(1e-6, b.t - aEnd);
      const qa = new THREE.Quaternion(...a.quat), qb = new THREE.Quaternion(...b.quat);
      qa.slerp(qb, u);
      return { ...b, pos: [a.pos[0] + (b.pos[0] - a.pos[0]) * u, a.pos[1] + (b.pos[1] - a.pos[1]) * u, a.pos[2] + (b.pos[2] - a.pos[2]) * u], quat: [qa.x, qa.y, qa.z, qa.w], shape: u < 0.5 ? a.shape : b.shape };
    }
  }
  return keys[keys.length - 1];
}

function endTime(keys: HandKey[]) {
  const k = keys[keys.length - 1];
  return k.t + k.hold;
}

const cache = new Map<string, CompiledSign>();

/** Compile a DSL definition (dominant = right hand). Results are cached by source. */
export function compileSign(id: string, def: string): CompiledSign {
  const ck = id + "\u0000" + def;
  const hit = cache.get(ck);
  if (hit) return hit;
  const p = parseDef(def);
  let domR = resolveTrack(p.dom, "R", id);
  domR = repeatTrack(domR, p.repeat);

  let L: HandKey[] | null = null;
  if (p.nd) {
    let ndR = resolveTrack(p.nd, "L", id);
    ndR = repeatTrack(ndR, p.repeat);
    L = timeTrack(ndR, "L", null);
  } else if (p.flags.has("sym") || p.flags.has("alt")) {
    let ndR = resolveTrack(p.dom, "L", id);
    ndR = repeatTrack(ndR, p.repeat);
    if (p.flags.has("alt") && ndR.length >= 2) {
      // start the other hand on the second key so the hands move in alternation
      ndR = [...ndR.slice(1), ...ndR.slice(0, 1)].map((k, i) => ({ ...k, d: i === 0 ? 0 : k.d || DEFAULT_D }));
    }
    L = timeTrack(ndR, "L", null);
  }
  const R = timeTrack(domR, "R", L);

  // Stretch both tracks so they end together.
  let dur = endTime(R);
  if (L) {
    const lend = endTime(L);
    if (L.length === 1) {
      L[0].hold = dur; // static base hand
    } else if (Math.abs(lend - dur) > 1e-3) {
      dur = Math.max(dur, lend);
      const last = L[L.length - 1];
      last.hold += dur - lend;
      R[R.length - 1].hold += dur - endTime(R);
    }
  }
  const out: CompiledSign = { id, dur, R, L, face: p.face };
  cache.set(ck, out);
  return out;
}

export function validateDef(def: string): string | null {
  try {
    cache.clear();
    compileSign("__validate__", def);
    return null;
  } catch (e) {
    return (e as Error).message;
  }
}

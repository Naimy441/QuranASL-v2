import * as THREE from "three";
import { headQuat, bodyModel, handPenetration, handsOverlap, solveHands, type BodyModel } from "../asl/physical";
import { makePose, samplePose, type Timeline } from "../asl/timeline";
import type { HandKey } from "../asl/types";

// Physical feedback for the Studio sign editor (same measure as scripts/try-def.ts
// and scripts/audit-signs.ts): how far the runtime solver has to move each hand
// to keep it out of the body and the other hand. Small corrections are contact
// settling onto the skin; large ones mean the definition puts a hand in the wrong place.

export interface PhysSample {
  u: number; // 0..1 through the sign
  body: number; // m the solver moved a hand out of the body
  hands: number; // m the hands overlapped
  key: boolean; // at a held key (vs moving between keys)
  side: "R" | "L";
}
export interface PhysReport {
  key: number; // worst body correction at keys (m)
  path: number; // worst body correction while moving (m)
  hands: number; // worst hand-hand overlap (m)
  /** deepest raw penetration of either hand at a key (m, before solving) */
  depth: number;
  worstAt: { u: number; side: "R" | "L" } | null;
  samples: PhysSample[];
}
export type PhysTone = "ok" | "warn" | "bad";

/** Same thresholds as the review queue. */
export function physTone(r: Pick<PhysReport, "key" | "path" | "hands">): PhysTone {
  const m = Math.max(r.key, r.path, r.hands * 0.75);
  return m > 0.045 ? "bad" : m > 0.02 ? "warn" : "ok";
}

let body: BodyModel | null = null;
const inHold = (keys: HandKey[], t: number) => keys.some((k) => t >= k.t - 0.02 && t <= k.t + k.hold + 0.02);

export function physicalReport(tl: Timeline, fps = 30): PhysReport | null {
  const it = tl.items.find((x) => x.kind !== "pause");
  if (!it) return null;
  body ??= bodyModel("hijab");
  const pose = makePose();
  const R = { pos: new THREE.Vector3(), quat: new THREE.Quaternion(), shape: pose.R.shape };
  const L = { pos: new THREE.Vector3(), quat: new THREE.Quaternion(), shape: pose.L.shape };
  const r0 = new THREE.Vector3(), l0 = new THREE.Vector3(), hq = new THREE.Quaternion();
  const out: PhysReport = { key: 0, path: 0, hands: 0, depth: 0, worstAt: null, samples: [] };
  let worst = 0;
  const span = Math.max(1e-3, it.end - it.start);
  for (let t = it.start; t <= it.end + 1e-6; t += 1 / fps) {
    samplePose(tl, t, pose);
    const set = () => {
      R.pos.copy(pose.R.pos); R.quat.copy(pose.R.quat); R.shape = pose.R.shape;
      L.pos.copy(pose.L.pos); L.quat.copy(pose.L.quat); L.shape = pose.L.shape;
    };
    set();
    const hQ = pose.face.headPitch || pose.face.headYaw || pose.face.headRoll ? headQuat(pose.face, hq) : null;
    const usesL = tl.L.length > 0;
    r0.copy(R.pos);
    l0.copy(L.pos);
    solveHands(R, L, body, pose.face, { hands: false });
    const dR = R.pos.distanceTo(r0), dL = usesL ? L.pos.distanceTo(l0) : 0;
    const side = dR >= dL ? "R" : "L";
    const d = Math.max(dR, dL);
    const key = inHold(side === "R" ? tl.R : tl.L, t);
    if (key) out.key = Math.max(out.key, d);
    else out.path = Math.max(out.path, d);
    // hand-hand contact, from the unsolved pose
    set();
    const hands = usesL ? Math.max(0, handsOverlap(R, L)) : 0;
    out.hands = Math.max(out.hands, hands);
    if (key) out.depth = Math.max(out.depth, handPenetration("R", R, body, hQ), usesL ? handPenetration("L", L, body, hQ) : 0);
    const u = (t - it.start) / span;
    if (d > worst) {
      worst = d;
      out.worstAt = { u, side };
    }
    out.samples.push({ u, body: d, hands, key, side });
  }
  return out;
}

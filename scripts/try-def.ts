// Score candidate sign definitions for physical plausibility before editing the lexicon.
// usage: npx tsx scripts/try-def.ts "<def>" ["<def>" ...]
// prints the largest correction the runtime solver must make at keys and during movements (cm)
import * as THREE from "three";
import { compileSign } from "../src/lib/asl/dsl";
import { buildTimeline, makePose, samplePose } from "../src/lib/asl/timeline";
import { bodyModel, solveHands } from "../src/lib/asl/physical";

const body = bodyModel("hijab");
for (const def of process.argv.slice(2)) {
  const tl = buildTimeline([{ index: 0, label: "x", kind: "sign", sign: compileSign("try", def) }]);
  const it = tl.items[0], pose = makePose();
  let key = 0, path = 0, hands = 0;
  for (let t = it.start; t <= it.end; t += 1 / 60) {
    samplePose(tl, t, pose);
    const R = { pos: pose.R.pos.clone(), quat: pose.R.quat.clone(), shape: pose.R.shape };
    const L = { pos: pose.L.pos.clone(), quat: pose.L.quat.clone(), shape: pose.L.shape };
    const r0 = R.pos.clone(), l0 = L.pos.clone();
    const res = solveHands(R, L, body, pose.face);
    const d = Math.max(R.pos.distanceTo(r0), L.pos.distanceTo(l0)) - 0; // includes hand separation
    const atKey = tl.R.some((k) => t >= k.t - 0.02 && t <= k.t + k.hold + 0.02);
    if (atKey) key = Math.max(key, d); else path = Math.max(path, d);
    hands = Math.max(hands, res.hands);
  }
  console.log(`key ${(key * 100).toFixed(1)}cm  path ${(path * 100).toFixed(1)}cm  hands ${(hands * 100).toFixed(1)}cm   ${def}`);
}

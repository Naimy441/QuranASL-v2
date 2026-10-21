// Glitch detector: drive the real AvatarRig (solver + easing) at 60 fps and compare the
// rendered wrists' acceleration with the raw animation's. A glitch is an acceleration spike
// the raw motion does not have.  usage: npx tsx scripts/qa/smoothness.ts SIGN [SIGN...]
import fs from "node:fs";
import * as THREE from "three";
import { registerMocap, type MocapClip } from "../../src/lib/asl/mocap";
import { getLexicon } from "../../src/lib/asl/lexicon";
import { buildTimeline, makePose, samplePose } from "../../src/lib/asl/timeline";
import { AvatarRig } from "../../src/lib/avatar/AvatarRig";
import { bodyModel, handPenetration, handsOverlap } from "../../src/lib/asl/physical";
const BM = bodyModel("hijab");

for (const f of JSON.parse(fs.readFileSync("public/data/mocap/index.json", "utf8"))) registerMocap(JSON.parse(fs.readFileSync(`public/data/mocap/${f}.json`, "utf8")) as MocapClip);
const lex = getLexicon();
const rig = new AvatarRig();
const dt = 1 / 60;
for (const id of process.argv.slice(2)) {
  const tl = buildTimeline([{ index: 0, label: id, kind: "sign", sign: lex.compile(id) }]);
  const pose = makePose();
  const raw: THREE.Vector3[][] = [[], []], out: THREE.Vector3[][] = [[], []];
  let ovl = 0, pen = 0, ovlFrames = 0, n = 0;
  for (let t = 0; t < tl.dur; t += dt) {
    samplePose(tl, t, pose);
    raw[0].push(pose.R.pos.clone());
    raw[1].push(pose.L.pos.clone());
    rig.apply(pose, t);
    out[0].push(rig.hands.R.root.position.clone());
    out[1].push(rig.hands.L.root.position.clone());
    const R = { pos: rig.hands.R.root.position, quat: rig.hands.R.root.quaternion, shape: pose.R.shape };
    const L = { pos: rig.hands.L.root.position, quat: rig.hands.L.root.quaternion, shape: pose.L.shape };
    const o = handsOverlap(R, L);
    ovl = Math.max(ovl, o);
    n++;
    if (o > 0.01) ovlFrames++;
    pen = Math.max(pen, handPenetration("R", R, BM), handPenetration("L", L, BM));
  }
  const acc = (p: THREE.Vector3[]) => p.slice(1, -1).map((x, i) => p[i].clone().add(p[i + 2]).sub(x.clone().multiplyScalar(2)).length() / (dt * dt));
  const stats = [0, 1].map((h) => {
    const ar = acc(raw[h]), ao = acc(out[h]);
    let spikes = 0, worst = 0;
    ao.forEach((a, i) => {
      const extra = a - ar[i];
      worst = Math.max(worst, extra);
      if (extra > 25) spikes++; // m/s² beyond the animation's own
    });
    return `${h ? "L" : "R"} peak extra accel ${worst.toFixed(0)} m/s², spikes ${spikes}`;
  });
  console.log(id.padEnd(14), stats.join("   "), `   on screen: hands overlap max ${(ovl * 100).toFixed(1)}cm (${((ovlFrames / n) * 100).toFixed(0)}% frames >1cm), body ${(pen * 100).toFixed(1)}cm`);
}

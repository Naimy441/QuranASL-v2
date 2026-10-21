// Same movement statistics as motion-stats.ts, measured on the parametric engine's
// output for a sample of ayat, plus the elbow swivel the rig's heuristic produces,
// so the engine can be compared against (and tuned to) human signing.
// usage: npx tsx scripts/learn/engine-stats.ts [nAyat]
import fs from "node:fs";
import * as THREE from "three";
import { animateGloss } from "../../src/lib/asl/gloss";
import { makePose, samplePose } from "../../src/lib/asl/timeline";
import { BODY } from "../../src/lib/asl/body";
import { elbowSwivel } from "../../src/lib/avatar/elbow";
import learned from "../../src/lib/avatar/learned.json";

const N = +(process.argv[2] ?? 150);
const glosses: string[] = [];
for (let s = 1; s <= 114; s++) {
  const j = JSON.parse(fs.readFileSync(`public/data/gloss/${s}.json`, "utf8"));
  for (const a of Object.values(j.ayat) as { gloss: string }[]) glosses.push(a.gloss);
}
const pick = glosses.filter((_, i) => i % Math.floor(glosses.length / N) === 0).slice(0, N);
const dt = 1 / 30;
const moveDur: number[] = [], peak: number[] = [];
const swH: number[] = [], swL: number[] = [];
const pose = makePose();
const ARM = BODY.upperArm + BODY.forearm;
const feats = (u: number[]) => [1, u[0], u[1], u[2], u[0] * u[0], u[1] * u[1], u[2] * u[2], u[0] * u[1], u[0] * u[2], u[1] * u[2]];
for (const g of pick) {
  const { timeline: tl } = animateGloss(g);
  const pos: THREE.Vector3[] = [];
  for (let t = 0; t < tl.dur; t += dt) {
    samplePose(tl, t, pose);
    pos.push(pose.R.pos.clone());
    // heuristic elbow (copy of AvatarRig.apply's pole) vs learned swivel
    const W = pose.R.pos, S = new THREE.Vector3(-BODY.shoulder.x, BODY.shoulder.y, BODY.shoulder.z);
    if (W.y > 1.05) {
      const sx = -1, high = Math.max(0, W.y - 1.35), cross = Math.max(0, -sx * W.x) * 1.2, face = Math.min(1, high / 0.25);
      const pole = new THREE.Vector3(S.x + sx * (0.22 - face * 0.1 - cross * 0.5), S.y - 0.55 - face * 0.15, S.z - 0.2 + face * 0.45 + cross * 0.3 + Math.max(0, W.z - 0.25) * 0.25);
      const d = W.clone().sub(S), len = Math.min(d.length(), ARM * 0.999), dir = d.clone().normalize();
      const cosA = (BODY.upperArm ** 2 + len * len - BODY.forearm ** 2) / (2 * BODY.upperArm * len);
      const perp = pole.clone().sub(S); perp.addScaledVector(dir, -perp.dot(dir)).normalize();
      const E = S.clone().addScaledVector(dir, BODY.upperArm * cosA).addScaledVector(perp, BODY.upperArm * Math.sqrt(Math.max(0, 1 - cosA * cosA)));
      swH.push(elbowSwivel(S, E, W));
      const u = [(W.x - S.x) * -1 / ARM, (W.y - S.y) / ARM, (W.z - S.z) / ARM];
      swL.push(feats(u).reduce((s, v, i) => s + v * learned.elbow.coef[i], 0));
    }
  }
  const sp = pos.map((p, i) => p.distanceTo(pos[Math.min(pos.length - 1, i + 1)]) / dt);
  let st = -1, pk = 0;
  sp.forEach((s, i) => {
    if (s > 0.25 && st < 0) { st = i; pk = 0; }
    if (st >= 0) pk = Math.max(pk, s);
    if (st >= 0 && s < 0.12) {
      const d = (i - st) * dt;
      if (d > 0.06 && d < 1.2) { moveDur.push(d); peak.push(pk); }
      st = -1;
    }
  });
}
const pct = (xs: number[], p: number) => +[...xs].sort((a, b) => a - b)[Math.floor(xs.length * p)].toFixed(3);
console.log("engine movements", { n: moveDur.length, dur: [0.1, 0.25, 0.5, 0.75, 0.9].map((p) => pct(moveDur, p)), peak: [0.1, 0.25, 0.5, 0.75, 0.9].map((p) => pct(peak, p)) });
console.log("human  movements", learned.timing);
const deg = (xs: number[]) => [0.1, 0.5, 0.9].map((p) => Math.round(pct(xs, p) * 57.3));
console.log("elbow swivel deg (10/50/90%)  heuristic", deg(swH), " learned", deg(swL));

// Physical audit of every dictionary sign: how far the hands sink into the body or
// into each other BEFORE the runtime solver corrects them. Large numbers mean the
// definition (or capture) puts the hand in the wrong place and should be fixed at
// the source; small ones are just contact the solver settles onto the surface.
//
// usage: npx tsx scripts/audit-signs.ts [--top 40] [--json data/audit/signs.json] [SIGN ...]
import fs from "node:fs";
import path from "node:path";
import * as THREE from "three";
import { getLexicon } from "../src/lib/asl/lexicon";
import { registerMocap, type MocapClip } from "../src/lib/asl/mocap";
import { buildTimeline, makePose, samplePose } from "../src/lib/asl/timeline";
import { bodyModel, solveHands } from "../src/lib/asl/physical";
import type { HandKey } from "../src/lib/asl/types";

const args = process.argv.slice(2);
const opt = (k: string, d: string) => {
  const i = args.indexOf(k);
  if (i < 0) return d;
  const v = args[i + 1];
  args.splice(i, 2);
  return v;
};
const top = +opt("--top", "40");
const jsonOut = opt("--json", "public/data/audit/signs.json");
const freq: Record<string, number> = JSON.parse(fs.readFileSync("public/data/gloss/freq.json", "utf8"));
const only = new Set(args);

const mdir = "public/data/mocap";
for (const id of JSON.parse(fs.readFileSync(path.join(mdir, "index.json"), "utf8")) as string[])
  registerMocap(JSON.parse(fs.readFileSync(path.join(mdir, `${id}.json`), "utf8")) as MocapClip);

const lex = getLexicon();
const body = bodyModel("hijab");
const pose = makePose();
const R = { pos: new THREE.Vector3(), quat: new THREE.Quaternion(), shape: pose.R.shape };
const L = { pos: new THREE.Vector3(), quat: new THREE.Quaternion(), shape: pose.L.shape };
const inHold = (keys: HandKey[], t: number) => keys.some((k) => t >= k.t - 0.02 && t <= k.t + k.hold + 0.02);

/** body/hands = largest correction the runtime solver has to make (m); key = at a key, path = during a movement */
interface Row { id: string; uses: number; body: number; bodyAt: string; keyBody: number; pathBody: number; hands: number; mocap: boolean; conf?: string; def: string }
const rows: Row[] = [];
let failed = 0;
for (const [id, e] of lex.entries) {
  if (only.size && !only.has(id)) continue;
  let tl;
  try {
    tl = buildTimeline([{ index: 0, label: id, kind: "sign", sign: lex.compile(id) }]);
  } catch {
    failed++;
    continue;
  }
  const it = tl.items[0];
  let worstBody = 0, worstHands = 0, at = "", keyBody = 0, pathBody = 0;
  for (let t = it.start; t <= it.end; t += 1 / 30) {
    samplePose(tl, t, pose);
    R.pos.copy(pose.R.pos); R.quat.copy(pose.R.quat); R.shape = pose.R.shape;
    L.pos.copy(pose.L.pos); L.quat.copy(pose.L.quat); L.shape = pose.L.shape;
    const r0 = R.pos.clone(), l0 = L.pos.clone();
    const res = solveHands(R, L, body, pose.face, { hands: false });
    const dR = R.pos.distanceTo(r0), dL = L.pos.distanceTo(l0);
    const d = Math.max(dR, dL);
    const side = dR >= dL ? "R" : "L";
    const key = inHold(side === "R" ? tl.R : tl.L, t);
    if (key) keyBody = Math.max(keyBody, d);
    else pathBody = Math.max(pathBody, d);
    if (d > worstBody) {
      worstBody = d;
      at = `${side}@${(((t - it.start) / (it.end - it.start)) * 100).toFixed(0)}%${key ? "k" : ""}`;
    }
    void res;
    const h = solveHands(R, L, body, pose.face);
    worstHands = Math.max(worstHands, h.hands);
  }
  rows.push({ id, uses: freq[id] ?? 0, body: +worstBody.toFixed(4), bodyAt: at, keyBody: +keyBody.toFixed(4), pathBody: +pathBody.toFixed(4), hands: +worstHands.toFixed(4), mocap: !!(e.mocap && lex.useMocap), conf: e.conf, def: e.def });
}

const cm = (x: number) => (x * 100).toFixed(1).padStart(5);
const fmt = (r: Row) => `${r.id.padEnd(22)} key ${cm(r.keyBody)} path ${cm(r.pathBody)} ${r.bodyAt.padEnd(8)} hands ${(r.hands * 100).toFixed(1).padStart(5)}cm ${r.mocap ? "mocap " : ""}${r.def.slice(0, 70)}`;
console.log(`\nWorst body penetration (of ${rows.length} signs, ${failed} failed to compile):`);
for (const r of [...rows].sort((a, b) => b.body - a.body).slice(0, top)) console.log(fmt(r));
console.log(`\nWorst hand-hand overlap:`);
for (const r of [...rows].sort((a, b) => b.hands - a.hands).slice(0, top)) console.log(fmt(r));
const n = (f: (r: Row) => boolean) => rows.filter(f).length;
console.log(`\nkey body > 1cm: ${n((r) => r.keyBody > 0.01)}  > 3cm: ${n((r) => r.keyBody > 0.03)}   path body > 1cm: ${n((r) => r.pathBody > 0.01)}  > 3cm: ${n((r) => r.pathBody > 0.03)}   hands > 1cm: ${n((r) => r.hands > 0.01)}  > 3cm: ${n((r) => r.hands > 0.03)}`);
if (jsonOut) {
  fs.mkdirSync(path.dirname(jsonOut), { recursive: true });
  // compact: the review queue loads this in the browser
  const pub = rows.sort((a, b) => a.id.localeCompare(b.id)).map((r) => ({ id: r.id, uses: r.uses, key: r.keyBody, path: r.pathBody, hands: r.hands, mocap: r.mocap || undefined, conf: r.conf, def: r.def }));
  fs.writeFileSync(jsonOut, JSON.stringify(pub));
  console.log("wrote", jsonOut);
}

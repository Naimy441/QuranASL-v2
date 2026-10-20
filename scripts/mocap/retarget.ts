// Retarget MediaPipe Holistic captures (data/pose/<set>/*.json) onto the avatar.
//
// usage: npx tsx scripts/mocap/retarget.ts data/pose/gdm map.json public/data/mocap
//   map.json: { "<video stem>": { "id": "ALLAH", "pick": "longest" | "last" | "first" | [startSec, endSec] } }
//
// For each clip: find the signing segment (hands raised), convert wrist
// positions to avatar torso space, hand orientation to quaternions, finger
// landmarks to the rig's joint parameters, and face landmarks to facial
// grammar channels. Output: compact per-sign JSON consumed by src/lib/asl/mocap.ts.
import fs from "node:fs";
import path from "node:path";
import { activeSegments, activity, retargetRange, type Capture } from "./lib";


const [setDir, mapFile, outDir] = process.argv.slice(2);
const map: Record<string, { id: string; pick?: string | [number, number]; note?: string; stem?: string }> = JSON.parse(fs.readFileSync(mapFile, "utf8"));
fs.mkdirSync(outDir, { recursive: true });

let made = 0;
const capCache = new Map<string, Capture>();
for (const [key, cfg] of Object.entries(map)) {
  const stem = cfg.stem ?? key;
  const file = path.join(setDir, stem + ".json");
  if (!fs.existsSync(file)) {
    console.warn("missing capture", stem);
    continue;
  }
  if (!capCache.has(file)) capCache.set(file, JSON.parse(fs.readFileSync(file, "utf8")));
  const cap = capCache.get(file)!;
  const n = cap.frames.length;
  const act = activity(cap);
  const segs = activeSegments(cap, act);
  let seg: [number, number];
  if (Array.isArray(cfg.pick)) {
    // a time window: take the longest active segment inside it (or the whole window)
    const w0 = Math.round(cfg.pick[0] * cap.fps), w1 = Math.min(n - 1, Math.round(cfg.pick[1] * cap.fps));
    const inside = segs.map(([a, b]) => [Math.max(a, w0), Math.min(b, w1)] as [number, number]).filter(([a, b]) => b - a > cap.fps * 0.25);
    seg = inside.length ? inside.reduce((x, y) => (y[1] - y[0] > x[1] - x[0] ? y : x)) : [w0, w1];
  } else if (!segs.length) {
    console.warn("no activity", stem);
    continue;
  } else if (cfg.pick === "last") seg = segs[segs.length - 1];
  else if (cfg.pick === "first") seg = segs[0];
  else seg = segs.reduce((a, b) => (b[1] - b[0] > a[1] - a[0] ? b : a));
  const pad = Math.round(cap.fps * 0.08);
  const s0 = Math.max(0, seg[0] - pad), s1 = Math.min(n - 1, seg[1] + pad);
  const out = retargetRange(cap, s0, s1, cfg.id, act);
  if (!out) {
    console.warn("no dominant hand", stem);
    continue;
  }
  fs.writeFileSync(path.join(outDir, `${cfg.id}.json`), JSON.stringify(out));
  made++;
  console.log(`${cfg.id.padEnd(16)} ${stem.padEnd(18)} frames ${s1 - s0 + 1} seg ${out.seg.join("-")}s L:${out.L ? "yes" : "no"}`);
}
const ids = fs.readdirSync(outDir).filter((f) => f.endsWith(".json") && f !== "index.json").map((f) => f.slice(0, -5));
fs.writeFileSync(path.join(outDir, "index.json"), JSON.stringify(ids));
console.log("retargeted", made, "clips; index has", ids.length);

// Retarget every segmented BSL ayah onto the avatar.   npx tsx scripts/bsl/retarget-ayat.ts
// Output: public/data/bsl/ayat/{surah}.json  { "<ayah>": Clip & { video, start, end } }, index.json
import fs from "node:fs";
import { retargetRange, activity, type Capture, type Clip } from "../mocap/lib";

const segs = JSON.parse(fs.readFileSync("data/bsl/segments.json", "utf8")) as { video: string; surah: number; ayah: number; start: number; end: number; conf: number }[];
fs.mkdirSync("public/data/bsl/ayat", { recursive: true });
const bySurah = new Map<number, Record<string, Clip & { video: string; start: number; end: number; conf: number }>>();
const caps = new Map<string, { cap: Capture; act: number[] }>();
let n = 0;
for (const s of segs) {
  if (!caps.has(s.video)) {
    caps.clear(); // keep memory flat: segments are grouped by video
    const cap = JSON.parse(fs.readFileSync(`data/pose/bsl/${s.video}.json`, "utf8")) as Capture;
    caps.set(s.video, { cap, act: activity(cap) });
  }
  const { cap, act } = caps.get(s.video)!;
  const f0 = Math.max(0, Math.round(s.start * cap.fps)), f1 = Math.min(cap.frames.length - 1, Math.round(s.end * cap.fps));
  const clip = retargetRange(cap, f0, f1, `BSL:${s.surah}:${s.ayah}`, act);
  if (!clip) continue;
  // 12.5 fps capture: drop face precision a little to keep files small
  const rec = bySurah.get(s.surah) ?? {};
  rec[s.ayah] = { ...clip, video: s.video, start: s.start, end: s.end, conf: s.conf };
  bySurah.set(s.surah, rec);
  n++;
}
const index: Record<number, number[]> = {};
for (const [surah, rec] of bySurah) {
  fs.writeFileSync(`public/data/bsl/ayat/${surah}.json`, JSON.stringify(rec));
  index[surah] = Object.keys(rec).map(Number).sort((a, b) => a - b);
}
fs.writeFileSync("public/data/bsl/ayat/index.json", JSON.stringify(index));
console.log(`retargeted ${n} ayat across ${bySurah.size} surahs`);

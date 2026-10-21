// Retarget every subtitle-aligned Global Deaf Muslim ayah onto the avatar.
// npx tsx scripts/gdm/retarget-ayat.ts   (after ocr_subtitles.py, align.ts and pose extraction)
// Output: public/data/asl/ayat/{surah}.json  { "<ayah>": Clip & { video, start, end, conf } }, index.json
import fs from "node:fs";
import { retargetRange, activity, type Capture, type Clip } from "../mocap/lib";
import type { Segment } from "./align";

const segs = JSON.parse(fs.readFileSync("data/gdm/segments.json", "utf8")) as Segment[];
const outDir = "public/data/asl/ayat";
fs.mkdirSync(outDir, { recursive: true });
const bySurah = new Map<number, Record<string, Clip & { video: string; start: number; end: number; conf: number; timing: Segment["timing"] }>>();
let n = 0, cached = "";
let cap: Capture | null = null, act: number[] = [];
for (const s of segs) {
  const file = `data/pose/gdm-surah/${s.video}.json`;
  if (!fs.existsSync(file)) {
    console.warn("no pose capture yet for", s.video);
    continue;
  }
  if (cached !== file) {
    cap = JSON.parse(fs.readFileSync(file, "utf8")) as Capture;
    act = activity(cap);
    cached = file;
  }
  const f0 = Math.max(0, Math.round(s.start * cap!.fps)), f1 = Math.min(cap!.frames.length - 1, Math.round(s.end * cap!.fps));
  const clip = retargetRange(cap!, f0, f1, `ASL:${s.surah}:${s.ayah}`, act);
  if (!clip) continue;
  const rec = bySurah.get(s.surah) ?? {};
  rec[s.ayah] = { ...clip, video: s.video, start: s.start, end: s.end, conf: s.conf, timing: s.timing };
  bySurah.set(s.surah, rec);
  n++;
}
const index: Record<number, number[]> = fs.existsSync(`${outDir}/index.json`) ? JSON.parse(fs.readFileSync(`${outDir}/index.json`, "utf8")) : {};
for (const [surah, rec] of bySurah) {
  fs.writeFileSync(`${outDir}/${surah}.json`, JSON.stringify(rec));
  index[surah] = Object.keys(rec).map(Number).sort((a, b) => a - b);
}
fs.writeFileSync(`${outDir}/index.json`, JSON.stringify(index));
console.log(`retargeted ${n} ASL ayat across ${bySurah.size} surahs`);

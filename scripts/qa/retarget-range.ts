// Retarget an arbitrary time range of a capture to a clip file (QA / side-by-side comparison).
// usage: npx tsx scripts/qa/retarget-range.ts data/pose/gdm/surah_fatihah.json 0 61 public/data/_qa/fatihah.json
import fs from "node:fs";
import { retargetRange, type Capture } from "../mocap/lib";

const [file, a, b, out] = process.argv.slice(2);
const cap = JSON.parse(fs.readFileSync(file, "utf8")) as Capture;
const f0 = Math.max(0, Math.round(+a * cap.fps)), f1 = Math.min(cap.frames.length - 1, Math.round(+b * cap.fps));
const clip = retargetRange(cap, f0, f1, "QA");
if (!clip) throw new Error("no dominant hand in range");
fs.writeFileSync(out, JSON.stringify(clip));
console.log("wrote", out, f1 - f0 + 1, "frames", "L:", !!clip.L);

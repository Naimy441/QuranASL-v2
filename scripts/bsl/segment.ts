// Turn OCR'd caption references + hand activity into per-ayah time segments for
// every BSL Qur'an Project video.   npx tsx scripts/bsl/segment.ts
// Output: data/bsl/segments.json  [{ video, surah, ayah (0 = bismillah), start, end, conf }]
import fs from "node:fs";
import path from "node:path";
import { activity, type Capture } from "../mocap/lib";

const playlist = fs.readFileSync("data/bsl-playlist.tsv", "utf8").trim().split("\n").map((l) => l.split("\t"));
const surahOf = (title: string) => (/kursi/i.test(title) ? 2 : parseInt(title));

interface Seg { video: string; surah: number; ayah: number; start: number; end: number; conf: number }
const out: Seg[] = [];
const report: string[] = [];
for (const [id, , title] of playlist) {
  const ocrFile = `data/bsl/ocr/${id}.json`, poseFile = `data/pose/bsl/${id}.json`;
  if (!fs.existsSync(ocrFile) || !fs.existsSync(poseFile)) continue;
  const surah = surahOf(title);
  const ocr = JSON.parse(fs.readFileSync(ocrFile, "utf8")) as { labels: (number | string | null)[][] };
  let cap: Capture;
  try {
    cap = JSON.parse(fs.readFileSync(poseFile, "utf8"));
  } catch {
    continue; // still being written
  }
  const act = activity(cap);

  // caption runs (consecutive frames with the same reference)
  const runs: { key: number; t0: number; t1: number; n: number }[] = [];
  for (const l of ocr.labels) {
    const t = l[0] as number;
    const key = l[3] === "bismillah" ? 0 : l[1] === surah ? (l[2] as number) : -1;
    if (key < 0) continue;
    const last = runs[runs.length - 1];
    if (last && last.key === key && t - last.t1 < 6) {
      last.t1 = t;
      last.n++;
    } else runs.push({ key, t0: t, t1: t, n: 1 });
  }
  // Ayat appear in order: keep the heaviest non-decreasing chain of runs (drops OCR misreads).
  const bestW = runs.map((r) => r.n), prev = runs.map(() => -1);
  for (let i = 0; i < runs.length; i++)
    for (let j = 0; j < i; j++)
      if (runs[j].key <= runs[i].key && bestW[j] + runs[i].n > bestW[i]) {
        bestW[i] = bestW[j] + runs[i].n;
        prev[i] = j;
      }
  let end = bestW.indexOf(Math.max(...bestW, 0));
  const chain: typeof runs = [];
  while (end >= 0) {
    chain.unshift(runs[end]);
    end = prev[end];
  }
  const win = new Map<number, [number, number, number]>();
  for (const r of chain) {
    const w = win.get(r.key);
    if (!w) win.set(r.key, [r.t0, r.t1, r.n]);
    else {
      w[1] = r.t1;
      w[2] += r.n;
    }
  }
  const keys = [...win.keys()].sort((a, b) => win.get(a)![0] - win.get(b)![0]);
  // smoothed activity for finding pauses between ayat
  const sm = act.map((_, i) => {
    let sum = 0, c = 0;
    for (let k = -3; k <= 3; k++) if (act[i + k] !== undefined) { sum += act[i + k]; c++; }
    return sum / c;
  });
  const at = (t: number) => Math.max(0, Math.min(sm.length - 1, Math.round(t * cap.fps)));
  // boundary between consecutive captions = calmest moment between them
  const bounds: number[] = [];
  for (let i = 0; i + 1 < keys.length; i++) {
    const [, b0] = win.get(keys[i])!;
    const [a1] = win.get(keys[i + 1])!;
    const lo = Math.min(b0 - 0.5, a1 - 0.5), hi = Math.max(b0 + 0.5, a1 + 0.5);
    let best = at((b0 + a1) / 2);
    for (let f = at(lo); f <= at(hi); f++) if (sm[f] < sm[best]) best = f;
    bounds.push(best / cap.fps);
  }
  keys.forEach((k, i) => {
    const [a, b, hits] = win.get(k)!;
    let start = i > 0 ? bounds[i - 1] : a - 2.5;
    let end = i < bounds.length ? bounds[i] : b + 4;
    // trim resting frames at both ends
    let f0 = at(start), f1 = at(end);
    while (f0 < f1 && sm[f0] < 0.25) f0++;
    while (f1 > f0 && sm[f1] < 0.25) f1--;
    if (f1 - f0 > 4) {
      start = Math.max(start, f0 / cap.fps - 0.25);
      end = Math.min(end, f1 / cap.fps + 0.25);
    }
    if (end - start < 0.8) return;
    const conf = Math.min(1, hits / Math.max(1, (b - a) * 2 + 1)) * (f1 - f0 > 4 ? 1 : 0.5);
    out.push({ video: id, surah, ayah: k, start: +start.toFixed(2), end: +end.toFixed(2), conf: +conf.toFixed(2) });
  });
  const expected = JSON.parse(fs.readFileSync(`public/data/surah/${surah}.json`, "utf8")).ayahs;
  const got = keys.filter((k) => k > 0).length;
  report.push(`${String(surah).padStart(3)} ${title.padEnd(36)} ${got}/${surah === 2 ? 1 : expected} ayat${win.has(0) ? " +bismillah" : ""}`);
}
fs.mkdirSync("data/bsl", { recursive: true });
fs.writeFileSync("data/bsl/segments.json", JSON.stringify(out, null, 0));
console.log(report.join("\n"));
console.log(`segments: ${out.length}`);

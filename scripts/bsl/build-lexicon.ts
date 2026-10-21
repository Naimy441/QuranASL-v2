// Turn spotted BSL signs (data/bsl/spot.json, from spot.py) into the BSL dictionary:
// each sign's motion window is retargeted onto the avatar and keyed to the English
// words it renders.   npx tsx scripts/bsl/build-lexicon.ts [minAuc=0.75]
// A sign is kept when its AUC clears minAuc + 0.6/support: with only a handful of
// positive ayat a perfect score is easy to get by chance, so rarer words must score higher.
// Output: public/data/bsl/lexicon/index.json + one clip per sign.
import fs from "node:fs";
import { retargetRange, type Capture } from "../mocap/lib";

interface Spot { video: string; start: number; end: number; src: [number, number]; auc: number; support: number; recall: number }
const MIN_AUC = +(process.argv[2] ?? 0.75);
const spots = JSON.parse(fs.readFileSync("data/bsl/spot.json", "utf8")) as Record<string, Spot>;
const segs = JSON.parse(fs.readFileSync("data/bsl/segments.json", "utf8")) as { surah: number; ayah: number }[];

/** Same normalisation as spot.py's norm_word. */
function norm(w: string) {
  w = w.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z']/g, "").replace(/^'+|'+$/g, "");
  if (w.endsWith("'s")) w = w.slice(0, -2);
  for (const [suf, rep] of [["ies", "y"], ["ied", "y"], ["ing", ""], ["ness", ""], ["ed", ""], ["es", ""], ["s", ""]] as const)
    if (w.length > 4 && w.endsWith(suf) && !w.endsWith("ss")) return w.slice(0, -suf.length) + rep;
  return w;
}

// surface forms of every stem in the segmented ayat
const forms = new Map<string, Map<string, number>>();
const seen = new Set<string>();
for (const s of segs) {
  const key = `${s.surah}:${s.ayah}`;
  if (s.ayah < 1 || seen.has(key)) continue;
  seen.add(key);
  const sur = JSON.parse(fs.readFileSync(`public/data/surah/${s.surah}.json`, "utf8"));
  const en: string = sur.ayat[s.ayah - 1]?.en ?? "";
  for (const raw of en.split(/[\s\-—,.;:!?"“”()[\]]+/)) {
    const surface = raw.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z']/g, "").replace(/^'+|'+$/g, "");
    if (!surface) continue;
    const st = norm(surface);
    const m = forms.get(st) ?? new Map<string, number>();
    m.set(surface, (m.get(surface) ?? 0) + 1);
    forms.set(st, m);
  }
}

const OUT = "public/data/bsl/lexicon";
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
const caps = new Map<string, Capture>();
const index: { id: string; gloss: string; en: string[]; score: number; support: number; conf: "high" | "med" | "low" }[] = [];
const kept = Object.entries(spots).filter(([, s]) => s.auc >= MIN_AUC + 0.6 / s.support).sort((a, b) => b[1].auc - a[1].auc);
for (const [stem, s] of kept) {
  const f = [...(forms.get(stem)?.entries() ?? [])].sort((a, b) => b[1] - a[1]).map(([w]) => w.replace(/'/g, ""));
  if (!f.length) continue;
  // display the base form ("destroy" rather than "destroyed") when the ayat contain it
  const gloss = [...f].sort((a, b) => a.length - b.length)[0].toUpperCase();
  const id = `BSL:${gloss}`;
  if (!caps.has(s.video)) {
    caps.clear();
    caps.set(s.video, JSON.parse(fs.readFileSync(`data/pose/bsl/${s.video}.json`, "utf8")));
  }
  const cap = caps.get(s.video)!;
  // a little context either side so the sign starts and ends cleanly
  const f0 = Math.max(0, Math.round((s.start - 0.12) * cap.fps)), f1 = Math.min(cap.frames.length - 1, Math.round((s.end + 0.12) * cap.fps));
  const clip = retargetRange(cap, f0, f1, id);
  if (!clip) continue;
  fs.writeFileSync(`${OUT}/${gloss}.json`, JSON.stringify(clip)); // ids contain ":", so files are named by gloss
  index.push({ id, gloss, en: [...new Set(f.slice(0, 6))], score: s.auc, support: s.support, conf: s.auc >= 0.9 && s.support >= 10 ? "high" : s.auc >= 0.82 ? "med" : "low" });
}
fs.writeFileSync(`${OUT}/index.json`, JSON.stringify(index));
console.log(`BSL dictionary: ${index.length} signs (of ${Object.keys(spots).length} spotted, auc >= ${MIN_AUC} + 0.6/support)`);
console.log(index.slice(0, 40).map((s) => `${s.gloss}(${s.score})`).join(" "));

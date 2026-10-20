// Fill every ayah that has no hand-authored gloss with an automatic draft gloss,
// merge with curated glosses, and write public/data/gloss/{n}.json + index.json.
// Run after build-gloss.ts.  Prints the most frequent unknown English words.
import fs from "node:fs";
import path from "node:path";
import { getLexicon } from "../src/lib/asl/lexicon";
import { autoGloss } from "../src/lib/asl/autogloss";
import { parseGloss, resolveTokens } from "../src/lib/asl/gloss";

const OUT = path.join(process.cwd(), "public/data/gloss");
const lex = getLexicon();
const unknown = new Map<string, number>();
const index: Record<number, { ayat: number; covered: number; curated: number; source: string; lexical: number }> = {};
let tok = 0, lexical = 0;
for (let n = 1; n <= 114; n++) {
  const surah = JSON.parse(fs.readFileSync(`public/data/surah/${n}.json`, "utf8"));
  const file = path.join(OUT, `${n}.json`);
  const existing = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : { surah: n, ayat: {} };
  let curated = 0, sLex = 0, sTok = 0;
  for (const a of surah.ayat) {
    const cur = existing.ayat[a.n];
    if (cur && cur.source !== "auto") { curated++; }
    else {
      const r = autoGloss(a.en, lex);
      for (const u of r.unknown) unknown.set(u, (unknown.get(u) ?? 0) + 1);
      existing.ayat[a.n] = { gloss: r.gloss, source: "auto" };
    }
    for (const t of resolveTokens(parseGloss(existing.ayat[a.n].gloss), lex)) {
      if (t.status === "pause") continue;
      sTok++;
      if (t.status === "ok" || t.status === "fs") sLex++;
    }
  }
  tok += sTok; lexical += sLex;
  index[n] = { ayat: surah.ayat.length, covered: surah.ayat.length, curated, source: curated === surah.ayat.length ? "curated" : curated ? "mixed" : "auto", lexical: +(sLex / sTok).toFixed(3) };
  fs.writeFileSync(file, JSON.stringify(existing));
}
fs.writeFileSync(path.join(OUT, "index.json"), JSON.stringify(index));
console.log(`whole Quran: tokens=${tok} lexical=${lexical} (${((lexical / tok) * 100).toFixed(1)}%)`);
const top = [...unknown.entries()].sort((a, b) => b[1] - a[1]);
console.log(`unknown word types: ${top.length}`);
console.log(top.slice(0, +(process.argv[2] ?? 150)).map(([w, c]) => `${w}:${c}`).join(" "));

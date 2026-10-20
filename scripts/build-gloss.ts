// Validate hand-authored gloss files (data/gloss/NNN.txt) and compile them to
// public/data/gloss/NNN.json. Reports glosses missing from the lexicon.
import fs from "node:fs";
import path from "node:path";
import { getLexicon } from "../src/lib/asl/lexicon";
import { parseGloss, resolveTokens } from "../src/lib/asl/gloss";

const SRC = path.join(process.cwd(), "data/gloss");
const OUT = path.join(process.cwd(), "public/data/gloss");
fs.mkdirSync(OUT, { recursive: true });
const lex = getLexicon();
const surahs = JSON.parse(fs.readFileSync("public/data/surahs.json", "utf8")) as { n: number; ayahs: number }[];
const missing = new Map<string, number>();
const fallback = new Map<string, string[]>();
let totalAyat = 0, totalTokens = 0, okTokens = 0;
const index: Record<number, { ayat: number; covered: number; source: string }> = {};
const freq = new Map<string, number>();

for (const f of fs.readdirSync(SRC).filter((f) => /^\d{3}\.txt$/.test(f)).sort()) {
  const n = parseInt(f);
  const meta = surahs.find((s) => s.n === n)!;
  const ayat: Record<string, { gloss: string; source: string }> = {};
  for (const line of fs.readFileSync(path.join(SRC, f), "utf8").split("\n")) {
    const m = /^(\d+):\s*(.*)$/.exec(line.trim());
    if (!m) continue;
    const a = +m[1];
    if (a < 1 || a > meta.ayahs) console.warn(`${n}:${a} out of range`);
    ayat[a] = { gloss: m[2].trim(), source: "curated" };
    for (const t of resolveTokens(parseGloss(m[2]), lex)) {
      if (t.status === "pause") continue;
      totalTokens++;
      if (t.status === "ok" || t.status === "fs") okTokens++;
      if (t.status === "ok") freq.set(t.gloss, (freq.get(t.gloss) ?? 0) + 1);
      if (t.status === "fallback" || t.status === "missing") {
        missing.set(t.gloss, (missing.get(t.gloss) ?? 0) + 1);
        const refs = fallback.get(t.gloss) ?? [];
        if (refs.length < 3) refs.push(`${n}:${a}`);
        fallback.set(t.gloss, refs);
      }
    }
  }
  const count = Object.keys(ayat).length;
  if (count !== meta.ayahs) console.warn(`surah ${n}: ${count}/${meta.ayahs} ayat glossed`);
  totalAyat += count;
  index[n] = { ayat: meta.ayahs, covered: count, source: "curated" };
  fs.writeFileSync(path.join(OUT, `${n}.json`), JSON.stringify({ surah: n, ayat }));
}
fs.writeFileSync(path.join(OUT, "index.json"), JSON.stringify(index));
fs.writeFileSync(path.join(OUT, "freq.json"), JSON.stringify(Object.fromEntries([...freq.entries()].sort((a, b) => b[1] - a[1]))));
console.log(`ayat=${totalAyat} tokens=${totalTokens} lexical=${okTokens} (${((okTokens / totalTokens) * 100).toFixed(1)}%)`);
const sorted = [...missing.entries()].sort((a, b) => b[1] - a[1]);
console.log(`missing glosses: ${sorted.length}`);
console.log(sorted.map(([g, c]) => `${g}(${c}) ${fallback.get(g)!.join(" ")}`).join("\n"));

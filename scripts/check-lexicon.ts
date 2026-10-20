// Compile every lexicon entry and report errors / stats.
import { getLexicon } from "../src/lib/asl/lexicon";
const lex = getLexicon();
let ok = 0;
const errs: string[] = [];
for (const [id] of lex.entries) {
  try {
    const s = lex.compile(id);
    if (!(s.dur > 0)) throw new Error("zero duration");
    if (s.R.some((k) => k.pos.some((v) => !Number.isFinite(v)))) throw new Error("NaN position");
    ok++;
  } catch (e) {
    errs.push(`${id}: ${(e as Error).message}`);
  }
}
console.log(`entries=${lex.entries.size} ok=${ok} errors=${errs.length}`);
for (const e of errs) console.log("  " + e);

// Flag two-handed signs whose hands occupy (nearly) the same space at some key.
import { getLexicon } from "../src/lib/asl/lexicon";
const lex = getLexicon();
const out: string[] = [];
for (const [id, e] of lex.entries) {
  if (e.def.startsWith("=")) continue;
  const s = lex.compile(id);
  if (!s.L) continue;
  let minD = 9;
  for (const k of s.R) {
    // nearest-in-time L key
    const l = s.L.reduce((a, b) => (Math.abs(b.t - k.t) < Math.abs(a.t - k.t) ? b : a));
    const d = Math.hypot(k.pos[0] - l.pos[0], k.pos[1] - l.pos[1], k.pos[2] - l.pos[2]);
    minD = Math.min(minD, d);
  }
  if (minD < 0.06) out.push(`${id} ${minD.toFixed(3)}  ${e.def}`);
}
console.log(out.join("\n"));
console.log(out.length, "suspect");

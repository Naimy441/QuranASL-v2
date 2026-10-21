import { autoGloss } from "../asl/autogloss";
import { getBslLexicon } from "./lexicon";

/**
 * Rough BSL draft of an ayah from its English meaning, using only signs learned
 * from the BSL recordings. The English→gloss rules are shared with ASL, so ASL
 * structural tokens (pointing loci, possessives) and pronouns the BSL dictionary
 * lacks are dropped rather than fingerspelled. Explicit fingerspelling (names) stays.
 */
export function bslDraft(english: string): string {
  const lex = getBslLexicon();
  const g = autoGloss(english, lex, { unknown: "drop" }).gloss;
  const out: string[] = [];
  for (const piece of g.split(/\s+/)) {
    if (!piece) continue;
    // keep punctuation, tag openers/closers and fingerspelled names
    if (/^[,.?!]$/.test(piece) || /^\[[a-z-]+:$/.test(piece) || piece === "]" || piece.startsWith("fs:")) {
      out.push(piece);
      continue;
    }
    const open = piece.match(/^\[[a-z-]+:/)?.[0] ?? "";
    const close = piece.match(/\]+[,.?!]?$/)?.[0] ?? "";
    const core = piece.slice(open.length, piece.length - close.length).replace(/\+$/, "").split(":")[0];
    if (lex.has(core)) out.push(piece);
    else if (open || close) out.push(open + close); // keep the bracket structure balanced
  }
  return out
    .join(" ")
    .replace(/\s+\]/g, "]")
    .replace(/([A-Z0-9\]])([,.?!])/g, "$1 $2")
    .replace(/\[[a-z-]+:\s*\]/g, "") // empty tags
    .replace(/(\s*[,.]){2,}/g, (m) => m.trim().slice(-1))
    .replace(/^\s*[,.]\s*/, "")
    .replace(/\s+/g, " ")
    .trim();
}

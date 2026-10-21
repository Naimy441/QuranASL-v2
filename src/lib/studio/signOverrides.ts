import { getLexicon } from "../asl/lexicon";
import type { SignEntry } from "../asl/types";
import { signDraftEntries } from "../review/store";

// Sign definitions edited in the Studio, as lexicon entries (kept per browser until
// exported). Storage lives in src/lib/review/store.ts; an edited definition keeps
// the rest of the dictionary entry (category, captured motion, notes).
export function loadSignOverrides(): Record<string, SignEntry> {
  const lex = getLexicon();
  const out: Record<string, SignEntry> = {};
  for (const d of signDraftEntries()) {
    const prev = lex.get(d.id);
    out[d.id] = { ...(prev ?? {}), ...d, en: d.en?.length ? d.en : (prev?.en ?? []), conf: d.conf ?? prev?.conf ?? "low" };
  }
  return out;
}

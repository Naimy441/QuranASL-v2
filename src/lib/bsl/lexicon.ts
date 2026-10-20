// BSL dictionary. Its core comes from signs learned from the Al Isharah BSL
// Qur'an Project recordings (scripts/bsl/spot.py → public/data/bsl/lexicon):
// each learned sign is captured motion keyed to the English words it renders.
import { Lexicon } from "../asl/lexicon";
import { registerMocap, type MocapClip } from "../asl/mocap";
import type { SignEntry } from "../asl/types";
import { bslFingerspell } from "./alphabet";

export interface LearnedSign {
  id: string; // e.g. "BSL:ALLAH"
  gloss: string; // display gloss, e.g. "ALLAH"
  en: string[]; // English words/phrases it renders
  score: number; // discriminability from spotting (0-1)
  support: number; // number of ayat it was found in
  conf: "high" | "med" | "low";
}

let _lex: Lexicon | null = null;
export function getBslLexicon(): Lexicon {
  return (_lex ??= new Lexicon([], "bsl", bslFingerspell));
}

let loading: Promise<void> | null = null;
/** Load learned BSL signs (motion clips + metadata) into the BSL lexicon. */
export function loadBslLexicon(base = "/data/bsl/lexicon"): Promise<void> {
  if (loading) return loading;
  loading = fetch(`${base}/index.json`)
    .then((r) => (r.ok ? r.json() : []))
    .then(async (signs: LearnedSign[]) => {
      const lex = getBslLexicon();
      await Promise.all(
        signs.map(async (s) => {
          try {
            const clip: MocapClip = await fetch(`${base}/${encodeURIComponent(s.id)}.json`).then((r) => r.json());
            registerMocap(clip);
            const entry: SignEntry = { id: s.gloss, def: "=fs:" + s.gloss.replace(/[^A-Z]/g, ""), en: s.en, conf: s.conf, mocap: s.id, cat: "learned", note: `learned from ${s.support} ayat (score ${s.score.toFixed(2)})` };
            lex.add(entry);
          } catch {}
        }),
      );
    })
    .catch(() => undefined);
  return loading;
}

import { compileSign } from "./dsl";
import { fingerspell } from "./fingerspell";
import { getMocap, mocapSign } from "./mocap";
import { buildTimeline } from "./timeline";
import type { CompiledSign, SignEntry } from "./types";
import { LEX_CORE } from "./lexicon/core";
import { LEX_RELIGION } from "./lexicon/religion";
import { LEX_NATURE } from "./lexicon/nature";
import { LEX_MORE } from "./lexicon/more";
import { LEX_EXTRA } from "./lexicon/extra";
import { LEX_ISLAMIC, LEX_PROPHETS, MOCAP_LINKS } from "./lexicon/islamic";

/*
 * Lexicon line format (one sign per line, "#" comments):
 *   GLOSS | def | english words (comma separated) | conf | note
 * def is either DSL (see dsl.ts) or "=A+B" to concatenate existing signs.
 */
export function parseLexicon(src: string, cat: string): SignEntry[] {
  const out: SignEntry[] = [];
  for (const raw of src.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const fields = line.split("|").map((s) => s.trim());
    const id = fields.shift()!;
    // The definition may itself contain "|" (non-dominant hand track): take
    // every following field that looks like DSL.
    const defParts: string[] = [];
    while (fields.length && (fields[0].includes("@") || fields[0].startsWith("=") || (defParts.length > 0 && fields[0].startsWith(";")))) defParts.push(fields.shift()!);
    const def = defParts.join(" | ");
    const [en, conf, note] = fields;
    if (!id || !def) continue;
    const mocap = /mocap:([A-Z0-9-]+)/.exec(note ?? "")?.[1];
    out.push({
      id,
      def,
      mocap,
      en: en ? en.split(",").map((w) => w.trim().toLowerCase()).filter(Boolean) : [],
      conf: (conf as SignEntry["conf"]) || "med",
      note: note || undefined,
      cat,
    });
  }
  return out;
}

export type SignLang = "asl" | "bsl";

export class Lexicon {
  entries = new Map<string, SignEntry>();
  byWord = new Map<string, string[]>();
  lang: SignLang;
  /** Fingerspelling for this language (ASL one-handed, BSL two-handed). */
  spell: (word: string) => CompiledSign;

  constructor(entries: SignEntry[] = [], lang: SignLang = "asl", spell: (word: string) => CompiledSign = fingerspell) {
    this.lang = lang;
    this.spell = spell;
    for (const e of entries) this.add(e);
  }

  add(e: SignEntry) {
    this.entries.set(e.id, e);
    for (const w of e.en ?? []) {
      const list = this.byWord.get(w) ?? [];
      if (!list.includes(e.id)) list.push(e.id);
      this.byWord.set(w, list);
    }
  }

  has(id: string) {
    return this.entries.has(id);
  }

  get(id: string) {
    return this.entries.get(id);
  }

  /** Variants of a gloss: "ALLAH", "ALLAH.2", ... */
  variants(id: string): SignEntry[] {
    const base = id.split(".")[0];
    return [...this.entries.values()].filter((e) => e.id === base || e.id.startsWith(base + "."));
  }

  /** When false, captured motion is ignored and parametric definitions are used. */
  useMocap = true;

  compile(id: string, seen: string[] = []): CompiledSign {
    const e = this.entries.get(id);
    if (!e) throw new Error(`No sign "${id}"`);
    const clip = this.useMocap && e.mocap ? getMocap(e.mocap) : undefined;
    if (clip) return mocapSign(clip);
    if (e.def.startsWith("=")) {
      if (seen.includes(id)) throw new Error(`Cyclic compound ${[...seen, id].join(" > ")}`);
      const parts = e.def
        .slice(1)
        .split("+")
        .map((p) => p.trim())
        .map((p) => (p.startsWith("fs:") ? this.spell(p.slice(3)) : this.compile(p, [...seen, id])));
      return combineSigns(id, parts);
    }
    return compileSign(id, e.def);
  }
}

/** Concatenate signs into one compiled sign (used for compounds). */
export function combineSigns(id: string, parts: CompiledSign[]): CompiledSign {
  const tl = buildTimeline(
    parts.map((s, i) => ({ index: i, label: s.id, kind: "sign" as const, sign: s })),
    { lead: 0, tail: 0 },
  );
  // Drop the synthetic rest keys at both ends.
  const R = tl.R.slice(1, -1);
  const hasL = parts.some((p) => p.L);
  const L = hasL ? tl.L.slice(1, -1) : null;
  const t0 = R[0].t;
  const shift = (k: (typeof R)[number]) => ({ ...k, t: k.t - t0 });
  const R2 = R.map(shift);
  const L2 = L ? L.map(shift).filter((k) => k.t >= 0) : null;
  const end = Math.max(...R2.map((k) => k.t + k.hold));
  const faces = tl.faces.length ? Object.assign({}, ...parts.map((p) => p.face ?? {})) : undefined;
  return { id, dur: end, R: R2, L: L2 && L2.length ? L2 : null, face: faces };
}

let _lex: Lexicon | null = null;
export function getLexicon(): Lexicon {
  if (_lex) return _lex;
  _lex = new Lexicon([
    ...parseLexicon(LEX_CORE, "core"),
    ...parseLexicon(LEX_RELIGION, "religion"),
    ...parseLexicon(LEX_NATURE, "nature"),
    ...parseLexicon(LEX_MORE, "more"),
    ...parseLexicon(LEX_EXTRA, "extra"),
    ...parseLexicon(LEX_ISLAMIC, "religion"),
    ...parseLexicon(LEX_PROPHETS, "names"),
  ]);
  // Link captured community signs from mocap
  for (const [gloss, clip] of Object.entries(MOCAP_LINKS)) {
    const e = _lex.get(gloss);
    if (!e || e.mocap) continue;
    e.mocap = clip;
  }
  return _lex;
}

/** Allow the Studio to override/add entries at runtime. */
export function overrideEntries(entries: SignEntry[]) {
  const lex = getLexicon();
  for (const e of entries) lex.add(e);
}

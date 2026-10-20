import { getLexicon, type Lexicon } from "./lexicon";
import { LOCATIONS } from "./body";
import type { CompiledSign, FaceState } from "./types";
import { buildTimeline, type SeqUnit, type Timeline } from "./timeline";

/*
 * ASL gloss notation used for ayah translations
 * ---------------------------------------------
 *   ALLAH MERCY            signs (lexicon glosses, variants as ALLAH.2)
 *   fs:MUSA                fingerspelling
 *   HOUSE:a  GIVE:b        place / direct the sign toward locus a, b, c, up
 *   WORK+                  reduplicated (repeated) sign
 *   DAY+JUDGE              compound written inline
 *   [top: NAME ALLAH]      non-manual marker over a span; tags combine: [neg emph: ...]
 *   ,  .  //               short pause, sentence pause
 *   (text)                 translator note, ignored by the animator
 *
 * Non-manual tags: top yn wh rhq cond neg aff emph awe sad happy warn fear
 *                  mm cha oo puff th rs-a rs-b rs-c gaze-a gaze-b gaze-up
 */

export interface GlossToken {
  index: number;
  raw: string;
  kind: "sign" | "fs" | "pause";
  gloss: string; // canonical id (sign) / word (fs)
  locus?: string;
  repeat?: boolean;
  tags: string[]; // active non-manual tags
  pause?: number;
}

export const NMS: Record<string, Partial<FaceState>> = {
  top: { browUp: 0.7, headPitch: -0.07 },
  yn: { browUp: 1, headPitch: 0.1, eyesWide: 0.2 },
  q: { browUp: 1, headPitch: 0.1 },
  cond: { browUp: 0.9, headPitch: 0.06 },
  wh: { browDown: 0.9, headPitch: 0.07, headRoll: 0.05, squint: 0.2 },
  rhq: { browUp: 0.9, headRoll: 0.06 },
  neg: { shake: 0.12, browDown: 0.4, frown: 0.3 },
  aff: { nod: 0.07 },
  emph: { squint: 0.45, browDown: 0.3, lipsPress: 0.4 },
  awe: { browInnerUp: 0.35, eyesWide: 0.25, headPitch: 0.05 },
  sad: { browInnerUp: 0.9, frown: 0.6, headPitch: 0.06 },
  happy: { smile: 0.9, browUp: 0.3 },
  warn: { browDown: 0.8, squint: 0.4, frown: 0.3 },
  fear: { eyesWide: 0.8, browInnerUp: 0.6 },
  mm: { purse: 0.3, lipsPress: 0.3 },
  cha: { mouthOpen: 0.6, eyesWide: 0.3 },
  oo: { purse: 0.8, squint: 0.3 },
  puff: { puff: 1 },
  th: { mouthOpen: 0.3, teeth: 0.5 },
  "rs-a": { torsoYaw: -0.22, headYaw: -0.18, gazeX: -0.3 },
  "rs-b": { torsoYaw: 0.22, headYaw: 0.18, gazeX: 0.3 },
  "rs-c": { headPitch: -0.06, browUp: 0.3, torsoPitch: -0.03 },
  "gaze-a": { gazeX: -0.6, headYaw: -0.08 },
  "gaze-b": { gazeX: 0.6, headYaw: 0.08 },
  "gaze-up": { gazeY: 0.7, headPitch: -0.12 },
};

const PAUSES: Record<string, number> = { ",": 0.18, ".": 0.45, "//": 0.5, ";": 0.3, "?": 0.45, "!": 0.35 };

export function parseGloss(src: string): GlossToken[] {
  const out: GlossToken[] = [];
  const stack: string[][] = [];
  // strip notes
  src = src.replace(/\([^)]*\)/g, " ");
  const re = /\[([a-z0-9\- ]+):|\]|\/\/|[,.;?!]|[^\s\[\],.;?!]+/gi;
  let m: RegExpExecArray | null;
  let idx = 0;
  while ((m = re.exec(src))) {
    const t = m[0];
    if (m[1] !== undefined) {
      stack.push(m[1].trim().split(/\s+/));
      continue;
    }
    if (t === "]") {
      stack.pop();
      continue;
    }
    const tags = stack.flat();
    if (t in PAUSES) {
      out.push({ index: idx++, raw: t, kind: "pause", gloss: t, tags, pause: PAUSES[t] });
      continue;
    }
    if (/^fs:/i.test(t)) {
      out.push({ index: idx++, raw: t, kind: "fs", gloss: t.slice(3).toUpperCase(), tags });
      continue;
    }
    let g = t;
    let repeat = false;
    if (g.endsWith("+")) {
      repeat = true;
      g = g.replace(/\++$/, "");
    }
    let locus: string | undefined;
    const lm = /^(.+?):([a-e]|up|down)$/.exec(g);
    if (lm) {
      g = lm[1];
      locus = lm[2];
    }
    out.push({ index: idx++, raw: t, kind: "sign", gloss: g.toUpperCase().replace(/^IX$/, "IX-a"), locus, repeat, tags });
  }
  return out;
}

/** Shift signs made in neutral space toward a locus. */
function placeAtLocus(s: CompiledSign, locus: string): CompiledSign {
  const L = LOCATIONS[locus];
  const N = LOCATIONS.neutral;
  if (!L) return s;
  // locus x is in "outward for right hand" units: right hand out = -X
  const dx = -(L[0] - N[0]) * 0.55;
  const dz = (L[2] - N[2]) * 0.4;
  const dy = (L[1] - N[1]) * 0.5;
  const move = (k: CompiledSign["R"][number]) =>
    k.pos[2] > 0.2 ? { ...k, pos: [k.pos[0] + dx, k.pos[1] + dy, k.pos[2] + dz] as [number, number, number] } : k;
  return { ...s, id: s.id + ":" + locus, R: s.R.map(move), L: s.L ? s.L.map(move) : null };
}

function repeatSign(s: CompiledSign): CompiledSign {
  const shift = (k: CompiledSign["R"][number]) => ({ ...k, t: k.t + s.dur + 0.05 });
  return {
    ...s,
    id: s.id + "+",
    dur: s.dur * 2 + 0.05,
    R: [...s.R, ...s.R.map(shift)],
    L: s.L ? [...s.L, ...s.L.map(shift)] : null,
  };
}

export interface ResolvedToken extends GlossToken {
  status: "ok" | "fs" | "fallback" | "missing" | "pause";
  conf?: "high" | "med" | "low";
  sign?: CompiledSign;
  error?: string;
}

/** Resolve tokens against the lexicon. Unknown glosses fall back to fingerspelling and are flagged. */
export function resolveTokens(tokens: GlossToken[], lex: Lexicon = getLexicon()): ResolvedToken[] {
  return tokens.map((t) => {
    if (t.kind === "pause") return { ...t, status: "pause" as const };
    if (t.kind === "fs") return { ...t, status: "fs" as const, sign: lex.spell(t.gloss), conf: "high" as const };
    try {
      let sign: CompiledSign;
      let conf: ResolvedToken["conf"];
      let status: ResolvedToken["status"] = "ok";
      if (lex.has(t.gloss)) {
        sign = lex.compile(t.gloss);
        conf = lex.get(t.gloss)?.conf;
      } else if (t.gloss.includes("+") && t.gloss.split("+").every((p) => lex.has(p))) {
        const parts = t.gloss.split("+");
        const tmp = new (lex.constructor as typeof Lexicon)([], lex.lang, lex.spell);
        for (const p of parts) tmp.add(lex.get(p)!);
        tmp.add({ id: t.gloss, def: "=" + t.gloss });
        sign = tmp.compile(t.gloss);
        conf = parts.some((p) => lex.get(p)?.conf === "low") ? "low" : "med";
      } else {
        const word = t.gloss.split(/[.\-]/)[0].replace(/[^A-Z]/g, "");
        if (!word) return { ...t, status: "missing" as const, error: "unknown gloss" };
        sign = lex.spell(word);
        status = "fallback";
        conf = "low";
      }
      if (t.locus) sign = placeAtLocus(sign, t.locus);
      if (t.repeat) sign = repeatSign(sign);
      return { ...t, status, conf, sign };
    } catch (e) {
      return { ...t, status: "missing" as const, error: (e as Error).message };
    }
  });
}

export interface GlossAnimation {
  tokens: ResolvedToken[];
  timeline: Timeline;
}

function mergeFaces(tags: string[]): Partial<FaceState> {
  const f: Partial<FaceState> = {};
  for (const tag of tags) {
    const n = NMS[tag];
    if (!n) continue;
    for (const [k, v] of Object.entries(n)) {
      const key = k as keyof FaceState;
      if (Math.abs(v as number) > Math.abs((f[key] as number) ?? 0)) f[key] = v as number;
    }
  }
  return f;
}

/** Full pipeline: gloss text → resolved tokens → animated timeline. */
export function animateGloss(src: string, lex: Lexicon = getLexicon()): GlossAnimation {
  const tokens = resolveTokens(parseGloss(src), lex);
  const units: SeqUnit[] = tokens.map((t) =>
    t.status === "pause"
      ? { index: t.index, label: t.raw, kind: "pause", pause: t.pause }
      : t.sign
        ? { index: t.index, label: t.gloss, kind: t.status === "ok" ? "sign" : t.status === "missing" ? "missing" : "fs", sign: t.sign }
        : { index: t.index, label: t.gloss, kind: "missing", pause: 0.4 },
  );
  const timeline = buildTimeline(units);
  // Non-manual spans: contiguous runs of tokens sharing the same tag set.
  const byIndex = new Map(timeline.items.map((it) => [it.index, it]));
  let run: { tags: string; start: number; end: number } | null = null;
  const flush = () => {
    if (run && run.tags) timeline.faces.push({ start: run.start - 0.12, end: run.end + 0.05, face: mergeFaces(run.tags.split(" ")), ramp: 0.15 });
  };
  for (const t of tokens) {
    const it = byIndex.get(t.index);
    if (!it) continue;
    const key = t.tags.join(" ");
    if (run && run.tags === key) run.end = it.end;
    else {
      flush();
      run = { tags: key, start: it.start, end: it.end };
    }
  }
  flush();
  return { tokens, timeline };
}

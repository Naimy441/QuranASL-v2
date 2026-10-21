import { useCallback, useRef, useState } from "react";
import { parseGloss, type GlossToken } from "@/lib/asl/gloss";

// Gloss <-> editable chips, and an undo / redo history over them.

export type Chip = Pick<GlossToken, "kind" | "gloss" | "locus" | "repeat" | "tags"> & { key: number };
let keySeq = 1;
export const newKey = () => keySeq++;

export function toChips(src: string): Chip[] {
  return parseGloss(src).map((t) => ({ key: keySeq++, kind: t.kind, gloss: t.kind === "pause" ? t.raw : t.gloss, locus: t.locus, repeat: t.repeat, tags: [...t.tags] }));
}

export function chipText(c: Chip) {
  if (c.kind === "pause") return c.gloss;
  if (c.kind === "fs") return "fs:" + c.gloss;
  return c.gloss + (c.locus ? ":" + c.locus : "") + (c.repeat ? "+" : "");
}

/** Serialise chips back to gloss notation, grouping runs that share facial grammar. */
export function toGloss(chips: Chip[]): string {
  const out: string[] = [];
  let i = 0;
  while (i < chips.length) {
    const key = chips[i].tags.join(" ");
    let j = i;
    while (j < chips.length && chips[j].tags.join(" ") === key) j++;
    // trailing pauses stay outside the bracket
    let k = j;
    while (k > i && chips[k - 1].kind === "pause" && key) k--;
    const body = chips.slice(i, k).map(chipText).join(" ");
    if (key && body) out.push(`[${[...new Set(chips[i].tags)].join(" ")}: ${body}]`);
    else if (body) out.push(body);
    out.push(...chips.slice(k, j).map(chipText));
    i = j;
  }
  return out.join(" ").replace(/\s+([,.?!])/g, " $1");
}

/**
 * Chip list with undo / redo. `reset` starts a new history (new ayah);
 * `set` records a step unless it only changes text being typed (`coalesce`).
 */
export function useChipHistory() {
  const [state, setState] = useState<{ past: Chip[][]; cur: Chip[]; future: Chip[][] }>({ past: [], cur: [], future: [] });
  const lastTag = useRef<string | null>(null);
  const set = useCallback((next: Chip[], coalesce?: string) => {
    setState((s) => {
      const merge = coalesce && lastTag.current === coalesce;
      lastTag.current = coalesce ?? null;
      return { past: merge ? s.past : [...s.past.slice(-99), s.cur], cur: next, future: [] };
    });
  }, []);
  const reset = useCallback((next: Chip[]) => {
    lastTag.current = null;
    setState({ past: [], cur: next, future: [] });
  }, []);
  const undo = useCallback(() => {
    lastTag.current = null;
    setState((s) => (s.past.length ? { past: s.past.slice(0, -1), cur: s.past[s.past.length - 1], future: [s.cur, ...s.future] } : s));
  }, []);
  const redo = useCallback(() => {
    lastTag.current = null;
    setState((s) => (s.future.length ? { past: [...s.past, s.cur], cur: s.future[0], future: s.future.slice(1) } : s));
  }, []);
  return { chips: state.cur, set, reset, undo, redo, canUndo: state.past.length > 0, canRedo: state.future.length > 0 };
}

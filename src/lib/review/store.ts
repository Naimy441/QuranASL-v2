"use client";

import { useSyncExternalStore } from "react";
import type { SignEntry } from "../asl/types";
import { ayahKey, eventId, legacyReviews } from "./status";
import type { GlossDraft, ReviewEvent, ReviewKind, ReviewStatus, SignDraft } from "./types";

// This browser's contributions: gloss and sign drafts plus review events, kept in
// one localStorage key until they are exported as a bundle (or written to the
// repository by the dev API). Recordings live in IndexedDB (recordings.ts).

const KEY = "qasl-contrib";
const BACKUP = "qasl-legacy-backup";

export interface LocalState {
  version: 2;
  reviewer: string;
  /** "surah:ayah" → draft */
  glosses: Record<string, GlossDraft>;
  /** sign id → draft */
  signs: Record<string, SignDraft>;
  events: ReviewEvent[];
  /** event ids already handed over (exported or written to the repo) */
  sent: string[];
}

const empty = (): LocalState => ({ version: 2, reviewer: "", glosses: {}, signs: {}, events: [], sent: [] });

let cache: LocalState | null = null;
const listeners = new Set<() => void>();

function read(): LocalState {
  if (cache) return cache;
  let s = empty();
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) s = { ...empty(), ...(JSON.parse(raw) as Partial<LocalState>) };
  } catch {}
  cache = migrateLegacy(s);
  return cache;
}

function write(next: LocalState) {
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
  for (const l of listeners) l();
}

/**
 * Fold the first Studio's keys (qasl-gloss-N, qasl-signs, qasl-reviews,
 * qasl-reviewer) into this store. The raw values are kept under
 * qasl-legacy-backup before the old keys are removed, so nothing is lost.
 */
function migrateLegacy(s: LocalState): LocalState {
  let ls: Storage;
  try {
    ls = localStorage;
  } catch {
    return s;
  }
  const legacy: Record<string, string> = {};
  for (let i = 0; i < ls.length; i++) {
    const k = ls.key(i)!;
    if (/^qasl-gloss-\d+$/.test(k) || k === "qasl-signs" || k === "qasl-reviews" || k === "qasl-reviewer") legacy[k] = ls.getItem(k) ?? "";
  }
  if (!Object.keys(legacy).length) return s;
  const parse = <T,>(v: string | undefined, d: T): T => {
    try {
      return v ? (JSON.parse(v) as T) : d;
    } catch {
      return d;
    }
  };
  const out: LocalState = { ...s, glosses: { ...s.glosses }, signs: { ...s.signs }, events: [...s.events] };
  const at = new Date().toISOString();
  for (const [k, v] of Object.entries(legacy)) {
    const m = /^qasl-gloss-(\d+)$/.exec(k);
    if (!m) continue;
    for (const [a, gloss] of Object.entries(parse<Record<string, string>>(v, {}))) {
      const key = ayahKey(+m[1], +a);
      if (!out.glosses[key] && typeof gloss === "string") out.glosses[key] = { surah: +m[1], ayah: +a, gloss, base: null, at };
    }
  }
  for (const [id, e] of Object.entries(parse<Record<string, SignEntry>>(legacy["qasl-signs"], {}))) {
    if (!out.signs[id] && e?.def) out.signs[id] = { id, def: e.def, en: e.en, conf: e.conf, note: e.note, base: null, at };
  }
  const known = new Set(out.events.map((e) => e.id));
  for (const e of legacyReviews(parse<Record<string, unknown>>(legacy["qasl-reviews"], {}))) if (!known.has(e.id)) out.events.push(e);
  if (!out.reviewer && legacy["qasl-reviewer"]) out.reviewer = legacy["qasl-reviewer"];
  try {
    const prev = parse<Record<string, string>>(ls.getItem(BACKUP) ?? undefined, {});
    ls.setItem(BACKUP, JSON.stringify({ ...prev, ...legacy }));
    ls.setItem(KEY, JSON.stringify(out));
    for (const k of Object.keys(legacy)) ls.removeItem(k);
  } catch {
    // storage full or blocked: keep the legacy keys, use the merged view in memory
  }
  return out;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      cb();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

const serverSnapshot = empty();
/** Live view of this browser's contributions. */
export function useLocalReview(): LocalState {
  return useSyncExternalStore(subscribe, read, () => serverSnapshot);
}
export const getLocalReview = read;

// ---- reviewer ----
export function setReviewer(name: string) {
  write({ ...read(), reviewer: name.trim() });
}

// ---- gloss drafts ----
export function saveGlossDraft(surah: number, ayah: number, gloss: string, base: string | null) {
  const s = read();
  const key = ayahKey(surah, ayah);
  const glosses = { ...s.glosses };
  if (base !== null && gloss.trim() === base.trim()) delete glosses[key];
  else glosses[key] = { surah, ayah, gloss, base: s.glosses[key]?.base ?? base, by: s.reviewer || undefined, at: new Date().toISOString() };
  write({ ...s, glosses });
}
export function dropGlossDraft(surah: number, ayah: number) {
  const s = read();
  const glosses = { ...s.glosses };
  delete glosses[ayahKey(surah, ayah)];
  write({ ...s, glosses });
}

// ---- sign drafts ----
export function saveSignDraft(d: Omit<SignDraft, "at" | "by">) {
  const s = read();
  const prev = s.signs[d.id];
  write({ ...s, signs: { ...s.signs, [d.id]: { ...d, base: prev ? prev.base : d.base, by: s.reviewer || undefined, at: new Date().toISOString() } } });
}
export function dropSignDraft(id: string) {
  const s = read();
  const signs = { ...s.signs };
  delete signs[id];
  write({ ...s, signs });
}

// ---- review events ----
export function addReview(kind: ReviewKind, key: string, status: ReviewStatus, snap: { gloss?: string; def?: string; comment?: string }): ReviewEvent {
  const s = read();
  const e: ReviewEvent = { id: eventId(), kind, key, status, by: s.reviewer || "anonymous", at: new Date().toISOString(), ...clean(snap) };
  write({ ...s, events: [...s.events, e] });
  return e;
}
/** Withdraw one of this browser's own, not yet sent, events. */
export function removeReview(id: string) {
  const s = read();
  if (s.sent.includes(id)) return;
  write({ ...s, events: s.events.filter((e) => e.id !== id) });
}
export function markSent(ids: string[]) {
  const s = read();
  write({ ...s, sent: [...new Set([...s.sent, ...ids])] });
}

/** Bring another reviewer's bundle (or an older export) into this browser. */
export function importContributions(p: { glosses: GlossDraft[]; signs: SignDraft[]; reviews: ReviewEvent[] }) {
  const s = read();
  const glosses = { ...s.glosses };
  for (const g of p.glosses) glosses[ayahKey(g.surah, g.ayah)] = g;
  const signs = { ...s.signs };
  for (const d of p.signs) signs[d.id] = d;
  const known = new Set(s.events.map((e) => e.id));
  write({ ...s, glosses, signs, events: [...s.events, ...p.reviews.filter((e) => !known.has(e.id))] });
}

function clean<T extends object>(o: T): Partial<T> {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== "")) as Partial<T>;
}

// ---- compatibility views (viewer, dictionary) ----
export function glossDraftsFor(surah: number): Record<string, string> {
  const out: Record<string, string> = {};
  for (const d of Object.values(read().glosses)) if (d.surah === surah) out[d.ayah] = d.gloss;
  return out;
}
export function signDraftEntries(): SignEntry[] {
  return Object.values(read().signs).map((d) => ({ id: d.id, def: d.def, en: d.en ?? [], conf: d.conf, note: d.note, src: `studio:${d.by ?? "anon"}` }));
}

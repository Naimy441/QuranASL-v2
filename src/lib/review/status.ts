import type { ReviewEvent, ReviewKind, ReviewStatus, SharedReviews } from "./types";

// Pure helpers over review events (shared by the browser, the dev API and
// scripts/merge-contributions.ts).

export const STATUS_LABEL: Record<ReviewStatus, string> = {
  draft: "Draft",
  "needs-changes": "Needs changes",
  approved: "Approved",
};

export const eventId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
export const ayahKey = (surah: number, ayah: number) => `${surah}:${ayah}`;
const ref = (kind: ReviewKind, key: string) => `${kind}|${key}`;

/** Union of event lists, deduplicated by id, oldest first. */
export function mergeEvents(...lists: ReviewEvent[][]): ReviewEvent[] {
  const byId = new Map<string, ReviewEvent>();
  for (const l of lists) for (const e of l) if (e && e.id && !byId.has(e.id)) byId.set(e.id, e);
  return [...byId.values()].sort((a, b) => a.at.localeCompare(b.at));
}

export interface ItemState {
  status: ReviewStatus;
  latest?: ReviewEvent;
  /** latest approval (may be older than `latest`) */
  approved?: ReviewEvent;
  history: ReviewEvent[];
}

const EMPTY: ItemState = { status: "draft", history: [] };

/** Index events by item: status = status of the latest event. */
export class ReviewIndex {
  private items = new Map<string, ItemState>();
  constructor(public events: ReviewEvent[]) {
    for (const e of events) {
      const k = ref(e.kind, e.key);
      const s = this.items.get(k) ?? { status: "draft" as ReviewStatus, history: [] };
      s.history.push(e);
      s.latest = e;
      s.status = e.status;
      if (e.status === "approved") s.approved = e;
      this.items.set(k, s);
    }
  }
  get(kind: ReviewKind, key: string): ItemState {
    return this.items.get(ref(kind, key)) ?? EMPTY;
  }
  /** Every reviewed item of a kind, keyed by item key. */
  all(kind: ReviewKind): Map<string, ItemState> {
    const out = new Map<string, ItemState>();
    for (const [k, v] of this.items) if (k.startsWith(kind + "|")) out.set(k.slice(kind.length + 1), v);
    return out;
  }
}

/**
 * Status as it applies to the CURRENT text: an approval of an older gloss or
 * definition does not carry over to an edited one.
 */
export function effectiveStatus(s: ItemState, current: string | undefined): { status: ReviewStatus; stale: boolean } {
  if (s.status !== "approved" || current === undefined) return { status: s.status, stale: false };
  const snap = s.latest?.gloss ?? s.latest?.def;
  if (snap !== undefined && norm(snap) !== norm(current)) return { status: "draft", stale: true };
  return { status: "approved", stale: false };
}
const norm = (s: string) => s.replace(/\s+/g, " ").trim();

/** Accept the v2 file and the original `{ "s:a": { by, at, gloss } }` sign-off map. */
export function normalizeShared(raw: unknown): ReviewEvent[] {
  if (!raw || typeof raw !== "object") return [];
  const r = raw as Partial<SharedReviews> & Record<string, unknown>;
  if (Array.isArray(r.events)) return r.events.filter(isEvent);
  return legacyReviews(r as Record<string, unknown>);
}

/** Convert legacy sign-offs ({ "1:2": { by, at, gloss } }) into approval events. */
export function legacyReviews(map: Record<string, unknown>): ReviewEvent[] {
  const out: ReviewEvent[] = [];
  for (const [key, v] of Object.entries(map)) {
    const o = v as { by?: string; at?: string; gloss?: string } | null;
    if (!o || typeof o !== "object" || !/^\d+:\d+$/.test(key)) continue;
    const at = o.at ?? new Date(0).toISOString();
    out.push({ id: `legacy-${key}-${at}`, kind: "ayah", key, status: "approved", by: o.by ?? "unknown", at, gloss: o.gloss, comment: "Signed off in the first Studio" });
  }
  return out;
}

export function isEvent(e: unknown): e is ReviewEvent {
  const o = e as ReviewEvent;
  return !!o && typeof o.id === "string" && (o.kind === "ayah" || o.kind === "sign") && typeof o.key === "string" && ["draft", "needs-changes", "approved"].includes(o.status) && typeof o.at === "string";
}

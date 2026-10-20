import type { SignEntry } from "../asl/types";

// Sign definitions edited in the Studio and review sign-offs (kept per browser until exported).
const SIGNS = "qasl-signs";
const REVIEWS = "qasl-reviews";

function read<T>(k: string, d: T): T {
  try {
    return JSON.parse(localStorage.getItem(k) ?? "") as T;
  } catch {
    return d;
  }
}
function write(k: string, v: unknown) {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {}
}

export const loadSignOverrides = () => read<Record<string, SignEntry>>(SIGNS, {});
export function saveSignOverride(e: SignEntry) {
  const all = loadSignOverrides();
  all[e.id] = e;
  write(SIGNS, all);
}

export interface Review { by: string; at: string; gloss: string }
export const loadReviews = () => read<Record<string, Review>>(REVIEWS, {});
export function saveReview(key: string, r: Review) {
  const all = loadReviews();
  all[key] = r;
  write(REVIEWS, all);
}

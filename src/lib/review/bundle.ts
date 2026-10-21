import { isEvent, legacyReviews } from "./status";
import { BUNDLE_FORMAT, BUNDLE_VERSION, type ContributionBundle, type GlossDraft, type SignDraft } from "./types";

// Contribution bundle: parsing and normalisation (pure; used in the browser, the
// dev API and scripts/merge-contributions.ts).

/**
 * Accept a v2 bundle or the first Studio's export
 * ({ exportedAt, reviewer, glosses: { n: { a: gloss } }, signs: { id: entry }, reviews: { "s:a": {...} } }).
 * Throws with a readable message when the file is not a contribution bundle.
 */
export function normalizeBundle(raw: unknown): ContributionBundle {
  if (!raw || typeof raw !== "object") throw new Error("Not a contribution file (expected a JSON object).");
  const r = raw as Record<string, unknown>;
  const now = new Date().toISOString();
  if (r.format === BUNDLE_FORMAT) {
    if (r.version !== BUNDLE_VERSION) throw new Error(`Unsupported bundle version ${String(r.version)} (this build reads version ${BUNDLE_VERSION}).`);
    const b = r as unknown as ContributionBundle;
    return {
      format: BUNDLE_FORMAT,
      version: BUNDLE_VERSION,
      exportedAt: b.exportedAt ?? now,
      reviewer: b.reviewer ?? "",
      glosses: (b.glosses ?? []).filter(isGloss),
      signs: (b.signs ?? []).filter(isSign),
      reviews: (b.reviews ?? []).filter(isEvent),
      recordings: (b.recordings ?? []).filter((x) => x && typeof x.id === "string" && typeof x.sign === "string"),
    };
  }
  // version 1 (no format field)
  if (!("glosses" in r || "signs" in r || "reviews" in r)) throw new Error("Not a QuranASL contribution file.");
  const at = typeof r.exportedAt === "string" ? r.exportedAt : now;
  const by = typeof r.reviewer === "string" ? r.reviewer : "";
  const glosses: GlossDraft[] = [];
  for (const [n, ayat] of Object.entries((r.glosses as Record<string, Record<string, string>>) ?? {}))
    for (const [a, gloss] of Object.entries(ayat ?? {})) if (typeof gloss === "string") glosses.push({ surah: +n, ayah: +a, gloss, base: null, by, at });
  const signs: SignDraft[] = [];
  for (const [id, e] of Object.entries((r.signs as Record<string, { def?: string; en?: string[]; conf?: SignDraft["conf"]; note?: string }>) ?? {}))
    if (e && typeof e.def === "string") signs.push({ id, def: e.def, en: e.en, conf: e.conf, note: e.note, base: null, by, at });
  return { format: BUNDLE_FORMAT, version: BUNDLE_VERSION, exportedAt: at, reviewer: by, glosses, signs, reviews: legacyReviews((r.reviews as Record<string, unknown>) ?? {}), recordings: [] };
}

function isGloss(g: GlossDraft) {
  return !!g && Number.isInteger(g.surah) && g.surah >= 1 && g.surah <= 114 && Number.isInteger(g.ayah) && g.ayah >= 1 && typeof g.gloss === "string";
}
function isSign(s: SignDraft) {
  return !!s && typeof s.id === "string" && /^[A-Z0-9][A-Z0-9.\-]*$/.test(s.id) && typeof s.def === "string";
}

export const bundleFileName = (reviewer: string) =>
  `quranasl-contributions-${(reviewer || "anon").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "anon"}-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, "")}.json`;

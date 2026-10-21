/**
 * Tajweed coloring and segmentation engine.
 * Exact color palette, KFGQPC Hafs font alignment, and combining-mark shaping
 * ported from quranki.
 */

export type Scheme = "light" | "dark";

export interface SchemeColors {
  light: string;
  dark: string;
}

export interface TajweedSegment {
  t: string;
  c?: string;
}

export const TajweedColors: Record<string, SchemeColors> = {
  ham_wasl: { light: "#AAAAAA", dark: "#8B8F8C" },
  slnt: { light: "#AAAAAA", dark: "#8B8F8C" },
  laam_shamsiyah: { light: "#AAAAAA", dark: "#8B8F8C" },
  madda_normal: { light: "#537FFF", dark: "#7C9CFF" },
  madda_permissible: { light: "#4050FF", dark: "#6B7BFF" },
  madda_necessary: { light: "#000EBC", dark: "#5C6DFF" },
  madda_obligatory_mottasel: { light: "#2144C1", dark: "#6079E8" },
  madda_obligatory_monfasel: { light: "#2144C1", dark: "#6079E8" },
  qalaqah: { light: "#1B9E4B", dark: "#3DDB70" },
  ikhafa: { light: "#D61F26", dark: "#FF5A5F" },
  ikhafa_shafawi: { light: "#D61F26", dark: "#FF5A5F" },
  idgham_shafawi: { light: "#8B2FC9", dark: "#C77DFF" },
  idgham_ghunnah: { light: "#8B2FC9", dark: "#C77DFF" },
  idgham_wo_ghunnah: { light: "#8A8A8A", dark: "#B0B0B0" },
  idgham_mutajanisayn: { light: "#8A8A8A", dark: "#B0B0B0" },
  idgham_mutaqaribayn: { light: "#8A8A8A", dark: "#B0B0B0" },
  iqlab: { light: "#1876D2", dark: "#4EA3F5" },
  ghunnah: { light: "#FF7E1E", dark: "#FF9A47" },
};

export const TajweedRuleNames: Record<string, string> = {
  ham_wasl: "Hamzat al-Wasl",
  slnt: "Silent Letter",
  laam_shamsiyah: "Lam Shamsiyyah",
  madda_normal: "Normal Prolongation (2)",
  madda_permissible: "Permissible Prolongation (2, 4, 6)",
  madda_obligatory_mottasel: "Connected Obligatory Prolongation (4-5)",
  madda_obligatory_monfasel: "Separated Obligatory Prolongation (4-5)",
  madda_necessary: "Necessary Prolongation (6)",
  qalaqah: "Qalqalah (Echoing)",
  ikhafa: "Ikhfa' (Hiding / Nasal)",
  ikhafa_shafawi: "Ikhfa' Shafawi (Labial Hiding)",
  idgham_shafawi: "Idgham Shafawi (Labial Merging)",
  idgham_ghunnah: "Idgham with Ghunnah",
  idgham_wo_ghunnah: "Idgham without Ghunnah",
  idgham_mutajanisayn: "Idgham Mutajanisayn",
  idgham_mutaqaribayn: "Idgham Mutaqaribayn",
  iqlab: "Iqlab (Conversion to Meem)",
  ghunnah: "Ghunnah (Nasalization 2)",
};

export interface TajweedLegendCategory {
  title: string;
  rules: { key: string; name: string; colorKey: string }[];
}

export const TAJWEED_LEGEND: TajweedLegendCategory[] = [
  {
    title: "Prolongation (Madd)",
    rules: [
      { key: "madda_normal", name: "Normal Madd (2 counts)", colorKey: "madda_normal" },
      { key: "madda_permissible", name: "Permissible Madd (2, 4, 6 counts)", colorKey: "madda_permissible" },
      { key: "madda_obligatory_mottasel", name: "Obligatory Madd (4-5 counts)", colorKey: "madda_obligatory_mottasel" },
      { key: "madda_necessary", name: "Necessary Madd (6 counts)", colorKey: "madda_necessary" },
    ],
  },
  {
    title: "Echoing (Qalqalah)",
    rules: [
      { key: "qalaqah", name: "Qalqalah (ق ط ب ج د)", colorKey: "qalaqah" },
    ],
  },
  {
    title: "Nasalization & Hiding",
    rules: [
      { key: "ghunnah", name: "Ghunnah (2 counts)", colorKey: "ghunnah" },
      { key: "ikhafa", name: "Ikhfa' & Ikhfa' Shafawi", colorKey: "ikhafa" },
      { key: "iqlab", name: "Iqlab (Noon/tanween to Meem)", colorKey: "iqlab" },
    ],
  },
  {
    title: "Assimilation (Idgham)",
    rules: [
      { key: "idgham_ghunnah", name: "Idgham with Ghunnah", colorKey: "idgham_ghunnah" },
      { key: "idgham_wo_ghunnah", name: "Idgham without Ghunnah", colorKey: "idgham_wo_ghunnah" },
    ],
  },
  {
    title: "Silent & Solar",
    rules: [
      { key: "ham_wasl", name: "Hamzat al-Wasl & Silent Letters", colorKey: "ham_wasl" },
    ],
  },
];

const LEADING_COMBINING_MARKS = /^[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]+/;

/**
 * KFGQPC Hafs v18 maps U+06EB (ishmam) to a wide spacing glyph with no GPOS,
 * which splits Yusuf 12:11's تَأْمَنَّا. U+06EC is the same font's zero-width
 * filled high stop.
 */
export function shapeQpcArabic(text: string): string {
  return text.replace(/\u06EB/g, "\u06EC");
}

/**
 * Keeps Quranic diacritics and recitation marks attached to their base letter
 * across colored tajweed run boundaries.
 */
export function attachLeadingCombiningMarks(segments: TajweedSegment[]): TajweedSegment[] {
  if (segments.length <= 1) return segments;
  const out: TajweedSegment[] = [];
  for (const segment of segments) {
    const previous = out[out.length - 1];
    const marks = previous ? segment.t.match(LEADING_COMBINING_MARKS)?.[0] : undefined;
    if (marks) {
      previous.t += marks;
      const rest = segment.t.slice(marks.length);
      if (rest) out.push({ ...segment, t: rest });
    } else {
      out.push({ ...segment });
    }
  }
  return out;
}

export interface TajweedRun {
  t: string;
  c?: string;
}

/**
 * Prepares the segments of a single word for rendering in the Quran font.
 */
export function prepareWordSegments(wordSegments: TajweedSegment[]): TajweedSegment[] {
  const joinedArabic = shapeQpcArabic(wordSegments.map((s) => s.t).join(""));
  const keepJoined = /[\u06EA\u06EC]/.test(joinedArabic);
  if (keepJoined) {
    return [{ t: joinedArabic }];
  }
  return attachLeadingCombiningMarks(
    wordSegments.map((s) => ({ ...s, t: shapeQpcArabic(s.t) }))
  );
}

/**
 * Flattens an entire ayah's words into minimal contiguous runs.
 * Merges consecutive uncolored text and matching rules to eliminate
 * redundant DOM nodes (reducing <span> counts by ~90%).
 */
export function flattenAyahRuns(words: TajweedSegment[][]): TajweedRun[] {
  const runs: TajweedRun[] = [];
  for (let w = 0; w < words.length; w++) {
    if (w > 0) {
      const last = runs[runs.length - 1];
      if (last && !last.c) {
        last.t += " ";
      } else {
        runs.push({ t: " " });
      }
    }
    const prepared = prepareWordSegments(words[w]);
    for (let s = 0; s < prepared.length; s++) {
      const seg = prepared[s];
      if (!seg.t) continue;
      const last = runs[runs.length - 1];
      if (last && last.c === seg.c) {
        last.t += seg.t;
      } else {
        runs.push({ t: seg.t, c: seg.c });
      }
    }
  }
  return runs;
}

/**
 * Merges word segments into minimal runs for word-by-word cards.
 */
export function mergeWordRuns(wordSegments: TajweedSegment[]): TajweedRun[] {
  const prepared = prepareWordSegments(wordSegments);
  const runs: TajweedRun[] = [];
  for (const seg of prepared) {
    if (!seg.t) continue;
    const last = runs[runs.length - 1];
    if (last && last.c === seg.c) {
      last.t += seg.t;
    } else {
      runs.push({ t: seg.t, c: seg.c });
    }
  }
  return runs;
}

// Bounded in-memory cache for loaded surah tajweed datasets (max 5 surahs kept in RAM)
const MAX_CACHED_SURAHS = 5;
const surahTajweedCache = new Map<number, Promise<TajweedSegment[][][]>>();
let bismillahTajweedCache: Promise<TajweedSegment[][]> | null = null;

export function loadSurahTajweed(surahNumber: number): Promise<TajweedSegment[][][]> {
  const existing = surahTajweedCache.get(surahNumber);
  if (existing) {
    // Refresh position for LRU
    surahTajweedCache.delete(surahNumber);
    surahTajweedCache.set(surahNumber, existing);
    return existing;
  }
  if (surahTajweedCache.size >= MAX_CACHED_SURAHS) {
    const oldestKey = surahTajweedCache.keys().next().value;
    if (oldestKey !== undefined) surahTajweedCache.delete(oldestKey);
  }
  const promise = fetch(`/data/tajweed/${surahNumber}.json`).then((r) => {
    if (!r.ok) throw new Error(`Tajweed data not found for surah ${surahNumber}`);
    return r.json();
  });
  surahTajweedCache.set(surahNumber, promise);
  return promise;
}

export function loadBismillahTajweed(): Promise<TajweedSegment[][]> {
  if (!bismillahTajweedCache) {
    bismillahTajweedCache = fetch(`/data/tajweed/bismillah.json`).then((r) => {
      if (!r.ok) throw new Error("Bismillah tajweed data not found");
      return r.json();
    });
  }
  return bismillahTajweedCache;
}

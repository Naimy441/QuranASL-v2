// Client-side loaders for the static data in /public/data.
export interface SurahMeta {
  n: number; name: string; nameAr: string; meaning: string; ayahs: number; place: string; bismillah: boolean;
}
export interface Word { ar: string; tr: string; en: string; root?: string; lem?: string }
export interface Ayah { n: number; juz: number; ar: string; en: string; w: Word[] }
export interface Surah extends SurahMeta { ayat: Ayah[] }
export interface GlossEntry { gloss: string; source: "curated" | "auto" | "community"; flags?: string[] }
export interface GlossFile { surah: number; ayat: Record<string, GlossEntry> }
export interface GlossIndex { [surah: number]: { ayat: number; covered: number; source: string; curated?: number } }

const cache = new Map<string, Promise<unknown>>();
function getJSON<T>(url: string): Promise<T> {
  if (!cache.has(url)) {
    cache.set(url, fetch(url).then((r) => {
      if (!r.ok) throw new Error(`${r.status} ${url}`);
      return r.json();
    }));
  }
  return cache.get(url) as Promise<T>;
}

export const loadSurahList = () => getJSON<SurahMeta[]>("/data/surahs.json");
export const loadSurah = (n: number) => getJSON<Surah>(`/data/surah/${n}.json`);
export const loadGlossIndex = () => getJSON<GlossIndex>("/data/gloss/index.json");
export async function loadGloss(n: number): Promise<GlossFile> {
  try {
    return await getJSON<GlossFile>(`/data/gloss/${n}.json`);
  } catch {
    return { surah: n, ayat: {} };
  }
}

export const BISMILLAH_GLOSS = "[awe: BISMILLAH , GRACIOUS , MERCIFUL] .";

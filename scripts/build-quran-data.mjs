// Turns data/raw (quran.com API + Quranic Arabic Corpus morphology) into the
// compact per-surah JSON the app loads: public/data/surahs.json, public/data/surah/{n}.json
import fs from "node:fs/promises";
import path from "node:path";

const RAW = path.join(process.cwd(), "data/raw");
const OUT = path.join(process.cwd(), "public/data");
await fs.mkdir(path.join(OUT, "surah"), { recursive: true });

// word location "s:a:w" -> { root, lemma }
const morph = new Map();
for (const line of (await fs.readFile(path.join(RAW, "quran-morphology.txt"), "utf8")).split("\n")) {
  const [loc, , , feats] = line.split("\t");
  if (!feats) continue;
  const key = loc.split(":").slice(0, 3).join(":");
  const root = /ROOT:([^|]+)/.exec(feats)?.[1];
  const lemma = /LEM:([^|]+)/.exec(feats)?.[1];
  if (root && !morph.has(key)) morph.set(key, { root, lemma });
}

const clean = (t) =>
  t.replace(/<sup[^>]*>.*?<\/sup>/g, "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

const chapters = JSON.parse(await fs.readFile(path.join(RAW, "chapters.json"), "utf8"));
const index = [];
for (const c of chapters) {
  const verses = JSON.parse(await fs.readFile(path.join(RAW, `surah-${c.id}.json`), "utf8"));
  const ayahs = verses.map((v) => ({
    n: v.verse_number,
    juz: v.juz_number,
    ar: v.text_uthmani.trim(),
    en: clean(v.translations[0].text),
    w: v.words
      .filter((w) => w.char_type_name === "word")
      .map((w) => {
        const m = morph.get(w.location) ?? {};
        return { ar: w.text_uthmani, tr: w.transliteration?.text ?? "", en: w.translation?.text ?? "", root: m.root, lem: m.lemma };
      }),
  }));
  const meta = {
    n: c.id,
    name: c.name_simple,
    nameAr: c.name_arabic,
    meaning: c.translated_name.name,
    ayahs: c.verses_count,
    place: c.revelation_place,
    bismillah: c.bismillah_pre,
  };
  index.push(meta);
  await fs.writeFile(path.join(OUT, "surah", `${c.id}.json`), JSON.stringify({ ...meta, ayat: ayahs }));
}
await fs.writeFile(path.join(OUT, "surahs.json"), JSON.stringify(index));
console.log("wrote", index.length, "surahs");

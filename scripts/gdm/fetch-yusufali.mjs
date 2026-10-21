// Translations whose wording Global Deaf Muslim burns into its videos (Yusuf Ali in the
// surah videos, M.A.S. Abdel Haleem in the Al-Fatiha demo), used only to align OCR'd
// subtitles to ayat.   node scripts/gdm/fetch-yusufali.mjs [--haleem] 1 100 101 ...
import fs from "node:fs";
const haleem = process.argv.includes("--haleem");
const id = haleem ? 85 : 22;
const out = haleem ? "data/raw/haleem.json" : "data/raw/yusufali.json";
const have = fs.existsSync(out) ? JSON.parse(fs.readFileSync(out, "utf8")) : {};
for (const s of process.argv.slice(2).filter((a) => !a.startsWith("--")).map(Number)) {
  if (have[s]) continue;
  const r = await fetch(`https://api.quran.com/api/v4/verses/by_chapter/${s}?translations=${id}&per_page=300&fields=verse_number`);
  const j = await r.json();
  have[s] = Object.fromEntries(j.verses.map((v) => [v.verse_number, v.translations[0].text.replace(/<[^>]+>/g, "")]));
  console.log(s, Object.keys(have[s]).length, "ayat");
}
fs.mkdirSync("data/raw", { recursive: true });
fs.writeFileSync(out, JSON.stringify(have, null, 1));

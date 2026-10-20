// Downloads Qur'an text (Uthmani), Sahih International translation, and
// word-by-word glosses for all 114 surahs from the public quran.com API.
// Output: data/raw/chapters.json, data/raw/surah-{n}.json
import fs from "node:fs/promises";
import path from "node:path";

const OUT = path.join(process.cwd(), "data/raw");
const API = "https://api.quran.com/api/v4";

async function get(url, tries = 4) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url);
      if (r.ok) return r.json();
      throw new Error(`${r.status} ${url}`);
    } catch (e) {
      if (i === tries - 1) throw e;
      await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
    }
  }
}

await fs.mkdir(OUT, { recursive: true });
const { chapters } = await get(`${API}/chapters?language=en`);
await fs.writeFile(path.join(OUT, "chapters.json"), JSON.stringify(chapters, null, 1));

async function fetchSurah(n) {
  const file = path.join(OUT, `surah-${n}.json`);
  try { await fs.access(file); return; } catch {}
  const verses = [];
  for (let page = 1; ; page++) {
    const d = await get(
      `${API}/verses/by_chapter/${n}?words=true&translations=20&word_fields=text_uthmani,location&fields=text_uthmani&per_page=50&page=${page}`
    );
    verses.push(...d.verses);
    if (!d.pagination.next_page) break;
  }
  await fs.writeFile(file, JSON.stringify(verses));
  console.log("surah", n, verses.length);
}

const queue = Array.from({ length: 114 }, (_, i) => i + 1);
await Promise.all(Array.from({ length: 6 }, async () => {
  while (queue.length) await fetchSurah(queue.shift());
}));
console.log("done");

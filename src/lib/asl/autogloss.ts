import { getLexicon, type Lexicon } from "./lexicon";

/*
 * Rule-based English → ASL gloss drafting, used for ayat that no human has
 * glossed yet. It is deliberately conservative: it keeps English clause order,
 * drops words ASL does not sign (articles, copulas, auxiliaries), maps phrases
 * and words onto the lexicon, fingerspells names, adds non-manual markers for
 * negation / questions / conditionals, and leaves unknown content words in
 * place so the viewer flags them as gaps.
 */

const STOP = new Set(
  ("a an the is are was were be been being am of 's do does did has have had will shall would should " +
    "it its that which who whom whose what's there their's to upon unto very indeed verily then so thus " +
    "just even also as such than both either neither whereas while lest whereby thereof therein thereby herein " +
    "o oh yes ah let us may any rather forth thereupon whatever whoever whichever however because although though")
    .split(" "),
);
// words we keep even though they look like function words
const KEEP = new Set(["not", "no", "never", "nor", "all", "every", "each", "before", "after", "until", "with", "without", "from", "in", "on", "above", "under", "between", "if", "when", "where", "why", "how", "who", "what", "and", "but", "or", "for"]);

const NAMES: Record<string, string> = {
  moses: "MUSA", abraham: "IBRAHIM", noah: "NUH", jesus: "ISA", mary: "MARYAM", joseph: "YUSUF", jacob: "YAQUB",
  isaac: "ISHAQ", ishmael: "ISMAIL", david: "DAWUD", solomon: "SULAYMAN", aaron: "HARUN", lot: "LUT", jonah: "YUNUS",
  job: "AYYUB", john: "YAHYA", zechariah: "ZAKARIYYA", elias: "ILYAS", elisha: "ALYASA", adam: "ADAM", hud: "HUD",
  salih: "SALIH", shuayb: "SHUAYB", idrees: "IDRIS", "dhul-kifl": "DHULKIFL", muhammad: "MUHAMMAD", ahmad: "AHMAD",
  pharaoh: "FIRAWN", haman: "HAMAN", korah: "QARUN", gabriel: "JIBRIL", michael: "MIKAIL", iblees: "IBLIS",
  makkah: "MAKKAH", madinah: "MADINAH", egypt: "MISR", israel: "ISRAIL", thamud: "THAMUD", aad: "AAD", "'aad": "AAD",
  luqman: "LUQMAN", "dhul-qarnayn": "DHULQARNAYN", gog: "YAJUJ", magog: "MAJUJ", uzair: "UZAIR", badr: "BADR",
  uhud: "UHUD", hunayn: "HUNAYN", sinai: "SINAI", quraysh: "QURAYSH", "abu lahab": "ABULAHAB", saba: "SABA",
};

const LETTERS: Record<string, string> = {
  alif: "A", lam: "L", meem: "M", mim: "M", ra: "R", raa: "R", ta: "T", taa: "T", ha: "H", haa: "H", seen: "S",
  sad: "S", saad: "S", qaf: "Q", nun: "N", noon: "N", kaf: "K", ya: "Y", yaa: "Y", ayn: "A", "'ayn": "A",
};

const PRONOUN: Record<string, string> = {
  i: "ME", me: "ME", my: "MY", mine: "MY", myself: "MYSELF",
  you: "YOU", your: "YOUR", yours: "YOUR", yourself: "YOURSELF", yourselves: "YOU-ALL", ye: "YOU-ALL",
  he: "IX-a", him: "IX-a", his: "POSS-a", himself: "SELF", she: "IX-a", her: "POSS-a", herself: "SELF",
  they: "THEY", them: "THEY", their: "THEIR", theirs: "THEIR", themselves: "THEY SELF",
  we: "WE", us: "WE", our: "OUR", ours: "OUR", ourselves: "WE SELF",
  this: "THIS", these: "THIS", those: "THEY", that: "THAT",
};

function stem(w: string): string[] {
  const c = [w];
  if (w.endsWith("ies")) c.push(w.slice(0, -3) + "y");
  if (w.endsWith("es")) c.push(w.slice(0, -2));
  if (w.endsWith("s") && !w.endsWith("ss")) c.push(w.slice(0, -1));
  if (w.endsWith("ied")) c.push(w.slice(0, -3) + "y");
  if (w.endsWith("ed")) c.push(w.slice(0, -2), w.slice(0, -1));
  if (w.endsWith("ing")) c.push(w.slice(0, -3), w.slice(0, -3) + "e");
  if (w.endsWith("ly")) c.push(w.slice(0, -2));
  if (w.endsWith("er")) c.push(w.slice(0, -2), w.slice(0, -1));
  if (w.endsWith("ness")) c.push(w.slice(0, -4));
  return c;
}

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[ʿʾ’‘`]/g, "'");

/** Use a name sign from the dictionary when one exists, otherwise fingerspell. */
const nameSign = (name: string, lex: Lexicon) => (lex.has(name) ? name : "fs:" + name);

export interface AutoGlossResult {
  gloss: string;
  unknown: string[];
}

export function autoGloss(english: string, lex: Lexicon = getLexicon()): AutoGlossResult {
  const text = norm(english)
    .replace(/[\[\]]/g, "")
    .replace(/[“”"]/g, " ")
    .replace(/\s+—\s+|–|—/g, ", ")
    .replace(/\s+-\s+/g, ", ");
  const unknown: string[] = [];
  // split into clauses keeping the delimiter
  const clauses = text.split(/(?<=[,.;:?!])/);
  const out: string[] = [];
  for (const clauseRaw of clauses) {
    const delim = /[,.;:?!]$/.exec(clauseRaw.trim())?.[0] ?? "";
    const clause = clauseRaw.replace(/[,.;:?!]$/, "").trim();
    if (!clause) continue;
    const words = clause.split(/\s+/).map((w) => w.replace(/^[^A-Za-z']+|[^A-Za-z']+$/g, "")).filter(Boolean);
    // Disjoined letters (Alif, Lam, Meem ...) are fingerspelled letter by letter.
    if (words.length && words.every((w) => LETTERS[w.toLowerCase()])) {
      out.push(words.map((w) => "fs:" + LETTERS[w.toLowerCase()]).join(" ") + " ,");
      continue;
    }
    const signs: string[] = [];
    let neg = false, cond = false;
    for (let i = 0; i < words.length; i++) {
      const raw = words[i];
      const w = raw.toLowerCase().replace(/'s$/, "");
      // multi-word phrases (longest first)
      let matched = false;
      for (let n = Math.min(4, words.length - i); n >= 2; n--) {
        const phrase = words.slice(i, i + n).join(" ").toLowerCase();
        if (NAMES[phrase]) { signs.push(nameSign(NAMES[phrase], lex)); i += n - 1; matched = true; break; }
        const hit = lex.byWord.get(phrase);
        if (hit) { signs.push(hit[0]); i += n - 1; matched = true; break; }
      }
      if (matched) continue;
      if (["not", "no", "never", "nor", "none", "cannot"].includes(w)) neg = true;
      if (["if", "whoever", "when", "whenever"].includes(w)) cond = true;
      if (w === "allah") { signs.push("ALLAH"); continue; }
      if (NAMES[w]) { signs.push(nameSign(NAMES[w], lex)); continue; }
      // Sahih International capitalises pronouns referring to Allah
      if (/^(We|Us|Our|He|Him|His|I|Me|My)$/.test(raw) && i > 0 && raw !== "I") {
        signs.push(raw === "His" || raw === "Our" || raw === "My" ? "POSS-a" : "ALLAH");
        continue;
      }
      if (PRONOUN[w]) { signs.push(...PRONOUN[w].split(" ")); continue; }
      if (STOP.has(w) && !KEEP.has(w)) continue;
      const cands = stem(w);
      const id = cands.map((c) => lex.byWord.get(c)?.[0]).find(Boolean);
      if (id) { signs.push(id); continue; }
      if (/^[A-Z]/.test(raw) && i > 0) { signs.push("fs:" + w.toUpperCase().replace(/[^A-Z]/g, "")); continue; }
      if (w.length <= 2) continue;
      unknown.push(w);
      signs.push(w.toUpperCase().replace(/[^A-Z-]/g, ""));
    }
    // collapse immediate duplicates
    const dedup = signs.filter((s, k) => s && s !== signs[k - 1]);
    if (!dedup.length) continue;
    let body = dedup.join(" ");
    if (delim === "?") body = `[rhq: ${body}]`;
    else if (neg) body = `[neg: ${body}]`;
    else if (cond) body = `[cond: ${body}]`;
    out.push(body + (delim === "?" ? " ?" : delim === "." || delim === "!" ? " ." : " ,"));
  }
  return { gloss: out.join(" ").replace(/ ,$/, " ."), unknown };
}

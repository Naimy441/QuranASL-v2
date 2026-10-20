// Draft hand-quality ASL glosses for ayat that are still auto-drafted, using Claude.
//
//   npx tsx scripts/llm-gloss.ts <surah> [--from N] [--to N] [--write]
//
// Credentials: ANTHROPIC_API_KEY or an `ant auth login` profile. Each ayah is
// validated with the app's own gloss parser; unknown signs are sent back to the
// model for a fix (up to 2 retries). Output is printed in data/gloss/NNN.txt
// format; --write merges it into that file (existing hand-glossed lines win).
// Results are drafts: they still need Deaf reviewers in the Gloss Studio.
import fs from "node:fs";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { getLexicon } from "../src/lib/asl/lexicon";
import { NMS, parseGloss, resolveTokens } from "../src/lib/asl/gloss";

const args = process.argv.slice(2);
const surahN = Number(args[0]);
const opt = (k: string) => {
  const i = args.indexOf(k);
  return i >= 0 ? Number(args[i + 1]) : undefined;
};
const write = args.includes("--write");
if (!(surahN >= 1 && surahN <= 114)) {
  console.error("usage: npx tsx scripts/llm-gloss.ts <surah 1-114> [--from N] [--to N] [--write]");
  process.exit(1);
}

const lex = getLexicon();
const glossList = [...lex.entries.values()]
  .filter((e) => !e.id.includes("."))
  .map((e) => `${e.id}${e.en?.length ? ` (${e.en.slice(0, 3).join(", ")})` : ""}`)
  .join("\n");

// Stable system prompt (cached): notation + dictionary + worked examples.
const examples = ["001", "112", "103"]
  .map((f) => fs.readFileSync(path.join("data/gloss", `${f}.txt`), "utf8"))
  .join("\n");
const SYSTEM = `You translate the meanings of Qur'an ayat into American Sign Language gloss for a 3D signing avatar used by Deaf Muslims.

Write natural ASL, not signed English: topic-comment order, time and setting first, drop articles and copulas, use spatial loci (SIGN:a / SIGN:b) for contrasting groups, rhetorical questions for Qur'anic questions, role shift for quoted speech, and facial grammar spans. Follow mainstream tafsir (e.g. Al-Muyassar) for meaning; the English is only a guide.

Notation:
- Signs: dictionary glosses only (list below). Compounds A+B are allowed only if both parts are in the list.
- fs:WORD fingerspells a name or a word with no sign.
- [tag: ...] facial grammar over a span; tags: ${Object.keys(NMS).join(" ")}
- SIGN:a / SIGN:b / SIGN:c place a sign at a locus; SIGN+ repeats it.
- Pauses: "," short, "." sentence end, "?" question.
- One line per ayah: "<ayah number>: <gloss>". No other text.

Dictionary:
${glossList}

Worked examples (hand-glossed):
${examples}`;

const client = new Anthropic();
const surah = JSON.parse(fs.readFileSync(`public/data/surah/${surahN}.json`, "utf8"));
const glossFile = path.join("data/gloss", `${String(surahN).padStart(3, "0")}.txt`);
const existing = fs.existsSync(glossFile) ? fs.readFileSync(glossFile, "utf8") : `# ${surahN} ${surah.name}\n`;
const done = new Set(existing.split("\n").map((l) => /^(\d+):/.exec(l)?.[1]).filter(Boolean).map(Number));

function problems(line: string): string[] {
  return resolveTokens(parseGloss(line), lex)
    .filter((t) => t.status === "fallback" || t.status === "missing")
    .map((t) => t.gloss);
}

function ayahPrompt(a: { n: number; ar: string; en: string; w: { ar: string; en: string; root?: string }[] }) {
  const wbw = a.w.map((w) => `${w.ar} = ${w.en}${w.root ? ` [${w.root}]` : ""}`).join("; ");
  return `Surah ${surahN} (${surah.name}), ayah ${a.n}\nArabic: ${a.ar}\nEnglish (Saheeh International): ${a.en}\nWord by word: ${wbw}`;
}

async function glossAyah(a: Parameters<typeof ayahPrompt>[0]): Promise<string | null> {
  const messages: Anthropic.Beta.BetaMessageParam[] = [{ role: "user", content: ayahPrompt(a) }];
  for (let attempt = 0; attempt < 3; attempt++) {
    const stream = client.beta.messages.stream({
      model: "claude-opus-5-5",
      max_tokens: 16000,
      output_config: { effort: "high" },
      system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
      messages,
      // Server-side refusal fallback (opt-in, on by default here).
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
    } as Parameters<typeof client.beta.messages.stream>[0]);
    const msg = await stream.finalMessage();
    if (msg.stop_reason === "refusal") {
      console.warn(`${surahN}:${a.n} refused (${msg.stop_details?.category ?? "unknown"})`);
      return null;
    }
    const text = msg.content.map((b) => (b.type === "text" ? b.text : "")).join("").trim();
    const line = text.split("\n").map((l) => l.trim()).find((l) => l.startsWith(`${a.n}:`));
    if (!line) {
      messages.push({ role: "assistant", content: msg.content }, { role: "user", content: `Reply with exactly one line starting "${a.n}:".` });
      continue;
    }
    const bad = problems(line.slice(line.indexOf(":") + 1));
    if (!bad.length) return line;
    messages.push(
      { role: "assistant", content: msg.content },
      { role: "user", content: `These are not in the dictionary: ${bad.join(", ")}. Rewrite the line using dictionary signs, a compound of listed signs, or fs: for names.` },
    );
  }
  return null;
}

try {
  const from = opt("--from") ?? 1, to = opt("--to") ?? surah.ayahs;
  const out: string[] = [];
  for (const a of surah.ayat) {
    if (a.n < from || a.n > to || done.has(a.n)) continue;
    const line = await glossAyah(a);
    if (line) {
      console.log(line);
      out.push(line);
    } else console.warn(`${surahN}:${a.n} skipped`);
  }
  if (write && out.length) {
    const lines = existing.split("\n").filter((l) => l.trim());
    const merged = [...lines.filter((l) => !/^\d+:/.test(l)), ...[...lines.filter((l) => /^\d+:/.test(l)), ...out].sort((x, y) => parseInt(x) - parseInt(y))];
    fs.writeFileSync(glossFile, merged.join("\n") + "\n");
    console.log(`wrote ${out.length} lines to ${glossFile}; run scripts/build-gloss.ts and build-autogloss.ts`);
  }
} catch (e) {
  if (e instanceof Anthropic.AuthenticationError) console.error("No Anthropic credentials: set ANTHROPIC_API_KEY or run `ant auth login`.");
  else if (e instanceof Anthropic.RateLimitError) console.error("Rate limited — retry later.");
  else if (e instanceof Anthropic.APIError) console.error(`API error ${e.status}: ${e.message}`);
  else throw e;
  process.exit(1);
}

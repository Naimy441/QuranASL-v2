// Verification pass over every ayah gloss (all 6,236). It cannot tell whether a
// gloss is good ASL — only Deaf translators can — but it finds the ayat a reviewer
// should look at first:
//   coverage   share of the English content words whose meaning some sign carries
//              (via each sign's English labels, compounds expanded)
//   missing    English content words nothing in the gloss accounts for
//   signs      signs whose definition still needs physical fixing (data/audit/signs.json)
//   fs         fingerspelled words (names are expected; anything else is a gap in the dictionary)
// Writes public/data/audit/glosses.json (per surah) for the review queue, and a summary.
//
// usage: npx tsx scripts/audit-glosses.ts [--surah N] [--show 20]
import fs from "node:fs";
import { getLexicon } from "../src/lib/asl/lexicon";
import { parseGloss } from "../src/lib/asl/gloss";

const args = process.argv.slice(2);
const opt = (k: string) => (args.includes(k) ? args[args.indexOf(k) + 1] : undefined);
const only = opt("--surah") ? +opt("--surah")! : null;
const show = +(opt("--show") ?? 25);

const STOP = new Set(
  `a an the and or but if of to in on at by for with from as is are was were be been being am do does did done have has had having
  that this these those it its he him his she her they them their we us our you your i me my who whom which what when where why how
  not no nor so than then there here also very will would shall should may might can could must upon unto indeed thus such
  all any each every some most more much many other another own same just only even ever never again further
  say said says o ye thee thou thy thine hath doth unto lo verily surely certainly
  into out up down over under about against between through during before after above below off
  one ones thing things way something nothing anything everything
  among while whoever whatever wherever therein thereof thereby therefrom whereby themselves yourselves himself herself itself ourselves
  already rather whose forth toward towards lest within without let used use like make made become became come came`.split(/\s+/),
);
const fold = (w: string) => w.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[ʿʾ’']/g, "");
// disconnected letters (Alif Lām Meem...) are fingerspelled letter by letter
const LETTERS: Record<string, string> = { alif: "a", lam: "l", meem: "m", sad: "s", kaf: "k", ha: "h", ya: "y", ayn: "a", ta: "t", seen: "s", qaf: "q", nun: "n", ra: "r", meem_: "m" };
const stem = (w: string) =>
  fold(w)
    .toLowerCase()
    .replace(/[’']s$/, "")
    .replace(/(ies)$/, "y")
    .replace(/(ing|edly|ed|ly|es|s|e)$/, "")
    .replace(/(.)\1$/, "$1");
const words = (s: string) =>
  s
    .toLowerCase()
    .replace(/\[[^\]]*\]/g, (m) => m.slice(1, -1)) // keep bracketed clarifications
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[ʿʾ’']/g, "")
    .replace(/[^a-z\s-]/gi, " ")
    .split(/[\s-]+/)
    .filter((w) => w.length > 2 && !STOP.has(w));

const lex = getLexicon();
const conceptCache = new Map<string, Set<string>>();
function concepts(id: string, depth = 0): Set<string> {
  const hit = conceptCache.get(id);
  if (hit) return hit;
  const out = new Set<string>();
  const e = lex.get(id) ?? lex.get(id.split(".")[0]);
  for (const w of id.toLowerCase().split(/[-.+]/)) if (w.length > 1) out.add(stem(w));
  if (e) {
    for (const phrase of e.en ?? []) for (const w of phrase.split(/[\s-]+/)) if (w.length > 1) out.add(stem(w));
    if (e.def.startsWith("=") && depth < 4)
      for (const p of e.def.slice(1).split("+")) if (!p.startsWith("fs:")) for (const c of concepts(p.trim(), depth + 1)) out.add(c);
  }
  conceptCache.set(id, out);
  return out;
}

const SIGNS = "public/data/audit/signs.json"; // from scripts/audit-signs.ts
const signAudit: { id: string; key: number; path: number }[] = fs.existsSync(SIGNS) ? JSON.parse(fs.readFileSync(SIGNS, "utf8")) : [];
const badSign = new Set(signAudit.filter((r) => r.key > 0.045).map((r) => r.id));

interface AyahAudit { cov: number; missing: string[]; signs?: string[]; fs?: string[]; n: number; flags: string[] }
const all: { s: number; a: number; r: AyahAudit; en: string; gloss: string }[] = [];
fs.mkdirSync("public/data/audit", { recursive: true });
for (let s = 1; s <= 114; s++) {
  if (only && s !== only) continue;
  const sur = JSON.parse(fs.readFileSync(`public/data/surah/${s}.json`, "utf8"));
  const gl = JSON.parse(fs.readFileSync(`public/data/gloss/${s}.json`, "utf8")).ayat as Record<string, { gloss: string; source: string }>;
  const out: Record<string, AyahAudit> = {};
  for (const ay of sur.ayat as { n: number; en: string }[]) {
    const g = gl[ay.n]?.gloss ?? "";
    const toks = parseGloss(g).filter((t) => t.kind !== "pause");
    const have = new Set<string>();
    const fsw: string[] = [];
    const flagged: string[] = [];
    for (const t of toks) {
      if (t.kind === "fs") {
        fsw.push(t.gloss);
        have.add(stem(t.gloss));
        for (const [name, l] of Object.entries(LETTERS)) if (t.gloss.toLowerCase() === l) have.add(stem(name));
        continue;
      }
      for (const part of t.gloss.split("+")) {
        for (const c of concepts(part)) have.add(c);
        if (badSign.has(part)) flagged.push(part);
      }
    }
    const en = [...new Set(words(ay.en))];
    const missing = en.filter((w) => !have.has(stem(w)) && !(stem(w).length > 4 && [...have].some((c) => c.length > 4 && (c.startsWith(stem(w)) || stem(w).startsWith(c)))));
    const cov = en.length ? 1 - missing.length / en.length : 1;
    const flags: string[] = [];
    if (!toks.length) flags.push("empty");
    if (cov < 0.4 && en.length >= 3) flags.push("low-coverage");
    if (toks.length < en.length * 0.3) flags.push("too-short");
    if (flagged.length) flags.push("sign-fix");
    if (fsw.some((w) => !/^[A-Z][A-Z-]*$/.test(w) || w.length > 12)) flags.push("odd-fs");
    const r: AyahAudit = { cov: +cov.toFixed(2), missing, n: toks.length, flags };
    if (flagged.length) r.signs = [...new Set(flagged)];
    if (fsw.length) r.fs = fsw;
    out[ay.n] = r;
    all.push({ s, a: ay.n, r, en: ay.en, gloss: g });
  }
  if (!only) fs.writeFileSync(`public/data/audit/${s}.json`, JSON.stringify(out));
}

const n = all.length;
const covs = all.map((x) => x.r.cov).sort((a, b) => a - b);
const count = (f: string) => all.filter((x) => x.r.flags.includes(f)).length;
console.log(`ayat ${n}  median coverage ${covs[Math.floor(n / 2)]}  p10 ${covs[Math.floor(n * 0.1)]}`);
console.log(`flags: low-coverage ${count("low-coverage")}  too-short ${count("too-short")}  sign-fix ${count("sign-fix")}  empty ${count("empty")}  odd-fs ${count("odd-fs")}`);
const miss = new Map<string, number>();
for (const x of all) for (const w of x.r.missing) miss.set(stem(w), (miss.get(stem(w)) ?? 0) + 1);
console.log("most often uncovered English words:", [...miss].sort((a, b) => b[1] - a[1]).slice(0, 60).map(([w, c]) => `${w}:${c}`).join(" "));
console.log("\nlowest coverage:");
for (const x of [...all].sort((a, b) => a.r.cov - b.r.cov).slice(0, show)) console.log(`${x.s}:${x.a} cov ${x.r.cov}  missing ${x.r.missing.join(",")}\n   EN ${x.en.slice(0, 160)}\n   GL ${x.gloss.slice(0, 160)}`);
if (!only) {
  // review queue: every flagged ayah plus the lowest-coverage rest, most urgent first
  const pri = (r: AyahAudit) => (1 - r.cov) + (r.flags.includes("sign-fix") ? 0.25 : 0) + (r.flags.includes("low-coverage") ? 0.3 : 0);
  const queue = [...all]
    .sort((a, b) => pri(b.r) - pri(a.r))
    .slice(0, 1500)
    .map((x) => ({ s: x.s, a: x.a, cov: x.r.cov, missing: x.r.missing.slice(0, 8), signs: x.r.signs, flags: x.r.flags, en: x.en, gloss: x.gloss }));
  fs.writeFileSync("public/data/audit/queue.json", JSON.stringify(queue));
  const summary = { generated: new Date().toISOString().slice(0, 10), ayat: n, medianCoverage: covs[Math.floor(n / 2)], flags: Object.fromEntries(["low-coverage", "too-short", "sign-fix", "empty", "odd-fs"].map((f) => [f, count(f)])) };
  fs.writeFileSync("public/data/audit/summary.json", JSON.stringify(summary));
}

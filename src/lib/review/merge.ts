// Node only. Validate a contribution bundle and merge it into the repository:
//   glosses     → data/gloss/NNN.txt
//   signs       → src/lib/asl/lexicon/*.ts (changed line in place; new signs appended to extra.ts)
//   reviews     → public/data/reviews.json
//   recordings  → data/contrib/recordings/<id>.<ext> + <id>.json, and map.json for scripts/mocap/retarget.ts
// Used by scripts/merge-contributions.ts and the dev-only /api/studio route.
import fs from "node:fs";
import path from "node:path";
import { getLexicon, Lexicon, parseLexicon } from "../asl/lexicon";
import { validateDef } from "../asl/dsl";
import { parseGloss, resolveTokens } from "../asl/gloss";
import type { SignEntry } from "../asl/types";
import { mergeEvents, normalizeShared } from "./status";
import type { ContributionBundle, GlossDraft, SignDraft, SharedReviews } from "./types";

export interface FileChange {
  file: string; // repo-relative
  before: string | null; // null = new file
  after: string | Buffer;
}
export interface MergePlan {
  errors: string[];
  warnings: string[];
  changes: FileChange[];
  summary: string;
}

/** Lexicon sources in load order (later entries win, see getLexicon). */
const LEX_FILES = ["core", "religion", "nature", "more", "extra", "islamic"].map((f) => `src/lib/asl/lexicon/${f}.ts`);
const NEW_SIGNS_FILE = "src/lib/asl/lexicon/extra.ts";
const GLOSS_LINE = /^(\d+):\s*(.*)$/;

export function planMerge(bundle: ContributionBundle, opts: { root?: string; force?: boolean } = {}): MergePlan {
  const root = opts.root ?? process.cwd();
  const rd = (f: string) => (fs.existsSync(path.join(root, f)) ? fs.readFileSync(path.join(root, f), "utf8") : null);
  const errors: string[] = [];
  const warnings: string[] = [];
  const files = new Map<string, FileChange>();
  const edit = (file: string, fn: (cur: string) => string, init = "") => {
    const ch = files.get(file) ?? { file, before: rd(file), after: "" };
    ch.after = fn(typeof ch.after === "string" && files.has(file) ? ch.after : (ch.before ?? init));
    files.set(file, ch);
  };

  const surahs = JSON.parse(rd("public/data/surahs.json") ?? "[]") as { n: number; ayahs: number }[];
  const ayahCount = new Map(surahs.map((s) => [s.n, s.ayahs]));

  // latest draft per item wins (a bundle can carry several imports)
  const glosses = latest(bundle.glosses, (g) => `${g.surah}:${g.ayah}`);
  const signs = latest(bundle.signs, (s) => s.id);

  // ---------- signs ----------
  const base = getLexicon();
  const lex = new Lexicon([...base.entries.values()], base.lang, base.spell);
  const lexSrc = new Map(LEX_FILES.map((f) => [f, rd(f) ?? ""]));
  const ids = new Set([...base.entries.keys(), ...signs.map((s) => s.id)]);
  let signsOk = 0;
  for (const s of signs) {
    const where = `sign ${s.id}`;
    if (/[`\n\r]|\$\{/.test(s.def + (s.en ?? []).join() + (s.note ?? ""))) {
      errors.push(`${where}: definition contains a back-tick, "\${" or a line break`);
      continue;
    }
    const err = s.def.startsWith("=") ? compoundError(s.def, ids) : validateDef(s.def);
    if (err) {
      errors.push(`${where}: definition does not compile — ${err}`);
      continue;
    }
    const cur = base.get(s.id);
    if (s.base !== null && cur && cur.def !== s.base && cur.def !== s.def) {
      const msg = `${where}: the repository definition changed since this edit started (repo: "${cur.def}", edit based on: "${s.base}")`;
      if (!opts.force) {
        errors.push(msg + " — re-check it in the Studio or merge with --force");
        continue;
      }
      warnings.push(msg + " — overwritten (--force)");
    }
    lex.add({ ...(cur ?? { id: s.id, en: [], conf: "low" }), id: s.id, def: s.def, en: s.en ?? cur?.en ?? [], conf: s.conf ?? cur?.conf ?? "low", note: s.note ?? cur?.note });
    if (cur && cur.def === s.def && sameList(cur.en, s.en) && (s.conf ?? cur.conf) === cur.conf) continue; // nothing to write
    const hit = findLexLine(lexSrc, s.id);
    if (hit) {
      const lines = lexSrc.get(hit.file)!.split("\n");
      lines[hit.line] = rewriteLexLine(lines[hit.line], s, hit.entry);
      lexSrc.set(hit.file, lines.join("\n"));
      edit(hit.file, () => lexSrc.get(hit.file)!);
    } else {
      const src = lexSrc.get(NEW_SIGNS_FILE)!;
      const end = src.lastIndexOf("`;");
      if (end < 0) {
        errors.push(`${where}: could not find the end of ${NEW_SIGNS_FILE}`);
        continue;
      }
      const line = lexLine(s.id, s.def, s.en ?? [], s.conf ?? "low", s.note ?? `contributed by ${s.by ?? bundle.reviewer ?? "a reviewer"}`);
      const next = src.slice(0, end) + line + "\n" + src.slice(end);
      lexSrc.set(NEW_SIGNS_FILE, next);
      edit(NEW_SIGNS_FILE, () => next);
    }
    signsOk++;
  }

  // ---------- glosses ----------
  const bySurah = new Map<number, GlossDraft[]>();
  for (const g of glosses) {
    const where = `${g.surah}:${g.ayah}`;
    const max = ayahCount.get(g.surah);
    if (!max || g.ayah < 1 || g.ayah > max) {
      errors.push(`${where}: no such ayah`);
      continue;
    }
    if (/[\n\r]/.test(g.gloss) || !g.gloss.trim()) {
      errors.push(`${where}: gloss is empty or has a line break`);
      continue;
    }
    const bad = resolveTokens(parseGloss(g.gloss), lex).filter((t) => t.status === "fallback" || t.status === "missing");
    if (bad.length) {
      errors.push(`${where}: ${bad.map((t) => `"${t.gloss}"`).join(", ")} ${bad.length > 1 ? "are" : "is"} not in the lexicon (add the sign, or write fs:WORD to fingerspell)`);
      continue;
    }
    (bySurah.get(g.surah) ?? bySurah.set(g.surah, []).get(g.surah)!).push(g);
  }
  let glossOk = 0;
  for (const [n, list] of bySurah) {
    const file = `data/gloss/${String(n).padStart(3, "0")}.txt`;
    const text = rd(file) ?? `# ${n}\n`;
    const lines = text.replace(/\n$/, "").split("\n");
    for (const g of list) {
      const i = lines.findIndex((l) => GLOSS_LINE.exec(l.trim())?.[1] === String(g.ayah));
      const cur = i >= 0 ? GLOSS_LINE.exec(lines[i].trim())![2].trim() : null;
      if (cur === g.gloss.trim()) continue;
      if (g.base === null && cur !== null) warnings.push(`${n}:${g.ayah}: edit has no recorded base gloss (older export) — replacing "${cur}"`);
      if (g.base !== null && cur !== null && cur !== g.base.trim()) {
        const msg = `${n}:${g.ayah}: the repository gloss changed since this edit started (repo: "${cur}", edit based on: "${g.base}")`;
        if (!opts.force) {
          errors.push(msg + " — re-check it in the Studio or merge with --force");
          continue;
        }
        warnings.push(msg + " — overwritten (--force)");
      }
      const line = `${g.ayah}: ${g.gloss.trim()}`;
      if (i >= 0) lines[i] = line;
      else {
        // keep ayat in order
        const at = lines.findIndex((l) => +(GLOSS_LINE.exec(l.trim())?.[1] ?? 0) > g.ayah);
        lines.splice(at < 0 ? lines.length : at, 0, line);
      }
      glossOk++;
    }
    const next = lines.join("\n") + "\n";
    if (next !== text) edit(file, () => next);
  }

  // ---------- reviews ----------
  const okKeys = (e: ContributionBundle["reviews"][number]) => {
    if (e.kind === "sign") return ids.has(e.key);
    const [s, a] = e.key.split(":").map(Number);
    return (ayahCount.get(s) ?? 0) >= a && a >= 1;
  };
  const events = bundle.reviews.filter((e) => {
    if (okKeys(e)) return true;
    warnings.push(`review ${e.kind} ${e.key}: unknown ${e.kind}, skipped`);
    return false;
  });
  const REV = "public/data/reviews.json";
  const prevRaw = rd(REV);
  const prev = normalizeShared(prevRaw ? JSON.parse(prevRaw) : {});
  const merged = mergeEvents(prev, events);
  const newEvents = merged.length - prev.length;
  if (newEvents > 0) {
    const out: SharedReviews = { version: 2, updated: new Date().toISOString(), events: merged };
    // one event per line keeps review diffs readable
    edit(REV, () => `{"version":${out.version},"updated":${JSON.stringify(out.updated)},"events":[\n${out.events.map((e) => JSON.stringify(e)).join(",\n")}\n]}\n`);
  }

  // ---------- recordings ----------
  const RECS = "data/contrib/recordings";
  let recOk = 0;
  const mapFile = `${RECS}/map.json`;
  const map: Record<string, { id: string; pick: string; by?: string; at?: string }> = JSON.parse(rd(mapFile) ?? "{}");
  for (const r of bundle.recordings) {
    if (!/^[A-Za-z0-9-]+$/.test(r.id)) {
      errors.push(`recording ${r.id}: bad id`);
      continue;
    }
    if (!ids.has(r.sign)) warnings.push(`recording ${r.id}: sign ${r.sign} is not in the lexicon yet`);
    const { video, frames, ...m } = r;
    if (rd(`${RECS}/${r.id}.json`) !== null) continue; // already merged
    if (video) {
      const mm = /^data:([^;,]+)(?:;[^,]*?)?(;base64)?,([\s\S]*)$/.exec(video);
      if (!mm) {
        errors.push(`recording ${r.id}: video is not a data: URL`);
        continue;
      }
      const ext = mm[1].includes("mp4") ? "mp4" : "webm";
      files.set(`${RECS}/${r.id}.${ext}`, { file: `${RECS}/${r.id}.${ext}`, before: null, after: Buffer.from(mm[3], mm[2] ? "base64" : "utf8") });
    }
    files.set(`${RECS}/${r.id}.json`, { file: `${RECS}/${r.id}.json`, before: null, after: JSON.stringify({ ...m, frames }) + "\n" });
    map[r.id] = { id: r.sign, pick: "longest", by: r.by, at: r.at };
    recOk++;
  }
  if (recOk) edit(mapFile, () => JSON.stringify(map, null, 1) + "\n", "{}");

  const summary = `${glossOk} gloss${glossOk === 1 ? "" : "es"}, ${signsOk} sign${signsOk === 1 ? "" : "s"}, ${Math.max(0, newEvents)} new review${newEvents === 1 ? "" : "s"}, ${recOk} recording${recOk === 1 ? "" : "s"} · ${errors.length} error${errors.length === 1 ? "" : "s"}, ${warnings.length} warning${warnings.length === 1 ? "" : "s"}`;
  return { errors, warnings, changes: [...files.values()].filter((c) => c.after !== c.before), summary };
}

export function applyMerge(plan: MergePlan, root = process.cwd()) {
  for (const c of plan.changes) {
    const p = path.join(root, c.file);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, c.after);
  }
}

// ---------------------------------------------------------------------------

function latest<T extends { at: string }>(list: T[], key: (x: T) => string): T[] {
  const m = new Map<string, T>();
  for (const x of [...list].sort((a, b) => a.at.localeCompare(b.at))) m.set(key(x), x);
  return [...m.values()];
}

function sameList(a?: string[], b?: string[]) {
  return !b || (a ?? []).join(",") === b.join(",");
}

function compoundError(def: string, ids: Set<string>): string | null {
  const parts = def.slice(1).split("+").map((p) => p.trim());
  const bad = parts.filter((p) => !p || (!p.startsWith("fs:") && !ids.has(p)));
  return bad.length ? `unknown part${bad.length > 1 ? "s" : ""} ${bad.join(", ")}` : null;
}

function findLexLine(src: Map<string, string>, id: string): { file: string; line: number; entry: SignEntry } | null {
  let hit: { file: string; line: number; entry: SignEntry } | null = null;
  for (const [file, text] of src) {
    const lines = text.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i].trim();
      if (!l.startsWith(id) || !/^\s*\|/.test(l.slice(id.length))) continue;
      const e = parseLexicon(l, "")[0];
      if (e?.id === id) hit = { file, line: i, entry: e }; // later wins, as in getLexicon
    }
  }
  return hit;
}

function lexLine(id: string, def: string, en: string[], conf: string, note?: string) {
  return `${id} | ${def} | ${en.join(",")} | ${conf}${note ? ` | ${note}` : ""}`;
}

function rewriteLexLine(raw: string, s: SignDraft, cur: SignEntry): string {
  const enSame = sameList(cur.en, s.en) && (s.conf ?? cur.conf) === cur.conf;
  if (enSame && raw.includes(cur.def) && raw.indexOf(cur.def) === raw.lastIndexOf(cur.def)) return raw.replace(cur.def, () => s.def);
  return lexLine(s.id, s.def, s.en ?? cur.en ?? [], s.conf ?? cur.conf ?? "med", s.note ?? cur.note);
}

// ---------------------------------------------------------------------------
// Line diff for the dry run.

export function renderDiff(plan: MergePlan, context = 2): string {
  const out: string[] = [];
  for (const c of plan.changes) {
    if (typeof c.after !== "string") {
      out.push(`+++ ${c.file} (binary, ${(c.after.length / 1024).toFixed(0)} KB)`);
      continue;
    }
    out.push(`--- ${c.file}${c.before === null ? " (new file)" : ""}`, `+++ ${c.file}`);
    out.push(...lineDiff(c.before ?? "", c.after, context));
  }
  return out.join("\n");
}

function lineDiff(a: string, b: string, ctx: number): string[] {
  const A = a.split("\n"), B = b.split("\n");
  // trim the common prefix and suffix, then LCS on the middle
  let p = 0;
  while (p < A.length && p < B.length && A[p] === B[p]) p++;
  let s = 0;
  while (s < A.length - p && s < B.length - p && A[A.length - 1 - s] === B[B.length - 1 - s]) s++;
  const a2 = A.slice(p, A.length - s), b2 = B.slice(p, B.length - s);
  const ops: { t: " " | "-" | "+"; l: string }[] = [];
  if (a2.length * b2.length > 4e6) {
    for (const l of a2) ops.push({ t: "-", l });
    for (const l of b2) ops.push({ t: "+", l });
  } else {
    const n = a2.length, m = b2.length;
    const L = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
    for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i][j] = a2[i] === b2[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
    let i = 0, j = 0;
    while (i < n || j < m) {
      if (i < n && j < m && a2[i] === b2[j]) ops.push({ t: " ", l: a2[i++] }), j++;
      else if (i < n && (j >= m || L[i + 1][j] >= L[i][j + 1])) ops.push({ t: "-", l: a2[i++] });
      else ops.push({ t: "+", l: b2[j++] });
    }
  }
  const full = [...A.slice(Math.max(0, p - ctx), p).map((l) => ({ t: " " as const, l })), ...ops, ...A.slice(A.length - s, A.length - s + ctx).map((l) => ({ t: " " as const, l }))];
  // collapse long unchanged runs inside the middle
  const out: string[] = [`@@ line ${Math.max(1, p - ctx + 1)} @@`];
  let run: string[] = [];
  const flush = (last: boolean) => {
    if (run.length > ctx * 2 + 1 && !last) out.push(...run.slice(0, ctx), "  …", ...run.slice(-ctx));
    else out.push(...(last ? run.slice(0, ctx) : run));
    run = [];
  };
  for (const o of full) {
    if (o.t === " ") run.push("  " + o.l);
    else {
      flush(false);
      out.push(`${o.t} ${o.l.length > 400 ? o.l.slice(0, 400) + " …" : o.l}`);
    }
  }
  flush(true);
  return out;
}

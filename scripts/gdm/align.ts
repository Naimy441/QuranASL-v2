// Cut Global Deaf Muslim surah videos into ayat using their burned-in subtitles.
//
// The subtitles (OCR'd by scripts/gdm/ocr_subtitles.py) follow Yusuf Ali's
// translation phrase by phrase. A monotonic word alignment (edit-distance DP with
// fuzzy word matching, robust to OCR noise and to the subtitles' small rewordings)
// assigns each subtitle to an ayah; an ayah's span runs from its first subtitle to
// its last, and neighbouring ayat meet halfway between their subtitles. The
// bismillah becomes ayah 0, as in the BSL data.
//
// usage: npx tsx scripts/gdm/align.ts [--show]   → data/gdm/segments.json
import fs from "node:fs";
import { execFileSync } from "node:child_process";

/** Surah → GDM video (the "Final" cut where there are two). */
export const GDM_SURAH_VIDEOS: Record<number, string> = {
  1: "dd4HJD9RucY", 100: "QV2MH06B1UE", 101: "fyfF-FkbiXQ", 102: "Vsiz2dN_M-o", 103: "3IfSTN-Eptg", 104: "mkmcMIFN_A0",
  105: "1-hrlQ20eUU", 106: "B2MlbTM8Ol0", 107: "1HgMc2ZMt00", 108: "eJeHiLF4sBM", 109: "gLRKhHzE8M4", 110: "_KVSt3h9tUA",
  111: "ZgDdcXNlJgA", 112: "JuPnR__ENd4", 113: "ZEJ7UuHgRlc", 114: "Gl1WVAiHhwo",
};

const show = process.argv.includes("--show");
const ya: Record<string, Record<string, string>> = JSON.parse(fs.readFileSync("data/raw/yusufali.json", "utf8"));
// the Al-Fatiha demo is captioned (in white) with M.A.S. Abdel Haleem's translation
const haleem: Record<string, Record<string, string>> = fs.existsSync("data/raw/haleem.json") ? JSON.parse(fs.readFileSync("data/raw/haleem.json", "utf8")) : {};
const CAPTIONS: Record<number, { file: string; text: Record<string, string>; bismillah: boolean }> = {
  1: { file: "dd4HJD9RucY.white", text: haleem["1"] ?? {}, bismillah: false }, // the bismillah is ayah 1 here
};
const BISMILLAH = "In the name of Allah Most Gracious Most Merciful";

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1);

function lev(a: string, b: string) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...new Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}
/** similarity of two words in 0..1 */
function sim(a: string, b: string) {
  if (a === b) return 1;
  const l = Math.max(a.length, b.length);
  if (l < 4) return 0;
  const s = 1 - lev(a, b) / l;
  return s >= 0.7 ? s : 0;
}

export interface Segment {
  video: string; surah: number; ayah: number; start: number; end: number; conf: number; subs: string[];
  /** "subtitle" = cut at the ayah's own captions; "page" = the page of ayat is exact, the cut inside it is estimated */
  timing: "subtitle" | "page";
}

function alignSurah(surah: number, video: string): Segment[] {
  const cfg = CAPTIONS[surah];
  const text = cfg?.text ?? ya[surah];
  const file = `data/gdm/${cfg?.file ?? video}.subs.json`;
  if (!fs.existsSync(file)) return [];
  const raw = (JSON.parse(fs.readFileSync(file, "utf8")).subs as [number, number, string][]).filter(([, , t]) => norm(t).length);
  // OCR noise splits one held caption into near-duplicates ("ya) and strike sparks..."): merge them
  const subs: [number, number, string][] = [];
  for (const sub of raw) {
    const last = subs[subs.length - 1];
    if (last && sub[0] - last[1] < 0.8) {
      // compare content words only: "In the morning" and "In clouds the while" share nothing
      const a = norm(last[2]).filter((w) => w.length > 3), b = norm(sub[2]).filter((w) => w.length > 3);
      const common = a.filter((w) => b.some((x) => sim(w, x) > 0)).length;
      if (a.length && b.length && common / Math.min(a.length, b.length) >= 0.6) {
        last[1] = sub[1];
        if (b.length > a.length) last[2] = sub[2];
        continue;
      }
    }
    subs.push([...sub]);
  }
  // reference words, tagged by ayah (0 = bismillah, -1 = surah title preamble)
  const ref: { w: string; ayah: number }[] = [];
  if (cfg?.bismillah !== false) for (const w of norm(BISMILLAH)) ref.push({ w, ayah: 0 });
  const n = Object.keys(text).length;
  for (let a = 1; a <= n; a++) for (const w of norm(text[a])) ref.push({ w, ayah: a });
  // hypothesis words, tagged by subtitle
  const hyp: { w: string; sub: number }[] = [];
  subs.forEach(([, , t], i) => norm(t).forEach((w) => hyp.push({ w, sub: i })));
  // DP: score = matches; gaps are free on both sides (subtitles skip and add words)
  const H = hyp.length, R = ref.length;
  const S = Array.from({ length: H + 1 }, () => new Float32Array(R + 1));
  const B = Array.from({ length: H + 1 }, () => new Uint8Array(R + 1)); // 0 diag, 1 skip hyp, 2 skip ref
  for (let i = 1; i <= H; i++)
    for (let j = 1; j <= R; j++) {
      const m = S[i - 1][j - 1] + sim(hyp[i - 1].w, ref[j - 1].w) * 2 - 0.15;
      const u = S[i - 1][j], l = S[i][j - 1];
      if (m >= u && m >= l) {
        S[i][j] = m;
        B[i][j] = 0;
      } else if (u >= l) {
        S[i][j] = u;
        B[i][j] = 1;
      } else {
        S[i][j] = l;
        B[i][j] = 2;
      }
    }
  // trace back matched pairs
  const subAyah = new Map<number, number[]>();
  let i = H, j = R;
  while (i > 0 && j > 0) {
    if (B[i][j] === 0) {
      if (sim(hyp[i - 1].w, ref[j - 1].w) > 0) {
        const s = hyp[i - 1].sub;
        subAyah.set(s, [...(subAyah.get(s) ?? []), ref[j - 1].ayah]);
      }
      i--;
      j--;
    } else if (B[i][j] === 1) i--;
    else j--;
  }
  // each matched subtitle → the ayah most of its words matched
  const assigned = subs.map((_, k) => {
    const v = subAyah.get(k);
    if (!v) return -1;
    const c = new Map<number, number>();
    for (const a of v) c.set(a, (c.get(a) ?? 0) + 1);
    return [...c].sort((x, y) => y[1] - x[1])[0][0];
  });
  // ayah spans from their subtitles; coverage = share of the ayah's words matched
  const segs: Segment[] = [];
  for (let a = 0; a <= n; a++) {
    let ks = assigned.map((x, k) => (x === a ? k : -1)).filter((k) => k >= 0);
    if (!ks.length) continue;
    // a signer who redoes a passage shows its caption again later: keep the final take
    for (let k = ks.length - 1; k > 0; k--)
      if (subs[ks[k]][0] - subs[ks[k - 1]][1] > 4) {
        ks = ks.slice(k);
        break;
      }
    const words = ref.filter((r) => r.ayah === a).length;
    const matched = ks.reduce((s, k) => s + (subAyah.get(k)?.filter((x) => x === a).length ?? 0), 0);
    segs.push({ video, surah, ayah: a, start: subs[ks[0]][0], end: subs[ks[ks.length - 1]][1], conf: +Math.min(1, matched / words).toFixed(2), subs: ks.map((k) => subs[k][2]), timing: "subtitle" });
  }
  segs.sort((x, y) => x.start - y.start);
  // neighbours meet halfway between their subtitles; signing starts a little before the caption
  for (let k = 0; k < segs.length; k++) {
    const prev = segs[k - 1], next = segs[k + 1];
    const s0 = prev ? (prev.end + segs[k].start) / 2 : Math.max(0, segs[k].start - 0.8);
    const s1 = next ? (segs[k].end + next.start) / 2 : segs[k].end + 1.0;
    segs[k].start = +s0.toFixed(2);
    segs[k].end = +s1.toFixed(2);
  }
  return segs;
}

/** Wrist speed per frame of a pose capture (image units / s), for finding the signer's pauses. */
function wristSpeed(video: string): { fps: number; speed: number[] } | null {
  const file = `data/pose/gdm-surah/${video}.json`;
  if (!fs.existsSync(file)) return null;
  const cap = JSON.parse(fs.readFileSync(file, "utf8")) as { fps: number; frames: { pi?: number[][] }[] };
  const raw = cap.frames.map((f, i) => {
    const g = cap.frames[Math.min(i + 1, cap.frames.length - 1)];
    if (!f.pi || !g.pi) return 0;
    return (Math.hypot(g.pi[16][0] - f.pi[16][0], g.pi[16][1] - f.pi[16][1]) + Math.hypot(g.pi[15][0] - f.pi[15][0], g.pi[15][1] - f.pi[15][1])) * cap.fps;
  });
  const w = Math.round(cap.fps * 0.15);
  const speed = raw.map((_, i) => {
    let a = 0, n = 0;
    for (let k = -w; k <= w; k++) if (raw[i + k] !== undefined) (a += raw[i + k]), n++;
    return a / n;
  });
  return { fps: cap.fps, speed };
}

/**
 * Videos that show a page of ayat at a time: the page's start and end are exact (OCR of
 * the ayah references); inside a page, each ayah gets time in proportion to its length,
 * and every cut moves to the stillest moment of the signer's hands nearby (signers pause
 * briefly between ayat).
 */
function alignPages(surah: number, video: string): Segment[] {
  const file = `data/gdm/${video}.panels.json`;
  if (!fs.existsSync(file)) return [];
  const pages = JSON.parse(fs.readFileSync(file, "utf8")).pages as [number, number, (number | string)[], string][];
  const motion = wristSpeed(video);
  const n = Object.keys(ya[surah]).length;
  const out: Segment[] = [];
  const stillest = (t: number, radius: number) => {
    if (!motion) return t;
    const f0 = Math.max(0, Math.round((t - radius) * motion.fps)), f1 = Math.min(motion.speed.length - 1, Math.round((t + radius) * motion.fps));
    let best = Math.round(t * motion.fps), bv = Infinity;
    for (let f = f0; f <= f1; f++) {
      // prefer stillness, gently prefer the proportional estimate
      const v = motion.speed[f] * (1 + 0.6 * Math.abs(f / motion.fps - t) / Math.max(radius, 1e-3));
      if (v < bv) (bv = v), (best = f);
    }
    return best / motion.fps;
  };
  // Pages run in order, so a page covers every ayah after the previous page up to its
  // highest reference (OCR sometimes misses a line); ayat left after the last page take
  // the rest of the video.
  const duration = +execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", `data/video/gdm/${video}.mp4`]).toString();
  const plan: [number, number, number[] | "intro"][] = [];
  let covered = 0;
  for (const [p0, p1, refs] of pages) {
    if (refs[0] === "intro") {
      plan.push([p0, p1, "intro"]);
      continue;
    }
    const hi = Math.min(n, Math.max(...(refs as number[]).filter((a) => a >= 1 && a <= n)));
    if (!(hi > covered)) continue;
    plan.push([p0, p1, Array.from({ length: hi - covered }, (_, k) => covered + k + 1)]);
    covered = hi;
  }
  if (covered < n && plan.length) {
    const rest = Array.from({ length: n - covered }, (_, k) => covered + k + 1);
    const last = plan[plan.length - 1];
    if (duration - last[1] > 3) plan.push([last[1] + 0.5, duration - 0.5, rest]);
    else if (last[2] !== "intro") last[2] = [...last[2], ...rest];
  }
  for (const [p0, p1, refs] of plan) {
    if (refs === "intro") {
      out.push({ video, surah, ayah: 0, start: p0, end: p1, conf: 0.6, subs: [], timing: "page" });
      continue;
    }
    const ayat = refs;
    if (!ayat.length) continue;
    const words = ayat.map((a) => norm(ya[surah][a]).length + 3); // + a little for the signer's pause
    const total = words.reduce((x, y) => x + y, 0);
    let t = p0;
    const cuts = [p0];
    for (let k = 0; k < ayat.length - 1; k++) {
      t += ((p1 - p0) * words[k]) / total;
      const avg = (p1 - p0) / ayat.length;
      cuts.push(+stillest(t, avg * 0.3).toFixed(2));
    }
    cuts.push(p1);
    ayat.forEach((a, k) => out.push({ video, surah, ayah: a, start: cuts[k], end: cuts[k + 1], conf: ayat.length === 1 ? 0.8 : 0.45, subs: [], timing: "page" }));
  }
  return out;
}

const all: Segment[] = [];
for (const [s, v] of Object.entries(GDM_SURAH_VIDEOS)) {
  let segs = alignSurah(+s, v);
  // fall back to page panels where the video has no per-phrase subtitles
  if (segs.filter((x) => x.ayah > 0).length < Object.keys(ya[s]).length * 0.8) {
    const pages = alignPages(+s, v);
    if (pages.filter((x) => x.ayah > 0).length > segs.filter((x) => x.ayah > 0).length) segs = pages;
  }
  const n = Object.keys(ya[s]).length;
  // a weak subtitle alignment is OCR noise matching noise: leave the surah out rather than mislabel it
  const meanConf = segs.reduce((a, b) => a + b.conf, 0) / (segs.length || 1);
  if (segs[0]?.timing === "subtitle" && meanConf < 0.4) {
    console.log(`surah ${s.padStart(3)} ${v}  dropped: subtitle alignment too weak (mean conf ${meanConf.toFixed(2)})`);
    continue;
  }
  const found = segs.filter((x) => x.ayah > 0).length;
  console.log(`surah ${s.padStart(3)} ${v}  ${segs[0]?.timing ?? "-"}  ayat ${found}/${n}  mean conf ${(segs.reduce((a, b) => a + b.conf, 0) / (segs.length || 1)).toFixed(2)}`);
  if (show) for (const x of segs) console.log(`   ${String(x.ayah).padStart(2)} ${x.start.toFixed(1).padStart(6)}-${x.end.toFixed(1).padEnd(6)} conf ${x.conf} ${x.timing}  ${x.subs.join(" | ").slice(0, 100)}`);
  all.push(...segs);
}
fs.writeFileSync("data/gdm/segments.json", JSON.stringify(all, null, 1));
console.log("wrote data/gdm/segments.json", all.length, "segments");

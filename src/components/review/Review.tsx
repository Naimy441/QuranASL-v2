"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Eye, PencilLine, Users } from "lucide-react";
import { StatusBadge, when } from "@/components/studio/ui";
import { useAllEvents } from "@/lib/review/client";
import { ReviewIndex, type ItemState } from "@/lib/review/status";
import { useLocalReview } from "@/lib/review/store";
import type { SurahMeta } from "@/lib/data/quran";

// Verification dashboard: where the corpus stands and what a Deaf reviewer should
// look at next. The ranking is computed offline (scripts/audit-glosses.ts,
// scripts/audit-signs.ts) and is a priority signal, not a verdict; the status of
// each ayah and sign comes from review decisions (public/data/reviews.json merged
// from contribution bundles, plus this browser's own not yet exported).

interface QueueItem { s: number; a: number; cov: number; missing: string[]; signs?: string[]; flags: string[]; en: string; gloss: string }
interface SignRow { id: string; uses: number; key: number; path: number; hands: number; mocap?: boolean; conf?: string; def: string }
interface Summary { generated: string; ayat: number; medianCoverage: number; flags: Record<string, number> }
type AyahView = "queue" | "needs-changes" | "approved";
type SignView = "bad" | "low" | "needs-changes" | "approved" | "all";

const FLAG_LABEL: Record<string, string> = {
  "low-coverage": "Meaning gaps",
  "sign-fix": "Sign needs fixing",
  "too-short": "Very short",
  "odd-fs": "Unusual fingerspelling",
  empty: "Empty",
};
const PAGE = 40;
const btn = "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border-2 px-3.5 text-sm font-semibold";
const select = "min-h-11 rounded-xl border-2 border-line-2 bg-panel px-3 text-sm";

const cm = (x: number) => `${(x * 100).toFixed(1)} cm`;
function physStatus(r: SignRow): { label: string; tone: "ok" | "warn" | "bad" } {
  const m = Math.max(r.key, r.path);
  if (m > 0.045) return { label: "Fix definition", tone: "bad" };
  if (m > 0.02) return { label: "Settled by solver", tone: "warn" };
  return { label: "Clean", tone: "ok" };
}
const toneClass = { ok: "text-ok border-ok/40 bg-ok/5", warn: "text-warn border-warn/40 bg-warn/5", bad: "text-bad border-bad/40 bg-bad/5" };

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-line bg-panel p-4">
      <div className="font-mono text-[11px] font-semibold uppercase tracking-wider text-ink-3">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums text-ink">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-ink-2">{sub}</div>}
    </div>
  );
}

function Decision({ st }: { st: ItemState }) {
  if (!st.latest) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 text-[13px]">
      <StatusBadge status={st.status} size="sm" />
      <span className="text-ink-2">
        {st.latest.by} · {when(st.latest.at)}
      </span>
      {st.latest.comment && <span className="text-ink">“{st.latest.comment}”</span>}
      {st.approved && st.status !== "approved" && <span className="text-ink-3">(approved earlier by {st.approved.by})</span>}
    </div>
  );
}

export default function Review() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [signs, setSigns] = useState<SignRow[]>([]);
  const [surahs, setSurahs] = useState<SurahMeta[]>([]);
  const local = useLocalReview();
  const events = useAllEvents(local.events);
  const index = useMemo(() => new ReviewIndex(events), [events]);
  const [tab, setTab] = useState<"ayat" | "signs">("ayat");
  const [surah, setSurah] = useState(0);
  const [flag, setFlag] = useState("");
  const [view, setView] = useState<AyahView>("queue");
  const [hideApproved, setHideApproved] = useState(true);
  const [who, setWho] = useState("");
  const [signView, setSignView] = useState<SignView>("bad");
  const [page, setPage] = useState(0);

  useEffect(() => {
    const j = <T,>(u: string, d: T) => fetch(u).then((r) => (r.ok ? (r.json() as Promise<T>) : d)).catch(() => d);
    j<Summary | null>("/data/audit/summary.json", null).then(setSummary);
    j<QueueItem[]>("/data/audit/queue.json", []).then(setQueue);
    j<SignRow[]>("/data/audit/signs.json", []).then(setSigns);
    j<SurahMeta[]>("/data/surahs.json", []).then(setSurahs);
    const q = new URLSearchParams(window.location.search);
    if (q.get("tab") === "signs") setTab("signs");
    const v = q.get("view");
    if (v === "needs-changes" || v === "approved") setView(v);
  }, []);

  const ayat = useMemo(() => index.all("ayah"), [index]);
  const signStates = useMemo(() => index.all("sign"), [index]);
  const bySurah = useMemo(() => {
    const m = new Map<number, { ok: number; nc: number }>();
    for (const [k, st] of ayat) {
      const s = +k.split(":")[0];
      const c = m.get(s) ?? { ok: 0, nc: 0 };
      if (st.status === "approved") c.ok++;
      if (st.status === "needs-changes") c.nc++;
      m.set(s, c);
    }
    return m;
  }, [ayat]);
  const count = (m: Map<string, ItemState>, s: string) => [...m.values()].filter((x) => x.status === s).length;
  const approved = count(ayat, "approved");
  const needs = count(ayat, "needs-changes");
  const totalAyat = summary?.ayat ?? 6236;

  const reviewers = useMemo(() => {
    const m = new Map<string, { approved: number; changes: number; last: string }>();
    for (const e of events) {
      const r = m.get(e.by) ?? { approved: 0, changes: 0, last: e.at };
      if (e.status === "approved") r.approved++;
      if (e.status === "needs-changes") r.changes++;
      r.last = e.at > r.last ? e.at : r.last;
      m.set(e.by, r);
    }
    return [...m.entries()].sort((a, b) => b[1].approved + b[1].changes - (a[1].approved + a[1].changes));
  }, [events]);

  // ---- ayat list ----
  const byKey = useMemo(() => new Map(queue.map((q) => [`${q.s}:${q.a}`, q])), [queue]);
  const rows = useMemo(() => {
    const inSurah = (k: string) => !surah || +k.split(":")[0] === surah;
    const byWho = (st: ItemState) => !who || st.history.some((e) => e.by === who);
    if (view === "queue")
      return queue
        .filter((q) => (!surah || q.s === surah) && (!flag || q.flags.includes(flag)) && (!hideApproved || ayat.get(`${q.s}:${q.a}`)?.status !== "approved"))
        .map((q) => `${q.s}:${q.a}`)
        .filter((k) => !who || byWho(index.get("ayah", k)));
    return [...ayat.entries()]
      .filter(([k, st]) => st.status === view && inSurah(k) && byWho(st))
      .sort((a, b) => (b[1].latest?.at ?? "").localeCompare(a[1].latest?.at ?? ""))
      .map(([k]) => k);
  }, [view, queue, surah, flag, hideApproved, ayat, who, index]);

  // ---- signs ----
  const signRows = useMemo(() => {
    const st = (id: string) => signStates.get(id)?.status;
    const known = new Map(signs.map((r) => [r.id, r]));
    // signs reviewed but missing from the audit (new signs) still show up
    for (const id of signStates.keys()) if (!known.has(id)) known.set(id, { id, uses: 0, key: 0, path: 0, hands: 0, def: signStates.get(id)?.latest?.def ?? "" });
    return [...known.values()]
      .filter((r) => !r.id.endsWith(".drawn"))
      .filter((r) =>
        signView === "all" ? true
        : signView === "bad" ? Math.max(r.key, r.path) > 0.02 && st(r.id) !== "approved"
        : signView === "low" ? r.conf === "low" && st(r.id) !== "approved"
        : st(r.id) === signView,
      )
      .filter((r) => !who || signStates.get(r.id)?.history.some((e) => e.by === who))
      .sort((a, b) => b.uses - a.uses);
  }, [signs, signView, signStates, who]);
  const physBad = signs.filter((r) => Math.max(r.key, r.path) > 0.045).length;

  useEffect(() => setPage(0), [surah, flag, hideApproved, tab, signView, view, who]);
  const total = tab === "ayat" ? rows.length : signRows.length;
  const pages = Math.ceil(total / PAGE);
  const studioQ = (s: number, a: number) => `/studio?surah=${s}&ayah=${a}${flag ? `&flag=${flag}` : ""}${surah ? `&qs=${surah}` : ""}`;
  const sel = surahs.find((s) => s.n === surah);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <header>
        <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-brand">[Verification]</span>
        <h1 className="mt-1 font-serif text-3xl font-medium tracking-tight text-ink sm:text-4xl">Review queue</h1>
        <p className="mt-2 max-w-3xl text-[15px] leading-relaxed text-ink-2">
          Every gloss and every sign is a draft until a Deaf signer approves it. Open an ayah or a sign in the Studio to approve
          it, ask for changes, fix it, or record the sign yourself. The ranking below is automatic and only points the way —
          the judgement is yours.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href={queue[0] ? studioQ(queue[0].s, queue[0].a) : "/studio"} className={`${btn} border-brand bg-brand text-brand-ink hover:bg-brand-2`}>
            <PencilLine aria-hidden className="size-5" /> Start reviewing
          </Link>
          <Link href="/studio?sign=ALLAH" className={`${btn} border-line-2 text-ink hover:bg-panel-2`}>
            Review signs
          </Link>
        </div>
      </header>

      <section className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-5" aria-label="Progress">
        <Stat label="Ayat approved" value={approved.toLocaleString()} sub={`of ${totalAyat.toLocaleString()} · ${((approved / totalAyat) * 100).toFixed(1)}%`} />
        <Stat label="Needs changes" value={needs.toLocaleString()} sub="ayat sent back by a reviewer" />
        <Stat label="Meaning coverage" value={summary ? `${Math.round(summary.medianCoverage * 100)}%` : "—"} sub="median, English content words a sign carries" />
        <Stat label="Signs approved" value={count(signStates, "approved").toLocaleString()} sub={`${count(signStates, "needs-changes")} need changes`} />
        <Stat label="Signs to fix" value={`${physBad}`} sub={`${signs.filter((r) => r.conf === "low").length} low confidence`} />
      </section>

      <section className="mt-6" aria-label="Approved by surah">
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-sm font-semibold text-ink">Approved by surah</h2>
          <span className="flex items-center gap-3 text-xs text-ink-2">
            <span className="inline-flex items-center gap-1"><span className="size-3 rounded-sm" style={{ background: "color-mix(in oklab, var(--ok) 70%, var(--panel))" }} /> approved</span>
            <span className="inline-flex items-center gap-1"><span className="size-2 rounded-full bg-warn" /> needs changes</span>
            · select a surah to filter
          </span>
        </div>
        <div className="grid grid-cols-[repeat(12,minmax(0,1fr))] gap-1 sm:grid-cols-[repeat(19,minmax(0,1fr))] lg:grid-cols-[repeat(38,minmax(0,1fr))]">
          {surahs.map((s) => {
            const c = bySurah.get(s.n) ?? { ok: 0, nc: 0 };
            const done = c.ok / s.ayahs;
            return (
              <button
                key={s.n}
                type="button"
                onClick={() => {
                  setTab("ayat");
                  setSurah(surah === s.n ? 0 : s.n);
                }}
                title={`${s.n}. ${s.name} — ${c.ok}/${s.ayahs} approved${c.nc ? `, ${c.nc} need changes` : ""}`}
                aria-label={`Surah ${s.n} ${s.name}: ${c.ok} of ${s.ayahs} approved${c.nc ? `, ${c.nc} need changes` : ""}`}
                aria-pressed={surah === s.n}
                className={`relative grid aspect-square min-h-6 place-items-center rounded-md border font-mono text-[9px] leading-none text-ink-2 ${surah === s.n ? "border-brand ring-2 ring-brand" : "border-line"}`}
                style={{ background: done > 0 ? `color-mix(in oklab, var(--ok) ${Math.round(25 + done * 75)}%, var(--panel))` : "var(--panel-2)" }}
              >
                <span aria-hidden className="max-sm:hidden">{s.n}</span>
                {c.nc > 0 && <span aria-hidden className="absolute right-0.5 top-0.5 size-1.5 rounded-full bg-warn" />}
              </button>
            );
          })}
        </div>
        {sel && (
          <p className="mt-2 text-sm text-ink" role="status">
            <strong>{sel.n}. {sel.name}</strong>: {bySurah.get(sel.n)?.ok ?? 0} of {sel.ayahs} ayat approved
            {bySurah.get(sel.n)?.nc ? `, ${bySurah.get(sel.n)!.nc} need changes` : ""} ·{" "}
            <Link href={studioQ(sel.n, 1)} className="font-semibold text-brand underline">open in Studio</Link>
          </p>
        )}
      </section>

      {reviewers.length > 0 && (
        <section className="mt-6" aria-label="Reviewers">
          <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink">
            <Users aria-hidden className="size-4" /> Reviewers
          </h2>
          <div className="flex flex-wrap gap-2">
            {reviewers.map(([name, r]) => (
              <button
                key={name}
                type="button"
                aria-pressed={who === name}
                onClick={() => setWho(who === name ? "" : name)}
                className={`${btn} ${who === name ? "border-brand bg-brand-soft text-ink" : "border-line-2 text-ink hover:bg-panel-2"}`}
              >
                {name}
                <span className="font-normal text-ok">{r.approved} ✓</span>
                {r.changes > 0 && <span className="font-normal text-warn">{r.changes} ⚑</span>}
              </button>
            ))}
          </div>
        </section>
      )}

      <div className="mt-8 flex flex-wrap items-center gap-2 border-b border-line pb-3" role="tablist">
        {(["ayat", "signs"] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`min-h-11 rounded-xl px-4 text-sm font-semibold ${tab === t ? "bg-brand text-brand-ink" : "text-ink-2 hover:bg-panel-2"}`}
          >
            {t === "ayat" ? "Ayat" : "Signs"}
          </button>
        ))}
        <div className="ml-auto flex flex-wrap items-center gap-2 text-sm">
          {tab === "ayat" ? (
            <>
              <select value={view} onChange={(e) => setView(e.target.value as AyahView)} className={select} aria-label="Show">
                <option value="queue">To review (ranked)</option>
                <option value="needs-changes">Needs changes ({needs})</option>
                <option value="approved">Approved ({approved})</option>
              </select>
              <select value={surah} onChange={(e) => setSurah(+e.target.value)} className={select} aria-label="Surah">
                <option value={0}>All surahs</option>
                {surahs.map((s) => (
                  <option key={s.n} value={s.n}>
                    {s.n}. {s.name}
                  </option>
                ))}
              </select>
              {view === "queue" && (
                <>
                  <select value={flag} onChange={(e) => setFlag(e.target.value)} className={select} aria-label="Flag">
                    <option value="">Any flag</option>
                    <option value="low-coverage">Meaning gaps</option>
                    <option value="sign-fix">Sign needs fixing</option>
                  </select>
                  <label className="flex min-h-11 items-center gap-2 text-ink-2">
                    <input type="checkbox" className="size-5" checked={hideApproved} onChange={(e) => setHideApproved(e.target.checked)} /> Hide approved
                  </label>
                </>
              )}
            </>
          ) : (
            <select value={signView} onChange={(e) => setSignView(e.target.value as SignView)} className={select} aria-label="Show signs">
              <option value="bad">Motion needs work</option>
              <option value="low">Low confidence</option>
              <option value="needs-changes">Needs changes ({count(signStates, "needs-changes")})</option>
              <option value="approved">Approved ({count(signStates, "approved")})</option>
              <option value="all">All signs</option>
            </select>
          )}
        </div>
      </div>
      <p className="mt-2 text-sm text-ink-2" aria-live="polite">
        {total.toLocaleString()} {tab === "ayat" ? "ayat" : "signs"}
        {who ? ` · reviewed by ${who}` : ""}
      </p>

      {tab === "ayat" ? (
        <ol className="mt-1 divide-y divide-line">
          {rows.slice(page * PAGE, (page + 1) * PAGE).map((k) => {
            const [s, a] = k.split(":").map(Number);
            const q = byKey.get(k);
            const st = index.get("ayah", k);
            return (
              <li key={k} className="grid gap-2 py-4 md:grid-cols-[5rem_1fr_auto]">
                <div className="font-mono text-base font-semibold text-ink">{k}</div>
                <div className="min-w-0 space-y-1.5">
                  {q && <p className="text-[15px] leading-relaxed text-ink-2">{q.en}</p>}
                  <p className="break-words font-mono text-[13px] text-ink">{st.latest?.gloss ?? q?.gloss}</p>
                  {q && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      <span className={`rounded-full border px-2 py-0.5 text-[12px] font-medium ${q.cov < 0.4 ? toneClass.bad : q.cov < 0.6 ? toneClass.warn : toneClass.ok}`}>{Math.round(q.cov * 100)}% coverage</span>
                      {q.flags.filter((f) => FLAG_LABEL[f] && f !== "low-coverage").map((f) => (
                        <span key={f} className={`rounded-full border px-2 py-0.5 text-[12px] font-medium ${toneClass.warn}`}>
                          {FLAG_LABEL[f]}
                        </span>
                      ))}
                      {q.missing.length > 0 && (
                        <span className="text-[12.5px] text-ink-3">
                          uncarried: <span className="text-ink-2">{q.missing.join(", ")}</span>
                        </span>
                      )}
                      {q.signs?.map((sg) => (
                        <Link key={sg} href={`/studio?sign=${encodeURIComponent(sg)}`} className="inline-flex min-h-8 items-center rounded-lg border border-line px-2 font-mono text-[12px] text-ink-2 hover:border-brand hover:text-brand">
                          {sg}
                        </Link>
                      ))}
                    </div>
                  )}
                  <Decision st={st} />
                </div>
                <div className="flex gap-2 md:flex-col md:items-stretch">
                  <Link href={`/surah/${s}?ayah=${a}`} className={`${btn} border-line-2 text-ink hover:bg-panel-2`}>
                    <Eye aria-hidden className="size-4" /> Watch
                  </Link>
                  <Link href={studioQ(s, a)} className={`${btn} border-brand bg-brand text-brand-ink hover:bg-brand-2`}>
                    <PencilLine aria-hidden className="size-4" /> Review
                  </Link>
                </div>
              </li>
            );
          })}
          {!rows.length && <li className="py-10 text-center text-sm text-ink-2">{queue.length || view !== "queue" ? "Nothing in this view." : "Loading…"}</li>}
        </ol>
      ) : (
        <div className="mt-1 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="text-[12px] uppercase tracking-wider text-ink-3">
              <tr>
                <th className="py-2 pr-3 font-semibold">Sign</th>
                <th className="py-2 pr-3 text-right font-semibold">Uses</th>
                <th className="py-2 pr-3 font-semibold">Motion</th>
                <th className="py-2 pr-3 font-semibold">Review</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {signRows.slice(page * PAGE, (page + 1) * PAGE).map((r) => {
                const ph = physStatus(r);
                const st = signStates.get(r.id);
                return (
                  <tr key={r.id} className="align-top">
                    <td className="py-3 pr-3">
                      <div className="font-mono text-base font-semibold text-ink">{r.id}</div>
                      <div className="text-[12px] text-ink-2">
                        {r.mocap ? "Captured (Global Deaf Muslim)" : "Hand-built"} · confidence {r.conf ?? "—"}
                      </div>
                      <div className="max-w-md truncate font-mono text-[11px] text-ink-3" title={r.def}>
                        {r.def}
                      </div>
                    </td>
                    <td className="py-3 pr-3 text-right tabular-nums">{r.uses.toLocaleString()}</td>
                    <td className="py-3 pr-3">
                      <span className={`rounded-full border px-2 py-0.5 text-[12px] font-medium ${toneClass[ph.tone]}`} title={`at keys ${cm(r.key)}, moving ${cm(r.path)}`}>
                        {ph.label}
                      </span>
                    </td>
                    <td className="py-3 pr-3">{st ? <Decision st={st} /> : <StatusBadge status="draft" size="sm" />}</td>
                    <td className="whitespace-nowrap py-3 text-right">
                      <Link href={`/dictionary?sign=${encodeURIComponent(r.id)}`} className={`${btn} mr-2 border-line-2 text-ink hover:bg-panel-2`}>
                        <Eye aria-hidden className="size-4" /> Preview
                      </Link>
                      <Link href={`/studio?sign=${encodeURIComponent(r.id)}`} className={`${btn} border-brand bg-brand text-brand-ink hover:bg-brand-2`}>
                        <PencilLine aria-hidden className="size-4" /> Review
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!signRows.length && <p className="py-10 text-center text-sm text-ink-2">{signs.length ? "Nothing in this view." : "Loading…"}</p>}
        </div>
      )}

      {pages > 1 && (
        <nav className="mt-4 flex items-center justify-center gap-2 text-sm" aria-label="Pages">
          <button type="button" disabled={page === 0} onClick={() => setPage(page - 1)} className={`${btn} border-line-2 disabled:opacity-40`}>
            Previous
          </button>
          <span className="tabular-nums text-ink-2">
            {page + 1} / {pages}
          </span>
          <button type="button" disabled={page >= pages - 1} onClick={() => setPage(page + 1)} className={`${btn} border-line-2 disabled:opacity-40`}>
            Next
          </button>
        </nav>
      )}

      <p className="mt-10 text-xs leading-relaxed text-ink-2">
        Coverage compares the English translation with the meanings of the signs in each gloss; a low score can also mean a good
        paraphrase. Motion is measured on the avatar: how far a hand would sink into the body or the other hand without the
        physics solver. Decisions made in the Studio stay in your browser until you export your contribution bundle; maintainers
        merge bundles with <code>scripts/merge-contributions.ts</code>
        {summary ? ` · audit of ${summary.generated}` : ""}.
      </p>
    </div>
  );
}

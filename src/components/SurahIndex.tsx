"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { loadGlossIndex, loadSurahList, type GlossIndex, type SurahMeta } from "@/lib/data/quran";
import { humanVideos } from "@/lib/data/human-videos";
import { loadBslIndex } from "@/lib/bsl/ayat";
import { CloseIcon, SearchIcon } from "./common/Icons";

type Filter = "all" | "meccan" | "medinan" | "video" | "bsl";
type GroupView = "surah" | "juz";
type LayoutMode = "grid" | "table";

/** First ayah of each juz: [surah, ayah]. */
const JUZ_START: [number, number][] = [
  [1, 1], [2, 142], [2, 253], [3, 93], [4, 24], [4, 148], [5, 82], [6, 111], [7, 88], [8, 41],
  [9, 93], [11, 6], [12, 53], [15, 1], [17, 1], [18, 75], [21, 1], [23, 1], [25, 21], [27, 56],
  [29, 46], [33, 31], [36, 28], [39, 32], [41, 47], [46, 1], [51, 31], [58, 1], [67, 1], [78, 1],
];

/** Juz numbers a surah spans. */
function juzOf(n: number, ayahs: number): number[] {
  const out: number[] = [];
  for (let j = 0; j < 30; j++) {
    const [s, a] = JUZ_START[j];
    const [ns, na] = JUZ_START[j + 1] ?? [115, 1];
    const startsBeforeEnd = s < n || (s === n && a <= ayahs);
    const endsAfterStart = ns > n || (ns === n && na > 1);
    if (startsBeforeEnd && endsAfterStart) out.push(j + 1);
  }
  return out;
}

function normalise(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ'’ʿʾ-]/g, "").replace(/\s+/g, " ");
}

export default function SurahIndex() {
  const [list, setList] = useState<SurahMeta[]>([]);
  const [, setGi] = useState<GlossIndex>({});
  const [bsl, setBsl] = useState<Record<string, number[]>>({});
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [groupView, setGroupView] = useState<GroupView>("surah");
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("grid");

  useEffect(() => {
    loadSurahList().then(setList);
    loadGlossIndex().then(setGi).catch(() => {});
    loadBslIndex().then(setBsl);
  }, []);

  const shown = useMemo(() => {
    const s = normalise(q.trim());
    return list.filter((m) => {
      if (filter === "meccan" && m.place !== "makkah") return false;
      if (filter === "medinan" && m.place !== "madinah") return false;
      if (filter === "video" && !humanVideos(m.n).length) return false;
      if (filter === "bsl" && !bsl[m.n]?.length) return false;
      if (!s) return true;
      return (
        String(m.n) === s ||
        normalise(m.name).includes(s) ||
        normalise(m.meaning).includes(s) ||
        m.nameAr.includes(q.trim())
      );
    });
  }, [list, bsl, q, filter]);

  const groups = useMemo(() => {
    if (groupView === "surah") return [{ title: "", items: shown }];
    const out: { title: string; items: SurahMeta[] }[] = [];
    for (let j = 1; j <= 30; j++) {
      const items = shown.filter((m) => juzOf(m.n, m.ayahs).includes(j));
      if (items.length) out.push({ title: `Juz ${j}`, items });
    }
    return out;
  }, [shown, groupView]);

  const FILTERS: { id: Filter; label: string; count?: number }[] = [
    { id: "all", label: "All 114 Surahs" },
    { id: "meccan", label: "Meccan (86)" },
    { id: "medinan", label: "Medinan (28)" },
    { id: "bsl", label: "Human BSL Aligned" },
    { id: "video", label: "Video Reference Grounded" },
  ];

  return (
    <section id="surahs" aria-labelledby="surah-heading" className="mx-auto w-full max-w-7xl scroll-mt-20 px-4 pt-16">
      {/* Catalog Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
        <div>
          <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-accent">
            Corpus Catalogue &amp; Canonical Index
          </span>
          <h2 id="surah-heading" className="mt-1 font-serif text-2xl font-medium tracking-tight text-ink sm:text-3xl">
            The 114 Surahs of the Holy Qur&apos;an
          </h2>
          <p className="mt-1 text-xs text-ink-3">
            Access the syntactic sign-language gloss, word-by-word morphological roots, and parallel human video recordings.
          </p>
        </div>

        {/* View Switchers */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Layout Mode (Grid vs Table) */}
          <div role="tablist" aria-label="Layout mode" className="flex rounded-md border border-line bg-panel p-0.5 text-xs">
            <button
              role="tab"
              aria-selected={layoutMode === "grid"}
              onClick={() => setLayoutMode("grid")}
              className={`rounded px-3 py-1 font-medium transition ${
                layoutMode === "grid" ? "bg-panel-2 font-semibold text-brand shadow-xs border border-line" : "text-ink-2 hover:text-ink"
              }`}
            >
              Card View
            </button>
            <button
              role="tab"
              aria-selected={layoutMode === "table"}
              onClick={() => setLayoutMode("table")}
              className={`rounded px-3 py-1 font-medium transition ${
                layoutMode === "table" ? "bg-panel-2 font-semibold text-brand shadow-xs border border-line" : "text-ink-2 hover:text-ink"
              }`}
            >
              Concordance Table
            </button>
          </div>

          {/* Group View (Surah vs Juz) */}
          <div role="tablist" aria-label="Group by" className="flex rounded-md border border-line bg-panel p-0.5 text-xs">
            {(["surah", "juz"] as GroupView[]).map((v) => (
              <button
                key={v}
                role="tab"
                aria-selected={groupView === v}
                onClick={() => setGroupView(v)}
                className={`rounded px-3 py-1 font-medium transition ${
                  groupView === v ? "bg-brand text-brand-ink" : "text-ink-2 hover:text-ink"
                }`}
              >
                {v === "surah" ? "Canon Order" : "By Juz (1–30)"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sticky Search & Filter Toolbar */}
      <div className="glass sticky top-16 z-20 -mx-4 mt-4 flex flex-wrap items-center gap-2.5 border-b border-line px-4 py-2.5">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <SearchIcon size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
          <label className="sr-only" htmlFor="surah-search">
            Search surahs
          </label>
          <input
            id="surah-search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search surah name, number, meaning..."
            className="w-full rounded-md border border-line bg-panel py-1.5 pl-8 pr-7 text-xs text-ink outline-none transition placeholder:text-ink-3 focus:border-brand"
          />
          {q && (
            <button
              onClick={() => setQ("")}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-ink-3 hover:text-ink"
            >
              <CloseIcon size={12} />
            </button>
          )}
        </div>

        <div role="group" aria-label="Filter" className="flex flex-wrap gap-1 text-xs">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              aria-pressed={filter === f.id}
              className={`rounded-md border px-2.5 py-1 transition ${
                filter === f.id
                  ? "border-brand bg-brand-soft font-semibold text-brand"
                  : "border-line bg-panel text-ink-2 hover:border-line-2 hover:text-ink"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <span className="ml-auto font-mono text-[11px] text-ink-3" aria-live="polite">
          Showing {shown.length} of {list.length}
        </span>
      </div>

      {/* Catalog Content Area */}
      {!list.length ? (
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-hidden>
          {Array.from({ length: 9 }, (_, i) => (
            <li key={i} className="skeleton h-[96px] rounded-lg" />
          ))}
        </ul>
      ) : !shown.length ? (
        <div className="mt-10 rounded-xl border border-dashed border-line-2 p-10 text-center text-xs text-ink-2">
          No surah matches &ldquo;{q}&rdquo;.{" "}
          <button
            className="font-medium text-brand underline"
            onClick={() => {
              setQ("");
              setFilter("all");
            }}
          >
            Reset query filters
          </button>
        </div>
      ) : layoutMode === "table" ? (
        /* Scholarly Concordance Table View */
        <div className="mt-6 overflow-hidden rounded-xl border border-line bg-panel shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-line bg-panel-2 text-[11px] font-mono uppercase tracking-wider text-ink-3">
                  <th className="py-2.5 pl-4 pr-2 font-medium">#</th>
                  <th className="px-3 py-2.5 font-medium">Surah Name</th>
                  <th className="px-3 py-2.5 font-medium text-right font-serif">الاسم</th>
                  <th className="px-3 py-2.5 font-medium">Revelation</th>
                  <th className="px-3 py-2.5 font-medium text-right">Ayat</th>
                  <th className="px-3 py-2.5 font-medium">ASL Gloss</th>
                  <th className="px-3 py-2.5 font-medium">BSL Status</th>
                  <th className="px-3 py-2.5 font-medium">Reference Video</th>
                  <th className="py-2.5 pl-2 pr-4 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {shown.map((m) => {
                  const vids = humanVideos(m.n);
                  const bslN = bsl[m.n]?.filter((a) => a > 0).length ?? 0;
                  const pct = Math.min(100, Math.round((bslN / m.ayahs) * 100));
                  return (
                    <tr key={m.n} className="transition hover:bg-panel-2/40">
                      <td className="py-2.5 pl-4 pr-2 font-mono text-[11px] text-ink-3">{m.n}</td>
                      <td className="px-3 py-2.5">
                        <Link href={`/surah/${m.n}`} className="font-semibold text-ink hover:text-brand hover:underline">
                          {m.name}
                        </Link>
                        <span className="block text-[11px] text-ink-3">{m.meaning}</span>
                      </td>
                      <td className="arabic px-3 py-2.5 text-right text-lg text-ink" lang="ar">
                        {m.nameAr}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="rounded border border-line px-1.5 py-0.5 text-[10px] uppercase font-mono text-ink-2">
                          {m.place === "makkah" ? "Meccan" : "Medinan"}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-[11px]">{m.ayahs}</td>
                      <td className="px-3 py-2.5">
                        <span className="rounded bg-ok/10 px-2 py-0.5 text-[10px] font-semibold text-ok uppercase">
                          Complete Gloss
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        {bslN > 0 ? (
                          <span className="rounded bg-brand/10 px-2 py-0.5 text-[10px] font-semibold text-brand uppercase">
                            {pct === 100 ? "Human Retargeted" : `Retargeted ${pct}%`}
                          </span>
                        ) : (
                          <span className="rounded bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent uppercase">
                            Draft Lexicon
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        {vids.length > 0 ? (
                          <span className="font-mono text-[11px] text-brand">{vids.length} clips</span>
                        ) : (
                          <span className="text-ink-3 text-[11px]">—</span>
                        )}
                      </td>
                      <td className="py-2.5 pl-2 pr-4 text-right">
                        <Link
                          href={`/surah/${m.n}`}
                          className="inline-flex items-center rounded border border-line px-2.5 py-1 text-[11px] font-medium text-ink transition hover:border-brand hover:bg-brand-soft hover:text-brand"
                        >
                          Access
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Academic Card Grid View */
        groups.map((grp) => (
          <div key={grp.title || "all"} className="mt-6">
            {grp.title && (
              <h3 className="mb-3 mt-6 text-xs font-mono font-semibold uppercase tracking-wider text-accent border-b border-line pb-1">
                {grp.title}
              </h3>
            )}
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {grp.items.map((m, i) => {
                const vids = humanVideos(m.n);
                const bslN = bsl[m.n]?.filter((a) => a > 0).length ?? 0;
                const pct = Math.min(100, Math.round((bslN / m.ayahs) * 100));
                return (
                  <li key={`${grp.title}-${m.n}`} className="animate-fade-up" style={{ animationDelay: `${Math.min(i, 15) * 20}ms` }}>
                    <Link
                      href={`/surah/${m.n}`}
                      className="lift group relative flex h-full flex-col justify-between overflow-hidden rounded-xl border border-line bg-panel p-4 hover:border-brand/70 shadow-xs"
                    >
                      <div>
                        {/* Header: Surah number, Latin, Arabic */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <span className="grid h-7 w-7 shrink-0 place-items-center rounded border border-line bg-panel-2 font-mono text-xs font-semibold text-ink-2 group-hover:border-brand group-hover:text-brand">
                              {m.n}
                            </span>
                            <div>
                              <span className="font-semibold text-ink group-hover:text-brand transition-colors text-sm">
                                {m.name}
                              </span>
                              <span className="block text-[11px] text-ink-3">{m.meaning}</span>
                            </div>
                          </div>
                          <span className="arabic text-xl leading-none text-ink shrink-0" lang="ar">
                            {m.nameAr}
                          </span>
                        </div>

                        {/* Metadata line */}
                        <div className="mt-2.5 flex items-center gap-2 text-[11px] text-ink-3">
                          <span className="font-mono">{m.ayahs} ayat</span>
                          <span>·</span>
                          <span className="uppercase text-[10px] font-mono tracking-wider">
                            {m.place === "makkah" ? "Meccan" : "Medinan"}
                          </span>
                        </div>
                      </div>

                      {/* Footer: Annotation & Reference Status */}
                      <div className="mt-3.5 border-t border-line/60 pt-2.5 flex items-center justify-between text-[10px]">
                        <div className="flex items-center gap-1.5">
                          <span className="rounded bg-ok/10 px-1.5 py-0.5 font-semibold text-ok uppercase">
                            ASL Gloss
                          </span>
                          {bslN > 0 ? (
                            <span className="rounded bg-brand/10 px-1.5 py-0.5 font-semibold text-brand uppercase">
                              BSL {pct}%
                            </span>
                          ) : (
                            <span className="rounded bg-accent/10 px-1.5 py-0.5 font-semibold text-accent uppercase">
                              BSL Draft
                            </span>
                          )}
                        </div>
                        {vids.length > 0 && (
                          <span className="font-mono text-ink-3">
                            {vids.length} video{vids.length > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))
      )}
    </section>
  );
}

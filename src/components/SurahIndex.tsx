"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { loadGlossIndex, loadSurahList, type GlossIndex, type SurahMeta } from "@/lib/data/quran";
import { humanVideos } from "@/lib/data/human-videos";
import { loadBslIndex } from "@/lib/bsl/ayat";
import { CloseIcon, SearchIcon } from "./common/Icons";

type Filter = "all" | "video" | "bsl";
type View = "surah" | "juz";

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
    // juz j covers [s:a, ns:na)
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
  const [gi, setGi] = useState<GlossIndex>({});
  const [bsl, setBsl] = useState<Record<string, number[]>>({});
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [view, setView] = useState<View>("surah");
  useEffect(() => {
    loadSurahList().then(setList);
    loadGlossIndex().then(setGi).catch(() => {});
    loadBslIndex().then(setBsl);
  }, []);

  const shown = useMemo(() => {
    const s = normalise(q.trim());
    return list.filter((m) => {
      if (filter === "video" && !humanVideos(m.n).length) return false;
      if (filter === "bsl" && !bsl[m.n]?.length) return false;
      if (!s) return true;
      return String(m.n) === s || normalise(m.name).includes(s) || normalise(m.meaning).includes(s) || m.nameAr.includes(q.trim());
    });
  }, [list, gi, bsl, q, filter]);

  const groups = useMemo(() => {
    if (view === "surah") return [{ title: "", items: shown }];
    const out: { title: string; items: SurahMeta[] }[] = [];
    for (let j = 1; j <= 30; j++) {
      const items = shown.filter((m) => juzOf(m.n, m.ayahs).includes(j));
      if (items.length) out.push({ title: `Juz ${j}`, items });
    }
    return out;
  }, [shown, view]);

  const FILTERS: { id: Filter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "bsl", label: "Human BSL" },
    { id: "video", label: "Human video" },
  ];

  return (
    <section id="surahs" aria-labelledby="surah-heading" className="mx-auto w-full max-w-7xl scroll-mt-20 px-4 pt-20">
      <div className="flex flex-wrap items-end gap-4">
        <div className="mr-auto">
          <p className="text-sm font-semibold uppercase tracking-wider text-accent">Browse</p>
          <h2 id="surah-heading" className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">All 114 surahs</h2>
        </div>
        <div role="tablist" aria-label="Group by" className="flex rounded-full border border-line bg-panel p-1 text-sm">
          {(["surah", "juz"] as View[]).map((v) => (
            <button
              key={v}
              role="tab"
              aria-selected={view === v}
              onClick={() => setView(v)}
              className={`rounded-full px-4 py-1.5 font-medium transition ${view === v ? "bg-brand text-brand-ink" : "text-ink-2 hover:text-ink"}`}
            >
              {v === "surah" ? "Surah" : "Juz"}
            </button>
          ))}
        </div>
      </div>

      <div className="glass sticky top-16 z-20 -mx-4 mt-6 flex flex-wrap items-center gap-3 border-b border-line px-4 py-3">
        <div className="relative min-w-0 flex-1 sm:max-w-sm">
          <SearchIcon size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3" />
          <label className="sr-only" htmlFor="surah-search">Search surahs</label>
          <input
            id="surah-search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, number or meaning"
            className="w-full rounded-full border border-line bg-panel py-2.5 pl-10 pr-9 text-sm text-ink outline-none transition placeholder:text-ink-3 focus:border-brand"
          />
          {q && (
            <button onClick={() => setQ("")} aria-label="Clear search" className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-ink-3 hover:text-ink">
              <CloseIcon size={14} />
            </button>
          )}
        </div>
        <div role="group" aria-label="Filter" className="flex flex-wrap gap-1.5 text-sm">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              aria-pressed={filter === f.id}
              className={`rounded-full border px-3.5 py-1.5 transition ${filter === f.id ? "border-brand bg-brand-soft font-medium text-brand" : "border-line bg-panel text-ink-2 hover:text-ink"}`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <span className="ml-auto text-xs text-ink-3" aria-live="polite">{shown.length} surahs</span>
      </div>

      {!list.length ? (
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-hidden>
          {Array.from({ length: 9 }, (_, i) => (
            <li key={i} className="skeleton h-[104px] rounded-2xl" />
          ))}
        </ul>
      ) : !shown.length ? (
        <div className="mt-10 rounded-2xl border border-dashed border-line-2 p-10 text-center text-ink-2">
          No surah matches “{q}”.{" "}
          <button className="font-medium text-brand underline" onClick={() => { setQ(""); setFilter("all"); }}>Clear filters</button>
        </div>
      ) : (
        groups.map((grp) => (
          <div key={grp.title || "all"} className="mt-6">
            {grp.title && <h3 className="mb-3 mt-8 text-sm font-semibold uppercase tracking-wider text-ink-3">{grp.title}</h3>}
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {grp.items.map((m, i) => {
                const vids = humanVideos(m.n);
                const bslN = bsl[m.n]?.filter((a) => a > 0).length ?? 0;
                const pct = Math.min(100, Math.round((bslN / m.ayahs) * 100));
                return (
                  <li key={`${grp.title}-${m.n}`} className="animate-fade-up" style={{ animationDelay: `${Math.min(i, 18) * 25}ms` }}>
                    <Link
                      href={`/surah/${m.n}`}
                      className="lift group relative flex h-full items-center gap-4 overflow-hidden rounded-2xl border border-line bg-panel p-4 hover:border-brand/60"
                    >
                      <span className="relative grid h-12 w-12 shrink-0 place-items-center">
                        <svg viewBox="0 0 48 48" className="absolute inset-0 text-panel-2 transition-colors duration-300 group-hover:text-brand" aria-hidden>
                          <path fill="currentColor" d="M24 2l6.4 6.6 9.2-.2-.2 9.2L46 24l-6.6 6.4.2 9.2-9.2-.2L24 46l-6.4-6.6-9.2.2.2-9.2L2 24l6.6-6.4-.2-9.2 9.2.2z" />
                        </svg>
                        <span className="relative text-sm font-semibold text-ink-2 transition-colors group-hover:text-brand-ink">{m.n}</span>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline justify-between gap-2">
                          <span className="truncate font-semibold text-ink">{m.name}</span>
                          <span className="arabic shrink-0 text-xl leading-none text-ink" lang="ar">{m.nameAr}</span>
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-ink-2">
                          {m.meaning} · {m.ayahs} ayat · {m.place === "makkah" ? "Meccan" : "Medinan"}
                        </span>
                        <span className="mt-2.5 flex items-center gap-2">
                          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-panel-2" title={bslN ? `${bslN} of ${m.ayahs} ayat signed by a human BSL translator` : "BSL: draft from learned signs"}>
                            <span className="animate-grow-x block h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
                          </span>
                          <span className="flex shrink-0 gap-1 text-[10px] font-semibold uppercase tracking-wide">
                            <span className="rounded-full bg-ok/15 px-2 py-0.5 text-ok">ASL</span>
                            {bslN ? (
                              <span className="rounded-full bg-brand/15 px-2 py-0.5 text-brand">{pct === 100 ? "BSL" : `BSL ${pct}%`}</span>
                            ) : (
                              <span className="rounded-full bg-accent/15 px-2 py-0.5 text-accent">BSL draft</span>
                            )}
                            {vids.some((v) => v.lang === "ASL") && <span className="rounded-full bg-panel-2 px-2 py-0.5 text-ink-2">Video</span>}
                          </span>
                        </span>
                      </span>
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

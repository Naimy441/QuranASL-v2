"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { loadGlossIndex, loadSurahList, type GlossIndex, type SurahMeta } from "@/lib/data/quran";
import { humanVideos } from "@/lib/data/human-videos";

type Filter = "all" | "curated" | "video";

export default function SurahIndex() {
  const [list, setList] = useState<SurahMeta[]>([]);
  const [gi, setGi] = useState<GlossIndex>({});
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  useEffect(() => {
    loadSurahList().then(setList);
    loadGlossIndex().then(setGi).catch(() => {});
  }, []);
  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    return list.filter((m) => {
      if (filter === "curated" && !(gi[m.n]?.curated ?? (gi[m.n]?.source === "curated" ? gi[m.n].covered : 0))) return false;
      if (filter === "video" && !humanVideos(m.n).length) return false;
      if (!s) return true;
      return String(m.n) === s || m.name.toLowerCase().includes(s) || m.meaning.toLowerCase().includes(s) || m.nameAr.includes(s);
    });
  }, [list, gi, q, filter]);

  return (
    <section aria-labelledby="surah-heading">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h2 id="surah-heading" className="mr-auto text-xl font-semibold">Surahs</h2>
        <label className="sr-only" htmlFor="surah-search">Search surahs</label>
        <input
          id="surah-search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name, number or meaning"
          className="w-64 rounded-lg border border-line bg-panel px-3 py-2 text-sm"
        />
        <div role="group" aria-label="Filter" className="flex rounded-lg border border-line bg-panel p-0.5 text-sm">
          {(["all", "curated", "video"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
              className={`rounded-md px-3 py-1.5 ${filter === f ? "bg-brand text-brand-ink" : "text-ink-2"}`}
            >
              {f === "all" ? "All" : f === "curated" ? "Hand-glossed" : "Human video"}
            </button>
          ))}
        </div>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((m) => {
          const g = gi[m.n];
          const curated = g?.curated ?? (g?.source === "curated" ? g.covered : 0);
          const vids = humanVideos(m.n);
          return (
            <li key={m.n}>
              <Link
                href={`/surah/${m.n}`}
                className="group flex items-center gap-3 rounded-xl border border-line bg-panel p-3 transition hover:border-brand hover:shadow-sm"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-panel-2 text-sm font-semibold text-ink-2 group-hover:bg-brand group-hover:text-brand-ink">
                  {m.n}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="truncate font-medium">{m.name}</span>
                    <span className="arabic text-lg leading-none">{m.nameAr}</span>
                  </span>
                  <span className="block truncate text-xs text-ink-2">
                    {m.meaning} · {m.ayahs} ayat
                  </span>
                  <span className="mt-1.5 flex flex-wrap gap-1 text-[11px]">
                    {curated > 0 ? (
                      <span className="rounded bg-ok/15 px-1.5 py-0.5 text-ok">Hand-glossed</span>
                    ) : (
                      <span className="rounded bg-accent/15 px-1.5 py-0.5 text-accent">Auto draft</span>
                    )}
                    {vids.some((v) => v.lang === "ASL") && <span className="rounded bg-brand/15 px-1.5 py-0.5 text-brand">ASL video</span>}
                    {vids.some((v) => v.lang === "BSL") && <span className="rounded bg-panel-2 px-1.5 py-0.5 text-ink-2">BSL video</span>}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

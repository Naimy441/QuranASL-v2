"use client";

import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";

interface SiteStats {
  ayat: number;
  curated: number;
  signs: number;
  lexical: number;
  bslAyat: number;
  bslSigns: number;
  surahs: number;
}

/** Counts up to `to` once visible. */
function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [v, setV] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !to) return;
    let raf = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const reduce =
        document.documentElement.dataset.motion === "reduce" ||
        matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce) return setV(to);
      const t0 = performance.now();
      const step = (t: number) => {
        const k = Math.min(1, (t - t0) / 1200);
        setV(Math.round(to * (1 - Math.pow(1 - k, 3))));
        if (k < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [to]);

  return (
    <span ref={ref} className="tabular-nums font-mono font-bold tracking-tight text-ink">
      {v.toLocaleString("en")}
      {suffix}
    </span>
  );
}

export default function Stats() {
  const [s, setS] = useState<SiteStats | null>(null);

  useEffect(() => {
    fetch("/data/stats.json")
      .then((r) => r.json())
      .then(setS)
      .catch(() => {});
  }, []);

  const items = [
    {
      n: s?.curated ?? 6236,
      label: "Ayat in ASL Corpus",
      category: "Syntactic Coverage",
      note: "Complete text transcribed in topic-comment sign-language word order",
      spec: "100% Gloss Aligned",
    },
    {
      n: s?.signs ?? 1340,
      label: "Documented Signs",
      category: "Lexical Repository",
      note: "Phonologically parameterized for handshape, palm orientation & movement",
      spec: "Searchable Concordance",
    },
    {
      n: s?.bslAyat ?? 999,
      label: "Ayat in Human BSL",
      category: "Native Reference",
      note: "Segmented and retargeted from Al Isharah BSL Qur'an Project recordings",
      spec: "Native Video Grounding",
    },
    {
      n: s?.surahs ?? 114,
      label: "Surahs Catalogued",
      category: "Full Canon",
      note: "Morphological alignment with the Quranic Arabic Corpus and Saheeh International",
      spec: "Meccan & Medinan",
    },
  ];

  return (
    <section aria-label="Corpus specifications and metrics" className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-12">
      <div className="rounded-2xl border border-line bg-panel p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-line/60 pb-4">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-brand" />
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-ink-3">
              Corpus Specification &amp; Coverage Metrics
            </span>
          </div>
          <Badge variant="outline" size="sm" className="font-mono">
            ISO 639-3: ase / bfi
          </Badge>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((it) => (
            <div
              key={it.label}
              className="flex flex-col justify-between rounded-xl border border-line/80 bg-panel-2/40 p-5 transition-all hover:border-line-2 hover:bg-panel-2/80"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-ink-3">
                    {it.category}
                  </span>
                  <span className="rounded-full border border-line bg-panel px-2 py-0.5 font-mono text-[9px] text-brand font-medium">
                    {it.spec}
                  </span>
                </div>
                <div className="mt-4 text-3xl font-bold tracking-tight text-ink sm:text-4xl font-mono">
                  <Counter to={it.n} />
                </div>
                <p className="mt-1 text-sm font-semibold text-ink">{it.label}</p>
              </div>
              <p className="mt-4 text-xs leading-relaxed text-ink-3 border-t border-line/60 pt-3">
                {it.note}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

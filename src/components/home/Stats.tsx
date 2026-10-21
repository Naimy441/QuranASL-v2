"use client";

import { useEffect, useRef, useState } from "react";
import Reveal from "@/components/common/Reveal";

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
    <span ref={ref} className="tabular-nums font-mono">
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
    <section aria-label="Corpus specifications and metrics" className="mx-auto w-full max-w-7xl px-4 pt-10">
      <div className="rounded-xl border border-line bg-panel p-6 shadow-xs">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-2 border-b border-line pb-4">
          <div>
            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-accent">
              Corpus Metrics &amp; Annotation Specifications
            </span>
            <h2 className="mt-1 font-serif text-xl font-medium tracking-tight text-ink sm:text-2xl">
              Quantitative Coverage of the Digital Qur&apos;anic Corpus
            </h2>
          </div>
          <span className="rounded border border-line bg-panel-2 px-2.5 py-1 text-xs font-mono text-ink-3">
            Annotation Tier: SLP-2.4
          </span>
        </div>

        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {items.map((it, i) => (
            <Reveal key={it.label} delay={i * 60} className="bg-panel p-5 transition hover:bg-panel-2/40">
              <div className="flex items-center justify-between text-xs text-ink-3">
                <span className="font-mono text-[10px] uppercase tracking-wider text-accent">
                  {it.category}
                </span>
                <span className="font-mono text-[10px] text-ink-3">{it.spec}</span>
              </div>
              <p className="mt-3 text-3xl font-medium tracking-tight text-ink sm:text-4xl">
                <Counter to={it.n} />
              </p>
              <p className="mt-1 text-sm font-semibold text-brand">{it.label}</p>
              <p className="mt-2 text-xs leading-relaxed text-ink-2">{it.note}</p>
            </Reveal>
          ))}
        </div>

        {/* Archival metadata note */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-ink-3">
          <span>
            <strong>Data Provenance:</strong> Al Isharah BSL Project · Global Deaf Muslim · Quranic Arabic Corpus · Quran.com
          </span>
          <span className="font-mono text-[11px]">
            Open Access · Non-Commercial Linguistic Research
          </span>
        </div>
      </div>
    </section>
  );
}

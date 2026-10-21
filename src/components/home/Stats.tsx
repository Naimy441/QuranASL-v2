"use client";

import { useEffect, useRef, useState } from "react";
import { Frame } from "@/components/ui/frame";

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
    <span ref={ref} className="tabular-nums font-mono font-semibold tracking-tight text-ink">
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
    <section aria-label="Corpus specifications and metrics" className="mx-auto w-full max-w-7xl px-4 sm:px-6 pt-10">
      <Frame
        withCorners
        withHeader
        headerTitle={
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" />
            <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-ink-3">
              Corpus Specification &amp; Coverage Metrics
            </span>
          </div>
        }
        headerAction={
          <span className="font-mono text-[10px] text-ink-3">
            ISO 639-3: ase / bfi
          </span>
        }
        className="p-6 bg-panel shadow-xs"
      >
        <div className="grid gap-px overflow-hidden rounded-lg border border-line/60 bg-line/60 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((it) => (
            <div
              key={it.label}
              className="flex flex-col justify-between bg-panel p-5 transition-colors hover:bg-panel-2/50"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-medium uppercase tracking-wider text-ink-3">
                    {it.category}
                  </span>
                  <span className="rounded border border-line bg-panel-2 px-1.5 py-0.5 font-mono text-[9px] text-brand">
                    {it.spec}
                  </span>
                </div>
                <div className="mt-3 text-3xl font-light tracking-tight text-ink sm:text-4xl">
                  <Counter to={it.n} />
                </div>
                <p className="mt-1 text-xs font-medium text-ink">{it.label}</p>
              </div>
              <p className="mt-3 text-[11px] leading-relaxed text-ink-3 border-t border-line/40 pt-2.5">
                {it.note}
              </p>
            </div>
          ))}
        </div>
      </Frame>
    </section>
  );
}

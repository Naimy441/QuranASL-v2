"use client";

import { useEffect, useRef, useState } from "react";
import Reveal from "@/components/common/Reveal";

interface SiteStats { ayat: number; curated: number; signs: number; lexical: number; bslAyat: number; bslSigns: number; surahs: number }

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
      const reduce = document.documentElement.dataset.motion === "reduce" || matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce) return setV(to);
      const t0 = performance.now();
      const step = (t: number) => {
        const k = Math.min(1, (t - t0) / 1400);
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
    <span ref={ref} className="tabular-nums">
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
    { n: s?.curated ?? 6236, label: "ayat in ASL", note: "Every ayah glossed in ASL word order" },
    { n: s?.signs ?? 0, label: "ASL signs", note: "In the searchable dictionary" },
    { n: s?.bslAyat ?? 0, label: "ayat in human BSL", note: "Signed by Al Isharah's translators" },
    { n: s?.bslSigns ?? 0, label: "BSL signs learned", note: "Spotted in those recordings" },
  ];
  return (
    <section aria-label="Coverage" className="mx-auto w-full max-w-7xl px-4">
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-line bg-line lg:grid-cols-4">
        {items.map((it, i) => (
          <Reveal key={it.label} delay={i * 80} className="bg-panel p-5 sm:p-7">
            <p className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              <Counter to={it.n} />
            </p>
            <p className="mt-1 text-sm font-medium text-brand">{it.label}</p>
            <p className="mt-1 text-xs text-ink-2">{it.note}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const LINKS = [
  { href: "/", label: "Surahs" },
  { href: "/dictionary", label: "Dictionary" },
  { href: "/practice", label: "Practice" },
  { href: "/studio", label: "Gloss Studio" },
  { href: "/about", label: "About" },
];

export default function SiteNav() {
  const path = usePathname();
  const [hc, setHc] = useState(false);
  useEffect(() => {
    try {
      setHc(localStorage.getItem("qasl-contrast") === "high");
    } catch {}
  }, []);
  useEffect(() => {
    document.documentElement.dataset.contrast = hc ? "high" : "";
    try {
      localStorage.setItem("qasl-contrast", hc ? "high" : "");
    } catch {}
  }, [hc]);
  return (
    <header className="border-b border-line bg-panel">
      <nav className="mx-auto flex max-w-7xl items-center gap-1 px-4 py-2 sm:gap-4" aria-label="Main">
        <Link href="/" className="mr-2 flex items-center gap-2 font-semibold text-ink">
          <span aria-hidden className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-brand-ink">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M8 21v-7.6L5.2 9.6a1.3 1.3 0 0 1 2.1-1.5L9 10.3V3.5a1.25 1.25 0 0 1 2.5 0V9h.5V2.5a1.25 1.25 0 0 1 2.5 0V9h.5V3.5a1.25 1.25 0 0 1 2.5 0V9h.5V5.5a1.25 1.25 0 0 1 2.5 0V14a7 7 0 0 1-7 7z"/></svg>
          </span>
          <span className="hidden sm:inline">QuranASL</span>
        </Link>
        <ul className="flex flex-1 flex-wrap items-center gap-1 text-sm">
          {LINKS.map((l) => {
            const active = l.href === "/" ? path === "/" || path.startsWith("/surah") : path.startsWith(l.href);
            return (
              <li key={l.href}>
                <Link
                  href={l.href}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-md px-2.5 py-1.5 ${active ? "bg-brand text-brand-ink" : "text-ink-2 hover:bg-panel-2 hover:text-ink"}`}
                >
                  {l.label}
                </Link>
              </li>
            );
          })}
        </ul>
        <button
          onClick={() => setHc((v) => !v)}
          aria-pressed={hc}
          className="rounded-md border border-line px-2 py-1 text-xs text-ink-2 hover:text-ink"
          title="Toggle high-contrast mode"
        >
          High contrast
        </button>
      </nav>
    </header>
  );
}

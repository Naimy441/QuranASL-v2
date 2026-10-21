"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { setAppearance, useAppearance, type ThemePref } from "@/lib/prefs";
import {
  CheckIcon, CloseIcon, ContrastIcon, LogoMark, MenuIcon, MonitorIcon, MoonIcon, MotionIcon, SunIcon,
} from "./common/Icons";

const LINKS = [
  { href: "/", label: "Surahs" },
  { href: "/dictionary", label: "Dictionary" },
  { href: "/practice", label: "Practice" },
  { href: "/studio", label: "Studio" },
  { href: "/about", label: "About" },
];

const THEMES: { id: ThemePref; label: string; Icon: typeof SunIcon }[] = [
  { id: "light", label: "Light", Icon: SunIcon },
  { id: "dark", label: "Dark", Icon: MoonIcon },
  { id: "system", label: "System", Icon: MonitorIcon },
];

function Switch({ on, onChange, label, Icon, hint }: { on: boolean; onChange: (v: boolean) => void; label: string; Icon: typeof SunIcon; hint: string }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left hover:bg-panel-2"
    >
      <Icon size={18} className="shrink-0 text-ink-2" />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-ink">{label}</span>
        <span className="block text-xs text-ink-2">{hint}</span>
      </span>
      <span className={`relative h-6 w-10 shrink-0 rounded-full border transition-colors ${on ? "border-brand bg-brand" : "border-line-2 bg-panel-2"}`}>
        <span className={`absolute top-0.5 h-[18px] w-[18px] rounded-full shadow transition-all ${on ? "left-[18px] bg-brand-ink" : "left-0.5 bg-ink-3"}`} />
      </span>
    </button>
  );
}

function AppearanceMenu() {
  const a = useAppearance();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);
  const Cur = a.contrast ? ContrastIcon : a.theme === "dark" ? MoonIcon : a.theme === "light" ? SunIcon : MonitorIcon;
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Appearance"
        title="Appearance"
        className="grid h-9 w-9 place-items-center rounded-full border border-line text-ink-2 transition hover:border-line-2 hover:text-ink"
      >
        <Cur size={18} />
      </button>
      {open && (
        <div
          role="dialog"
          aria-label="Appearance"
          className="animate-scale-in absolute right-0 top-11 z-50 w-72 origin-top-right rounded-2xl border border-line bg-panel p-2 shadow-lift"
        >
          <p className="px-2.5 pb-1.5 pt-1 text-xs font-semibold uppercase tracking-wider text-ink-3">Theme</p>
          <div role="radiogroup" aria-label="Theme" className="grid grid-cols-3 gap-1 rounded-xl bg-panel-2 p-1">
            {THEMES.map(({ id, label, Icon }) => (
              <button
                key={id}
                role="radio"
                aria-checked={a.theme === id}
                onClick={() => setAppearance({ theme: id })}
                className={`flex flex-col items-center gap-1 rounded-lg py-2 text-xs transition ${a.theme === id ? "bg-panel text-ink shadow-soft" : "text-ink-2 hover:text-ink"}`}
              >
                <Icon size={18} />
                {label}
              </button>
            ))}
          </div>
          <div className="mt-2 space-y-0.5">
            <Switch on={a.contrast} onChange={(v) => setAppearance({ contrast: v })} label="High contrast" hint="Black, white and yellow; strongest outlines" Icon={ContrastIcon} />
            <Switch on={a.reduceMotion} onChange={(v) => setAppearance({ reduceMotion: v })} label="Reduce motion" hint="Turns off page animations (not the signer)" Icon={MotionIcon} />
          </div>
        </div>
      )}
    </div>
  );
}

export default function SiteNav() {
  const path = usePathname();
  const [menu, setMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => setMenu(false), [path]);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 8);
    h();
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);
  const isActive = (href: string) => (href === "/" ? path === "/" || path.startsWith("/surah") : path.startsWith(href));
  return (
    <header className={`glass sticky top-0 z-40 border-b transition-colors ${scrolled ? "border-line" : "border-transparent"}`}>
      <nav className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-4" aria-label="Main">
        <Link href="/" className="group mr-3 flex items-center gap-2.5 font-semibold text-ink" aria-label="QuranASL home">
          <LogoMark size={34} className="transition-transform duration-500 group-hover:rotate-45" />
          <span className="text-[17px] tracking-tight">
            Quran<span className="text-brand">ASL</span>
          </span>
        </Link>
        <ul className="hidden flex-1 items-center gap-1 text-sm md:flex">
          {LINKS.map((l) => {
            const active = isActive(l.href);
            return (
              <li key={l.href}>
                <Link
                  href={l.href}
                  aria-current={active ? "page" : undefined}
                  className={`relative rounded-full px-3.5 py-2 font-medium transition ${active ? "bg-brand-soft text-brand" : "text-ink-2 hover:bg-panel-2 hover:text-ink"}`}
                >
                  {l.label}
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="ml-auto flex items-center gap-2">
          <AppearanceMenu />
          <button
            className="grid h-9 w-9 place-items-center rounded-full border border-line text-ink-2 md:hidden"
            onClick={() => setMenu((v) => !v)}
            aria-expanded={menu}
            aria-controls="mobile-menu"
            aria-label={menu ? "Close menu" : "Open menu"}
          >
            {menu ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </nav>
      {menu && (
        <div id="mobile-menu" className="animate-fade-in border-t border-line md:hidden">
          <ul className="mx-auto max-w-7xl space-y-1 px-4 py-3">
            {LINKS.map((l, i) => (
              <li key={l.href} className="animate-fade-up" style={{ animationDelay: `${i * 40}ms` }}>
                <Link
                  href={l.href}
                  aria-current={isActive(l.href) ? "page" : undefined}
                  className={`flex items-center justify-between rounded-xl px-4 py-3 text-base font-medium ${isActive(l.href) ? "bg-brand-soft text-brand" : "text-ink hover:bg-panel-2"}`}
                >
                  {l.label}
                  {isActive(l.href) && <CheckIcon size={16} />}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}

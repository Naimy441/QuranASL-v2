"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { setAppearance, useAppearance, type ThemePref } from "@/lib/prefs";
import {
  CheckIcon, CloseIcon, ContrastIcon, LogoMark, MenuIcon, MonitorIcon, MoonIcon, MotionIcon, SunIcon,
} from "./common/Icons";

const LINKS = [
  { href: "/", label: "Corpus" },
  { href: "/dictionary", label: "Lexicon" },
  { href: "/#methodology", label: "Methodology" },
  { href: "/practice", label: "Practice Lab" },
  { href: "/studio", label: "Gloss Studio" },
  { href: "/about", label: "Documentation" },
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
      className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left hover:bg-panel-2 transition-colors cursor-pointer"
    >
      <Icon size={16} className="shrink-0 text-ink-2" />
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-medium text-ink">{label}</span>
        <span className="block text-[11px] text-ink-3">{hint}</span>
      </span>
      <span className={`relative h-5 w-9 shrink-0 rounded-full border transition-colors ${on ? "border-brand bg-brand" : "border-line bg-panel-2"}`}>
        <span className={`absolute top-0.5 h-3.5 w-3.5 rounded-full transition-all ${on ? "left-[18px] bg-brand-ink" : "left-0.5 bg-ink-3"}`} />
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
        aria-label="Appearance settings"
        title="Appearance settings"
        className="flex h-8 w-8 items-center justify-center rounded-md border border-line bg-panel text-ink-2 transition-colors hover:border-line-2 hover:bg-panel-2 hover:text-ink cursor-pointer"
      >
        <Cur size={15} />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Appearance"
          className="animate-scale-in absolute right-0 top-10 z-50 w-72 origin-top-right rounded-xl border border-line bg-panel p-2 shadow-lg"
        >
          <div className="flex items-center justify-between px-2.5 pb-2 pt-1 text-[11px] font-mono font-medium text-ink-3">
            <span>INTERFACE THEME</span>
            <span className="text-[10px] uppercase">{a.theme}</span>
          </div>

          <div role="radiogroup" aria-label="Theme" className="grid grid-cols-3 gap-1 rounded-lg bg-panel-2 p-1 border border-line/60">
            {THEMES.map(({ id, label, Icon }) => (
              <button
                key={id}
                role="radio"
                aria-checked={a.theme === id}
                onClick={() => setAppearance({ theme: id })}
                className={`flex flex-col items-center gap-1 rounded-md py-1.5 text-xs font-medium transition cursor-pointer ${
                  a.theme === id ? "bg-panel text-ink shadow-xs border border-line" : "text-ink-2 hover:text-ink"
                }`}
              >
                <Icon size={15} />
                <span className="text-[11px]">{label}</span>
              </button>
            ))}
          </div>

          <div className="mt-2 space-y-0.5 border-t border-line/60 pt-2">
            <Switch
              on={a.contrast}
              onChange={(v) => setAppearance({ contrast: v })}
              label="High contrast"
              hint="Black, yellow and white accessibility profile"
              Icon={ContrastIcon}
            />
            <Switch
              on={a.reduceMotion}
              onChange={(v) => setAppearance({ reduceMotion: v })}
              label="Reduce motion"
              hint="Disables non-essential page animations"
              Icon={MotionIcon}
            />
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
    const h = () => setScrolled(window.scrollY > 4);
    h();
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  const isActive = (href: string) =>
    href === "/" ? path === "/" || path.startsWith("/surah") : path.startsWith(href);

  return (
    <header
      className={`glass sticky top-0 z-40 w-full border-b transition-colors duration-200 ${
        scrolled ? "border-line bg-panel/85 shadow-xs" : "border-line/60 bg-panel/70"
      }`}
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Brand / Logo */}
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="group flex items-center gap-2.5 font-semibold text-ink"
            aria-label="QuranASL home"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-panel-2 transition-transform duration-300 group-hover:scale-105">
              <LogoMark size={20} className="text-brand transition-transform duration-500 group-hover:rotate-45" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[15px] font-semibold tracking-tight text-ink">
                Quran<span className="text-brand">ASL</span>
              </span>
              <span className="hidden sm:inline-flex rounded border border-line bg-panel-2 px-1.5 py-0.5 font-mono text-[10px] text-ink-3">
                v2.4
              </span>
            </div>
          </Link>

          {/* Desktop Nav Items */}
          <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
            {LINKS.map((l) => {
              const active = isActive(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    active
                      ? "bg-panel-2 text-ink border border-line"
                      : "text-ink-2 hover:bg-panel-2/70 hover:text-ink"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <Link
            href="/#surahs"
            className="hidden items-center gap-1.5 rounded-md border border-line bg-panel px-2.5 py-1 text-xs text-ink-2 hover:border-line-2 hover:text-ink transition-colors sm:inline-flex"
          >
            <span className="font-mono text-[11px] text-ink-3">Jump to</span>
            <kbd className="rounded border border-line bg-panel-2 px-1.5 py-0.5 font-mono text-[10px] text-ink">
              114 Surahs
            </kbd>
          </Link>

          <AppearanceMenu />

          {/* Mobile Menu Trigger */}
          <button
            className="flex h-8 w-8 items-center justify-center rounded-md border border-line bg-panel text-ink-2 md:hidden hover:border-line-2 hover:text-ink"
            onClick={() => setMenu((v) => !v)}
            aria-expanded={menu}
            aria-controls="mobile-menu"
            aria-label={menu ? "Close menu" : "Open menu"}
          >
            {menu ? <CloseIcon size={16} /> : <MenuIcon size={16} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {menu && (
        <div id="mobile-menu" className="animate-fade-in border-t border-line bg-panel/95 backdrop-blur-md md:hidden">
          <ul className="mx-auto max-w-7xl space-y-1 p-3">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  aria-current={isActive(l.href) ? "page" : undefined}
                  className={`flex items-center justify-between rounded-lg px-3.5 py-2.5 text-sm font-medium transition ${
                    isActive(l.href)
                      ? "bg-brand-soft text-brand font-semibold"
                      : "text-ink hover:bg-panel-2"
                  }`}
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

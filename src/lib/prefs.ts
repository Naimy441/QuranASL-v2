"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

// ---------------------------------------------------------------------------
// Appearance (theme / contrast / motion). Applied to <html> as data attributes;
// layout.tsx runs the same logic inline before first paint so there is no flash.
// ---------------------------------------------------------------------------

export type ThemePref = "system" | "light" | "dark";
export interface Appearance {
  theme: ThemePref;
  contrast: boolean;
  reduceMotion: boolean;
}

import { APPEARANCE_KEY } from "./appearance-boot";
const DEFAULT_APPEARANCE: Appearance = { theme: "system", contrast: false, reduceMotion: false };

function readAppearance(): Appearance {
  try {
    const a = JSON.parse(localStorage.getItem(APPEARANCE_KEY) ?? "{}");
    const legacyHc = localStorage.getItem("qasl-contrast") === "high";
    return { ...DEFAULT_APPEARANCE, ...a, contrast: a.contrast ?? legacyHc };
  } catch {
    return DEFAULT_APPEARANCE;
  }
}

function applyAppearance(a: Appearance) {
  const d = document.documentElement;
  if (a.theme === "system") d.removeAttribute("data-theme");
  else d.setAttribute("data-theme", a.theme);
  if (a.contrast) d.setAttribute("data-contrast", "high");
  else d.removeAttribute("data-contrast");
  if (a.reduceMotion) d.setAttribute("data-motion", "reduce");
  else d.removeAttribute("data-motion");
}

const listeners = new Set<() => void>();
let current: Appearance | null = null;

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
function getAppearance() {
  if (!current) current = readAppearance();
  return current;
}

export function setAppearance(patch: Partial<Appearance>) {
  current = { ...getAppearance(), ...patch };
  try {
    localStorage.setItem(APPEARANCE_KEY, JSON.stringify(current));
    localStorage.removeItem("qasl-contrast");
  } catch {}
  const run = () => applyAppearance(current!);
  // Cross-fade the whole page between themes where the browser supports it.
  const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
  if (doc.startViewTransition && !current.reduceMotion) doc.startViewTransition(run);
  else run();
  listeners.forEach((l) => l());
}

export function useAppearance(): Appearance {
  return useSyncExternalStore(subscribe, getAppearance, () => DEFAULT_APPEARANCE);
}

/** The theme actually showing: "light", "dark" or "contrast". */
export type ResolvedTheme = "light" | "dark" | "contrast";

function resolve(): ResolvedTheme {
  const d = document.documentElement;
  if (d.getAttribute("data-contrast") === "high") return "contrast";
  const t = d.getAttribute("data-theme");
  if (t === "light" || t === "dark") return t;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function useResolvedTheme(): ResolvedTheme {
  const [t, setT] = useState<ResolvedTheme>("light");
  useEffect(() => {
    const update = () => setT(resolve());
    update();
    const mo = new MutationObserver(update);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "data-contrast"] });
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", update);
    return () => {
      mo.disconnect();
      mq.removeEventListener("change", update);
    };
  }, []);
  return t;
}

export function useReducedMotion(): boolean {
  const a = useAppearance();
  const [sys, setSys] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setSys(mq.matches);
    const h = () => setSys(mq.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);
  return a.reduceMotion || sys;
}

// ---------------------------------------------------------------------------
// Viewer preferences, shared by the landing page and the surah viewer.
// ---------------------------------------------------------------------------

export type SignLang = "asl" | "bsl";
export type AvatarId = "amina" | "yusuf" | "maryam" | "sam";
export interface ViewerPrefs {
  avatar: AvatarId;
  rate: number;
  mode: "3d" | "2d";
  lang: SignLang;
}
const VIEWER_KEY = "qasl-viewer";
export const DEFAULT_VIEWER: ViewerPrefs = { avatar: "amina", rate: 0.85, mode: "3d", lang: "asl" };

export function readViewerPrefs(): ViewerPrefs {
  try {
    return { ...DEFAULT_VIEWER, ...JSON.parse(localStorage.getItem(VIEWER_KEY) ?? "{}") };
  } catch {
    return DEFAULT_VIEWER;
  }
}
export function writeViewerPrefs(p: Partial<ViewerPrefs>) {
  try {
    localStorage.setItem(VIEWER_KEY, JSON.stringify({ ...readViewerPrefs(), ...p }));
  } catch {}
}

// ---------------------------------------------------------------------------
// Reading position ("continue where you left off").
// ---------------------------------------------------------------------------

export interface LastRead { surah: number; ayah: number; name: string; at: number }
const LAST_KEY = "qasl-last";
export function readLastRead(): LastRead | null {
  try {
    const v = JSON.parse(localStorage.getItem(LAST_KEY) ?? "null");
    return v && typeof v.surah === "number" ? v : null;
  } catch {
    return null;
  }
}
export function writeLastRead(v: Omit<LastRead, "at">) {
  try {
    localStorage.setItem(LAST_KEY, JSON.stringify({ ...v, at: Date.now() }));
  } catch {}
}

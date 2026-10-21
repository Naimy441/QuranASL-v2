"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PlaybackState } from "@/components/avatar/AvatarCanvas";
import { animateGloss } from "@/lib/asl/gloss";
import { BISMILLAH_GLOSS, loadGloss, loadSurah, loadSurahList, type GlossFile, type Surah, type SurahMeta, type Word } from "@/lib/data/quran";
import { humanVideos } from "@/lib/data/human-videos";
import GlossStrip from "./GlossStrip";
import HumanVideos from "./HumanVideos";
import SignerPicker from "./SignerPicker";
import { loadOverrides } from "@/lib/studio/overrides";
import { useMocapReady } from "@/lib/hooks/useMocap";
import { buildTimeline } from "@/lib/asl/timeline";
import { mocapSign } from "@/lib/asl/mocap";
import { bslDraft } from "@/lib/bsl/draft";
import { getBslLexicon, loadBslLexicon } from "@/lib/bsl/lexicon";
import { loadBslAyat, type BslAyahClip } from "@/lib/bsl/ayat";
import { loadAslHumanAyat, type HumanAyahClip } from "@/lib/asl/humanAyat";
import { readViewerPrefs, writeLastRead, writeViewerPrefs, type AvatarId, type SignLang } from "@/lib/prefs";
import { loadSurahTajweed, loadBismillahTajweed, TAJWEED_LEGEND, type TajweedSegment } from "@/lib/tajweed";
import { TajweedAyah, TajweedWord } from "@/components/quran/TajweedText";
import {
  ArrowLeftIcon, ArrowRightIcon, ContinueIcon, CubeIcon, EditIcon, ExpandIcon, InfoIcon, NextIcon, PauseIcon, PlayIcon, PrevIcon,
  RepeatIcon, ShrinkIcon, SquareIcon, VideoIcon, TextIcon,
} from "@/components/common/Icons";
import { TextEffect } from "@/components/ui/text-effect";

const AvatarCanvas = dynamic(() => import("@/components/avatar/AvatarCanvas"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full place-items-center">
      <span className="h-10 w-10 animate-[spin_1.1s_linear_infinite] rounded-full border-2 border-line border-t-brand" aria-label="Loading signer" />
    </div>
  ),
});

const SPEEDS = [0.5, 0.75, 0.85, 1, 1.25];

function IconToggle({ on, onClick, label, children }: { on: boolean; onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      title={label}
      className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${on ? "border-brand bg-brand-soft text-brand" : "border-line text-ink-2 hover:text-ink"}`}
    >
      {children}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

interface AyahCardProps {
  it: { key: string; label: string; ar: string; en: string; gloss: string; source: string; ayah?: number };
  index: number;
  active: boolean;
  playing: boolean;
  progress: number;
  tajweed: boolean;
  tajweedWords?: TajweedSegment[][];
  cardGloss?: { human: boolean; text: string };
  /** a Global Deaf Muslim signer recorded this ayah (ASL) */
  humanAsl?: boolean;
  onSelect: (index: number) => void;
}

const AyahCard = memo(function AyahCard({
  it,
  index,
  active,
  playing,
  progress,
  tajweed,
  tajweedWords,
  cardGloss,
  humanAsl,
  onSelect,
}: AyahCardProps) {
  return (
    <li data-idx={index} className="ayah-card-item">
      <button
        onClick={() => onSelect(index)}
        aria-current={active ? "true" : undefined}
        className={`group relative w-full rounded-xl border p-4 text-left transition ${active ? "border-brand bg-panel shadow-xs" : "border-line bg-panel/70 hover:border-line-2 hover:bg-panel"}`}
      >
        {active && <span className="absolute inset-y-0 left-0 w-1 bg-brand rounded-l-xl" aria-hidden />}
        {active && (
          <span className="absolute inset-x-0 bottom-0 h-0.5 bg-panel-2 rounded-b-xl overflow-hidden" aria-hidden>
            <span className="block h-full bg-brand transition-[width] duration-100" style={{ width: `${progress * 100}%` }} />
          </span>
        )}
        <div className="mb-1 flex items-center gap-2 text-xs text-ink-2">
          <span className={`grid h-6 min-w-6 place-items-center rounded border border-line px-1 font-mono text-[11px] font-semibold ${active ? "border-brand bg-brand text-brand-ink" : "bg-panel-2 text-ink-2"}`}>
            {it.ayah ?? "✦"}
          </span>
          {cardGloss ? (
            <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider font-mono ${cardGloss.human ? "bg-ok/10 text-ok" : "bg-accent/10 text-accent"}`}>
              {cardGloss.human ? "BSL · Human" : "BSL Draft"}
            </span>
          ) : (
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider font-mono ${it.source === "curated" ? "bg-ok/10 text-ok" : it.source === "community" ? "bg-brand/10 text-brand" : "bg-accent/10 text-accent"}`}
            >
              {it.source === "curated" ? "Glossed" : it.source === "community" ? "Community" : "Auto Draft"}
            </span>
          )}
          {humanAsl && (
            <span className="rounded bg-ok/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-ok" title="Signed by a Global Deaf Muslim signer">
              ASL · Deaf signer
            </span>
          )}
          {active && playing && (
            <span className="ml-auto flex items-end gap-0.5" aria-label="Now signing">
              {[0, 1, 2].map((b) => (
                <span key={b} className="w-0.5 rounded-full bg-brand" style={{ height: 6 + b * 3 }} />
              ))}
            </span>
          )}
        </div>
        <p className="arabic text-right text-[1.65rem] text-ink leading-relaxed" lang="ar">
          <TajweedAyah
            words={tajweedWords}
            tajweed={tajweed}
            fallbackText={it.ar}
          />
        </p>
        <p className="mt-1.5 text-[15px] leading-relaxed text-ink">{it.en}</p>
        {cardGloss ? (
          <p className={`mt-2 text-xs leading-relaxed ${cardGloss.human ? "" : "font-mono"} ${active ? "text-ink-2" : "text-ink-3"}`}>{cardGloss.text}</p>
        ) : (
          <p className={`mt-2 font-mono text-xs leading-relaxed ${active ? "text-ink-2" : "text-ink-3"}`}>{it.gloss}</p>
        )}
      </button>
    </li>
  );
});

const bslDraftCache: Record<string, string> = {};

export default function SurahViewer({ n }: { n: number }) {
  const [surah, setSurah] = useState<Surah | null>(null);
  const [list, setList] = useState<SurahMeta[]>([]);
  const [gloss, setGloss] = useState<GlossFile | null>(null);
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [idx, setIdx] = useState<number>(0); // 0 = bismillah (when present) or first ayah
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState(0.85);
  const [time, setTime] = useState(0);
  const [mode, setMode] = useState<"3d" | "2d">("3d");
  const [avatar, setAvatar] = useState<AvatarId>("amina");
  const [autoNext, setAutoNext] = useState(true);
  const [loop, setLoop] = useState(false);
  const [tab, setTab] = useState<"ayat" | "human">("ayat");
  const [tajweed, setTajweed] = useState(true);
  const [showTajweedLegend, setShowTajweedLegend] = useState(false);
  const [tajweedData, setTajweedData] = useState<TajweedSegment[][][] | null>(null);
  const [bismillahTajweed, setBismillahTajweed] = useState<TajweedSegment[][] | null>(null);
  const [lang, setLang] = useState<SignLang>("asl");
  const [focus, setFocus] = useState(false);
  const [bslAyat, setBslAyat] = useState<Record<string, BslAyahClip> | null>(null);
  const [bslLexReady, setBslLexReady] = useState(false);
  const [aslHuman, setAslHuman] = useState<Record<string, HumanAyahClip> | null>(null);
  /** ASL: play the Global Deaf Muslim signer where a recording exists, or the gloss animation */
  const [aslSource, setAslSource] = useState<"human" | "gloss">("human");
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const pb = useRef<PlaybackState>({ time: 0, playing: false, rate: 0.85, loop: false });
  const listRef = useRef<HTMLOListElement>(null);
  const startAyah = useRef<number | null>(null);
  const mocapReady = useMocapReady();

  useEffect(() => {
    let live = true;
    Promise.all([loadSurah(n), loadGloss(n)]).then(([s, g]) => {
      if (!live) return;
      setSurah(s);
      setGloss(g);
    });
    loadSurahList().then((l) => live && setList(l));
    setOverrides(loadOverrides(n));
    const p = readViewerPrefs();
    setAvatar(p.avatar);
    setRate(p.rate);
    setMode(p.mode);
    setLang(p.lang);
    if (typeof p.tajweed === "boolean") setTajweed(p.tajweed);
    setPrefsLoaded(true);
    const a = parseInt(new URLSearchParams(window.location.search).get("ayah") ?? "");
    startAyah.current = Number.isFinite(a) ? a : null;
    return () => {
      live = false;
    };
  }, [n]);

  useEffect(() => {
    if (prefsLoaded) writeViewerPrefs({ avatar, rate, mode, lang, tajweed });
  }, [avatar, rate, mode, lang, tajweed, prefsLoaded]);

  useEffect(() => {
    if (lang !== "bsl") return;
    let live = true;
    loadBslAyat(n).then((a) => live && setBslAyat(a));
    loadBslLexicon().then(() => live && setBslLexReady(true));
    return () => {
      live = false;
    };
  }, [lang, n]);

  useEffect(() => {
    if (lang !== "asl") return;
    let live = true;
    loadAslHumanAyat(n).then((a) => live && setAslHuman(a));
    return () => {
      live = false;
    };
  }, [lang, n]);

  const hasBismillah = !!surah?.bismillah && n !== 1 && n !== 9;

  useEffect(() => {
    let live = true;
    loadSurahTajweed(n)
      .then((d) => live && setTajweedData(d))
      .catch((e) => console.warn("Could not load tajweed data:", e));
    if (hasBismillah) {
      loadBismillahTajweed()
        .then((d) => live && setBismillahTajweed(d))
        .catch((e) => console.warn("Could not load bismillah tajweed:", e));
    }
    return () => {
      live = false;
    };
  }, [n, hasBismillah]);
  const items = useMemo(() => {
    if (!surah) return [];
    const out: { key: string; label: string; ar: string; en: string; gloss: string; source: string; ayah?: number }[] = [];
    if (hasBismillah)
      out.push({ key: "b", label: "Bismillah", ar: "بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ", en: "In the name of Allah, the Entirely Merciful, the Especially Merciful.", gloss: BISMILLAH_GLOSS, source: "curated" });
    for (const a of surah.ayat) {
      const g = overrides[a.n] ?? gloss?.ayat[a.n]?.gloss ?? "";
      out.push({ key: String(a.n), label: `${n}:${a.n}`, ar: a.ar, en: a.en, gloss: g, source: overrides[a.n] ? "community" : gloss?.ayat[a.n]?.source ?? "auto", ayah: a.n });
    }
    return out;
  }, [surah, gloss, overrides, hasBismillah, n]);

  // jump to ?ayah= once the list exists
  useEffect(() => {
    if (!items.length || startAyah.current == null) return;
    const j = items.findIndex((it) => it.ayah === startAyah.current);
    startAyah.current = null;
    if (j >= 0) setIdx(j);
  }, [items]);

  const cur = items[idx];
  const bslClip = lang === "bsl" && cur ? bslAyat?.[cur.ayah ?? 0] : undefined;
  const aslClipAvail = lang === "asl" && cur ? aslHuman?.[cur.ayah ?? 0] : undefined;
  const aslClip = aslSource === "human" ? aslClipAvail : undefined;
  const humanClip = bslClip ?? aslClip;
  const anim = useMemo(() => {
    if (!cur) return null;
    if (lang === "bsl") {
      if (bslClip) {
        // the whole ayah as signed by a human BSL translator
        const timeline = buildTimeline([{ index: 0, label: "BSL", kind: "sign", sign: mocapSign(bslClip, 1) }]);
        const tokens = bslClip.gloss ? animateGloss(bslClip.gloss, getBslLexicon()).tokens : [];
        return { timeline, tokens };
      }
      const g = bslDraft(cur.en);
      return g ? animateGloss(g, getBslLexicon()) : null;
    }
    if (aslClip) {
      // the whole ayah as signed by a Global Deaf Muslim signer
      return { timeline: buildTimeline([{ index: 0, label: "ASL", kind: "sign", sign: mocapSign(aslClip, 1) }]), tokens: [] };
    }
    return cur.gloss ? animateGloss(cur.gloss) : null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cur, lang, bslClip, aslClip, bslLexReady, mocapReady]);

  // what each ayah card shows under the translation, per language
  const cardGloss = useMemo(() => {
    if (lang !== "bsl") return null;
    return items.map((it) => {
      const clip = it.ayah ? bslAyat?.[it.ayah] : undefined;
      if (clip) return { human: true, text: `Signed by an Al Isharah BSL translator · ${Math.floor(clip.start / 60)}:${String(Math.floor(clip.start % 60)).padStart(2, "0")} in the recording` };
      if (!bslLexReady) return { human: false, text: "" };
      let d = bslDraftCache[it.en];
      if (d === undefined) {
        d = bslDraft(it.en) || "No learned BSL signs for this ayah yet";
        bslDraftCache[it.en] = d;
      }
      return { human: false, text: d };
    });
  }, [lang, items, bslAyat, bslLexReady]);
  const bslHumanCount = lang === "bsl" && bslAyat ? Object.keys(bslAyat).filter((k) => k !== "0").length : 0;
  const aslHumanCount = lang === "asl" && aslHuman ? Object.keys(aslHuman).filter((k) => k !== "0").length : 0;

  // remember where the reader is
  useEffect(() => {
    if (surah && cur?.ayah) writeLastRead({ surah: n, ayah: cur.ayah, name: surah.name });
  }, [surah, cur, n]);

  // keep playback ref in sync
  useEffect(() => {
    pb.current.rate = rate;
  }, [rate]);
  useEffect(() => {
    pb.current.loop = loop;
  }, [loop]);

  const go = useCallback(
    (i: number, autoplay = true) => {
      if (!items.length) return;
      const j = Math.max(0, Math.min(items.length - 1, i));
      setIdx(j);
      pb.current.time = 0;
      pb.current.playing = autoplay;
      setPlaying(autoplay);
      setTime(0);
    },
    [items.length],
  );

  const toggle = useCallback(() => {
    if (anim && pb.current.time >= anim.timeline.dur - 0.01) pb.current.time = 0;
    pb.current.playing = !pb.current.playing;
    setPlaying(pb.current.playing);
  }, [anim]);

  const onEnd = useCallback(() => {
    setPlaying(false);
    if (autoNext && idx < items.length - 1) setTimeout(() => go(idx + 1), 350);
  }, [autoNext, idx, items.length, go]);

  // keyboard shortcuts
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === " " || e.key === "k") {
        e.preventDefault();
        toggle();
      } else if (e.key === "ArrowRight" || e.key === "l") go(idx + 1);
      else if (e.key === "ArrowLeft" || e.key === "j") go(idx - 1);
      else if (e.key === "+" || e.key === "=") setRate((r) => Math.min(1.5, +(r + 0.1).toFixed(2)));
      else if (e.key === "-") setRate((r) => Math.max(0.25, +(r - 0.1).toFixed(2)));
      else if (e.key === "f") setFocus((v) => !v);
      else if (e.key === "Escape") setFocus(false);
      else if (e.key === "r") setLoop((v) => !v);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [toggle, go, idx]);

  // scroll active ayah into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${idx}"]`);
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [idx]);

  const activeToken = useMemo(() => {
    if (!anim) return -1;
    const it = anim.timeline.items.find((x) => time >= x.start - 0.05 && time <= x.end + 0.05 && x.kind !== "pause");
    return it?.index ?? -1;
  }, [anim, time]);
  const activeLabel = anim?.tokens.find((t) => t.index === activeToken);

  const seek = (t: number) => {
    pb.current.time = t;
    setTime(t);
  };

  const vids = humanVideos(n);
  const dur = anim?.timeline.dur ?? 1;
  const progress = Math.min(1, time / dur);
  const prevMeta = list.find((m) => m.n === n - 1);
  const nextMeta = list.find((m) => m.n === n + 1);
  const curatedCount = items.filter((i) => i.source === "curated" && i.ayah).length;

  if (!surah)
    return (
      <div className="mx-auto grid w-full max-w-7xl flex-1 gap-5 px-4 py-6 lg:grid-cols-[1.05fr_1fr]" aria-busy>
        <div className="space-y-3">
          <div className="skeleton h-8 w-64 rounded-lg" />
          <div className="skeleton h-[60vh] rounded-3xl" />
          <div className="skeleton h-28 rounded-3xl" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="skeleton h-32 rounded-2xl" />
          ))}
        </div>
      </div>
    );

  const statusBadge =
    lang === "bsl" ? (
      bslClip ? (
        <span className="inline-flex items-center gap-1.5 rounded-md border border-ok/40 bg-ok/10 px-2.5 py-1 text-[11px] font-semibold text-ok shadow-xs backdrop-blur">
          <VideoIcon size={13} /> Human BSL translator, retargeted
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5 rounded-md border border-accent/40 bg-accent/10 px-2.5 py-1 text-[11px] font-semibold text-accent shadow-xs backdrop-blur">
          <InfoIcon size={13} /> BSL rough draft
        </span>
      )
    ) : aslClip ? (
      <span className="inline-flex items-center gap-1.5 rounded-md border border-ok/40 bg-ok/10 px-2.5 py-1 text-[11px] font-semibold text-ok shadow-xs backdrop-blur">
        <VideoIcon size={13} /> Global Deaf Muslim signer, retargeted
      </span>
    ) : cur?.source === "auto" ? (
      <span className="inline-flex items-center gap-1.5 rounded-md border border-accent/40 bg-accent/10 px-2.5 py-1 text-[11px] font-semibold text-accent shadow-xs backdrop-blur">
        <InfoIcon size={13} /> Automatic draft
      </span>
    ) : (
      <span className="inline-flex items-center gap-1.5 rounded-md border border-line bg-panel/90 px-2.5 py-1 text-[11px] font-semibold text-ok shadow-xs backdrop-blur">
        <span className="h-1.5 w-1.5 rounded-full bg-ok" /> ASL gloss · draft for Deaf review
      </span>
    );

  return (
    <div className={`mx-auto grid w-full max-w-[1400px] flex-1 gap-5 px-3 py-4 sm:px-4 ${focus ? "" : "lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]"}`}>
      {/* ---------- stage ---------- */}
      <section aria-label="Signing avatar" className={`flex flex-col gap-3 ${focus ? "" : "lg:sticky lg:top-20 lg:h-[calc(100vh-6rem)]"}`}>
        <header className="animate-fade-up flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <Link href="/#surahs" className="inline-flex items-center gap-1 text-xs text-ink-3 transition hover:text-ink">
              <ArrowLeftIcon size={14} /> Back to Corpus Index
            </Link>
            <h1 className="mt-1 flex flex-wrap items-baseline gap-x-3 font-serif text-2xl font-medium tracking-tight text-ink sm:text-3xl">
              <span>
                <span className="text-ink-3">{surah.n}.</span>{" "}
                <TextEffect per="char" preset="fade" className="inline-block">
                  {surah.name}
                </TextEffect>
              </span>
              <span className="arabic text-3xl font-normal leading-none" lang="ar">{surah.nameAr}</span>
            </h1>
            <p className="mt-0.5 text-xs text-ink-2 font-mono">
              {surah.meaning} · {surah.ayahs} ayat · {surah.place === "makkah" ? "Meccan" : "Medinan"}
              {lang === "asl" && curatedCount > 0 && <> · <span className="text-ok font-semibold">{curatedCount === surah.ayahs ? "complete gloss tier" : `${curatedCount} hand-glossed`}</span></>}
              {lang === "asl" && aslHumanCount > 0 && <> · <span className="text-ok font-semibold">{aslHumanCount} ayat by a Deaf signer</span></>}
              {lang === "bsl" && <> · <span className={bslHumanCount ? "text-ok font-semibold" : "text-accent font-semibold"}>{bslHumanCount ? `${bslHumanCount} ayat by human translator` : "BSL draft"}</span></>}
            </p>
          </div>
          <div role="radiogroup" aria-label="Sign language" className="grid grid-cols-2 rounded-md border border-line bg-panel p-0.5 text-xs">
            {(["asl", "bsl"] as SignLang[]).map((l) => (
              <button
                key={l}
                role="radio"
                aria-checked={lang === l}
                onClick={() => setLang(l)}
                title={l === "asl" ? "American Sign Language" : "British Sign Language"}
                className={`rounded px-3 py-1 font-semibold transition ${lang === l ? "bg-brand text-brand-ink shadow-xs" : "text-ink-2 hover:text-ink"}`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </header>

        <div className={`stage relative flex-1 overflow-hidden rounded-xl border border-line shadow-xs ${focus ? "min-h-[72vh]" : "min-h-[380px]"}`}>
          <AvatarCanvas
            className="absolute inset-0"
            timeline={anim?.timeline ?? null}
            playback={pb}
            onTime={setTime}
            onEnd={onEnd}
            mode={mode}
            avatar={avatar}
            ariaLabel={`Avatar signing ${cur?.label ?? ""} in ${lang.toUpperCase()}`}
          />
          {/* top overlays */}
          <div className="pointer-events-none absolute inset-x-3 top-3 flex items-start justify-between gap-2">
            <div className="pointer-events-auto flex flex-col items-start gap-1.5">
              {statusBadge}
              <span className="rounded-md border border-line bg-panel/90 px-2 py-0.5 font-mono text-[11px] font-semibold text-ink shadow-xs backdrop-blur">{cur?.label}</span>
            </div>
            <div className="pointer-events-auto flex items-center gap-1.5">
              <SignerPicker value={avatar} onChange={setAvatar} />
              <button
                onClick={() => setMode((m) => (m === "3d" ? "2d" : "3d"))}
                className="grid h-8 w-8 place-items-center rounded-md border border-line bg-panel/90 text-ink shadow-xs backdrop-blur transition hover:bg-panel"
                aria-label={`Switch to ${mode === "3d" ? "flat 2D" : "3D"} view`}
                title={mode === "3d" ? "Flat 2D view" : "3D view"}
              >
                {mode === "3d" ? <SquareIcon size={16} /> : <CubeIcon size={16} />}
              </button>
              <button
                onClick={() => setFocus((v) => !v)}
                className="grid h-8 w-8 place-items-center rounded-md border border-line bg-panel/90 text-ink shadow-xs backdrop-blur transition hover:bg-panel"
                aria-label={focus ? "Exit focus mode" : "Focus mode"}
                aria-pressed={focus}
                title={focus ? "Exit focus mode (F)" : "Focus mode (F)"}
              >
                {focus ? <ShrinkIcon size={16} /> : <ExpandIcon size={16} />}
              </button>
            </div>
          </div>
          {/* caption */}
          <div aria-live="polite" className="pointer-events-none absolute inset-x-0 bottom-4 flex flex-col items-center gap-2 px-4">
            {activeLabel && activeLabel.status !== "pause" && (
              <span key={activeLabel.index} className="rounded-md border border-white/20 bg-black/85 px-3.5 py-1 font-mono text-base font-semibold tracking-wider text-white shadow-sm backdrop-blur">
                {activeLabel.kind === "fs" || activeLabel.status === "fallback" ? <span className="mr-1 text-white/60">fs:</span> : null}
                {activeLabel.gloss}
              </span>
            )}
            {focus && cur && <p className="max-w-3xl rounded-lg border border-line bg-panel/90 px-4 py-2 text-center text-sm text-ink shadow-xs backdrop-blur">{cur.en}</p>}
          </div>
          {!playing && time === 0 && anim && (
            <button
              onClick={toggle}
              className="btn-primary absolute left-1/2 top-1/2 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full shadow-md transition hover:scale-105"
              aria-label="Play this ayah"
            >
              <PlayIcon size={24} />
            </button>
          )}
        </div>

        {/* transport */}
        <div className="rounded-xl border border-line bg-panel p-3.5 shadow-xs">
          <div className="flex items-center gap-3">
            <button onClick={() => go(idx - 1)} className="grid h-10 w-10 place-items-center rounded-full text-ink-2 transition hover:bg-panel-2 hover:text-ink disabled:opacity-30" aria-label="Previous ayah" disabled={idx === 0}>
              <PrevIcon size={18} />
            </button>
            <button onClick={toggle} className="btn-primary grid h-12 w-12 shrink-0 place-items-center rounded-full" aria-label={playing ? "Pause" : "Play"}>
              {playing ? <PauseIcon size={20} /> : <PlayIcon size={20} />}
            </button>
            <button onClick={() => go(idx + 1)} className="grid h-10 w-10 place-items-center rounded-full text-ink-2 transition hover:bg-panel-2 hover:text-ink disabled:opacity-30" aria-label="Next ayah" disabled={idx >= items.length - 1}>
              <NextIcon size={18} />
            </button>
            {/* scrubber */}
            <div className="relative flex min-w-0 flex-1 items-center">
              <div className="pointer-events-none absolute inset-x-0 h-1.5 rounded-full bg-panel-2">
                <div className="h-full rounded-full bg-brand" style={{ width: `${progress * 100}%` }} />
              </div>
              <input
                type="range"
                className="relative w-full cursor-pointer appearance-none bg-transparent [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-panel [&::-webkit-slider-thumb]:bg-brand [&::-webkit-slider-thumb]:shadow"
                min={0}
                max={dur}
                step={0.01}
                value={Math.min(time, dur)}
                onChange={(e) => seek(+e.target.value)}
                aria-label="Scrub through ayah"
                aria-valuetext={`${time.toFixed(1)} of ${dur.toFixed(1)} seconds`}
              />
            </div>
            <span className="hidden w-20 text-right font-mono text-xs tabular-nums text-ink-3 sm:block">
              {time.toFixed(1)} / {dur.toFixed(1)}s
            </span>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <div role="radiogroup" aria-label="Speed" className="flex items-center rounded-full border border-line p-0.5 text-xs">
              {SPEEDS.map((s) => (
                <button
                  key={s}
                  role="radio"
                  aria-checked={Math.abs(rate - s) < 0.01}
                  onClick={() => setRate(s)}
                  className={`rounded-full px-2.5 py-1 font-mono transition ${Math.abs(rate - s) < 0.01 ? "bg-ink text-bg" : "text-ink-2 hover:text-ink"}`}
                >
                  {s}×
                </button>
              ))}
            </div>
            <IconToggle on={autoNext} onClick={() => setAutoNext((v) => !v)} label="Continue">
              <ContinueIcon size={14} />
            </IconToggle>
            <IconToggle on={loop} onClick={() => setLoop((v) => !v)} label="Repeat ayah">
              <RepeatIcon size={14} />
            </IconToggle>
            <span className="ml-auto text-xs text-ink-3">
              {idx + 1} / {items.length}
            </span>
          </div>
          {anim && anim.tokens.length > 0 && <GlossStrip tokens={anim.tokens} items={anim.timeline.items} active={activeToken} onSeek={seek} />}
          {lang === "bsl" && bslClip && !anim?.tokens.length && (
            <p className="mt-3 text-xs text-ink-2">
              The whole ayah is the human translator&apos;s motion, so it is not split into individual signs.{" "}
              <button className="font-medium text-brand underline" onClick={() => setTab("human")}>Watch the original video</button>
            </p>
          )}
          {lang === "asl" && aslClipAvail && (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-ink-2">
              <div role="radiogroup" aria-label="ASL source" className="grid grid-cols-2 rounded-md border border-line bg-panel p-0.5">
                {(["human", "gloss"] as const).map((src) => (
                  <button
                    key={src}
                    role="radio"
                    aria-checked={aslSource === src}
                    onClick={() => {
                      setAslSource(src);
                      seek(0);
                    }}
                    className={`rounded px-3 py-1 font-semibold transition ${aslSource === src ? "bg-brand text-brand-ink shadow-xs" : "text-ink-2 hover:text-ink"}`}
                  >
                    {src === "human" ? "Deaf signer" : "Gloss"}
                  </button>
                ))}
              </div>
              <span>
                {aslSource === "human"
                  ? `The avatar replays the Global Deaf Muslim signer's motion for this ayah${aslClipAvail.timing === "page" ? " (where it starts and ends is estimated: the video shows several ayat at once)" : ""}.`
                  : "The avatar signs the written gloss, sign by sign."}{" "}
                <button className="font-medium text-brand underline" onClick={() => setTab("human")}>Watch the original video</button>
              </span>
            </div>
          )}
        </div>
      </section>

      {/* ---------- text ---------- */}
      {!focus && (
        <section aria-label="Ayat" className="flex min-h-0 flex-col">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <div role="tablist" className="flex rounded-full border border-line bg-panel p-1 text-sm">
              <button role="tab" aria-selected={tab === "ayat"} onClick={() => setTab("ayat")} className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 font-medium transition ${tab === "ayat" ? "bg-brand text-brand-ink" : "text-ink-2 hover:text-ink"}`}>
                <TextIcon size={15} /> Ayat
              </button>
              <button role="tab" aria-selected={tab === "human"} onClick={() => setTab("human")} className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 font-medium transition ${tab === "human" ? "bg-brand text-brand-ink" : "text-ink-2 hover:text-ink"}`}>
                <VideoIcon size={15} /> Human signers{vids.length ? ` · ${vids.length}` : ""}
              </button>
            </div>
            {tab === "ayat" && (
              <>
                <button
                  role="switch"
                  aria-checked={tajweed}
                  onClick={() => setTajweed((v) => !v)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${tajweed ? "border-brand bg-brand-soft text-brand shadow-xs" : "border-line text-ink-2 hover:text-ink"}`}
                  title="Toggle Tajweed recitation colors"
                >
                  <span className="inline-flex items-center gap-0.5" aria-hidden="true">
                    <span className="h-2 w-2 rounded-full tj-qalaqah" style={{ backgroundColor: "currentColor" }} />
                    <span className="h-2 w-2 rounded-full tj-ikhafa" style={{ backgroundColor: "currentColor" }} />
                    <span className="h-2 w-2 rounded-full tj-madda_normal" style={{ backgroundColor: "currentColor" }} />
                  </span>
                  <span>Tajweed</span>
                </button>
                {tajweed && (
                  <button
                    onClick={() => setShowTajweedLegend((v) => !v)}
                    className={`rounded-full border border-line px-2.5 py-1.5 text-xs text-ink-2 transition hover:text-ink ${showTajweedLegend ? "border-brand bg-panel-2 text-ink font-medium" : "hover:bg-panel-2"}`}
                    title="Tajweed Color Guide"
                    aria-label="Tajweed Color Guide"
                  >
                    Legend
                  </button>
                )}
              </>
            )}
            <Link href={`/studio?surah=${n}&ayah=${cur?.ayah ?? 1}`} className="ml-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-ink-2 transition hover:bg-panel-2 hover:text-ink">
              <EditIcon size={15} /> Edit in Studio
            </Link>
          </div>
          {tab === "ayat" && showTajweedLegend && (
            <div className="mb-3 rounded-2xl border border-line bg-panel p-4 text-xs shadow-xs animate-fade-up">
              <div className="flex items-center justify-between border-b border-line pb-2.5 mb-3">
                <div className="flex items-baseline gap-2">
                  <span className="font-semibold text-ink">Tajweed Recitation Palette</span>
                  <span className="text-[11px] text-ink-3 font-mono">Standard Hafs Quranic Coding</span>
                </div>
                <button
                  onClick={() => setShowTajweedLegend(false)}
                  className="rounded px-2 py-0.5 text-xs text-ink-3 transition hover:bg-panel-2 hover:text-ink"
                >
                  Close
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {TAJWEED_LEGEND.map((cat) => (
                  <div key={cat.title} className="space-y-1.5">
                    <p className="font-mono text-[10px] uppercase tracking-wider text-ink-3 font-semibold">{cat.title}</p>
                    <div className="space-y-1">
                      {cat.rules.map((r) => (
                        <div key={r.key} className="flex items-center gap-2">
                          <span className={`h-2.5 w-2.5 rounded-full shrink-0 tj-${r.colorKey}`} style={{ backgroundColor: "currentColor" }} />
                          <span className="text-ink text-[11px] truncate">{r.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {tab === "human" ? (
            <HumanVideos videos={vids} seek={humanClip ? { id: humanClip.video, start: humanClip.start } : aslClipAvail ? { id: aslClipAvail.video, start: aslClipAvail.start } : undefined} />
          ) : (
            <ol ref={listRef} className="flex-1 space-y-2.5 overflow-y-auto pb-4 pr-1 lg:max-h-[calc(100vh-10rem)]">
              {items.map((it, i) => {
                const active = i === idx;
                const ayahIndex = it.ayah != null ? it.ayah - 1 : -1;
                return (
                  <AyahCard
                    key={it.key}
                    it={it}
                    index={i}
                    active={active}
                    playing={playing}
                    progress={active ? progress : 0}
                    tajweed={tajweed}
                    tajweedWords={it.key === "b" ? (bismillahTajweed ?? undefined) : ayahIndex >= 0 ? tajweedData?.[ayahIndex] : undefined}
                    cardGloss={cardGloss ? cardGloss[i] : undefined}
                    humanAsl={lang === "asl" && !!aslHuman?.[it.ayah ?? 0]}
                    onSelect={go}
                  />
                );
              })}
              <li className="grid grid-cols-2 gap-2.5 pt-2">
                {prevMeta ? (
                  <Link href={`/surah/${prevMeta.n}`} className="lift flex items-center gap-2 rounded-2xl border border-line bg-panel p-4 text-sm">
                    <ArrowLeftIcon size={16} className="text-ink-3" />
                    <span className="min-w-0">
                      <span className="block text-xs text-ink-3">Previous</span>
                      <span className="block truncate font-medium">{prevMeta.n}. {prevMeta.name}</span>
                    </span>
                  </Link>
                ) : <span />}
                {nextMeta && (
                  <Link href={`/surah/${nextMeta.n}`} className="lift flex items-center justify-end gap-2 rounded-2xl border border-line bg-panel p-4 text-right text-sm">
                    <span className="min-w-0">
                      <span className="block text-xs text-ink-3">Next</span>
                      <span className="block truncate font-medium">{nextMeta.n}. {nextMeta.name}</span>
                    </span>
                    <ArrowRightIcon size={16} className="text-ink-3" />
                  </Link>
                )}
              </li>
            </ol>
          )}
          <p className="mt-2 hidden text-xs text-ink-3 lg:block">
            <kbd className="rounded border border-line px-1">Space</kbd> play · <kbd className="rounded border border-line px-1">←</kbd>
            <kbd className="rounded border border-line px-1">→</kbd> ayah · <kbd className="rounded border border-line px-1">+</kbd>
            <kbd className="rounded border border-line px-1">−</kbd> speed · <kbd className="rounded border border-line px-1">R</kbd> repeat ·{" "}
            <kbd className="rounded border border-line px-1">F</kbd> focus. English: Saheeh International.
          </p>
        </section>
      )}
    </div>
  );
}

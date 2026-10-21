"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PlaybackState } from "@/components/avatar/AvatarCanvas";
import { animateGloss } from "@/lib/asl/gloss";
import { BISMILLAH_GLOSS, loadGloss, loadSurah, loadSurahList, type GlossFile, type Surah, type SurahMeta } from "@/lib/data/quran";
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
import { readViewerPrefs, writeLastRead, writeViewerPrefs, type AvatarId, type SignLang } from "@/lib/prefs";
import {
  ArrowLeftIcon, ArrowRightIcon, ContinueIcon, CubeIcon, EditIcon, ExpandIcon, InfoIcon, NextIcon, PauseIcon, PlayIcon, PrevIcon,
  RepeatIcon, ShrinkIcon, SquareIcon, VideoIcon, TextIcon,
} from "@/components/common/Icons";

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
  const [showWords, setShowWords] = useState(false);
  const [lang, setLang] = useState<SignLang>("asl");
  const [focus, setFocus] = useState(false);
  const [bslAyat, setBslAyat] = useState<Record<string, BslAyahClip> | null>(null);
  const [bslLexReady, setBslLexReady] = useState(false);
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
    setPrefsLoaded(true);
    const a = parseInt(new URLSearchParams(window.location.search).get("ayah") ?? "");
    startAyah.current = Number.isFinite(a) ? a : null;
    return () => {
      live = false;
    };
  }, [n]);

  useEffect(() => {
    if (prefsLoaded) writeViewerPrefs({ avatar, rate, mode, lang });
  }, [avatar, rate, mode, lang, prefsLoaded]);

  useEffect(() => {
    if (lang !== "bsl") return;
    let live = true;
    loadBslAyat(n).then((a) => live && setBslAyat(a));
    loadBslLexicon().then(() => live && setBslLexReady(true));
    return () => {
      live = false;
    };
  }, [lang, n]);

  const hasBismillah = !!surah?.bismillah && n !== 1 && n !== 9;
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
    return cur.gloss ? animateGloss(cur.gloss) : null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cur, lang, bslClip, bslLexReady, mocapReady]);

  // what each ayah card shows under the translation, per language
  const cardGloss = useMemo(() => {
    if (lang !== "bsl") return null;
    return items.map((it) => {
      const clip = it.ayah ? bslAyat?.[it.ayah] : undefined;
      if (clip) return { human: true, text: `Signed by an Al Isharah BSL translator · ${Math.floor(clip.start / 60)}:${String(Math.floor(clip.start % 60)).padStart(2, "0")} in the recording` };
      return { human: false, text: bslLexReady ? bslDraft(it.en) || "No learned BSL signs for this ayah yet" : "" };
    });
  }, [lang, items, bslAyat, bslLexReady]);
  const bslHumanCount = lang === "bsl" && bslAyat ? Object.keys(bslAyat).filter((k) => k !== "0").length : 0;

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
        <span className="inline-flex items-center gap-1.5 rounded-full bg-ok px-2.5 py-1 text-[11px] font-semibold text-white shadow-soft">
          <VideoIcon size={13} /> Human BSL translator, retargeted
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-2.5 py-1 text-[11px] font-semibold text-black shadow-soft">
          <InfoIcon size={13} /> BSL rough draft
        </span>
      )
    ) : cur?.source === "auto" ? (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-2.5 py-1 text-[11px] font-semibold text-black shadow-soft">
        <InfoIcon size={13} /> Automatic draft
      </span>
    ) : (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-panel/85 px-2.5 py-1 text-[11px] font-semibold text-ok shadow-soft backdrop-blur">
        <span className="h-1.5 w-1.5 rounded-full bg-ok" /> ASL gloss · draft for Deaf review
      </span>
    );

  return (
    <div className={`mx-auto grid w-full max-w-[1400px] flex-1 gap-5 px-3 py-4 sm:px-4 ${focus ? "" : "lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]"}`}>
      {/* ---------- stage ---------- */}
      <section aria-label="Signing avatar" className={`flex flex-col gap-3 ${focus ? "" : "lg:sticky lg:top-20 lg:h-[calc(100vh-6rem)]"}`}>
        <header className="animate-fade-up flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <Link href="/#surahs" className="inline-flex items-center gap-1 text-sm text-ink-2 transition hover:text-ink">
              <ArrowLeftIcon size={15} /> All surahs
            </Link>
            <h1 className="mt-1 flex flex-wrap items-baseline gap-x-3 text-2xl font-semibold tracking-tight sm:text-3xl">
              <span>
                <span className="text-ink-3">{surah.n}.</span> {surah.name}
              </span>
              <span className="arabic text-3xl font-normal leading-none" lang="ar">{surah.nameAr}</span>
            </h1>
            <p className="mt-0.5 text-sm text-ink-2">
              {surah.meaning} · {surah.ayahs} ayat · {surah.place === "makkah" ? "Meccan" : "Medinan"}
              {lang === "asl" && curatedCount > 0 && <> · <span className="text-ok">{curatedCount === surah.ayahs ? "fully hand-glossed" : `${curatedCount} hand-glossed`}</span></>}
              {lang === "bsl" && <> · <span className={bslHumanCount ? "text-ok" : "text-accent"}>{bslHumanCount ? `${bslHumanCount} ayat by a human BSL translator` : "BSL draft only"}</span></>}
            </p>
          </div>
          <div role="radiogroup" aria-label="Sign language" className="grid grid-cols-2 rounded-full border border-line bg-panel p-1 text-sm">
            {(["asl", "bsl"] as SignLang[]).map((l) => (
              <button
                key={l}
                role="radio"
                aria-checked={lang === l}
                onClick={() => setLang(l)}
                title={l === "asl" ? "American Sign Language" : "British Sign Language"}
                className={`rounded-full px-4 py-1.5 font-semibold transition ${lang === l ? "bg-brand text-brand-ink shadow-soft" : "text-ink-2 hover:text-ink"}`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </header>

        <div className={`stage relative flex-1 overflow-hidden rounded-3xl border border-line shadow-soft ${focus ? "min-h-[72vh]" : "min-h-[380px]"}`}>
          <AvatarCanvas
            className="absolute inset-0"
            timeline={anim?.timeline ?? null}
            playback={pb}
            onTime={setTime}
            onEnd={onEnd}
            mode={mode}
            avatar={avatar}
            xr
            ariaLabel={`Avatar signing ${cur?.label ?? ""} in ${lang.toUpperCase()}`}
          />
          {/* top overlays */}
          <div className="pointer-events-none absolute inset-x-3 top-3 flex items-start justify-between gap-2">
            <div className="pointer-events-auto flex flex-col items-start gap-1.5">
              {statusBadge}
              <span className="rounded-full bg-panel/85 px-2.5 py-1 font-mono text-xs font-semibold text-ink shadow-soft backdrop-blur">{cur?.label}</span>
            </div>
            <div className="pointer-events-auto flex items-center gap-1.5">
              <SignerPicker value={avatar} onChange={setAvatar} />
              <button
                onClick={() => setMode((m) => (m === "3d" ? "2d" : "3d"))}
                className="grid h-9 w-9 place-items-center rounded-full bg-panel/85 text-ink shadow-soft backdrop-blur transition hover:bg-panel"
                aria-label={`Switch to ${mode === "3d" ? "flat 2D" : "3D"} view`}
                title={mode === "3d" ? "Flat 2D view" : "3D view"}
              >
                {mode === "3d" ? <SquareIcon size={17} /> : <CubeIcon size={17} />}
              </button>
              <button
                onClick={() => setFocus((v) => !v)}
                className="grid h-9 w-9 place-items-center rounded-full bg-panel/85 text-ink shadow-soft backdrop-blur transition hover:bg-panel"
                aria-label={focus ? "Exit focus mode" : "Focus mode"}
                aria-pressed={focus}
                title={focus ? "Exit focus mode (F)" : "Focus mode (F)"}
              >
                {focus ? <ShrinkIcon size={17} /> : <ExpandIcon size={17} />}
              </button>
            </div>
          </div>
          {/* caption */}
          <div aria-live="polite" className="pointer-events-none absolute inset-x-0 bottom-4 flex flex-col items-center gap-2 px-4">
            {activeLabel && activeLabel.status !== "pause" && (
              <span key={activeLabel.index} className="animate-scale-in rounded-full bg-black/75 px-4 py-1.5 font-mono text-lg font-semibold tracking-wider text-white shadow-lift backdrop-blur">
                {activeLabel.kind === "fs" || activeLabel.status === "fallback" ? <span className="mr-1 text-white/60">fs:</span> : null}
                {activeLabel.gloss}
              </span>
            )}
            {focus && cur && <p className="max-w-3xl rounded-2xl bg-panel/85 px-4 py-2 text-center text-[15px] text-ink shadow-soft backdrop-blur">{cur.en}</p>}
          </div>
          {!playing && time === 0 && anim && (
            <button
              onClick={toggle}
              className="btn-primary animate-scale-in absolute left-1/2 top-1/2 grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full animate-pulse-ring"
              aria-label="Play this ayah"
            >
              <PlayIcon size={26} />
            </button>
          )}
        </div>

        {/* transport */}
        <div className="rounded-3xl border border-line bg-panel p-3 shadow-soft sm:p-4">
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
              <button
                role="switch"
                aria-checked={showWords}
                onClick={() => setShowWords((v) => !v)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${showWords ? "border-brand bg-brand-soft text-brand" : "border-line text-ink-2 hover:text-ink"}`}
              >
                Word by word
              </button>
            )}
            <Link href={`/studio?surah=${n}&ayah=${cur?.ayah ?? 1}`} className="ml-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-ink-2 transition hover:bg-panel-2 hover:text-ink">
              <EditIcon size={15} /> Edit in Studio
            </Link>
          </div>
          {tab === "human" ? (
            <HumanVideos videos={vids} seek={bslClip ? { id: bslClip.video, start: bslClip.start } : undefined} />
          ) : (
            <ol ref={listRef} className="flex-1 space-y-2.5 overflow-y-auto pb-4 pr-1 lg:max-h-[calc(100vh-10rem)]">
              {items.map((it, i) => {
                const active = i === idx;
                return (
                  <li key={it.key} data-idx={i}>
                    <button
                      onClick={() => go(i)}
                      aria-current={active ? "true" : undefined}
                      className={`group relative w-full overflow-hidden rounded-2xl border p-4 text-left transition ${active ? "border-brand bg-panel shadow-soft" : "border-line bg-panel/70 hover:border-line-2 hover:bg-panel"}`}
                    >
                      {active && <span className="absolute inset-y-0 left-0 w-1 bg-brand" aria-hidden />}
                      {active && (
                        <span className="absolute inset-x-0 bottom-0 h-0.5 bg-panel-2" aria-hidden>
                          <span className="block h-full bg-brand transition-[width] duration-100" style={{ width: `${progress * 100}%` }} />
                        </span>
                      )}
                      <div className="mb-1 flex items-center gap-2 text-xs text-ink-2">
                        <span className={`grid h-7 min-w-7 place-items-center rounded-full px-1.5 font-mono text-[11px] font-semibold ${active ? "bg-brand text-brand-ink" : "bg-panel-2 text-ink-2"}`}>
                          {it.ayah ?? "✦"}
                        </span>
                        {cardGloss ? (
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${cardGloss[i]?.human ? "bg-ok/15 text-ok" : "bg-accent/15 text-accent"}`}>
                            {cardGloss[i]?.human ? "BSL · human translator" : "BSL draft"}
                          </span>
                        ) : (
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${it.source === "curated" ? "bg-ok/15 text-ok" : it.source === "community" ? "bg-brand/15 text-brand" : "bg-accent/15 text-accent"}`}
                          >
                            {it.source === "curated" ? "hand-glossed" : it.source === "community" ? "your edit" : "auto draft"}
                          </span>
                        )}
                        {active && playing && (
                          <span className="ml-auto flex items-end gap-0.5" aria-label="Now signing">
                            {[0, 1, 2].map((b) => (
                              <span key={b} className="w-0.5 animate-[float_0.9s_ease-in-out_infinite] rounded-full bg-brand" style={{ height: 6 + b * 3, animationDelay: `${b * 120}ms` }} />
                            ))}
                          </span>
                        )}
                      </div>
                      <p className="arabic text-right text-[1.65rem] text-ink" lang="ar">{it.ar}</p>
                      {showWords && it.ayah && (
                        <div className="arabic mt-1 flex flex-wrap gap-x-2 gap-y-1.5 text-right" dir="rtl">
                          {surah.ayat[it.ayah - 1].w.map((w, k) => (
                            <span key={k} className="inline-flex flex-col items-center rounded-lg bg-panel-2 px-2 py-1">
                              <span className="text-lg leading-tight" lang="ar">{w.ar}</span>
                              <span dir="ltr" className="font-sans text-[11px] leading-tight text-ink-2">{w.en}</span>
                              {w.root && <span className="text-[10px] leading-tight text-accent">{w.root}</span>}
                            </span>
                          ))}
                        </div>
                      )}
                      <p className="mt-1.5 text-[15px] leading-relaxed text-ink">{it.en}</p>
                      {cardGloss ? (
                        <p className={`mt-2 text-xs leading-relaxed ${cardGloss[i]?.human ? "" : "font-mono"} ${active ? "text-ink-2" : "text-ink-3"}`}>{cardGloss[i]?.text}</p>
                      ) : (
                        <p className={`mt-2 font-mono text-xs leading-relaxed ${active ? "text-ink-2" : "text-ink-3"}`}>{it.gloss}</p>
                      )}
                    </button>
                  </li>
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

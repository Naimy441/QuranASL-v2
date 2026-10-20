"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PlaybackState } from "@/components/avatar/AvatarCanvas";
import { animateGloss } from "@/lib/asl/gloss";
import { BISMILLAH_GLOSS, loadGloss, loadSurah, type GlossFile, type Surah } from "@/lib/data/quran";
import { humanVideos } from "@/lib/data/human-videos";
import GlossStrip from "./GlossStrip";
import HumanVideos from "./HumanVideos";
import { loadOverrides } from "@/lib/studio/overrides";
import { useMocapReady } from "@/lib/hooks/useMocap";
import { buildTimeline } from "@/lib/asl/timeline";
import { mocapSign } from "@/lib/asl/mocap";
import { autoGloss } from "@/lib/asl/autogloss";
import { getBslLexicon, loadBslLexicon } from "@/lib/bsl/lexicon";
import { loadBslAyat, type BslAyahClip } from "@/lib/bsl/ayat";

const AvatarCanvas = dynamic(() => import("@/components/avatar/AvatarCanvas"), {
  ssr: false,
  loading: () => <div className="grid h-full place-items-center text-ink-2">Loading signer…</div>,
});

type AvatarId = "amina" | "yusuf" | "sam";
type Lang = "asl" | "bsl";

export default function SurahViewer({ n }: { n: number }) {
  const [surah, setSurah] = useState<Surah | null>(null);
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
  const [lang, setLang] = useState<Lang>("asl");
  const [bslAyat, setBslAyat] = useState<Record<string, BslAyahClip> | null>(null);
  const [bslLexReady, setBslLexReady] = useState(false);
  const pb = useRef<PlaybackState>({ time: 0, playing: false, rate: 0.85, loop: false });
  const listRef = useRef<HTMLOListElement>(null);
  const mocapReady = useMocapReady();

  useEffect(() => {
    let live = true;
    Promise.all([loadSurah(n), loadGloss(n)]).then(([s, g]) => {
      if (!live) return;
      setSurah(s);
      setGloss(g);
    });
    setOverrides(loadOverrides(n));
    try {
      const saved = JSON.parse(localStorage.getItem("qasl-viewer") ?? "{}");
      if (saved.avatar) setAvatar(saved.avatar);
      if (saved.rate) setRate(saved.rate);
      if (saved.mode) setMode(saved.mode);
      if (saved.lang) setLang(saved.lang);
    } catch {}
    return () => {
      live = false;
    };
  }, [n]);

  useEffect(() => {
    try {
      localStorage.setItem("qasl-viewer", JSON.stringify({ avatar, rate, mode, lang }));
    } catch {}
  }, [avatar, rate, mode, lang]);

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
    const list: { key: string; label: string; ar: string; en: string; gloss: string; source: string; ayah?: number }[] = [];
    if (hasBismillah)
      list.push({ key: "b", label: "Bismillah", ar: "بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ", en: "In the name of Allah, the Entirely Merciful, the Especially Merciful.", gloss: BISMILLAH_GLOSS, source: "curated" });
    for (const a of surah.ayat) {
      const g = overrides[a.n] ?? gloss?.ayat[a.n]?.gloss ?? "";
      list.push({ key: String(a.n), label: `${n}:${a.n}`, ar: a.ar, en: a.en, gloss: g, source: overrides[a.n] ? "community" : gloss?.ayat[a.n]?.source ?? "auto", ayah: a.n });
    }
    return list;
  }, [surah, gloss, overrides, hasBismillah, n]);

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
      const g = autoGloss(cur.en, getBslLexicon(), { unknown: "drop" }).gloss;
      return g ? animateGloss(g, getBslLexicon()) : null;
    }
    return cur.gloss ? animateGloss(cur.gloss) : null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cur, lang, bslClip, bslLexReady, mocapReady]);

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
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === " ") {
        e.preventDefault();
        toggle();
      } else if (e.key === "ArrowRight") go(idx + 1);
      else if (e.key === "ArrowLeft") go(idx - 1);
      else if (e.key === "+" || e.key === "=") setRate((r) => Math.min(1.5, +(r + 0.1).toFixed(2)));
      else if (e.key === "-") setRate((r) => Math.max(0.25, +(r - 0.1).toFixed(2)));
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

  if (!surah) return <div className="grid flex-1 place-items-center text-ink-2">Loading surah…</div>;

  return (
    <div className="mx-auto grid w-full max-w-7xl flex-1 gap-4 px-3 py-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:px-4">
      {/* ---------- stage ---------- */}
      <section aria-label="Signing avatar" className="flex flex-col gap-3 lg:sticky lg:top-3 lg:h-[calc(100vh-5.5rem)]">
        <div className="flex items-baseline justify-between gap-3">
          <div>
            <Link href="/" className="text-sm text-ink-2 hover:text-ink">← All surahs</Link>
            <h1 className="text-2xl font-semibold">
              {surah.n}. {surah.name} <span className="arabic ml-2 text-2xl">{surah.nameAr}</span>
            </h1>
            <p className="text-sm text-ink-2">{surah.meaning} · {surah.ayahs} ayat · {surah.place === "makkah" ? "Meccan" : "Medinan"}</p>
          </div>
          <div className="flex flex-col items-end gap-1 text-right text-sm text-ink-2">
            <div role="group" aria-label="Sign language" className="flex rounded-lg border border-line bg-panel p-0.5 text-xs">
              {(["asl", "bsl"] as Lang[]).map((l) => (
                <button key={l} onClick={() => setLang(l)} aria-pressed={lang === l} className={`rounded-md px-2.5 py-1 font-semibold ${lang === l ? "bg-brand text-brand-ink" : "text-ink-2"}`}>
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
            <span className="font-mono text-lg text-ink">{cur?.label}</span>
          </div>
        </div>

        <div className="stage relative min-h-[360px] flex-1 overflow-hidden rounded-2xl border border-line">
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
          {/* caption */}
          <div aria-live="polite" className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
            {activeLabel && activeLabel.status !== "pause" && (
              <span className="rounded-lg bg-black/65 px-3 py-1 font-mono text-lg tracking-wide text-white">
                {activeLabel.kind === "fs" || activeLabel.status === "fallback" ? `fs: ${activeLabel.gloss}` : activeLabel.gloss}
              </span>
            )}
          </div>
          {lang === "asl" && cur && cur.source === "auto" && (
            <div className="absolute left-3 top-3 rounded-md bg-accent/90 px-2 py-1 text-xs font-medium text-black">
              Automatic draft — not yet reviewed
            </div>
          )}
          {lang === "bsl" && cur && (
            <div className={`absolute left-3 top-3 max-w-[60%] rounded-md px-2 py-1 text-xs font-medium ${bslClip ? "bg-ok/90 text-white" : "bg-accent/90 text-black"}`}>
              {bslClip
                ? "BSL — signed by a human translator (Al Isharah BSL Qur'an Project), retargeted to the avatar"
                : "BSL draft from learned signs — rough, many words missing"}
            </div>
          )}
          <div className="absolute right-3 top-3 flex gap-1">
            <select
              aria-label="Signer"
              value={avatar}
              onChange={(e) => setAvatar(e.target.value as AvatarId)}
              className="rounded-md border border-line bg-panel/90 px-2 py-1 text-xs"
            >
              <option value="amina">Amina</option>
              <option value="yusuf">Yusuf</option>
              <option value="sam">Sam</option>
            </select>
            <button
              onClick={() => setMode((m) => (m === "3d" ? "2d" : "3d"))}
              className="rounded-md border border-line bg-panel/90 px-2 py-1 text-xs"
              aria-label={`Switch to ${mode === "3d" ? "2D" : "3D"} view`}
            >
              {mode === "3d" ? "2D" : "3D"}
            </button>
          </div>
        </div>

        {/* transport */}
        <div className="rounded-2xl border border-line bg-panel p-3">
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => go(idx - 1)} className="rounded-lg border border-line px-3 py-2" aria-label="Previous ayah" disabled={idx === 0}>⏮</button>
            <button onClick={toggle} className="min-w-24 rounded-lg bg-brand px-4 py-2 font-medium text-brand-ink" aria-label={playing ? "Pause" : "Play"}>
              {playing ? "Pause" : "Play"}
            </button>
            <button onClick={() => go(idx + 1)} className="rounded-lg border border-line px-3 py-2" aria-label="Next ayah" disabled={idx >= items.length - 1}>⏭</button>
            <label className="ml-2 flex items-center gap-2 text-sm text-ink-2">
              Speed
              <input type="range" min={0.25} max={1.5} step={0.05} value={rate} onChange={(e) => setRate(+e.target.value)} aria-valuetext={`${rate.toFixed(2)} times`} />
              <span className="w-10 font-mono text-ink">{rate.toFixed(2)}×</span>
            </label>
            <label className="ml-auto flex items-center gap-1.5 text-sm text-ink-2">
              <input type="checkbox" checked={autoNext} onChange={(e) => setAutoNext(e.target.checked)} /> Continue
            </label>
            <label className="flex items-center gap-1.5 text-sm text-ink-2">
              <input type="checkbox" checked={loop} onChange={(e) => setLoop(e.target.checked)} /> Repeat ayah
            </label>
          </div>
          <input
            type="range"
            className="mt-3 w-full"
            min={0}
            max={anim?.timeline.dur ?? 1}
            step={0.01}
            value={Math.min(time, anim?.timeline.dur ?? 1)}
            onChange={(e) => seek(+e.target.value)}
            aria-label="Scrub through ayah"
          />
          {anim && <GlossStrip tokens={anim.tokens} items={anim.timeline.items} active={activeToken} onSeek={seek} />}
        </div>
      </section>

      {/* ---------- text ---------- */}
      <section aria-label="Ayat" className="flex min-h-0 flex-col">
        <div className="mb-2 flex items-center gap-2">
          <div role="tablist" className="flex rounded-lg border border-line bg-panel p-0.5 text-sm">
            <button role="tab" aria-selected={tab === "ayat"} onClick={() => setTab("ayat")} className={`rounded-md px-3 py-1.5 ${tab === "ayat" ? "bg-brand text-brand-ink" : "text-ink-2"}`}>
              Ayat
            </button>
            <button role="tab" aria-selected={tab === "human"} onClick={() => setTab("human")} className={`rounded-md px-3 py-1.5 ${tab === "human" ? "bg-brand text-brand-ink" : "text-ink-2"}`}>
              Human signers {vids.length ? `(${vids.length})` : ""}
            </button>
          </div>
          {tab === "ayat" && (
            <label className="ml-auto flex items-center gap-1.5 text-sm text-ink-2">
              <input type="checkbox" checked={showWords} onChange={(e) => setShowWords(e.target.checked)} /> Word by word
            </label>
          )}
          <Link href={`/studio?surah=${n}&ayah=${cur?.ayah ?? 1}`} className="text-sm text-brand underline">
            Edit in Studio
          </Link>
        </div>
        {tab === "human" ? (
          <HumanVideos videos={vids} seek={bslClip ? { id: bslClip.video, start: bslClip.start } : undefined} />
        ) : (
          <ol ref={listRef} className="flex-1 space-y-2 overflow-y-auto pr-1 lg:max-h-[calc(100vh-8.5rem)]">
            {items.map((it, i) => (
              <li key={it.key} data-idx={i}>
                <button
                  onClick={() => go(i)}
                  aria-current={i === idx ? "true" : undefined}
                  className={`w-full rounded-xl border p-3 text-left transition ${i === idx ? "border-brand bg-panel shadow-sm" : "border-line bg-panel/60 hover:bg-panel"}`}
                >
                  <div className="mb-1 flex items-center gap-2 text-xs text-ink-2">
                    <span className="font-mono">{it.label}</span>
                    <span
                      className={`rounded px-1.5 py-0.5 ${it.source === "curated" ? "bg-ok/15 text-ok" : it.source === "community" ? "bg-brand/15 text-brand" : "bg-accent/15 text-accent"}`}
                    >
                      {it.source === "curated" ? "hand-glossed" : it.source === "community" ? "your edit" : "auto draft"}
                    </span>
                  </div>
                  <p className="arabic text-right text-2xl" lang="ar">{it.ar}</p>
                  {showWords && it.ayah && (
                    <div className="arabic mt-1 flex flex-wrap gap-x-3 gap-y-1 text-right" dir="rtl">
                      {surah.ayat[it.ayah - 1].w.map((w, k) => (
                        <span key={k} className="inline-flex flex-col items-center rounded bg-panel-2 px-1.5 py-0.5">
                          <span className="text-lg leading-tight" lang="ar">{w.ar}</span>
                          <span dir="ltr" className="font-sans text-[11px] leading-tight text-ink-2">{w.en}</span>
                          {w.root && <span className="text-[10px] leading-tight text-accent">{w.root}</span>}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="mt-1 text-[15px] text-ink">{it.en}</p>
                  <p className="mt-1.5 font-mono text-xs text-ink-2">{it.gloss}</p>
                </button>
              </li>
            ))}
          </ol>
        )}
        <p className="mt-2 text-xs text-ink-2">
          Keys: <kbd>Space</kbd> play/pause · <kbd>←</kbd>/<kbd>→</kbd> ayah · <kbd>+</kbd>/<kbd>−</kbd> speed. English: Saheeh International.
        </p>
      </section>
    </div>
  );
}

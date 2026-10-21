"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import HeroSigner from "./HeroSigner";
import { SIGNERS } from "@/components/viewer/SignerPicker";
import { ArrowRightIcon, BookIcon, CheckIcon, LayersIcon } from "@/components/common/Icons";
import { readLastRead, readViewerPrefs, writeViewerPrefs, type AvatarId, type LastRead, type SignLang } from "@/lib/prefs";
import { TextEffect } from "@/components/ui/text-effect";
import { Button } from "@/components/ui/button";

export default function Hero() {
  const [avatar, setAvatar] = useState<AvatarId>("amina");
  const [lang, setLang] = useState<SignLang>("asl");
  const [last, setLast] = useState<LastRead | null>(null);

  useEffect(() => {
    const p = readViewerPrefs();
    setAvatar(p.avatar);
    setLang(p.lang);
    setLast(readLastRead());
  }, []);

  const pickAvatar = (a: AvatarId) => {
    setAvatar(a);
    writeViewerPrefs({ avatar: a });
  };

  const pickLang = (l: SignLang) => {
    setLang(l);
    writeViewerPrefs({ lang: l });
  };

  return (
    <section className="relative overflow-hidden border-b border-line/60 bg-bg pb-20 pt-16 md:pb-28 md:pt-24">
      {/* Background radial spotlight & precision grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_50%_at_50%_-10%,rgba(13,148,136,0.18),transparent_70%)]"
      />
      <div
        aria-hidden
        className="pattern-bg pointer-events-none absolute inset-0 -z-10 opacity-30"
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Centered Hero Header */}
        <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
          {/* Framed Pill Announcement */}
          <div className="inline-flex items-center gap-2 rounded-full border border-line bg-panel/90 px-3.5 py-1 text-xs text-ink-2 shadow-xs backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-brand" />
            </span>
            <span className="font-mono text-[11px] font-medium text-ink">QuranASL 2.4</span>
            <span className="text-line-2">|</span>
            <span className="text-ink-3">A Computational Sign Language Corpus</span>
          </div>

          {/* Primary High-Impact Headline with TextEffect */}
          <div className="mt-8">
            <TextEffect
              per="word"
              preset="fade-in-blur"
              delay={0.05}
              className="font-sans text-4xl font-bold tracking-tight text-ink sm:text-6xl lg:text-7xl"
            >
              The Holy Qur&apos;an, Articulated in Sign Language.
            </TextEffect>
          </div>

          {/* Minimal, crisp sub-headline */}
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-ink-2 sm:text-lg">
            Transcribing 6,236 ayat into native American (ASL) and British (BSL) Sign Language through
            real-time 3D biomechanical kinematics, spatial grammar, and Deaf community review.
          </p>

          {/* Minimalist CTA Row */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {last ? (
              <Link href={`/surah/${last.surah}?ayah=${last.ayah}`}>
                <Button variant="default" size="lg" className="rounded-full shadow-md group">
                  Continue Reading {last.name} ({last.surah}:{last.ayah})
                  <ArrowRightIcon size={15} className="transition-transform group-hover:translate-x-0.5" />
                </Button>
              </Link>
            ) : (
              <Link href="/surah/1">
                <Button variant="default" size="lg" className="rounded-full shadow-md group">
                  Start with Surah Al-Fātiḥah
                  <ArrowRightIcon size={15} className="transition-transform group-hover:translate-x-0.5" />
                </Button>
              </Link>
            )}

            <a href="#surahs">
              <Button variant="outline" size="lg" className="rounded-full">
                <BookIcon size={15} />
                Browse 114 Surahs
              </Button>
            </a>

            <a href="#methodology">
              <Button variant="ghost" size="lg" className="rounded-full text-ink-2">
                <LayersIcon size={15} />
                Methodology
              </Button>
            </a>
          </div>

          {/* Minimal Metric Ticker */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-ink-3 font-mono">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-ink">114</span> Surahs
            </div>
            <span className="text-line-2">·</span>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-ink">6,236</span> Ayat Glossed
            </div>
            <span className="text-line-2">·</span>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-ink">2,800+</span> Lexical Signs
            </div>
            <span className="text-line-2">·</span>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-ink">ASL &amp; BSL</span> Parallel
            </div>
          </div>
        </div>

        {/* Framed Application Window / Kinematic Showcase */}
        <div className="mx-auto mt-14 max-w-5xl">
          <div className="relative rounded-2xl border border-line bg-panel shadow-2xl overflow-hidden">
            {/* Window Header Frame with macOS dots & Status Bar */}
            <div className="flex items-center justify-between border-b border-line bg-panel-2/70 px-4 py-3 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-red-500/80" />
                <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
                <span className="h-3 w-3 rounded-full bg-green-500/80" />
                <span className="ml-2 hidden font-mono text-[11px] text-ink-3 sm:inline">
                  quranasl.org/kinematic-stage
                </span>
              </div>

              {/* Language Switcher Pill */}
              <div role="radiogroup" aria-label="Sign language" className="flex items-center rounded-lg border border-line bg-panel p-0.5 text-xs">
                {(["asl", "bsl"] as SignLang[]).map((l) => (
                  <button
                    key={l}
                    role="radio"
                    aria-checked={lang === l}
                    onClick={() => pickLang(l)}
                    className={`rounded-md px-3 py-1 font-mono text-[11px] font-semibold transition cursor-pointer ${
                      lang === l
                        ? "bg-brand text-brand-ink shadow-xs"
                        : "text-ink-3 hover:text-ink"
                    }`}
                  >
                    {l.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* Realtime 60Hz Badge */}
              <div className="hidden items-center gap-1.5 font-mono text-[11px] text-ink-3 sm:flex">
                <span className="h-2 w-2 rounded-full bg-ok" />
                <span>60 FPS SLERP</span>
              </div>
            </div>

            {/* Viewport Interior */}
            <div className="grid lg:grid-cols-[1fr_320px]">
              {/* 3D Kinetic Avatar Canvas */}
              <div className="stage relative aspect-[4/3.2] w-full overflow-hidden sm:aspect-[4/3] lg:aspect-auto lg:h-[480px]">
                <HeroSigner avatar={avatar} lang={lang} />
              </div>

              {/* Interactive Control Sidebar */}
              <div className="flex flex-col justify-between border-t border-line bg-panel p-5 lg:border-l lg:border-t-0">
                <div>
                  <div className="flex items-center justify-between border-b border-line/60 pb-3">
                    <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-ink-3">
                      Avatar Kinematics
                    </span>
                    <span className="rounded bg-brand-soft px-1.5 py-0.5 font-mono text-[10px] font-semibold text-brand">
                      27-DOF Rig
                    </span>
                  </div>

                  {/* Avatar Picker List */}
                  <div className="mt-4 space-y-2">
                    <label className="block text-xs font-medium text-ink">Select Avatar Rig</label>
                    <div className="space-y-1.5">
                      {SIGNERS.map((s) => {
                        const active = avatar === s.id;
                        return (
                          <button
                            key={s.id}
                            onClick={() => pickAvatar(s.id)}
                            className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-xs transition cursor-pointer ${
                              active
                                ? "border-brand bg-brand-soft/60 font-semibold text-brand shadow-xs"
                                : "border-line bg-panel-2/50 text-ink-2 hover:border-line-2 hover:bg-panel-2"
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <span
                                className="h-4 w-4 rounded-full border border-line shrink-0"
                                style={{
                                  background: `linear-gradient(135deg, ${s.swatch[0]} 50%, ${s.swatch[1]} 50%)`,
                                }}
                              />
                              <span>{s.name}</span>
                            </div>
                            {active && <CheckIcon size={14} className="text-brand" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Rig Details */}
                  <div className="mt-5 rounded-lg border border-line bg-panel-2/60 p-3 text-[11px] text-ink-3 space-y-1.5 font-mono">
                    <div className="flex justify-between">
                      <span>Solver</span>
                      <span className="text-ink">Analytical 2-Bone IK</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Morphology</span>
                      <span className="text-ink">Topic-Comment Syntax</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Grammar</span>
                      <span className="text-ink">Spatial Indexing &amp; NMM</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 border-t border-line/60 pt-4">
                  <Link href="/surah/1" className="block">
                    <Button variant="default" size="sm" className="w-full">
                      Launch Full Ayah Viewer
                      <ArrowRightIcon size={13} />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Clean, Full-Width Transcribed Ayah Bar at Bottom of Window */}
            <div className="flex flex-col justify-between gap-3 border-t border-line bg-panel px-5 py-4 sm:flex-row sm:items-center">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-brand font-semibold block">
                  {lang === "bsl" ? "Surah 112:1 (Al-Ikhlāṣ)" : "Surah 1:1 (Al-Fātiḥah)"}
                </span>
                <p className="mt-0.5 text-xs text-ink-2 max-w-lg">
                  {lang === "bsl"
                    ? "Say, “He is Allah, [who is] One” — Native BSL translation retargeted onto 3D rig"
                    : "In the name of Allah, the Entirely Merciful, the Especially Merciful"}
                </p>
              </div>
              <p className="arabic text-right text-2xl font-normal text-ink shrink-0 leading-normal" lang="ar">
                {lang === "bsl" ? "قُلْ هُوَ ٱللَّهُ أَحَدٌ" : "بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

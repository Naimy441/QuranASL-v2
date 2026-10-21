"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import HeroSigner from "./HeroSigner";
import { SIGNERS } from "@/components/viewer/SignerPicker";
import { ArrowRightIcon, BookIcon, CheckIcon, LayersIcon } from "@/components/common/Icons";
import { readLastRead, readViewerPrefs, writeViewerPrefs, type AvatarId, type LastRead, type SignLang } from "@/lib/prefs";
import { TextEffect } from "@/components/ui/text-effect";
import { Frame } from "@/components/ui/frame";
import { Badge } from "@/components/ui/badge";
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
    <section className="relative border-b border-line/60 bg-bg pb-12 pt-8 md:pb-16 md:pt-14">
      {/* Framed grid background */}
      <div aria-hidden className="pattern-bg pointer-events-none absolute inset-0 opacity-40" />

      <div className="relative mx-auto grid max-w-7xl items-start gap-10 px-4 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:gap-12">
        {/* Left Column: Academic Editorial Information & Metadata */}
        <div>
          {/* Corpus classification header */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" size="sm" className="bg-panel/80">
              Linguistic Corpus &amp; Kinematic Model
            </Badge>
            <Badge variant="brand" size="sm">
              Open Research Edition · v2.4
            </Badge>
          </div>

          {/* Research Title using TextEffect */}
          <div className="mt-5">
            <TextEffect
              per="word"
              preset="fade-in-blur"
              delay={0.1}
              className="font-serif font-editorial text-3xl font-medium tracking-tight text-ink sm:text-5xl lg:leading-[1.12]"
            >
              A Computational Sign Language Corpus of the Qur&apos;an
            </TextEffect>
          </div>

          {/* Formal Abstract */}
          <p className="mt-5 max-w-2xl text-[15.5px] leading-relaxed text-ink-2">
            A linguistically annotated digital corpus and 3D kinetic avatar framework transcribing the Qur&apos;anic text
            into American Sign Language (ASL) and British Sign Language (BSL). Features morphosyntactic gloss tiering,
            3D spatial referential loci, non-manual grammatical facial markers, and comparative video documentation
            grounded in recordings by native Deaf Muslim translators.
          </p>

          {/* Research Metrics / Accession Badges */}
          <div className="mt-6 flex flex-wrap gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-line bg-panel px-2.5 py-1 text-ink-2 shadow-xs">
              <span className="font-mono font-semibold text-ink">114</span>
              <span>Surahs</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-md border border-line bg-panel px-2.5 py-1 text-ink-2 shadow-xs">
              <span className="font-mono font-semibold text-ink">6,236</span>
              <span>Ayat Glossed</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-md border border-line bg-panel px-2.5 py-1 text-ink-2 shadow-xs">
              <span className="font-mono font-semibold text-ink">2,800+</span>
              <span>Lexical Signs</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-md border border-line bg-panel px-2.5 py-1 text-ink-2 shadow-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-ok" />
              <span>Peer-Review Draft</span>
            </span>
          </div>

          {/* Accession CTAs */}
          <div className="mt-7 flex flex-wrap items-center gap-3">
            {last ? (
              <>
                <Link href={`/surah/${last.surah}?ayah=${last.ayah}`}>
                  <Button variant="default" size="lg" className="group">
                    Continue Reading {last.name} {last.surah}:{last.ayah}
                    <ArrowRightIcon size={15} className="transition-transform group-hover:translate-x-0.5" />
                  </Button>
                </Link>
                <Link href="/surah/1">
                  <Button variant="outline" size="lg">
                    Access Surah Al-Fātiḥah (1:1)
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/surah/1">
                  <Button variant="default" size="lg" className="group">
                    Access Surah Al-Fātiḥah (1:1)
                    <ArrowRightIcon size={15} className="transition-transform group-hover:translate-x-0.5" />
                  </Button>
                </Link>
                <a href="#surahs">
                  <Button variant="outline" size="lg">
                    <BookIcon size={15} /> Browse 114 Surahs Catalogue
                  </Button>
                </a>
              </>
            )}
            <a href="#methodology">
              <Button variant="ghost" size="lg" className="text-brand hover:text-brand-2">
                <LayersIcon size={15} /> Methodology
              </Button>
            </a>
          </div>

          {/* Corpus Configuration Workbench Frame */}
          <Frame
            withCorners
            withHeader
            headerTitle={
              <span className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                <span className="text-[11px] font-mono uppercase tracking-wider text-ink-3">
                  Kinematic &amp; Linguistic Parameters
                </span>
              </span>
            }
            headerAction={<span className="font-mono text-[11px] text-ink-3">Realtime 3D</span>}
            className="mt-8 p-4 bg-panel shadow-xs"
          >
            <div className="grid gap-4 sm:grid-cols-2 sm:items-start pt-1">
              {/* Language Specification */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink">
                  Target Sign Language
                </label>
                <div role="radiogroup" aria-label="Sign language" className="grid grid-cols-2 gap-1 rounded-lg bg-panel-2 p-1 border border-line/60">
                  {(["asl", "bsl"] as SignLang[]).map((l) => (
                    <button
                      key={l}
                      role="radio"
                      aria-checked={lang === l}
                      onClick={() => pickLang(l)}
                      className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition cursor-pointer ${
                        lang === l
                          ? "bg-panel font-semibold text-brand shadow-xs border border-line"
                          : "text-ink-2 hover:text-ink"
                      }`}
                    >
                      {l === "asl" ? "ASL (Topic-Comment)" : "BSL (Al Isharah)"}
                    </button>
                  ))}
                </div>
                <p className="mt-1.5 text-[11px] text-ink-3">
                  {lang === "asl"
                    ? "Topic-comment syntax with spatial indexing & NMM"
                    : "Native BSL human video clips retargeted onto kinematic rig"}
                </p>
              </div>

              {/* Avatar Model Specification */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink">
                  Biomechanical Avatar Rig
                </label>
                <div role="radiogroup" aria-label="Signer avatar" className="flex flex-wrap gap-1.5">
                  {SIGNERS.map((s) => (
                    <button
                      key={s.id}
                      role="radio"
                      aria-checked={avatar === s.id}
                      onClick={() => pickAvatar(s.id)}
                      className={`flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs transition cursor-pointer ${
                        avatar === s.id
                          ? "border-brand bg-brand-soft/70 font-semibold text-brand shadow-xs"
                          : "border-line bg-panel text-ink-2 hover:border-line-2 hover:text-ink"
                      }`}
                    >
                      <span
                        className="relative h-3.5 w-3.5 shrink-0 rounded-full border border-line"
                        style={{
                          background: `linear-gradient(135deg, ${s.swatch[0]} 50%, ${s.swatch[1]} 50%)`,
                        }}
                      />
                      <span>{s.name}</span>
                      {avatar === s.id && <CheckIcon size={12} className="text-brand" />}
                    </button>
                  ))}
                </div>
                <p className="mt-1.5 text-[11px] text-ink-3">
                  27-DOF skeletal rig with analytical two-bone IK solver
                </p>
              </div>
            </div>
          </Frame>
        </div>

        {/* Right Column: Kinematic Observation Bench (Framed) */}
        <div className="relative">
          <Frame
            withCorners
            withHeader
            headerTitle={
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ok opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-ok" />
                </span>
                <span className="font-mono text-[11px] font-semibold tracking-wider text-ink">
                  KINEMATIC VIEWPORT · {lang.toUpperCase()}
                </span>
              </div>
            }
            headerAction={
              <span className="font-mono text-[10px] text-ink-3">
                Quaternion SLERP · 60 Hz
              </span>
            }
            className="overflow-hidden shadow-xs"
          >
            {/* 3D Stage */}
            <div className="stage relative aspect-[4/4.8] w-full overflow-hidden">
              <HeroSigner avatar={avatar} lang={lang} />
            </div>

            {/* Ayah Alignment Transcript Footer */}
            <div className="border-t border-line/60 bg-panel p-4">
              <div className="flex items-center justify-between text-xs text-ink-3 mb-1">
                <span className="font-mono uppercase text-[10px] tracking-wider">
                  Textual Reference: {lang === "bsl" ? "Surah 112:1" : "Surah 1:1 (Bismillah)"}
                </span>
                <span className="font-mono text-[10px]">Uthmanic Arabic</span>
              </div>
              <p className="arabic text-right text-2xl text-ink leading-relaxed" lang="ar">
                {lang === "bsl" ? "قُلْ هُوَ ٱللَّهُ أَحَدٌ" : "بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ"}
              </p>
            </div>
          </Frame>

          {/* Linguistic Callout Card */}
          <div className="mt-3 flex items-start gap-2.5 rounded-lg border border-line bg-panel/70 p-3 text-xs text-ink-2 shadow-xs">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-brand shrink-0 mt-0.5">
              [Note]
            </span>
            <span className="text-ink-3 leading-relaxed">
              Kinematic movements are derived from algorithmic topic-comment gloss synthesis and verified against
              human corpus recordings. Reviewers can suggest adjustments via the Gloss Studio.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

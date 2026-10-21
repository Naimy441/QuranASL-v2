"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import HeroSigner from "./HeroSigner";
import { SIGNERS } from "@/components/viewer/SignerPicker";
import { ArrowRightIcon, BookIcon, CheckIcon, LayersIcon } from "@/components/common/Icons";
import { readLastRead, readViewerPrefs, writeViewerPrefs, type AvatarId, type LastRead, type SignLang } from "@/lib/prefs";

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
    <section className="relative border-b border-line/70 bg-bg pb-12 pt-8 md:pb-16 md:pt-12">
      <div aria-hidden className="pattern-bg pointer-events-none absolute inset-0 opacity-40" />

      <div className="relative mx-auto grid max-w-7xl items-start gap-10 px-4 lg:grid-cols-[1.12fr_1fr] lg:gap-12">
        {/* Left Column: Academic Editorial Information & Metadata */}
        <div>
          {/* Corpus classification header */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="academic-tag border-line bg-panel font-mono text-[11px] text-ink-2">
              Linguistic Corpus &amp; Kinematic Model
            </span>
            <span className="academic-tag border-brand/30 bg-brand-soft/60 font-mono text-[11px] text-brand">
              Open Research Edition · v2.4
            </span>
          </div>

          {/* Research Title */}
          <h1 className="font-serif font-editorial mt-5 text-3xl font-medium tracking-tight text-ink sm:text-5xl lg:leading-[1.15]">
            A Computational Sign Language Corpus of the Qur&apos;an
          </h1>

          {/* Formal Abstract */}
          <p className="mt-5 max-w-2xl text-[16.5px] leading-relaxed text-ink-2">
            A linguistically annotated digital corpus and 3D kinetic avatar framework transcribing the Qur&apos;anic text
            into American Sign Language (ASL) and British Sign Language (BSL). Features morphosyntactic gloss tiering,
            3D spatial referential loci, non-manual grammatical facial markers, and comparative video documentation
            grounded in recordings by native Deaf Muslim translators.
          </p>

          {/* Research Metrics / Accession Badges */}
          <div className="mt-6 flex flex-wrap gap-2 text-xs text-ink-3">
            <span className="rounded border border-line bg-panel px-2.5 py-1">
              <strong className="font-semibold text-ink">114</strong> Surahs
            </span>
            <span className="rounded border border-line bg-panel px-2.5 py-1">
              <strong className="font-semibold text-ink">6,236</strong> Ayat Glossed
            </span>
            <span className="rounded border border-line bg-panel px-2.5 py-1">
              <strong className="font-semibold text-ink">2,800+</strong> Lexical Signs
            </span>
            <span className="rounded border border-line bg-panel px-2.5 py-1">
              <strong className="font-semibold text-ink">Peer-Review</strong> Draft Protocol
            </span>
          </div>

          {/* Accession CTAs */}
          <div className="mt-7 flex flex-wrap items-center gap-3">
            {last ? (
              <>
                <Link
                  href={`/surah/${last.surah}?ayah=${last.ayah}`}
                  className="btn-primary group inline-flex items-center gap-2 rounded-md px-5 py-3 text-sm font-semibold shadow-xs"
                >
                  Continue Reading {last.name} {last.surah}:{last.ayah}
                  <ArrowRightIcon size={16} className="transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="/surah/1"
                  className="inline-flex items-center gap-2 rounded-md border border-line-2 bg-panel px-4 py-3 text-sm font-medium text-ink transition hover:border-brand hover:bg-panel-2"
                >
                  Access Surah Al-Fātiḥah (1:1)
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/surah/1"
                  className="btn-primary group inline-flex items-center gap-2 rounded-md px-5 py-3 text-sm font-semibold shadow-xs"
                >
                  Access Surah Al-Fātiḥah (1:1)
                  <ArrowRightIcon size={16} className="transition-transform group-hover:translate-x-0.5" />
                </Link>
                <a
                  href="#surahs"
                  className="inline-flex items-center gap-2 rounded-md border border-line-2 bg-panel px-4 py-3 text-sm font-medium text-ink transition hover:border-brand hover:bg-panel-2"
                >
                  <BookIcon size={16} /> Browse 114 Surahs Catalogue
                </a>
              </>
            )}
            <a
              href="#methodology"
              className="inline-flex items-center gap-1.5 px-3 py-3 text-sm font-medium text-brand hover:text-brand-2 hover:underline"
            >
              <LayersIcon size={16} /> Methodology &amp; Architecture
            </a>
          </div>

          {/* Corpus Configuration Workbench Panel */}
          <div className="mt-8 rounded-xl border border-line bg-panel p-4 shadow-xs">
            <div className="mb-3 flex items-center justify-between border-b border-line/60 pb-2.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-ink-3">
                Linguistic &amp; Rig Specification
              </span>
              <span className="text-[11px] font-mono text-ink-3">Realtime Synthesis</span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 sm:items-start">
              {/* Language Specification */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-ink">
                  Target Sign Language
                </label>
                <div role="radiogroup" aria-label="Sign language" className="grid grid-cols-2 gap-1 rounded-lg bg-panel-2 p-1 border border-line/80">
                  {(["asl", "bsl"] as SignLang[]).map((l) => (
                    <button
                      key={l}
                      role="radio"
                      aria-checked={lang === l}
                      onClick={() => pickLang(l)}
                      className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition ${
                        lang === l
                          ? "bg-panel font-semibold text-brand shadow-xs border border-line/70"
                          : "text-ink-2 hover:text-ink"
                      }`}
                    >
                      {l === "asl" ? "ASL (Topic-Comment)" : "BSL (Al Isharah Ref)"}
                    </button>
                  ))}
                </div>
                <p className="mt-1 text-[11px] text-ink-3">
                  {lang === "asl"
                    ? "Topic-comment syntax with spatial indexing & NMM"
                    : "Native BSL human video clips retargeted onto kinematic rig"}
                </p>
              </div>

              {/* Avatar Model Specification */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-ink">
                  Biomechanical Avatar Rig
                </label>
                <div role="radiogroup" aria-label="Signer avatar" className="flex flex-wrap gap-1.5">
                  {SIGNERS.map((s) => (
                    <button
                      key={s.id}
                      role="radio"
                      aria-checked={avatar === s.id}
                      onClick={() => pickAvatar(s.id)}
                      className={`flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs transition ${
                        avatar === s.id
                          ? "border-brand bg-brand-soft/70 font-semibold text-brand"
                          : "border-line bg-panel text-ink-2 hover:border-line-2 hover:text-ink"
                      }`}
                    >
                      <span
                        className="relative h-4 w-4 shrink-0 rounded-full border border-line"
                        style={{
                          background: `linear-gradient(135deg, ${s.swatch[0]} 50%, ${s.swatch[1]} 50%)`,
                        }}
                      />
                      <span>{s.name}</span>
                      {avatar === s.id && <CheckIcon size={12} className="text-brand" />}
                    </button>
                  ))}
                </div>
                <p className="mt-1 text-[11px] text-ink-3">
                  27-DOF skeletal rig with analytical two-bone IK solver
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Kinematic Observation Bench */}
        <div className="relative">
          <div className="overflow-hidden rounded-xl border border-line bg-panel shadow-sm">
            {/* Viewport Control Strip */}
            <div className="flex items-center justify-between border-b border-line bg-panel-2 px-3.5 py-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-ok" />
                <span className="font-mono text-[11px] font-semibold tracking-wide text-ink">
                  KINEMATIC VIEWPORT · {lang.toUpperCase()}
                </span>
              </div>
              <span className="font-mono text-[11px] text-ink-3">
                Quaternion SLERP · 60 Hz
              </span>
            </div>

            {/* 3D Stage */}
            <div className="stage relative aspect-[4/4.8] w-full overflow-hidden">
              <HeroSigner avatar={avatar} lang={lang} />
            </div>

            {/* Ayah Alignment Transcript Footer */}
            <div className="border-t border-line bg-panel p-3.5">
              <div className="flex items-center justify-between text-xs text-ink-3 mb-1">
                <span className="font-mono uppercase text-[10px] tracking-wider">
                  Textual Reference: {lang === "bsl" ? "Surah 112:1" : "Surah 1:1 (Bismillah)"}
                </span>
                <span className="font-mono text-[10px]">Classical Arabic / Naskh</span>
              </div>
              <p className="arabic text-right text-2xl text-ink leading-relaxed" lang="ar">
                {lang === "bsl" ? "قُلْ هُوَ ٱللَّهُ أَحَدٌ" : "بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ"}
              </p>
            </div>
          </div>

          {/* Peer Review Callout */}
          <div className="mt-3 flex items-start gap-2 rounded-md border border-accent/30 bg-accent-soft/40 p-2.5 text-xs text-ink-2">
            <span className="font-semibold text-accent shrink-0">Linguistic Note:</span>
            <span>
              Kinematic movements are derived from algorithmic topic-comment gloss synthesis and verified against
              human corpus recordings. Reviewers can suggest adjustments via the Gloss Studio.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

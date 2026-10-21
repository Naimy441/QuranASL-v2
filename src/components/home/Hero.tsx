"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import HeroSigner from "./HeroSigner";
import { SIGNERS } from "@/components/viewer/SignerPicker";
import { ArrowRightIcon, BookIcon, CheckIcon } from "@/components/common/Icons";
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
    <section className="relative overflow-hidden">
      <div aria-hidden className="pattern-bg pointer-events-none absolute inset-0" />
      <div aria-hidden className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full opacity-70 blur-3xl" style={{ background: "radial-gradient(closest-side, var(--glow), transparent)" }} />
      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 pb-10 pt-10 md:pt-16 lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:pb-16">
        <div>
          <p className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-line bg-panel/70 px-3 py-1 text-xs font-medium text-ink-2">
            <span className="h-1.5 w-1.5 rounded-full bg-ok animate-pulse-ring" />
            American &amp; British Sign Language · ayah by ayah
          </p>
          <h1 className="animate-fade-up delay-1 mt-5 text-[2.6rem] font-semibold leading-[1.05] tracking-tight sm:text-6xl">
            The Qur&apos;an,
            <br />
            <span className="bg-gradient-to-r from-brand to-accent bg-clip-text text-transparent">signed.</span>
          </h1>
          <p className="animate-fade-up delay-2 mt-5 max-w-xl text-lg leading-relaxed text-ink-2">
            Watch a 3D signer render every ayah with sign-language grammar, facial expression and fingerspelled names — beside
            the Arabic, an English translation and recordings by human signers.
          </p>

          <div className="animate-fade-up delay-3 mt-7 flex flex-wrap items-center gap-3">
            {last ? (
              <>
                <Link href={`/surah/${last.surah}?ayah=${last.ayah}`} className="btn-primary group inline-flex items-center gap-2 rounded-full px-6 py-3.5 font-semibold">
                  Continue {last.name} {last.surah}:{last.ayah}
                  <ArrowRightIcon size={18} className="transition-transform group-hover:translate-x-1" />
                </Link>
                <Link href="/surah/1" className="inline-flex items-center gap-2 rounded-full border border-line-2 bg-panel px-5 py-3.5 font-medium text-ink transition hover:border-brand">
                  Start from Al-Fātiḥah
                </Link>
              </>
            ) : (
              <>
                <Link href="/surah/1" className="btn-primary group inline-flex items-center gap-2 rounded-full px-6 py-3.5 font-semibold">
                  Start with Al-Fātiḥah
                  <ArrowRightIcon size={18} className="transition-transform group-hover:translate-x-1" />
                </Link>
                <a href="#surahs" className="inline-flex items-center gap-2 rounded-full border border-line-2 bg-panel px-5 py-3.5 font-medium text-ink transition hover:border-brand">
                  <BookIcon size={18} /> Browse all 114 surahs
                </a>
              </>
            )}
          </div>

          {/* quick setup — applies to the viewer too */}
          <div className="animate-fade-up delay-4 mt-9 grid max-w-xl gap-5 rounded-2xl border border-line bg-panel/80 p-4 shadow-soft sm:grid-cols-[auto_1fr] sm:items-center sm:gap-x-6">
            <span className="text-sm font-semibold text-ink">Sign language</span>
            <div role="radiogroup" aria-label="Sign language" className="grid grid-cols-2 gap-1 rounded-xl bg-panel-2 p-1">
              {(["asl", "bsl"] as SignLang[]).map((l) => (
                <button
                  key={l}
                  role="radio"
                  aria-checked={lang === l}
                  onClick={() => pickLang(l)}
                  className={`rounded-lg px-3 py-2 text-sm transition ${lang === l ? "bg-panel font-semibold text-ink shadow-soft" : "text-ink-2 hover:text-ink"}`}
                >
                  {l === "asl" ? "ASL · American" : "BSL · British"}
                </button>
              ))}
            </div>
            <span className="text-sm font-semibold text-ink">Signer</span>
            <div role="radiogroup" aria-label="Signer" className="flex flex-wrap gap-2">
              {SIGNERS.map((s) => (
                <button
                  key={s.id}
                  role="radio"
                  aria-checked={avatar === s.id}
                  onClick={() => pickAvatar(s.id)}
                  className={`group flex items-center gap-2 rounded-full border py-1 pl-1 pr-3 text-sm transition ${avatar === s.id ? "border-brand bg-brand-soft text-ink" : "border-line text-ink-2 hover:border-line-2 hover:text-ink"}`}
                >
                  <span className="relative h-7 w-7 overflow-hidden rounded-full border border-line" style={{ background: `linear-gradient(135deg, ${s.swatch[0]} 50%, ${s.swatch[1]} 50%)` }}>
                    {avatar === s.id && (
                      <span className="absolute inset-0 grid place-items-center bg-black/30 text-white">
                        <CheckIcon size={14} />
                      </span>
                    )}
                  </span>
                  {s.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="animate-scale-in delay-2 relative">
          <div className="stage relative mx-auto aspect-[4/5] w-full max-w-[520px] overflow-hidden rounded-[2rem] border border-line shadow-lift">
            <HeroSigner avatar={avatar} lang={lang} />
            <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-panel/85 px-3 py-1.5 text-xs font-medium text-ink shadow-soft backdrop-blur">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-bad opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-bad" />
              </span>
              Live 3D · {lang.toUpperCase()}
            </div>
          </div>
          <p className="arabic mt-4 text-center text-3xl text-ink" lang="ar">
            {lang === "bsl" ? "قُلْ هُوَ ٱللَّهُ أَحَدٌ" : "بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ"}
          </p>
        </div>
      </div>
    </section>
  );
}

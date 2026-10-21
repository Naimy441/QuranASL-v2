"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoMark } from "./common/Icons";

export default function SiteFooter() {
  const path = usePathname();
  // The viewer, practice and studio are full-height tools; keep them uncluttered.
  if (path.startsWith("/surah") || path.startsWith("/studio") || path.startsWith("/practice") || path.startsWith("/lab"))
    return null;

  return (
    <footer className="mt-20 border-t border-line bg-panel-2/50">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 text-xs text-ink-2 md:grid-cols-[1.5fr_1fr_1fr_1.2fr]">
        {/* Colophon & Institution Info */}
        <div>
          <div className="flex items-center gap-2.5 font-semibold text-ink">
            <LogoMark size={26} />
            <span className="font-serif text-base tracking-tight">QuranASL Linguistic Initiative</span>
          </div>
          <p className="mt-3 max-w-sm leading-relaxed text-ink-3">
            A digital humanities corpus and computational kinematic framework modeling the meanings of the Holy
            Qur&apos;an in American and British Sign Language. Developed as an open-access research resource for Deaf
            Muslims, sign linguists, and community translators.
          </p>
          <div className="mt-4 flex flex-wrap gap-2 font-mono text-[10px] text-ink-3">
            <span className="rounded border border-line bg-panel px-2 py-0.5">Corpus Edition 2.4</span>
            <span className="rounded border border-line bg-panel px-2 py-0.5">CC BY-NC-SA 4.0</span>
          </div>
        </div>

        {/* Corpus Concordance */}
        <div>
          <p className="mb-2.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-ink">Corpus Index</p>
          <ul className="space-y-2">
            <li>
              <Link className="hover:text-brand hover:underline" href="/#surahs">
                All 114 Surahs
              </Link>
            </li>
            <li>
              <Link className="hover:text-brand hover:underline" href="/surah/1">
                Surah Al-Fātiḥah (1:1)
              </Link>
            </li>
            <li>
              <Link className="hover:text-brand hover:underline" href="/dictionary">
                Sign Lexicon &amp; Concordance
              </Link>
            </li>
            <li>
              <Link className="hover:text-brand hover:underline" href="/#methodology">
                Linguistic Methodology
              </Link>
            </li>
          </ul>
        </div>

        {/* Linguistic Workbench */}
        <div>
          <p className="mb-2.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-ink">Linguistic Tools</p>
          <ul className="space-y-2">
            <li>
              <Link className="hover:text-brand hover:underline" href="/practice">
                Kinematic Practice Lab
              </Link>
            </li>
            <li>
              <Link className="hover:text-brand hover:underline" href="/studio">
                Gloss Annotation Studio
              </Link>
            </li>
            <li>
              <Link className="hover:text-brand hover:underline" href="/about">
                Corpus Documentation
              </Link>
            </li>
            <li>
              <Link className="hover:text-brand hover:underline" href="/about">
                Citation &amp; BibTeX Format
              </Link>
            </li>
          </ul>
        </div>

        {/* Academic Credits & Attribution */}
        <div>
          <p className="mb-2.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-ink">
            Research Provenance
          </p>
          <ul className="space-y-2 text-ink-3">
            <li>Quranic Arabic Corpus (Kais Dukes, Univ. of Leeds)</li>
            <li>Text &amp; Translation: Quran.com API (Saheeh Int.)</li>
            <li>Human ASL Reference: Global Deaf Muslim</li>
            <li>Human BSL Reference: Al Isharah BSL Qur&apos;an Project</li>
            <li>Edge Vision: Google MediaPipe (Apache 2.0)</li>
          </ul>
        </div>
      </div>

      {/* Bottom Sub-footer */}
      <div className="border-t border-line/60 bg-panel px-4 py-4 text-center text-[11px] text-ink-3">
        <p className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; {new Date().getFullYear()} QuranASL Research Initiative. Open Access under CC BY-NC-SA 4.0.</span>
          <span>Community Peer Review Draft · Built for Linguistic Verification</span>
        </p>
      </div>
    </footer>
  );
}

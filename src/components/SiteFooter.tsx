"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoMark } from "./common/Icons";

export default function SiteFooter() {
  const path = usePathname();
  // The viewer, practice and studio are full-height tools; keep them uncluttered.
  if (path.startsWith("/surah") || path.startsWith("/studio") || path.startsWith("/practice") || path.startsWith("/lab")) return null;
  return (
    <footer className="mt-16 border-t border-line">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 text-sm text-ink-2 md:grid-cols-[1.3fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2.5 font-semibold text-ink">
            <LogoMark size={28} /> QuranASL
          </div>
          <p className="mt-3 max-w-sm leading-relaxed">
            The meanings of the Qur&apos;an in American and British Sign Language. A draft for Deaf community review — built to be
            corrected and completed by Deaf translators.
          </p>
        </div>
        <div>
          <p className="mb-2 font-semibold text-ink">Explore</p>
          <ul className="space-y-1.5">
            <li><Link className="hover:text-ink" href="/">All surahs</Link></li>
            <li><Link className="hover:text-ink" href="/surah/1">Start with Al-Fātiḥah</Link></li>
            <li><Link className="hover:text-ink" href="/dictionary">Sign dictionary</Link></li>
            <li><Link className="hover:text-ink" href="/practice">Practice with your camera</Link></li>
          </ul>
        </div>
        <div>
          <p className="mb-2 font-semibold text-ink">Credits</p>
          <ul className="space-y-1.5">
            <li>Text & translation: Quran.com (Saheeh International)</li>
            <li>Human ASL: Global Deaf Muslim</li>
            <li>Human BSL: Al Isharah BSL Qur&apos;an Project</li>
            <li><Link className="hover:text-ink underline" href="/about">Sources, licences & privacy</Link></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}

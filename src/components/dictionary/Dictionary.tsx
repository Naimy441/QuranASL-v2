"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { PlaybackState } from "@/components/avatar/AvatarCanvas";
import { getLexicon, overrideEntries } from "@/lib/asl/lexicon";
import { buildTimeline } from "@/lib/asl/timeline";
import { fingerspell } from "@/lib/asl/fingerspell";
import { loadSignOverrides } from "@/lib/studio/signOverrides";
import { useMocapReady } from "@/lib/hooks/useMocap";
import { hasMocap } from "@/lib/asl/mocap";
import { getBslLexicon, loadBslLexicon } from "@/lib/bsl/lexicon";
import { bslFingerspell } from "@/lib/bsl/alphabet";
import { readViewerPrefs, type SignLang } from "@/lib/prefs";
import { SearchIcon } from "@/components/common/Icons";

const AvatarCanvas = dynamic(() => import("@/components/avatar/AvatarCanvas"), { ssr: false });

const CATS: Record<string, string> = { core: "Core", religion: "Islamic & religious", nature: "World & nature", more: "Actions & qualities", extra: "Qur'anic vocabulary" };

export default function Dictionary() {
  const [lang, setLang] = useState<SignLang>("asl");
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [sel, setSel] = useState("ALLAH");
  const [spell, setSpell] = useState("");
  const [freq, setFreq] = useState<Record<string, number>>({});
  const [bslReady, setBslReady] = useState(false);
  const pb = useRef<PlaybackState>({ time: 0, playing: true, rate: 0.8, loop: true });
  const mocapReady = useMocapReady();
  useEffect(() => {
    overrideEntries(Object.values(loadSignOverrides()));
    fetch("/data/gloss/freq.json").then((r) => r.json()).then(setFreq).catch(() => {});
    setLang(readViewerPrefs().lang);
  }, []);
  useEffect(() => {
    if (lang === "bsl") loadBslLexicon().then(() => setBslReady(true));
  }, [lang]);
  const lex = lang === "bsl" ? getBslLexicon() : getLexicon();
  const entries = useMemo(() => {
    const s = q.trim().toLowerCase();
    return [...lex.entries.values()]
      .filter((e) => (!cat || lang === "bsl" || e.cat === cat) && (!s || e.id.toLowerCase().includes(s) || e.en?.some((w) => w.includes(s))))
      .sort((a, b) => a.id.localeCompare(b.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lex, q, cat, lang, bslReady]);
  // keep a valid selection when switching language
  useEffect(() => {
    if (entries.length && !lex.get(sel)) setSel(entries.find((e) => e.id === "ALLAH")?.id ?? entries[0].id);
  }, [entries, lex, sel]);
  const timeline = useMemo(() => {
    try {
      const sign = spell ? (lang === "bsl" ? bslFingerspell(spell) : fingerspell(spell)) : lex.compile(sel);
      return buildTimeline([{ index: 0, label: sel, kind: "sign", sign }]);
    } catch {
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sel, spell, lex, lang, mocapReady, bslReady]);
  useEffect(() => {
    pb.current.time = 0;
    pb.current.playing = true;
  }, [timeline]);
  const e = lex.get(sel);
  return (
    <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <section className="flex flex-col gap-3 lg:sticky lg:top-20 lg:self-start">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-accent">Dictionary</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">{lang === "bsl" ? "BSL signs" : "ASL signs"}</h1>
          </div>
          <div role="radiogroup" aria-label="Sign language" className="grid grid-cols-2 rounded-full border border-line bg-panel p-1 text-sm">
            {(["asl", "bsl"] as SignLang[]).map((l) => (
              <button
                key={l}
                role="radio"
                aria-checked={lang === l}
                onClick={() => {
                  setLang(l);
                  setSpell("");
                }}
                className={`rounded-full px-4 py-1.5 font-semibold transition ${lang === l ? "bg-brand text-brand-ink shadow-soft" : "text-ink-2 hover:text-ink"}`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <div className="stage relative aspect-[4/3.4] overflow-hidden rounded-3xl border border-line shadow-soft">
          <AvatarCanvas className="absolute inset-0" timeline={timeline} playback={pb} ariaLabel={`Sign for ${spell || sel}`} />
          <div className="absolute left-3 top-3 rounded-full bg-black/70 px-3.5 py-1 font-mono text-lg font-semibold text-white backdrop-blur">{spell ? `fs: ${spell}` : sel}</div>
        </div>
        {!spell && e && (
          <div className="rounded-2xl border border-line bg-panel p-4 text-sm shadow-soft">
            <p><strong>English:</strong> {e.en?.join(", ") || "—"}</p>
            {lang === "bsl" ? (
              <p className="mt-1 text-brand">From Al Isharah&apos;s BSL Qur&apos;an Project recordings — {e.note}</p>
            ) : (
              e.mocap && hasMocap(e.mocap) && <p className="mt-1 text-brand">Motion captured from a Global Deaf Muslim video</p>
            )}
            <p className="mt-1"><strong>Confidence:</strong> <span className={e.conf === "low" ? "text-warn" : e.conf === "high" ? "text-ok" : ""}>{e.conf}</span>{lang === "asl" && e.note ? ` · ${e.note}` : ""}</p>
            {lang === "asl" && freq[e.id] ? <p className="mt-1 text-ink-2">Used {freq[e.id]}× across the Qur&apos;an glosses</p> : null}
            {lang === "asl" && (
              <>
                <p className="mt-2 break-all font-mono text-xs text-ink-2">{e.def}</p>
                <Link href={`/studio?sign=${encodeURIComponent(e.id)}`} className="mt-2 inline-block font-medium text-brand underline">Improve this sign</Link>
              </>
            )}
          </div>
        )}
        <label className="flex items-center gap-2 text-sm text-ink-2">
          Fingerspell anything ({lang === "bsl" ? "two-handed" : "one-handed"})
          <input value={spell} onChange={(ev) => setSpell(ev.target.value.replace(/[^a-z ]/gi, "").toUpperCase())} placeholder="e.g. MUSA" className="min-w-0 flex-1 rounded-full border border-line bg-panel px-3 py-1.5 font-mono text-ink outline-none focus:border-brand" />
        </label>
      </section>
      <section>
        <div className="glass sticky top-16 z-10 -mx-1 mb-3 flex flex-wrap gap-2 px-1 py-2">
          <div className="relative flex-1">
            <SearchIcon size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3" />
            <input value={q} onChange={(ev) => setQ(ev.target.value)} placeholder={`Search ${lex.entries.size} signs (gloss or English)`} className="w-full rounded-full border border-line bg-panel py-2.5 pl-10 pr-3 text-sm outline-none focus:border-brand" aria-label="Search signs" />
          </div>
          {lang === "asl" && (
            <select value={cat} onChange={(ev) => setCat(ev.target.value)} className="rounded-full border border-line bg-panel px-3 text-sm" aria-label="Category">
              <option value="">All categories</option>
              {Object.entries(CATS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          )}
        </div>
        {lang === "bsl" && !bslReady ? (
          <ul className="grid grid-cols-2 gap-1.5 sm:grid-cols-3" aria-hidden>
            {Array.from({ length: 18 }, (_, i) => <li key={i} className="skeleton h-12 rounded-xl" />)}
          </ul>
        ) : (
          <ul className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            {entries.map((x) => (
              <li key={x.id}>
                <button
                  onClick={() => { setSel(x.id); setSpell(""); }}
                  aria-pressed={sel === x.id && !spell}
                  className={`w-full rounded-xl border px-2.5 py-1.5 text-left transition ${sel === x.id && !spell ? "border-brand bg-brand-soft" : "border-line bg-panel/70 hover:border-line-2 hover:bg-panel"}`}
                >
                  <span className="flex items-center gap-1.5 font-mono text-sm">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${x.conf === "high" ? "bg-ok" : x.conf === "low" ? "bg-warn" : "bg-accent"}`} aria-label={`${x.conf} confidence`} />
                    <span className="truncate">{x.id}</span>
                  </span>
                  <span className="block truncate text-xs text-ink-2">{x.en?.slice(0, 4).join(", ")}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

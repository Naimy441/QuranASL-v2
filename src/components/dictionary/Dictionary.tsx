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
import { Frame } from "@/components/ui/frame";
import { Badge } from "@/components/ui/badge";

const AvatarCanvas = dynamic(() => import("@/components/avatar/AvatarCanvas"), { ssr: false });

const CATS: Record<string, string> = {
  core: "Core",
  religion: "Islamic & religious",
  nature: "World & nature",
  more: "Actions & qualities",
  extra: "Qur'anic vocabulary",
};

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
      .filter((e) => !e.id.endsWith(".drawn") && (!cat || lang === "bsl" || e.cat === cat) && (!s || e.id.toLowerCase().includes(s) || e.en?.some((w) => w.includes(s))))
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
    <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 sm:px-6 py-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <section className="flex flex-col gap-3 lg:sticky lg:top-20 lg:self-start">
        <div className="flex items-end justify-between gap-3 border-b border-line/60 pb-3">
          <div>
            <Badge variant="outline" size="sm" className="bg-panel font-mono">
              Linguistic Concordance
            </Badge>
            <h1 className="mt-1 font-serif text-2xl font-medium tracking-tight text-ink sm:text-3xl">
              {lang === "bsl" ? "BSL Sign Lexicon" : "ASL Sign Lexicon"}
            </h1>
          </div>
          <div role="radiogroup" aria-label="Sign language" className="grid grid-cols-2 rounded-lg border border-line bg-panel p-0.5 text-xs shadow-xs">
            {(["asl", "bsl"] as SignLang[]).map((l) => (
              <button
                key={l}
                role="radio"
                aria-checked={lang === l}
                onClick={() => {
                  setLang(l);
                  setSpell("");
                }}
                className={`rounded-md px-3 py-1 font-semibold transition cursor-pointer ${
                  lang === l ? "bg-brand text-brand-ink shadow-xs" : "text-ink-2 hover:text-ink"
                }`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Framed 3D Stage */}
        <Frame
          withCorners
          withHeader
          headerTitle={
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-ok" />
              <span className="font-mono text-[11px] font-semibold text-ink">
                {spell ? `FINGERSPELL: ${spell}` : `SIGN: ${sel}`}
              </span>
            </div>
          }
          headerAction={<span className="font-mono text-[10px] text-ink-3">Live Rig</span>}
          className="overflow-hidden shadow-xs"
        >
          <div className="stage relative aspect-[4/3.4] overflow-hidden">
            <AvatarCanvas className="absolute inset-0" timeline={timeline} playback={pb} ariaLabel={`Sign for ${spell || sel}`} />
            <div className="absolute left-3 top-3 rounded-md border border-line bg-panel/90 px-2.5 py-1 font-mono text-xs font-semibold text-ink shadow-xs backdrop-blur">
              {spell ? `fs: ${spell}` : sel}
            </div>
          </div>
        </Frame>

        {!spell && e && (
          <Frame withCorners={false} className="p-4 text-xs shadow-xs bg-panel">
            <p className="text-ink">
              <strong>English Gloss Equivalence:</strong> {e.en?.join(", ") || "—"}
            </p>
            {lang === "bsl" ? (
              <p className="mt-1.5 text-brand font-medium">From Al Isharah&apos;s BSL Qur&apos;an Project recordings — {e.note}</p>
            ) : (
              e.mocap && hasMocap(e.mocap) && <p className="mt-1.5 text-brand font-medium">Motion captured from a Global Deaf Muslim video</p>
            )}
            <p className="mt-1.5 text-ink-2">
              <strong>Validation Confidence:</strong>{" "}
              <span className={e.conf === "low" ? "text-warn font-semibold" : e.conf === "high" ? "text-ok font-semibold" : "text-accent font-semibold"}>
                {e.conf ? e.conf.toUpperCase() : "STANDARD"}
              </span>
              {lang === "asl" && e.note ? ` · ${e.note}` : ""}
            </p>
            {lang === "asl" && freq[e.id] ? (
              <p className="mt-1.5 text-ink-3 font-mono">Corpus Frequency: {freq[e.id]}× occurrences across 6,236 ayat</p>
            ) : null}
            {lang === "asl" && (
              <>
                <p className="mt-2.5 break-all font-mono text-[11px] text-ink-3 border-t border-line/60 pt-2">{e.def}</p>
                <Link href={`/studio?sign=${encodeURIComponent(e.id)}`} className="mt-2 inline-block font-medium text-brand hover:underline">
                  Edit phonological specification in Studio →
                </Link>
              </>
            )}
          </Frame>
        )}

        <label className="flex items-center gap-2 text-xs text-ink-2 rounded-lg border border-line bg-panel p-2 shadow-xs">
          <span className="font-medium shrink-0">Fingerspell ({lang === "bsl" ? "2-handed" : "1-handed"}):</span>
          <input
            value={spell}
            onChange={(ev) => setSpell(ev.target.value.replace(/[^a-z ]/gi, "").toUpperCase())}
            placeholder="e.g. MUSA"
            className="min-w-0 flex-1 rounded border border-line bg-panel-2 px-2 py-1 font-mono text-ink text-xs outline-none focus:border-brand"
          />
        </label>
      </section>

      <section>
        <div className="glass sticky top-14 z-10 -mx-1 mb-3 flex flex-wrap gap-2 rounded-xl border border-line/60 p-2 shadow-xs">
          <div className="relative flex-1">
            <SearchIcon size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
            <input
              value={q}
              onChange={(ev) => setQ(ev.target.value)}
              placeholder={`Search ${lex.entries.size} signs in lexicon...`}
              className="w-full rounded-md border border-line bg-panel py-1.5 pl-8 pr-3 text-xs outline-none focus:border-brand"
              aria-label="Search signs"
            />
          </div>
          {lang === "asl" && (
            <select
              value={cat}
              onChange={(ev) => setCat(ev.target.value)}
              className="rounded-md border border-line bg-panel px-3 py-1.5 text-xs text-ink outline-none focus:border-brand"
              aria-label="Category"
            >
              <option value="">All categories</option>
              {Object.entries(CATS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          )}
        </div>

        {lang === "bsl" && !bslReady ? (
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3" aria-hidden>
            {Array.from({ length: 18 }, (_, i) => (
              <li key={i} className="skeleton h-14 rounded-lg" />
            ))}
          </ul>
        ) : (
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {entries.map((x) => (
              <li key={x.id}>
                <button
                  onClick={() => {
                    setSel(x.id);
                    setSpell("");
                  }}
                  aria-pressed={sel === x.id && !spell}
                  className={`w-full h-full flex flex-col justify-between rounded-lg border px-3 py-2.5 text-left transition cursor-pointer ${
                    sel === x.id && !spell
                      ? "border-brand bg-brand-soft shadow-xs"
                      : "border-line bg-panel hover:border-line-2 hover:bg-panel-2/60"
                  }`}
                >
                  <span className="flex items-center gap-1.5 font-mono text-xs font-semibold text-ink">
                    <span
                      className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                        x.conf === "high" ? "bg-ok" : x.conf === "low" ? "bg-warn" : "bg-accent"
                      }`}
                      aria-label={`${x.conf} confidence`}
                    />
                    <span className="truncate">{x.id}</span>
                  </span>
                  <span className="block truncate text-[11px] text-ink-3 mt-1 min-h-[1.1rem]">
                    {x.en?.length ? x.en.slice(0, 3).join(", ") : "—"}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

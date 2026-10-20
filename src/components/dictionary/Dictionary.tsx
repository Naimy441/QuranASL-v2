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

const AvatarCanvas = dynamic(() => import("@/components/avatar/AvatarCanvas"), { ssr: false });

const CATS: Record<string, string> = { core: "Core", religion: "Islamic & religious", nature: "World & nature", more: "Actions & qualities", extra: "Qur'anic vocabulary" };

export default function Dictionary() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [sel, setSel] = useState("ALLAH");
  const [spell, setSpell] = useState("");
  const [freq, setFreq] = useState<Record<string, number>>({});
  const pb = useRef<PlaybackState>({ time: 0, playing: true, rate: 0.8, loop: true });
  const mocapReady = useMocapReady();
  useEffect(() => {
    overrideEntries(Object.values(loadSignOverrides()));
    fetch("/data/gloss/freq.json").then((r) => r.json()).then(setFreq).catch(() => {});
  }, []);
  const lex = getLexicon();
  const entries = useMemo(() => {
    const s = q.trim().toLowerCase();
    return [...lex.entries.values()]
      .filter((e) => (!cat || e.cat === cat) && (!s || e.id.toLowerCase().includes(s) || e.en?.some((w) => w.includes(s))))
      .sort((a, b) => a.id.localeCompare(b.id));
  }, [lex, q, cat]);
  const timeline = useMemo(() => {
    try {
      const sign = spell ? fingerspell(spell) : lex.compile(sel);
      return buildTimeline([{ index: 0, label: sel, kind: "sign", sign }]);
    } catch {
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sel, spell, lex, mocapReady]);
  useEffect(() => {
    pb.current.time = 0;
    pb.current.playing = true;
  }, [timeline]);
  const e = lex.get(sel);
  return (
    <div className="mx-auto grid w-full max-w-7xl gap-4 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <section className="flex flex-col gap-3 lg:sticky lg:top-3 lg:self-start">
        <h1 className="text-2xl font-semibold">Sign dictionary</h1>
        <div className="stage relative aspect-[4/3.4] overflow-hidden rounded-2xl border border-line">
          <AvatarCanvas className="absolute inset-0" timeline={timeline} playback={pb} ariaLabel={`Sign for ${spell || sel}`} />
          <div className="absolute left-3 top-3 rounded-lg bg-black/60 px-3 py-1 font-mono text-lg text-white">{spell ? `fs: ${spell}` : sel}</div>
        </div>
        {!spell && e && (
          <div className="rounded-xl border border-line bg-panel p-3 text-sm">
            <p><strong>English:</strong> {e.en?.join(", ") || "—"}</p>
            {e.mocap && hasMocap(e.mocap) && <p className="mb-1 text-brand">Motion captured from a Global Deaf Muslim video</p>}
            <p className="mt-1"><strong>Confidence:</strong> <span className={e.conf === "low" ? "text-warn" : e.conf === "high" ? "text-ok" : ""}>{e.conf}</span>{e.note ? ` · ${e.note}` : ""}</p>
            {freq[e.id] ? <p className="mt-1 text-ink-2">Used {freq[e.id]}× in the hand-glossed surahs</p> : null}
            <p className="mt-2 break-all font-mono text-xs text-ink-2">{e.def}</p>
            <Link href={`/studio?sign=${encodeURIComponent(e.id)}`} className="mt-2 inline-block text-brand underline">Improve this sign</Link>
          </div>
        )}
        <label className="text-sm">
          Fingerspell anything
          <input value={spell} onChange={(ev) => setSpell(ev.target.value.replace(/[^a-z ]/gi, "").toUpperCase())} placeholder="e.g. MUSA" className="ml-2 rounded-md border border-line bg-panel px-2 py-1 font-mono" />
        </label>
      </section>
      <section>
        <div className="mb-3 flex flex-wrap gap-2">
          <input value={q} onChange={(ev) => setQ(ev.target.value)} placeholder={`Search ${lex.entries.size} signs (gloss or English)`} className="flex-1 rounded-lg border border-line bg-panel px-3 py-2 text-sm" aria-label="Search signs" />
          <select value={cat} onChange={(ev) => setCat(ev.target.value)} className="rounded-lg border border-line bg-panel px-2 text-sm" aria-label="Category">
            <option value="">All categories</option>
            {Object.entries(CATS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <ul className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
          {entries.map((x) => (
            <li key={x.id}>
              <button
                onClick={() => { setSel(x.id); setSpell(""); }}
                aria-pressed={sel === x.id && !spell}
                className={`w-full rounded-lg border px-2 py-1.5 text-left ${sel === x.id && !spell ? "border-brand bg-panel" : "border-line bg-panel/60 hover:bg-panel"}`}
              >
                <span className="flex items-center gap-1.5 font-mono text-sm">
                  <span className={`h-2 w-2 rounded-full ${x.conf === "high" ? "bg-ok" : x.conf === "low" ? "bg-warn" : "bg-accent"}`} aria-label={`${x.conf} confidence`} />
                  {x.id}
                </span>
                <span className="block truncate text-xs text-ink-2">{x.en?.slice(0, 4).join(", ")}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

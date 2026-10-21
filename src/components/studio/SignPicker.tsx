"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import type { PlaybackState } from "@/components/avatar/AvatarCanvas";
import { getLexicon } from "@/lib/asl/lexicon";
import { buildTimeline } from "@/lib/asl/timeline";
import { IconBtn, Btn } from "./ui";

const AvatarCanvas = dynamic(() => import("@/components/avatar/AvatarCanvas"), { ssr: false });

let freqP: Promise<Record<string, number>> | null = null;
const loadFreq = () => (freqP ??= fetch("/data/gloss/freq.json").then((r) => (r.ok ? r.json() : {})).catch(() => ({})));

const CONF_DOT: Record<string, string> = { high: "bg-ok", med: "bg-accent", low: "bg-ink-3" };

/**
 * Search the dictionary by gloss or English word; the highlighted sign plays on a
 * preview signer. Arrow keys move, Enter picks, Escape closes. `fs:` mode spells a word.
 */
export default function SignPicker({ open, title, initial = "", onPick, onClose }: { open: boolean; title: string; initial?: string; onPick: (r: { kind: "sign" | "fs"; gloss: string }) => void; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState(initial);
  const [hi, setHi] = useState(0);
  const [freq, setFreq] = useState<Record<string, number>>({});
  const pb = useRef<PlaybackState>({ time: 0, playing: true, rate: 0.9, loop: true });

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      setQ(initial);
      setHi(0);
      d.showModal();
      requestAnimationFrame(() => inputRef.current?.focus());
      loadFreq().then(setFreq);
    } else if (!open && d.open) d.close();
  }, [open, initial]);

  const lex = getLexicon();
  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    const all = [...lex.entries.values()].filter((e) => !e.id.endsWith(".drawn"));
    if (!s) return all.sort((a, b) => (freq[b.id] ?? 0) - (freq[a.id] ?? 0)).slice(0, 60);
    const score = (e: (typeof all)[number]) => {
      const id = e.id.toLowerCase();
      if (id === s) return 0;
      if (e.en?.includes(s)) return 1;
      if (id.startsWith(s)) return 2;
      if (e.en?.some((w) => w.startsWith(s))) return 3;
      if (id.includes(s)) return 4;
      if (e.en?.some((w) => w.includes(s))) return 5;
      return 9;
    };
    return all
      .map((e) => ({ e, s: score(e) }))
      .filter((x) => x.s < 9)
      .sort((a, b) => a.s - b.s || (freq[b.e.id] ?? 0) - (freq[a.e.id] ?? 0))
      .slice(0, 60)
      .map((x) => x.e);
  }, [q, lex, freq]);

  const cur = results[Math.min(hi, results.length - 1)];
  const timeline = useMemo(() => {
    if (!open || !cur) return null;
    try {
      return buildTimeline([{ index: 0, label: cur.id, kind: "sign", sign: lex.compile(cur.id) }]);
    } catch {
      return null;
    }
  }, [cur, lex, open]);
  useEffect(() => {
    pb.current.time = 0;
    pb.current.playing = true;
  }, [timeline]);
  useEffect(() => {
    listRef.current?.querySelector(`[data-i="${hi}"]`)?.scrollIntoView({ block: "nearest" });
  }, [hi]);

  const spell = q.trim().replace(/[^A-Za-z]/g, "").toUpperCase();
  const pick = (id: string) => onPick({ kind: "sign", gloss: id });

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onCancel={onClose}
      aria-labelledby="picker-title"
      className="m-auto w-[min(56rem,calc(100vw-1.5rem))] max-w-none rounded-2xl border-2 border-line-2 bg-panel p-0 text-ink shadow-lift backdrop:bg-black/60"
    >
      <div className="flex items-center gap-2 border-b border-line p-3">
        <h2 id="picker-title" className="text-lg font-semibold">
          {title}
        </h2>
        <IconBtn icon={X} label="Close" tone="ghost" className="ml-auto" onClick={onClose} />
      </div>
      <div className="grid gap-3 p-3 md:grid-cols-[minmax(0,1fr)_16rem]">
        <div className="min-w-0">
          <label className="relative block">
            <span className="sr-only">Search signs by gloss or English</span>
            <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-ink-3" />
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setHi(0);
              }}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") (e.preventDefault(), setHi((h) => Math.min(results.length - 1, h + 1)));
                else if (e.key === "ArrowUp") (e.preventDefault(), setHi((h) => Math.max(0, h - 1)));
                else if (e.key === "Enter" && cur) (e.preventDefault(), pick(cur.id));
              }}
              role="combobox"
              aria-expanded
              aria-controls="picker-list"
              aria-activedescendant={cur ? `pick-${cur.id}` : undefined}
              placeholder="Search: mercy, ALLAH, pray…"
              className="min-h-12 w-full rounded-xl border-2 border-line-2 bg-panel pl-10 pr-3 text-base"
            />
          </label>
          <ul ref={listRef} id="picker-list" role="listbox" aria-label="Signs" className="mt-2 max-h-[min(52vh,26rem)] space-y-1 overflow-y-auto pr-1">
            {results.map((e, i) => (
              <li key={e.id} id={`pick-${e.id}`} role="option" aria-selected={i === hi} data-i={i}>
                <button
                  type="button"
                  tabIndex={-1}
                  onMouseEnter={() => setHi(i)}
                  onFocus={() => setHi(i)}
                  onClick={() => pick(e.id)}
                  className={`flex min-h-12 w-full items-center gap-3 rounded-xl border-2 px-3 py-1.5 text-left ${i === hi ? "border-brand bg-brand-soft" : "border-transparent hover:bg-panel-2"}`}
                >
                  <span aria-hidden className={`size-2.5 shrink-0 rounded-full ${CONF_DOT[e.conf ?? "med"]}`} title={`confidence: ${e.conf ?? "med"}`} />
                  <span className="font-mono text-base font-semibold">{e.id}</span>
                  <span className="min-w-0 flex-1 truncate text-sm text-ink-2">{e.en?.join(", ")}</span>
                  {e.mocap && <span className="rounded border border-line px-1 text-[10px] text-ink-2">captured</span>}
                  {freq[e.id] ? <span className="shrink-0 text-xs tabular-nums text-ink-3">{freq[e.id]}×</span> : null}
                </button>
              </li>
            ))}
            {!results.length && <li className="p-4 text-center text-ink-2">No sign found.</li>}
          </ul>
          {spell && (
            <Btn className="mt-2 w-full" onClick={() => onPick({ kind: "fs", gloss: spell })}>
              Fingerspell “{spell}” instead
            </Btn>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <div className="stage relative aspect-[4/4.4] overflow-hidden rounded-xl border border-line md:aspect-auto md:h-72">
            {open && <AvatarCanvas className="absolute inset-0" timeline={timeline} playback={pb} interactive={false} ariaLabel={cur ? `Preview of ${cur.id}` : "Preview"} />}
          </div>
          {cur && (
            <Btn tone="primary" size="lg" onClick={() => pick(cur.id)}>
              Use {cur.id}
            </Btn>
          )}
        </div>
      </div>
    </dialog>
  );
}

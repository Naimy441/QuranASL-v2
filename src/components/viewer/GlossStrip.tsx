"use client";

import type { ResolvedToken } from "@/lib/asl/gloss";
import type { TimelineItem } from "@/lib/asl/timeline";

/** Gloss chips for the current ayah; colour shows how trustworthy each sign is. */
export default function GlossStrip({
  tokens, items, active, onSeek,
}: { tokens: ResolvedToken[]; items: TimelineItem[]; active: number; onSeek: (t: number) => void }) {
  const byIndex = new Map(items.map((i) => [i.index, i]));
  return (
    <ol className="mt-3 flex flex-wrap gap-1.5" aria-label="ASL gloss">
      {tokens.map((t) => {
        if (t.status === "pause") return t.raw === "," ? null : <li key={t.index} aria-hidden className="self-center text-ink-2">{t.raw}</li>;
        const it = byIndex.get(t.index);
        const isActive = t.index === active;
        const style =
          t.status === "fallback" || t.status === "missing"
            ? "border-warn bg-warn/10 text-warn"
            : t.status === "fs"
              ? "border-line bg-panel-2 text-ink"
              : t.conf === "low"
                ? "border-dashed border-ink-2 bg-panel text-ink"
                : "border-line bg-panel text-ink";
        const title =
          t.status === "fallback" ? "No sign in the dictionary yet — fingerspelled" :
          t.status === "fs" ? "Fingerspelled" :
          t.conf === "low" ? "Draft sign — needs Deaf review" : t.tags.length ? `Facial grammar: ${t.tags.join(", ")}` : "Sign";
        return (
          <li key={t.index}>
            <button
              onClick={() => it && onSeek(Math.max(0, it.start - 0.15))}
              title={title}
              className={`rounded-md border px-2 py-0.5 font-mono text-xs transition ${style} ${isActive ? "ring-2 ring-brand ring-offset-1 ring-offset-panel" : ""}`}
            >
              {t.status === "fs" || t.status === "fallback" ? <span className="opacity-60">fs:</span> : null}
              {t.gloss}
              {t.locus ? <sub className="ml-0.5 opacity-60">{t.locus}</sub> : null}
              {t.tags.length ? <sup className="ml-0.5 text-[9px] text-accent">{t.tags[t.tags.length - 1]}</sup> : null}
            </button>
          </li>
        );
      })}
    </ol>
  );
}

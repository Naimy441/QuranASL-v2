"use client";

import { useRef, useState } from "react";
import { getLexicon } from "@/lib/asl/lexicon";
import { chipText, type Chip } from "./chips";

/**
 * The gloss as a row of large chips. Reorder by dragging (mouse, pen or touch) or
 * with the keyboard: ←/→ move focus, Alt+←/→ (or Ctrl) move the chip, Delete
 * removes it, Enter opens it. The chip playing on the avatar is outlined.
 */
export default function ChipTimeline({
  chips,
  sel,
  active,
  onSelect,
  onMove,
  onDelete,
}: {
  chips: Chip[];
  sel: number | null;
  active: number;
  onSelect: (i: number | null) => void;
  onMove: (from: number, to: number) => void;
  onDelete: (i: number) => void;
}) {
  const lex = getLexicon();
  const drag = useRef<{ from: number; x: number; y: number; on: boolean; id: number } | null>(null);
  const [over, setOver] = useState<{ from: number; to: number } | null>(null);
  const listRef = useRef<HTMLOListElement>(null);

  const focusChip = (i: number) => requestAnimationFrame(() => listRef.current?.querySelector<HTMLButtonElement>(`[data-chip="${i}"]`)?.focus());

  const targetAt = (x: number, y: number): number | null => {
    const el = document.elementFromPoint(x, y)?.closest<HTMLElement>("[data-chip]");
    if (!el) return null;
    const i = +el.dataset.chip!;
    const r = el.getBoundingClientRect();
    return x > r.left + r.width / 2 ? i + 1 : i; // insertion point
  };

  return (
    <ol ref={listRef} className="flex flex-wrap items-center gap-2" aria-label="Signs in this ayah, in order">
      {chips.map((c, i) => {
        const known = c.kind !== "sign" || lex.has(c.gloss) || c.gloss.split("+").every((p) => lex.has(p));
        const insertBefore = over && over.to === i && over.from !== i && over.from !== i - 1;
        const insertAfter = over && i === chips.length - 1 && over.to === chips.length && over.from !== i;
        const pause = c.kind === "pause";
        return (
          <li key={c.key} className="relative flex items-center">
            {insertBefore && <span aria-hidden className="absolute -left-1.5 top-0 h-full w-1 rounded bg-brand" />}
            <button
              type="button"
              data-chip={i}
              aria-pressed={sel === i}
              aria-label={`${i + 1} of ${chips.length}: ${pause ? `pause ${c.gloss}` : chipText(c)}${c.tags.length ? `, face: ${c.tags.join(" ")}` : ""}${known ? "" : ", not in dictionary"}`}
              aria-keyshortcuts="Alt+ArrowLeft Alt+ArrowRight Delete"
              onClick={() => {
                if (drag.current?.on) return;
                onSelect(sel === i ? null : i);
              }}
              onKeyDown={(e) => {
                const mod = e.altKey || e.ctrlKey || e.metaKey;
                if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
                  e.preventDefault();
                  const d = e.key === "ArrowLeft" ? -1 : 1;
                  const to = Math.max(0, Math.min(chips.length - 1, i + d));
                  if (mod) onMove(i, to);
                  else if (sel !== null) onSelect(to);
                  focusChip(to);
                } else if (e.key === "Home" || e.key === "End") {
                  e.preventDefault();
                  focusChip(e.key === "Home" ? 0 : chips.length - 1);
                } else if (e.key === "Delete" || e.key === "Backspace") {
                  e.preventDefault();
                  onDelete(i);
                  focusChip(Math.max(0, Math.min(i, chips.length - 2)));
                }
              }}
              onPointerDown={(e) => {
                if (e.button !== 0) return;
                drag.current = { from: i, x: e.clientX, y: e.clientY, on: false, id: e.pointerId };
              }}
              onPointerMove={(e) => {
                const d = drag.current;
                if (!d || d.id !== e.pointerId) return;
                if (!d.on && Math.hypot(e.clientX - d.x, e.clientY - d.y) > 8) {
                  d.on = true;
                  (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                }
                if (d.on) {
                  const to = targetAt(e.clientX, e.clientY);
                  if (to !== null) setOver({ from: d.from, to });
                }
              }}
              onPointerUp={() => {
                const d = drag.current;
                if (d?.on && over) {
                  const to = over.to > d.from ? over.to - 1 : over.to;
                  if (to !== d.from) onMove(d.from, to);
                }
                setOver(null);
                // let the click handler see that this was a drag
                setTimeout(() => (drag.current = null), 0);
              }}
              onPointerCancel={() => {
                drag.current = null;
                setOver(null);
              }}
              style={{ touchAction: "none" }}
              className={[
                "relative flex min-h-12 select-none flex-col items-center justify-center rounded-xl border-2 font-mono transition",
                pause ? "min-w-9 px-2 text-lg text-ink-2" : "min-w-12 px-3 text-[15px] font-semibold",
                sel === i ? "border-brand bg-brand-soft ring-2 ring-brand" : known ? "border-line-2" : "border-warn border-dashed text-warn",
                !pause && c.tags.length && sel !== i ? "bg-accent/10" : sel !== i ? "bg-panel-2" : "",
                active === i ? "shadow-[0_0_0_3px_var(--ring)]" : "",
                over?.from === i ? "opacity-40" : "",
                "cursor-grab active:cursor-grabbing",
              ].join(" ")}
            >
              <span>
                {c.kind === "fs" && <span className="font-normal opacity-60">fs:</span>}
                {pause ? c.gloss : c.gloss}
                {c.locus && <sub className="ml-0.5 text-xs font-normal text-brand">{c.locus}</sub>}
                {c.repeat && <span className="text-brand">+</span>}
              </span>
              {c.tags.length > 0 && <span className="text-[10px] font-normal leading-none text-accent">{c.tags.join(" ")}</span>}
            </button>
            {insertAfter && <span aria-hidden className="absolute -right-1.5 top-0 h-full w-1 rounded bg-brand" />}
          </li>
        );
      })}
    </ol>
  );
}

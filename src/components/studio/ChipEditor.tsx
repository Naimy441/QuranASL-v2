"use client";

import { ArrowLeft, ArrowRight, Hand, MapPin, Plus, Repeat, Replace, Smile, Trash2 } from "lucide-react";
import { getLexicon } from "@/lib/asl/lexicon";
import type { Chip } from "./chips";
import { Btn, IconBtn } from "./ui";

// Facial grammar, grouped so a signer finds them by function rather than reading every tag.
const NMS_GROUPS: { label: string; tags: [string, string][] }[] = [
  { label: "Questions", tags: [["yn", "yes/no"], ["wh", "wh-"], ["rhq", "rhetorical"], ["cond", "if"]] },
  { label: "Grammar", tags: [["top", "topic"], ["neg", "no / not"], ["aff", "yes / nod"], ["emph", "strong"]] },
  { label: "Feeling", tags: [["awe", "awe"], ["sad", "sad"], ["happy", "happy"], ["warn", "warning"], ["fear", "fear"]] },
  { label: "Mouth", tags: [["mm", "mm"], ["cha", "cha"], ["oo", "oo"], ["puff", "puff"], ["th", "th"]] },
  { label: "Role / gaze", tags: [["rs-a", "role a"], ["rs-b", "role b"], ["rs-c", "role c"], ["gaze-a", "look a"], ["gaze-b", "look b"], ["gaze-up", "look up"]] },
];
// a = signer's right, b = left (matches gloss.ts), c = centre
const LOCI: { v: string; label: string; hint: string }[] = [
  { v: "", label: "—", hint: "no place" },
  { v: "b", label: "◀ b", hint: "left" },
  { v: "c", label: "● c", hint: "centre" },
  { v: "a", label: "a ▶", hint: "right" },
  { v: "up", label: "▲ up", hint: "up" },
];

export default function ChipEditor({
  chip,
  index,
  count,
  onChange,
  onDelete,
  onMove,
  onReplace,
  onInsert,
  onEditSign,
}: {
  chip: Chip;
  index: number;
  count: number;
  onChange: (p: Partial<Chip>) => void;
  onDelete: () => void;
  onMove: (d: number) => void;
  onReplace: () => void;
  onInsert: (where: "before" | "after") => void;
  onEditSign: (id: string) => void;
}) {
  const lex = getLexicon();
  const variants = chip.kind === "sign" ? lex.variants(chip.gloss) : [];
  const entry = chip.kind === "sign" ? lex.get(chip.gloss) : undefined;
  const pause = chip.kind === "pause";
  const seg = (on: boolean) => `min-h-11 min-w-11 rounded-xl border-2 px-3 text-sm font-semibold ${on ? "border-brand bg-brand text-brand-ink" : "border-line-2 bg-panel hover:bg-panel-2"}`;

  return (
    <div className="mt-3 space-y-3 rounded-2xl border-2 border-brand/40 bg-panel-2 p-3" aria-label={`Edit chip ${index + 1}`}>
      <div className="flex flex-wrap items-center gap-2">
        <IconBtn icon={ArrowLeft} label="Move left (Alt+←)" disabled={index === 0} onClick={() => onMove(-1)} />
        <IconBtn icon={ArrowRight} label="Move right (Alt+→)" disabled={index === count - 1} onClick={() => onMove(1)} />
        <div className="min-w-0 flex-1 px-1">
          <div className="font-mono text-lg font-bold text-ink">{pause ? `pause ${chip.gloss}` : chip.kind === "fs" ? `fs:${chip.gloss}` : chip.gloss}</div>
          {entry?.en?.length ? <div className="truncate text-sm text-ink-2">{entry.en.join(", ")}</div> : chip.kind === "sign" && !entry ? <div className="text-sm text-warn">Not in the dictionary</div> : null}
        </div>
        <IconBtn icon={Trash2} label="Delete (Delete key)" tone="bad" onClick={onDelete} />
      </div>

      <div className="flex flex-wrap gap-2">
        {!pause && (
          <Btn icon={Replace} tone="primary" onClick={onReplace}>
            Change sign
          </Btn>
        )}
        <Btn icon={Plus} onClick={() => onInsert("before")}>
          Before
        </Btn>
        <Btn icon={Plus} onClick={() => onInsert("after")}>
          After
        </Btn>
        {chip.kind === "sign" && entry && (
          <Btn icon={Hand} onClick={() => onEditSign(chip.gloss.split("+")[0])}>
            Fix / record this sign
          </Btn>
        )}
      </div>

      {pause ? (
        <div role="group" aria-label="Pause length" className="flex flex-wrap gap-2">
          {[
            [",", ", short"],
            [".", ". sentence"],
            ["?", "? question"],
          ].map(([v, l]) => (
            <button key={v} type="button" aria-pressed={chip.gloss === v} onClick={() => onChange({ gloss: v })} className={seg(chip.gloss === v)}>
              {l}
            </button>
          ))}
        </div>
      ) : (
        <>
          {variants.length > 1 && (
            <div role="group" aria-label="Variants" className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-ink-2">Variant</span>
              {variants.map((v) => (
                <button key={v.id} type="button" aria-pressed={v.id === chip.gloss} onClick={() => onChange({ gloss: v.id })} className={`${seg(v.id === chip.gloss)} font-mono`} title={v.en?.join(", ")}>
                  {v.id}
                </button>
              ))}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 text-sm font-medium text-ink-2">
              <MapPin aria-hidden className="size-4" /> Place
            </span>
            <div role="group" aria-label="Place in signing space" className="flex flex-wrap gap-1.5">
              {LOCI.map((l) => (
                <button key={l.v} type="button" aria-pressed={(chip.locus ?? "") === l.v} aria-label={`place: ${l.hint}`} title={l.hint} onClick={() => onChange({ locus: l.v || undefined })} className={seg((chip.locus ?? "") === l.v)}>
                  {l.label}
                </button>
              ))}
            </div>
            {chip.kind === "sign" && (
              <button type="button" aria-pressed={!!chip.repeat} onClick={() => onChange({ repeat: !chip.repeat })} className={`${seg(!!chip.repeat)} inline-flex items-center gap-1.5`}>
                <Repeat aria-hidden className="size-4" /> Repeat
              </button>
            )}
            <button type="button" aria-pressed={chip.kind === "fs"} onClick={() => onChange({ kind: chip.kind === "fs" ? "sign" : "fs" })} className={seg(chip.kind === "fs")}>
              fs: spell
            </button>
          </div>
          <fieldset>
            <legend className="mb-1 inline-flex items-center gap-1 text-sm font-medium text-ink-2">
              <Smile aria-hidden className="size-4" /> Face (non-manual signals)
            </legend>
            <div className="space-y-1.5">
              {NMS_GROUPS.map((g) => (
                <div key={g.label} className="flex flex-wrap items-center gap-1.5">
                  <span className="w-24 shrink-0 text-xs text-ink-3">{g.label}</span>
                  {g.tags.map(([t, l]) => {
                    const on = chip.tags.includes(t);
                    return (
                      <button
                        key={t}
                        type="button"
                        aria-pressed={on}
                        onClick={() => onChange({ tags: on ? chip.tags.filter((x) => x !== t) : [...chip.tags, t] })}
                        className={`min-h-11 rounded-xl border-2 px-2.5 text-sm ${on ? "border-accent bg-accent text-[var(--bg)] font-semibold" : "border-line-2 bg-panel hover:bg-panel-2"}`}
                      >
                        {l}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </fieldset>
        </>
      )}
    </div>
  );
}

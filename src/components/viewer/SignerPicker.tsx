"use client";

import { useEffect, useRef, useState } from "react";
import type { AvatarId } from "@/lib/prefs";
import { CheckIcon, UsersIcon } from "@/components/common/Icons";

export const SIGNERS: { id: AvatarId; name: string; note: string; swatch: [string, string] }[] = [
  { id: "amina", name: "Amina", note: "Hijab", swatch: ["#c48a66", "#6d4a5c"] },
  { id: "maryam", name: "Maryam", note: "Hijab", swatch: ["#7a4a33", "#1f3a4c"] },
  { id: "yusuf", name: "Yusuf", note: "Kufi, beard", swatch: ["#a8724f", "#f3efe6"] },
  { id: "sam", name: "Sam", note: "Short hair", swatch: ["#e0b493", "#4a3322"] },
];

/** Compact popover for choosing the avatar signer. */
export default function SignerPicker({ value, onChange }: { value: AvatarId; onChange: (a: AvatarId) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);
  const cur = SIGNERS.find((s) => s.id === value) ?? SIGNERS[0];
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex h-9 items-center gap-2 rounded-full bg-panel/85 pl-1 pr-3 text-xs font-medium text-ink shadow-soft backdrop-blur transition hover:bg-panel"
        title="Choose signer"
      >
        <span className="h-7 w-7 rounded-full border border-line" style={{ background: `linear-gradient(135deg, ${cur.swatch[0]} 50%, ${cur.swatch[1]} 50%)` }} />
        <span className="hidden sm:inline">{cur.name}</span>
        <UsersIcon size={14} className="text-ink-3 sm:hidden" />
      </button>
      {open && (
        <ul role="listbox" aria-label="Signer" className="animate-scale-in absolute right-0 top-11 z-30 w-48 origin-top-right rounded-2xl border border-line bg-panel p-1.5 shadow-lift">
          {SIGNERS.map((s) => (
            <li key={s.id}>
              <button
                role="option"
                aria-selected={s.id === value}
                onClick={() => {
                  onChange(s.id);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2.5 rounded-xl px-2 py-1.5 text-left text-sm transition ${s.id === value ? "bg-brand-soft text-ink" : "text-ink-2 hover:bg-panel-2 hover:text-ink"}`}
              >
                <span className="h-7 w-7 shrink-0 rounded-full border border-line" style={{ background: `linear-gradient(135deg, ${s.swatch[0]} 50%, ${s.swatch[1]} 50%)` }} />
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{s.name}</span>
                  <span className="block text-[11px] text-ink-3">{s.note}</span>
                </span>
                {s.id === value && <CheckIcon size={15} className="text-brand" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

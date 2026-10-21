"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { CircleCheck, Flag, Pencil, type LucideIcon } from "lucide-react";
import type { ReviewStatus } from "@/lib/review/types";
import { STATUS_LABEL } from "@/lib/review/status";

// Large, high-contrast controls shared by the Studio and the review queue.
// Every target is at least 44 px; colour is never the only signal (icon + word).

type Tone = "primary" | "ok" | "warn" | "bad" | "plain" | "ghost";
const TONE: Record<Tone, string> = {
  primary: "bg-brand text-brand-ink border-brand hover:bg-brand-2",
  // text in the page background colour: white on green/amber in light mode, near-black in dark and high contrast
  ok: "bg-ok text-[var(--bg)] border-ok hover:brightness-110",
  warn: "bg-warn text-[var(--bg)] border-warn hover:brightness-110",
  bad: "bg-panel text-bad border-bad hover:bg-bad/10",
  plain: "bg-panel text-ink border-line-2 hover:bg-panel-2",
  ghost: "bg-transparent text-ink-2 border-transparent hover:bg-panel-2 hover:text-ink",
};

export interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: Tone;
  icon?: LucideIcon;
  size?: "md" | "lg";
  children?: ReactNode;
}

export const Btn = forwardRef<HTMLButtonElement, BtnProps>(function Btn({ tone = "plain", icon: Icon, size = "md", className = "", children, ...rest }, ref) {
  const sz = size === "lg" ? "min-h-14 px-5 text-base gap-2.5" : "min-h-11 px-3.5 text-sm gap-2";
  return (
    <button
      ref={ref}
      type="button"
      {...rest}
      className={`inline-flex items-center justify-center rounded-xl border-2 font-semibold transition disabled:cursor-not-allowed disabled:opacity-45 ${sz} ${TONE[tone]} ${className}`}
    >
      {Icon && <Icon aria-hidden className={size === "lg" ? "size-6 shrink-0" : "size-5 shrink-0"} strokeWidth={2.2} />}
      {children}
    </button>
  );
});

/** Square icon-only button; `label` is the accessible name and tooltip. */
export function IconBtn({ icon: Icon, label, tone = "plain", className = "", ...rest }: Omit<BtnProps, "children" | "icon"> & { icon: LucideIcon; label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      {...rest}
      className={`inline-flex size-11 shrink-0 items-center justify-center rounded-xl border-2 transition disabled:cursor-not-allowed disabled:opacity-40 ${TONE[tone]} ${className}`}
    >
      <Icon aria-hidden className="size-5" strokeWidth={2.2} />
    </button>
  );
}

export const STATUS_ICON: Record<ReviewStatus, LucideIcon> = { draft: Pencil, "needs-changes": Flag, approved: CircleCheck };
export const STATUS_CLASS: Record<ReviewStatus, string> = {
  draft: "border-line-2 bg-panel-2 text-ink-2",
  "needs-changes": "border-warn bg-warn/10 text-warn",
  approved: "border-ok bg-ok/10 text-ok",
};

export function StatusBadge({ status, size = "md", stale }: { status: ReviewStatus; size?: "sm" | "md" | "lg"; stale?: boolean }) {
  const Icon = STATUS_ICON[status];
  const sz = size === "lg" ? "text-base px-3.5 py-2 gap-2" : size === "sm" ? "text-[11px] px-2 py-0.5 gap-1" : "text-sm px-2.5 py-1 gap-1.5";
  return (
    <span className={`inline-flex items-center rounded-full border-2 font-semibold ${sz} ${STATUS_CLASS[status]}`}>
      <Icon aria-hidden className={size === "lg" ? "size-5" : size === "sm" ? "size-3.5" : "size-4"} strokeWidth={2.4} />
      {STATUS_LABEL[status]}
      {stale && <span className="font-normal opacity-80">· edited since approval</span>}
    </span>
  );
}

export function Panel({ title, icon: Icon, children, actions, className = "" }: { title?: ReactNode; icon?: LucideIcon; children: ReactNode; actions?: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-line bg-panel p-3 sm:p-4 ${className}`}>
      {(title || actions) && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {Icon && <Icon aria-hidden className="size-5 text-ink-2" />}
          {title && <h2 className="text-base font-semibold text-ink">{title}</h2>}
          <div className="ml-auto flex flex-wrap items-center gap-2">{actions}</div>
        </div>
      )}
      {children}
    </section>
  );
}

export function when(at: string) {
  const d = new Date(at);
  return isNaN(+d) ? at : d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

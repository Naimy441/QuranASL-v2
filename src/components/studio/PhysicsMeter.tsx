"use client";

import { CircleCheck, TriangleAlert, CircleAlert } from "lucide-react";
import { physTone, type PhysReport } from "@/lib/studio/physics";

const cm = (m: number) => `${(m * 100).toFixed(1)} cm`;
const TONE = {
  ok: { cls: "border-ok text-ok", bar: "var(--ok)", Icon: CircleCheck, label: "Hands stay clear" },
  warn: { cls: "border-warn text-warn", bar: "var(--warn)", Icon: TriangleAlert, label: "Touching — solver settles it" },
  bad: { cls: "border-bad text-bad", bar: "var(--bad)", Icon: CircleAlert, label: "Hand goes into the body — fix the place" },
};
const level = (m: number) => (m > 0.045 ? "bad" : m > 0.02 ? "warn" : "ok");

/**
 * How physically plausible a sign is on the avatar: a strip across the sign's
 * duration coloured by how far the solver had to move a hand (green clear,
 * amber contact, red inside the body), plus the worst numbers.
 */
export default function PhysicsMeter({ report, onSeek }: { report: PhysReport | null; onSeek?: (u: number) => void }) {
  if (!report) return null;
  const tone = physTone(report);
  const T = TONE[tone];
  return (
    <div className={`rounded-2xl border-2 bg-panel p-3 ${T.cls}`} role="group" aria-label="Physical check">
      <div className="flex flex-wrap items-center gap-2 font-semibold">
        <T.Icon aria-hidden className="size-5" /> {T.label}
      </div>
      <div className="mt-2 flex h-8 overflow-hidden rounded-lg border border-line" aria-hidden>
        {report.samples.map((s, i) => (
          <button
            key={i}
            type="button"
            tabIndex={-1}
            onClick={() => onSeek?.(s.u)}
            className="h-full flex-1"
            style={{ background: TONE[level(Math.max(s.body, s.hands * 0.75))].bar, opacity: s.key ? 1 : 0.55 }}
            title={`${Math.round(s.u * 100)}% · body ${cm(s.body)} · hands ${cm(s.hands)}${s.key ? " · held" : ""}`}
          />
        ))}
      </div>
      <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-ink sm:grid-cols-4">
        <div>
          <dt className="text-xs text-ink-3">At held keys</dt>
          <dd className="font-mono tabular-nums">{cm(report.key)}</dd>
        </div>
        <div>
          <dt className="text-xs text-ink-3">While moving</dt>
          <dd className="font-mono tabular-nums">{cm(report.path)}</dd>
        </div>
        <div>
          <dt className="text-xs text-ink-3">Hand into hand</dt>
          <dd className="font-mono tabular-nums">{cm(report.hands)}</dd>
        </div>
        <div>
          <dt className="text-xs text-ink-3">Deepest (raw)</dt>
          <dd className="font-mono tabular-nums">{cm(Math.max(0, report.depth))}</dd>
        </div>
      </dl>
      {report.worstAt && tone !== "ok" && (
        <p className="mt-1 text-xs text-ink-2">
          Worst: {report.worstAt.side === "R" ? "right (dominant)" : "left"} hand at {Math.round(report.worstAt.u * 100)}% of the sign.
        </p>
      )}
    </div>
  );
}

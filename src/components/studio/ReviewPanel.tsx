"use client";

import { useEffect, useRef, useState } from "react";
import { CircleCheck, Flag, History, MessageSquare, Undo2, User } from "lucide-react";
import { effectiveStatus, type ItemState } from "@/lib/review/status";
import { getLocalReview, removeReview, setReviewer, useLocalReview } from "@/lib/review/store";
import type { ReviewStatus } from "@/lib/review/types";
import { Btn, IconBtn, StatusBadge, when } from "./ui";

/**
 * Approve / request changes for one ayah or sign, with an optional comment and the
 * full history. The decision records exactly what was on screen (`current`).
 */
export default function ReviewPanel({
  state,
  current,
  onDecide,
  what,
}: {
  state: ItemState;
  current: string;
  onDecide: (status: ReviewStatus, comment: string) => void;
  what: "ayah" | "sign";
}) {
  const local = useLocalReview();
  const [comment, setComment] = useState("");
  const [name, setName] = useState("");
  const eff = effectiveStatus(state, current);
  const needName = !local.reviewer;

  const decide = (s: ReviewStatus) => {
    onDecide(s, comment.trim());
    setComment("");
  };
  // Alt+A approve, Alt+N needs changes (with whatever comment is typed)
  const decideRef = useRef(decide);
  useEffect(() => {
    decideRef.current = decide;
  }, [decide]);
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (!e.altKey || e.ctrlKey || e.metaKey || (e.code !== "KeyA" && e.code !== "KeyN") || !getLocalReview().reviewer) return;
      if (document.querySelector("dialog[open]")) return;
      e.preventDefault();
      decideRef.current(e.code === "KeyA" ? "approved" : "needs-changes");
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  return (
    <div className="rounded-2xl border border-line bg-panel p-3 sm:p-4" aria-label={`Review this ${what}`}>
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={eff.status} size="lg" stale={eff.stale} />
        {state.latest && (
          <span className="text-sm text-ink-2">
            <User aria-hidden className="mr-1 inline size-4 align-[-2px]" />
            {state.latest.by} · {when(state.latest.at)}
          </span>
        )}
      </div>
      {state.latest?.comment && (
        <p className="mt-2 rounded-lg border-l-4 border-line-2 bg-panel-2 px-3 py-2 text-sm text-ink">
          <MessageSquare aria-hidden className="mr-1.5 inline size-4 align-[-3px] text-ink-2" />
          {state.latest.comment}
        </p>
      )}

      {needName ? (
        <form
          className="mt-3 flex flex-wrap items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim()) setReviewer(name);
          }}
        >
          <label className="flex min-w-0 flex-1 flex-col text-sm font-medium text-ink">
            Your name (shown with your reviews)
            <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className="mt-1 min-h-11 rounded-xl border-2 border-line-2 bg-panel px-3 text-base" placeholder="Name" />
          </label>
          <Btn type="submit" tone="primary" icon={User} disabled={!name.trim()}>
            Start reviewing
          </Btn>
        </form>
      ) : (
        <>
          <label className="mt-3 block text-sm font-medium text-ink" htmlFor={`comment-${what}`}>
            <MessageSquare aria-hidden className="mr-1.5 inline size-4 align-[-3px] text-ink-2" />
            Comment <span className="font-normal text-ink-2">(optional)</span>
          </label>
          <textarea
            id={`comment-${what}`}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={1}
            className="mt-1 min-h-11 w-full resize-y rounded-xl border-2 border-line-2 bg-panel px-3 py-2 text-base"
          />
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Btn tone="ok" size="lg" icon={CircleCheck} onClick={() => decide("approved")} aria-keyshortcuts="Alt+A" title="Approve (Alt+A)">
              Approve
            </Btn>
            <Btn tone="warn" size="lg" icon={Flag} onClick={() => decide("needs-changes")} aria-keyshortcuts="Alt+N" title="Needs changes (Alt+N)">
              Needs changes
            </Btn>
          </div>
          <p className="mt-1 text-xs text-ink-3">
            Reviewing as <strong className="text-ink-2">{local.reviewer}</strong> ·{" "}
            <button type="button" className="underline hover:text-ink" onClick={() => setReviewer("")}>
              change
            </button>
          </p>
        </>
      )}

      {state.history.length > 0 && (
        <details className="mt-3 border-t border-line pt-2">
          <summary className="flex min-h-11 cursor-pointer items-center gap-2 text-sm font-medium text-ink-2">
            <History aria-hidden className="size-4" /> History ({state.history.length})
          </summary>
          <ol className="mt-1 space-y-2">
            {[...state.history].reverse().map((e) => {
              const snap = e.gloss ?? e.def;
              const mine = local.events.some((x) => x.id === e.id) && !local.sent.includes(e.id);
              return (
                <li key={e.id} className="flex gap-2 rounded-lg bg-panel-2 p-2 text-sm">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={e.status} size="sm" />
                      <span className="text-ink-2">
                        {e.by} · {when(e.at)}
                      </span>
                    </div>
                    {e.comment && <p className="mt-1 text-ink">{e.comment}</p>}
                    {snap && (
                      <p className={`mt-1 break-words font-mono text-xs ${snap.trim() === current.trim() ? "text-ink-3" : "text-ink-2"}`}>
                        {snap.trim() === current.trim() ? "same as now" : snap}
                      </p>
                    )}
                  </div>
                  {mine && <IconBtn icon={Undo2} label="Withdraw this decision" tone="ghost" onClick={() => removeReview(e.id)} />}
                </li>
              );
            })}
          </ol>
        </details>
      )}
    </div>
  );
}

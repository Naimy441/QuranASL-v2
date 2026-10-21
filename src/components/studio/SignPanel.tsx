"use client";

import { useEffect, useState } from "react";
import { Camera, Code2, RotateCcw, Save, Search, SkipForward } from "lucide-react";
import { getLexicon } from "@/lib/asl/lexicon";
import type { Timeline } from "@/lib/asl/timeline";
import { physicalReport, type PhysReport } from "@/lib/studio/physics";
import type { ItemState } from "@/lib/review/status";
import type { ReviewStatus } from "@/lib/review/types";
import PhysicsMeter from "./PhysicsMeter";
import ReviewPanel from "./ReviewPanel";
import SignRecorder from "./SignRecorder";
import { Btn, Panel } from "./ui";

/** Sign mode: review a dictionary sign, fix its definition, or record it. */
export default function SignPanel({
  signId,
  def,
  setDef,
  repoDef,
  draft,
  error,
  timeline,
  uses,
  review,
  onDecide,
  onPick,
  onSave,
  onRevert,
  onNext,
  onSeek,
}: {
  signId: string;
  def: string;
  setDef: (d: string) => void;
  repoDef: string | null;
  draft: boolean;
  error: string | null;
  timeline: Timeline | null;
  uses: number;
  review: ItemState;
  onDecide: (s: ReviewStatus, comment: string) => void;
  onPick: () => void;
  onSave: () => void;
  onRevert: () => void;
  onNext: () => void;
  onSeek: (u: number) => void;
}) {
  const lex = getLexicon();
  const e = lex.get(signId);
  const [tab, setTab] = useState<"def" | "rec">("def");
  const [phys, setPhys] = useState<PhysReport | null>(null);

  // physical check of the definition being edited (debounced: it samples the whole sign)
  useEffect(() => {
    if (!timeline) return setPhys(null);
    const id = setTimeout(() => {
      try {
        setPhys(physicalReport(timeline));
      } catch {
        setPhys(null);
      }
    }, 200);
    return () => clearTimeout(id);
  }, [timeline]);

  const changed = repoDef !== null ? def.trim() !== repoDef.trim() : !!def;
  const tabCls = (on: boolean) => `inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl px-4 text-base font-semibold ${on ? "bg-brand text-brand-ink" : "text-ink-2 hover:bg-panel-2"}`;

  return (
    <section className="flex flex-col gap-3" aria-label="Sign editor">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={onPick} className="flex min-h-14 min-w-0 flex-1 items-center gap-3 rounded-2xl border-2 border-line-2 bg-panel px-4 text-left hover:border-brand" aria-label={`Sign ${signId || "none"}. Choose another sign`}>
          <Search aria-hidden className="size-5 shrink-0 text-ink-3" />
          <span className="min-w-0">
            <span className="block font-mono text-xl font-bold text-ink">{signId || "Choose a sign"}</span>
            {e && <span className="block truncate text-sm text-ink-2">{e.en?.join(", ") || "—"}</span>}
          </span>
        </button>
        <Btn tone="primary" size="lg" icon={SkipForward} onClick={onNext} title="Next sign that needs review (Alt+→)">
          Next sign
        </Btn>
      </div>
      {e && (
        <p className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-ink-2">
          <span>Confidence: <strong className={e.conf === "low" ? "text-warn" : e.conf === "high" ? "text-ok" : "text-ink"}>{e.conf ?? "med"}</strong></span>
          <span>Used {uses.toLocaleString()}× in the Qur&apos;an</span>
          <span>{e.mocap ? "Captured motion (Global Deaf Muslim)" : "Built from definition"}</span>
          {e.note && <span className="text-ink-3">{e.note}</span>}
        </p>
      )}
      {!e && signId && <p className="text-sm text-warn">New sign — not in the dictionary yet. Write a definition and save it.</p>}

      {signId && <ReviewPanel what="sign" state={review} current={def} onDecide={onDecide} />}

      <div role="tablist" aria-label="Fix the sign" className="flex gap-1 rounded-2xl border border-line bg-panel p-1">
        <button role="tab" type="button" aria-selected={tab === "def"} className={tabCls(tab === "def")} onClick={() => setTab("def")}>
          <Code2 aria-hidden className="size-5" /> Definition
        </button>
        <button role="tab" type="button" aria-selected={tab === "rec"} className={tabCls(tab === "rec")} onClick={() => setTab("rec")}>
          <Camera aria-hidden className="size-5" /> Record yourself
        </button>
      </div>

      {tab === "def" ? (
        <Panel>
          {e?.mocap && <p className="mb-2 rounded-lg bg-panel-2 p-2 text-sm text-ink-2">This sign normally plays captured motion. The avatar now shows the definition below, which is used when no capture exists.</p>}
          <label className="text-sm font-medium text-ink" htmlFor="sign-def">
            Definition (sign notation)
          </label>
          <textarea
            id="sign-def"
            value={def}
            onChange={(ev) => setDef(ev.target.value)}
            rows={4}
            spellCheck={false}
            aria-invalid={!!error}
            aria-describedby="sign-def-status"
            className={`mt-1 w-full rounded-xl border-2 bg-panel p-3 font-mono text-[15px] leading-relaxed ${error ? "border-bad" : "border-line-2"}`}
          />
          <p id="sign-def-status" role="status" className={`mt-1 text-sm font-medium ${error ? "text-bad" : "text-ok"}`}>
            {error ? `✕ ${error}` : "✓ Compiles"}
          </p>
          <div className="mt-2">{!error && <PhysicsMeter report={phys} onSeek={onSeek} />}</div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Btn tone="primary" icon={Save} onClick={onSave} disabled={!!error || !signId || (!changed && !draft)}>
              Save sign
            </Btn>
            {(draft || changed) && repoDef !== null && (
              <Btn icon={RotateCcw} onClick={onRevert}>
                Back to dictionary version
              </Btn>
            )}
          </div>
          {draft && <p className="mt-2 text-xs text-ink-3">Saved in this browser — included in your contribution bundle.</p>}
          <SignHelp />
        </Panel>
      ) : (
        <Panel>{signId ? <SignRecorder sign={signId} /> : <p className="text-ink-2">Choose a sign first.</p>}</Panel>
      )}
    </section>
  );
}

function SignHelp() {
  return (
    <details className="mt-3 rounded-xl border border-line p-3 text-sm text-ink-2">
      <summary className="min-h-8 cursor-pointer font-medium text-ink">Sign notation</summary>
      <p className="mt-2">Keyframes separated by <code>&gt;</code>; the non-dominant hand after <code>|</code>; flags after <code>;</code>.</p>
      <ul className="mt-1 list-disc space-y-1 pl-5">
        <li>Handshape: A B C D E F G H I K L M N O P Q R S T U V W X Y 1 3 4 5 6 7 8 9 10 bentB openB flatB curvedB bent5 claw5 curved5 flatO smallC bentV bentL bentH open8 ILY baby0 flatF closedX thumb</li>
        <li>Location: <code>@chin</code>, <code>@neutral:f5u3</code> (offset cm: f b u d i o), <code>@^shoulder</code> (other side), <code>@base.palm</code> (other hand)</li>
        <li>Palm / fingers: <code>p:F f:U</code> — U up, D down, F forward, B toward body, I toward midline, O outward (combine: <code>FU</code>)</li>
        <li>Contact point: <code>at:tipI</code> (palm, back, tipT, tipI, tipM, tipP, knuckles, heel, radial, ulnar)</li>
        <li>Timing: <code>d:0.3</code> move time, <code>h:0.2</code> hold. Motion: <code>~arc:u4 ~circle:F5x2 ~wiggle ~twist:30 ~shake ~tap</code></li>
        <li>Flags: <code>;sym</code> both hands mirror, <code>;alt</code> alternate, <code>;x2</code> repeat, <code>;face:browUp=.6</code></li>
        <li>Compound: <code>=NAME+ALLAH</code> joins existing signs.</li>
      </ul>
    </details>
  );
}

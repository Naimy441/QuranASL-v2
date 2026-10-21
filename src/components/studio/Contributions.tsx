"use client";

import { useRef, useState } from "react";
import { Download, GitMerge, Upload } from "lucide-react";
import { downloadBundle, importBundleFile, sendToRepo, useRecordings, type MergeReply } from "@/lib/review/client";
import { useLocalReview } from "@/lib/review/store";
import { Btn, Panel } from "./ui";

/**
 * Everything this browser has contributed, and the ways to hand it over: one
 * bundle file for the project, or (dev server) a validated write straight into
 * the repository with a dry-run diff first.
 */
export default function Contributions() {
  const local = useLocalReview();
  const recs = useRecordings();
  const file = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState("");
  const [check, setCheck] = useState<MergeReply | null>(null);
  const [busy, setBusy] = useState(false);
  const dev = process.env.NODE_ENV === "development";

  const counts = [
    [Object.keys(local.glosses).length, "ayah edits"],
    [Object.keys(local.signs).length, "sign edits"],
    [local.events.length, "decisions"],
    [recs.length, "recordings"],
  ] as const;
  const total = counts.reduce((s, [c]) => s + c, 0);
  const unsent = local.events.filter((e) => !local.sent.includes(e.id)).length;

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Panel title="Your contributions" icon={GitMerge}>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {counts.map(([c, l]) => (
          <li key={l} className="rounded-xl bg-panel-2 px-3 py-2">
            <div className="text-2xl font-semibold tabular-nums text-ink">{c}</div>
            <div className="text-xs text-ink-2">{l}</div>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-sm text-ink-2">
        {total ? (unsent ? `${unsent} decision${unsent === 1 ? "" : "s"} not sent yet. ` : "") + "Saved in this browser only — export to send them to the project." : "Nothing yet. Your edits, decisions and recordings collect here."}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Btn tone="primary" icon={Download} disabled={!total || busy} onClick={() => run(async () => setMsg(`Exported ${(await downloadBundle()).reviews.length} decisions. Send the file to the project.`))}>
          Export bundle
        </Btn>
        <Btn icon={Upload} disabled={busy} onClick={() => file.current?.click()}>
          Import bundle
        </Btn>
        <input
          ref={file}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) run(async () => {
              const b = await importBundleFile(f);
              setMsg(`Imported ${b.glosses.length} ayah edits, ${b.signs.length} sign edits, ${b.reviews.length} decisions, ${b.recordings.length} recordings from ${b.reviewer || "a reviewer"}.`);
            });
          }}
        />
        {dev && (
          <Btn icon={GitMerge} disabled={!total || busy} onClick={() => run(async () => setCheck(await sendToRepo(true)))}>
            Check for repo (dev)
          </Btn>
        )}
      </div>
      {msg && (
        <p className="mt-2 text-sm text-ink" role="status">
          {msg}
        </p>
      )}
      {check && (
        <div className="mt-3 space-y-2 rounded-xl border-2 border-line-2 p-3 text-sm">
          <p className="font-semibold text-ink">{check.summary ?? (check.ok ? "Ready" : "Problems found")}</p>
          {check.errors?.map((e) => (
            <p key={e} className="text-bad">
              ✕ {e}
            </p>
          ))}
          {check.warnings?.map((w) => (
            <p key={w} className="text-warn">
              ! {w}
            </p>
          ))}
          {check.diff && (
            <details>
              <summary className="min-h-9 cursor-pointer text-ink-2">Changes</summary>
              <pre className="mt-1 max-h-80 overflow-auto rounded-lg bg-panel-2 p-2 font-mono text-xs leading-relaxed">
                {check.diff.split("\n").map((l, i) => (
                  <span key={i} className={l.startsWith("+ ") ? "text-ok" : l.startsWith("- ") ? "text-bad" : l.startsWith("---") || l.startsWith("+++") ? "font-semibold text-ink" : "text-ink-2"}>
                    {l}
                    {"\n"}
                  </span>
                ))}
              </pre>
            </details>
          )}
          {!check.applied && check.diff && (
            <div className="flex flex-wrap gap-2">
              <Btn
                tone="ok"
                icon={GitMerge}
                disabled={busy}
                onClick={() =>
                  run(async () => {
                    const r = await sendToRepo(false);
                    setCheck(r);
                    setMsg(r.applied ? "Written to the repository. Run npx tsx scripts/build-gloss.ts to publish gloss changes." : "Nothing was written.");
                  })
                }
              >
                Write to repository{check.errors?.length ? " (skip errors)" : ""}
              </Btn>
              <Btn tone="ghost" onClick={() => setCheck(null)}>
                Close
              </Btn>
            </div>
          )}
        </div>
      )}
    </Panel>
  );
}

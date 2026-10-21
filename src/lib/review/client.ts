"use client";

import { useEffect, useState } from "react";
import { allRecordings, blobToDataURL, dataURLToBlob, meta, onRecordingsChange, saveRecording } from "./recordings";
import { normalizeBundle, bundleFileName } from "./bundle";
import { getLocalReview, importContributions, markSent } from "./store";
import { mergeEvents, normalizeShared } from "./status";
import { BUNDLE_FORMAT, BUNDLE_VERSION, type ContributionBundle, type Recording, type ReviewEvent } from "./types";

// Browser side of the contribution workflow: shared review events, bundle
// export / import, and the dev-only "write to repository" call.

let sharedP: Promise<ReviewEvent[]> | null = null;
/** Review events already merged into the repository (public/data/reviews.json). */
export function loadSharedReviews(fresh = false): Promise<ReviewEvent[]> {
  if (!sharedP || fresh)
    sharedP = fetch("/data/reviews.json", { cache: fresh ? "no-store" : "default" })
      .then((r) => (r.ok ? r.json() : {}))
      .then(normalizeShared)
      .catch(() => []);
  return sharedP;
}

/** Shared + local events, refreshed when the local store changes. */
export function useAllEvents(local: ReviewEvent[]): ReviewEvent[] {
  const [shared, setShared] = useState<ReviewEvent[]>([]);
  useEffect(() => {
    loadSharedReviews().then(setShared);
  }, []);
  return mergeEvents(shared, local);
}

export function useRecordings(sign?: string): Recording[] {
  const [list, setList] = useState<Recording[]>([]);
  useEffect(() => {
    let live = true;
    const load = () => allRecordings().then((all) => live && setList(sign ? all.filter((r) => r.sign === sign) : all));
    load();
    const off = onRecordingsChange(load);
    return () => {
      live = false;
      off();
    };
  }, [sign]);
  return list;
}

export async function buildBundle(): Promise<ContributionBundle> {
  const s = getLocalReview();
  const recs = await allRecordings();
  return {
    format: BUNDLE_FORMAT,
    version: BUNDLE_VERSION,
    exportedAt: new Date().toISOString(),
    reviewer: s.reviewer,
    glosses: Object.values(s.glosses),
    signs: Object.values(s.signs),
    reviews: s.events,
    recordings: await Promise.all(recs.map(async (r) => ({ ...meta(r), frames: r.frames, video: r.video ? await blobToDataURL(new Blob([r.video], { type: r.video.type.split(";")[0] || "video/webm" })) : undefined }))),
  };
}

export async function downloadBundle(): Promise<ContributionBundle> {
  const b = await buildBundle();
  const url = URL.createObjectURL(new Blob([JSON.stringify(b)], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = bundleFileName(b.reviewer);
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  markSent(b.reviews.map((e) => e.id));
  return b;
}

/** Load someone's bundle (or an older export) into this browser. */
export async function importBundleFile(file: File): Promise<ContributionBundle> {
  const b = normalizeBundle(JSON.parse(await file.text()));
  importContributions(b);
  for (const r of b.recordings) {
    const { video, ...rest } = r;
    await saveRecording({ ...rest, video: video ? await dataURLToBlob(video) : null });
  }
  return b;
}

export interface MergeReply {
  ok: boolean;
  applied?: boolean;
  errors?: string[];
  warnings?: string[];
  diff?: string;
  summary?: string;
}

/** Dev server only: validate (dryRun) or merge this browser's bundle into the repository. */
export async function sendToRepo(dryRun: boolean): Promise<MergeReply> {
  const bundle = await buildBundle();
  const r = await fetch("/api/studio", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "merge", dryRun, bundle }) });
  if (r.status === 403) return { ok: false, errors: ["Writing to the repository only works on the development server."] };
  const j = (await r.json().catch(() => ({ ok: false, errors: [`HTTP ${r.status}`] }))) as MergeReply;
  if (j.ok && j.applied) markSent(bundle.reviews.map((e) => e.id));
  return j;
}

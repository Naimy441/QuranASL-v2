"use client";

import { useState } from "react";
import type { HumanVideo } from "@/lib/data/human-videos";

/** Embedded human-signed reference videos (privacy-enhanced YouTube, loaded on demand). */
export default function HumanVideos({ videos }: { videos: HumanVideo[] }) {
  const [open, setOpen] = useState<string | null>(videos[0]?.id ?? null);
  if (!videos.length)
    return (
      <div className="rounded-xl border border-line bg-panel p-4 text-sm text-ink-2">
        No human-signed recording of this surah is linked yet. If you know of one by Deaf signers, please suggest it.
      </div>
    );
  return (
    <div className="space-y-3">
      <p className="text-sm text-ink-2">
        Recordings by Deaf and hearing signers, shown with permission of their public channels. <strong>BSL</strong> (British
        Sign Language) is a different language from ASL — it is included for reference.
      </p>
      <div className="flex flex-wrap gap-2">
        {videos.map((v) => (
          <button
            key={v.id}
            onClick={() => setOpen(v.id)}
            aria-pressed={open === v.id}
            className={`rounded-lg border px-3 py-1.5 text-sm ${open === v.id ? "border-brand bg-brand text-brand-ink" : "border-line bg-panel"}`}
          >
            <strong>{v.lang}</strong> · {v.source}
          </button>
        ))}
      </div>
      {open && (
        <div className="aspect-video overflow-hidden rounded-xl border border-line bg-black">
          <iframe
            key={open}
            className="h-full w-full"
            src={`https://www.youtube-nocookie.com/embed/${open}?rel=0`}
            title={videos.find((v) => v.id === open)?.title}
            allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}
    </div>
  );
}

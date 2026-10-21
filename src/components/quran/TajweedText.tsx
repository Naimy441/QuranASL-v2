"use client";

import React, { useMemo } from "react";
import { flattenAyahRuns, mergeWordRuns, TajweedRuleNames, type TajweedSegment } from "@/lib/tajweed";
import type { Word } from "@/lib/data/quran";

interface TajweedWordProps {
  segments: TajweedSegment[];
  tajweed?: boolean;
}

export const TajweedWord = React.memo(function TajweedWord({ segments, tajweed = true }: TajweedWordProps) {
  const runs = useMemo(() => mergeWordRuns(segments), [segments]);

  if (!tajweed) {
    return <>{runs.map((r) => r.t).join("")}</>;
  }

  return (
    <>
      {runs.map((r, idx) =>
        r.c ? (
          <span
            key={idx}
            className={`tj-${r.c}`}
            title={TajweedRuleNames[r.c]}
          >
            {r.t}
          </span>
        ) : (
          r.t
        )
      )}
    </>
  );
});

interface TajweedAyahProps {
  words: TajweedSegment[][] | null | undefined;
  fallbackText: string;
  tajweed?: boolean;
}

export const TajweedAyah = React.memo(function TajweedAyah({
  words,
  fallbackText,
  tajweed = true,
}: TajweedAyahProps) {
  const runs = useMemo(() => {
    if (!words || words.length === 0 || !tajweed) return null;
    return flattenAyahRuns(words);
  }, [words, tajweed]);

  if (!runs || !tajweed) {
    return <>{fallbackText}</>;
  }

  return (
    <>
      {runs.map((r, idx) =>
        r.c ? (
          <span
            key={idx}
            className={`tj-${r.c}`}
            title={TajweedRuleNames[r.c]}
          >
            {r.t}
          </span>
        ) : (
          r.t
        )
      )}
    </>
  );
});

interface InteractiveWordProps {
  word: Word;
  tajweedSegments?: TajweedSegment[];
  tajweed?: boolean;
}

export const InteractiveWord = React.memo(function InteractiveWord({
  word,
  tajweedSegments,
  tajweed = true,
}: InteractiveWordProps) {
  return (
    <span className="group/w relative inline-block cursor-default rounded-md px-1 py-0.5 transition-all duration-150 hover:bg-accent/15 hover:ring-1 hover:ring-accent/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent">
      <span className={tajweed ? "" : "transition-colors group-hover/w:text-accent"}>
        {tajweedSegments && tajweed ? (
          <TajweedWord segments={tajweedSegments} tajweed={tajweed} />
        ) : (
          word.ar
        )}
      </span>

      {/* Floating Word-by-Word Tooltip */}
      {word.en && (
        <span
          role="tooltip"
          className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 hidden group-hover/w:flex flex-col items-center whitespace-nowrap drop-shadow-xl"
          dir="ltr"
        >
          <span className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#20252b] px-3 py-1.5 text-xs font-sans font-medium text-white shadow-2xl backdrop-blur-sm">
            <span className="text-[13px] font-medium leading-none text-white">{word.en}</span>
            {word.tr && <span className="text-[11px] text-white/50 italic font-mono font-normal leading-none">({word.tr})</span>}
            <svg
              className="h-3 w-3 text-white/70 shrink-0"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                clipRule="evenodd"
              />
            </svg>
          </span>
          {/* Arrow caret pointing down to the word */}
          <span className="h-0 w-0 border-x-[5px] border-x-transparent border-t-[5px] border-t-[#20252b]" />
        </span>
      )}
    </span>
  );
});

interface InteractiveAyahProps {
  words?: Word[];
  tajweedWords?: TajweedSegment[][];
  tajweed?: boolean;
  fallbackText: string;
}

export const InteractiveAyah = React.memo(function InteractiveAyah({
  words,
  tajweedWords,
  tajweed = true,
  fallbackText,
}: InteractiveAyahProps) {
  if (!words || words.length === 0) {
    return <TajweedAyah words={tajweedWords} fallbackText={fallbackText} tajweed={tajweed} />;
  }

  return (
    <>
      {words.map((w, idx) => (
        <React.Fragment key={idx}>
          {idx > 0 && " "}
          <InteractiveWord
            word={w}
            tajweedSegments={tajweedWords?.[idx]}
            tajweed={tajweed}
          />
        </React.Fragment>
      ))}
    </>
  );
});

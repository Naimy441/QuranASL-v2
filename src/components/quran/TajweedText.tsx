"use client";

import React, { useMemo } from "react";
import { flattenAyahRuns, mergeWordRuns, TajweedRuleNames, type TajweedSegment } from "@/lib/tajweed";

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

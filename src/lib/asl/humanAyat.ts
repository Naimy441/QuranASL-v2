import type { MocapClip } from "./mocap";

/** A whole ayah signed by a Global Deaf Muslim signer, cut by its subtitles and retargeted onto the avatar. */
export interface HumanAyahClip extends MocapClip {
  video: string; // YouTube id of the source recording
  start: number; // seconds into that recording
  end: number;
  conf: number; // subtitle alignment confidence (0..1)
  /** "subtitle": cut at the ayah's own captions; "page": the video shows several ayat at once, so the cut is estimated */
  timing?: "subtitle" | "page";
}

const cache = new Map<number, Promise<Record<string, HumanAyahClip> | null>>();
/** Human ASL ayat for a surah (key "0" = the bismillah), or null when there are none. */
export function loadAslHumanAyat(surah: number): Promise<Record<string, HumanAyahClip> | null> {
  if (!cache.has(surah))
    cache.set(
      surah,
      fetch(`/data/asl/ayat/${surah}.json`)
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    );
  return cache.get(surah)!;
}

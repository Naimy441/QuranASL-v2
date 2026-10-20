import type { MocapClip } from "../asl/mocap";

/** A whole ayah signed by the Al Isharah BSL Qur'an Project, retargeted onto the avatar. */
export interface BslAyahClip extends MocapClip {
  video: string; // YouTube id of the source recording
  start: number; // seconds into that recording
  end: number;
  conf: number; // segmentation confidence
  gloss?: string; // learned signs spotted inside this ayah, in order (when available)
}

const cache = new Map<number, Promise<Record<string, BslAyahClip> | null>>();
export function loadBslAyat(surah: number): Promise<Record<string, BslAyahClip> | null> {
  if (!cache.has(surah))
    cache.set(
      surah,
      fetch(`/data/bsl/ayat/${surah}.json`)
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    );
  return cache.get(surah)!;
}

let indexP: Promise<Record<string, number[]>> | null = null;
export function loadBslIndex(): Promise<Record<string, number[]>> {
  return (indexP ??= fetch("/data/bsl/ayat/index.json").then((r) => (r.ok ? r.json() : {})).catch(() => ({})));
}

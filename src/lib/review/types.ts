// One review model for ayah glosses and dictionary signs.
//
// Every decision a reviewer makes is an append-only ReviewEvent. The status of an
// ayah or a sign is the status of its latest event (no event = "draft"), and the
// event keeps the exact gloss / definition that was approved or questioned, so a
// later edit never silently inherits an old approval.

export type ReviewStatus = "draft" | "needs-changes" | "approved";
export type ReviewKind = "ayah" | "sign";

export interface ReviewEvent {
  /** unique, stable across export / merge (dedupe key) */
  id: string;
  kind: ReviewKind;
  /** "2:255" for an ayah, the gloss id ("MERCY") for a sign */
  key: string;
  status: ReviewStatus;
  by: string;
  at: string; // ISO time
  comment?: string;
  /** the gloss (ayah) that this decision is about */
  gloss?: string;
  /** the definition (sign) that this decision is about */
  def?: string;
}

/** A gloss edited in the Studio and not yet merged into data/gloss. */
export interface GlossDraft {
  surah: number;
  ayah: number;
  gloss: string;
  /** the repository gloss the edit started from (conflict detection on merge) */
  base: string | null;
  by?: string;
  at: string;
}

/** A sign definition added or changed in the Studio. */
export interface SignDraft {
  id: string;
  def: string;
  en?: string[];
  conf?: "high" | "med" | "low";
  note?: string;
  base: string | null;
  by?: string;
  at: string;
}

/** One frame of hand tracking captured while a signer recorded a sign. */
export interface RecordedFrame {
  t: number; // seconds from the start of the recording
  hands: { label: string; score: number; image: number[][]; world: number[][] }[];
}

/**
 * A signer's own recording of a sign, proposed as the reference for it. The video
 * is retargeted offline (scripts/mocap/extract_pose.py → scripts/mocap/retarget.ts);
 * the hand landmarks come from the in-browser MediaPipe Hand Landmarker.
 */
export interface RecordingMeta {
  id: string;
  sign: string;
  by: string;
  at: string;
  comment?: string;
  mime: string;
  duration: number; // s
  width: number;
  height: number;
  /** mean hand-tracking rate (frames per second actually analysed) */
  fps: number;
  /** share of analysed frames with at least one hand found */
  handRate: number;
  /** recording was shown mirrored to the signer; landmarks are NOT mirrored */
  mirrored: boolean;
}
export interface Recording extends RecordingMeta {
  frames: RecordedFrame[];
  video: Blob | null;
}

export const BUNDLE_FORMAT = "quranasl-contributions";
export const BUNDLE_VERSION = 2;

/** The single file a reviewer sends back to the project. */
export interface ContributionBundle {
  format: typeof BUNDLE_FORMAT;
  version: typeof BUNDLE_VERSION;
  exportedAt: string;
  reviewer: string;
  glosses: GlossDraft[];
  signs: SignDraft[];
  reviews: ReviewEvent[];
  /** video inlined as a data: URL so the bundle stays one file */
  recordings: (RecordingMeta & { frames: RecordedFrame[]; video?: string })[];
}

/** public/data/reviews.json: review events merged into the repository. */
export interface SharedReviews {
  version: 2;
  updated: string;
  events: ReviewEvent[];
}

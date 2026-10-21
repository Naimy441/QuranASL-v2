// Per-browser gloss edits made in the Gloss Studio (drafts until exported / merged).
// Storage moved to src/lib/review/store.ts; this keeps the viewer's import working.
import { glossDraftsFor } from "../review/store";

export const loadOverrides = (n: number): Record<string, string> => glossDraftsFor(n);

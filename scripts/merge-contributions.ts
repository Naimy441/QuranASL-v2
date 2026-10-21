// Merge a reviewer's contribution bundle (exported from the Gloss Studio) into the repository.
//
// usage: npx tsx scripts/merge-contributions.ts <bundle.json> [more.json ...] [--write] [--force] [--quiet]
//
// Without --write this is a dry run: it validates the bundle and prints the diff it
// would apply. Validation: every gloss token must resolve to a lexicon sign (or be
// fs: fingerspelling), every sign definition must compile, edits made against a
// gloss / definition that has since changed in the repository are refused (--force
// overwrites them). With --write it updates
//   data/gloss/NNN.txt               glosses   (then run: npx tsx scripts/build-gloss.ts)
//   src/lib/asl/lexicon/*.ts         sign definitions
//   public/data/reviews.json         review history (approved / needs changes)
//   data/contrib/recordings/         proposed sign recordings + map.json for scripts/mocap/retarget.ts
import fs from "node:fs";
import { normalizeBundle } from "../src/lib/review/bundle";
import { applyMerge, planMerge, renderDiff } from "../src/lib/review/merge";
import type { ContributionBundle } from "../src/lib/review/types";

const args = process.argv.slice(2);
const flag = (f: string) => {
  const i = args.indexOf(f);
  if (i >= 0) args.splice(i, 1);
  return i >= 0;
};
const write = flag("--write"), force = flag("--force"), quiet = flag("--quiet");
if (!args.length) {
  console.error("usage: npx tsx scripts/merge-contributions.ts <bundle.json> [...] [--write] [--force]");
  process.exit(2);
}

// several bundles merge as one (later drafts of the same item win by time)
const bundles: ContributionBundle[] = [];
for (const f of args) {
  let b: ContributionBundle;
  try {
    b = normalizeBundle(JSON.parse(fs.readFileSync(f, "utf8")));
  } catch (e) {
    console.error(`${f}: ${(e as Error).message}`);
    process.exit(1);
  }
  console.log(`${f}: ${b.reviewer || "anonymous"}, exported ${b.exportedAt.slice(0, 16)} — ${b.glosses.length} glosses, ${b.signs.length} signs, ${b.reviews.length} reviews, ${b.recordings.length} recordings`);
  bundles.push(b);
}
const bundle: ContributionBundle = {
  ...bundles[0],
  glosses: bundles.flatMap((b) => b.glosses),
  signs: bundles.flatMap((b) => b.signs),
  reviews: bundles.flatMap((b) => b.reviews),
  recordings: bundles.flatMap((b) => b.recordings),
};

const plan = planMerge(bundle, { force });
if (!quiet && plan.changes.length) console.log("\n" + renderDiff(plan));
for (const w of plan.warnings) console.warn(`warning: ${w}`);
for (const e of plan.errors) console.error(`error:   ${e}`);
console.log(`\n${plan.summary}`);

if (!write) {
  console.log(plan.changes.length ? "Dry run — nothing written. Re-run with --write to apply." : "Nothing to change.");
  process.exit(plan.errors.length ? 1 : 0);
}
if (plan.errors.length) console.log("Items with errors are skipped; everything else is applied.");
applyMerge(plan);
console.log(`Wrote ${plan.changes.length} file${plan.changes.length === 1 ? "" : "s"}: ${plan.changes.map((c) => c.file).join(", ") || "—"}`);
if (plan.changes.some((c) => c.file.startsWith("data/gloss/"))) console.log("Next: npx tsx scripts/build-gloss.ts   (publishes data/gloss → public/data/gloss)");
if (plan.changes.some((c) => c.file.includes("/recordings/")))
  console.log("Recordings: python3.12 -I scripts/mocap/extract_pose.py data/pose/contrib data/contrib/recordings/*.webm data/contrib/recordings/*.mp4\n            npx tsx scripts/mocap/retarget.ts data/pose/contrib data/contrib/recordings/map.json public/data/mocap");
process.exit(plan.errors.length ? 1 : 0);

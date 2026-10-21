import { normalizeBundle } from "@/lib/review/bundle";
import { applyMerge, planMerge, renderDiff } from "@/lib/review/merge";
import { BUNDLE_FORMAT, BUNDLE_VERSION, type ContributionBundle } from "@/lib/review/types";

// Development-only: lets maintainers merge Studio contributions straight into the
// repository (data/gloss, the lexicon, public/data/reviews.json, data/contrib).
// Same validation as scripts/merge-contributions.ts. Disabled in production builds.
//
//   { action: "merge", bundle, dryRun?, force? }   validate (+ write unless dryRun)
//   { surah, ayah, gloss }                          legacy single-gloss write
export async function POST(req: Request) {
  if (process.env.NODE_ENV !== "development") return new Response("disabled", { status: 403 });
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return Response.json({ ok: false, errors: ["bad JSON"] }, { status: 400 });

  let bundle: ContributionBundle;
  try {
    if (body.action === "merge") bundle = normalizeBundle(body.bundle);
    else {
      const n = Number(body.surah), a = Number(body.ayah);
      if (!(n >= 1 && n <= 114 && a >= 1) || typeof body.gloss !== "string") return Response.json({ ok: false, errors: ["bad request"] }, { status: 400 });
      const at = new Date().toISOString();
      bundle = { format: BUNDLE_FORMAT, version: BUNDLE_VERSION, exportedAt: at, reviewer: "", glosses: [{ surah: n, ayah: a, gloss: body.gloss, base: null, at }], signs: [], reviews: [], recordings: [] };
    }
  } catch (e) {
    return Response.json({ ok: false, errors: [(e as Error).message] }, { status: 400 });
  }

  const plan = planMerge(bundle, { force: body.force === true });
  const dryRun = body.dryRun === true;
  if (!dryRun) applyMerge(plan);
  return Response.json({
    ok: plan.errors.length === 0,
    applied: !dryRun && plan.changes.length > 0,
    errors: plan.errors,
    warnings: plan.warnings,
    summary: plan.summary,
    files: plan.changes.map((c) => c.file),
    diff: renderDiff(plan),
  });
}

import fs from "node:fs/promises";
import path from "node:path";

// Development-only: lets maintainers write Studio edits straight into data/gloss/*.txt
// and data/lexicon-overrides.json. Disabled in production builds.
export async function POST(req: Request) {
  if (process.env.NODE_ENV !== "development") return new Response("disabled", { status: 403 });
  const { surah, ayah, gloss, signs } = await req.json();
  const n = Number(surah), a = Number(ayah);
  if (!(n >= 1 && n <= 114 && a >= 1) || typeof gloss !== "string" || /\n/.test(gloss)) return new Response("bad request", { status: 400 });
  const file = path.join(process.cwd(), "data/gloss", `${String(n).padStart(3, "0")}.txt`);
  let text = "";
  try {
    text = await fs.readFile(file, "utf8");
  } catch {
    text = `# ${n}\n`;
  }
  const lines = text.split("\n");
  const i = lines.findIndex((l) => l.startsWith(`${a}:`));
  if (i >= 0) lines[i] = `${a}: ${gloss}`;
  else lines.push(`${a}: ${gloss}`);
  const sorted = [...lines.filter((l) => !/^\d+:/.test(l) && l.trim()), ...lines.filter((l) => /^\d+:/.test(l)).sort((x, y) => parseInt(x) - parseInt(y))];
  await fs.writeFile(file, sorted.join("\n") + "\n");
  if (signs && typeof signs === "object") {
    await fs.writeFile(path.join(process.cwd(), "data/lexicon-overrides.json"), JSON.stringify(signs, null, 2));
  }
  return Response.json({ ok: true });
}

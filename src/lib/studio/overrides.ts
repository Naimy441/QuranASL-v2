// Per-browser gloss edits made in the Gloss Studio (drafts until exported/submitted).
const KEY = (n: number) => `qasl-gloss-${n}`;

export function loadOverrides(n: number): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(KEY(n)) ?? "{}");
  } catch {
    return {};
  }
}

export function saveOverride(n: number, ayah: number, gloss: string | null) {
  const cur = loadOverrides(n);
  if (gloss === null) delete cur[ayah];
  else cur[ayah] = gloss;
  try {
    localStorage.setItem(KEY(n), JSON.stringify(cur));
  } catch {}
}

export function allOverrides(): Record<number, Record<string, string>> {
  const out: Record<number, Record<string, string>> = {};
  for (let n = 1; n <= 114; n++) {
    const o = loadOverrides(n);
    if (Object.keys(o).length) out[n] = o;
  }
  return out;
}

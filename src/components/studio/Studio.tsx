"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PlaybackState } from "@/components/avatar/AvatarCanvas";
import { animateGloss, NMS, parseGloss, type GlossToken } from "@/lib/asl/gloss";
import { getLexicon, overrideEntries } from "@/lib/asl/lexicon";
import { validateDef } from "@/lib/asl/dsl";
import { loadGloss, loadSurah, loadSurahList, type GlossFile, type Surah, type SurahMeta } from "@/lib/data/quran";
import { allOverrides, loadOverrides, saveOverride } from "@/lib/studio/overrides";
import { loadSignOverrides, saveSignOverride, loadReviews, saveReview } from "@/lib/studio/signOverrides";
import GlossStrip from "@/components/viewer/GlossStrip";

const AvatarCanvas = dynamic(() => import("@/components/avatar/AvatarCanvas"), { ssr: false });

type Chip = Pick<GlossToken, "kind" | "gloss" | "locus" | "repeat" | "tags"> & { key: number; raw?: string };
const TAGS = Object.keys(NMS);
const LOCI = ["", "a", "b", "c", "up"];
let keySeq = 1;

function toChips(src: string): Chip[] {
  return parseGloss(src).map((t) => ({ key: keySeq++, kind: t.kind, gloss: t.kind === "pause" ? t.raw : t.gloss, locus: t.locus, repeat: t.repeat, tags: [...t.tags] }));
}

function chipText(c: Chip) {
  if (c.kind === "pause") return c.gloss;
  if (c.kind === "fs") return "fs:" + c.gloss;
  return c.gloss + (c.locus ? ":" + c.locus : "") + (c.repeat ? "+" : "");
}

/** Serialise chips back to gloss notation, grouping runs that share facial grammar. */
function toGloss(chips: Chip[]): string {
  const out: string[] = [];
  let i = 0;
  while (i < chips.length) {
    const key = chips[i].tags.join(" ");
    let j = i;
    while (j < chips.length && chips[j].tags.join(" ") === key) j++;
    // trailing pauses stay outside the bracket
    let k = j;
    while (k > i && chips[k - 1].kind === "pause" && key) k--;
    const body = chips.slice(i, k).map(chipText).join(" ");
    if (key && body) out.push(`[${[...new Set(chips[i].tags)].join(" ")}: ${body}]`);
    else if (body) out.push(body);
    out.push(...chips.slice(k, j).map(chipText));
    i = j;
  }
  return out.join(" ").replace(/\s+([,.?!])/g, " $1");
}

export default function Studio() {
  const [list, setList] = useState<SurahMeta[]>([]);
  const [n, setN] = useState(1);
  const [ayah, setAyah] = useState(1);
  const [surah, setSurah] = useState<Surah | null>(null);
  const [gfile, setGfile] = useState<GlossFile | null>(null);
  const [chips, setChips] = useState<Chip[]>([]);
  const [text, setText] = useState("");
  const [sel, setSel] = useState<number | null>(null);
  const [dirty, setDirty] = useState(false);
  const [tab, setTab] = useState<"gloss" | "sign">("gloss");
  const [signId, setSignId] = useState("");
  const [signDef, setSignDef] = useState("");
  const [reviewer, setReviewer] = useState("");
  const [msg, setMsg] = useState("");
  const [time, setTime] = useState(0);
  const [lexVer, setLexVer] = useState(0);
  const pb = useRef<PlaybackState>({ time: 0, playing: false, rate: 0.85, loop: false });
  const dragFrom = useRef<number | null>(null);

  // initial selection from the URL, sign overrides from storage
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (q.get("surah")) setN(+q.get("surah")!);
    if (q.get("ayah")) setAyah(+q.get("ayah")!);
    if (q.get("sign")) {
      setTab("sign");
      setSignId(q.get("sign")!);
    }
    overrideEntries(Object.values(loadSignOverrides()));
    setLexVer((v) => v + 1);
    loadSurahList().then(setList);
    try {
      setReviewer(localStorage.getItem("qasl-reviewer") ?? "");
    } catch {}
  }, []);

  useEffect(() => {
    Promise.all([loadSurah(n), loadGloss(n)]).then(([s, g]) => {
      setSurah(s);
      setGfile(g);
    });
  }, [n]);

  const original = gfile?.ayat[ayah];
  useEffect(() => {
    if (!gfile) return;
    const ov = loadOverrides(n)[ayah];
    const src = ov ?? gfile.ayat[ayah]?.gloss ?? "";
    setChips(toChips(src));
    setText(src);
    setDirty(false);
    setSel(null);
  }, [gfile, n, ayah]);

  const gloss = useMemo(() => toGloss(chips), [chips]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const anim = useMemo(() => (gloss ? animateGloss(gloss) : null), [gloss, lexVer]);
  useEffect(() => {
    pb.current.time = 0;
    pb.current.playing = true;
  }, [anim]);

  const update = (next: Chip[]) => {
    setChips(next);
    setText(toGloss(next));
    setDirty(true);
  };
  const patch = (i: number, p: Partial<Chip>) => update(chips.map((c, k) => (k === i ? { ...c, ...p } : c)));
  const move = (from: number, to: number) => {
    if (to < 0 || to >= chips.length || from === to) return;
    const next = [...chips];
    const [c] = next.splice(from, 1);
    next.splice(to, 0, c);
    update(next);
    setSel(to);
  };

  const lex = getLexicon();
  const allIds = useMemo(() => [...lex.entries.keys()].sort(), [lex, lexVer]);
  const a = surah?.ayat[ayah - 1];
  const reviews = loadReviews();
  const reviewKey = `${n}:${ayah}`;

  const save = () => {
    saveOverride(n, ayah, gloss);
    setDirty(false);
    setMsg("Saved in this browser. Export to share with the project.");
  };
  const revert = () => {
    saveOverride(n, ayah, null);
    const src = gfile?.ayat[ayah]?.gloss ?? "";
    setChips(toChips(src));
    setText(src);
    setDirty(false);
  };
  const exportAll = () => {
    const data = { exportedAt: new Date().toISOString(), reviewer, glosses: allOverrides(), signs: loadSignOverrides(), reviews: loadReviews() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const el = document.createElement("a");
    el.href = url;
    el.download = `quranasl-contributions-${Date.now()}.json`;
    el.click();
    URL.revokeObjectURL(url);
  };
  const saveToRepo = async () => {
    const r = await fetch("/api/studio", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ surah: n, ayah, gloss, signs: loadSignOverrides() }) });
    setMsg(r.ok ? "Written to data/gloss — rebuild to publish." : `Repo save unavailable (${r.status}).`);
  };
  const markReviewed = () => {
    if (!reviewer.trim()) {
      setMsg("Enter your name to sign off a review.");
      return;
    }
    try {
      localStorage.setItem("qasl-reviewer", reviewer);
    } catch {}
    saveReview(reviewKey, { by: reviewer, at: new Date().toISOString(), gloss });
    setMsg(`Marked ${reviewKey} as reviewed by ${reviewer}.`);
  };

  // ---- sign editor ----
  useEffect(() => {
    if (!signId) return;
    const e = lex.get(signId);
    setSignDef(e?.def ?? "");
  }, [signId, lex, lexVer]);
  const signErr = signDef ? (signDef.startsWith("=") ? null : validateDef(signDef)) : "empty";
  const signAnim = useMemo(() => {
    if (tab !== "sign" || !signId || signErr) return null;
    const tmp = getLexicon();
    const prev = tmp.get(signId);
    tmp.add({ ...(prev ?? { id: signId, en: [] }), id: signId, def: signDef });
    try {
      return animateGloss(signId);
    } catch {
      return null;
    } finally {
      if (prev) tmp.add(prev);
    }
  }, [tab, signId, signDef, signErr]);
  const saveSign = () => {
    const prev = lex.get(signId);
    const entry = { ...(prev ?? { id: signId, en: [], conf: "low" as const }), id: signId, def: signDef, src: `studio:${reviewer || "anon"}` };
    saveSignOverride(entry);
    overrideEntries([entry]);
    setLexVer((v) => v + 1);
    setMsg(`Sign ${signId} saved in this browser.`);
  };

  const shown = tab === "sign" ? signAnim : anim;
  const activeTok = useMemo(() => {
    const it = shown?.timeline.items.find((x) => time >= x.start && time <= x.end && x.kind !== "pause");
    return it?.index ?? -1;
  }, [shown, time]);

  const replay = useCallback(() => {
    pb.current.time = 0;
    pb.current.playing = true;
  }, []);

  return (
    <div className="mx-auto grid w-full max-w-7xl gap-4 px-4 py-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="mr-auto text-2xl font-semibold">Gloss Studio</h1>
          <div role="tablist" className="flex rounded-lg border border-line bg-panel p-0.5 text-sm">
            {(["gloss", "sign"] as const).map((t) => (
              <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`rounded-md px-3 py-1.5 ${tab === t ? "bg-brand text-brand-ink" : "text-ink-2"}`}>
                {t === "gloss" ? "Ayah gloss" : "Sign editor"}
              </button>
            ))}
          </div>
        </div>
        <div className="stage relative aspect-[4/3.3] overflow-hidden rounded-2xl border border-line">
          <AvatarCanvas className="absolute inset-0" timeline={shown?.timeline ?? null} playback={pb} onTime={setTime} />
          <button onClick={replay} className="absolute bottom-3 right-3 rounded-lg bg-brand px-3 py-1.5 text-sm text-brand-ink">Replay</button>
        </div>
        {shown && <GlossStrip tokens={shown.tokens} items={shown.timeline.items} active={activeTok} onSeek={(t) => { pb.current.time = t; pb.current.playing = true; }} />}
        <p className="text-xs text-ink-2">Edits update the animation instantly — no re-filming needed. Speed:
          <input type="range" min={0.25} max={1.5} step={0.05} defaultValue={0.85} onChange={(e) => (pb.current.rate = +e.target.value)} className="ml-2 align-middle" />
        </p>
      </section>

      {tab === "gloss" ? (
        <section className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <select aria-label="Surah" value={n} onChange={(e) => { setN(+e.target.value); setAyah(1); }} className="rounded-md border border-line bg-panel px-2 py-1.5">
              {list.map((s) => (
                <option key={s.n} value={s.n}>{s.n}. {s.name}</option>
              ))}
            </select>
            <button onClick={() => setAyah((x) => Math.max(1, x - 1))} className="rounded-md border border-line px-2 py-1.5" aria-label="Previous ayah">←</button>
            <label className="text-sm">Ayah <input type="number" min={1} max={surah?.ayahs ?? 1} value={ayah} onChange={(e) => setAyah(Math.max(1, Math.min(surah?.ayahs ?? 1, +e.target.value)))} className="w-16 rounded-md border border-line bg-panel px-2 py-1" /></label>
            <button onClick={() => setAyah((x) => Math.min(surah?.ayahs ?? 1, x + 1))} className="rounded-md border border-line px-2 py-1.5" aria-label="Next ayah">→</button>
            <span className={`ml-auto rounded px-2 py-0.5 text-xs ${original?.source === "curated" ? "bg-ok/15 text-ok" : "bg-accent/15 text-accent"}`}>
              base: {original?.source ?? "none"}{reviews[reviewKey] ? ` · reviewed by ${reviews[reviewKey].by}` : ""}
            </span>
          </div>
          {a && (
            <div className="rounded-xl border border-line bg-panel p-3">
              <p className="arabic text-right text-2xl" lang="ar">{a.ar}</p>
              <p className="mt-1 text-sm">{a.en}</p>
              <details className="mt-1 text-xs text-ink-2">
                <summary className="cursor-pointer">Word by word</summary>
                <div className="arabic mt-1 flex flex-wrap gap-2" dir="rtl">
                  {a.w.map((w, k) => (
                    <span key={k} className="inline-flex flex-col items-center rounded bg-panel-2 px-1.5">
                      <span className="text-base" lang="ar">{w.ar}</span>
                      <span dir="ltr" className="font-sans">{w.en}</span>
                      {w.root && <span className="text-accent">{w.root}</span>}
                    </span>
                  ))}
                </div>
              </details>
            </div>
          )}

          {/* chip timeline */}
          <div className="rounded-xl border border-line bg-panel p-3">
            <div className="mb-2 flex items-center gap-2 text-sm">
              <strong>Timeline</strong>
              <span className="text-ink-2">drag chips to reorder · click to edit</span>
              <button className="ml-auto rounded-md border border-line px-2 py-0.5" onClick={() => { update([...chips, { key: keySeq++, kind: "sign", gloss: "ALLAH", tags: [] }]); setSel(chips.length); }}>+ Sign</button>
              <button className="rounded-md border border-line px-2 py-0.5" onClick={() => update([...chips, { key: keySeq++, kind: "pause", gloss: ",", tags: [] }])}>+ Pause</button>
            </div>
            <ol className="flex flex-wrap gap-1.5">
              {chips.map((c, i) => {
                const known = c.kind !== "sign" || lex.has(c.gloss) || c.gloss.split("+").every((p) => lex.has(p));
                return (
                  <li
                    key={c.key}
                    draggable
                    onDragStart={() => (dragFrom.current = i)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => dragFrom.current !== null && move(dragFrom.current, i)}
                  >
                    <button
                      onClick={() => setSel(i === sel ? null : i)}
                      onKeyDown={(e) => {
                        if (e.altKey && e.key === "ArrowLeft") move(i, i - 1);
                        if (e.altKey && e.key === "ArrowRight") move(i, i + 1);
                      }}
                      className={`rounded-md border px-2 py-1 font-mono text-xs ${sel === i ? "border-brand ring-2 ring-brand" : known ? "border-line" : "border-warn text-warn"} ${c.tags.length ? "bg-accent/10" : "bg-panel-2"}`}
                      title={c.tags.length ? c.tags.join(", ") : undefined}
                    >
                      {chipText(c)}
                      {c.tags.length > 0 && <sup className="ml-0.5 text-accent">{c.tags.join("+")}</sup>}
                    </button>
                  </li>
                );
              })}
            </ol>
            {sel !== null && chips[sel] && (
              <ChipEditor
                chip={chips[sel]}
                ids={allIds}
                onChange={(p) => patch(sel, p)}
                onDelete={() => { update(chips.filter((_, k) => k !== sel)); setSel(null); }}
                onMove={(d) => move(sel, sel + d)}
                onEditSign={(id) => { setSignId(id); setTab("sign"); }}
              />
            )}
          </div>

          <label className="text-sm">
            Gloss text
            <textarea
              value={text}
              onChange={(e) => { setText(e.target.value); setChips(toChips(e.target.value)); setDirty(true); }}
              rows={3}
              className="mt-1 w-full rounded-lg border border-line bg-panel p-2 font-mono text-sm"
              spellCheck={false}
            />
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={save} disabled={!dirty} className="rounded-lg bg-brand px-3 py-1.5 text-brand-ink disabled:opacity-50">Save edit</button>
            <button onClick={revert} className="rounded-lg border border-line px-3 py-1.5">Revert to base</button>
            <button onClick={exportAll} className="rounded-lg border border-line px-3 py-1.5">Export contributions</button>
            {process.env.NODE_ENV === "development" && <button onClick={saveToRepo} className="rounded-lg border border-line px-3 py-1.5">Write to repo (dev)</button>}
          </div>
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-panel p-3 text-sm">
            <label>Reviewer <input value={reviewer} onChange={(e) => setReviewer(e.target.value)} className="ml-1 rounded-md border border-line bg-panel px-2 py-1" placeholder="Your name" /></label>
            <button onClick={markReviewed} className="rounded-lg border border-ok px-3 py-1.5 text-ok">Sign off this ayah</button>
          </div>
          {msg && <p className="text-sm text-ink-2" role="status">{msg}</p>}
          <NotationHelp />
        </section>
      ) : (
        <section className="flex flex-col gap-3">
          <label className="text-sm">
            Sign
            <input list="sign-ids" value={signId} onChange={(e) => setSignId(e.target.value.toUpperCase())} className="ml-2 rounded-md border border-line bg-panel px-2 py-1 font-mono" />
            <datalist id="sign-ids">{allIds.map((x) => <option key={x} value={x} />)}</datalist>
          </label>
          {lex.get(signId) && (
            <p className="text-sm text-ink-2">
              English: {lex.get(signId)!.en?.join(", ")} · confidence: {lex.get(signId)!.conf} {lex.get(signId)!.note ? `· ${lex.get(signId)!.note}` : ""}
            </p>
          )}
          <label className="text-sm">
            Definition (parametric sign notation)
            <textarea value={signDef} onChange={(e) => setSignDef(e.target.value)} rows={5} spellCheck={false} className="mt-1 w-full rounded-lg border border-line bg-panel p-2 font-mono text-sm" />
          </label>
          <p className={`text-sm ${signErr ? "text-bad" : "text-ok"}`}>{signErr ? `⚠ ${signErr}` : "✓ valid"}</p>
          <div className="flex gap-2">
            <button onClick={saveSign} disabled={!!signErr || !signId} className="rounded-lg bg-brand px-3 py-1.5 text-brand-ink disabled:opacity-50">Save sign</button>
            <button onClick={replay} className="rounded-lg border border-line px-3 py-1.5">Replay</button>
          </div>
          {msg && <p className="text-sm text-ink-2" role="status">{msg}</p>}
          <SignHelp />
        </section>
      )}
    </div>
  );
}

function ChipEditor({ chip, ids, onChange, onDelete, onMove, onEditSign }: {
  chip: Chip; ids: string[]; onChange: (p: Partial<Chip>) => void; onDelete: () => void; onMove: (d: number) => void; onEditSign: (id: string) => void;
}) {
  const lex = getLexicon();
  const variants = chip.kind === "sign" ? lex.variants(chip.gloss) : [];
  return (
    <div className="mt-3 grid gap-2 rounded-lg border border-line bg-panel-2 p-3 text-sm sm:grid-cols-2">
      {chip.kind !== "pause" ? (
        <label>
          {chip.kind === "fs" ? "Fingerspelled word" : "Sign"}
          <input
            list="chip-ids"
            value={chip.gloss}
            onChange={(e) => onChange({ gloss: e.target.value.toUpperCase() })}
            className="mt-0.5 w-full rounded-md border border-line bg-panel px-2 py-1 font-mono"
          />
          <datalist id="chip-ids">{ids.map((x) => <option key={x} value={x} />)}</datalist>
        </label>
      ) : (
        <label>
          Pause
          <select value={chip.gloss} onChange={(e) => onChange({ gloss: e.target.value })} className="mt-0.5 w-full rounded-md border border-line bg-panel px-2 py-1">
            <option value=",">short ,</option>
            <option value=".">sentence .</option>
            <option value="?">question ?</option>
          </select>
        </label>
      )}
      {chip.kind !== "pause" && (
        <div className="flex items-end gap-2">
          <label className="flex-1">
            Type
            <select value={chip.kind} onChange={(e) => onChange({ kind: e.target.value as Chip["kind"] })} className="mt-0.5 w-full rounded-md border border-line bg-panel px-2 py-1">
              <option value="sign">sign</option>
              <option value="fs">fingerspell</option>
            </select>
          </label>
          <label className="flex-1">
            Locus
            <select value={chip.locus ?? ""} onChange={(e) => onChange({ locus: e.target.value || undefined })} className="mt-0.5 w-full rounded-md border border-line bg-panel px-2 py-1">
              {LOCI.map((l) => <option key={l} value={l}>{l || "—"}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-1 pb-1.5">
            <input type="checkbox" checked={!!chip.repeat} onChange={(e) => onChange({ repeat: e.target.checked })} /> repeat
          </label>
        </div>
      )}
      {variants.length > 1 && (
        <div className="sm:col-span-2">
          Variants:{" "}
          {variants.map((v) => (
            <button key={v.id} onClick={() => onChange({ gloss: v.id })} className={`mr-1 rounded border px-1.5 font-mono text-xs ${v.id === chip.gloss ? "border-brand" : "border-line"}`}>{v.id}</button>
          ))}
        </div>
      )}
      <fieldset className="sm:col-span-2">
        <legend>Facial grammar / non-manual signals</legend>
        <div className="mt-1 flex flex-wrap gap-1">
          {TAGS.map((t) => {
            const on = chip.tags.includes(t);
            return (
              <button key={t} onClick={() => onChange({ tags: on ? chip.tags.filter((x) => x !== t) : [...chip.tags, t] })} aria-pressed={on} className={`rounded border px-1.5 py-0.5 font-mono text-xs ${on ? "border-accent bg-accent/20" : "border-line"}`}>
                {t}
              </button>
            );
          })}
        </div>
      </fieldset>
      <div className="flex gap-2 sm:col-span-2">
        <button onClick={() => onMove(-1)} className="rounded border border-line px-2 py-0.5">← Move</button>
        <button onClick={() => onMove(1)} className="rounded border border-line px-2 py-0.5">Move →</button>
        {chip.kind === "sign" && <button onClick={() => onEditSign(chip.gloss.split("+")[0])} className="rounded border border-line px-2 py-0.5">Edit this sign</button>}
        <button onClick={onDelete} className="ml-auto rounded border border-bad px-2 py-0.5 text-bad">Delete</button>
      </div>
    </div>
  );
}

function NotationHelp() {
  return (
    <details className="rounded-xl border border-line bg-panel p-3 text-sm text-ink-2">
      <summary className="cursor-pointer text-ink">Gloss notation</summary>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        <li><code>ALLAH MERCY</code> — signs from the dictionary (variants: <code>ALLAH.2</code>)</li>
        <li><code>fs:MUSA</code> — fingerspelling</li>
        <li><code>HOUSE:a</code> — place the sign at locus a (signer&apos;s right), b (left), c (centre), up</li>
        <li><code>WORK+</code> — repeat; <code>DAY+JUDGE</code> — compound</li>
        <li><code>[top: NAME ALLAH]</code> — facial grammar over a span. Tags: {Object.keys(NMS).join(", ")}</li>
        <li><code>,</code> short pause · <code>.</code> sentence end · <code>?</code> question · <code>(note)</code> ignored</li>
      </ul>
    </details>
  );
}

function SignHelp() {
  return (
    <details open className="rounded-xl border border-line bg-panel p-3 text-sm text-ink-2">
      <summary className="cursor-pointer text-ink">Sign notation</summary>
      <p className="mt-2">Keyframes separated by <code>&gt;</code>; the non-dominant hand after <code>|</code>; flags after <code>;</code>.</p>
      <ul className="mt-1 list-disc space-y-1 pl-5">
        <li>Handshape: A B C D E F G H I K L M N O P Q R S T U V W X Y 1 3 4 5 6 7 8 9 10 bentB openB flatB curvedB bent5 claw5 curved5 flatO smallC bentV bentL bentH open8 ILY baby0 flatF closedX thumb</li>
        <li>Location: <code>@chin</code>, <code>@neutral:f5u3</code> (offset cm: f b u d i o), <code>@^shoulder</code> (other side), <code>@base.palm</code> (other hand)</li>
        <li>Palm / fingers: <code>p:F f:U</code> — U up, D down, F forward, B toward body, I toward midline, O outward (combine: <code>FU</code>)</li>
        <li>Contact point: <code>at:tipI</code> (palm, back, tipT, tipI, tipM, tipP, knuckles, heel, radial, ulnar)</li>
        <li>Timing: <code>d:0.3</code> move time, <code>h:0.2</code> hold. Motion: <code>~arc:u4 ~circle:F5x2 ~wiggle ~twist:30 ~shake ~tap</code></li>
        <li>Flags: <code>;sym</code> both hands mirror, <code>;alt</code> alternate, <code>;x2</code> repeat, <code>;face:browUp=.6</code></li>
      </ul>
    </details>
  );
}

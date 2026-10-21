"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, ChevronLeft, ChevronRight, Hand, Keyboard, ListChecks, Pause, Play, Plus, Redo2, RotateCcw, SkipForward, Type, Undo2, Video } from "lucide-react";
import type { PlaybackState } from "@/components/avatar/AvatarCanvas";
import HumanVideos from "@/components/viewer/HumanVideos";
import { animateGloss } from "@/lib/asl/gloss";
import { compileSign } from "@/lib/asl/dsl";
import { getLexicon, Lexicon, overrideEntries } from "@/lib/asl/lexicon";
import { buildTimeline, type Timeline } from "@/lib/asl/timeline";
import type { SignEntry } from "@/lib/asl/types";
import { validateDef } from "@/lib/asl/dsl";
import { loadBslAyat, type BslAyahClip } from "@/lib/bsl/ayat";
import { loadGloss, loadSurah, loadSurahList, type GlossFile, type Surah, type SurahMeta } from "@/lib/data/quran";
import { humanVideos } from "@/lib/data/human-videos";
import { useMocapReady } from "@/lib/hooks/useMocap";
import { useAllEvents } from "@/lib/review/client";
import { ayahKey, ReviewIndex } from "@/lib/review/status";
import { addReview, dropGlossDraft, dropSignDraft, getLocalReview, saveGlossDraft, saveSignDraft, useLocalReview } from "@/lib/review/store";
import type { ReviewStatus } from "@/lib/review/types";
import { loadSignOverrides } from "@/lib/studio/signOverrides";
import ChipEditor from "./ChipEditor";
import ChipTimeline from "./ChipTimeline";
import { newKey, toChips, toGloss, useChipHistory, type Chip } from "./chips";
import Contributions from "./Contributions";
import ReviewPanel from "./ReviewPanel";
import SignPanel from "./SignPanel";
import SignPicker from "./SignPicker";
import { Btn, IconBtn, Panel } from "./ui";

const AvatarCanvas = dynamic(() => import("@/components/avatar/AvatarCanvas"), { ssr: false });

interface QueueItem { s: number; a: number; flags: string[] }
interface SignRow { id: string; uses: number; key: number; path: number; conf?: string }
type PickFor = { mode: "replace" | "before" | "after" | "append" | "sign"; at: number };

/** Dictionary entries as the repository has them, before this browser's drafts are applied. */
const originals = new Map<string, SignEntry | null>();
function applyDrafts() {
  const lex = getLexicon();
  const drafts = Object.values(loadSignOverrides());
  for (const d of drafts) if (!originals.has(d.id)) originals.set(d.id, lex.get(d.id) ?? null);
  overrideEntries(drafts);
}

const jsonP = new Map<string, Promise<unknown>>();
function getJSON<T>(u: string, d: T): Promise<T> {
  if (!jsonP.has(u)) jsonP.set(u, fetch(u).then((r) => (r.ok ? r.json() : d)).catch(() => d));
  return jsonP.get(u) as Promise<T>;
}

/** Where to start, from the address (this component only renders in the browser). */
function fromUrl() {
  const q = new URLSearchParams(window.location.search);
  const sign = q.get("sign")?.toUpperCase() ?? "";
  return {
    mode: (sign ? "sign" : "ayah") as "ayah" | "sign",
    n: Math.max(1, Math.min(114, +(q.get("surah") ?? 1) || 1)),
    ayah: Math.max(1, +(q.get("ayah") ?? 1) || 1),
    sign,
    queue: { flag: q.get("flag") ?? undefined, surah: q.get("qs") ? +q.get("qs")! : undefined },
  };
}

export default function Studio() {
  const [init] = useState(fromUrl);
  const local = useLocalReview();
  const events = useAllEvents(local.events);
  const index = useMemo(() => new ReviewIndex(events), [events]);
  const mocapReady = useMocapReady();

  const [mode, setMode] = useState<"ayah" | "sign">(init.mode);
  const [list, setList] = useState<SurahMeta[]>([]);
  const [n, setN] = useState(init.n);
  const [ayah, setAyah] = useState(init.ayah);
  const [surah, setSurah] = useState<Surah | null>(null);
  const [gfile, setGfile] = useState<GlossFile | null>(null);
  const [bsl, setBsl] = useState<Record<string, BslAyahClip> | null>(null);
  const hist = useChipHistory();
  const { chips } = hist;
  const [sel, setSel] = useState<number | null>(null);
  const [showText, setShowText] = useState(false);
  const [text, setText] = useState("");
  const [picker, setPicker] = useState<PickFor | null>(null);
  const [signId, setSignId] = useState(init.sign);
  const [signDef, setSignDef] = useState("");
  const [lexVer, setLexVer] = useState(0);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [rate, setRate] = useState(0.85);
  const [msg, setMsg] = useState("");
  const queueFilter = init.queue;
  const pb = useRef<PlaybackState>({ time: 0, playing: true, rate: 0.85, loop: false });
  const loadedKey = useRef("");

  useEffect(() => {
    applyDrafts();
    setLexVer((v) => v + 1);
    loadSurahList().then(setList);
  }, []);

  // keep the address bar in step so a link or reload returns here
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    for (const k of ["surah", "ayah", "sign"]) q.delete(k);
    if (mode === "sign" && signId) q.set("sign", signId);
    else {
      q.set("surah", String(n));
      q.set("ayah", String(ayah));
    }
    window.history.replaceState(null, "", `${window.location.pathname}?${q}`);
  }, [mode, n, ayah, signId]);

  useEffect(() => {
    let live = true;
    Promise.all([loadSurah(n), loadGloss(n)]).then(([s, g]) => {
      if (!live) return;
      setSurah(s);
      setGfile(g);
    });
    loadBslAyat(n).then((b) => live && setBsl(b));
    return () => {
      live = false;
    };
  }, [n]);

  // ---- ayah gloss ----
  const base = gfile?.ayat[ayah]?.gloss ?? "";
  const key = ayahKey(n, ayah);
  const draft = local.glosses[key];
  useEffect(() => {
    if (!gfile || gfile.surah !== n) return;
    if (loadedKey.current === key) return;
    loadedKey.current = key;
    // a draft that now matches the published gloss has been merged
    const canon = toGloss(toChips(base));
    if (draft && (draft.gloss.trim() === base.trim() || draft.gloss === canon)) dropGlossDraft(n, ayah);
    const src = draft && draft.gloss.trim() !== base.trim() && draft.gloss !== canon ? draft.gloss : base;
    hist.reset(toChips(src));
    setText(src);
    setSel(null);
  }, [gfile, n, ayah, key, base, draft, hist]);

  const gloss = useMemo(() => toGloss(chips), [chips]);
  // the published gloss as the chip editor writes it (spacing / bracket grouping normalised)
  const baseCanon = useMemo(() => toGloss(toChips(base)), [base]);
  const edited = gloss !== baseCanon;
  const fromText = useRef(false);
  const commit = useCallback((next: Chip[], coalesce?: string) => hist.set(next, coalesce), [hist]);
  // every change (edit, undo, redo) is kept as this browser's draft of the ayah
  useEffect(() => {
    if (loadedKey.current !== key || !gfile) return;
    if (!fromText.current) setText(gloss);
    fromText.current = false;
    const d = getLocalReview().glosses[key];
    if (gloss === baseCanon) d && dropGlossDraft(n, ayah);
    else if (d?.gloss !== gloss) saveGlossDraft(n, ayah, gloss, base);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gloss]);

  const move = (from: number, to: number) => {
    if (to < 0 || to >= chips.length || from === to) return;
    const next = [...chips];
    const [c] = next.splice(from, 1);
    next.splice(to, 0, c);
    commit(next);
    setSel(to);
  };
  const patch = (i: number, p: Partial<Chip>) => commit(chips.map((c, k) => (k === i ? { ...c, ...p } : c)));
  const del = (i: number) => {
    commit(chips.filter((_, k) => k !== i));
    setSel(null);
  };
  const onPicked = (r: { kind: "sign" | "fs"; gloss: string }) => {
    const p = picker;
    setPicker(null);
    if (!p) return;
    if (p.mode === "sign") {
      setSignId(r.gloss);
      return;
    }
    const chip: Chip = { key: newKey(), kind: r.kind, gloss: r.gloss, tags: p.mode === "append" ? [] : [...(chips[p.at]?.tags ?? [])] };
    if (p.mode === "replace") {
      patch(p.at, { kind: r.kind, gloss: r.gloss });
      return;
    }
    // "Add sign" goes before a closing . or ?
    const end = chips.length && chips[chips.length - 1].kind === "pause" && chips[chips.length - 1].gloss !== "," ? chips.length - 1 : chips.length;
    const at = p.mode === "before" ? p.at : p.mode === "after" ? p.at + 1 : end;
    const next = [...chips];
    next.splice(at, 0, chip);
    commit(next);
    setSel(at);
  };

  // ---- sign editor ----
  const lex = getLexicon();
  const repoDef = signId ? (local.signs[signId]?.base ?? (originals.has(signId) ? (originals.get(signId)?.def ?? null) : (lex.get(signId)?.def ?? null))) : null;
  useEffect(() => {
    if (!signId) return;
    setSignDef(local.signs[signId]?.def ?? lex.get(signId)?.def ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signId]);
  const signErr = useMemo(() => {
    if (!signDef.trim()) return "Write a definition";
    if (signDef.startsWith("=")) {
      const bad = signDef.slice(1).split("+").map((p) => p.trim()).filter((p) => !p || (!p.startsWith("fs:") && !lex.has(p)));
      return bad.length ? `Unknown sign${bad.length > 1 ? "s" : ""} in compound: ${bad.join(", ")}` : null;
    }
    return validateDef(signDef);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signDef, lexVer]);
  const signTimeline = useMemo<Timeline | null>(() => {
    if (mode !== "sign" || !signId || signErr) return null;
    try {
      const sign = signDef.startsWith("=")
        ? (() => {
            const tmp = new Lexicon([...lex.entries.values()], lex.lang, lex.spell);
            tmp.add({ id: signId, def: signDef, en: [] });
            return tmp.compile(signId);
          })()
        : compileSign(signId, signDef);
      return buildTimeline([{ index: 0, label: signId, kind: "sign", sign }]);
    } catch {
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, signId, signDef, signErr, lexVer, mocapReady]);

  const saveSign = () => {
    const cur = lex.get(signId);
    if (!originals.has(signId)) originals.set(signId, cur ?? null);
    const orig = originals.get(signId);
    saveSignDraft({ id: signId, def: signDef, en: cur?.en, conf: cur?.conf ?? "low", note: cur?.note, base: orig?.def ?? null });
    overrideEntries([{ ...(cur ?? { id: signId, en: [], conf: "low" as const }), id: signId, def: signDef }]);
    setLexVer((v) => v + 1);
    setMsg(`Sign ${signId} saved in this browser.`);
  };
  const revertSign = () => {
    dropSignDraft(signId);
    const orig = originals.get(signId);
    if (orig) overrideEntries([orig]);
    else if (orig === null) lex.entries.delete(signId);
    setSignDef(orig?.def ?? lex.get(signId)?.def ?? "");
    setLexVer((v) => v + 1);
    setMsg(`Sign ${signId} is back to the dictionary version.`);
  };

  // ---- playback ----
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const anim = useMemo(() => (mode === "ayah" && gloss ? animateGloss(gloss) : null), [mode, gloss, lexVer, mocapReady]);
  const timeline = mode === "sign" ? signTimeline : (anim?.timeline ?? null);
  useEffect(() => {
    pb.current.time = 0;
    pb.current.playing = true;
    setPlaying(true);
  }, [timeline]);
  useEffect(() => {
    pb.current.rate = rate;
  }, [rate]);
  // a single sign loops so it can be watched again and again while fixing it
  useEffect(() => {
    pb.current.loop = mode === "sign";
  }, [mode]);
  const replay = useCallback(() => {
    pb.current.time = 0;
    pb.current.playing = true;
    setPlaying(true);
  }, []);
  const togglePlay = () => {
    pb.current.playing = !pb.current.playing;
    setPlaying(pb.current.playing);
  };
  const activeTok = useMemo(() => {
    const it = anim?.timeline.items.find((x) => time >= x.start && time <= x.end && x.kind !== "pause");
    return it?.index ?? -1;
  }, [anim, time]);
  const seekChip = (i: number) => {
    const it = anim?.timeline.items.find((x) => x.index === i);
    if (it) {
      pb.current.time = Math.max(0, it.start - 0.15);
      pb.current.playing = true;
      setPlaying(true);
    }
  };

  // ---- review decisions ----
  const decideAyah = (status: ReviewStatus, comment: string) => {
    addReview("ayah", key, status, { gloss, comment });
    setMsg(status === "approved" ? `${key} approved.` : `${key} marked: needs changes.`);
  };
  const decideSign = (status: ReviewStatus, comment: string) => {
    addReview("sign", signId, status, { def: signDef, comment });
    setMsg(status === "approved" ? `${signId} approved.` : `${signId} marked: needs changes.`);
  };

  // ---- queue ----
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [signRows, setSignRows] = useState<SignRow[]>([]);
  const [freq, setFreq] = useState<Record<string, number>>({});
  useEffect(() => {
    getJSON<QueueItem[]>("/data/audit/queue.json", []).then(setQueue);
    getJSON<SignRow[]>("/data/audit/signs.json", []).then(setSignRows);
    getJSON<Record<string, number>>("/data/gloss/freq.json", {}).then(setFreq);
  }, []);
  const nextAyah = () => {
    const nc = [...index.all("ayah")].filter(([, s]) => s.status === "needs-changes").map(([k]) => k);
    const flagged = queue.filter((q) => (!queueFilter.flag || q.flags.includes(queueFilter.flag)) && (!queueFilter.surah || q.s === queueFilter.surah)).map((q) => ayahKey(q.s, q.a));
    const order = [...new Set([...nc, ...flagged])];
    const pick = nextIn(order, key, (k) => index.get("ayah", k).status !== "approved");
    if (!pick) return setMsg("Nothing left in the queue.");
    const [s, a] = pick.split(":").map(Number);
    setMode("ayah");
    setN(s);
    setAyah(a);
    setMsg(`Next in queue: ${pick}`);
  };
  const nextSign = () => {
    const nc = [...index.all("sign")].filter(([, s]) => s.status === "needs-changes").map(([k]) => k);
    const rows = signRows.filter((r) => !r.id.endsWith(".drawn"));
    const bad = rows.filter((r) => Math.max(r.key, r.path) > 0.02).sort((a, b) => b.uses - a.uses).map((r) => r.id);
    const low = rows.filter((r) => r.conf === "low").sort((a, b) => b.uses - a.uses).map((r) => r.id);
    const pick = nextIn([...new Set([...nc, ...bad, ...low])], signId, (k) => index.get("sign", k).status !== "approved");
    if (!pick) return setMsg("No more signs to review.");
    setSignId(pick);
    setMsg(`Next sign: ${pick}`);
  };
  const ayahCount = surah?.ayahs ?? list.find((s) => s.n === n)?.ayahs ?? 1;
  const step = (d: number) => {
    if (ayah + d >= 1 && ayah + d <= ayahCount) return setAyah(ayah + d);
    const m = list.find((s) => s.n === n + d);
    if (!m) return;
    setN(m.n);
    setAyah(d > 0 ? 1 : m.ayahs);
  };

  // ---- keyboard ----
  const keyRef = useRef<(e: KeyboardEvent) => void>(() => {});
  useEffect(() => {
    keyRef.current = (e: KeyboardEvent) => {
      if (e.defaultPrevented || picker) return;
      const t = e.target as HTMLElement;
      const typing = t.closest("input, textarea, select, [contenteditable]");
      const mod = e.ctrlKey || e.metaKey;
      if (mode === "ayah" && mod && !typing && e.code === "KeyZ") {
        e.preventDefault();
        (e.shiftKey ? hist.redo : hist.undo)();
      } else if (mode === "ayah" && mod && !typing && e.code === "KeyY") {
        e.preventDefault();
        hist.redo();
      } else if (e.altKey && e.code === "ArrowRight" && !typing) {
        e.preventDefault();
        (mode === "ayah" ? nextAyah : nextSign)();
      } else if (!typing && !mod && !e.altKey && e.key === " " && t.tagName !== "BUTTON") {
        e.preventDefault();
        replay();
      }
    };
  });
  useEffect(() => {
    const h = (e: KeyboardEvent) => keyRef.current(e);
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const a = surah?.ayat[ayah - 1];
  const vids = humanVideos(n);
  const bslClip = bsl?.[String(ayah)];
  const seek = bslClip ? { id: bslClip.video, start: bslClip.start } : undefined;
  const tabCls = (on: boolean) => `inline-flex min-h-12 items-center gap-2 rounded-xl px-4 text-base font-semibold ${on ? "bg-brand text-brand-ink" : "text-ink-2 hover:bg-panel-2"}`;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-5">
      <header className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="mr-auto text-2xl font-semibold text-ink">Studio</h1>
        <div role="tablist" aria-label="What to review" className="flex gap-1 rounded-2xl border border-line bg-panel p-1">
          <button role="tab" type="button" aria-selected={mode === "ayah"} onClick={() => setMode("ayah")} className={tabCls(mode === "ayah")}>
            <BookOpen aria-hidden className="size-5" /> Ayah
          </button>
          <button role="tab" type="button" aria-selected={mode === "sign"} onClick={() => setMode("sign")} className={tabCls(mode === "sign")}>
            <Hand aria-hidden className="size-5" /> Sign
          </button>
        </div>
        <Link href={mode === "sign" ? "/review?tab=signs" : "/review"} className="inline-flex min-h-12 items-center gap-2 rounded-xl border-2 border-line-2 px-4 font-semibold text-ink hover:bg-panel-2">
          <ListChecks aria-hidden className="size-5" /> Queue
        </Link>
      </header>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        {/* ---------- stage ---------- */}
        <div className="flex flex-col gap-3 lg:sticky lg:top-20 lg:self-start">
          <div className="stage relative aspect-[4/3.2] max-h-[52vh] w-full overflow-hidden rounded-2xl border border-line lg:max-h-none">
            <AvatarCanvas className="absolute inset-0" timeline={timeline} playback={pb} onTime={setTime} onEnd={() => setPlaying(false)} ariaLabel={mode === "sign" ? `Avatar signing ${signId}` : `Avatar signing ayah ${key}`} />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Btn tone="primary" size="lg" icon={RotateCcw} onClick={replay} title="Play from the start (Space)">
              Replay
            </Btn>
            <IconBtn icon={playing ? Pause : Play} label={playing ? "Pause" : "Play"} onClick={togglePlay} className="size-14" />
            <label className="flex min-h-14 flex-1 items-center gap-3 rounded-xl border-2 border-line-2 bg-panel px-3 text-sm text-ink-2">
              <span aria-hidden>🐢</span>
              <input type="range" min={0.25} max={1.5} step={0.05} value={rate} onChange={(e) => setRate(+e.target.value)} aria-label="Speed" aria-valuetext={`${Math.round(rate * 100)}%`} className="h-8 min-w-0 flex-1 accent-[var(--brand)]" />
              <span aria-hidden>🐇</span>
              <span className="w-10 text-right font-mono tabular-nums text-ink">{Math.round(rate * 100)}%</span>
            </label>
          </div>
          {mode === "ayah" && (
            <details className="group rounded-2xl border border-line bg-panel p-3" open={vids.length > 0}>
              <summary className="flex min-h-11 cursor-pointer items-center gap-2 font-semibold text-ink">
                <Video aria-hidden className="size-5 text-ink-2" /> Human signer {vids.length ? `(${vids.length})` : ""}
              </summary>
              <div className="mt-2">
                <HumanVideos videos={vids} seek={seek} />
              </div>
            </details>
          )}
        </div>

        {/* ---------- editor ---------- */}
        <div className="flex min-w-0 flex-col gap-3">
          {mode === "ayah" ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <IconBtn icon={ChevronLeft} label="Previous ayah" onClick={() => step(-1)} disabled={n === 1 && ayah === 1} className="size-12" />
                <select aria-label="Surah" value={n} onChange={(e) => (setN(+e.target.value), setAyah(1))} className="min-h-12 min-w-40 flex-1 rounded-xl border-2 border-line-2 bg-panel px-3 text-base">
                  {list.map((s) => (
                    <option key={s.n} value={s.n}>
                      {s.n}. {s.name}
                    </option>
                  ))}
                </select>
                <label className="flex min-h-12 items-center gap-2 rounded-xl border-2 border-line-2 bg-panel px-3 text-base">
                  <span className="text-ink-2">Ayah</span>
                  <input type="number" min={1} max={ayahCount} value={ayah} onChange={(e) => setAyah(Math.max(1, Math.min(ayahCount, +e.target.value || 1)))} className="w-16 bg-transparent font-mono" />
                  <span className="text-ink-3">/ {ayahCount}</span>
                </label>
                <IconBtn icon={ChevronRight} label="Next ayah" onClick={() => step(1)} disabled={n === 114 && ayah === ayahCount} className="size-12" />
                <Btn tone="primary" size="lg" icon={SkipForward} onClick={nextAyah} title="Next ayah that needs review (Alt+→)" className="basis-full xl:basis-auto">
                  Next in queue
                </Btn>
              </div>

              {a && (
                <Panel>
                  <p className="arabic text-right text-2xl leading-loose" lang="ar" dir="rtl">
                    {a.ar}
                  </p>
                  <p className="mt-1 text-base text-ink">{a.en}</p>
                  <details className="mt-1 text-sm text-ink-2">
                    <summary className="min-h-9 cursor-pointer">Word by word</summary>
                    <div className="arabic mt-1 flex flex-wrap gap-2" dir="rtl">
                      {a.w.map((w, k) => (
                        <span key={k} className="inline-flex flex-col items-center rounded-lg bg-panel-2 px-2 py-1">
                          <span className="text-lg" lang="ar">
                            {w.ar}
                          </span>
                          <span dir="ltr" className="font-sans text-xs">
                            {w.en}
                          </span>
                        </span>
                      ))}
                    </div>
                  </details>
                </Panel>
              )}

              <Panel
                title="Signs"
                actions={
                  <>
                    <IconBtn icon={Undo2} label="Undo (Ctrl+Z)" onClick={hist.undo} disabled={!hist.canUndo} />
                    <IconBtn icon={Redo2} label="Redo (Ctrl+Shift+Z)" onClick={hist.redo} disabled={!hist.canRedo} />
                    <IconBtn icon={Type} label={showText ? "Hide gloss text" : "Edit as text"} onClick={() => setShowText((v) => !v)} aria-pressed={showText} />
                  </>
                }
              >
                <ChipTimeline chips={chips} sel={sel} active={activeTok} onSelect={(i) => (setSel(i), i !== null && seekChip(i))} onMove={move} onDelete={del} />
                <div className="mt-3 flex flex-wrap gap-2">
                  <Btn icon={Plus} onClick={() => setPicker({ mode: "append", at: chips.length })}>
                    Add sign
                  </Btn>
                  <Btn onClick={() => commit([...chips, { key: newKey(), kind: "pause", gloss: ",", tags: [] }])}>+ Pause</Btn>
                  {edited && (
                    <Btn icon={RotateCcw} tone="ghost" onClick={() => commit(toChips(base))}>
                      Back to original
                    </Btn>
                  )}
                  {edited && <span className="self-center text-sm text-ink-2">Edited · saved in this browser</span>}
                </div>
                {sel !== null && chips[sel] && (
                  <ChipEditor
                    chip={chips[sel]}
                    index={sel}
                    count={chips.length}
                    onChange={(p) => patch(sel, p)}
                    onDelete={() => del(sel)}
                    onMove={(d) => move(sel, sel + d)}
                    onReplace={() => setPicker({ mode: "replace", at: sel })}
                    onInsert={(w) => setPicker({ mode: w, at: sel })}
                    onEditSign={(id) => {
                      setSignId(id);
                      setMode("sign");
                    }}
                  />
                )}
                {showText && (
                  <label className="mt-3 block text-sm font-medium text-ink">
                    Gloss text
                    <textarea
                      value={text}
                      onChange={(e) => {
                        setText(e.target.value);
                        fromText.current = true;
                        commit(toChips(e.target.value), "text");
                      }}
                      rows={3}
                      spellCheck={false}
                      className="mt-1 w-full rounded-xl border-2 border-line-2 bg-panel p-3 font-mono text-[15px]"
                    />
                  </label>
                )}
                {showText && <NotationHelp />}
              </Panel>

              <ReviewPanel what="ayah" state={index.get("ayah", key)} current={gloss} onDecide={decideAyah} />
            </>
          ) : (
            <SignPanel
              signId={signId}
              def={signDef}
              setDef={setSignDef}
              repoDef={repoDef}
              draft={!!local.signs[signId]}
              error={signErr}
              timeline={signTimeline}
              uses={freq[signId] ?? 0}
              review={index.get("sign", signId)}
              onDecide={decideSign}
              onPick={() => setPicker({ mode: "sign", at: 0 })}
              onSave={saveSign}
              onRevert={revertSign}
              onNext={nextSign}
              onSeek={(u) => {
                const it = signTimeline?.items[0];
                if (it) pb.current.time = it.start + u * (it.end - it.start);
              }}
            />
          )}

          <p role="status" aria-live="polite" className="min-h-6 text-sm font-medium text-ink">
            {msg}
          </p>
          <Contributions />
          <KeyHelp />
        </div>
      </div>

      <SignPicker
        open={!!picker}
        title={picker?.mode === "replace" ? "Change sign" : picker?.mode === "sign" ? "Choose a sign to review" : "Add a sign"}
        initial={picker?.mode === "replace" ? (chips[picker.at]?.gloss.split(".")[0] ?? "") : ""}
        onPick={onPicked}
        onClose={() => setPicker(null)}
      />
    </div>
  );
}

/** First item after `cur` in `order` (wrapping) that passes `ok`, never `cur` itself. */
function nextIn(order: string[], cur: string, ok: (k: string) => boolean): string | null {
  if (!order.length) return null;
  const i = order.indexOf(cur);
  for (let k = 1; k <= order.length; k++) {
    const c = order[(Math.max(i, -1) + k + order.length) % order.length];
    if (c !== cur && ok(c)) return c;
  }
  return null;
}

function KeyHelp() {
  return (
    <details className="rounded-2xl border border-line bg-panel p-3 text-sm text-ink-2">
      <summary className="flex min-h-11 cursor-pointer items-center gap-2 font-medium text-ink">
        <Keyboard aria-hidden className="size-5" /> Keyboard
      </summary>
      <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
        {[
          ["Tab", "move between controls"],
          ["← →", "move between signs"],
          ["Alt + ← →", "move the selected sign"],
          ["Enter", "open a sign to edit"],
          ["Delete", "remove the sign"],
          ["Ctrl + Z / Ctrl + Shift + Z", "undo / redo"],
          ["Alt + A", "approve"],
          ["Alt + N", "needs changes"],
          ["Alt + →", "next in queue"],
          ["Space", "replay"],
        ].map(([k, v]) => (
          <div key={k} className="contents">
            <dt>
              <kbd className="rounded border border-line-2 bg-panel-2 px-1.5 py-0.5 font-mono text-xs text-ink">{k}</kbd>
            </dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}

function NotationHelp() {
  return (
    <details className="mt-2 rounded-xl border border-line p-3 text-sm text-ink-2">
      <summary className="min-h-8 cursor-pointer font-medium text-ink">Gloss notation</summary>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        <li><code>ALLAH MERCY</code> — signs from the dictionary (variants: <code>ALLAH.2</code>)</li>
        <li><code>fs:MUSA</code> — fingerspelling</li>
        <li><code>HOUSE:a</code> — place the sign at locus a (signer&apos;s right), b (left), c (centre), up</li>
        <li><code>WORK+</code> — repeat; <code>DAY+JUDGE</code> — compound</li>
        <li><code>[top: NAME ALLAH]</code> — facial grammar over a span</li>
        <li><code>,</code> short pause · <code>.</code> sentence end · <code>?</code> question · <code>(note)</code> ignored</li>
      </ul>
    </details>
  );
}

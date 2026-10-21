"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { PlaybackState } from "@/components/avatar/AvatarCanvas";
import { getLexicon } from "@/lib/asl/lexicon";
import { fingerspell } from "@/lib/asl/fingerspell";
import { buildTimeline, sampleHand, makePose } from "@/lib/asl/timeline";
import type { CompiledSign } from "@/lib/asl/types";
import { compareHands, dtw, FINGER_NAMES, FINGERS, handFeatures, rigLandmarks, type FingerScore } from "@/lib/practice/features";
import { orderDeck, review, loadCards } from "@/lib/practice/srs";
import { useMocapReady } from "@/lib/hooks/useMocap";

const AvatarCanvas = dynamic(() => import("@/components/avatar/AvatarCanvas"), { ssr: false });

type P = [number, number, number];
interface HandResult { image: P[]; world: P[]; label: string; score: number }

const LETTERS = "ABCDEFGHIKLMNOPQRSTUVWXY".split("");
const DECKS: Record<string, { label: string; ids: () => Promise<string[]> }> = {
  alphabet: { label: "Fingerspelling alphabet", ids: async () => LETTERS.map((l) => "fs:" + l) },
  fatihah: {
    label: "Al-Fātiḥah vocabulary",
    ids: async () => ["NAME", "ALLAH", "GRACIOUS", "MERCIFUL", "PRAISE", "ALL", "FOR", "LORD", "WORLD", "JUDGMENT-DAY", "KING", "OWN", "YOU", "ONLY", "WE", "WORSHIP", "ASK", "HELP", "PLEASE", "GUIDE", "PATH", "STRAIGHT", "PEOPLE", "BLESS", "NOT", "ANGRY", "ASTRAY"],
  },
  juzamma: {
    label: "Juz ʿAmma — most frequent signs",
    ids: async () => {
      const f: Record<string, number> = await fetch("/data/gloss/freq.json").then((r) => r.json());
      return Object.keys(f).filter((g) => !g.startsWith("IX")).slice(0, 80);
    },
  },
};

/** Reference: dominant-hand shape at the sign's main (longest-held) key. */
function referenceFor(sign: CompiledSign) {
  const keys = sign.R;
  const main = keys.reduce((a, b) => (b.hold > a.hold ? b : a), keys[Math.floor(keys.length / 2)]);
  const palm = new THREE.Vector3(0, 0, 1).applyQuaternion(new THREE.Quaternion(...main.quat));
  return { shape: main.shape, palm };
}

function compile(id: string): CompiledSign {
  if (id.startsWith("fs:")) return fingerspell(id.slice(3));
  return getLexicon().compile(id);
}

export default function Practice() {
  const [deckId, setDeckId] = useState("fatihah");
  const [deck, setDeck] = useState<string[]>([]);
  const [pos, setPos] = useState(0);
  const [camOn, setCamOn] = useState(false);
  const [status, setStatus] = useState("Camera off");
  const [fingers, setFingers] = useState<FingerScore[]>([]);
  const [score, setScore] = useState<number | null>(null);
  const [palmHint, setPalmHint] = useState("");
  const [latency, setLatency] = useState(0);
  const [motion, setMotion] = useState<{ state: "idle" | "count" | "rec" | "done"; n?: number; score?: number }>({ state: "idle" });
  const [best, setBest] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const busy = useRef(false);
  const path = useRef<[number, number][]>([]);
  const recording = useRef(false);
  const pb = useRef<PlaybackState>({ time: 0, playing: true, rate: 0.8, loop: true });
  const mocapReady = useMocapReady();

  useEffect(() => {
    DECKS[deckId].ids().then((ids) => {
      setDeck(orderDeck(ids.filter((id) => id.startsWith("fs:") || getLexicon().has(id))));
      setPos(0);
    });
  }, [deckId]);

  const id = deck[pos];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const sign = useMemo(() => (id ? compile(id) : null), [id, mocapReady]);
  const timeline = useMemo(() => (sign ? buildTimeline([{ index: 0, label: id, kind: "sign", sign }]) : null), [sign, id]);
  const ref = useMemo(() => {
    if (!sign) return null;
    const r = referenceFor(sign);
    return { ...r, feats: handFeatures(rigLandmarks(r.shape), true) };
  }, [sign]);
  // reference wrist path (front view: x right = signer's left, y up)
  const refPath = useMemo(() => {
    if (!sign) return [];
    const out: [number, number][] = [];
    const hp = makePose().R;
    const t0 = sign.R[0].t, t1 = sign.R[sign.R.length - 1].t + sign.R[sign.R.length - 1].hold;
    for (let t = t0; t <= t1; t += 1 / 30) {
      sampleHand(sign.R, t, hp);
      out.push([hp.pos.x, -hp.pos.y]);
    }
    return out;
  }, [sign]);

  useEffect(() => {
    pb.current.time = 0;
    pb.current.playing = true;
    setScore(null);
    setFingers([]);
    setMotion({ state: "idle" });
    setBest(0);
  }, [id]);

  const draw = useCallback((hands: HandResult[], perFinger: FingerScore[] | null) => {
    const c = canvasRef.current, v = videoRef.current;
    if (!c || !v) return;
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    const g = c.getContext("2d")!;
    g.clearRect(0, 0, c.width, c.height);
    const color = (f: string) => {
      const s = perFinger?.find((x) => x.finger === f)?.ok;
      return s === "good" ? "#2fbf71" : s === "close" ? "#f2b233" : s === "off" ? "#e5484d" : "#9ad";
    };
    for (const h of hands) {
      const pts = h.image.map((p) => [p[0] * c.width, p[1] * c.height]);
      for (const f of FINGER_NAMES) {
        const chain = [0, ...FINGERS[f]];
        g.strokeStyle = color(f);
        g.lineWidth = 5;
        g.beginPath();
        chain.forEach((k, i) => (i ? g.lineTo(pts[k][0], pts[k][1]) : g.moveTo(pts[k][0], pts[k][1])));
        g.stroke();
        for (const k of FINGERS[f]) {
          g.fillStyle = color(f);
          g.beginPath();
          g.arc(pts[k][0], pts[k][1], 6, 0, Math.PI * 2);
          g.fill();
        }
      }
    }
  }, []);

  const onResult = useCallback(
    (hands: HandResult[], ms: number) => {
      setLatency(ms);
      if (!ref || !hands.length) {
        draw(hands, null);
        setStatus(hands.length ? "Tracking" : "Show your hand to the camera");
        return;
      }
      // evaluate each detected hand, keep the better one (either hand may be dominant)
      let bestRes: { fingers: FingerScore[]; score: number; h: HandResult; isRight: boolean } | null = null;
      for (const h of hands) {
        const isRight = h.label === "Left"; // raw (unmirrored) frame swaps MediaPipe's label
        const feats = handFeatures(h.world.length ? h.world : h.image, isRight);
        const r = compareHands(feats, ref.feats);
        if (!bestRes || r.score > bestRes.score) bestRes = { ...r, h, isRight };
      }
      const b = bestRes!;
      draw(hands, b.fingers);
      setFingers(b.fingers);
      setScore(b.score);
      setBest((x) => Math.max(x, b.score));
      // palm orientation in torso space: raw image (x, y down, z toward camera negative) → (x, -y, -z)
      const W = videoRef.current?.videoWidth ?? 1, H = videoRef.current?.videoHeight ?? 1;
      const img = b.h.image.map((p) => [p[0] * W, p[1] * H, p[2] * W] as P);
      const f = handFeatures(img, b.isRight);
      const userPalm = new THREE.Vector3(f.palm[0], -f.palm[1], -f.palm[2]);
      const refPalm = ref.palm.clone();
      if (!b.isRight) refPalm.x *= -1;
      const ang = (userPalm.angleTo(refPalm) * 180) / Math.PI;
      setPalmHint(ang < 40 ? "Palm orientation ✓" : `Rotate palm to face ${describeDir(refPalm)}`);
      setStatus("Tracking");
      if (recording.current) path.current.push([b.h.image[0][0], b.h.image[0][1]]);
    },
    [ref, draw],
  );

  // camera + worker lifecycle
  useEffect(() => {
    if (!camOn) return;
    let stream: MediaStream | null = null;
    let raf = 0;
    let stopped = false;
    const worker = new Worker(new URL("../../workers/hand.worker.ts", import.meta.url), { type: "module" });
    workerRef.current = worker;
    let ready = false;
    setStatus("Loading hand tracker…");
    worker.onmessage = (e) => {
      const m = e.data;
      if (m.type === "ready") {
        ready = true;
        setStatus("Show your hand to the camera");
      }
      else if (m.type === "error") setStatus("Hand tracker failed: " + m.error);
      else if (m.type === "result") {
        busy.current = false;
        const dbg = ((window as unknown as { __practice?: { frames: number; hands: number } }).__practice ??= { frames: 0, hands: 0 });
        dbg.frames++;
        dbg.hands += m.hands.length;
        onResultRef.current(m.hands, m.ms);
      }
    };
    worker.postMessage({ type: "init" });
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: "user" }, audio: false });
        if (stopped) return;
        const v = videoRef.current!;
        v.srcObject = stream;
        await v.play();
        const loop = async () => {
          if (stopped) return;
          if (ready && !busy.current && v.readyState >= 2) {
            busy.current = true;
            const bmp = await createImageBitmap(v);
            worker.postMessage({ type: "frame", bitmap: bmp, ts: performance.now() }, [bmp]);
          }
          raf = requestAnimationFrame(loop);
        };
        loop();
      } catch (err) {
        setStatus("Camera unavailable: " + (err as Error).message);
      }
    })();
    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
      worker.terminate();
      workerRef.current = null;
    };
  }, [camOn]);
  const onResultRef = useRef(onResult);
  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  const recordMotion = async () => {
    for (const n of [3, 2, 1]) {
      setMotion({ state: "count", n });
      await new Promise((r) => setTimeout(r, 700));
    }
    path.current = [];
    recording.current = true;
    setMotion({ state: "rec" });
    await new Promise((r) => setTimeout(r, Math.max(1500, (sign?.dur ?? 1) * 1000 + 600)));
    recording.current = false;
    // compare (user path is in raw image coords: mirror x so it reads like the avatar)
    const user = path.current.map(([x, y]) => [-x, y] as [number, number]);
    const d = dtw(user, refPath);
    const s = Number.isFinite(d) ? Math.round(100 * Math.exp(-d * 1.4)) : 0;
    setMotion({ state: "done", score: s });
  };

  const grade = (g: 0 | 1 | 2 | 3) => {
    if (!id) return;
    review(id, g, best);
    setPos((p) => (p + 1) % Math.max(1, deck.length));
  };

  const entry = id && !id.startsWith("fs:") ? getLexicon().get(id) : undefined;
  const cards = typeof window !== "undefined" ? loadCards() : {};

  return (
    <div className="mx-auto grid w-full max-w-7xl gap-4 px-4 py-6 lg:grid-cols-2">
      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="mr-auto text-2xl font-semibold">Practice</h1>
          <label className="text-sm text-ink-2">
            Deck{" "}
            <select value={deckId} onChange={(e) => setDeckId(e.target.value)} className="rounded-md border border-line bg-panel px-2 py-1 text-ink">
              {Object.entries(DECKS).map(([k, d]) => (
                <option key={k} value={k}>{d.label}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="stage relative aspect-[4/3] overflow-hidden rounded-2xl border border-line">
          <AvatarCanvas className="absolute inset-0" timeline={timeline} playback={pb} ariaLabel={`Avatar demonstrating ${id}`} />
          <div className="absolute left-3 top-3 rounded-lg bg-black/60 px-3 py-1.5 font-mono text-xl text-white">
            {id?.startsWith("fs:") ? `Letter ${id.slice(3)}` : id}
          </div>
          <div className="absolute bottom-3 left-3 text-xs text-white/80">
            Card {pos + 1}/{deck.length} {cards[id ?? ""] ? `· best ${cards[id!].best}%` : "· new"}
          </div>
        </div>
        {entry && (
          <p className="text-sm text-ink-2">
            English: {entry.en?.slice(0, 6).join(", ")} {entry.conf === "low" && <span className="text-warn">· draft sign, needs Deaf review</span>}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <span className="self-center text-sm text-ink-2">How did it go?</span>
          <button onClick={() => grade(0)} className="rounded-lg border border-line px-3 py-1.5">Again</button>
          <button onClick={() => grade(1)} className="rounded-lg border border-line px-3 py-1.5">Hard</button>
          <button onClick={() => grade(2)} className="rounded-lg bg-brand px-3 py-1.5 text-brand-ink">Good</button>
          <button onClick={() => grade(3)} className="rounded-lg border border-line px-3 py-1.5">Easy</button>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <h2 className="mr-auto text-lg font-semibold">Your camera</h2>
          <button onClick={() => setCamOn((v) => !v)} className={`rounded-lg px-3 py-1.5 ${camOn ? "border border-line" : "bg-brand text-brand-ink"}`}>
            {camOn ? "Stop camera" : "Start camera"}
          </button>
        </div>
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-line bg-black">
          <video ref={videoRef} className="absolute inset-0 h-full w-full -scale-x-100 object-cover" playsInline muted />
          <canvas ref={canvasRef} className="absolute inset-0 h-full w-full -scale-x-100 object-cover" />
          {!camOn && (
            <div className="absolute inset-0 grid place-items-center p-6 text-center text-sm text-white/80">
              Video is processed entirely in your browser. Nothing is recorded or uploaded.
            </div>
          )}
          {motion.state === "count" && <div className="absolute inset-0 grid place-items-center text-7xl font-bold text-white">{motion.n}</div>}
          {motion.state === "rec" && <div className="absolute right-3 top-3 rounded bg-bad px-2 py-1 text-xs font-semibold text-white">● Sign now</div>}
        </div>
        <p className="text-xs text-ink-2" aria-live="polite">
          {status}
          {camOn && latency > 0 ? ` · ${latency.toFixed(0)} ms/frame` : ""}
        </p>
        <div className="rounded-2xl border border-line bg-panel p-4">
          <div className="mb-3 flex items-baseline gap-3">
            <span className="text-sm text-ink-2">Handshape match</span>
            <span className="text-3xl font-semibold">{score ?? "—"}{score !== null && "%"}</span>
            <span className="ml-auto text-sm text-ink-2">{palmHint}</span>
          </div>
          <ul className="grid grid-cols-5 gap-2 text-center text-xs">
            {FINGER_NAMES.map((f) => {
              const s = fingers.find((x) => x.finger === f);
              return (
                <li key={f} className={`rounded-lg border px-1 py-2 ${s?.ok === "good" ? "border-ok bg-ok/10" : s?.ok === "close" ? "border-warn bg-warn/10" : s ? "border-bad bg-bad/10" : "border-line"}`}>
                  <div className="capitalize">{f}</div>
                  <div className="font-mono text-ink-2">{s ? `${Math.round(s.diff)}°` : "–"}</div>
                </li>
              );
            })}
          </ul>
          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={recordMotion}
              disabled={!camOn || motion.state === "count" || motion.state === "rec"}
              className="rounded-lg border border-line px-3 py-1.5 disabled:opacity-50"
            >
              Check movement
            </button>
            {motion.state === "done" && <span className="text-sm">Movement path match: <strong>{motion.score}%</strong> (dynamic time warping)</span>}
          </div>
          <p className="mt-3 text-xs text-ink-2">
            Scoring compares finger joint angles (θ = arccos(u·v/|u||v|)) with the avatar&apos;s handshape, palm direction via the cross
            product of knuckle vectors, and your wrist path against the sign&apos;s path. It is a learning aid, not an assessment of signing fluency.
          </p>
        </div>
      </section>
    </div>
  );
}

function describeDir(v: THREE.Vector3) {
  const a = [
    { n: "the camera", d: new THREE.Vector3(0, 0, 1) },
    { n: "yourself", d: new THREE.Vector3(0, 0, -1) },
    { n: "up", d: new THREE.Vector3(0, 1, 0) },
    { n: "down", d: new THREE.Vector3(0, -1, 0) },
    { n: "the side", d: new THREE.Vector3(1, 0, 0) },
    { n: "the side", d: new THREE.Vector3(-1, 0, 0) },
  ];
  return a.reduce((b, x) => (x.d.dot(v) > b.d.dot(v) ? x : b)).n;
}


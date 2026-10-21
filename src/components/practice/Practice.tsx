"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { PlaybackState } from "@/components/avatar/AvatarCanvas";
import { getLexicon } from "@/lib/asl/lexicon";
import { fingerspell } from "@/lib/asl/fingerspell";
import { buildTimeline } from "@/lib/asl/timeline";
import type { CompiledSign } from "@/lib/asl/types";
import { compareHands, dtw, FINGER_NAMES, handFeatures, rigLandmarks, type FingerScore } from "@/lib/practice/features";
import { orderDeck, review, loadCards } from "@/lib/practice/srs";
import { useMocapReady } from "@/lib/hooks/useMocap";
import { Frame } from "@/components/ui/frame";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
    label: "Juz ʿAmma — frequent signs",
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
  const [status, setStatus] = useState("Camera standby");
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
    let live = true;
    DECKS[deckId].ids().then((raw) => {
      if (!live) return;
      const ordered = orderDeck(raw);
      setDeck(ordered);
      setPos(0);
      setBest(0);
      setScore(null);
      setFingers([]);
    });
    return () => {
      live = false;
    };
  }, [deckId]);

  const id = deck[pos];

  const sign = useMemo(() => {
    if (!id) return null;
    try {
      return compile(id);
    } catch {
      return null;
    }
  }, [id]);

  const timeline = useMemo(() => {
    if (!sign) return null;
    return buildTimeline([{ index: 0, label: id, kind: "sign", sign }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sign, mocapReady]);

  const ref = useMemo(() => {
    if (!sign) return null;
    const r = referenceFor(sign);
    return { shape: r.shape, palm: r.palm, feats: handFeatures(rigLandmarks(r.shape), true) };
  }, [sign]);

  const refPath = useMemo(() => {
    if (!sign) return [];
    return sign.R.map((k) => [k.pos[0], k.pos[1]] as [number, number]);
  }, [sign]);

  const draw = useCallback((hands: HandResult[], bFingers?: FingerScore[]) => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, cv.width, cv.height);
    const W = cv.width, H = cv.height;

    for (const h of hands) {
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = "rgba(15, 118, 110, 0.8)";
      for (const [a, b] of [
        [0, 1], [1, 2], [2, 3], [3, 4],
        [0, 5], [5, 6], [6, 7], [7, 8],
        [0, 9], [9, 10], [10, 11], [11, 12],
        [0, 13], [13, 14], [14, 15], [15, 16],
        [0, 17], [17, 18], [18, 19], [19, 20],
        [5, 9], [9, 13], [13, 17],
      ]) {
        const pa = h.image[a], pb = h.image[b];
        ctx.beginPath();
        ctx.moveTo(pa[0] * W, pa[1] * H);
        ctx.lineTo(pb[0] * W, pb[1] * H);
        ctx.stroke();
      }
      for (const p of h.image) {
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(p[0] * W, p[1] * H, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }, []);

  const onResult = useCallback(
    (hands: HandResult[], ms: number) => {
      setLatency(ms);
      if (!hands.length || !ref) {
        setStatus(hands.length ? "Analyzing…" : "Show hand to camera");
        draw([]);
        setFingers([]);
        setScore(null);
        return;
      }
      let bestRes: { score: number; fingers: FingerScore[]; h: HandResult; isRight: boolean } | null = null;
      for (const h of hands) {
        const isRight = h.label === "Right";
        const feats = handFeatures(h.world.length ? h.world : h.image, isRight);
        const r = compareHands(feats, ref.feats);
        if (!bestRes || r.score > bestRes.score) bestRes = { ...r, h, isRight };
      }
      const b = bestRes!;
      draw(hands, b.fingers);
      setFingers(b.fingers);
      setScore(b.score);
      setBest((x) => Math.max(x, b.score));

      const W = videoRef.current?.videoWidth ?? 1, H = videoRef.current?.videoHeight ?? 1;
      const img = b.h.image.map((p) => [p[0] * W, p[1] * H, p[2] * W] as P);
      const f = handFeatures(img, b.isRight);
      const userPalm = new THREE.Vector3(f.palm[0], -f.palm[1], -f.palm[2]);
      const refPalm = ref.palm.clone();
      if (!b.isRight) refPalm.x *= -1;
      const ang = (userPalm.angleTo(refPalm) * 180) / Math.PI;
      setPalmHint(ang < 40 ? "Palm orientation ✓" : `Rotate palm to face ${describeDir(refPalm)}`);
      setStatus("Tracking active");
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
    setStatus("Loading vision model…");
    worker.onmessage = (e) => {
      const m = e.data;
      if (m.type === "ready") {
        ready = true;
        setStatus("Show your hand to the camera");
      } else if (m.type === "error") {
        setStatus("Hand tracker error: " + m.error);
      } else if (m.type === "result") {
        busy.current = false;
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
    <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 sm:px-6 py-8 lg:grid-cols-2">
      {/* Target avatar signer frame */}
      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/60 pb-3">
          <div>
            <Badge variant="outline" size="sm" className="bg-panel font-mono">
              Kinematic Practice
            </Badge>
            <h1 className="mt-1 font-serif text-2xl font-medium tracking-tight text-ink">
              Pose Practice Lab
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-ink-3">Deck:</span>
            <select
              value={deckId}
              onChange={(e) => setDeckId(e.target.value)}
              className="rounded-md border border-line bg-panel px-2.5 py-1 text-xs text-ink shadow-xs outline-none focus:border-brand"
            >
              {Object.entries(DECKS).map(([k, d]) => (
                <option key={k} value={k}>{d.label}</option>
              ))}
            </select>
          </div>
        </div>

        <Frame
          withCorners
          withHeader
          headerTitle={
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" />
              <span className="font-mono text-[11px] font-semibold text-ink">
                TARGET RIG: {id?.startsWith("fs:") ? `Letter ${id.slice(3)}` : id}
              </span>
            </div>
          }
          headerAction={
            <span className="font-mono text-[10px] text-ink-3">
              Card {pos + 1}/{deck.length} {cards[id ?? ""] ? `· best ${cards[id!].best}%` : "· new"}
            </span>
          }
          className="overflow-hidden shadow-xs"
        >
          <div className="stage relative aspect-[4/3] overflow-hidden">
            <AvatarCanvas className="absolute inset-0" timeline={timeline} playback={pb} ariaLabel={`Avatar demonstrating ${id}`} />
            <div className="absolute left-3 top-3 rounded-md border border-line bg-panel/90 px-3 py-1 font-mono text-lg font-semibold text-ink shadow-xs backdrop-blur">
              {id?.startsWith("fs:") ? `Letter ${id.slice(3)}` : id}
            </div>
          </div>
        </Frame>

        {entry && (
          <Frame withCorners={false} className="p-3.5 text-xs text-ink-2 bg-panel shadow-xs">
            <p>
              <strong className="text-ink">English Gloss:</strong> {entry.en?.slice(0, 6).join(", ")}{" "}
              {entry.conf === "low" && <span className="text-warn font-medium">· provisional definition</span>}
            </p>
          </Frame>
        )}

        {/* SRS Rating Control */}
        <Frame withCorners={false} className="p-3.5 bg-panel shadow-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-ink mr-1">SRS Rating:</span>
            <Button variant="outline" size="xs" onClick={() => grade(0)}>Again</Button>
            <Button variant="outline" size="xs" onClick={() => grade(1)}>Hard</Button>
            <Button variant="default" size="xs" onClick={() => grade(2)}>Good</Button>
            <Button variant="secondary" size="xs" onClick={() => grade(3)}>Easy</Button>
          </div>
        </Frame>
      </section>

      {/* Camera and feedback frame */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between border-b border-line/60 pb-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-brand">[Vision]</span>
            <h2 className="text-lg font-semibold text-ink">Edge Camera Tracker</h2>
          </div>
          <Button
            variant={camOn ? "outline" : "default"}
            size="xs"
            onClick={() => setCamOn((v) => !v)}
          >
            {camOn ? "Stop Camera" : "Start Camera"}
          </Button>
        </div>

        <Frame
          withCorners
          withHeader
          headerTitle={
            <div className="flex items-center gap-2">
              <span className={`h-1.5 w-1.5 rounded-full ${camOn ? "bg-ok" : "bg-ink-3"}`} />
              <span className="font-mono text-[11px] text-ink">{status}</span>
            </div>
          }
          headerAction={
            <span className="font-mono text-[10px] text-ink-3">
              {camOn && latency > 0 ? `${latency.toFixed(0)} ms/frame` : "Browser On-Device"}
            </span>
          }
          className="overflow-hidden shadow-xs"
        >
          <div className="relative aspect-[4/3] overflow-hidden bg-black">
            <video ref={videoRef} className="absolute inset-0 h-full w-full -scale-x-100 object-cover" playsInline muted />
            <canvas ref={canvasRef} className="absolute inset-0 h-full w-full -scale-x-100 object-cover" />
            {!camOn && (
              <div className="absolute inset-0 grid place-items-center p-6 text-center text-xs text-white/70">
                Processed client-side via Google MediaPipe. No video or biometric frames are transmitted to any server.
              </div>
            )}
            {motion.state === "count" && (
              <div className="absolute inset-0 grid place-items-center text-7xl font-bold text-white backdrop-blur-xs">
                {motion.n}
              </div>
            )}
            {motion.state === "rec" && (
              <div className="absolute right-3 top-3 rounded bg-bad px-2 py-1 text-xs font-semibold text-white">
                ● Sign now
              </div>
            )}
          </div>
        </Frame>

        {/* Pose Comparison Frame */}
        <Frame withCorners={false} className="p-4 bg-panel shadow-xs">
          <div className="mb-3 flex items-baseline justify-between border-b border-line/60 pb-3">
            <div>
              <span className="font-mono text-[10px] uppercase text-ink-3 block">Handshape Match</span>
              <span className="text-3xl font-light tracking-tight text-ink font-mono">
                {score ?? "—"}{score !== null && "%"}
              </span>
            </div>
            <span className="text-xs font-medium text-brand font-mono">{palmHint}</span>
          </div>

          <ul className="grid grid-cols-5 gap-1.5 text-center text-xs">
            {FINGER_NAMES.map((f) => {
              const s = fingers.find((x) => x.finger === f);
              return (
                <li
                  key={f}
                  className={`rounded-lg border px-1 py-1.5 ${
                    s?.ok === "good"
                      ? "border-ok/30 bg-ok/10 text-ok"
                      : s?.ok === "close"
                      ? "border-warn/30 bg-warn/10 text-warn"
                      : s
                      ? "border-bad/30 bg-bad/10 text-bad"
                      : "border-line bg-panel-2 text-ink-3"
                  }`}
                >
                  <div className="capitalize text-[10px] font-medium">{f}</div>
                  <div className="font-mono text-[11px] font-semibold">{s ? `${Math.round(s.diff)}°` : "–"}</div>
                </li>
              );
            })}
          </ul>

          <div className="mt-4 flex items-center justify-between border-t border-line/60 pt-3">
            <Button
              variant="outline"
              size="xs"
              onClick={recordMotion}
              disabled={!camOn || motion.state === "count" || motion.state === "rec"}
            >
              Check Kinematic Movement
            </Button>
            {motion.state === "done" && (
              <span className="text-xs font-mono text-ink">
                Movement Match: <strong>{motion.score}%</strong> (DTW)
              </span>
            )}
          </div>
        </Frame>
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

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Circle, RotateCcw, Save, Square, Trash2, Video, X } from "lucide-react";
import { deleteRecording, saveRecording } from "@/lib/review/recordings";
import { useRecordings } from "@/lib/review/client";
import { eventId } from "@/lib/review/status";
import { getLocalReview } from "@/lib/review/store";
import type { RecordedFrame, Recording } from "@/lib/review/types";
import { Btn, IconBtn, when } from "./ui";

// Record a sign with the webcam: the video (for offline full-body retargeting with
// scripts/mocap/) plus MediaPipe hand landmarks from the same worker the practice
// page uses. Nothing leaves the device until the signer exports a bundle.

const MAX_S = 8;
const HAND_EDGES = [[0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8], [5, 9], [9, 10], [10, 11], [11, 12], [9, 13], [13, 14], [14, 15], [15, 16], [13, 17], [17, 18], [18, 19], [19, 20], [0, 17]];
type Hands = RecordedFrame["hands"];
type Phase = "off" | "starting" | "live" | "count" | "rec" | "review";

function pickMime() {
  if (typeof MediaRecorder === "undefined") return "";
  return ["video/mp4;codecs=avc1", "video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm", "video/mp4"].find((m) => MediaRecorder.isTypeSupported(m)) ?? "";
}

export default function SignRecorder({ sign }: { sign: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const frames = useRef<RecordedFrame[]>([]);
  const analysed = useRef(0);
  const t0 = useRef(0);
  const recording = useRef(false);
  const stopRef = useRef<() => void>(() => {});
  const [phase, setPhase] = useState<Phase>("off");
  const [count, setCount] = useState(3);
  const [elapsed, setElapsed] = useState(0);
  const [status, setStatus] = useState("");
  const [handsNow, setHandsNow] = useState(0);
  const [take, setTake] = useState<Recording | null>(null);
  const [takeUrl, setTakeUrl] = useState("");
  const [comment, setComment] = useState("");
  const saved = useRecordings(sign);

  const draw = useCallback((hands: Hands) => {
    const c = canvasRef.current, v = videoRef.current;
    if (!c || !v) return;
    c.width = v.videoWidth || 640;
    c.height = v.videoHeight || 480;
    const g = c.getContext("2d")!;
    g.clearRect(0, 0, c.width, c.height);
    for (const h of hands) {
      g.strokeStyle = h.label === "Left" ? "#f59e0b" : "#14b8a6";
      g.lineWidth = 4;
      for (const [a, b] of HAND_EDGES) {
        g.beginPath();
        g.moveTo(h.image[a][0] * c.width, h.image[a][1] * c.height);
        g.lineTo(h.image[b][0] * c.width, h.image[b][1] * c.height);
        g.stroke();
      }
      g.fillStyle = "#fff";
      for (const p of h.image) g.fillRect(p[0] * c.width - 3, p[1] * c.height - 3, 6, 6);
    }
  }, []);

  const stopCamera = useCallback(() => {
    recRef.current?.state === "recording" && recRef.current.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    workerRef.current?.terminate();
    workerRef.current = null;
  }, []);

  useEffect(() => stopCamera, [stopCamera]);
  useEffect(() => () => void (takeUrl && URL.revokeObjectURL(takeUrl)), [takeUrl]);

  const start = async () => {
    setPhase("starting");
    setStatus("Starting camera…");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user", frameRate: { ideal: 30 } }, audio: false });
      streamRef.current = stream;
      const v = videoRef.current!;
      v.srcObject = stream;
      await v.play();
    } catch (e) {
      setStatus(`Camera unavailable: ${(e as Error).message}`);
      setPhase("off");
      return;
    }
    const worker = new Worker(new URL("../../workers/hand.worker.ts", import.meta.url), { type: "module" });
    workerRef.current = worker;
    let ready = false, busy = false, stopped = false;
    worker.onmessage = (e) => {
      const m = e.data;
      if (m.type === "ready") {
        ready = true;
        setStatus("");
      } else if (m.type === "error") setStatus(`Hand tracking unavailable (${m.error}). Video still records.`);
      else if (m.type === "result") {
        busy = false;
        const hands = m.hands as Hands;
        draw(hands);
        setHandsNow(hands.length);
        if (recording.current) {
          analysed.current++;
          const t = (performance.now() - t0.current) / 1000;
          if (hands.length) frames.current.push({ t: +t.toFixed(3), hands: hands.map((h) => ({ label: h.label, score: +h.score.toFixed(3), image: h.image.map((p) => p.map((x) => +x.toFixed(4))), world: h.world.map((p) => p.map((x) => +x.toFixed(4))) })) });
        }
      }
    };
    worker.postMessage({ type: "init" });
    setStatus("Loading hand tracker…");
    const v = videoRef.current!;
    const loop = async () => {
      if (stopped || workerRef.current !== worker) return (stopped = true);
      if (ready && !busy && v.readyState >= 2) {
        busy = true;
        try {
          const bmp = await createImageBitmap(v);
          worker.postMessage({ type: "frame", bitmap: bmp, ts: performance.now() }, [bmp]);
        } catch {
          busy = false;
        }
      }
      requestAnimationFrame(loop);
    };
    loop();
    setPhase("live");
  };

  const record = async () => {
    setPhase("count");
    for (const n of [3, 2, 1]) {
      setCount(n);
      await new Promise((r) => setTimeout(r, 800));
    }
    const stream = streamRef.current;
    if (!stream) return;
    const mime = pickMime();
    chunks.current = [];
    frames.current = [];
    analysed.current = 0;
    let rec: MediaRecorder | null = null;
    try {
      rec = new MediaRecorder(stream, mime ? { mimeType: mime, videoBitsPerSecond: 2_500_000 } : undefined);
      rec.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
      rec.start(250);
    } catch {
      rec = null;
      setStatus("This browser cannot record video; only hand landmarks are kept.");
    }
    recRef.current = rec;
    t0.current = performance.now();
    recording.current = true;
    setPhase("rec");
    const tick = setInterval(() => {
      const s = (performance.now() - t0.current) / 1000;
      setElapsed(s);
      if (s >= MAX_S) finish();
    }, 100);
    const finish = () => {
      clearInterval(tick);
      if (!recording.current) return;
      recording.current = false;
      const duration = (performance.now() - t0.current) / 1000;
      const v = videoRef.current!;
      const done = () => {
        const video = chunks.current.length ? new Blob(chunks.current, { type: rec?.mimeType || mime || "video/webm" }) : null;
        const r: Recording = {
          id: `rec-${eventId()}`,
          sign,
          by: getLocalReview().reviewer || "anonymous",
          at: new Date().toISOString(),
          mime: video?.type ?? "",
          duration: +duration.toFixed(2),
          width: v.videoWidth,
          height: v.videoHeight,
          fps: +(analysed.current / duration).toFixed(1),
          handRate: analysed.current ? +(frames.current.length / analysed.current).toFixed(2) : 0,
          mirrored: true,
          frames: frames.current,
          video,
        };
        setTake(r);
        setTakeUrl(video ? URL.createObjectURL(video) : "");
        setPhase("review");
      };
      if (rec && rec.state === "recording") {
        rec.onstop = done;
        rec.stop();
      } else done();
    };
    stopRef.current = finish;
  };

  const keep = async () => {
    if (!take) return;
    await saveRecording({ ...take, comment: comment.trim() || undefined });
    setTake(null);
    setComment("");
    setPhase("live");
  };

  const live = phase === "live" || phase === "count" || phase === "rec";
  return (
    <div className="space-y-3">
      <div className="stage relative aspect-video overflow-hidden rounded-2xl border-2 border-line bg-black">
        <video ref={videoRef} muted playsInline className={`absolute inset-0 h-full w-full -scale-x-100 object-contain ${phase === "review" || phase === "off" ? "invisible" : ""}`} />
        <canvas ref={canvasRef} aria-hidden className={`pointer-events-none absolute inset-0 h-full w-full -scale-x-100 object-contain ${live ? "" : "invisible"}`} />
        {phase === "review" && takeUrl && <video src={takeUrl} controls loop autoPlay muted playsInline className="absolute inset-0 h-full w-full object-contain" aria-label="Your recording (as others see you)" />}
        {phase === "off" && (
          <div className="absolute inset-0 grid place-items-center p-4 text-center text-white">
            <div>
              <Camera aria-hidden className="mx-auto size-12 opacity-80" />
              <p className="mt-2 text-sm opacity-80">Sign {sign} yourself. Video stays on this device until you export.</p>
            </div>
          </div>
        )}
        {phase === "count" && <div className="absolute inset-0 grid place-items-center text-8xl font-bold text-white drop-shadow-lg" aria-live="assertive">{count}</div>}
        {phase === "rec" && (
          <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-black/70 px-3 py-1.5 text-white" aria-live="polite">
            <span className="size-3 animate-pulse rounded-full bg-red-500" /> {elapsed.toFixed(1)} s / {MAX_S} s
          </div>
        )}
        {live && phase !== "count" && (
          <div className="absolute bottom-3 left-3 rounded-full bg-black/70 px-3 py-1.5 text-sm text-white">
            <span aria-hidden>✋</span> {handsNow} {handsNow === 1 ? "hand" : "hands"}
          </div>
        )}
      </div>
      {status && <p className="text-sm text-ink-2" role="status">{status}</p>}

      <div className="flex flex-wrap gap-2">
        {phase === "off" && (
          <Btn tone="primary" size="lg" icon={Camera} onClick={start}>
            Turn on camera
          </Btn>
        )}
        {phase === "live" && (
          <>
            <Btn tone="bad" size="lg" icon={Circle} onClick={record} className="!bg-bad !text-[var(--bg)]">
              Record
            </Btn>
            <Btn icon={X} onClick={() => (stopCamera(), setPhase("off"))}>
              Camera off
            </Btn>
          </>
        )}
        {phase === "rec" && (
          <Btn tone="plain" size="lg" icon={Square} onClick={() => stopRef.current()} autoFocus>
            Stop
          </Btn>
        )}
        {phase === "review" && take && (
          <div className="w-full space-y-2">
            <p className="text-sm text-ink-2">
              {take.duration.toFixed(1)} s · hands found in {Math.round(take.handRate * 100)}% of frames · {take.frames.length} tracked frames{take.video ? "" : " · no video"}
            </p>
            {take.handRate < 0.5 && <p className="text-sm font-medium text-warn">Hands were often not found. Try more light, or step back so both hands are in view.</p>}
            <label className="block text-sm font-medium text-ink">
              Note <span className="font-normal text-ink-2">(optional)</span>
              <input value={comment} onChange={(e) => setComment(e.target.value)} className="mt-1 min-h-11 w-full rounded-xl border-2 border-line-2 bg-panel px-3 text-base" />
            </label>
            <div className="flex flex-wrap gap-2">
              <Btn tone="ok" size="lg" icon={Save} onClick={keep}>
                Keep as proposed recording
              </Btn>
              <Btn size="lg" icon={RotateCcw} onClick={() => (setTake(null), setPhase("live"))}>
                Try again
              </Btn>
            </div>
          </div>
        )}
      </div>

      {saved.length > 0 && (
        <div>
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink">
            <Video aria-hidden className="size-4" /> Proposed recordings of {sign} ({saved.length})
          </h3>
          <ul className="grid gap-2">
            {saved.map((r) => (
              <SavedTake key={r.id} r={r} />
            ))}
          </ul>
          <p className="mt-2 text-xs text-ink-3">Included in your contribution bundle. Maintainers retarget them onto the avatar with scripts/mocap/.</p>
        </div>
      )}
    </div>
  );
}

function SavedTake({ r }: { r: Recording }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    if (!r.video) return;
    const u = URL.createObjectURL(r.video);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [r.video]);
  return (
    <li className="flex gap-2 rounded-xl border border-line bg-panel-2 p-2">
      {url ? <video src={url} muted loop playsInline controls className="aspect-video w-44 shrink-0 rounded-lg bg-black object-cover" /> : <div className="grid aspect-video w-44 shrink-0 place-items-center rounded-lg bg-black text-xs text-white">no video</div>}
      <div className="min-w-0 flex-1 text-sm">
        <div className="font-medium text-ink">{r.by}</div>
        <div className="text-ink-2">
          {when(r.at)} · {r.duration.toFixed(1)} s · {Math.round(r.handRate * 100)}% hands
        </div>
        {r.comment && <div className="mt-0.5 text-ink">{r.comment}</div>}
      </div>
      <IconBtn icon={Trash2} label="Delete recording" tone="ghost" onClick={() => confirm("Delete this recording?") && deleteRecording(r.id)} />
    </li>
  );
}

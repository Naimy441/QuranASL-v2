/// <reference lib="webworker" />
// MediaPipe Hand Landmarker running off the main thread. Video frames arrive as
// ImageBitmaps; nothing leaves the device.
import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";

let landmarker: HandLandmarker | null = null;

async function init() {
  const fileset = await FilesetResolver.forVisionTasks("/mediapipe/wasm", false);
  landmarker = await HandLandmarker.createFromOptions(fileset, {
    baseOptions: { modelAssetPath: "/mediapipe/hand_landmarker.task", delegate: "GPU" },
    runningMode: "VIDEO",
    numHands: 2,
    minHandDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });
  postMessage({ type: "ready" });
}

self.onmessage = async (e: MessageEvent) => {
  const msg = e.data;
  if (msg.type === "init") {
    try {
      await init();
    } catch (err) {
      postMessage({ type: "error", error: String(err) });
    }
    return;
  }
  if (msg.type === "frame" && !landmarker) {
    // not ready yet: always answer so the sender never stalls
    (msg.bitmap as ImageBitmap).close();
    postMessage({ type: "result", ms: 0, hands: [] });
    return;
  }
  if (msg.type === "frame" && landmarker) {
    const t0 = performance.now();
    const res = landmarker.detectForVideo(msg.bitmap as ImageBitmap, msg.ts as number);
    (msg.bitmap as ImageBitmap).close();
    postMessage({
      type: "result",
      ms: performance.now() - t0,
      hands: res.landmarks.map((lm, i) => ({
        image: lm.map((p) => [p.x, p.y, p.z]),
        world: res.worldLandmarks[i]?.map((p) => [p.x, p.y, p.z]) ?? [],
        label: res.handednesses[i]?.[0]?.categoryName ?? "",
        score: res.handednesses[i]?.[0]?.score ?? 0,
      })),
    });
  }
};

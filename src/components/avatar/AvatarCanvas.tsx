"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, OrthographicCamera, PerspectiveCamera, ContactShadows } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import { createXRStore, XR, useXR } from "@react-three/xr";
import { AvatarRig, AVATAR_PRESETS, type AvatarStyle } from "@/lib/avatar/AvatarRig";
import { buildTimeline, makePose, samplePose, type Timeline } from "@/lib/asl/timeline";

export interface PlaybackState {
  time: number;
  playing: boolean;
  rate: number;
  loop: boolean;
}

export interface AvatarCanvasProps {
  timeline: Timeline | null;
  /** Mutable playback state shared with the UI (read every frame). */
  playback: React.RefObject<PlaybackState>;
  onTime?: (t: number) => void;
  onEnd?: () => void;
  avatar?: keyof typeof AVATAR_PRESETS;
  mode?: "3d" | "2d";
  background?: string;
  className?: string;
  ariaLabel?: string;
  /** "face" frames the head for close inspection of facial grammar. */
  framing?: "body" | "face";
  /** Show "View in VR / AR" buttons when the device supports WebXR. */
  xr?: boolean;
}

/** In an immersive session the user stands at the origin: place the signer in front of them. */
function XRPlacement({ children }: { children: React.ReactNode }) {
  const mode = useXR((s) => s.mode);
  const inXR = mode === "immersive-vr" || mode === "immersive-ar";
  return <group position={inXR ? [0, 0, -1.4] : [0, 0, 0]}>{children}</group>;
}

function useXRSupport() {
  const [sup, setSup] = useState({ vr: false, ar: false });
  useEffect(() => {
    const xr = (navigator as Navigator & { xr?: { isSessionSupported(m: string): Promise<boolean> } }).xr;
    if (!xr) return;
    Promise.all([xr.isSessionSupported("immersive-vr").catch(() => false), xr.isSessionSupported("immersive-ar").catch(() => false)]).then(([vr, ar]) =>
      setSup({ vr, ar }),
    );
  }, []);
  return sup;
}

function Rig({ timeline, playback, onTime, onEnd, avatar = "amina" }: Pick<AvatarCanvasProps, "timeline" | "playback" | "onTime" | "onEnd" | "avatar">) {
  const style: AvatarStyle = AVATAR_PRESETS[avatar] ?? AVATAR_PRESETS.amina;
  const rig = useMemo(() => new AvatarRig(style), [style]);
  useEffect(() => () => rig.dispose(), [rig]);
  const pose = useMemo(() => makePose(), []);
  const lastReport = useRef(0);
  const ended = useRef(false);

  useFrame((state, delta) => {
    const pb = playback.current;
    const tl = timeline;
    if (pb && tl) {
      if (pb.playing) {
        pb.time += Math.min(delta, 0.05) * pb.rate;
        if (pb.time >= tl.dur) {
          if (pb.loop) pb.time = 0;
          else {
            pb.time = tl.dur;
            pb.playing = false;
            if (!ended.current) {
              ended.current = true;
              onEnd?.();
            }
          }
        } else ended.current = false;
      }
      samplePose(tl, pb.time, pose);
      if (onTime && state.clock.elapsedTime - lastReport.current > 1 / 30) {
        lastReport.current = state.clock.elapsedTime;
        onTime(pb.time);
      }
    } else if (!tl) {
      // idle pose
      samplePose(IDLE, 0, pose);
    }
    rig.apply(pose, state.clock.elapsedTime);
  });
  return <primitive object={rig.group} />;
}

const IDLE = buildTimeline([]);

function CameraRig({ mode, framing = "body" }: { mode: "3d" | "2d"; framing?: "body" | "face" }) {
  const { size } = useThree();
  const aspect = size.width / Math.max(1, size.height);
  // Keep the signing space (head to waist, elbow to elbow) in frame.
  const zoom = Math.min(size.height / 1.12, size.width / 0.95);
  if (framing === "face") return <PerspectiveCamera makeDefault position={[0, 1.62, 0.75]} fov={30} near={0.05} far={20} />;
  return mode === "2d" ? (
    <OrthographicCamera makeDefault position={[0, 1.4, 3]} zoom={zoom} near={0.1} far={10} />
  ) : (
    <PerspectiveCamera makeDefault position={[0, 1.42, aspect < 0.8 ? 2.7 : 2.15]} fov={30} near={0.05} far={20} />
  );
}

export default function AvatarCanvas({ mode = "3d", background, className, ariaLabel, framing, xr = false, ...rest }: AvatarCanvasProps) {
  const store = useMemo(() => (xr ? createXRStore({ hand: false, controller: false }) : null), [xr]);
  const sup = useXRSupport();
  return (
    <div className={className} role="img" aria-label={ariaLabel ?? "3D signing avatar"}>
      {store && (sup.vr || sup.ar) && (
        <div className="absolute bottom-3 right-3 z-10 flex gap-1">
          {sup.vr && <button onClick={() => store.enterVR()} className="rounded-md bg-black/60 px-2 py-1 text-xs text-white">View in VR</button>}
          {sup.ar && <button onClick={() => store.enterAR()} className="rounded-md bg-black/60 px-2 py-1 text-xs text-white">View in AR</button>}
        </div>
      )}
      <Canvas shadows dpr={[1, 2]} gl={{ antialias: true, preserveDrawingBuffer: true }} style={{ background: background ?? "transparent" }}>
        <CameraRig mode={mode} framing={framing} />
        <ambientLight intensity={mode === "2d" ? 1.4 : 0.7} />
        <hemisphereLight args={["#fff6ea", "#30343c", mode === "2d" ? 0.6 : 0.9]} />
        <directionalLight position={[1.2, 2.6, 2.4]} intensity={mode === "2d" ? 0.6 : 2.1} castShadow shadow-mapSize={[1024, 1024]} />
        <directionalLight position={[-2, 1.8, 1]} intensity={0.45} color="#cfe0ff" />
        <directionalLight position={[0, 2, -2]} intensity={0.6} color="#ffe2c4" />
        {store ? (
          <XR store={store}>
            <XRPlacement>
              <Rig {...rest} />
            </XRPlacement>
          </XR>
        ) : (
          <Rig {...rest} />
        )}
        {mode === "3d" && <ContactShadows position={[0, 0.03, 0]} opacity={0.35} scale={2} blur={2.4} far={1} />}
        <OrbitControls
          target={framing === "face" ? [0, 1.6, 0] : [0, 1.36, 0]}
          enablePan={false}
          enableRotate={mode === "3d"}
          minDistance={0.8}
          maxDistance={4}
          enableDamping
        />
      </Canvas>
    </div>
  );
}


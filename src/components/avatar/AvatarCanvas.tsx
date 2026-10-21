"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, OrthographicCamera, PerspectiveCamera, ContactShadows } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { AvatarRig, AVATAR_PRESETS, type AvatarStyle } from "@/lib/avatar/AvatarRig";
import { buildTimeline, makePose, samplePose, type Timeline } from "@/lib/asl/timeline";
import { readViewerPrefs, useResolvedTheme, type ResolvedTheme } from "@/lib/prefs";

// Suppress Three.js r186 deprecation warnings from @react-three/fiber internals (Clock & PCFSoftShadowMap)
if (typeof window !== "undefined" && typeof THREE.setConsoleFunction === "function") {
  THREE.setConsoleFunction((type, message, ...args) => {
    if (typeof message === "string" && (message.includes("Clock") || message.includes("PCFSoftShadowMap"))) {
      return;
    }
    if (type === "warn") console.warn(message, ...args);
    else if (type === "error") console.error(message, ...args);
    else console.log(message, ...args);
  });
}

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
  /** Signer preset; defaults to the one chosen in the viewer. */
  avatar?: keyof typeof AVATAR_PRESETS;
  mode?: "3d" | "2d";
  background?: string;
  className?: string;
  ariaLabel?: string;
  /** "face" frames the head for close inspection of facial grammar. */
  framing?: "body" | "face";
  /** Show "View in VR / AR" buttons when the device supports WebXR. */
  xr?: boolean;
  /** Allow orbiting / zooming with pointer and wheel (off for decorative signers). */
  interactive?: boolean;
}

function Rig({ timeline, playback, onTime, onEnd, avatar }: Pick<AvatarCanvasProps, "timeline" | "playback" | "onTime" | "onEnd" | "avatar">) {
  const style: AvatarStyle = AVATAR_PRESETS[avatar ?? "amina"] ?? AVATAR_PRESETS.amina;
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
  // Fit the signing box (elbow to elbow, waist to above the head) whatever the aspect ratio.
  const half = Math.tan((30 * Math.PI) / 360);
  const dist = 1.06 * Math.max(0.5 / half, 0.5 / (half * aspect));
  return mode === "2d" ? (
    <OrthographicCamera makeDefault position={[0, 1.4, 3]} zoom={zoom} near={0.1} far={10} />
  ) : (
    <PerspectiveCamera makeDefault position={[0, 1.42, Math.min(3.2, Math.max(1.8, dist))]} fov={30} near={0.05} far={20} />
  );
}

/** Soft image-based lighting from a procedural studio room (no network fetch). */
function StudioEnvironment({ intensity }: { intensity: number }) {
  const { gl, scene } = useThree();
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const env = pmrem.fromScene(room, 0.04).texture;
    scene.environment = env;
    return () => {
      scene.environment = null;
      env.dispose();
      pmrem.dispose();
      room.dispose?.();
    };
  }, [gl, scene]);

  useEffect(() => {
    scene.environmentIntensity = intensity;
  }, [scene, intensity]);

  return null;
}

const LIGHTS: Record<ResolvedTheme, { env: number; key: number; fill: number; rim: number; rimColor: string; amb: number; shadow: number }> = {
  light: { env: 0.55, key: 2.0, fill: 0.55, rim: 1.4, rimColor: "#ffe7c7", amb: 0.25, shadow: 0.32 },
  dark: { env: 0.42, key: 2.1, fill: 0.45, rim: 2.2, rimColor: "#9fe6e6", amb: 0.18, shadow: 0.5 },
  // high contrast: brighter body, a strong white rim to separate the silhouette from black
  contrast: { env: 0.7, key: 2.4, fill: 0.8, rim: 3.4, rimColor: "#ffffff", amb: 0.35, shadow: 0 },
};

export default function AvatarCanvas({ mode = "3d", background, className, ariaLabel, framing, xr: _xr, interactive = true, avatar, ...rest }: AvatarCanvasProps) {
  const theme = useResolvedTheme();
  const L = LIGHTS[theme];
  const [prefAvatar, setPrefAvatar] = useState<string>("amina");
  useEffect(() => setPrefAvatar(readViewerPrefs().avatar), []);
  const rigProps = { ...rest, avatar: avatar ?? prefAvatar };
  return (
    <div className={className} role="img" aria-label={ariaLabel ?? "3D signing avatar"}>
      <Canvas
        shadows={{ type: THREE.PCFShadowMap }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, preserveDrawingBuffer: false, powerPreference: "high-performance", toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.0 }}
        style={{ background: background ?? "transparent", touchAction: interactive ? "none" : "pan-y" }}
      >
        <CameraRig mode={mode} framing={framing} />
        {mode === "3d" && <StudioEnvironment intensity={L.env} />}
        <ambientLight intensity={mode === "2d" ? 1.3 : L.amb} />
        <hemisphereLight args={["#fff6ea", "#30343c", mode === "2d" ? 0.6 : 0.5]} />
        {/* key: warm, high, camera-left */}
        <directionalLight
          position={[1.3, 2.7, 2.4]}
          intensity={mode === "2d" ? 0.6 : L.key}
          color="#fff3e6"
          castShadow
          shadow-mapSize={[1024, 1024]}
          shadow-bias={-0.0004}
          shadow-normalBias={0.02}
          shadow-camera-left={-0.8}
          shadow-camera-right={0.8}
          shadow-camera-top={2.2}
          shadow-camera-bottom={0.4}
        />
        {/* fill: cool, low, camera-right */}
        <directionalLight position={[-2, 1.6, 1.4]} intensity={L.fill} color="#d6e6ff" />
        {/* rim: behind and above, outlines head and shoulders */}
        <directionalLight position={[-0.6, 2.4, -2.2]} intensity={L.rim} color={L.rimColor} />
        <directionalLight position={[0.9, 1.8, -2]} intensity={L.rim * 0.6} color={L.rimColor} />
        <Rig {...rigProps} />
        {mode === "3d" && L.shadow > 0 && <ContactShadows position={[0, 0.02, 0]} opacity={L.shadow} scale={2.2} blur={2.6} far={1.2} resolution={512} />}
        <OrbitControls
          target={framing === "face" ? [0, 1.6, 0] : [0, 1.36, 0]}
          enablePan={false}
          enableRotate={interactive && mode === "3d"}
          enableZoom={interactive}
          minDistance={0.8}
          maxDistance={4}
          minPolarAngle={Math.PI * 0.25}
          maxPolarAngle={Math.PI * 0.62}
          enableDamping
        />
      </Canvas>
    </div>
  );
}

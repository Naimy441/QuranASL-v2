"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, OrthographicCamera, PerspectiveCamera, ContactShadows } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
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
  const zoom = Math.min(size.height / 0.95, (size.width / 0.95) * 1);
  if (framing === "face") return <PerspectiveCamera makeDefault position={[0, 1.62, 0.75]} fov={30} near={0.05} far={20} />;
  return mode === "2d" ? (
    <OrthographicCamera makeDefault position={[0, 1.33, 3]} zoom={zoom} near={0.1} far={10} />
  ) : (
    <PerspectiveCamera makeDefault position={[0, 1.42, aspect < 0.8 ? 2.7 : 2.15]} fov={30} near={0.05} far={20} />
  );
}

export default function AvatarCanvas({ mode = "3d", background, className, ariaLabel, framing, ...rest }: AvatarCanvasProps) {
  return (
    <div className={className} role="img" aria-label={ariaLabel ?? "3D signing avatar"}>
      <Canvas shadows dpr={[1, 2]} gl={{ antialias: true, preserveDrawingBuffer: true }} style={{ background: background ?? "transparent" }}>
        <CameraRig mode={mode} framing={framing} />
        <ambientLight intensity={mode === "2d" ? 1.4 : 0.7} />
        <hemisphereLight args={["#fff6ea", "#30343c", mode === "2d" ? 0.6 : 0.9]} />
        <directionalLight position={[1.2, 2.6, 2.4]} intensity={mode === "2d" ? 0.6 : 2.1} castShadow shadow-mapSize={[1024, 1024]} />
        <directionalLight position={[-2, 1.8, 1]} intensity={0.45} color="#cfe0ff" />
        <directionalLight position={[0, 2, -2]} intensity={0.6} color="#ffe2c4" />
        <Rig {...rest} />
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


"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";
import { HANDSHAPES } from "@/lib/asl/handshapes";
import { buildHandRig } from "@/lib/avatar/handRig";
import { useClientQuery } from "@/lib/hooks/useClientQuery";

const VIEW_ROT: Record<string, [number, number, number]> = {
  palm: [0, 0, 0],
  side: [0, -Math.PI / 2, 0], // thumb side toward viewer
  back: [0, Math.PI, 0],
  pinky: [0, Math.PI / 2, 0],
  top: [Math.PI / 2, 0, 0],
};

function Hand({ name, x, y, view }: { name: string; x: number; y: number; view: string }) {
  const rig = useMemo(() => {
    const r = buildHandRig("R", {
      skin: new THREE.MeshStandardMaterial({ color: "#c58c67", roughness: 0.55 }),
      nail: new THREE.MeshStandardMaterial({ color: "#f0d0c0", roughness: 0.35 }),
    });
    r.setShape(HANDSHAPES[name]);
    r.root.rotation.set(...(VIEW_ROT[view] ?? VIEW_ROT.palm));
    r.root.position.set(x, y, 0);
    return r;
  }, [name, x, y, view]);
  return <primitive object={rig.root} />;
}

/** /lab/handshapes?names=A,B,S&views=palm,side  — rows = names, columns = views */
export default function HandshapeLab() {
  const q = useClientQuery();
  if (!q) return null;
  const names = (q.get("names")?.split(",") ?? Object.keys(HANDSHAPES)).filter((n) => HANDSHAPES[n]);
  const views = q.get("views")?.split(",") ?? ["palm"];
  const cols = views.length > 1 ? views.length : Math.min(10, names.length);
  const cells: { name: string; view: string }[] = [];
  for (const n of names) for (const v of views) cells.push({ name: n, view: v });
  const rows = Math.ceil(cells.length / cols);
  const W = cols * 0.2, Hh = rows * 0.22;
  const tan = Math.tan((17.5 * Math.PI) / 180);
  const aspect = window.innerWidth / window.innerHeight;
  const dist = Math.max((Hh + 0.04) / (2 * tan), (W + 0.04) / (2 * tan * aspect));
  return (
    <div style={{ position: "fixed", inset: 0, background: "#202830" }}>
      <div style={{ position: "absolute", top: 4, left: 8, color: "#ddd", font: "12px monospace", zIndex: 2 }}>
        {views.length > 1 ? names.join(" · ") + "  |  " + views.join(", ") : cells.map((c) => c.name).join(" ")}
      </div>
      <Canvas camera={{ position: [W / 2 - 0.1, -Hh / 2 + 0.16, dist], fov: 35 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[1, 2, 3]} intensity={1.6} />
        <directionalLight position={[-2, 1, 1]} intensity={0.5} />
        {cells.map((c, k) => (
          <Hand key={c.name + c.view} name={c.name} view={c.view} x={(k % cols) * 0.2} y={-Math.floor(k / cols) * 0.22} />
        ))}
        <OrbitControls target={[W / 2 - 0.1, -Hh / 2 + 0.16, 0]} />
      </Canvas>
    </div>
  );
}

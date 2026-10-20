"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import AvatarCanvas, { type PlaybackState } from "@/components/avatar/AvatarCanvas";
import { buildTimeline, type SeqUnit } from "@/lib/asl/timeline";
import { compileSign, validateDef } from "@/lib/asl/dsl";
import { useClientQuery } from "@/lib/hooks/useClientQuery";

/**
 * Dev lab: /lab/sign?def=<dsl>&t=<seconds>  (t freezes playback at that time)
 *          /lab/sign?gloss=ALLAH,MERCY       (uses the lexicon)
 */
export default function SignLab() {
  const q = useClientQuery();
  if (!q) return null;
  return <Lab q={q} />;
}

function Lab({ q }: { q: URLSearchParams }) {
  const [def, setDef] = useState(q.get("def") ?? "B @aboveHead p:I f:U > @chest:f12 d:0.5");
  const freeze = q.get("t");
  const view = (q.get("view") as "3d" | "2d") ?? "3d";
  const avatar = (q.get("avatar") as "amina" | "yusuf" | "sam") ?? "amina";
  const pb = useRef<PlaybackState>({ time: freeze ? parseFloat(freeze) : 0, playing: !freeze, rate: 1, loop: true });
  const err = validateDef(def);
  const tl = useMemo(() => {
    if (err) return null;
    const units: SeqUnit[] = def.split("&&").map((d, i) => ({ index: i, label: "S" + i, kind: "sign", sign: compileSign("lab" + i, d.trim()) }));
    return buildTimeline(units);
  }, [def, err]);
  const [t, setT] = useState(0);
  useEffect(() => {
    (window as unknown as { __pb: unknown; __tl: unknown }).__pb = pb.current;
    (window as unknown as { __tl: unknown }).__tl = tl;
  }, [tl]);
  return (
    <div style={{ position: "fixed", inset: 0, display: "flex", flexDirection: "column", background: "linear-gradient(#dfe5ec, #c3ccd6)", color: "#222", fontFamily: "monospace" }}>
      <div style={{ flex: 1, minHeight: 0 }}>
        <AvatarCanvas className="h-full w-full" timeline={tl} playback={pb} onTime={setT} mode={view} avatar={avatar} />
      </div>
      {!q.get("bare") && (
        <div style={{ padding: 8, display: "flex", gap: 8, alignItems: "center" }}>
          <textarea value={def} onChange={(e) => setDef(e.target.value)} rows={3} style={{ flex: 1, background: "#0e1217", color: "#cde", padding: 6 }} />
          <div style={{ width: 160 }}>
            {err ? <span style={{ color: "#f88" }}>{err}</span> : `t=${t.toFixed(2)} / ${tl?.dur.toFixed(2)}`}
          </div>
        </div>
      )}
    </div>
  );
}

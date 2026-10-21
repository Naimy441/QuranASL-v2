"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import type { PlaybackState } from "@/components/avatar/AvatarCanvas";
import { animateGloss } from "@/lib/asl/gloss";
import { buildTimeline } from "@/lib/asl/timeline";
import { mocapSign } from "@/lib/asl/mocap";
import { BISMILLAH_GLOSS } from "@/lib/data/quran";
import { loadBslAyat, type BslAyahClip } from "@/lib/bsl/ayat";
import { useMocapReady } from "@/lib/hooks/useMocap";
import type { AvatarId, SignLang } from "@/lib/prefs";

const AvatarCanvas = dynamic(() => import("@/components/avatar/AvatarCanvas"), {
  ssr: false,
  loading: () => <SignerSkeleton />,
});

function SignerSkeleton() {
  return (
    <div className="grid h-full place-items-center">
      <div className="flex flex-col items-center gap-3 text-ink-3">
        <span className="h-10 w-10 animate-[spin_1.1s_linear_infinite] rounded-full border-2 border-line border-t-brand" />
        <span className="text-sm">Preparing the signer…</span>
      </div>
    </div>
  );
}

/** The landing-page signer: loops the Bismillah (ASL) or a captured BSL ayah. */
export default function HeroSigner({ avatar, lang }: { avatar: AvatarId; lang: SignLang }) {
  const [canLoadRig, setCanLoadRig] = useState(false);
  const pb = useRef<PlaybackState>({ time: 0, playing: true, rate: 0.85, loop: false });
  const [time, setTime] = useState(0);
  const [bsl, setBsl] = useState<BslAyahClip | null>(null);
  const mocapReady = useMocapReady();

  useEffect(() => {
    // Defer heavy 3D WebGL context & shader compilation so the hero headline
    // typography animation has exclusive main-thread priority on page load.
    const t = setTimeout(() => setCanLoadRig(true), 400);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (lang !== "bsl") return;
    let live = true;
    loadBslAyat(112).then((a) => live && setBsl(a?.["1"] ?? null));
    return () => {
      live = false;
    };
  }, [lang]);

  const anim = useMemo(() => {
    if (lang === "bsl" && bsl) {
      return {
        timeline: buildTimeline([{ index: 0, label: "BSL", kind: "sign", sign: mocapSign(bsl, 1) }]),
        tokens: [],
        caption: "Say, “He is Allah, [who is] One”",
      };
    }
    return { ...animateGloss(BISMILLAH_GLOSS), caption: "In the name of Allah, the Entirely Merciful, the Especially Merciful" };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, bsl, mocapReady]);

  useEffect(() => {
    pb.current.time = 0;
    pb.current.playing = true;
  }, [anim]);

  const onEnd = () => {
    setTimeout(() => {
      pb.current.time = 0;
      pb.current.playing = true;
    }, 1400);
  };

  const active = anim.timeline.items.find((x) => time >= x.start - 0.05 && time <= x.end + 0.05 && x.kind !== "pause");
  const tok = anim.tokens.find((t) => t.index === active?.index);

  return (
    <div className="relative h-full w-full">
      {canLoadRig ? (
        <AvatarCanvas
          className="absolute inset-0"
          timeline={anim.timeline}
          playback={pb}
          onTime={setTime}
          onEnd={onEnd}
          avatar={avatar}
          interactive={false}
          ariaLabel={`Signing avatar signing ${lang === "bsl" ? "Surah Al-Ikhlas ayah 1 in BSL" : "the Bismillah in ASL"}`}
        />
      ) : (
        <SignerSkeleton />
      )}

      {/* Real-time gloss token pill placed at top-left so hands remain 100% visible */}
      {tok && tok.status !== "pause" && (
        <div className="pointer-events-none absolute left-3 top-3 z-10 flex items-center gap-2 rounded-lg border border-line/60 bg-panel/90 px-3 py-1 text-xs font-mono font-medium tracking-wide text-ink shadow-sm backdrop-blur-md">
          <span className="h-1.5 w-1.5 rounded-full bg-brand animate-pulse" />
          <span className="text-[10px] uppercase tracking-wider text-ink-3">GLOSS:</span>
          <span className="font-semibold text-brand">{tok.gloss}</span>
          {tok.locus && <span className="text-[10px] text-accent">[{tok.locus}]</span>}
        </div>
      )}
    </div>
  );
}

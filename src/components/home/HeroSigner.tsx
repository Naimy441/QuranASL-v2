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
  const pb = useRef<PlaybackState>({ time: 0, playing: true, rate: 0.85, loop: false });
  const [time, setTime] = useState(0);
  const [bsl, setBsl] = useState<BslAyahClip | null>(null);
  const mocapReady = useMocapReady();

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
        caption: "Say, “He is Allah, [who is] One” — 112:1 in BSL",
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
    // breathe for a moment between loops
    setTimeout(() => {
      pb.current.time = 0;
      pb.current.playing = true;
    }, 1400);
  };

  const active = anim.timeline.items.find((x) => time >= x.start - 0.05 && time <= x.end + 0.05 && x.kind !== "pause");
  const tok = anim.tokens.find((t) => t.index === active?.index);

  return (
    <div className="relative h-full w-full">
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
      <div className="pointer-events-none absolute inset-x-0 bottom-3 flex flex-col items-center gap-1.5 px-3">
        {tok && tok.status !== "pause" && (
          <div key={tok.index} className="flex items-center gap-2 rounded-md border border-white/20 bg-black/85 px-3.5 py-1 text-xs font-mono font-medium tracking-wide text-white shadow-sm backdrop-blur">
            <span className="text-[10px] uppercase tracking-wider text-white/50">Gloss Tier:</span>
            <span className="font-semibold text-white">{tok.gloss}</span>
            {tok.locus && <span className="text-[10px] text-accent">[{tok.locus}]</span>}
          </div>
        )}
        <div className="rounded-md border border-line bg-panel/92 px-3 py-1 text-center text-xs text-ink-2 shadow-xs backdrop-blur max-w-sm">
          {anim.caption}
        </div>
      </div>
    </div>
  );
}

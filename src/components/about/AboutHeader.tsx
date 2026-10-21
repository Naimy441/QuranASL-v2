"use client";

import { TextEffect } from "@/components/ui/text-effect";
import { Badge } from "@/components/ui/badge";

export function AboutHeader() {
  return (
    <div className="border-b border-line/60 pb-6">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" size="sm" className="bg-panel font-mono">
          Research Whitepaper &amp; Corpus Documentation
        </Badge>
        <Badge variant="brand" size="sm">
          Edition 2.4 (2025)
        </Badge>
      </div>
      <div className="mt-4">
        <TextEffect
          per="word"
          preset="fade-in-blur"
          delay={0.1}
          className="font-serif text-3xl font-medium tracking-tight text-ink sm:text-5xl"
        >
          QuranASL: A Digital Sign Language Corpus &amp; Computational Model for the Qur&apos;an
        </TextEffect>
      </div>
      <p className="mt-4 text-base leading-relaxed text-ink-2">
        This document details the theoretical linguistics framework, morphosyntactic glossing standards,
        biomechanical kinematic synthesis pipeline, and community review protocols that constitute the QuranASL
        initiative.
      </p>
    </div>
  );
}

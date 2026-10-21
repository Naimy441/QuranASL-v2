"use client";

import Link from "next/link";
import { CameraIcon, EditIcon, FaceIcon, HandIcon, LayersIcon, VideoIcon, ArrowRightIcon } from "@/components/common/Icons";
import { TextEffect } from "@/components/ui/text-effect";
import { Frame } from "@/components/ui/frame";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const METHODOLOGY_TIERS = [
  {
    tier: "Tier 01",
    Icon: LayersIcon,
    title: "Morphosyntactic Alignment & Tokenization",
    subtitle: "Arabic VSO → Sign Language Topic-Comment Syntax",
    body: "Classical Quranic Arabic features dense synthetic morphology, inflected case endings, and attached pronominal clitics. The corpus tokenizes each ayah into root morphemes and re-synthesizes them into topic-comment structure rather than literal word-for-word transliteration.",
  },
  {
    tier: "Tier 02",
    Icon: HandIcon,
    title: "Spatial Grammar & Discourse Loci",
    subtitle: "3D Referential Space & Narrative Role Shift",
    body: "Sign languages utilize the 3D space surrounding the torso to index referents. Entities (prophets, communities, spiritual concepts) are assigned spatial loci, enabling directional verbs and subtle torso role-shifts to preserve clear pronominal reference across complex discourse.",
  },
  {
    tier: "Tier 03",
    Icon: FaceIcon,
    title: "Non-Manual Grammatical Tier (NMM)",
    subtitle: "Facial Morphology: Polar Questions, Negation, Focus",
    body: "In sign linguistics, facial expressions function as critical syntactic markers. The avatar deformation rig dynamically drives raised brows for topicalization and polar questions, furrowed brows for wh-questions, head-turns for semantic negation, and mouth morphemes.",
  },
  {
    tier: "Tier 04",
    Icon: EditIcon,
    title: "Biomechanical IK & Kinematic Synthesis",
    subtitle: "Quaternion SLERP & Analytical Two-Bone Inverse Kinematics",
    body: "Hand positions, palm orientations, and finger articulations compile into continuous kinematic paths using spherical linear interpolation (SLERP) and a real-time two-bone IK solver with realistic joint limits and natural co-articulation smoothing.",
  },
  {
    tier: "Tier 05",
    Icon: VideoIcon,
    title: "Multimodal Grounding & Human Reference",
    subtitle: "Parallel Native Deaf Muslim Video Documentation",
    body: "Synthetic animation is not a replacement for native signers, but a complementary computational tool. The platform features time-indexed video from the Al Isharah BSL Qur'an Project and Global Deaf Muslim, grounding avatar output in authentic human signing.",
  },
  {
    tier: "Tier 06",
    Icon: CameraIcon,
    title: "Edge Computer Vision & Active Practice",
    subtitle: "On-Device Hand Landmark Pose Verification",
    body: "Learners can evaluate their signing with real-time MediaPipe hand tracking. Pose comparison and dynamic time warping (DTW) algorithms run entirely client-side in the browser, guaranteeing complete user privacy without server transmission.",
  },
];

export default function HowItWorks() {
  return (
    <section id="methodology" aria-labelledby="methodology-heading" className="mx-auto w-full max-w-7xl px-4 sm:px-6 pt-16">
      {/* Section Header */}
      <div className="max-w-3xl">
        <Badge variant="outline" size="sm" className="bg-panel font-mono">
          Theoretical Framework &amp; Technical Pipeline
        </Badge>
        <div className="mt-3">
          <TextEffect
            per="word"
            preset="fade-in-blur"
            delay={0.1}
            className="font-serif text-2xl font-medium tracking-tight text-ink sm:text-4xl"
          >
            Six-Tier Architecture for Computational Sign Linguistics
          </TextEffect>
        </div>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-2">
          Bridging classical Qur&apos;anic Arabic morphology, 3D kinematic synthesis, and natural deaf sign language
          grammars through a rigorous multidisciplinary methodology.
        </p>
      </div>

      {/* Grid of Methodology Tiers */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {METHODOLOGY_TIERS.map(({ tier, Icon, title, subtitle, body }) => (
          <Frame
            key={title}
            withCorners={false}
            className="lift flex flex-col justify-between p-5 sm:p-6 bg-panel shadow-xs"
          >
            <div>
              <div className="flex items-center justify-between border-b border-line/60 pb-3">
                <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-brand">
                  [{tier}]
                </span>
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-panel-2 text-ink-2 border border-line">
                  <Icon size={15} />
                </span>
              </div>
              <h3 className="mt-4 text-sm font-semibold text-ink leading-snug">{title}</h3>
              <p className="mt-1 text-xs font-medium text-brand">{subtitle}</p>
              <p className="mt-3 text-xs leading-relaxed text-ink-2">{body}</p>
            </div>
          </Frame>
        ))}
      </div>

      {/* Formal Research Advisory Frame */}
      <Frame
        withCorners
        className="mt-6 p-5 text-xs text-ink-2 bg-panel shadow-xs"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-3xl">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-accent block mb-1">
              [Scholarly Advisory &amp; Participatory Review Standard]
            </span>
            <p className="leading-relaxed text-ink-3">
              This digital corpus is published as an open research draft for Deaf community review. Synthetic avatar
              signing does not constitute an authoritative ecclesiastical decree (fatwa) or replacement for accredited
              Deaf translators. Tokens marked with dashed outlines reflect provisional dictionary definitions awaiting
              linguistic panel verification.
            </p>
          </div>
          <Link href="/about" className="shrink-0">
            <Button variant="outline" size="sm">
              Read Documentation
              <ArrowRightIcon size={13} />
            </Button>
          </Link>
        </div>
      </Frame>
    </section>
  );
}

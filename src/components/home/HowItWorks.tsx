"use client";

import Link from "next/link";
import { CameraIcon, EditIcon, FaceIcon, HandIcon, LayersIcon, VideoIcon, ArrowRightIcon } from "@/components/common/Icons";
import { TextEffect } from "@/components/ui/text-effect";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const METHODOLOGY_TIERS = [
  {
    tier: "01",
    Icon: LayersIcon,
    title: "Morphosyntactic Alignment & Tokenization",
    subtitle: "Arabic VSO → Sign Language Topic-Comment Syntax",
    body: "Classical Quranic Arabic features dense synthetic morphology, inflected case endings, and attached pronominal clitics. The corpus tokenizes each ayah into root morphemes and re-synthesizes them into topic-comment structure rather than literal word-for-word transliteration.",
  },
  {
    tier: "02",
    Icon: HandIcon,
    title: "Spatial Grammar & Discourse Loci",
    subtitle: "3D Referential Space & Narrative Role Shift",
    body: "Sign languages utilize the 3D space surrounding the torso to index referents. Entities (prophets, communities, spiritual concepts) are assigned spatial loci, enabling directional verbs and subtle torso role-shifts to preserve clear pronominal reference across complex discourse.",
  },
  {
    tier: "03",
    Icon: FaceIcon,
    title: "Non-Manual Grammatical Tier (NMM)",
    subtitle: "Facial Morphology: Polar Questions, Negation, Focus",
    body: "In sign linguistics, facial expressions function as critical syntactic markers. The avatar deformation rig dynamically drives raised brows for topicalization and polar questions, furrowed brows for wh-questions, head-turns for semantic negation, and mouth morphemes.",
  },
  {
    tier: "04",
    Icon: EditIcon,
    title: "Biomechanical IK & Kinematic Synthesis",
    subtitle: "Quaternion SLERP & Analytical Two-Bone Inverse Kinematics",
    body: "Hand positions, palm orientations, and finger articulations compile into continuous kinematic paths using spherical linear interpolation (SLERP) and a real-time two-bone IK solver with realistic joint limits and natural co-articulation smoothing.",
  },
  {
    tier: "05",
    Icon: VideoIcon,
    title: "Multimodal Grounding & Human Reference",
    subtitle: "Parallel Native Deaf Muslim Video Documentation",
    body: "Synthetic animation is not a replacement for native signers, but a complementary computational tool. The platform features time-indexed video from the Al Isharah BSL Qur'an Project and Global Deaf Muslim, grounding avatar output in authentic human signing.",
  },
  {
    tier: "06",
    Icon: CameraIcon,
    title: "Edge Computer Vision & Active Practice",
    subtitle: "On-Device Hand Landmark Pose Verification",
    body: "Learners can evaluate their signing with real-time MediaPipe hand tracking. Pose comparison and dynamic time warping (DTW) algorithms run entirely client-side in the browser, guaranteeing complete user privacy without server transmission.",
  },
];

export default function HowItWorks() {
  return (
    <section id="methodology" aria-labelledby="methodology-heading" className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-16">
      {/* Section Header */}
      <div className="max-w-3xl">
        <Badge variant="brand" size="sm" className="font-mono">
          Theoretical Framework &amp; Technical Pipeline
        </Badge>
        <div className="mt-4">
          <TextEffect
            per="word"
            preset="fade-in-blur"
            delay={0.05}
            className="font-sans text-3xl font-bold tracking-tight text-ink sm:text-4xl lg:text-5xl"
          >
            Six-Tier Architecture for Computational Sign Linguistics
          </TextEffect>
        </div>
        <p className="mt-4 text-base leading-relaxed text-ink-2">
          Bridging classical Qur&apos;anic Arabic morphology, 3D kinematic synthesis, and natural deaf sign language
          grammars through a rigorous multidisciplinary methodology.
        </p>
      </div>

      {/* Modern Bento Feature Grid */}
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {METHODOLOGY_TIERS.map(({ tier, Icon, title, subtitle, body }) => (
          <div
            key={title}
            className="group relative flex flex-col justify-between rounded-2xl border border-line bg-panel p-6 shadow-xs transition-all duration-200 hover:border-line-2 hover:shadow-md"
          >
            <div>
              <div className="flex items-center justify-between border-b border-line/60 pb-4">
                <span className="font-mono text-xs font-bold text-brand">
                  {tier}
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-panel-2 text-ink-2 border border-line group-hover:border-brand/40 group-hover:text-brand transition-colors">
                  <Icon size={16} />
                </span>
              </div>
              <h3 className="mt-4 text-base font-semibold text-ink leading-snug">{title}</h3>
              <p className="mt-1 text-xs font-medium text-brand">{subtitle}</p>
              <p className="mt-3 text-xs leading-relaxed text-ink-2">{body}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Formal Research Advisory Frame */}
      <div className="mt-8 rounded-2xl border border-line bg-panel p-6 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-3xl">
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-accent block mb-1">
              Scholarly Advisory &amp; Participatory Review Standard
            </span>
            <p className="text-xs leading-relaxed text-ink-3">
              This digital corpus is published as an open research draft for Deaf community review. Synthetic avatar
              signing does not constitute an authoritative ecclesiastical decree (fatwa) or replacement for accredited
              Deaf translators. Tokens marked with dashed outlines reflect provisional dictionary definitions awaiting
              linguistic panel verification.
            </p>
          </div>
          <Link href="/about" className="shrink-0">
            <Button variant="outline" size="sm" className="rounded-full">
              Read Documentation
              <ArrowRightIcon size={13} />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

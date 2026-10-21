import Link from "next/link";
import Reveal from "@/components/common/Reveal";
import { CameraIcon, EditIcon, FaceIcon, HandIcon, LayersIcon, VideoIcon } from "@/components/common/Icons";

const METHODOLOGY_TIERS = [
  {
    tier: "Tier 1",
    Icon: LayersIcon,
    title: "Morphosyntactic Alignment & Tokenization",
    subtitle: "Arabic VSO → Sign Language Topic-Comment Syntax",
    body: "Classical Quranic Arabic features dense synthetic morphology, inflected case endings, and attached pronominal clitics. The corpus tokenizes each ayah into root morphemes and re-synthesizes them into topic-comment structure rather than literal word-for-word transliteration.",
  },
  {
    tier: "Tier 2",
    Icon: HandIcon,
    title: "Spatial Grammar & Discourse Loci",
    subtitle: "3D Referential Space & Narrative Role Shift",
    body: "Sign languages utilize the 3D space surrounding the torso to index referents. Entities (prophets, communities, spiritual concepts) are assigned spatial loci, enabling directional verbs and subtle torso role-shifts to preserve clear pronominal reference across complex discourse.",
  },
  {
    tier: "Tier 3",
    Icon: FaceIcon,
    title: "Non-Manual Grammatical Tier (NMM)",
    subtitle: "Facial Morphology: Polar Questions, Negation, Focus",
    body: "In sign linguistics, facial expressions function as critical syntactic markers. The avatar deformation rig dynamically drives raised brows for topicalization and polar questions, furrowed brows for wh-questions, head-turns for semantic negation, and mouth morphemes.",
  },
  {
    tier: "Tier 4",
    Icon: EditIcon,
    title: "Biomechanical IK & Kinematic Synthesis",
    subtitle: "Quaternion SLERP & Analytical Two-Bone Inverse Kinematics",
    body: "Hand positions, palm orientations, and finger articulations compile into continuous kinematic paths using spherical linear interpolation (SLERP) and a real-time two-bone IK solver with realistic joint limits and natural co-articulation smoothing.",
  },
  {
    tier: "Tier 5",
    Icon: VideoIcon,
    title: "Multimodal Grounding & Human Reference",
    subtitle: "Parallel Native Deaf Muslim Video Documentation",
    body: "Synthetic animation is not a replacement for native signers, but a complementary computational tool. The platform features time-indexed video from the Al Isharah BSL Qur'an Project and Global Deaf Muslim, grounding avatar output in authentic human signing.",
  },
  {
    tier: "Tier 6",
    Icon: CameraIcon,
    title: "Edge Computer Vision & Active Practice",
    subtitle: "On-Device Hand Landmark Pose Verification",
    body: "Learners can evaluate their signing with real-time MediaPipe hand tracking. Pose comparison and dynamic time warping (DTW) algorithms run entirely client-side in the browser, guaranteeing complete user privacy without server transmission.",
  },
];

export default function HowItWorks() {
  return (
    <section id="methodology" aria-labelledby="methodology-heading" className="mx-auto w-full max-w-7xl px-4 pt-16">
      {/* Section Academic Masthead */}
      <Reveal className="max-w-3xl">
        <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-accent">
          Theoretical Framework &amp; Technical Pipeline
        </span>
        <h2 id="methodology-heading" className="mt-1 font-serif text-2xl font-medium tracking-tight text-ink sm:text-4xl">
          Six-Tier Architecture for Computational Sign Linguistics
        </h2>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-2">
          Bridging classical Qur&apos;anic Arabic morphology, 3D kinematic synthesis, and natural deaf sign language
          grammars through a rigorous multidisciplinary methodology.
        </p>
      </Reveal>

      {/* Grid of Methodology Tiers */}
      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {METHODOLOGY_TIERS.map(({ tier, Icon, title, subtitle, body }, i) => (
          <Reveal as="li" key={title} delay={(i % 3) * 60} className="lift flex flex-col rounded-xl border border-line bg-panel p-5 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-line/60 pb-3">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-accent">
                {tier}
              </span>
              <span className="grid h-8 w-8 place-items-center rounded-md bg-panel-2 text-brand border border-line">
                <Icon size={18} />
              </span>
            </div>
            <h3 className="mt-3 text-base font-semibold text-ink">{title}</h3>
            <p className="mt-0.5 text-xs font-medium text-brand">{subtitle}</p>
            <p className="mt-2.5 text-xs leading-relaxed text-ink-2">{body}</p>
          </Reveal>
        ))}
      </ul>

      {/* Formal Research Advisory & Community Review Protocol Banner */}
      <Reveal className="mt-6 rounded-xl border border-line bg-panel p-5 text-xs leading-relaxed text-ink-2 shadow-xs">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-3xl">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-accent block mb-1">
              Scholarly Advisory &amp; Participatory Review Standard
            </span>
            <p>
              This digital corpus is published as an open research draft for Deaf community review. Synthetic avatar
              signing does not constitute an authoritative ecclesiastical decree (fatwa) or replacement for accredited
              Deaf translators. Tokens marked with dashed outlines reflect provisional dictionary definitions awaiting
              linguistic panel verification.
            </p>
          </div>
          <Link
            href="/studio"
            className="inline-flex shrink-0 items-center justify-center rounded-md border border-brand bg-brand-soft px-3.5 py-2 text-xs font-semibold text-brand transition hover:bg-brand hover:text-brand-ink"
          >
            Access Gloss Studio
          </Link>
        </div>
      </Reveal>
    </section>
  );
}

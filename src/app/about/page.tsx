import { AboutHeader } from "@/components/about/AboutHeader";
import { Frame } from "@/components/ui/frame";

export const metadata = {
  title: "Corpus Documentation & Methodology — QuranASL",
  description:
    "Linguistic methodology, theoretical foundations, transcription standards, and formal citation guide for the QuranASL computational sign language corpus.",
};

function SectionHeader({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="mt-12 border-b border-line/60 pb-2.5">
      <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-brand">[{kicker}]</span>
      <h2 className="mt-1 font-serif text-2xl font-medium tracking-tight text-ink sm:text-3xl">{title}</h2>
    </div>
  );
}

export default function About() {
  return (
    <article className="mx-auto w-full max-w-4xl px-4 sm:px-6 py-12 leading-relaxed">
      {/* Document Masthead */}
      <AboutHeader />

      {/* Advisory Callout */}
      <Frame withCorners className="mt-6 p-5 text-xs leading-relaxed text-ink-2 shadow-xs bg-panel">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-brand block mb-1">
          [Linguistic Notice &amp; Scope of Research]
        </span>
        <p className="text-ink-3">
          QuranASL is a computational digital humanities project designed to bridge classical Arabic textual scholarship
          and sign language linguistics. The synthetic 3D avatar is not a substitute for human Deaf translators, but
          rather an interactive scaffold, concordance tool, and peer-review environment. Every ayah remains subject to
          ongoing evaluation by accredited Deaf Muslim translators.
        </p>
      </Frame>

      {/* 1. Introduction & Research Objectives */}
      <SectionHeader kicker="1. Overview" title="Introduction &amp; Research Objectives" />
      <p className="mt-4 text-[15px] text-ink-2">
        Over 70 million deaf individuals worldwide use sign languages as their primary mode of communication. For Deaf
        Muslim communities, access to sacred Islamic texts has historically been hindered by the absence of
        standardized digital corpora in natural sign languages. While several surahs have been translated into American
        Sign Language (ASL) and British Sign Language (BSL) by organizations such as Global Deaf Muslim and the Al
        Isharah BSL Qur&apos;an Project, comprehensive ayah-by-ayah coverage across all 114 surahs (6,236 ayat) has
        remained unavailable.
      </p>
      <p className="mt-3 text-[15px] text-ink-2">
        QuranASL addresses this gap by developing:
      </p>
      <ul className="mt-3 list-disc space-y-2 pl-6 text-[14px] text-ink-2">
        <li>
          <strong className="text-ink">A complete syntactic gloss corpus</strong>: 6,236 ayat transcribed into natural
          sign language word order (topic–comment structures and spatial indexing) rather than literal English transliteration.
        </li>
        <li>
          <strong className="text-ink">A phonologically parameterized sign lexicon</strong>: Over 1,300 documented signs
          specifying handshape, palm orientation, location, movement, and facial non-manual markers.
        </li>
        <li>
          <strong className="text-ink">A real-time 3D kinematic engine</strong>: In-browser animation employing quaternion
          interpolation (SLERP) and analytical two-bone inverse kinematics (IK).
        </li>
        <li>
          <strong className="text-ink">An open-access peer-review studio</strong>: Web-based participatory lexicography
          enabling Deaf scholars and native signers to audit, edit, and validate translations.
        </li>
      </ul>

      {/* 2. Theoretical Linguistic Foundations */}
      <SectionHeader kicker="2. Theoretical Framework" title="Sign Language Syntax &amp; Spatial Morphology" />
      <p className="mt-4 text-[15px] text-ink-2">
        Sign languages are fully formed natural languages with grammatical rules distinct from spoken languages. A major
        computational error in previous automated sign language attempts was mapping written text word-for-word (Signed
        Exact English / SEE), which produces unnatural and unintelligible phrasing for native signers.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Frame withCorners={false} className="p-5 shadow-xs bg-panel">
          <h3 className="font-semibold text-ink text-sm">Topic–Comment Discourse Structure</h3>
          <p className="mt-2 text-xs leading-relaxed text-ink-2">
            Unlike classical Arabic&apos;s Verb-Subject-Object (VSO) or English&apos;s SVO order, ASL and BSL predominantly
            employ topic-prominent structures. The context or theme is articulated first (accompanied by raised
            eyebrows), followed by the comment, assertion, or predication.
          </p>
        </Frame>
        <Frame withCorners={false} className="p-5 shadow-xs bg-panel">
          <h3 className="font-semibold text-ink text-sm">Spatial Reference Loci &amp; Agreement</h3>
          <p className="mt-2 text-xs leading-relaxed text-ink-2">
            Sign syntax organizes referents into geometric points (loci) in the 3D space surrounding the signer.
            Directional agreement verbs move between these established loci to denote agent and patient, disambiguating
            complex pronominal structures without ambiguity.
          </p>
        </Frame>
      </div>

      {/* 3. Non-Manual Grammatical System */}
      <SectionHeader kicker="3. Phonology &amp; Morphology" title="Non-Manual Markers (NMM) Tiering" />
      <p className="mt-4 text-[15px] text-ink-2">
        In sign linguistics, facial movements are grammatical morphemes rather than emotional expressions. QuranASL
        encodes non-manual markers into separate annotation tiers synchronized with the manual gloss tokens:
      </p>

      <Frame withCorners={false} className="mt-4 overflow-hidden shadow-xs bg-panel">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-line bg-panel-2 font-mono uppercase tracking-wider text-[11px] text-ink-3">
              <th className="py-2.5 pl-4 pr-3 font-medium">Marker Tier</th>
              <th className="px-3 py-2.5 font-medium">Linguistic Function</th>
              <th className="px-3 py-2.5 font-medium">Kinematic Implementation</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line/60 text-ink-2">
            <tr>
              <td className="py-2.5 pl-4 pr-3 font-mono font-semibold text-ink"><code>[t]</code> Raised Brows</td>
              <td className="px-3 py-2.5">Topic demarcation &amp; polar (yes/no) questions</td>
              <td className="px-3 py-2.5">Bilateral frontalis muscle activation (+35% brow elevation)</td>
            </tr>
            <tr>
              <td className="py-2.5 pl-4 pr-3 font-mono font-semibold text-ink"><code>[wh]</code> Furrowed Brows</td>
              <td className="px-3 py-2.5">Interrogative pronouns (who, what, where, why)</td>
              <td className="px-3 py-2.5">Corrugator supercilii contraction (-25% brow depress)</td>
            </tr>
            <tr>
              <td className="py-2.5 pl-4 pr-3 font-mono font-semibold text-ink"><code>[neg]</code> Head Shake</td>
              <td className="px-3 py-2.5">Syntactic negation and prohibition (lā, mā)</td>
              <td className="px-3 py-2.5">Axial cervical rotation (yaw oscillation ±12°)</td>
            </tr>
            <tr>
              <td className="py-2.5 pl-4 pr-3 font-mono font-semibold text-ink"><code>[role]</code> Role Shift</td>
              <td className="px-3 py-2.5">Direct discourse &amp; narrative perspective taking</td>
              <td className="px-3 py-2.5">Torso and eye-gaze reorientation toward target locus</td>
            </tr>
          </tbody>
        </table>
      </Frame>

      {/* 4. Comparative Corpus: ASL vs BSL */}
      <SectionHeader kicker="4. Multi-Dialectal Corpus" title="Comparative Analysis: ASL and BSL" />
      <p className="mt-4 text-[15px] text-ink-2">
        QuranASL explicitly supports two distinct, historically unrelated sign language families:
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Frame withCorners={false} className="p-5 shadow-xs bg-panel">
          <h3 className="font-semibold text-ink text-sm">ASL (American Sign Language)</h3>
          <p className="mt-2 text-xs leading-relaxed text-ink-2">
            Belongs to the French Sign Language (LSF) family. Uses a one-handed manual alphabet. All 6,236 ayat are
            algorithmically glossed in ASL topic-comment order with custom Islamic community signs captured from Global
            Deaf Muslim.
          </p>
        </Frame>
        <Frame withCorners={false} className="p-5 shadow-xs bg-panel">
          <h3 className="font-semibold text-ink text-sm">BSL (British Sign Language)</h3>
          <p className="mt-2 text-xs leading-relaxed text-ink-2">
            Belongs to the BANZSL family (British, Australian, New Zealand Sign Language). Employs a two-handed manual
            alphabet. Grounded directly in time-aligned recordings from the Al Isharah BSL Qur&apos;an Project, retargeted
            onto the 3D avatar.
          </p>
        </Frame>
      </div>

      {/* 5. Data Sources & Provenance */}
      <SectionHeader kicker="5. Data Provenance" title="Sources, Licences &amp; Attributions" />
      <ul className="mt-4 space-y-2.5 text-xs text-ink-2">
        <li className="flex items-start gap-2">
          <span className="font-mono font-semibold text-ink shrink-0">• Quranic Arabic Text:</span>
          <span>Provided by the Quran.com API in standard Uthmani script.</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="font-mono font-semibold text-ink shrink-0">• Morphological Tagging:</span>
          <span>Quranic Arabic Corpus (Kais Dukes, University of Leeds), released under GNU General Public License.</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="font-mono font-semibold text-ink shrink-0">• English Translation:</span>
          <span>Saheeh International, standard contemporary English rendering.</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="font-mono font-semibold text-ink shrink-0">• Human ASL Reference:</span>
          <span>Islamic signs and video footage courtesy of Global Deaf Muslim.</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="font-mono font-semibold text-ink shrink-0">• Human BSL Reference:</span>
          <span>Al Isharah BSL Qur&apos;an Project recordings, retargeted for academic community review.</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="font-mono font-semibold text-ink shrink-0">• Computer Vision:</span>
          <span>MediaPipe Hand Landmark Tracking (Apache 2.0 license), executed entirely on-device.</span>
        </li>
      </ul>

      {/* 6. Academic Citation Block */}
      <SectionHeader kicker="6. Scholarly Citation" title="How to Cite QuranASL" />
      <p className="mt-4 text-[14px] text-ink-2">
        If you utilize the QuranASL corpus, sign dictionary, or kinematic methodology in your research, computational
        linguistics work, or publications, please cite the project using the following citation formats:
      </p>

      {/* BibTeX Frame */}
      <Frame
        withCorners
        withHeader
        headerTitle={
          <span className="font-mono font-semibold uppercase text-brand text-[10px]">
            [BibTeX Citation]
          </span>
        }
        headerAction={<span className="font-mono text-ink-3 text-[10px]">Standard RFC</span>}
        className="mt-4 p-4 shadow-xs bg-panel"
      >
        <pre className="overflow-x-auto text-[11px] font-mono leading-relaxed text-ink-2 pt-2">
{`@misc{quranasl2025,
  title        = {QuranASL: A Digital Sign Language Corpus and Computational Kinematic Model for the Holy Qur'an},
  author       = {{QuranASL Research Initiative and Community Contributors}},
  year         = {2025},
  howpublished = {\\url{https://quranasl.org}},
  note         = {Open Research Edition 2.4; Multimodal ASL/BSL Syntactic Corpus}
}`}
        </pre>
      </Frame>

      {/* APA & Chicago */}
      <div className="mt-4 space-y-3 rounded-xl border border-line bg-panel p-4 text-xs shadow-xs text-ink-2">
        <div>
          <span className="font-mono font-semibold text-ink text-[10px] uppercase block mb-1">APA Style (7th Edition)</span>
          <p className="font-sans leading-relaxed text-ink-3">
            QuranASL Research Initiative. (2025). <em>QuranASL: A digital sign language corpus and computational kinematic
            model for the Holy Qur&apos;an</em> (Version 2.4) [Digital humanities corpus]. https://quranasl.org
          </p>
        </div>
        <div className="border-t border-line/60 pt-2.5">
          <span className="font-mono font-semibold text-ink text-[10px] uppercase block mb-1">Chicago Manual of Style (17th Edition)</span>
          <p className="font-sans leading-relaxed text-ink-3">
            QuranASL Research Initiative. &ldquo;QuranASL: A Digital Sign Language Corpus and Computational Kinematic Model
            for the Holy Qur&apos;an.&rdquo; Digital Corpus and Concordance, 2025. https://quranasl.org.
          </p>
        </div>
      </div>
    </article>
  );
}

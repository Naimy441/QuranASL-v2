export const metadata = { title: "About — QuranASL" };

export default function About() {
  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-8 leading-relaxed">
      <h1 className="text-3xl font-semibold">About QuranASL</h1>
      <p className="mt-4">
        QuranASL renders the meanings of the Qur&apos;an in American Sign Language, ayah by ayah, using a 3D signer driven by a
        parametric sign engine. It is built for Deaf Muslims and learners, and it is designed to be corrected and completed by the
        Deaf community.
      </p>
      <h2 className="mt-8 text-xl font-semibold">How it works</h2>
      <ol className="mt-2 list-decimal space-y-2 pl-6">
        <li><strong>Gloss.</strong> Each ayah is written as an ASL gloss — ASL word order, topic–comment structure, spatial loci, role shift and non-manual markers (eyebrows, head shake, mouth morphemes). Al-Fātiḥah, Juz 28–30, Yā-Sīn, Ar-Raḥmān, Al-Wāqi'ah and Āyat al-Kursī are hand-glossed drafts informed by tafsir; the rest are automatic drafts from the Saheeh International translation and are clearly labelled.</li>
        <li><strong>Signs.</strong> Every gloss maps to a dictionary entry describing handshape, location, palm orientation, movement and facial expression. Unknown words are fingerspelled and flagged as gaps.</li>
        <li><strong>Animation.</strong> Signs are joined into continuous signing with eased transitions (no drop to rest between signs), quaternion slerp for the hands, two-bone inverse kinematics for the arms, and blended facial grammar.</li>
        <li><strong>Review.</strong> In the Gloss Studio, a Deaf reviewer can reorder signs, swap variants, adjust facial grammar or edit the sign itself, and see the result instantly.</li>
      </ol>
      <h2 className="mt-8 text-xl font-semibold">Important limitations</h2>
      <p className="mt-2">
        Nothing here has yet been verified by Deaf ASL translators or scholars. Avatar signing is not a substitute for Deaf
        human translators; it is a scaffold for them. Islamic terms in particular have community signs (Global Deaf Muslim,
        Muhsen) that should replace the drafts here. Please treat this as a work in progress and report problems.
      </p>
      <h2 className="mt-8 text-xl font-semibold">Sources & credits</h2>
      <ul className="mt-2 list-disc space-y-1 pl-6 text-sm">
        <li>Arabic text, word-by-word and Saheeh International translation via the Quran.com API.</li>
        <li>Morphology (roots, lemmas): Quranic Arabic Corpus (Kais Dukes), GPL.</li>
        <li>Human ASL reference videos: Global Deaf Muslim (embedded from YouTube). BSL videos: Qur&apos;an in BSL playlist (embedded).</li>
        <li>Hand tracking: MediaPipe Hand Landmarker (Apache-2.0), run locally in your browser.</li>
      </ul>
      <h2 className="mt-8 text-xl font-semibold">Privacy</h2>
      <p className="mt-2">Camera video in Practice is processed on your device and never stored or transmitted. Edits in the Studio stay in your browser until you export them.</p>
    </article>
  );
}

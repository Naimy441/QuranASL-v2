import Link from "next/link";

export const metadata = { title: "About — QuranASL" };

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-12 text-2xl font-semibold tracking-tight">{children}</h2>;
}

export default function About() {
  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-12 leading-relaxed">
      <p className="text-sm font-semibold uppercase tracking-wider text-accent">About</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight">The Qur&apos;an in sign language</h1>
      <p className="mt-5 text-lg text-ink-2">
        QuranASL renders the meanings of the Qur&apos;an in American Sign Language and British Sign Language, ayah by ayah, using a
        3D signer. It is built for Deaf Muslims and learners, and it is designed to be corrected and completed by the Deaf
        community.
      </p>

      <div className="mt-8 rounded-2xl border border-accent/40 bg-accent-soft p-5 text-sm">
        <strong>Status: a draft for Deaf community review.</strong> Nothing here has yet been verified by Deaf translators or
        scholars. Avatar signing is not a substitute for Deaf human translators; it is a scaffold for them.
      </div>

      <H2>Two sign languages</H2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-line bg-panel p-5">
          <h3 className="font-semibold">ASL — American Sign Language</h3>
          <p className="mt-2 text-sm text-ink-2">
            Every one of the 6,236 ayat is written out as an ASL gloss in ASL word order — topic–comment structure, role shift for
            speakers, facial grammar for questions, negation and awe — working from the Saheeh International translation. Every
            sign in every gloss exists in the dictionary. Islamic terms and the names of the prophets use community signs captured
            from Global Deaf Muslim. None of it has been reviewed by Deaf translators yet.
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-panel p-5">
          <h3 className="font-semibold">BSL — British Sign Language</h3>
          <p className="mt-2 text-sm text-ink-2">
            Where Al Isharah&apos;s BSL Qur&apos;an Project has recorded a surah, each ayah is the human translator&apos;s own
            signing, cut at the ayah and mapped onto the avatar. Signs learned from those recordings form a BSL dictionary that
            drafts the surahs not yet recorded — those drafts are rough and clearly labelled.
          </p>
        </div>
      </div>

      <H2>How the signer works</H2>
      <ol className="mt-4 list-decimal space-y-3 pl-6 text-ink-2">
        <li><strong className="text-ink">Gloss.</strong> Topic–comment structure, spatial loci, role shift and non-manual markers (eyebrows, head shake, mouth morphemes) are written into each ayah&apos;s gloss.</li>
        <li><strong className="text-ink">Signs.</strong> Every gloss maps to a dictionary entry describing handshape, location, palm orientation, movement and facial expression — or to motion captured from a human signer. Unknown words are fingerspelled and flagged.</li>
        <li><strong className="text-ink">Animation.</strong> Signs are joined into continuous signing with eased transitions, quaternion interpolation for the hands, two-bone inverse kinematics for the arms, and blended facial grammar.</li>
        <li><strong className="text-ink">Review.</strong> In the <Link href="/studio" className="text-brand underline">Gloss Studio</Link>, a Deaf reviewer can reorder signs, swap variants, adjust facial grammar or edit the sign itself, and see the result instantly.</li>
      </ol>

      <H2>Accessibility</H2>
      <p className="mt-3 text-ink-2">
        Light, dark and high-contrast themes, a reduce-motion setting, full keyboard control of the player (Space, arrow keys,
        + and −, R, F) and a focus mode that enlarges the signer. Choose them from the appearance menu at the top right.
      </p>

      <H2>Sources &amp; credits</H2>
      <ul className="mt-3 list-disc space-y-1.5 pl-6 text-sm text-ink-2">
        <li>Arabic text, word-by-word and Saheeh International translation via the Quran.com API.</li>
        <li>Morphology (roots, lemmas): Quranic Arabic Corpus (Kais Dukes), GPL.</li>
        <li>Human ASL videos and captured Islamic signs: Global Deaf Muslim.</li>
        <li>Human BSL videos and the BSL motion: Al Isharah&apos;s BSL Qur&apos;an Project.</li>
        <li>Hand tracking: MediaPipe (Apache-2.0), run locally in your browser.</li>
      </ul>
      <p className="mt-3 text-sm text-ink-2">
        Motion derived from Global Deaf Muslim and Al Isharah recordings is used for community review only; it will not be
        published without their permission.
      </p>

      <H2>Privacy</H2>
      <p className="mt-3 text-ink-2">
        Camera video in Practice is processed on your device and never stored or transmitted. Edits in the Studio stay in your
        browser until you export them. Preferences (theme, signer, last ayah read) are kept in your browser&apos;s local storage.
      </p>
    </article>
  );
}

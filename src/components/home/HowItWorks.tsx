import Link from "next/link";
import Reveal from "@/components/common/Reveal";
import { CameraIcon, EditIcon, FaceIcon, HandIcon, LayersIcon, VideoIcon } from "@/components/common/Icons";

const FEATURES = [
  { Icon: HandIcon, title: "Real sign-language grammar", body: "Each ayah is glossed in sign-language word order with topics, spatial references and role shift — not word-for-word English." },
  { Icon: FaceIcon, title: "Facial grammar", body: "Raised brows for questions and topics, head shakes for negation, awe and emphasis — the face carries meaning too." },
  { Icon: LayersIcon, title: "Arabic, English & roots", body: "Follow the Arabic, the Saheeh International translation and a word-by-word breakdown with Quranic roots." },
  { Icon: VideoIcon, title: "Human signers alongside", body: "Where Deaf Muslims have recorded a surah in ASL or BSL, their video sits beside the avatar, cued to the ayah." },
  { Icon: CameraIcon, title: "Practise with your camera", body: "Learn signs with spaced repetition. Hand tracking runs on your device — video never leaves the browser." },
  { Icon: EditIcon, title: "Built for review", body: "Deaf reviewers can fix any gloss or sign in the Studio and see the signer update instantly." },
];

export default function HowItWorks() {
  return (
    <section aria-labelledby="how-heading" className="mx-auto w-full max-w-7xl px-4 pt-20">
      <Reveal className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-wider text-accent">How it works</p>
        <h2 id="how-heading" className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          More than captions. A signer that speaks the language.
        </h2>
      </Reveal>
      <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map(({ Icon, title, body }, i) => (
          <Reveal as="li" key={title} delay={(i % 3) * 90} className="lift rounded-2xl border border-line bg-panel p-6">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-soft text-brand">
              <Icon size={22} />
            </span>
            <h3 className="mt-4 font-semibold text-ink">{title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-2">{body}</p>
          </Reveal>
        ))}
      </ul>
      <Reveal className="mt-6 rounded-2xl border border-accent/40 bg-accent-soft p-5 text-sm leading-relaxed text-ink">
        <strong>A draft for Deaf community review.</strong> No sign or translation here has yet been verified by Deaf translators.
        Signs with a dotted outline are low-confidence; amber ones are fingerspelled because no sign has been added yet.{" "}
        <Link href="/studio" className="font-medium text-brand underline">Help fix them in the Studio</Link>.
      </Reveal>
    </section>
  );
}

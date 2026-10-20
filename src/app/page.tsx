import SurahIndex from "@/components/SurahIndex";

export default function Home() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8">
      <section className="mb-8 grid gap-6 md:grid-cols-[1.4fr_1fr] md:items-center">
        <div>
          <p className="mb-2 text-sm font-medium uppercase tracking-wider text-accent">Ayah by ayah · American Sign Language</p>
          <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">The Qur&apos;an, signed.</h1>
          <p className="mt-3 max-w-2xl text-ink-2">
            Choose a surah to watch a 3D signer render each ayah in ASL — with ASL word order, facial grammar,
            and fingerspelling for names — alongside the Arabic and an English translation. Where Deaf signers have
            recorded a surah, their video sits beside the avatar.
          </p>
          <p className="mt-3 max-w-2xl text-sm text-ink-2">
            Every sign and translation here is a <strong>draft for Deaf community review</strong>. Signs marked with a dotted
            outline are low-confidence; amber ones are fingerspelled because no sign has been added yet.
            Help fix them in the <a className="text-brand underline" href="/studio">Gloss Studio</a>.
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-panel p-4 text-sm">
          <h2 className="mb-2 font-semibold">Coverage</h2>
          <ul className="space-y-1.5 text-ink-2">
            <li><span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-ok" />Hand-glossed ASL: Al-Fātiḥah, Juz 28–30 (58–114), Yā-Sīn, Ar-Raḥmān, Al-Wāqi'ah, Āyat al-Kursī</li>
            <li><span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-accent" />Automatic draft gloss: all other surahs</li>
            <li><span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-brand" />Human ASL video (Global Deaf Muslim): 1, 100–114</li>
            <li><span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-ink-2" />Human BSL video: 1, 36, 67–114</li>
          </ul>
        </div>
      </section>
      <SurahIndex />
    </div>
  );
}

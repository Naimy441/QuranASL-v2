import SurahViewer from "@/components/viewer/SurahViewer";

export function generateStaticParams() {
  return Array.from({ length: 114 }, (_, i) => ({ n: String(i + 1) }));
}

export default async function SurahPage({ params }: PageProps<"/surah/[n]">) {
  const { n } = await params;
  return <SurahViewer n={Math.min(114, Math.max(1, parseInt(n) || 1))} />;
}

import type { Metadata } from "next";
import { Inter, Amiri } from "next/font/google";
import "./globals.css";
import SiteNav from "@/components/SiteNav";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const amiri = Amiri({ variable: "--font-amiri", subsets: ["arabic"], weight: ["400", "700"] });

export const metadata: Metadata = {
  title: "QuranASL — The Qur'an in American Sign Language",
  description: "Ayah-by-ayah American Sign Language rendering of the Qur'an with a 3D signing avatar, human reference videos, practice and a community review studio.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${amiri.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-panel focus:p-2">
          Skip to content
        </a>
        <SiteNav />
        <main id="main" className="flex-1 flex flex-col">{children}</main>
      </body>
    </html>
  );
}

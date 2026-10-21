import type { Metadata, Viewport } from "next";
import { Inter, Amiri } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import { APPEARANCE_BOOT_SCRIPT } from "@/lib/appearance-boot";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const amiri = Amiri({ variable: "--font-amiri", subsets: ["arabic"], weight: ["400", "700"] });
const uthmanicHafs = localFont({
  src: "../fonts/UthmanicHafs1Ver18.ttf",
  variable: "--font-uthmanic",
  display: "swap",
});

export const metadata: Metadata = {
  title: "QuranASL — The Qur'an in sign language",
  description:
    "The meanings of the Qur'an in American and British Sign Language, ayah by ayah, signed by a 3D avatar — with the Arabic, an English translation, human signer videos, practice and a community review studio.",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f4ee" },
    { media: "(prefers-color-scheme: dark)", color: "#0c1317" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${amiri.variable} ${uthmanicHafs.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: APPEARANCE_BOOT_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:rounded-lg focus:bg-panel focus:px-3 focus:py-2 focus:shadow-lift"
        >
          Skip to content
        </a>
        <SiteNav />
        <main id="main" className="flex flex-1 flex-col">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}

"use client";

import dynamic from "next/dynamic";

// Client-only entry points for pages that depend on WebGL, camera or localStorage.
export const PracticeClient = dynamic(() => import("@/components/practice/Practice"), { ssr: false });
export const StudioClient = dynamic(() => import("@/components/studio/Studio"), { ssr: false });
export const DictionaryClient = dynamic(() => import("@/components/dictionary/Dictionary"), { ssr: false });

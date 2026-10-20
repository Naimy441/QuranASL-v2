"use client";
import { useEffect, useState } from "react";

/** URL search params, available only after mount (avoids SSR hydration mismatch). */
export function useClientQuery(): URLSearchParams | null {
  const [q, setQ] = useState<URLSearchParams | null>(null);
  useEffect(() => {
    const update = () => setQ(new URLSearchParams(window.location.search));
    update();
    window.addEventListener("popstate", update);
    return () => window.removeEventListener("popstate", update);
  }, []);
  return q;
}

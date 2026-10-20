"use client";
import { useEffect, useState } from "react";
import { loadAllMocap } from "../asl/mocap";

/** Loads captured community signs once; returns true when they are available. */
export function useMocapReady(): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let live = true;
    loadAllMocap().then(() => live && setReady(true));
    return () => {
      live = false;
    };
  }, []);
  return ready;
}

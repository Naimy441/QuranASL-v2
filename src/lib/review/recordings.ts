"use client";

import type { Recording, RecordingMeta } from "./types";

// Proposed sign recordings (video + hand landmarks) are too large for
// localStorage, so they live in IndexedDB until exported.

const DB = "qasl-recordings";
const STORE = "recordings";

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => {
      const s = req.result.createObjectStore(STORE, { keyPath: "id" });
      s.createIndex("sign", "sign");
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx<T>(mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return open().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(STORE, mode);
        const req = run(t.objectStore(STORE));
        t.oncomplete = () => {
          db.close();
          resolve(req.result);
        };
        t.onerror = () => reject(t.error);
      }),
  );
}

const listeners = new Set<() => void>();
export const onRecordingsChange = (cb: () => void) => {
  listeners.add(cb);
  return () => void listeners.delete(cb);
};
const changed = () => listeners.forEach((l) => l());

export async function saveRecording(r: Recording) {
  await tx("readwrite", (s) => s.put(r));
  changed();
}
export async function deleteRecording(id: string) {
  await tx("readwrite", (s) => s.delete(id));
  changed();
}
export const getRecording = (id: string) => tx<Recording | undefined>("readonly", (s) => s.get(id));
export const allRecordings = () => tx<Recording[]>("readonly", (s) => s.getAll()).catch(() => [] as Recording[]);
export const recordingsFor = (sign: string) => tx<Recording[]>("readonly", (s) => s.index("sign").getAll(sign)).catch(() => [] as Recording[]);

export function meta(r: Recording): RecordingMeta {
  const { frames: _f, video: _v, ...m } = r;
  return m;
}

export function blobToDataURL(b: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result as string);
    fr.onerror = () => reject(fr.error);
    fr.readAsDataURL(b);
  });
}
export async function dataURLToBlob(u: string): Promise<Blob> {
  return (await fetch(u)).blob();
}

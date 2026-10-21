// Learn natural-motion parameters from every retargeted human clip (GDM community
// signs, prophet names, BSL ayat, plus any QA clips) and write them to
// src/lib/avatar/learned.json for the parametric engine:
//
//   elbow   — elbow swivel as a smooth function of wrist position relative to the
//             shoulder (least-squares quadratic, right-hand frame; left is mirrored)
//   shapes  — for every dictionary handshape, the median captured pose of hand
//             frames that are held still and closest to it (how real hands form it)
//   timing  — distribution of movement durations and peak speeds between holds
//
// usage: npx tsx scripts/learn/motion-stats.ts [--report]
import fs from "node:fs";
import path from "node:path";
import { HANDSHAPES } from "../../src/lib/asl/handshapes";
import { BODY } from "../../src/lib/asl/body";
import type { MocapClip } from "../../src/lib/asl/mocap";

const report = process.argv.includes("--report");
const clips: MocapClip[] = [];
const mdir = "public/data/mocap";
for (const f of fs.readdirSync(mdir)) if (f.endsWith(".json") && f !== "index.json") clips.push(JSON.parse(fs.readFileSync(path.join(mdir, f), "utf8")));
const bdir = "public/data/bsl/ayat";
if (fs.existsSync(bdir))
  for (const f of fs.readdirSync(bdir))
    if (f.endsWith(".json") && f !== "index.json") for (const c of Object.values(JSON.parse(fs.readFileSync(path.join(bdir, f), "utf8"))) as MocapClip[]) clips.push(c);
const qdir = "public/data/_qa";
if (fs.existsSync(qdir)) for (const f of fs.readdirSync(qdir)) if (f.endsWith(".json")) clips.push(JSON.parse(fs.readFileSync(path.join(qdir, f), "utf8")));
console.log("clips", clips.length);

// ---------------------------------------------------------------- elbow swivel
// features in the right-hand frame: u = (out, up, fwd) of the wrist from the shoulder, in arm lengths
const ARM = BODY.upperArm + BODY.forearm;
const feats = (u: number[]) => [1, u[0], u[1], u[2], u[0] * u[0], u[1] * u[1], u[2] * u[2], u[0] * u[1], u[0] * u[2], u[1] * u[2]];
const X: number[][] = [], Y: number[] = [];
// speeds (for timing) and held hand shapes
const held: number[][] = [];
const moveDur: number[] = [], peakSpeed: number[] = [];
/** [distance, duration] of movements in 30 fps captures (BSL is 12.5 fps: too coarse for timing) */
const fitts: [number, number][] = [];
for (const c of clips) {
  const dt = 1 / c.fps;
  for (const side of ["R", "L"] as const) {
    const rows = c[side];
    if (!rows || rows.length < 5) continue;
    const m = side === "R" ? 1 : -1; // mirror the left arm into the right-hand frame
    const sx = side === "R" ? -BODY.shoulder.x : BODY.shoulder.x;
    const speed = rows.map((r, i) => {
      const a = rows[Math.max(0, i - 1)], b = rows[Math.min(rows.length - 1, i + 1)];
      return Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) / (dt * (Math.min(rows.length - 1, i + 1) - Math.max(0, i - 1)));
    });
    rows.forEach((r, i) => {
      if (r.length > 28 && r[1] > 1.05) {
        // only hands in signing space: resting hands say nothing about signing arms
        const u = [((r[0] - sx) * -m) / ARM, (r[1] - BODY.shoulder.y) / ARM, (r[2] - BODY.shoulder.z) / ARM];
        X.push(feats(u));
        Y.push(r[28] * m);
      }
      if (speed[i] < 0.08 && r[1] > 1.05) held.push(r.slice(7, 28));
    });
    // movements: runs of frames above 0.25 m/s between slower frames
    let start = -1, peak = 0;
    speed.forEach((s, i) => {
      if (s > 0.25 && start < 0) {
        start = i;
        peak = 0;
      }
      if (start >= 0) peak = Math.max(peak, s);
      if (start >= 0 && (s < 0.12 || i === speed.length - 1)) {
        const d = (i - start) * dt;
        if (d > 0.06 && d < 1.2 && c.fps >= 24) {
          moveDur.push(d);
          peakSpeed.push(peak);
          const a = rows[start], b = rows[i];
          fitts.push([Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]), d]);
        }
        start = -1;
      }
    });
  }
}

/** Ridge-regularised least squares via normal equations (Gaussian elimination). */
function lsq(A: number[][], b: number[], lambda = 1e-3) {
  const n = A[0].length;
  const M = Array.from({ length: n }, () => new Array(n + 1).fill(0));
  for (let r = 0; r < A.length; r++) {
    const a = A[r];
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) M[i][j] += a[i] * a[j];
      M[i][n] += a[i] * b[r];
    }
  }
  for (let i = 1; i < n; i++) M[i][i] += lambda * A.length;
  for (let i = 0; i < n; i++) {
    let p = i;
    for (let k = i + 1; k < n; k++) if (Math.abs(M[k][i]) > Math.abs(M[p][i])) p = k;
    [M[i], M[p]] = [M[p], M[i]];
    for (let k = i + 1; k < n; k++) {
      const f = M[k][i] / M[i][i];
      for (let j = i; j <= n; j++) M[k][j] -= f * M[i][j];
    }
  }
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let s = M[i][n];
    for (let j = i + 1; j < n; j++) s -= M[i][j] * x[j];
    x[i] = s / M[i][i];
  }
  return x;
}

// robust fit: refit after dropping the worst 10% residuals (tracking glitches)
let coef = lsq(X, Y);
const pred = (f: number[]) => f.reduce((s, v, i) => s + v * coef[i], 0);
const res = X.map((f, i) => Math.abs(pred(f) - Y[i]));
const cut = [...res].sort((a, b) => a - b)[Math.floor(res.length * 0.9)];
const keep = res.map((r) => r <= cut);
coef = lsq(X.filter((_, i) => keep[i]), Y.filter((_, i) => keep[i]));
const rmse = Math.sqrt(X.reduce((s, f, i) => s + (pred(f) - Y[i]) ** 2, 0) / X.length);
const sd = Math.sqrt(Y.reduce((s, y) => s + y * y, 0) / Y.length - (Y.reduce((s, y) => s + y, 0) / Y.length) ** 2);
console.log(`elbow swivel: ${X.length} frames, rmse ${(rmse * 57.3).toFixed(1)}° (raw sd ${(sd * 57.3).toFixed(1)}°)`);

// ---------------------------------------------------------------- handshapes
const names = Object.keys(HANDSHAPES).filter((n) => n !== "relaxed");
const flat = (n: string) => {
  const h = HANDSHAPES[n];
  return [...h.i, ...h.m, ...h.r, ...h.p, ...h.t];
};
// joint weights: flexion matters most, spread and thumb roll less
const W = [1, 1, 0.6, 0.4, 1, 1, 0.6, 0.4, 1, 1, 0.6, 0.4, 1, 1, 0.6, 0.4, 0.5, 0.5, 0, 0.5, 0.4];
const dist = (a: number[], b: number[]) => Math.sqrt(a.reduce((s, v, i) => s + W[i] * (v - b[i]) ** 2, 0) / 13);
const groups: Record<string, number[][]> = {};
for (const h of held) {
  let best = "", bd = Infinity;
  for (const n of names) {
    const d = dist(h, flat(n));
    if (d < bd) {
      bd = d;
      best = n;
    }
  }
  if (bd < 18) (groups[best] ??= []).push(h); // within ~18° RMS of the template
}
const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
};
const shapes: Record<string, { n: number; median: number[] }> = {};
for (const [n, g] of Object.entries(groups)) {
  if (g.length < 40) continue;
  shapes[n] = { n: g.length, median: g[0].map((_, j) => Math.round(median(g.map((x) => x[j])) * 10) / 10) };
}
console.log(`held frames ${held.length}; handshapes with captured examples: ${Object.keys(shapes).length}`);
if (report)
  for (const [n, s] of Object.entries(shapes).sort((a, b) => b[1].n - a[1].n))
    console.log(n.padEnd(8), String(s.n).padStart(6), "template", flat(n).map((x) => Math.round(x)).join(" "), "\n         captured", s.median.map((x) => Math.round(x)).join(" "));

// ---------------------------------------------------------------- timing
const pct = (xs: number[], p: number) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length * p)];
// movement time = a + b * distance (least squares)
const fx = fitts.map(([d]) => [1, d]), fy = fitts.map(([, t]) => t);
const [fa, fb] = lsq(fx, fy, 0);
const timing = {
  fitts: { a: +fa.toFixed(3), b: +fb.toFixed(3), n: fitts.length },
  n: moveDur.length,
  dur: [0.1, 0.25, 0.5, 0.75, 0.9].map((p) => +pct(moveDur, p).toFixed(3)),
  peak: [0.1, 0.25, 0.5, 0.75, 0.9].map((p) => +pct(peakSpeed, p).toFixed(3)),
};
console.log("movements", timing);

// generic relaxation: how far captured joints sit from textbook "straight" and "curled", per joint
// (MCP, PIP, DIP), for shapes without enough captured examples of their own
const relax: Record<string, number[]> = { ext: [0, 0, 0], curl: [0, 0, 0] };
const cnt: Record<string, number[]> = { ext: [0, 0, 0], curl: [0, 0, 0] };
for (const [n, sh] of Object.entries(shapes)) {
  const t = flat(n);
  for (let f = 0; f < 4; f++)
    for (let j = 0; j < 3; j++) {
      const k = f * 4 + j, cls = t[k] < 10 ? "ext" : t[k] > 80 ? "curl" : null;
      if (!cls) continue;
      relax[cls][j] += (sh.median[k] - t[k]) * sh.n;
      cnt[cls][j] += sh.n;
    }
}
for (const c of ["ext", "curl"]) relax[c] = relax[c].map((v, j) => +(v / (cnt[c][j] || 1)).toFixed(1));
console.log("generic relaxation (captured - template, deg) MCP/PIP/DIP", relax);

const out = {
  note: "Generated by scripts/learn/motion-stats.ts from retargeted human signing. Do not edit by hand.",
  elbow: { features: "1,x,y,z,xx,yy,zz,xy,xz,yz of wrist-from-shoulder (out, up, fwd) in arm lengths, right-hand frame", coef: coef.map((c) => +c.toFixed(5)), rmseDeg: +(rmse * 57.3).toFixed(1), frames: X.length },
  shapes,
  relax,
  timing,
};
fs.writeFileSync("src/lib/avatar/learned.json", JSON.stringify(out, null, 1));
console.log("wrote src/lib/avatar/learned.json");

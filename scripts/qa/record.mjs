// Record a lab page to MP4 by stepping playback time (deterministic, any machine speed).
// usage: BASE=http://localhost:3000 node scripts/qa/record.mjs "<lab path>" out.mp4 [w] [h] [label]
import puppeteer from "puppeteer-core";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
const [p, out, w = "480", h = "520", label = ""] = process.argv.slice(2);
const base = process.env.BASE ?? "http://localhost:3000";
const browser = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: "new", args: ["--use-angle=metal", "--ignore-gpu-blocklist"] });
const page = await browser.newPage();
await page.setViewport({ width: +w, height: +h });
await page.goto(base + p + (p.includes("?") ? "&" : "?") + "bare=1&t=0", { waitUntil: "networkidle2", timeout: 180000 });
await page.waitForFunction("window.__pb && window.__tl", { timeout: 120000 });
await new Promise((r) => setTimeout(r, 2500));
const dur = await page.evaluate(() => window.__tl.dur);
const dir = fs.mkdtempSync(path.join(path.dirname(out), "rec-"));
let i = 0;
for (let t = 0; t <= dur; t += 1 / 30) {
  await page.evaluate((x) => { window.__pb.playing = false; window.__pb.time = x; }, t);
  await new Promise((r) => setTimeout(r, 40));
  await page.screenshot({ path: path.join(dir, `f${String(i++).padStart(5, "0")}.png`) });
}
const vf = label ? `drawtext=text='${label}':x=10:y=10:fontsize=20:fontcolor=black:box=1:boxcolor=white@0.75` : "null";
execFileSync("ffmpeg", ["-v", "error", "-y", "-framerate", "30", "-i", path.join(dir, "f%05d.png"), "-vf", vf, "-pix_fmt", "yuv420p", "-c:v", "libx264", "-crf", "20", out]);
fs.rmSync(dir, { recursive: true });
await browser.close();
console.log("saved", out, i, "frames", dur.toFixed(2) + "s");

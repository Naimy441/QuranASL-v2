// Capture a strip of frames of a lab page at several times and tile them.
// usage: node scripts/frames.mjs "<url-path>" out.png "0.3,0.6,0.9" [w] [h] [cols]
import puppeteer from "puppeteer-core";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
const [p, out, times, w = "520", h = "560", cols] = process.argv.slice(2);
const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new",
  args: ["--use-angle=metal", "--enable-webgl", "--ignore-gpu-blocklist"],
});
const page = await browser.newPage();
await page.setViewport({ width: +w, height: +h });
const errs = [];
page.on("pageerror", (e) => errs.push(String(e)));
page.on("console", (m) => { if (m.type() === "error") errs.push(m.text().slice(0, 300)); });
const sep = p.includes("?") ? "&" : "?";
await page.goto("http://localhost:3000" + p + sep + "bare=1&t=0", { waitUntil: "networkidle2", timeout: 120000 });
await page.waitForFunction("window.__pb", { timeout: 60000 }).catch(() => {});
await new Promise((r) => setTimeout(r, 1500));
let ts = times === "auto"
  ? await page.evaluate(() => { const d = window.__tl?.dur ?? 2; return Array.from({ length: 8 }, (_, i) => +(0.3 + (i * (d - 0.6)) / 7).toFixed(2)); })
  : times.split(",").map(Number);
const dir = fs.mkdtempSync(path.join(path.dirname(out), "fr-"));
const files = [];
for (const [i, t] of ts.entries()) {
  await page.evaluate((t) => { window.__pb.playing = false; window.__pb.time = t; }, t);
  await new Promise((r) => setTimeout(r, 250));
  const f = path.join(dir, `f${String(i).padStart(2, "0")}.png`);
  await page.screenshot({ path: f });
  // stamp time
  execFileSync("ffmpeg", ["-v", "error", "-y", "-i", f, "-vf", `drawtext=text='t=${t}':x=8:y=8:fontsize=18:fontcolor=black`, f + ".png"]);
  files.push(f + ".png");
}
const c = +(cols ?? Math.min(files.length, 4));
const rows = Math.ceil(files.length / c);
const inputs = files.flatMap((f) => ["-i", f]);
const layout = files.map((_, i) => `${(i % c) * +w}_${Math.floor(i / c) * +h}`).join("|");
execFileSync("ffmpeg", ["-v", "error", "-y", ...inputs, "-filter_complex", `xstack=inputs=${files.length}:layout=${layout}:fill=white`, out]);
fs.rmSync(dir, { recursive: true });
if (errs.length) console.log("ERRORS:\n" + [...new Set(errs)].slice(0, 6).join("\n"));
console.log("saved", out, "times", ts.join(","), rows, "rows");
await browser.close();

// Render a grid of signs (each captured at 35% and 75% of its duration) for visual QA.
// usage: node scripts/qa-signs.mjs out.png SIGN1 SIGN2 ...   (max ~12 signs)
import puppeteer from "puppeteer-core";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
let [out, ...signs] = process.argv.slice(2);
let lang = "asl";
if (signs[0] === "--lang") { lang = signs[1]; signs = signs.slice(2); }
const W = 300, H = 330;
const browser = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: "new", args: ["--use-angle=metal", "--ignore-gpu-blocklist"] });
const page = await browser.newPage();
await page.setViewport({ width: W, height: H });
const gloss = signs.join(" // ");
await page.goto(`http://localhost:3000/lab/sign?bare=1&t=0&lang=${lang}&gloss=${encodeURIComponent(gloss)}`, { waitUntil: "networkidle2", timeout: 120000 });
await page.waitForFunction("window.__tl && window.__tl.items", { timeout: 60000 });
await new Promise((r) => setTimeout(r, 2500)); // allow mocap to load
const items = await page.evaluate(() => window.__tl.items.filter((i) => i.kind !== "pause").map((i) => ({ l: i.label, s: i.start, e: i.end })));
const dir = fs.mkdtempSync(path.join(path.dirname(out), "qa-"));
const files = [];
for (const [k, it] of items.entries()) {
  for (const f of [0.35, 0.75]) {
    const t = it.s + (it.e - it.s) * f;
    await page.evaluate((t) => { window.__pb.playing = false; window.__pb.time = t; }, t);
    await new Promise((r) => setTimeout(r, 200));
    const p = path.join(dir, `${String(k).padStart(2, "0")}-${f}.png`);
    await page.screenshot({ path: p });
    execFileSync("ffmpeg", ["-v", "error", "-y", "-i", p, "-vf", `drawtext=text='${it.l} ${Math.round(f * 100)}pc':x=6:y=6:fontsize=16:fontcolor=black:box=1:boxcolor=white@0.7`, p + ".png"]);
    files.push(p + ".png");
  }
}
const cols = 6;
const layout = files.map((_, i) => `${(i % cols) * W}_${Math.floor(i / cols) * H}`).join("|");
execFileSync("ffmpeg", ["-v", "error", "-y", ...files.flatMap((f) => ["-i", f]), "-filter_complex", `xstack=inputs=${files.length}:layout=${layout}:fill=white`, out]);
fs.rmSync(dir, { recursive: true });
await browser.close();
console.log("saved", out, items.length, "signs");

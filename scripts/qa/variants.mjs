// Render one lab URL at fixed times under several JS-global variants (for A/B debugging).
// usage: node scripts/qa/variants.mjs "<path>" out.png "t1,t2" '{"name": "js expr", ...}'
import puppeteer from "puppeteer-core";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
const [p, out, times, variantsJson] = process.argv.slice(2);
const variants = JSON.parse(variantsJson);
const W = 360, H = 400;
const browser = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: "new", args: ["--use-angle=metal", "--ignore-gpu-blocklist"] });
const page = await browser.newPage();
await page.setViewport({ width: W, height: H });
await page.goto("http://localhost:3000" + p + (p.includes("?") ? "&" : "?") + "bare=1&t=0", { waitUntil: "networkidle2", timeout: 120000 });
await page.waitForFunction("window.__pb", { timeout: 60000 });
await new Promise((r) => setTimeout(r, 1500));
const dir = fs.mkdtempSync(path.join(path.dirname(out), "var-"));
const files = [];
for (const [name, expr] of Object.entries(variants))
  for (const t of times.split(",").map(Number)) {
    await page.evaluate((e, x) => { eval(e); window.__pb.playing = false; window.__pb.time = x; }, expr, t);
    await new Promise((r) => setTimeout(r, 250));
    const f = path.join(dir, `${files.length}.png`);
    await page.screenshot({ path: f });
    execFileSync("ffmpeg", ["-v", "error", "-y", "-i", f, "-vf", `drawtext=text='${name} t=${t}':x=6:y=6:fontsize=16:fontcolor=black:box=1:boxcolor=white@0.7`, f + ".png"]);
    files.push(f + ".png");
  }
const cols = times.split(",").length;
const layout = files.map((_, i) => `${(i % cols) * W}_${Math.floor(i / cols) * H}`).join("|");
execFileSync("ffmpeg", ["-v", "error", "-y", ...files.flatMap((f) => ["-i", f]), "-filter_complex", `xstack=inputs=${files.length}:layout=${layout}:fill=white`, out]);
fs.rmSync(dir, { recursive: true });
await browser.close();
console.log("saved", out);

// Side-by-side QA: source video frame next to the avatar playing the retargeted clip at the same instant.
// usage: node scripts/qa/compare.mjs <video.mp4> </data/_qa/clip.json> out.png "t1,t2,..." [cols]
//   times are seconds into the clip (0 = clip.seg[0] in the video)
import puppeteer from "puppeteer-core";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const [video, clipUrl, out, times, cols = "4"] = process.argv.slice(2);
const W = 360, H = 400;
const clip = JSON.parse(fs.readFileSync(path.join("public", clipUrl), "utf8"));
const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new",
  args: ["--use-angle=metal", "--enable-webgl", "--ignore-gpu-blocklist"],
});
const page = await browser.newPage();
await page.setViewport({ width: W, height: H });
await page.goto(`http://localhost:3000/lab/sign?bare=1&t=0&clip=${encodeURIComponent(clipUrl)}`, { waitUntil: "networkidle2", timeout: 120000 });
await page.waitForFunction("window.__tl && window.__tl.items && window.__tl.items[0]?.label === 'BSL'", { timeout: 60000 });
await new Promise((r) => setTimeout(r, 1200));
const start = await page.evaluate(() => window.__tl.items[0].start);
const dir = fs.mkdtempSync(path.join(path.dirname(out), "cmp-"));
const files = [];
for (const [i, t] of times.split(",").map(Number).entries()) {
  await page.evaluate((x) => { window.__pb.playing = false; window.__pb.time = x; }, start + t);
  await new Promise((r) => setTimeout(r, 250));
  const a = path.join(dir, `a${i}.png`), v = path.join(dir, `v${i}.png`), c = path.join(dir, `c${i}.png`);
  await page.screenshot({ path: a });
  const vt = clip.seg[0] + t;
  execFileSync("ffmpeg", ["-v", "error", "-y", "-ss", String(vt), "-i", video, "-frames:v", "1", "-vf", `scale=-1:${H},crop=${W}:${H}`, v]);
  execFileSync("ffmpeg", ["-v", "error", "-y", "-i", v, "-i", a, "-filter_complex", `hstack,drawtext=text='t=${t.toFixed(2)}':x=8:y=${H - 26}:fontsize=18:fontcolor=white:box=1:boxcolor=black@0.6`, c]);
  files.push(c);
}
const k = Math.min(files.length, +cols);
const layout = files.map((_, i) => `${(i % k) * W * 2}_${Math.floor(i / k) * H}`).join("|");
execFileSync("ffmpeg", ["-v", "error", "-y", ...files.flatMap((f) => ["-i", f]), "-filter_complex", `xstack=inputs=${files.length}:layout=${layout}:fill=white`, out]);
fs.rmSync(dir, { recursive: true });
await browser.close();
console.log("saved", out);

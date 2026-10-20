// Headless screenshot helper for visual checks.
// usage: node scripts/shot.mjs <url-path> <out.png> [width] [height] [waitMs] [evalJs]
import puppeteer from "puppeteer-core";
const [path, out, w = "1400", h = "900", wait = "2500", js] = process.argv.slice(2);
const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new",
  args: ["--use-angle=metal", "--enable-webgl", "--ignore-gpu-blocklist"],
});
const page = await browser.newPage();
await page.setViewport({ width: +w, height: +h, deviceScaleFactor: 1 });
const errs = [];
page.on("pageerror", (e) => errs.push(String(e)));
page.on("console", (m) => { if (m.type() === "error") errs.push(m.text().slice(0, 300)); });
await page.goto("http://localhost:3000" + path, { waitUntil: "networkidle2", timeout: 120000 });
await new Promise((r) => setTimeout(r, +wait));
if (js) { await page.evaluate(js); await new Promise((r) => setTimeout(r, 800)); }
await page.screenshot({ path: out });
if (errs.length) console.log("ERRORS:\n" + [...new Set(errs)].slice(0, 8).join("\n"));
await browser.close();
console.log("saved", out);

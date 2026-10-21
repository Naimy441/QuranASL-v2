// One screenshot of a page, printing page errors.  node scripts/snap.mjs "<url-path>" out.png [w] [h] [waitMs] [colorScheme]
import puppeteer from "puppeteer-core";
const [p, out, w = "900", h = "700", wait = "4000", scheme] = process.argv.slice(2);
const base = process.env.BASE ?? "http://localhost:3000";
const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new",
  args: ["--use-angle=metal", "--enable-webgl", "--ignore-gpu-blocklist"],
});
const page = await browser.newPage();
await page.setViewport({ width: +w, height: +h, deviceScaleFactor: 1 });
// LS='{"key":"json"}' seeds localStorage before the page loads
if (process.env.LS) await page.evaluateOnNewDocument((ls) => { for (const [k, v] of Object.entries(JSON.parse(ls))) localStorage.setItem(k, v); }, process.env.LS);
if (scheme) await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: scheme }]);
page.on("pageerror", (e) => console.log("pageerror:", String(e).slice(0, 400)));
page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") console.log(m.type() + ":", m.text().slice(0, 300)); });
await page.goto(base + p, { waitUntil: "networkidle2", timeout: 120000 });
await new Promise((r) => setTimeout(r, +wait));
await page.screenshot({ path: out });
await browser.close();

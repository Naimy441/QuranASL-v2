// Headless end-to-end test of Practice: a video file is fed as the webcam.
import puppeteer from "puppeteer-core";
const [y4m, out] = process.argv.slice(2);
const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new",
  args: ["--use-angle=metal", "--ignore-gpu-blocklist", "--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream", `--use-file-for-fake-video-capture=${y4m}`],
});
const page = await browser.newPage();
await page.setViewport({ width: 1400, height: 950 });
const logs = [];
page.on("console", (m) => logs.push(m.type() + ": " + m.text().slice(0, 200)));
page.on("pageerror", (e) => logs.push("pageerror: " + e));
await page.goto("http://localhost:3000/practice", { waitUntil: "networkidle2" });
await page.waitForSelector("select");
await page.select("select", "fatihah");
await new Promise((r) => setTimeout(r, 1500));
const btn = await page.$$("button");
for (const b of btn) if ((await b.evaluate((e) => e.textContent)) === "Start camera") await b.click();
await new Promise((r) => setTimeout(r, 12000));
await page.screenshot({ path: out });
const status = await page.evaluate(() => document.querySelector('[aria-live="polite"]')?.textContent);
console.log("status:", status, JSON.stringify(await page.evaluate(() => window.__practice)));
console.log(logs.filter((l) => /error|fail/i.test(l)).slice(0, 10).join("\n"));
await browser.close();

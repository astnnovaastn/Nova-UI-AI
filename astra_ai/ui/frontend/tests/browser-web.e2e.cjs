// AEGIS Web's source browser after the desktop work: still an iframe where the site permits it,
// still an honest refusal plus the Source Reader where it does not. Needs AEGIS running on 5173.
// Usage: node tests/browser-web.e2e.cjs ["<library search>"]
const { openSourceFromControl } = require("./source-browser-control.cjs");
const { chromium } = require("@playwright/test");

const [search = "offshore wind"] = process.argv.slice(2);
const results = [];
const check = (name, ok, detail = "") => {
  results.push(!!ok);
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail !== "" ? "  (" + String(detail).slice(0, 200) + ")" : ""}`);
};

(async () => {
  const browser = await chromium.launch({ channel: "msedge" });
  const context = await browser.newContext({ viewport: { width: 1600, height: 950 } });
  await context.addInitScript(() => { try { sessionStorage.setItem("nova-current-workspace", "research"); } catch {} });
  const page = await context.newPage();
  const errors = [];
  // A framed site's own script failing against the sandbox is that site's error, not AEGIS's.
  page.on("pageerror", (e) => /document is sandboxed/.test(String(e)) || errors.push(String(e).slice(0, 200)));
  await page.goto("http://127.0.0.1:5173/", { waitUntil: "load", timeout: 60000 });
  await page.waitForSelector(".aegis-work-stage", { timeout: 40000 });
  check("T1 AEGIS Web loads in a browser", true);
  check("No desktop bridge in a browser", (await page.evaluate(() => typeof window.aegisDesktop)) === "undefined");
  await page.click('.aegis-work-stage button[aria-label="Research library"]');
  await page.locator('#research-history-panel input[type="search"]').fill(search);
  await page.locator("#research-history-panel .rh-row").filter({ hasText: new RegExp(search, "i") }).first().click({ timeout: 20000 });
  if (await page.locator("#research-history-panel").isVisible()) await page.keyboard.press("Escape");
  await page.waitForSelector(".svelte-flow__node", { timeout: 40000 });
  await page.waitForTimeout(3000);

  const openSource = (url, title) => openSourceFromControl(page, url, title);
  await openSource("https://en.wikipedia.org/wiki/Offshore_wind_power", "Offshore wind power");
  await page.waitForSelector('[data-mode="iframe-live"]', { timeout: 30000 });
  check("A site that permits framing opens live in an iframe", (await page.locator('[data-mode="iframe-live"] iframe').count()) === 1);
  check("The iframe stays sandboxed", (await page.locator('[data-mode="iframe-live"] iframe').getAttribute("sandbox")) === "allow-scripts allow-forms");
  check("No native pane in a browser", (await page.locator('[data-mode="native-live"]').count()) === 0);

  await openSource("https://deepmind.google/", "Google DeepMind");
  await page.waitForSelector('.pane [data-mode="unavailable"]', { timeout: 30000 });
  const words = await page.locator('.pane [data-mode="unavailable"]').last().innerText();
  check("T14 A site that refuses framing is reported as such", /doesn't allow being shown inside other apps/.test(words), words);
  await page.locator('.pane [data-mode="unavailable"] button:has-text("Source Reader")').last().click();
  await page.waitForSelector('[data-mode="source-reader"]', { timeout: 30000 });
  check("T14 The Source Reader is offered, labelled as retrieved text", /Source Reader/.test(await page.locator('[data-mode="source-reader"]').last().innerText()));
  check("No page errors", !errors.length, errors.join(" | "));
  console.log(`\n${results.filter(Boolean).length}/${results.length} passed.`);
  await browser.close();
  process.exit(results.every(Boolean) ? 0 : 1);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});

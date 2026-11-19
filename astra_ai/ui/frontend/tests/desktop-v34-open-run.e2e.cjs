// V34: opens a saved developer run in AEGIS Desktop (its own profile) and screenshots it; checks that the code card
// numbers lines from the excerpt's real first line and shows the file path. No model spend.
// Usage: node tests/desktop-v34-open-run.e2e.cjs <research id> <output png> [first line] [path]
const fs = require("fs");
const os = require("os");
const path = require("path");
const { _electron: electron } = require("@playwright/test");

const [id, png, firstLine = "", filePath = ""] = process.argv.slice(2);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const frontend = path.resolve(__dirname, "..");
  const app = await electron.launch({ args: [path.join(frontend, "desktop", "main.cjs")], cwd: frontend,
    env: { ...process.env, AEGIS_DESKTOP_USER_DATA: fs.mkdtempSync(path.join(os.tmpdir(), "aegis-v34-open-")) } });
  let ok = false;
  try {
    const page = await app.firstWindow();
    for (let i = 0; i < 200 && !(await page.evaluate(() => location.href.startsWith("http")).catch(() => false)); i++) await wait(300);
    await page.evaluate(() => sessionStorage.setItem("nova-current-workspace", "research"));
    await page.reload({ waitUntil: "load" });
    await page.waitForSelector(".aegis-work-stage", { timeout: 60000 });
    await wait(3000);
    await page.evaluate((research_id) => window.dispatchEvent(new CustomEvent("nova-open-research", { detail: { research_id } })), id);
    await page.waitForSelector(".code .n", { timeout: 40000 });
    await wait(2500);
    const numbers = await page.locator(".code .n").allInnerTexts();
    const shownPath = await page.locator(".code .path").first().innerText().catch(() => "");
    await page.screenshot({ path: png });
    ok = (!firstLine || numbers[0] === firstLine) && (!filePath || shownPath.replace(/\s+/g, "").includes(filePath));
    console.log(`${ok ? "PASS" : "FAIL"}  code card first line ${numbers[0]} (want ${firstLine || "any"}), path "${shownPath.replace(/\s+/g, "")}"`);
  } catch (error) {
    console.log("FAIL  " + (error.stack || error));
  } finally {
    await app.close().catch(() => {});
    process.exit(ok ? 0 : 1);
  }
})();

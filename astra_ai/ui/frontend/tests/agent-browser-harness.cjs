// A bare Electron main process with only the agent browser in it, for tests/desktop-agent-browser.e2e.cjs.
// AGENT_HOST_URL and AGENT_USER_DATA say where the test backend is and where the token goes.
const { app } = require("electron");
const agentBrowser = require("../desktop/agent-browser.cjs");
app.on("window-all-closed", () => {});
app.whenReady().then(() => {
  globalThis.agentHost = agentBrowser.start({ userData: process.env.AGENT_USER_DATA, url: process.env.AGENT_HOST_URL, log: (...words) => console.log(...words) });
  globalThis.agentReady = true;
});

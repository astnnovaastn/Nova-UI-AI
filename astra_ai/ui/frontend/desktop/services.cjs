/**
 * Starting and stopping the local AEGIS services through the project's own launcher scripts,
 * so the desktop app and `npm start` run exactly the same backend.
 */
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const http = require("node:http");
const net = require("node:net");
const path = require("node:path");

/** Whether something is listening at the workspace address. */
function reachable(url, timeout = 1500) {
  return new Promise((resolve) => {
    const port = Number(url.port) || (url.protocol === "https:" ? 443 : 80);
    const socket = net.connect({ host: url.hostname.replace(/^\[|\]$/g, ""), port });
    const finish = (answer) => {
      socket.destroy();
      resolve(answer);
    };
    socket.setTimeout(timeout, () => finish(false));
    socket.once("connect", () => finish(true));
    socket.once("error", () => finish(false));
  });
}

async function waitReachable(url, within) {
  const until = Date.now() + within;
  for (;;) {
    if (await reachable(url)) return true;
    if (Date.now() >= until) return false;
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
}

/** Whether the local backend says it is healthy. */
function backendHealthy(timeout = 1500) {
  return new Promise((resolve) => {
    const request = http.get({ host: "127.0.0.1", port: 8340, path: "/api/health", timeout }, (response) => {
      let body = "";
      response.on("data", (chunk) => (body += chunk));
      response.on("end", () => {
        try {
          resolve(response.statusCode === 200 && JSON.parse(body).status === "healthy");
        } catch {
          resolve(false);
        }
      });
    });
    request.on("timeout", () => request.destroy());
    request.on("error", () => resolve(false));
  });
}

function powershell(script, args, options = {}) {
  return spawn("powershell.exe", ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-File", script, ...args], {
    cwd: path.dirname(script),
    windowsHide: true,
    stdio: ["ignore", "ignore", "pipe"],
    ...options,
  });
}

/**
 * Runs `start_nova_ai.ps1 -NoBrowser` and waits for it: the script returns once what it started
 * answers, or fails with the reason. With `frontend: false` only the backend is started, because
 * the desktop app serves the built web app itself.
 */
function start(projectRoot, { frontend = true, env = {} } = {}) {
  return new Promise((resolve, reject) => {
    const script = path.join(projectRoot, "start_nova_ai.ps1");
    if (!fs.existsSync(script)) return reject(new Error(`start_nova_ai.ps1 was not found in ${projectRoot}.`));
    // Start-Process in the launcher passes this environment on to the backend it starts.
    const child = powershell(script, frontend ? ["-NoBrowser"] : ["-NoBrowser", "-NoFrontend"], { env: { ...process.env, ...env } });
    let errors = "";
    child.stderr.on("data", (chunk) => (errors = (errors + chunk).slice(-4000)));
    child.once("error", (error) => reject(new Error(`Could not run the AEGIS launcher: ${error.message}`)));
    child.once("exit", (code) => {
      if (code === 0) return resolve();
      const reason = errors.split(/\r?\n/).map((line) => line.trim()).find(Boolean) || "The AEGIS launcher failed.";
      reject(new Error(reason.slice(0, 300)));
    });
  });
}

/** Asks the services to stop without waiting, so closing the window is not held up. */
function stop(projectRoot) {
  const script = path.join(projectRoot, "stop_nova_ai.ps1");
  if (!fs.existsSync(script)) return;
  powershell(script, [], { detached: true, stdio: "ignore" }).unref();
}

module.exports = { reachable, waitReachable, backendHealthy, start, stop };

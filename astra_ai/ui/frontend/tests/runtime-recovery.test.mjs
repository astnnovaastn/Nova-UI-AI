import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const source = fs.readFileSync(new URL("../src/main.ts", import.meta.url), "utf8");
const ast = ts.createSourceFile("main.ts", source, ts.ScriptTarget.Latest, true);
const recovery = ast.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === "recoverRuntime");
assert.ok(recovery);
const code = ts.transpile(recovery.getText(ast), { target: ts.ScriptTarget.ES2022 });

function environment({ connected = true, voiceFailure = false } = {}) {
  const requests = [], errors = [];
  let now = 0;
  const context = vm.createContext({
    runtimeOperation: null, recoveryVoiceState: "idle", recoveryVoiceReason: "Temporary audio connection failed",
    recoveryVoiceRetryable: true, isMuted: !voiceFailure, isAudioPlaying: true,
    statusEl: { textContent: "" }, audioPlayer: { stop() {} },
    socket: { reconnect() { context.recoveryVoiceState = voiceFailure ? "error" : "listening"; }, isConnected: () => connected },
    runtimeRequest: async (path, method) => { requests.push([path, method]); return { state: "ready", healthy: true }; },
    waitForRuntime: async () => {}, delay: async () => {}, Date: { now: () => (now += 7000) },
    showError: message => errors.push(message),
  });
  vm.runInContext(code, context);
  return { context, requests, errors };
}

test("automatic voice recovery never escalates a failed reconnect into a backend restart", async () => {
  const { context, requests, errors } = environment({ voiceFailure: true });
  await context.recoverRuntime();
  assert.deepEqual(requests, [["recover", "POST"]]);
  assert.deepEqual(errors, ["Temporary audio connection failed"]);
  assert.equal(context.statusEl.textContent, "recovery failed");
  assert.equal(context.runtimeOperation, null);
});

test("a timed-out websocket reconnect leaves background jobs alive", async () => {
  const { context, requests, errors } = environment({ connected: false });
  await context.recoverRuntime();
  assert.deepEqual(requests, [["recover", "POST"]]);
  assert.match(errors[0], /could not be restored/);
});

test("an explicit restart still restarts once, with no repeated restart on voice failure", async () => {
  const { context, requests } = environment({ voiceFailure: true });
  await context.recoverRuntime(true);
  assert.deepEqual(requests, [["restart", "POST"]]);
});

test("successful recovery reconnects without restarting the backend", async () => {
  const { context, requests, errors } = environment();
  await context.recoverRuntime();
  assert.deepEqual(requests, [["recover", "POST"]]);
  assert.deepEqual(errors, []);
  assert.equal(context.statusEl.textContent, "muted");
});

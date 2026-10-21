import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const source = fs.readFileSync(new URL("../src/settings.ts", import.meta.url), "utf8");
const ast = ts.createSourceFile("settings.ts", source, ts.ScriptTarget.Latest, true);
const fn = ast.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === "researchWriterPresentation");
const context = vm.createContext({});
vm.runInContext(ts.transpile(fn.getText(ast), {target: ts.ScriptTarget.ES2022}), context);
const status = {provider: "gemini", switching: false, providers: [
  {id: "gemini", configured: true, active: true, model: "gemini-3.5-flash", effective_model: "", requests_used: 3, request_limit: 40, tokens_used: 12000, token_limit: 400000, local_limit_reached: false},
  {id: "openai", configured: true, active: false, model: "gpt-4.1-mini", effective_model: "", requests_used: 2, request_limit: 40, tokens_used: 3000, token_limit: 400000, local_limit_reached: false},
]};

test("choosing a saved inactive key does not describe it as active", () => {
  const view = context.researchWriterPresentation(status, "openai", "gpt-4.1-mini", false);
  assert.match(view.active, /^Active: Gemini/);
  assert.equal(view.activateLabel, "Activate OpenAI");
  assert.equal(view.activateDisabled, false);
});

test("unchanged active writer is disabled while an edited model can be applied", () => {
  assert.equal(context.researchWriterPresentation(status, "gemini", "gemini-3.5-flash", false).activateDisabled, true);
  assert.equal(context.researchWriterPresentation(status, "gemini", "gemini-3.8-flash", false).activateDisabled, false);
  assert.equal(context.researchWriterPresentation(status, "openai", "gpt-4.1-mini", true).activateDisabled, true);
});

test("deactivation and exhausted quota remain visible without claiming a completed answer", () => {
  const limited = structuredClone(status); limited.provider = "none"; limited.providers[0].local_limit_reached = true;
  const view = context.researchWriterPresentation(limited, "gemini", "gemini-3.5-flash", false);
  assert.match(view.active, /deactivated/);
  assert.equal(view.deactivateDisabled, true);
  assert.match(view.warning, /daily allowance is used up/);
  assert.match(view.usage, /Gemini today:/);
});

test("missing key prevents activation, and real fallback model is identified", () => {
  const missing = structuredClone(status); missing.providers[1].configured = false;
  assert.equal(context.researchWriterPresentation(missing, "openai", "gpt-4.1-mini", false).activateDisabled, true);
  const fallback = structuredClone(status); fallback.providers[0].effective_model = "gemini-flash-latest";
  assert.match(context.researchWriterPresentation(fallback, "gemini", "gemini-3.5-flash", false).active, /last used gemini-flash-latest/);
});

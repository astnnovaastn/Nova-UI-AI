import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import { randomUUID } from "node:crypto";
function setup() {
  const storage = new Map(),
    events = [];
  const context = {
    exports: {},
    crypto: { randomUUID },
    sessionStorage: {
      getItem: (k) => storage.get(k),
      setItem: (k, v) => storage.set(k, v),
    },
    window: { dispatchEvent: (e) => events.push(e) },
    CustomEvent: class {
      constructor(type, { detail } = {}) {
        this.type = type;
        this.detail = detail;
      }
    },
    Event: class {
      constructor(type) {
        this.type = type;
      }
    },
    fetch: () => {
      throw Error("No network expected");
    },
  };
  vm.createContext(context);
  const source = fs.readFileSync(
    new URL("../src/conversation.ts", import.meta.url),
    "utf8",
  );
  vm.runInContext(
    ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
      },
    }).outputText,
    context,
  );
  return { api: context.exports, events };
}
test("selection revisions change with entry identity and stay stable while reading", () => {
  const { api } = setup();
  api.updateUiContext({ view: "research", research_id: "first" });
  const first = api.uiSnapshot().selection_revision;
  api.updateUiContext({ reader_end: 4, research_tab: "sources" });
  assert.equal(api.uiSnapshot().selection_revision, first);
  api.updateUiContext({ research_id: "second" });
  assert.equal(api.uiSnapshot().selection_revision, first + 1);
  api.updateUiContext({ view: "dashboard" });
  assert.equal(api.uiSnapshot().recent_research_id, "second");
});
test("late replies keep the report association frozen at request time", () => {
  const { api, events } = setup();
  api.updateUiContext({ view: "research", research_id: "first" });
  api.requestConversation("Question about first", "turn");
  const sent = events.find((e) => e.type === "nova-chat-send").detail;
  assert.equal(sent.research_id, "first");
  assert.equal(sent.selection_revision, api.uiSnapshot().selection_revision);
  api.updateUiContext({ research_id: "second" });
  api.conversationMessage(
    "assistant",
    "Late answer",
    "completed",
    "reply:turn",
  );
  assert.equal(api.conversationResearch("first")[0].text, "Late answer");
  assert.equal(api.conversationResearch("second").length, 0);
});
test("changing owner connection clears selected and recent research context", () => {
  const { api } = setup();
  api.conversationState({ clientId: "owner" });
  api.updateUiContext({ view: "research", research_id: "private" });
  api.conversationResearch("private", [
    { id: "m", role: "user", content: "Private" },
  ]);
  api.conversationState({ clientId: "other", guest: true });
  assert.equal(api.uiSnapshot().research_id, "");
  assert.equal(api.uiSnapshot().recent_research_id, "");
  assert.equal(api.conversationResearch("private").length, 0);
  assert.equal(api.conversationSnapshot().focusRevision, -1);
});

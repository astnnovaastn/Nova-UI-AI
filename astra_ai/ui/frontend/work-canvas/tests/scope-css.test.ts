import { describe, expect, it } from "vitest";
import { scope, scopeSelector } from "../scripts/scope-css.mjs";

const ROOT = ".aegis-work-root";
describe("every rule stays inside the canvas root", () => {
  it.each([
    [":root", ROOT],
    ["html", ROOT],
    ["body", ROOT],
    [":host", ROOT],
    ["#root", ROOT],
    ['html[data-theme="light"]', `${ROOT}[data-theme="light"]`],
    ['[data-theme="light"] .card', `${ROOT}[data-theme="light"] .card`],
    ['[data-theme="light"]', `${ROOT}[data-theme="light"]`],
    [':root:not([data-material="none"])[data-material] body', `${ROOT}:not([data-material="none"])[data-material]`],
    [".button:hover", `${ROOT} .button:hover`],
    ["*", `${ROOT} *`],
    ["button", `${ROOT} button`],
  ])("%s", (input, expected) => {
    expect(scopeSelector(input)).toBe(expected);
  });
  it("handles lists, at-rules and keyframes", () => {
    const css = scope("a, b:is(.x, .y) { color: red } @layer base { button { margin: 0 } } @keyframes f { from { opacity: 0 } to { opacity: 1 } }");
    expect(css).toContain(`${ROOT} a, ${ROOT} b:is(.x, .y)`);
    expect(css).toContain(`${ROOT} button`);
    expect(css).toContain("from {");
    expect(css).not.toContain(`${ROOT} from`);
  });
});

/*
 * AEGIS Agent Execution Lab — skills.
 *
 * The SKILL.md files are imported as text at build time, straight from where they live:
 *   Zephium:  zephium-source/crates/zephium-app/skills/<name>/SKILL.md   (compiled into the app)
 *   AEGIS:    astra_ai/core/work/skills/<name>/SKILL.md                  (read by skills.py)
 * Nothing is copied or edited. `parse` and `forRequest` are TypeScript ports of
 * crates/zephium-app/src/work_lead/skills.rs (MPL-2.0, (c) Zephium contributors), kept close
 * to the Rust so the lab shows what the app would decide.
 */
const zephiumFiles = import.meta.glob("$zskills/*/SKILL.md", { query: "?raw", import: "default", eager: true }) as Record<string, string>;
const aegisFiles = import.meta.glob("$aegisskills/*/SKILL.md", { query: "?raw", import: "default", eager: true }) as Record<string, string>;

export type Skill = {
  name: string;
  description: string;
  tools: string[];
  role?: "lead" | "page" | "light";
  body: string;
  owner: "zephium" | "aegis";
  path: string;
  /** AEGIS only: words that pick it before planning (skills.py select_many). */
  triggers: string[];
  title: string;
};

export type SkillFault = "no_frontmatter" | "name" | "description" | "role" | "too_large" | "empty";

const MAX_SKILL_BYTES = 16 * 1024;
const validName = (name: string) =>
  !!name && name.length <= 40 && /^[a-z0-9-]+$/u.test(name) && !name.startsWith("-") && !name.endsWith("-");

/** skills.rs `parse`: `---`, `key: value` lines, `---`, then the body. */
export function parse(text: string, owner: Skill["owner"], path: string): Skill | SkillFault {
  if (new TextEncoder().encode(text).length > MAX_SKILL_BYTES) return "too_large";
  const clean = text.replace(/^﻿/u, "").replace(/\r\n/gu, "\n");
  if (!clean.startsWith("---\n")) return "no_frontmatter";
  const rest = clean.slice(4);
  const end = rest.indexOf("\n---");
  if (end < 0) return "no_frontmatter";
  const head = rest.slice(0, end);
  const body = rest.slice(end + 4).replace(/^\n/u, "").trim();
  const meta: Record<string, string> = {};
  for (const line of head.split("\n")) {
    const at = line.indexOf(":");
    if (at > 0) meta[line.slice(0, at).trim()] = line.slice(at + 1).trim().replace(/^"|"$/gu, "").trim();
  }
  const list = (value = "") =>
    value
      .replace(/^\[|\]$/gu, "")
      .split(",")
      .map((each) => each.trim().replace(/^"|"$/gu, ""))
      .filter(Boolean)
      .slice(0, 24);
  const name = meta.name ?? "";
  if (!validName(name)) return "name";
  const description = meta.description ?? "";
  if (!description || [...description].length > 200 || /[\u0000-\u001f]/u.test(description)) return "description";
  let role: Skill["role"];
  if (meta.role) {
    if (!["lead", "page", "light"].includes(meta.role)) return "role";
    role = meta.role as Skill["role"];
  }
  if (!body) return "empty";
  return {
    name,
    description,
    tools: list(meta.tools),
    ...(role ? { role } : {}),
    body,
    owner,
    path,
    triggers: list(meta.triggers),
    title: meta.title || name.replace(/-/gu, " ").replace(/^./u, (c) => c.toUpperCase()),
  };
}

const loaded = (files: Record<string, string>, owner: Skill["owner"], prefix: string) =>
  Object.entries(files)
    .map(([path, text]) => parse(text, owner, prefix + path.split("/").slice(-2).join("/")))
    .filter((skill): skill is Skill => typeof skill !== "string")
    .sort((a, b) => a.name.localeCompare(b.name));

export const ZEPHIUM_SKILLS = loaded(zephiumFiles, "zephium", "crates/zephium-app/skills/");
export const AEGIS_SKILLS = loaded(aegisFiles, "aegis", "astra_ai/core/work/skills/");

/** skills.rs PERSONAL: offered only when the request is about the person's own apps or day. */
const PERSONAL = ["plan-my-day", "today-from-my-messages", "inbox-triage", "meeting-prep", "weekly-status"];
const ACROSS_APPS = ["plan-my-day", "today-from-my-messages"];

function aboutTheDay(request: string) {
  const text = request.toLowerCase();
  return ["my day", "today", "tomorrow", "this week", "my messages", "my tasks", "to do", "todo", "unread"].some((p) => text.includes(p));
}
function aboutOwnApps(request: string) {
  const text = request.toLowerCase();
  const phrases = ["my day", "today", "tomorrow", "this week", "my inbox", "my mail", "my email", "my messages", "my calendar", "my meeting", "next meeting", "my tasks", "to do", "unread"];
  const apps = ["slack", "gmail", "mail", "inbox", "calendar", "linear", "notion", "github", "standup", "status"];
  return phrases.some((p) => text.includes(p)) || text.split(/[^\p{L}\p{N}]+/u).some((w) => apps.includes(w) || w === "todo" || w === "todos");
}

/** skills.rs `for_request`: every skill, less the personal ones when the request is not about the person's apps. */
export function forRequest(request: string, started?: string): { offered: Skill[]; withheld: { skill: Skill; why: string }[] } {
  const own = aboutOwnApps(request);
  const day = own && aboutTheDay(request);
  const offered: Skill[] = [];
  const withheld: { skill: Skill; why: string }[] = [];
  for (const skill of ZEPHIUM_SKILLS) {
    const ok = started === skill.name || !PERSONAL.includes(skill.name) || (own && (day || !ACROSS_APPS.includes(skill.name)));
    if (ok) offered.push(skill);
    else
      withheld.push({
        skill,
        why: own ? "Reads the person's day across apps; this request names one app" : "Reads the person's own apps; the request is not about them",
      });
  }
  return { offered, withheld };
}

/** skills.py select_many: the workflow's own skill first, then up to two that match by trigger phrase. */
export function aegisSelect(request: string, workflow: string): { skill: Skill; how: "workflow" | "matched"; hits: string[] }[] {
  const text = request.toLocaleLowerCase();
  const matches = AEGIS_SKILLS.filter((skill) => skill.name !== workflow)
    .map((skill) => ({
      skill,
      hits: skill.triggers.filter((trigger) => new RegExp(`(?<!\\w)${trigger.toLocaleLowerCase().replace(/[.*+?^${}()|[\]\\]/gu, "\\$&")}(?!\\w)`, "u").test(text)),
    }))
    .filter((row) => row.hits.length)
    .sort((a, b) => b.hits.length - a.hits.length || a.skill.name.localeCompare(b.skill.name));
  const primary = AEGIS_SKILLS.find((skill) => skill.name === workflow);
  const out: { skill: Skill; how: "workflow" | "matched"; hits: string[] }[] = primary ? [{ skill: primary, how: "workflow", hits: [] }] : [];
  for (const row of matches) {
    const phrase = Math.max(...row.hits.map((hit) => hit.split(/\s+/u).length));
    if (!out.length || phrase > 1) out.push({ skill: row.skill, how: "matched", hits: row.hits });
    if (out.length === (primary ? 3 : 2)) break;
  }
  return out;
}

export const skillOf = (name: string) => ZEPHIUM_SKILLS.find((skill) => skill.name === name) ?? AEGIS_SKILLS.find((skill) => skill.name === name);

/** "Map a project": the label the run's input mark shows (lead.rs skill_label). */
export const skillLabel = (name: string) => name.replace(/-/gu, " ").replace(/^./u, (c) => c.toUpperCase());

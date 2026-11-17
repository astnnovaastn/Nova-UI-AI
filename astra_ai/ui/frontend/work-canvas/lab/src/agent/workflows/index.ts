/*
 * The lab's workflows, and how a typed request reaches one.
 *
 * Routing uses Zephium's own start-screen code, unchanged: `workflowOf` from
 * frame/src/features/work/lib/start/workflows.ts matches a request by its opening words or
 * a workflow's `known` pattern. In Zephium that only labels recent work on the start
 * screen; what actually picks a skill for a typed request is the model reading the skill
 * list (lead.rs system()). The lab shows both, and says which is which.
 */
import { WORKFLOWS, workflowOf } from "$features/work/lib/start/workflows";
import type { WorkflowFixture } from "../types";
import { explainCode, fixTest, mapProject, reviewChange } from "./developer";
import { campaignPlan, competitorLandscape, moodboard, uiTeardown } from "./design-marketing";
import { deepResearch, investorList, knowledgeMap, marketMap, pricingResearch, quickResearch, stress } from "./founder-research";
import { examPrep, inboxTriage, learningPath, meetingPrep, planMyDay, weeklyStatus } from "./people";

export const FIXTURES: WorkflowFixture[] = [
  explainCode,
  mapProject,
  reviewChange,
  fixTest,
  uiTeardown,
  moodboard,
  competitorLandscape,
  campaignPlan,
  planMyDay,
  weeklyStatus,
  learningPath,
  examPrep,
  inboxTriage,
  meetingPrep,
  marketMap,
  pricingResearch,
  investorList,
  quickResearch,
  deepResearch,
  knowledgeMap,
  stress,
];

export const PERSONA_LABEL: Record<WorkflowFixture["persona"], string> = {
  developer: "Developer",
  designer: "Designer",
  marketing: "Marketing",
  manager: "Manager",
  student: "Student",
  office: "Office",
  founder: "Founder",
  research: "Work and research",
};

export type Route = { fixture: WorkflowFixture; how: string; zephium: boolean };

/** Which fixture a typed request runs, and why. */
export function route(request: string): Route {
  const text = request.trim();
  const flow = workflowOf(text);
  if (flow) {
    const fixture = FIXTURES.find((each) => each.skill === flow.skill);
    if (fixture)
      return {
        fixture,
        how: `Matched by Zephium's workflowOf (start/workflows.ts): ${text.toLowerCase().startsWith(flow.request().trim().toLowerCase()) ? "the request starts with the workflow's own words" : `its pattern ${String(flow.known)}`}. A typed request carries no grant.skill; the lead would load the skill itself.`,
        zephium: true,
      };
  }
  const lower = text.toLowerCase();
  if (/knowledge map|blueprint|structured/u.test(lower)) return { fixture: knowledgeMap, how: "AEGIS routing: \"knowledge map\" or \"blueprint\" asks for the structured mode (catalog.py).", zephium: false };
  if (/deep research|thorough|in depth/u.test(lower)) return { fixture: deepResearch, how: "AEGIS routing: \"deep research\" asks for the deep mode (catalog.py).", zephium: false };
  return { fixture: quickResearch, how: "No workflow matched: a general request. The lab answers it with the Quick Research script; in Zephium the lead would decide alone from its prompt and the skill list.", zephium: false };
}

/** The 17 start-screen workflows exactly as Zephium defines them (for the coverage check). */
export const ZEPHIUM_WORKFLOWS = WORKFLOWS.map((flow) => ({ skill: flow.skill, persona: flow.persona, input: flow.input, reads: [...flow.reads] }));

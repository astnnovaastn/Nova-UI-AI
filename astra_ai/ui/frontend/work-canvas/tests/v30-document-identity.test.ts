import { describe, expect, it } from "vitest";
import { documentIdentity } from "../src/document-identity";

describe("documentIdentity (V30)", () => {
  it("keeps each Work result's own identity", () => {
    const work = (workflow: string) => ({ request: { workflow }, plan: { route: { research: false } } });
    expect(documentIdentity(work("campaign-plan"))).toEqual({ kind: "campaign-plan", label: "Campaign plan", research: false });
    expect(documentIdentity(work("map-a-project")).kind).toBe("architecture-document");
    expect(documentIdentity(work("meeting-prep")).kind).toBe("meeting-brief");
    expect(documentIdentity(work("competitor-landscape")).kind).toBe("marketing-deliverable");
    expect(documentIdentity(work("learning-path")).kind).toBe("learning-document");
    expect(documentIdentity(work("something-new")).kind).toBe("work-document");
  });

  it("treats research and classic runs as research reports", () => {
    expect(documentIdentity({ request: { workflow: "deep-research" }, plan: { route: { research: true } } }).research).toBe(true);
    expect(documentIdentity({ request: {}, plan: { route: null } }).kind).toBe("research-report");
    expect(documentIdentity(null).kind).toBe("research-report");
  });
});

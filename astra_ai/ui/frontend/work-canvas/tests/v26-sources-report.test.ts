import { describe, expect, it } from "vitest";
import { buildScene } from "../src/research-to-run";
import { registrableSite } from "$features/work/lib/run/site";

const run = { assignments: [{ agent: "worker_a", role: "discovery" }], usage: { parts: {} }, state: "done" };
const source = (id: string, url: string) => ({ id, title: id, url });

function reads(sources: { id: string; title: string; url: string }[]) {
  const scene = buildScene({ research_id: "r1", query: "q", report: "# T\n\nText.", phase: "completed", sources }, "", [], () => "", run, null);
  const execution = [...scene.objectives.values()][0]!.executions[0]!;
  return execution.steps.filter((step) => (step.kind as { kind: string }).kind === "read");
}

describe("website sources", () => {
  it("a page read belongs to the run, not to one helper, so each website gets its own row", () => {
    const steps = reads([source("S1", "https://amazon.com/a"), source("S2", "https://oracle.com/b"), source("S3", "https://vsight.io/c")]);
    expect(steps).toHaveLength(3);
    for (const step of steps) expect((step as { part?: string }).part).toBeUndefined();
  });

  it("the same page cited twice is one page", () => {
    const steps = reads([source("S1", "https://amazon.com/a"), source("S2", "https://amazon.com/a#top"), source("S3", "https://amazon.com/a/")]);
    expect(steps).toHaveLength(1);
  });

  it("pages group by registrable website, not by subdomain or by run", () => {
    expect(registrableSite("en.wikipedia.org")).toBe(registrableSite("wikipedia.org"));
    expect(registrableSite("aws.amazon.com")).toBe("amazon.com");
    expect(registrableSite("docs.oracle.com")).not.toBe(registrableSite("amazon.com"));
    expect(registrableSite("www.airbnb.co.uk")).toBe("airbnb.co.uk");
  });
});

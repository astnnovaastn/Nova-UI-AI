/**
 * Three research layouts over one placement engine. The policy is chosen from the run's recorded
 * mode and shaped by what the run actually holds: how many workers, sources and map nodes, and the
 * space available. It is deterministic and needs no model call.
 *
 * Quick       request → sources → AEGIS → report, packed tight.
 * Deep        prompt and plan, source clusters, specialists, then a wide report; room to grow sideways.
 * Structured  the same run, with its knowledge map beside or under it, whichever keeps the whole
 *             canvas closest to the shape of the screen, so it never needs an extreme zoom-out.
 *
 * Only new runs that carry relations use it. Older canvases keep the placement they always had, and
 * a saved arrangement always wins over any policy (the host applies saved positions last).
 */
export type ResearchMode = "direct" | "quick" | "deep" | "structured";

export type Gaps = {
  /** Between the source lanes and the agents, and between agent columns. */
  column: number;
  /** Between stacked agents. */
  row: number;
  /** Before the report column. */
  paper: number;
  /** Between the run and its knowledge map. */
  map: number;
};

export type Policy = {
  mode: ResearchMode;
  gaps: Gaps;
  map: "below" | "right";
  /** Room above the lanes for the discovery agent. */
  discoveryLift: number;
};

export const LEGACY_GAPS: Gaps = { column: 80, row: 32, paper: 70, map: 90 };
export const RESEARCH_GRID_STEP = 20;

/**
 * Clear space between card edges, in canvas units at 100%: a wide corridor between stages, for
 * the strings to run and branch in, and a calm gap between the cards of one stage.
 */
const GAPS: Record<ResearchMode, Gaps> = {
  direct: { column: 150, row: 56, paper: 170, map: 110 },
  quick: { column: 150, row: 56, paper: 170, map: 110 },
  deep: { column: 176, row: 64, paper: 200, map: 120 },
  structured: { column: 176, row: 64, paper: 200, map: 120 },
};

export function modeOf(value: unknown): ResearchMode {
  return value === "direct" || value === "deep" || value === "structured" ? value : "quick";
}

type Box = { width: number; height: number };

/** How far a box's shape is from the screen's: 0 is a perfect fit. */
const misfit = (box: Box, view: Box) => Math.abs(Math.log(box.width / Math.max(1, box.height) / (view.width / Math.max(1, view.height))));

/**
 * Where a knowledge map goes: below the run or to its right, whichever gives the whole canvas the
 * shape closest to the viewport. Ties go below, which reads top to bottom.
 */
export function mapPlacement(run: Box, map: Box, view: Box, gap: number): "below" | "right" {
  const below = { width: Math.max(run.width, map.width), height: run.height + gap + map.height };
  const right = { width: run.width + gap + map.width, height: Math.max(run.height, map.height) };
  return misfit(right, view) + 0.05 < misfit(below, view) ? "right" : "below";
}

export function layoutPolicy(input: {
  mode: unknown;
  workers: number;
  sources: number;
  run?: Box;
  map?: Box | null;
  view?: Box;
}): Policy {
  const mode = modeOf(input.mode);
  const base = GAPS[mode];
  // Many sources or workers need a little more air between columns; few need less.
  const busy = input.sources > 8 || input.workers > 2;
  const gaps = busy ? { ...base, column: base.column + 24, row: base.row + 8 } : base;
  const view = input.view && input.view.width > 0 && input.view.height > 0 ? input.view : { width: 1440, height: 900 };
  const map = mode === "structured" && input.map && input.run ? mapPlacement(input.run, input.map, view, gaps.map) : "below";
  return { mode, gaps, map, discoveryLift: mode === "quick" || mode === "direct" ? 40 : 56 };
}

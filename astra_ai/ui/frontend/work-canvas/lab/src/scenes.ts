/* The lab's workspace scenes: the six examples, the layout demonstrations, and Zephium's own. */
import type { PartAsk } from "$features/work/lib/run/parts";
import {
  dinnerScene,
  jobsScene,
  runningScene,
  rustScene,
  saasScene,
  tripScene,
  type BoardScene,
} from "$features/work/tests/board-fixtures";
import { fixScene, searchScene } from "$features/work/tests/parts-look";
import { fourHelpersScene } from "$features/work/tests/presence-look";
import { askingTrip, leadTrip } from "$features/work/tests/lead-look";
import { beatsOf, buildScene, type Beat, type SceneSpec } from "./fixtures/scene";
import * as examples from "./fixtures/examples";

export type Built = { scene: BoardScene; asks?: (objective: string) => readonly PartAsk[] };
export type SceneDef = {
  /** Where the data came from, said plainly in the stage's header. */
  origin: "lab" | "zephium";
  beats?: Beat[];
  build: (upto?: number) => Built;
};

const lab = (spec: SceneSpec): SceneDef => ({
  origin: "lab",
  beats: beatsOf(spec),
  build: (upto) => ({ scene: buildScene(spec, upto) }),
});
const theirs = (make: () => BoardScene): SceneDef => ({
  origin: "zephium",
  build: () => ({ scene: make() }),
});

export const SCENES: Record<string, SceneDef> = {
  ...Object.fromEntries(
    Object.entries(examples as unknown as Record<string, SceneSpec>).map(([name, spec]) => [name, lab(spec)]),
  ),
  saasScene: theirs(saasScene),
  tripScene: theirs(tripScene),
  jobsScene: theirs(jobsScene),
  rustScene: theirs(rustScene),
  dinnerScene: theirs(dinnerScene),
  runningScene: theirs(runningScene),
  fixDone: theirs(() => fixScene("done")),
  fixWorking: theirs(() => fixScene("working")),
  fourHelpers: theirs(fourHelpersScene),
  searchDone: theirs(() => searchScene("done")),
  leadTrip: theirs(() => leadTrip(tripScene(), false)),
  askingTrip: { origin: "zephium", build: () => askingTrip(tripScene()) },
};

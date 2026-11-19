// MPL-2.0. AEGIS V33: the visual board (Designer moodboards and UI teardowns) composed as picture
// groups across the canvas. The reference checkout stays untouched.
//
// Why: a moodboard's groups were "found" by the helper part (picks carry part worker_a), so they stood
// in that part's row at Zephium's found width (880), wrapped one under another at 1080, and each set
// drew two or three cards across: a narrow vertical column with most of the canvas empty.
//
// What changes, for board profile "visual" only: picks stay on the result board instead of the part's
// row, the board carries each picks block's item count (and picture proportion), and the board is laid
// out by `visualLayout` (work-canvas/src/designer/moodboard-layout.ts): each group's grid and the
// board's width are chosen from a fixed card model, then the blocks are packed bottom-left in reading
// order with their own measured heights. Every other profile keeps its layout exactly.
export const visualBoardPatches = [
  {
    file: "features/work/lib/board/layout.ts",
    find: 'import type { Emphasis } from "./types";\n',
    replace:
      'import type { Emphasis } from "./types";\n' +
      'import { visualLayout } from "../../../../../../src/designer/moodboard-layout";\n',
    why: "Use AEGIS's visual board composition.",
  },
  {
    file: "features/work/lib/board/layout.ts",
    find: "  height: (width: number) => number;\n};\nexport type BoardLayout",
    replace:
      "  height: (width: number) => number;\n" +
      "  /** AEGIS V33: a picks block's item count and typical picture proportion, for the visual board. */\n" +
      "  count?: number;\n  aspect?: number;\n};\nexport type BoardLayout",
    why: "A block can carry its picture count and proportion.",
  },
  {
    file: "features/work/lib/board/layout.ts",
    find: "  if (rule && !options.open && read.length >= 2) return profiled(read, rule) ?? rowLayout(blocks, options);\n",
    replace:
      "  // AEGIS V33: a visual board packs its picture groups across the canvas (moodboard-layout.ts).\n" +
      "  if (options.profile === \"visual\" && !options.open && read.length >= 1) {\n" +
      "    const board = visualLayout(read);\n" +
      "    if (board) return board;\n" +
      "  }\n" +
      "  if (rule && !options.open && read.length >= 2) return profiled(read, rule) ?? rowLayout(blocks, options);\n",
    why: "Lay out a visual board with the content-aware picture composition.",
  },
  {
    file: "features/work/lib/project-environment-board.ts",
    find: "        if (part) found.set(object.id, part);\n",
    replace:
      "        // AEGIS V33: on a visual board the picture groups are the result, not a part's finds.\n" +
      "        if (part && !(options.board === \"visual\" && object.view.kind === \"picks\")) found.set(object.id, part);\n",
    why: "Keep a moodboard's picture groups on the result board.",
  },
  {
    file: "features/work/lib/project-environment-board.ts",
    find: "            emphasis: object.emphasis,\n            ...(object.block?.group ? { group: object.block.group } : {}),\n",
    replace:
      "            emphasis: object.emphasis,\n            ...(object.block?.group ? { group: object.block.group } : {}),\n" +
      "            ...(object.view.kind === \"picks\" ? { count: object.view.items.length } : {}),\n",
    why: "Tell the board how many pictures a group holds.",
  },
];

// MPL-2.0. AEGIS V34: the Work launcher's developer workflows offer the real inputs AEGIS Desktop can read,
// and code excerpts keep the file path and line numbers they were read with.
// - Zephium's start screen has one "Choose a folder" button for folder-input workflows only; AEGIS adds
//   Choose file / Choose folder / Select repository and the person's connected projects under every developer
//   workflow (src/DevSourcePicker.svelte). The chosen path goes into the request, where the backend maps it
//   to the grant (core/work/dev_scope.py).
// - Zephium's CodeView has `path` and `start`, but the board adapter dropped them, so excerpts were numbered
//   from 1. Notes stay positions in the excerpt; the rail names them by file line (start offset).
// Reference checkout untouched.
const code = (name) =>
  `          kind: "code",\n          language: ${name}.language,\n          text: ${name}.text,\n          notes: ${name}.notes,\n`;
const keep = (name, indent) =>
  `${indent}...((${name} as { path?: string }).path ? { path: (${name} as { path?: string }).path } : {}),\n` +
  `${indent}...((${name} as { start?: number }).start ? { start: (${name} as { start?: number }).start } : {}),\n`;

export const developerPatches = [
  {
    file: "features/work/components/start/WorkStart.svelte",
    why: "V34: import the AEGIS developer source picker.",
    find: '  import Vignette from "./Vignette.svelte";\n',
    replace: '  import Vignette from "./Vignette.svelte";\n  import DevSourcePicker from "../../../../../../src/DevSourcePicker.svelte";\n',
  },
  {
    file: "features/work/components/start/WorkStart.svelte",
    why: "V34: developer workflows show file, folder, repository and connected-project choices.",
    find: '        {#if active.input === "folder"}<Button\n',
    replace:
      '        {#if active.persona === "developer"}<DevSourcePicker skill={active.skill} request={active.request()} {disabled} onplace={(text) => void place(text)} />{/if}\n' +
      '        {#if active.input === "folder" && active.persona !== "developer"}<Button\n',
  },
  {
    file: "features/work/lib/board/adapter.ts",
    why: "V34: a code excerpt keeps its file path and first line number (grounded in the file AEGIS read).",
    find: code("content") + "        });\n",
    replace: code("content") + keep("content", "          ") + "        });\n",
  },
  {
    file: "features/work/lib/board/objects.ts",
    why: "V34: the Code view receives the path and first line number.",
    find: code("block").replace(/^ {2}/gm, "") + "      };\n",
    replace: code("block").replace(/^ {2}/gm, "") + keep("block", "        ") + "      };\n",
  },
  {
    file: "features/work/lib/project-work.ts",
    why: "V34: the wire's code content keeps the file path and first line number on its way to the board.",
    find: "          text: note.text,\n        })),\n      };\n",
    replace: "          text: note.text,\n        })),\n" + keep("data", "        ") + "      };\n",
  },
  {
    file: "shared/ui/data/Code/CodeBlock.svelte",
    why: "V34: notes are positions in the excerpt; the rail names them by their line numbers in the file.",
    find: "      ? m.work_code_line({ line: note.from })\n      : m.work_code_lines({ from: note.from, to: note.to });\n",
    replace: "      ? m.work_code_line({ line: note.from + start - 1 })\n      : m.work_code_lines({ from: note.from + start - 1, to: note.to + start - 1 });\n",
  },
];

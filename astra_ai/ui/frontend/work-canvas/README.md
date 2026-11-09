# Research canvas

The AEGIS Research canvas. It is Zephium Work's source code (MPL-2.0) hosted in AEGIS: a Svelte build that the React app mounts from `public/work-canvas/`.

## Commands

Run these from `astra_ai/ui/frontend/work-canvas/`:

| Command | What it does |
|---|---|
| `npm install` | Installs the build tools. Only needed once |
| `npm run build` | Builds into `../public/work-canvas/`, which AEGIS serves |
| `npm test` | Runs the unit tests |
| `npm run sync` | Copies files again from `../../zephium-source/` and reapplies the patches |

The built output is kept in the repository, so running AEGIS does not need this package installed.

End-to-end checks run against the running app, from `astra_ai/ui/frontend/`:

```bash
node tests/research-canvas.e2e.cjs <output folder> "<saved report title>"
```

Adding `--live "<prompt>"` also starts one real research run, which uses search and AI quota.

## Rollback

The original Research screen is still there.

- **In the app:** open the rail's **…** menu and choose **Classic Research view**. **Canvas view** in the classic toolbar switches back.
- **For one page load:** add `?research=classic` to the address.
- **To restore the old code:** the files changed by this work were saved first in `.backups/research-canvas-20261105/`.

## How it fits together

```text
React: ResearchWorkspace.tsx    All research logic, Reader, Edit, Sources, Media, history
  └─ WorkCanvasHost.tsx         Loads the canvas, passes state down and actions up
Svelte: src/AegisWorkHost.svelte  Shell, rail, composer tools, canvas wiring
  ├─ src/research-to-run.ts     AEGIS report to the run facts Zephium's board draws
  ├─ src/session.svelte.ts      Real job state for Zephium's activity line
  ├─ src/preview-provider.ts    What website cards show; replaceable
  ├─ src/media.ts               Images from AEGIS's authenticated routes
  ├─ src/native/*               Stands in for Tauri, so bindings.ts stays unchanged
  └─ upstream/                  Zephium's files, see upstream/MANIFEST.json
```

**Website cards:** they show saved image, title and excerpt from `savedDataProvider`. To add real page screenshots later, call `installPreviewProvider` with a new provider; the cards don't change.

**CSS:** `scripts/scope-css.mjs` rewrites every rule to stay inside `.aegis-work-root`, so the canvas can't restyle the rest of AEGIS.

## Changing upstream code

Don't edit `upstream/` by hand, because `npm run sync` overwrites it. Add a patch in `scripts/sync-upstream.mjs`. Each patch must match exactly once, so an upstream change fails loudly.

## License

See `NOTICE.md`. Everything in `upstream/` and `src/AegisWorkHost.svelte` is MPL-2.0. The Zephium name and logo are not licensed and are not used.

# TEMPLATES AND TESTS
Consolidated documentation for templates and tests.



================================================================================
SOURCE: data\openclaude\plugins\marketplaces\claude-plugins-official\plugins\claude-code-setup\skills\claude-automation-recommender\references\subagent-templates.md
================================================================================

# Subagent Recommendations

Subagents are specialized Claude instances that run in parallel, each with their own context window and tool access. They're ideal for focused reviews, analysis, or generation tasks.

**Note**: These are common patterns. Design custom subagents based on the codebase's specific review and analysis needs.

## Code Review Agents

### code-reviewer
**Best for**: Automated code quality checks on large codebases

| Recommend When | Detection |
|----------------|-----------|
| Large codebase (>500 files) | File count |
| Frequent code changes | Active development |
| Team wants consistent review | Quality focus |

**Value**: Runs code review in parallel while you continue working
**Model**: sonnet (balanced quality/speed)
**Tools**: Read, Grep, Glob, Bash

---

### security-reviewer
**Best for**: Security-focused code review

| Recommend When | Detection |
|----------------|-----------|
| Auth code present | `auth/`, `login`, `session` patterns |
| Payment processing | `stripe`, `payment`, `billing` patterns |
| User data handling | `user`, `profile`, `pii` patterns |
| API keys in code | Environment variable patterns |

**Value**: Catches OWASP vulnerabilities, auth issues, data exposure
**Model**: sonnet
**Tools**: Read, Grep, Glob (read-only for safety)

---

### test-writer
**Best for**: Generating comprehensive test coverage

| Recommend When | Detection |
|----------------|-----------|
| Low test coverage | Few test files vs source files |
| Test suite exists | `tests/`, `__tests__/` present |
| Testing framework configured | jest, pytest, vitest in deps |

**Value**: Generates tests matching project conventions
**Model**: sonnet
**Tools**: Read, Write, Grep, Glob

---

## Specialized Agents

### api-documenter
**Best for**: API documentation generation

| Recommend When | Detection |
|----------------|-----------|
| REST endpoints | Express routes, FastAPI paths |
| GraphQL schema | `.graphql` files |
| OpenAPI exists | `openapi.yaml`, `swagger.json` |
| Undocumented APIs | Routes without docs |

**Value**: Generates OpenAPI specs, endpoint documentation
**Model**: sonnet
**Tools**: Read, Write, Grep, Glob

---

### performance-analyzer
**Best for**: Finding performance bottlenecks

| Recommend When | Detection |
|----------------|-----------|
| Database queries | ORM usage, raw SQL |
| High-traffic code | API endpoints, hot paths |
| Performance complaints | User reports slowness |
| Complex algorithms | Nested loops, recursion |

**Value**: Finds N+1 queries, O(n²) algorithms, memory leaks
**Model**: sonnet
**Tools**: Read, Grep, Glob, Bash

---

### ui-reviewer
**Best for**: Frontend accessibility and UX review

| Recommend When | Detection |
|----------------|-----------|
| React/Vue/Angular | Frontend framework detected |
| Component library | `components/` directory |
| User-facing UI | Not just API project |

**Value**: Catches accessibility issues, UX problems, responsive design gaps
**Model**: sonnet
**Tools**: Read, Grep, Glob

---

## Utility Agents

### dependency-updater
**Best for**: Safe dependency updates

| Recommend When | Detection |
|----------------|-----------|
| Outdated deps | `npm outdated` has results |
| Security advisories | `npm audit` warnings |
| Major version behind | Significant version gaps |

**Value**: Updates dependencies incrementally with testing
**Model**: sonnet
**Tools**: Read, Write, Bash, Grep

---

### migration-helper
**Best for**: Framework/version migrations

| Recommend When | Detection |
|----------------|-----------|
| Major upgrade needed | Framework version very old |
| Breaking changes coming | Deprecation warnings |
| Refactoring planned | Architectural changes |

**Value**: Plans and executes migrations incrementally
**Model**: opus (complex reasoning needed)
**Tools**: Read, Write, Grep, Glob, Bash

---

## Quick Reference: Detection → Recommendation

| If You See | Recommend Subagent |
|------------|-------------------|
| Large codebase | code-reviewer |
| Auth/payment code | security-reviewer |
| Few tests | test-writer |
| API routes | api-documenter |
| Database heavy | performance-analyzer |
| Frontend components | ui-reviewer |
| Outdated packages | dependency-updater |
| Old framework version | migration-helper |

---

## Subagent Placement

Subagents go in `.claude/agents/`:

```
.claude/
└── agents/
    ├── code-reviewer.md
    ├── security-reviewer.md
    └── test-writer.md
```

---

## Model Selection Guide

| Model | Best For | Trade-off |
|-------|----------|-----------|
| **haiku** | Simple, repetitive checks | Fast, cheap, less thorough |
| **sonnet** | Most review/analysis tasks | Balanced (recommended default) |
| **opus** | Complex migrations, architecture | Thorough, slower, more expensive |

---

## Tool Access Guide

| Access Level | Tools | Use Case |
|--------------|-------|----------|
| Read-only | Read, Grep, Glob | Reviews, analysis |
| Writing | + Write | Code generation, docs |
| Full | + Bash | Migrations, testing |



================================================================================
SOURCE: data\openclaude\plugins\marketplaces\claude-plugins-official\plugins\claude-md-management\skills\claude-md-improver\references\templates.md
================================================================================

# CLAUDE.md Templates

## Key Principles

- **Concise**: Dense, human-readable content; one line per concept when possible
- **Actionable**: Commands should be copy-paste ready
- **Project-specific**: Document patterns unique to this project, not generic advice
- **Current**: All info should reflect actual codebase state

---

## Recommended Sections

Use only the sections relevant to the project. Not all sections are needed.

### Commands

Document the essential commands for working with the project.

```markdown
## Commands

| Command | Description |
|---------|-------------|
| `<install command>` | Install dependencies |
| `<dev command>` | Start development server |
| `<build command>` | Production build |
| `<test command>` | Run tests |
| `<lint command>` | Lint/format code |
```

### Architecture

Describe the project structure so Claude understands where things live.

```markdown
## Architecture

```
<root>/
  <dir>/    # <purpose>
  <dir>/    # <purpose>
  <dir>/    # <purpose>
```
```

### Key Files

List important files that Claude should know about.

```markdown
## Key Files

- `<path>` - <purpose>
- `<path>` - <purpose>
```

### Code Style

Document project-specific coding conventions.

```markdown
## Code Style

- <convention>
- <convention>
- <preference over alternative>
```

### Environment

Document required environment variables and setup.

```markdown
## Environment

Required:
- `<VAR_NAME>` - <purpose>
- `<VAR_NAME>` - <purpose>

Setup:
- <setup step>
```

### Testing

Document testing approach and commands.

```markdown
## Testing

- `<test command>` - <what it tests>
- <testing convention or pattern>
```

### Gotchas

Document non-obvious patterns, quirks, and warnings.

```markdown
## Gotchas

- <non-obvious thing that causes issues>
- <ordering dependency or prerequisite>
- <common mistake to avoid>
```

### Workflow

Document development workflow patterns.

```markdown
## Workflow

- <when to do X>
- <preferred approach for Y>
```

---

## Template: Project Root (Minimal)

```markdown
# <Project Name>

<One-line description>

## Commands

| Command | Description |
|---------|-------------|
| `<command>` | <description> |

## Architecture

```
<structure>
```

## Gotchas

- <gotcha>
```

---

## Template: Project Root (Comprehensive)

```markdown
# <Project Name>

<One-line description>

## Commands

| Command | Description |
|---------|-------------|
| `<command>` | <description> |

## Architecture

```
<structure with descriptions>
```

## Key Files

- `<path>` - <purpose>

## Code Style

- <convention>

## Environment

- `<VAR>` - <purpose>

## Testing

- `<command>` - <scope>

## Gotchas

- <gotcha>
```

---

## Template: Package/Module

For packages within a monorepo or distinct modules.

```markdown
# <Package Name>

<Purpose of this package>

## Usage

```
<import/usage example>
```

## Key Exports

- `<export>` - <purpose>

## Dependencies

- `<dependency>` - <why needed>

## Notes

- <important note>
```

---

## Template: Monorepo Root

```markdown
# <Monorepo Name>

<Description>

## Packages

| Package | Description | Path |
|---------|-------------|------|
| `<name>` | <purpose> | `<path>` |

## Commands

| Command | Description |
|---------|-------------|
| `<command>` | <description> |

## Cross-Package Patterns

- <shared pattern>
- <generation/sync pattern>
```

---

## Update Principles

When updating any CLAUDE.md:

1. **Be specific**: Use actual file paths, real commands from this project
2. **Be current**: Verify info against the actual codebase
3. **Be brief**: One line per concept when possible
4. **Be useful**: Would this help a new Claude session understand the project?



================================================================================
SOURCE: data\openclaude\plugins\marketplaces\claude-plugins-official\plugins\mcp-server-dev\skills\build-mcp-app\references\widget-templates.md
================================================================================

# Widget Templates

Minimal HTML scaffolds for the common widget shapes. Copy, fill in, ship.

All templates inline the `App` class from `@modelcontextprotocol/ext-apps` at build time — the iframe's CSP blocks CDN script imports. They're intentionally framework-free; widgets are small enough that React/Vue hydration cost usually isn't worth it.

---

## Serving widget HTML

Widgets are static HTML with one placeholder: `/*__EXT_APPS_BUNDLE__*/` gets replaced at server startup with the `ext-apps/app-with-deps` bundle (rewritten to expose `globalThis.ExtApps`).

```typescript
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { registerAppResource, RESOURCE_MIME_TYPE } from "@modelcontextprotocol/ext-apps/server";

const require = createRequire(import.meta.url);

const bundle = readFileSync(
  require.resolve("@modelcontextprotocol/ext-apps/app-with-deps"), "utf8",
).replace(/export\{([^}]+)\};?\s*$/, (_, body) =>
  "globalThis.ExtApps={" +
  body.split(",").map((p) => {
    const [local, exported] = p.split(" as ").map((s) => s.trim());
    return `${exported ?? local}:${local}`;
  }).join(",") + "};",
);

const pickerHtml = readFileSync("./widgets/picker.html", "utf8")
  .replace("/*__EXT_APPS_BUNDLE__*/", () => bundle);

registerAppResource(server, "Picker", "ui://widgets/picker.html", {},
  async () => ({
    contents: [{ uri: "ui://widgets/picker.html", mimeType: RESOURCE_MIME_TYPE, text: pickerHtml }],
  }),
);
```

Bundle once per server startup (or at build time); reuse the `bundle` string across all widget templates.

---

## Picker (single-select list)

```html
<!doctype html>
<meta charset="utf-8" />
<style>
  body { font: 14px system-ui; margin: 0; }
  ul { list-style: none; padding: 0; margin: 0; max-height: 280px; overflow-y: auto; }
  li { padding: 10px 14px; cursor: pointer; border-bottom: 1px solid #eee; }
  li:hover { background: #f5f5f5; }
  .sub { color: #666; font-size: 12px; }
</style>
<ul id="list"></ul>
<script type="module">
/*__EXT_APPS_BUNDLE__*/
const { App } = globalThis.ExtApps;
(async () => {
  const app = new App({ name: "Picker", version: "1.0.0" }, {});
  const ul = document.getElementById("list");

  app.ontoolresult = ({ content }) => {
    const { items } = JSON.parse(content[0].text);
    ul.innerHTML = "";
    for (const it of items) {
      const li = document.createElement("li");
      li.innerHTML = `<div>${it.label}</div><div class="sub">${it.sub ?? ""}</div>`;
      li.addEventListener("click", () => {
        app.sendMessage({
          role: "user",
          content: [{ type: "text", text: `Selected: ${it.id}` }],
        });
      });
      ul.append(li);
    }
  };

  await app.connect();
})();
</script>
```

**Tool returns:** `{ content: [{ type: "text", text: JSON.stringify({ items: [{ id, label, sub? }] }) }] }`

---

## Confirm dialog

```html
<!doctype html>
<meta charset="utf-8" />
<style>
  body { font: 14px system-ui; margin: 16px; }
  .actions { display: flex; gap: 8px; margin-top: 16px; }
  button { padding: 8px 16px; cursor: pointer; }
  .danger { background: #d33; color: white; border: none; }
</style>
<p id="msg"></p>
<div class="actions">
  <button id="cancel">Cancel</button>
  <button id="confirm" class="danger">Confirm</button>
</div>
<script type="module">
/*__EXT_APPS_BUNDLE__*/
const { App } = globalThis.ExtApps;
(async () => {
  const app = new App({ name: "Confirm", version: "1.0.0" }, {});

  app.ontoolresult = ({ content }) => {
    const { message, confirmLabel } = JSON.parse(content[0].text);
    document.getElementById("msg").textContent = message;
    if (confirmLabel) document.getElementById("confirm").textContent = confirmLabel;
  };

  await app.connect();

  document.getElementById("confirm").addEventListener("click", () => {
    app.sendMessage({ role: "user", content: [{ type: "text", text: "Confirmed." }] });
  });
  document.getElementById("cancel").addEventListener("click", () => {
    app.sendMessage({ role: "user", content: [{ type: "text", text: "Cancelled." }] });
  });
})();
</script>
```

**Tool returns:** `{ content: [{ type: "text", text: JSON.stringify({ message, confirmLabel? }) }] }`

**Note:** For simple confirmation, prefer **elicitation** over a widget — see `../build-mcp-server/references/elicitation.md`. Use this widget when you need custom styling or context beyond what a native form offers.

---

## Progress (long-running)

```html
<!doctype html>
<meta charset="utf-8" />
<style>
  body { font: 14px system-ui; margin: 16px; }
  .bar { height: 8px; background: #eee; border-radius: 4px; overflow: hidden; }
  .fill { height: 100%; background: #2a7; transition: width 200ms; }
</style>
<p id="label">Starting…</p>
<div class="bar"><div id="fill" class="fill" style="width:0%"></div></div>
<script type="module">
/*__EXT_APPS_BUNDLE__*/
const { App } = globalThis.ExtApps;
(async () => {
  const app = new App({ name: "Progress", version: "1.0.0" }, {});
  const label = document.getElementById("label");
  const fill = document.getElementById("fill");

  // The tool result fires when the job completes — intermediate updates
  // arrive via the same handler if the server streams them
  app.ontoolresult = ({ content }) => {
    const state = JSON.parse(content[0].text);
    if (state.progress !== undefined) {
      label.textContent = state.message ?? `${state.progress}/${state.total}`;
      fill.style.width = `${(state.progress / state.total) * 100}%`;
    }
    if (state.done) {
      label.textContent = "Complete";
      fill.style.width = "100%";
    }
  };

  await app.connect();
})();
</script>
```

Server side, emit progress via `extra.sendNotification({ method: "notifications/progress", ... })` — see `apps-sdk-messages.md`.

---

## Display-only (chart / preview)

Display widgets don't call `sendMessage` — they render and sit there. The tool should return a text summary **alongside** the widget so Claude can keep reasoning while the user sees the visual:

```typescript
registerAppTool(server, "show_chart", {
  description: "Render a revenue chart",
  inputSchema: { range: z.enum(["week", "month", "year"]) },
  _meta: { ui: { resourceUri: "ui://widgets/chart.html" } },
}, async ({ range }) => {
  const data = await fetchRevenue(range);
  return {
    content: [{
      type: "text",
      text: `Revenue is up ${data.change}% over the ${range}. Chart rendered.\n\n` +
            JSON.stringify(data.points),
    }],
  };
});
```

```html
<!doctype html>
<meta charset="utf-8" />
<style>body { font: 14px system-ui; margin: 12px; }</style>
<canvas id="chart" width="400" height="200"></canvas>
<script type="module">
/*__EXT_APPS_BUNDLE__*/
const { App } = globalThis.ExtApps;
(async () => {
  const app = new App({ name: "Chart", version: "1.0.0" }, {});

  app.ontoolresult = ({ content }) => {
    // Parse the JSON points from the text content (after the summary line)
    const text = content[0].text;
    const jsonStart = text.indexOf("\n\n") + 2;
    const points = JSON.parse(text.slice(jsonStart));
    drawChart(document.getElementById("chart"), points);
  };

  await app.connect();

  function drawChart(canvas, points) { /* ... */ }
})();
</script>
```

---

## Carousel (multi-item display with actions)

For presenting multiple items (product picks, search results) in a horizontal scroll rail. Patterns that tested well:

- **Skip nav chevrons** — users know how to scroll. `scroll-snap-type` can cause a few-px-off-flush initial render; omit it and `scrollLeft = 0` after rendering.
- **Layout-fork by item count** — `items.length === 1` → detail/PDP layout, `> 1` → carousel. Handle in widget JS, keep the tool schema flat.
- **Put Claude's reasoning in each item** — a `note` field rendered as a small callout on the card gives users the "why" inline.
- **Silent state via `updateModelContext`** — cart/selection changes should inform Claude without spamming the chat. Reserve `sendMessage` for terminal actions ("checkout", "done").
- **Outbound links via `app.openLink`** — `window.open` and `<a target="_blank">` are blocked by the sandbox.

```html
<style>
  .rail { display: flex; gap: 10px; overflow-x: auto; padding: 12px; scrollbar-width: none; }
  .rail::-webkit-scrollbar { display: none; }
  .card { flex: 0 0 220px; border: 1px solid #ddd; border-radius: 6px; padding: 10px; }
  .thumb-box { aspect-ratio: 1 / 1; display: grid; place-items: center; background: #f7f8f8; }
  .thumb { max-width: 100%; max-height: 100%; object-fit: contain; }
  .note { font-size: 12px; color: #666; border-left: 3px solid orange; padding: 2px 8px; margin: 8px 0; }
</style>
<div class="rail" id="rail"></div>
```

**Images:** the iframe CSP blocks remote `img-src`. Fetch thumbnails server-side in the tool handler, embed as `data:` URLs in the JSON payload, and render from those. Add `referrerpolicy="no-referrer"` as a fallback.



================================================================================
SOURCE: data\openclaude\plugins\marketplaces\claude-plugins-official\plugins\playground\skills\playground\templates\code-map.md
================================================================================

# Code Map Template

Use this template when the playground is about visualizing codebase architecture: component relationships, data flow, layer diagrams, system architecture with interactive commenting for feedback.

## Layout

```
+-------------------+----------------------------------+
|                   |                                  |
|  Controls:        |  SVG Canvas                      |
|  • View presets   |  (nodes + connections)           |
|  • Layer toggles  |  with zoom controls              |
|  • Connection     |                                  |
|    type filters   |  Legend (bottom-left)            |
|                   |                                  |
|  Comments (n):    +----------------------------------+
|  • List of user   |  Prompt output                   |
|    comments with  |  [ Copy Prompt ]                 |
|    delete buttons |                                  |
+-------------------+----------------------------------+
```

Code map playgrounds use an SVG canvas for the architecture diagram. Users click components to add comments, which become part of the generated prompt. Layer and connection filters let users focus on specific parts of the system.

## Control types for code maps

| Decision | Control | Example |
|---|---|---|
| System view | Preset buttons | Full System, Chat Flow, Data Flow, Agent System |
| Visible layers | Checkboxes | Client, Server, SDK, Data, External |
| Connection types | Checkboxes with color indicators | Data Flow (blue), Tool Calls (green), Events (red) |
| Component feedback | Click-to-comment modal | Opens modal with textarea for feedback |
| Zoom level | +/−/reset buttons | Scale SVG for detail |

## Canvas rendering

Use an `<svg>` element with dynamically generated nodes and paths. Key patterns:

- **Nodes:** Rounded rectangles with title and subtitle (file path)
- **Connections:** Curved paths (bezier) with arrow markers, styled by type
- **Layer organization:** Group nodes by Y-position bands (e.g., y: 30-80 = Client, y: 130-180 = Server)
- **Click-to-comment:** Click node → open modal → save comment → node gets visual indicator
- **Filtering:** Toggle visibility of nodes by layer, connections by type

```javascript
const nodes = [
  { id: 'api-client', label: 'API Client', subtitle: 'src/api/client.ts',
    x: 100, y: 50, w: 140, h: 45, layer: 'client', color: '#dbeafe' },
  // ...
];

const connections = [
  { from: 'api-client', to: 'server', type: 'data-flow', label: 'HTTP' },
  { from: 'server', to: 'db', type: 'data-flow' },
  // ...
];

function renderDiagram() {
  const visibleNodes = nodes.filter(n => state.layers[n.layer]);
  // Draw connections first (under nodes), then nodes
  connections.forEach(c => drawConnection(c));
  visibleNodes.forEach(n => drawNode(n));
}
```

## Connection types and styling

Define 3-5 connection types with distinct visual styles:

| Type | Color | Style | Use for |
|---|---|---|---|
| `data-flow` | Blue (#3b82f6) | Solid line | Request/response, data passing |
| `tool-call` | Green (#10b981) | Dashed (6,3) | Function calls, API invocations |
| `event` | Red (#ef4444) | Short dash (4,4) | Async events, pub/sub |
| `skill-invoke` | Orange (#f97316) | Long dash (8,4) | Plugin/skill activation |
| `dependency` | Gray (#6b7280) | Dotted | Import/require relationships |

Use SVG markers for arrowheads:

```html
<marker id="arrowhead-blue" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
  <polygon points="0 0, 8 3, 0 6" fill="#3b82f6"/>
</marker>
```

## Comment system

The key differentiator for code maps is click-to-comment functionality:

1. **Click node** → Open modal with component name, file path, textarea
2. **Save comment** → Add to comments list, mark node with visual indicator (colored border)
3. **View comments** → Sidebar list with component name, comment preview, delete button
4. **Delete comment** → Remove from list, update node visual, regenerate prompt

Comments should include the component context:

```javascript
state.comments.push({
  id: Date.now(),
  target: node.id,
  targetLabel: node.label,
  targetFile: node.subtitle,
  text: userInput
});
```

## Prompt output for code maps

The prompt combines system context with user comments:

```
This is the [PROJECT NAME] architecture, focusing on the [visible layers].

Feedback on specific components:

**API Client** (src/api/client.ts):
I want to add retry logic with exponential backoff here.

**Database Manager** (src/db/manager.ts):
Can we add connection pooling? Current implementation creates new connections per request.

**Auth Middleware** (src/middleware/auth.ts):
This should validate JWT tokens and extract user context.
```

Only include comments the user added. Mention which layers are visible if not showing the full system.

## Pre-populating with real data

For a specific codebase, pre-populate with:

- **Nodes:** 15-25 key components with real file paths
- **Connections:** 20-40 relationships based on actual imports/calls
- **Layers:** Logical groupings (UI, API, Business Logic, Data, External)
- **Presets:** "Full System", "Frontend Only", "Backend Only", "Data Flow"

Organize nodes in horizontal bands by layer, with consistent spacing.

## Layer color palette (light theme)

| Layer | Node fill | Description |
|---|---|---|
| Client/UI | #dbeafe (blue-100) | React components, hooks, pages |
| Server/API | #fef3c7 (amber-100) | Express routes, middleware, handlers |
| SDK/Core | #f3e8ff (purple-100) | Core libraries, SDK wrappers |
| Agent/Logic | #dcfce7 (green-100) | Business logic, agents, processors |
| Data | #fce7f3 (pink-100) | Database, cache, storage |
| External | #fbcfe8 (pink-200) | Third-party services, APIs |

## Example topics

- Codebase architecture explorer (modules, imports, data flow)
- Microservices map (services, queues, databases, API gateways)
- React component tree (components, hooks, context, state)
- API architecture (routes, middleware, controllers, models)
- Agent system (prompts, tools, skills, subagents)
- Data pipeline (sources, transforms, sinks, scheduling)
- Plugin/extension architecture (core, plugins, hooks, events)



================================================================================
SOURCE: data\openclaude\plugins\marketplaces\claude-plugins-official\plugins\playground\skills\playground\templates\concept-map.md
================================================================================

# Concept Map Template

Use this template when the playground is about learning, exploration, or mapping relationships: concept maps, knowledge gap identification, scope mapping, task decomposition with dependencies.

## Layout

```
+--------------------------------------+
|  Canvas (draggable nodes, edges)     |
|  with tooltip on hover               |
+-------------------------+------------+
|                         |            |
|  Sidebar:               | Prompt     |
|  • Knowledge levels     | output     |
|  • Connection types     |            |
|  • Node list            | [Copy]     |
|  • Actions              |            |
+-------------------------+------------+
```

Canvas-based playgrounds differ from the two-panel split. The interactive visual IS the control — users drag nodes and draw connections rather than adjusting sliders. The sidebar supplements with toggles and list controls.

## Control types for concept maps

| Decision | Control | Example |
|---|---|---|
| Knowledge level per node | Click-to-cycle button in sidebar list | Know → Fuzzy → Unknown |
| Connection type | Selector before drawing | calls, depends on, contains, reads from |
| Node arrangement | Drag on canvas | spatial layout reflects mental model |
| Which nodes to include | Toggle or checkbox per node | hide/show concepts |
| Actions | Buttons | Auto-layout (force-directed), clear edges, reset |

## Canvas rendering

Use a `<canvas>` element with manual draw calls. Key patterns:

- **Hit testing:** Check mouse position against node bounding circles on mousedown/mousemove
- **Drag:** On mousedown on a node, track offset and update position on mousemove
- **Edge drawing:** Click node A, then click node B. Draw arrow between them with the selected relationship type
- **Tooltips:** On hover, position a div absolutely over the canvas with description text
- **Force-directed auto-layout:** Simple spring simulation — repulsion between all pairs, attraction along edges, iterate 100-200 times with damping

```javascript
function draw() {
  ctx.clearRect(0, 0, W, H);
  edges.forEach(e => drawEdge(e));  // edges first, under nodes
  nodes.forEach(n => drawNode(n));  // nodes on top
}
```

## Prompt output for concept maps

The prompt should be a targeted learning request shaped by the user's knowledge markings:

> "I'm learning [CODEBASE/DOMAIN]. I already understand: [know nodes]. I'm fuzzy on: [fuzzy nodes]. I have no idea about: [unknown nodes]. Here are the relationships I want to understand: [edge list in natural language]. Please explain the fuzzy and unknown concepts, focusing on these relationships. Build on what I already know. Use concrete code references."

Only include edges the user drew. Only mention concepts they marked as fuzzy or unknown in the explanation request.

## Pre-populating with real data

For codebases or domains, pre-populate with:
- **Nodes:** 15-20 key concepts with real file paths and short descriptions
- **Edges:** 20-30 pre-drawn relationships based on actual architecture
- **Knowledge:** Default all to "Fuzzy" so the user adjusts from there
- **Presets:** "Zoom out" (hide internal nodes, show only top-level), "Focus on [layer]" (highlight nodes in one area)

## Example topics

- Codebase architecture map (modules, data flow, state management)
- Framework learning (how React hooks connect, Next.js data fetching layers)
- System design (services, databases, queues, caches and how they relate)
- Task decomposition (goals → sub-tasks with dependency arrows, knowledge tags)
- API surface map (endpoints grouped by resource, shared middleware, auth layers)



================================================================================
SOURCE: data\openclaude\plugins\marketplaces\claude-plugins-official\plugins\playground\skills\playground\templates\data-explorer.md
================================================================================

# Data Explorer Template

Use this template when the playground is about data queries, APIs, pipelines, or structured configuration: SQL builders, API designers, regex builders, pipeline visuals, cron schedules.

## Layout

```
+-------------------+----------------------+
|                   |                      |
|  Controls         |  Formatted output    |
|  grouped by:      |  (syntax-highlighted |
|  • Source/tables  |   code, or a         |
|  • Columns/fields |   visual diagram)    |
|  • Filters        |                      |
|  • Grouping       |                      |
|  • Ordering       |                      |
|  • Limits         |                      |
|                   +----------------------+
|                   |  Prompt output       |
|                   |  [ Copy Prompt ]     |
+-------------------+----------------------+
```

## Control types by decision

| Decision | Control | Example |
|---|---|---|
| Select from available items | Clickable cards/chips | table names, columns, HTTP methods |
| Add filter/condition rows | Add button → row of dropdowns + input | WHERE column op value |
| Join type or aggregation | Dropdown per row | INNER/LEFT/RIGHT, COUNT/SUM/AVG |
| Limit/offset | Slider | result count 1–500 |
| Ordering | Dropdown + ASC/DESC toggle | order by column |
| On/off features | Toggle | show descriptions, include header |

## Preview rendering

Render syntax-highlighted output using `<span>` tags with color classes:

```javascript
function renderPreview() {
  const el = document.getElementById('preview');
  // Color-code by token type
  el.innerHTML = sql
    .replace(/\b(SELECT|FROM|WHERE|JOIN|ON|GROUP BY|ORDER BY|LIMIT)\b/g, '<span class="kw">$1</span>')
    .replace(/\b(users|orders|products)\b/g, '<span class="tbl">$1</span>')
    .replace(/'[^']*'/g, '<span class="str">$&</span>');
}
```

For pipeline-style playgrounds, render a horizontal or vertical flow diagram using positioned divs with arrow connectors.

## Prompt output for data

Frame it as a specification of what to build, not the raw query itself:

> "Write a SQL query that joins orders to users on user_id, filters for orders after 2024-01-01 with total > $50, groups by user, and returns the top 10 users by order count."

Include the schema context (table names, column types) so the prompt is self-contained.

## Example topics

- SQL query builder (tables, joins, filters, group by, order by, limit)
- API endpoint designer (routes, methods, request/response field builder)
- Data transformation pipeline (source → filter → map → aggregate → output)
- Regex builder (sample strings, match groups, live highlight)
- Cron schedule builder (visual timeline, interval, day toggles)
- GraphQL query builder (type selection, field picker, nested resolvers)



================================================================================
SOURCE: data\openclaude\plugins\marketplaces\claude-plugins-official\plugins\playground\skills\playground\templates\design-playground.md
================================================================================

# Design Playground Template

Use this template when the playground is about visual design decisions: components, layouts, spacing, color, typography, animation, responsive behavior.

## Layout

```
+-------------------+----------------------+
|                   |                      |
|  Controls         |  Live component/     |
|  grouped by:      |  layout preview      |
|  • Spacing        |  (renders in a       |
|  • Color          |   mock page or       |
|  • Typography     |   isolated card)     |
|  • Shadow/Border  |                      |
|  • Interaction    |                      |
|                   +----------------------+
|                   |  Prompt output       |
|                   |  [ Copy Prompt ]     |
+-------------------+----------------------+
```

## Control types by decision

| Decision | Control | Example |
|---|---|---|
| Sizes, spacing, radius | Slider | border-radius 0–24px |
| On/off features | Toggle | show border, hover effect |
| Choosing from a set | Dropdown | font-family, easing curve |
| Colors | Hue + saturation + lightness sliders | shadow color, accent |
| Layout structure | Clickable cards | sidebar-left / top-nav / no-nav |
| Responsive behavior | Viewport-width slider | watch grid reflow at breakpoints |

## Preview rendering

Apply state values directly to a preview element's inline styles:

```javascript
function renderPreview() {
  const el = document.getElementById('preview');
  el.style.borderRadius = state.radius + 'px';
  el.style.padding = state.padding + 'px';
  el.style.boxShadow = state.shadow
    ? `0 ${state.shadowY}px ${state.shadowBlur}px rgba(0,0,0,${state.shadowOpacity})`
    : 'none';
}
```

Show the preview on both light and dark backgrounds if relevant. Include a context toggle.

## Prompt output for design

Frame it as a direction to a developer, not a spec sheet:

> "Update the card to feel soft and elevated: 12px border-radius, 24px horizontal padding, a medium box-shadow (0 4px 12px rgba(0,0,0,0.1)). On hover, lift it with translateY(-1px) and deepen the shadow slightly."

If the user is working in Tailwind, suggest Tailwind classes. If raw CSS, use CSS properties.

## Example topics

- Button style explorer (radius, padding, weight, hover/active states)
- Card component (shadow depth, radius, content layout, image)
- Layout builder (sidebar width, content max-width, header height, grid)
- Typography scale (base size, ratio, line heights across h1-body-caption)
- Color palette generator (primary hue, derive secondary/accent/surface)
- Dashboard density (airy → compact slider that scales everything proportionally)
- Modal/dialog (width, overlay opacity, entry animation, corner radius)



================================================================================
SOURCE: data\openclaude\plugins\marketplaces\claude-plugins-official\plugins\playground\skills\playground\templates\diff-review.md
================================================================================

# Diff Review Template

Use this template when the playground is about reviewing code diffs: git commits, pull requests, code changes with interactive line-by-line commenting for feedback.

## Layout

```
+-------------------+----------------------------------+
|                   |                                  |
|  Commit Header:   |  Diff Content                    |
|  • Hash           |  (files with hunks)              |
|  • Message        |  with line numbers               |
|  • Author/Date    |  and +/- indicators              |
|                   |                                  |
+-------------------+----------------------------------+
|  Prompt Output Panel (fixed bottom-right)            |
|  [ Copy All ]                                        |
|  Shows all comments formatted for prompt             |
+------------------------------------------------------+
```

Diff review playgrounds display git diffs with syntax highlighting. Users click lines to add comments, which become part of the generated prompt for code review feedback.

## Control types for diff review

| Feature | Control | Behavior |
|---|---|---|
| Line commenting | Click any diff line | Opens textarea below the line |
| Comment indicator | Badge on commented lines | Shows which lines have feedback |
| Save/Cancel | Buttons in comment box | Persist or discard comment |
| Copy prompt | Button in prompt panel | Copies all comments to clipboard |

## Diff rendering

Parse diff data into structured format for rendering:

```javascript
const diffData = [
  {
    file: "path/to/file.py",
    hunks: [
      {
        header: "@@ -41,13 +41,13 @@ function context",
        lines: [
          { type: "context", oldNum: 41, newNum: 41, content: "unchanged line" },
          { type: "deletion", oldNum: 42, newNum: null, content: "removed line" },
          { type: "addition", oldNum: null, newNum: 42, content: "added line" },
        ]
      }
    ]
  }
];
```

## Line type styling

| Type | Background | Text Color | Prefix |
|---|---|---|---|
| `context` | transparent | default | ` ` (space) |
| `addition` | green tint (#dafbe1 light / rgba(46,160,67,0.15) dark) | green (#1a7f37 light / #7ee787 dark) | `+` |
| `deletion` | red tint (#ffebe9 light / rgba(248,81,73,0.15) dark) | red (#cf222e light / #f85149 dark) | `-` |
| `hunk-header` | blue tint (#ddf4ff light) | blue (#0969da light) | `@@` |

## Comment system

Each diff line gets a unique identifier for comment tracking:

```javascript
const comments = {}; // { lineId: commentText }

function selectLine(lineId, lineEl) {
  // Deselect previous
  document.querySelectorAll('.diff-line.selected').forEach(el =>
    el.classList.remove('selected'));
  document.querySelectorAll('.comment-box.active').forEach(el =>
    el.classList.remove('active'));

  // Select new
  lineEl.classList.add('selected');
  document.getElementById(`comment-box-${lineId}`).classList.add('active');
}

function saveComment(lineId) {
  const textarea = document.getElementById(`textarea-${lineId}`);
  const comment = textarea.value.trim();

  if (comment) {
    comments[lineId] = comment;
  } else {
    delete comments[lineId];
  }

  renderDiff(); // Re-render to show comment indicator
  updatePromptOutput();
}
```

## Prompt output format

Generate a structured code review format:

```javascript
function updatePromptOutput() {
  const commentKeys = Object.keys(comments);

  if (commentKeys.length === 0) {
    promptContent.innerHTML = '<span class="no-comments">Click on any line to add a comment...</span>';
    return;
  }

  let output = 'Code Review Comments:\n\n';

  commentKeys.forEach(lineId => {
    const lineEl = document.querySelector(`[data-line-id="${lineId}"]`);
    const file = lineEl.dataset.file;
    const lineNum = lineEl.dataset.lineNum;
    const content = lineEl.dataset.content;

    output += `📍 ${file}:${lineNum}\n`;
    output += `   Code: ${content.trim()}\n`;
    output += `   Comment: ${comments[lineId]}\n\n`;
  });

  promptContent.textContent = output;
}
```

## Data attributes for line elements

Store metadata on each line element for prompt generation:

```html
<div class="diff-line addition"
     data-line-id="0-1-5"
     data-file="src/utils/handler.py"
     data-line-num="45"
     data-content="subagent_id = tracker.register()">
```

## Pre-populating with real data

To create a diff viewer for a specific commit:

1. Run `git show <commit> --format="%H%n%s%n%an%n%ad" -p`
2. Parse the output into the `diffData` structure
3. Include commit metadata in the header section

## Theme support

Support both light and dark modes:

```css
/* Light mode */
body { background: #f6f8fa; color: #1f2328; }
.file-card { background: #ffffff; border: 1px solid #d0d7de; }
.diff-line.addition { background: #dafbe1; }
.diff-line.deletion { background: #ffebe9; }

/* Dark mode */
body { background: #0d1117; color: #c9d1d9; }
.file-card { background: #161b22; border: 1px solid #30363d; }
.diff-line.addition { background: rgba(46, 160, 67, 0.15); }
.diff-line.deletion { background: rgba(248, 81, 73, 0.15); }
```

## Interactive features

- **Hover hint:** Show "Click to comment" tooltip on line hover
- **Comment indicator:** Badge (💬) on lines with saved comments
- **Toast notification:** "Copied to clipboard!" feedback on copy
- **Edit existing:** Allow editing previously saved comments

## Example topics

- Git commit review (single commit diff with line comments)
- Pull request review (multiple commits, file-level and line-level comments)
- Code diff comparison (before/after refactoring)
- Merge conflict resolution (showing both versions with annotations)
- Code audit (security review with findings per line)



================================================================================
SOURCE: data\openclaude\plugins\marketplaces\claude-plugins-official\plugins\playground\skills\playground\templates\document-critique.md
================================================================================

# Document Critique Template

Use this template when the playground helps review and critique documents: SKILL.md files, READMEs, specs, proposals, or any text that needs structured feedback with approve/reject/comment workflow.

## Layout

```
+---------------------------+--------------------+
|                           |                    |
|  Document content         |  Suggestions panel |
|  with line numbers        |  (filterable list) |
|  and suggestion           |  • Approve         |
|  highlighting             |  • Reject          |
|                           |  • Comment         |
|                           |                    |
+---------------------------+--------------------+
|  Prompt output (approved + commented items)    |
|  [ Copy Prompt ]                               |
+------------------------------------------------+
```

## Key components

### Document panel (left)
- Display full document with line numbers
- Highlight lines with suggestions using a colored left border
- Color-code by status: pending (amber), approved (green), rejected (red with opacity)
- Click a suggestion card to scroll to the relevant line

### Suggestions panel (right)
- Filter tabs: All / Pending / Approved / Rejected
- Stats in header showing counts for each status
- Each suggestion card shows:
  - Line reference (e.g., "Line 3" or "Lines 17-24")
  - The suggestion text
  - Action buttons: Approve / Reject / Comment (or Reset if already decided)
  - Optional textarea for user comments

### Prompt output (bottom)
- Generates a prompt only from approved suggestions and user comments
- Groups by: Approved Improvements, Additional Feedback, Rejected (for context)
- Copy button with "Copied!" feedback

## State structure

```javascript
const suggestions = [
  {
    id: 1,
    lineRef: "Line 3",
    targetText: "description: Creates interactive...",
    suggestion: "The description is too long. Consider shortening.",
    category: "clarity",  // clarity, completeness, performance, accessibility, ux
    status: "pending",    // pending, approved, rejected
    userComment: ""
  },
  // ... more suggestions
];

let state = {
  suggestions: [...],
  activeFilter: "all",
  activeSuggestionId: null
};
```

## Suggestion matching to lines

Match suggestions to document lines by parsing the lineRef:

```javascript
const suggestion = state.suggestions.find(s => {
  const match = s.lineRef.match(/Line[s]?\s*(\d+)/);
  if (match) {
    const targetLine = parseInt(match[1]);
    return Math.abs(targetLine - lineNum) <= 2; // fuzzy match nearby lines
  }
  return false;
});
```

## Document rendering

Handle markdown-style formatting inline:

```javascript
// Skip ``` lines, wrap content in code-block-wrapper
if (line.startsWith('```')) {
  inCodeBlock = !inCodeBlock;
  // Open or close wrapper div
}

// Headers
if (line.startsWith('# ')) renderedLine = `<h1>...</h1>`;
if (line.startsWith('## ')) renderedLine = `<h2>...</h2>`;

// Inline formatting (outside code blocks)
renderedLine = renderedLine.replace(/`([^`]+)`/g, '<code>$1</code>');
renderedLine = renderedLine.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
```

## Prompt output generation

Only include actionable items:

```javascript
function updatePrompt() {
  const approved = state.suggestions.filter(s => s.status === 'approved');
  const withComments = state.suggestions.filter(s => s.userComment?.trim());

  if (approved.length === 0 && withComments.length === 0) {
    // Show placeholder
    return;
  }

  let prompt = 'Please update [DOCUMENT] with the following changes:\n\n';

  if (approved.length > 0) {
    prompt += '## Approved Improvements\n\n';
    for (const s of approved) {
      prompt += `**${s.lineRef}:** ${s.suggestion}`;
      if (s.userComment?.trim()) {
        prompt += `\n  → User note: ${s.userComment.trim()}`;
      }
      prompt += '\n\n';
    }
  }

  // Additional feedback from non-approved items with comments
  // Rejected items listed for context only
}
```

## Styling highlights

```css
.doc-line.has-suggestion {
  border-left: 3px solid #bf8700;  /* amber for pending */
  background: rgba(191, 135, 0, 0.08);
}

.doc-line.approved {
  border-left-color: #1a7f37;  /* green */
  background: rgba(26, 127, 55, 0.08);
}

.doc-line.rejected {
  border-left-color: #cf222e;  /* red */
  background: rgba(207, 34, 46, 0.08);
  opacity: 0.6;
}
```

## Pre-populating suggestions

When building a critique playground for a specific document:

1. Read the document content
2. Analyze and generate suggestions with:
   - Specific line references
   - Clear, actionable suggestion text
   - Category tags (clarity, completeness, performance, accessibility, ux)
3. Embed both the document content and suggestions array in the HTML

## Example use cases

- SKILL.md review (skill definition quality, completeness, clarity)
- README critique (documentation quality, missing sections, unclear explanations)
- Spec review (requirements clarity, missing edge cases, ambiguity)
- Proposal feedback (structure, argumentation, missing context)
- Code comment review (docstring quality, inline comment usefulness)



================================================================================
SOURCE: templates\agent-file-template.md
================================================================================

# [PROJECT NAME] Development Guidelines

Auto-generated from all feature plans. Last updated: [DATE]

## Active Technologies
[EXTRACTED FROM ALL PLAN.MD FILES]

## Project Structure
```
[ACTUAL STRUCTURE FROM PLANS]
```

## Commands
[ONLY COMMANDS FOR ACTIVE TECHNOLOGIES]

## Code Style
[LANGUAGE-SPECIFIC, ONLY FOR LANGUAGES IN USE]

## Recent Changes
[LAST 3 FEATURES AND WHAT THEY ADDED]

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->


================================================================================
SOURCE: templates\plan-template.md
================================================================================

# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
   make the time widget more visible
4. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
5. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, or `GEMINI.md` for Gemini CLI).
6. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
7. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
8. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary
[Extract from feature spec: primary requirement + technical approach from research]

## Technical Context
**Language/Version**: [e.g., Python 3.11, Swift 5.9, Rust 1.75 or NEEDS CLARIFICATION]  
**Primary Dependencies**: [e.g., FastAPI, UIKit, LLVM or NEEDS CLARIFICATION]  
**Storage**: [if applicable, e.g., PostgreSQL, CoreData, files or N/A]  
**Testing**: [e.g., pytest, XCTest, cargo test or NEEDS CLARIFICATION]  
**Target Platform**: [e.g., Linux server, iOS 15+, WASM or NEEDS CLARIFICATION]
**Project Type**: [single/web/mobile - determines source structure]  
**Performance Goals**: [domain-specific, e.g., 1000 req/s, 10k lines/sec, 60 fps or NEEDS CLARIFICATION]  
**Constraints**: [domain-specific, e.g., <200ms p95, <100MB memory, offline-capable or NEEDS CLARIFICATION]  
**Scale/Scope**: [domain-specific, e.g., 10k users, 1M LOC, 50 screens or NEEDS CLARIFICATION]

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Simplicity**:
- Projects: [#] (max 3 - e.g., api, cli, tests)
- Using framework directly? (no wrapper classes)
- Single data model? (no DTOs unless serialization differs)
- Avoiding patterns? (no Repository/UoW without proven need)

**Architecture**:
- EVERY feature as library? (no direct app code)
- Libraries listed: [name + purpose for each]
- CLI per library: [commands with --help/--version/--format]
- Library docs: llms.txt format planned?

**Testing (NON-NEGOTIABLE)**:
- RED-GREEN-Refactor cycle enforced? (test MUST fail first)
- Git commits show tests before implementation?
- Order: Contract→Integration→E2E→Unit strictly followed?
- Real dependencies used? (actual DBs, not mocks)
- Integration tests for: new libraries, contract changes, shared schemas?
- FORBIDDEN: Implementation before test, skipping RED phase

**Observability**:
- Structured logging included?
- Frontend logs → backend? (unified stream)
- Error context sufficient?

**Versioning**:
- Version number assigned? (MAJOR.MINOR.BUILD)
- BUILD increments on every change?
- Breaking changes handled? (parallel tests, migration plan)

## Project Structure

### Documentation (this feature)
```
specs/[###-feature]/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
# Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure]
```

**Structure Decision**: [DEFAULT to Option 1 unless Technical Context indicates web/mobile app]

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context** above:
   - For each NEEDS CLARIFICATION → research task
   - For each dependency → best practices task
   - For each integration → patterns task

2. **Generate and dispatch research agents**:
   ```
   For each unknown in Technical Context:
     Task: "Research {unknown} for {feature context}"
   For each technology choice:
     Task: "Find best practices for {tech} in {domain}"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all NEEDS CLARIFICATION resolved

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - Entity name, fields, relationships
   - Validation rules from requirements
   - State transitions if applicable

2. **Generate API contracts** from functional requirements:
   - For each user action → endpoint
   - Use standard REST/GraphQL patterns
   - Output OpenAPI/GraphQL schema to `/contracts/`

3. **Generate contract tests** from contracts:
   - One test file per endpoint
   - Assert request/response schemas
   - Tests must fail (no implementation yet)

4. **Extract test scenarios** from user stories:
   - Each story → integration test scenario
   - Quickstart test = story validation steps

5. **Update agent file incrementally** (O(1) operation):
   - Run `/scripts/update-agent-context.sh [claude|gemini|copilot]` for your AI assistant
   - If exists: Add only NEW tech from current plan
   - Preserve manual additions between markers
   - Update recent changes (keep last 3)
   - Keep under 150 lines for token efficiency
   - Output to repository root

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, agent-specific file

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs (contracts, data model, quickstart)
- Each contract → contract test task [P]
- Each entity → model creation task [P] 
- Each user story → integration test task
- Implementation tasks to make tests pass

**Ordering Strategy**:
- TDD order: Tests before implementation 
- Dependency order: Models before services before UI
- Mark [P] for parallel execution (independent files)

**Estimated Output**: 25-30 numbered, ordered tasks in tasks.md

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |


## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [ ] Phase 0: Research complete (/plan command)
- [ ] Phase 1: Design complete (/plan command)
- [ ] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [ ] Initial Constitution Check: PASS
- [ ] Post-Design Constitution Check: PASS
- [ ] All NEEDS CLARIFICATION resolved
- [ ] Complexity deviations documented

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*


================================================================================
SOURCE: templates\spec-template.md
================================================================================

# Feature Specification: [FEATURE NAME]

**Feature Branch**: `[###-feature-name]`  
**Created**: [DATE]  
**Status**: Draft  
**Input**: User description: "$ARGUMENTS"

## Execution Flow (main)
```
1. Parse user description from Input
   → If empty: ERROR "No feature description provided"
2. Extract key concepts from description
   → Identify: actors, actions, data, constraints
3. For each unclear aspect:
   → Mark with [NEEDS CLARIFICATION: specific question]
4. Fill User Scenarios & Testing section
   → If no clear user flow: ERROR "Cannot determine user scenarios"
5. Generate Functional Requirements
   → Each requirement must be testable
   → Mark ambiguous requirements
6. Identify Key Entities (if data involved)
7. Run Review Checklist
   → If any [NEEDS CLARIFICATION]: WARN "Spec has uncertainties"
   → If implementation details found: ERROR "Remove tech details"
8. Return: SUCCESS (spec ready for planning)
```

---

## ⚡ Quick Guidelines
- ✅ Focus on WHAT users need and WHY
- ❌ Avoid HOW to implement (no tech stack, APIs, code structure)
- 👥 Written for business stakeholders, not developers

### Section Requirements
- **Mandatory sections**: Must be completed for every feature
- **Optional sections**: Include only when relevant to the feature
- When a section doesn't apply, remove it entirely (don't leave as "N/A")

### For AI Generation
When creating this spec from a user prompt:
1. **Mark all ambiguities**: Use [NEEDS CLARIFICATION: specific question] for any assumption you'd need to make
2. **Don't guess**: If the prompt doesn't specify something (e.g., "login system" without auth method), mark it
3. **Think like a tester**: Every vague requirement should fail the "testable and unambiguous" checklist item
4. **Common underspecified areas**:
   - User types and permissions
   - Data retention/deletion policies  
   - Performance targets and scale
   - Error handling behaviors
   - Integration requirements
   - Security/compliance needs

---

## User Scenarios & Testing *(mandatory)*

### Primary User Story
[Describe the main user journey in plain language]

### Acceptance Scenarios
1. **Given** [initial state], **When** [action], **Then** [expected outcome]
2. **Given** [initial state], **When** [action], **Then** [expected outcome]

### Edge Cases
- What happens when [boundary condition]?
- How does system handle [error scenario]?

## Requirements *(mandatory)*

### Functional Requirements
- **FR-001**: System MUST [specific capability, e.g., "allow users to create accounts"]
- **FR-002**: System MUST [specific capability, e.g., "validate email addresses"]  
- **FR-003**: Users MUST be able to [key interaction, e.g., "reset their password"]
- **FR-004**: System MUST [data requirement, e.g., "persist user preferences"]
- **FR-005**: System MUST [behavior, e.g., "log all security events"]

*Example of marking unclear requirements:*
- **FR-006**: System MUST authenticate users via [NEEDS CLARIFICATION: auth method not specified - email/password, SSO, OAuth?]
- **FR-007**: System MUST retain user data for [NEEDS CLARIFICATION: retention period not specified]

### Key Entities *(include if feature involves data)*
- **[Entity 1]**: [What it represents, key attributes without implementation]
- **[Entity 2]**: [What it represents, relationships to other entities]

---

## Review & Acceptance Checklist
*GATE: Automated checks run during main() execution*

### Content Quality
- [ ] No implementation details (languages, frameworks, APIs)
- [ ] Focused on user value and business needs
- [ ] Written for non-technical stakeholders
- [ ] All mandatory sections completed

### Requirement Completeness
- [ ] No [NEEDS CLARIFICATION] markers remain
- [ ] Requirements are testable and unambiguous  
- [ ] Success criteria are measurable
- [ ] Scope is clearly bounded
- [ ] Dependencies and assumptions identified

---

## Execution Status
*Updated by main() during processing*

- [ ] User description parsed
- [ ] Key concepts extracted
- [ ] Ambiguities marked
- [ ] User scenarios defined
- [ ] Requirements generated
- [ ] Entities identified
- [ ] Review checklist passed

---



================================================================================
SOURCE: templates\tasks-template.md
================================================================================

# Tasks: [FEATURE NAME]

**Input**: Design documents from `/specs/[###-feature-name]/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → If not found: ERROR "No implementation plan found"
   → Extract: tech stack, libraries, structure
2. Load optional design documents:
   → data-model.md: Extract entities → model tasks
   → contracts/: Each file → contract test task
   → research.md: Extract decisions → setup tasks
3. Generate tasks by category:
   → Setup: project init, dependencies, linting
   → Tests: contract tests, integration tests
   → Core: models, services, CLI commands
   → Integration: DB, middleware, logging
   → Polish: unit tests, performance, docs
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph
7. Create parallel execution examples
8. Validate task completeness:
   → All contracts have tests?
   → All entities have models?
   → All endpoints implemented?
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Single project**: `src/`, `tests/` at repository root
- **Web app**: `backend/src/`, `frontend/src/`
- **Mobile**: `api/src/`, `ios/src/` or `android/src/`
- Paths shown below assume single project - adjust based on plan.md structure

## Phase 3.1: Setup
- [ ] T001 Create project structure per implementation plan
- [ ] T002 Initialize [language] project with [framework] dependencies
- [ ] T003 [P] Configure linting and formatting tools

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**
- [ ] T004 [P] Contract test POST /api/users in tests/contract/test_users_post.py
- [ ] T005 [P] Contract test GET /api/users/{id} in tests/contract/test_users_get.py
- [ ] T006 [P] Integration test user registration in tests/integration/test_registration.py
- [ ] T007 [P] Integration test auth flow in tests/integration/test_auth.py

## Phase 3.3: Core Implementation (ONLY after tests are failing)
- [ ] T008 [P] User model in src/models/user.py
- [ ] T009 [P] UserService CRUD in src/services/user_service.py
- [ ] T010 [P] CLI --create-user in src/cli/user_commands.py
- [ ] T011 POST /api/users endpoint
- [ ] T012 GET /api/users/{id} endpoint
- [ ] T013 Input validation
- [ ] T014 Error handling and logging

## Phase 3.4: Integration
- [ ] T015 Connect UserService to DB
- [ ] T016 Auth middleware
- [ ] T017 Request/response logging
- [ ] T018 CORS and security headers

## Phase 3.5: Polish
- [ ] T019 [P] Unit tests for validation in tests/unit/test_validation.py
- [ ] T020 Performance tests (<200ms)
- [ ] T021 [P] Update docs/api.md
- [ ] T022 Remove duplication
- [ ] T023 Run manual-testing.md

## Dependencies
- Tests (T004-T007) before implementation (T008-T014)
- T008 blocks T009, T015
- T016 blocks T018
- Implementation before polish (T019-T023)

## Parallel Example
```
# Launch T004-T007 together:
Task: "Contract test POST /api/users in tests/contract/test_users_post.py"
Task: "Contract test GET /api/users/{id} in tests/contract/test_users_get.py"
Task: "Integration test registration in tests/integration/test_registration.py"
Task: "Integration test auth in tests/integration/test_auth.py"
```

## Notes
- [P] tasks = different files, no dependencies
- Verify tests fail before implementing
- Commit after each task
- Avoid: vague tasks, same file conflicts

## Task Generation Rules
*Applied during main() execution*

1. **From Contracts**:
   - Each contract file → contract test task [P]
   - Each endpoint → implementation task
   
2. **From Data Model**:
   - Each entity → model creation task [P]
   - Relationships → service layer tasks
   
3. **From User Stories**:
   - Each story → integration test [P]
   - Quickstart scenarios → validation tasks

4. **Ordering**:
   - Setup → Tests → Models → Services → Endpoints → Polish
   - Dependencies block parallel execution

## Validation Checklist
*GATE: Checked by main() before returning*

- [ ] All contracts have corresponding tests
- [ ] All entities have model tasks
- [ ] All tests come before implementation
- [ ] Parallel tasks truly independent
- [ ] Each task specifies exact file path
- [ ] No task modifies same file as another [P] task
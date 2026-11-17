/*
 * Developer workflows: Explain Code, Map a Project, Review a Change, Fix a Failing Test.
 * Each follows its Zephium skill (crates/zephium-app/skills/<name>/SKILL.md). They read the
 * invented sample repository in ../repo.ts through the simulated Computer tools.
 */
import { excerpt, ROOT } from "../repo";
import type { WorkflowFixture } from "../types";
import { create, finish, ifApproved, part, say, skill, turn } from "./kit";

const DEV = ["folder_read"] as WorkflowFixture["needs"];

export const explainCode: WorkflowFixture = {
  id: "explain-code",
  title: "Explain Code",
  persona: "developer",
  skill: "explain-code",
  origin: "zephium",
  prompt: `Explain how this code works: ${ROOT} — how does a checkout get from the request to the database?`,
  examples: [`Explain how this code works: ${ROOT}`, "Explain how the checkout total is computed in harbor-shop"],
  folder: ROOT,
  needs: DEV,
  aegisMode: "structured",
  fidelity: "Follows explain-code: one read-only Code part, then a flow diagram, up to three exact code excerpts and a reply. Excerpts are cut from the sample files by line number, so no line is invented.",
  turns: [
    say(
      "Reading the checkout path in harbor-shop",
      skill("explain-code"),
      part({
        key: "code",
        title: "Code",
        helper: "computer",
        goal: "Follow a checkout from the HTTP handler to the database",
        brief: "Open the handler for POST /checkout, follow each call one step in and one step out, and return the path and line ranges that carry the idea, each with a one-line note. Read only.",
        turns: [
          turn("Finding the entry point", { tool: "grep", pattern: "def do_POST|def total|def tax_for|def save_order", glob: "*.py" }),
          turn("Reading the handler and what it calls", { tool: "read_file", path: "shop/api.py" }, { tool: "read_file", path: "shop/cart.py" }, { tool: "read_file", path: "shop/pricing.py" }, { tool: "read_file", path: "shop/store.py" }),
        ],
        finish: {
          summary: "4 files · 5 steps",
          digest: "shop/api.py 11-18 do_POST: Cart → total + tax_for → save_order. shop/cart.py 12-14 total: discount_percent is multiplied as a fraction. shop/pricing.py 6-7 tax_for on the discounted total. shop/store.py 8-12 save_order inserts into SQLite.",
        },
      }),
    ),
    say(
      "Composing the explanation",
      create(
        "diagram",
        "How a checkout reaches the database",
        {
          nodes: [
            { id: "client", name: "Storefront", kind: "client", note: "web/src/lib/api.ts" },
            { id: "post", name: "Checkout.do_POST", kind: "service", note: "shop/api.py" },
            { id: "cart", name: "Cart.total", kind: "service", note: "shop/cart.py" },
            { id: "tax", name: "tax_for", kind: "service", note: "shop/pricing.py" },
            { id: "save", name: "save_order", kind: "service", note: "shop/store.py" },
            { id: "db", name: "orders.db", kind: "store", vendor: "sqlite.org", note: "SQLite" },
          ],
          edges: [
            { from: "client", to: "post", label: "JSON" },
            { from: "post", to: "cart", label: "Items" },
            { from: "cart", to: "tax", label: "Total" },
            { from: "post", to: "save", label: "Order" },
            { from: "save", to: "db", label: "Row" },
          ],
        },
        ["shop/api.py", "shop/cart.py", "shop/pricing.py", "shop/store.py"],
      ),
      create(
        "code",
        "api.py · Checkout.do_POST",
        { language: "python", text: excerpt("shop/api.py", 10, 18), notes: [{ from: 4, to: 4, text: "The discount arrives as a percentage from the client." }, { from: 5, to: 5, text: "Tax is added on the discounted total, computed twice." }] },
        ["shop/api.py"],
      ),
      create(
        "code",
        "cart.py · Cart.total",
        { language: "python", text: excerpt("shop/cart.py", 12, 14), notes: [{ from: 3, to: 3, text: "The one thing a reader would miss: a percentage (10) is used as a fraction (0.10)." }] },
        ["shop/cart.py"],
      ),
    ),
    say(
      "Done",
      finish(
        {
          headline: "Prices a cart, adds tax, saves one row",
          text: "A POST to **/checkout** builds a `Cart`, adds regional tax to its total and inserts the order into SQLite. The discount is a percentage but `Cart.total` treats it as a fraction.",
          points: ["Input: items, discount, region, customer", "Output: order id and total", "Fails on any discount above 1%"],
        },
        "Diagram and two excerpts are on the canvas.",
        ["shop/api.py", "shop/cart.py"],
        ["Fix the discount bug", "Map the whole project"],
      ),
    ),
  ],
};

export const mapProject: WorkflowFixture = {
  id: "map-a-project",
  title: "Map a Project",
  persona: "developer",
  skill: "map-a-project",
  origin: "zephium",
  prompt: `Map the architecture of ${ROOT}`,
  examples: [`Map the architecture of ${ROOT}`, "Map this project: harbor-shop"],
  folder: ROOT,
  needs: DEV,
  aegisMode: "structured",
  fidelity: "Follows map-a-project: describe_project and one Architecture part in the same turn, then one diagram and a reply. The project object is computed from the sample repository's manifests by a small port of project.rs, not written by a model.",
  turns: [
    say(
      "Reading the project and its architecture together",
      skill("map-a-project"),
      { tool: "describe_project", path: ROOT },
      part({
        key: "architecture",
        title: "Architecture",
        helper: "computer",
        goal: "Entry points, modules, imports and external services",
        brief: "Find the entry points, which modules import which, and the external services the code calls. Read only; stop after about twenty files.",
        turns: [
          turn("Listing modules", { tool: "glob", pattern: "**/*.py" }, { tool: "glob", pattern: "web/src/**" }),
          turn("Following imports", { tool: "grep", pattern: "^from shop|^import" }, { tool: "grep", pattern: "fetch\\(|sqlite3" }),
          turn("Reading the two edges of the system", { tool: "read_file", path: "shop/api.py" }, { tool: "read_file", path: "web/src/lib/api.ts" }),
        ],
        finish: {
          summary: "4 layers · 8 modules",
          digest: "Entry: shop/api.py Checkout (POST /checkout) and web/src/main.ts. shop.api imports shop.cart, shop.pricing, shop.store. web/src/lib/api.ts calls /checkout. External: SQLite (orders.db). No queue, no third-party API.",
        },
      }),
    ),
    say(
      "Drawing the map",
      create(
        "diagram",
        "harbor-shop from storefront to SQLite",
        {
          layers: [
            { id: "client", name: "Client" },
            { id: "api", name: "API" },
            { id: "domain", name: "Domain" },
            { id: "data", name: "Data" },
          ],
          nodes: [
            { id: "app", name: "App.svelte", kind: "client", layer: "client", note: "web/src", vendor: "svelte.dev" },
            { id: "client", name: "api.ts", kind: "client", layer: "client", note: "web/src/lib" },
            { id: "checkout", name: "Checkout", kind: "gateway", layer: "api", note: "shop/api.py" },
            { id: "cart", name: "Cart", kind: "service", layer: "domain", note: "shop/cart.py" },
            { id: "pricing", name: "pricing", kind: "service", layer: "domain", note: "shop/pricing.py" },
            { id: "store", name: "store", kind: "service", layer: "data", note: "shop/store.py" },
            { id: "sqlite", name: "orders.db", kind: "store", layer: "data", vendor: "sqlite.org" },
          ],
          edges: [
            { from: "app", to: "client" },
            { from: "client", to: "checkout", label: "POST /checkout" },
            { from: "checkout", to: "cart", label: "Items" },
            { from: "checkout", to: "pricing", label: "Total" },
            { from: "checkout", to: "store", label: "Order" },
            { from: "store", to: "sqlite", label: "SQL" },
          ],
        },
        ["shop/api.py", "web/src/lib/api.ts"],
      ),
    ),
    say(
      "Done",
      finish(
        {
          headline: "A Svelte storefront over a stdlib Python service and SQLite",
          text: "Read `shop/api.py` first: one handler wires the cart, tax and storage together. Then `shop/cart.py`, where every price is decided.",
          points: ["No framework: http.server only", "One unittest module covers the cart, nothing else", "The web app has no tests yet"],
        },
        "Project and map are on the canvas.",
        ["shop/api.py"],
        ["Explain the checkout code", "Fix the failing test"],
      ),
    ),
  ],
};

const PR = "harbor/shop#42";
const PR_URL = "https://github.example/harbor/shop/pull/42";
export const reviewChange: WorkflowFixture = {
  id: "review-a-change",
  title: "Review a Change",
  persona: "developer",
  skill: "review-a-change",
  origin: "zephium",
  prompt: `Review this pull request: ${PR_URL}`,
  examples: [`Review this pull request: ${PR_URL}`, `Review my changes in ${ROOT}`],
  folder: ROOT,
  needs: ["connections", "folder_read", "tests"],
  aegisMode: "quick",
  fidelity: "Follows review-a-change: the Change part reads the pull request through the person's connection (the public gh broker reads public pull requests only), a Code part reads the surrounding code and runs the project's own tests, then a subject, a requirements list, one suggested diff, a GitHub draft and a reply. Posting the draft would go through Confirm.",
  turns: [
    say(
      "Reading the pull request and the code it touches",
      skill("review-a-change"),
      part({
        key: "change",
        title: "Change",
        helper: "connection",
        service: "GitHub",
        goal: `Read ${PR}: description, comments and diff`,
        asks: { question: "Use your GitHub connection, or work on the website?", options: ["Use connection", "Use the website", "Always the website", "Not now"], answer: "Use connection", purpose: "connection" },
        turns: [
          turn("Opening the pull request", { tool: "connection", service: "github", tool_name: "github_pr", verb: "pr", target: PR }),
          turn("Reading its diff", { tool: "connection", service: "github", tool_name: "github_pr_diff", verb: "diff", target: PR }),
        ],
        finish: { summary: "Pull request #42 · 2 files", digest: "Changes Cart.total to read the discount as a percentage and adds a test. Checks: 1 failing (test_no_discount)." },
      }),
      part({
        key: "code",
        title: "Code",
        helper: "computer",
        goal: "Read the code each hunk touches and run the cart tests",
        turns: [
          turn("Reading around the change", { tool: "read_file", path: "shop/cart.py" }, { tool: "read_file", path: "tests/test_cart.py" }),
          turn("Running the project's tests", { tool: "python_tests", tests: ["tests/test_cart.py"] }),
        ],
        finish: { summary: "2 files read · tests run", digest: "On the base branch test_ten_percent_discount fails (-900.0 != 90.0); the pull request's change is the fix, but its new rounding drops cents." },
      }),
    ),
    say(
      "Writing the review",
      ifApproved(create(
        "subject",
        "Read discount as a percentage",
        {
          noun: "Pull request",
          reference: PR,
          title: "Read discount as a percentage",
          state: { label: "Open · checks failing", tone: "blocked" },
          people: [{ label: "Author", value: "dana-k" }],
          facts: [
            { label: "Changed files", value: "2" },
            { label: "Checks", value: "1 failing" },
          ],
          labels: ["bug"],
          summary: "Divides the discount by 100 in Cart.total and adds a regression test.",
          url: PR_URL,
        },
        [`call:github:${PR}`],
      )),
      ifApproved(create(
        "list",
        "One thing before merging",
        {
          style: "requirements",
          items: [
            { title: "Rounding drops cents on totals", detail: "round() moved before the discount; 19.99 × 3 at 10% gives 53.97 instead of 53.98. Round once, last.", priority: "high", from: { app: "GitHub", who: "shop/cart.py:14", url: PR_URL } },
            { title: "Test names the old behaviour", detail: "test_ten_percent_discount should assert 90.0 and a case with cents.", from: { app: "GitHub", who: "tests/test_cart.py:13", url: PR_URL } },
          ],
        },
        [`call:github:${PR}`, "shop/cart.py"],
      )),
      create(
        "diff",
        "Round once, after the discount",
        {
          path: "shop/cart.py",
          language: "python",
          summary: "Apply the percentage, then round once",
          hunks: [{ old_start: 12, new_start: 12, lines: [{ op: "ctx", text: "    def total(self):" }, { op: "ctx", text: "        subtotal = self.subtotal()" }, { op: "del", text: "        return round(subtotal * (1 - self.discount_percent), 2)" }, { op: "add", text: "        return round(subtotal * (1 - self.discount_percent / 100), 2)" }] }],
        },
        ["shop/cart.py"],
      ),
      ifApproved(create(
        "draft",
        "Review comment",
        { destination: "github", target_url: PR_URL, body: "Ready after one fix.\n\n- shop/cart.py:14 round once, after the discount (cents are lost today)\n- tests/test_cart.py:13 add a case with cents" },
        [`call:github:${PR}`],
      )),
    ),
    say(
      "Done",
      finish(
        { headline: "Ready after one fix", text: "The change fixes the discount, but **rounding before the discount drops cents** on most real totals.", figures: [{ label: "Tests passed", value: "2" }, { label: "Failed", value: "1" }] },
        "Review, fix and comment are on the canvas.",
        [`call:github:${PR}`],
        ["Post the review comment"],
        { headline: "The pull request was not read", text: "You chose not now for GitHub, so only the local code and tests were checked; the suggested fix stands on the canvas." },
      ),
    ),
  ],
};

export const fixTest: WorkflowFixture = {
  id: "fix-a-bug",
  title: "Fix a Failing Test",
  persona: "developer",
  skill: "fix-a-bug",
  origin: "zephium",
  prompt: `Fix the failing test in ${ROOT}`,
  examples: [`Fix the failing test in ${ROOT}`, "The cart tests are failing in harbor-shop, fix it"],
  folder: ROOT,
  needs: ["folder_read", "file_write", "tests"],
  aegisMode: "quick",
  fidelity: "Follows fix-a-bug: the Code part runs the failing test first, reads the cause, proposes the smallest edit (you approve or decline it), and runs the tests again. The tests' output comes from a simulated runner (a predicate over the edited file); Zephium's real python_tests only runs on a qualified macOS host. A decline leaves the file unchanged and the run says the tests still fail.",
  turns: [
    say(
      "Running the failing test first",
      skill("fix-a-bug"),
      part({
        key: "code",
        title: "Code",
        helper: "computer",
        goal: "Reproduce the failure, fix the cause, run the tests again",
        turns: [
          turn("Running the tests", { tool: "python_tests", tests: ["tests/test_cart.py"] }),
          turn("Reading the code the failure points to", { tool: "grep", pattern: "discount_percent", glob: "*.py" }, { tool: "read_file", path: "shop/cart.py" }),
          turn("Proposing the smallest change", { tool: "edit", path: "shop/cart.py", old: "        return round(subtotal * (1 - self.discount_percent), 2)", new: "        return round(subtotal * (1 - self.discount_percent / 100), 2)" }),
          turn("Running the tests again", { tool: "python_tests", tests: ["tests/test_cart.py"] }),
        ],
        finish: { summary: "1 file changed · 3 passed", digest: "shop/cart.py: discount_percent is a percentage; divide by 100. Tests: 3 passed (simulated runner)." },
      }),
    ),
    say(
      "Writing it up",
      { ...create("draft", "Pull request description", { destination: "github", body: "**Fix: read the cart discount as a percentage**\n\n`Cart.total` multiplied by `discount_percent` as if it were a fraction, so 10 meant 1000%. It now divides by 100.\n\nTested: `python -m unittest tests/test_cart.py` → 3 passed." }), unlessDeclined: true },
    ),
    say(
      "Done",
      finish(
        { headline: "The discount was read as a fraction", text: "`Cart.total` used `10` as `10.0`, not `0.10`. Dividing by 100 fixes it; the three cart tests pass.", figures: [{ label: "Passed", value: "3" }, { label: "Failed", value: "0" }] },
        "The change and its test run are on the Code row.",
        ["shop/cart.py"],
        ["Open a pull request with this fix"],
        { headline: "Cause found; the fix was not applied", text: "`Cart.total` reads the discount as a fraction. You declined the change, so nothing was written and **the test still fails**.", figures: [{ label: "Passed", value: "2" }, { label: "Failed", value: "1" }] },
      ),
    ),
  ],
};

/*
 * AEGIS Agent Execution Lab — the sample repository and the simulated Computer tools.
 *
 * "harbor-shop" is an invented project that exists only in this file. The Developer
 * simulations read it through handlers that behave like Zephium's Computer tools
 * (work_computer/tools.rs): glob, grep, read, edit (after approval), python_tests,
 * git_changes, and a simplified TypeScript port of describe_project (work_lead/project.rs).
 * No real file is read or written, no process runs, and edits change an in-memory copy
 * that belongs to one simulated run.
 */
export const ROOT = "/lab/sample/harbor-shop";

const FILES: Record<string, string> = {
  "README.md": "# harbor-shop\n\nA small shop for a harbour chandlery: a Python checkout service and a Svelte storefront.\n\n- `shop/` the checkout service (stdlib only)\n- `web/` the storefront\n- `tests/` unittest suite\n",
  "pyproject.toml": "[project]\nname = \"harbor-shop\"\nversion = \"0.4.0\"\ndescription = \"Checkout service for a harbour chandlery\"\nrequires-python = \">=3.9\"\n\n[project.scripts]\nharbor-checkout = \"shop.api:main\"\n",
  "shop/__init__.py": "\"\"\"harbor-shop checkout service.\"\"\"\n",
  "shop/api.py": [
    "\"\"\"HTTP entry point: one route, POST /checkout.\"\"\"",
    "from http.server import BaseHTTPRequestHandler, HTTPServer",
    "import json",
    "",
    "from shop.cart import Cart",
    "from shop.pricing import tax_for",
    "from shop.store import save_order",
    "",
    "",
    "class Checkout(BaseHTTPRequestHandler):",
    "    def do_POST(self):",
    "        body = json.loads(self.rfile.read(int(self.headers[\"Content-Length\"])))",
    "        cart = Cart(body[\"items\"], discount_percent=body.get(\"discount\", 0))",
    "        total = cart.total() + tax_for(cart.total(), body[\"region\"])",
    "        order = save_order(body[\"customer\"], cart, total)",
    "        self.send_response(201)",
    "        self.end_headers()",
    "        self.wfile.write(json.dumps({\"order\": order, \"total\": total}).encode())",
    "",
    "",
    "def main():",
    "    HTTPServer((\"127.0.0.1\", 8080), Checkout).serve_forever()",
    "",
  ].join("\n"),
  "shop/cart.py": [
    "\"\"\"A cart: line items and an optional percentage discount.\"\"\"",
    "",
    "",
    "class Cart:",
    "    def __init__(self, items, discount_percent=0):",
    "        self.items = items",
    "        self.discount_percent = discount_percent",
    "",
    "    def subtotal(self):",
    "        return sum(item[\"price\"] * item[\"qty\"] for item in self.items)",
    "",
    "    def total(self):",
    "        subtotal = self.subtotal()",
    "        return round(subtotal * (1 - self.discount_percent), 2)",
    "",
  ].join("\n"),
  "shop/pricing.py": [
    "\"\"\"Tax by region, as a fraction of the discounted total.\"\"\"",
    "",
    "RATES = {\"uk\": 0.20, \"ie\": 0.23, \"nl\": 0.21}",
    "",
    "",
    "def tax_for(amount, region):",
    "    return round(amount * RATES.get(region, 0), 2)",
    "",
  ].join("\n"),
  "shop/store.py": [
    "\"\"\"Orders are kept in SQLite.\"\"\"",
    "import sqlite3",
    "import uuid",
    "",
    "DB = sqlite3.connect(\"orders.db\")",
    "",
    "",
    "def save_order(customer, cart, total):",
    "    order = str(uuid.uuid4())",
    "    DB.execute(\"insert into orders values (?, ?, ?)\", (order, customer, total))",
    "    DB.commit()",
    "    return order",
    "",
  ].join("\n"),
  "tests/test_cart.py": [
    "import unittest",
    "",
    "from shop.cart import Cart",
    "",
    "",
    "class CartTest(unittest.TestCase):",
    "    def test_subtotal(self):",
    "        self.assertEqual(Cart([{\"price\": 10, \"qty\": 3}]).subtotal(), 30)",
    "",
    "    def test_no_discount(self):",
    "        self.assertEqual(Cart([{\"price\": 50, \"qty\": 2}]).total(), 100)",
    "",
    "    def test_ten_percent_discount(self):",
    "        self.assertEqual(Cart([{\"price\": 50, \"qty\": 2}], discount_percent=10).total(), 90.0)",
    "",
  ].join("\n"),
  "web/package.json": JSON.stringify(
    {
      name: "harbor-shop-web",
      private: true,
      scripts: { dev: "vite", build: "vite build", test: "vitest run" },
      dependencies: { svelte: "^5.20.0" },
      devDependencies: { vite: "^6.2.0", vitest: "^3.0.0", typescript: "^5.8.0" },
    },
    null,
    2,
  ),
  "web/src/main.ts": "import App from \"./App.svelte\";\nimport { mount } from \"svelte\";\n\nmount(App, { target: document.body });\n",
  "web/src/App.svelte": "<script lang=\"ts\">\n  import Cart from \"./lib/Cart.svelte\";\n</script>\n\n<Cart />\n",
  "web/src/lib/Cart.svelte": "<script lang=\"ts\">\n  import { checkout } from \"./api\";\n  let items = $state([]);\n</script>\n\n<button onclick={() => checkout(items)}>Checkout</button>\n",
  "web/src/lib/api.ts": "export async function checkout(items: unknown[]) {\n  const response = await fetch(\"/checkout\", { method: \"POST\", body: JSON.stringify({ items }) });\n  return response.json();\n}\n",
  ".github/workflows/ci.yml": "name: ci\non: [push]\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - run: python -m unittest discover tests\n",
  "web/node_modules/svelte/package.json": "{}",
};

/** Exact lines `from`–`to` (1-based) of a sample file, so a code object never holds an invented line. */
export function excerpt(path: string, from: number, to: number): string {
  return (FILES[path] ?? "").split("\n").slice(from - 1, to).join("\n");
}

/** The repository as a run sees it: a private copy that edits change. */
export class SampleRepo {
  files: Record<string, string>;
  readonly base: Record<string, string>;
  constructor() {
    this.base = { ...FILES };
    this.files = { ...FILES };
  }
  rel(path: string) {
    return path.startsWith(ROOT) ? path.slice(ROOT.length).replace(/^\//u, "") : path.replace(/^\.\//u, "");
  }
  exists(path: string) {
    return this.rel(path) in this.files;
  }
}

const SKIPPED = ["node_modules", "target", "dist", "build", "out", "coverage", "__pycache__", "venv", "vendor"];
const skipped = (path: string) => path.split("/").some((part) => SKIPPED.includes(part) || (part.startsWith(".") && part !== ".github"));

function globToRegex(pattern: string) {
  const anywhere = !pattern.includes("/");
  const body = pattern
    .replace(/[.+^${}()|[\]\\]/gu, "\\$&")
    .replace(/\*\*\//gu, "§§")
    .replace(/\*\*/gu, ".*")
    .replace(/\*/gu, "[^/]*")
    .replace(/§§/gu, "(?:.*/)?");
  return new RegExp(anywhere ? `(?:^|/)${body}$` : `^${body}$`, "u");
}

/** tools.rs `glob`: paths by pattern, dependency folders skipped. */
export function glob(repo: SampleRepo, pattern: string): string[] {
  const regex = globToRegex(pattern);
  return Object.keys(repo.files).filter((path) => !skipped(path) && regex.test(path)).slice(0, 100);
}

/** tools.rs `grep` with output `lines`. */
export function grep(repo: SampleRepo, pattern: string, only?: string): string[] {
  const regex = new RegExp(pattern, /[A-Z]/u.test(pattern) ? "u" : "iu");
  const limit = only ? globToRegex(only) : null;
  const out: string[] = [];
  for (const [path, text] of Object.entries(repo.files)) {
    if (skipped(path) || (limit && !limit.test(path))) continue;
    text.split("\n").forEach((line, index) => {
      if (regex.test(line)) out.push(`${path}:${index + 1}:${line.trim()}`);
    });
  }
  return out.slice(0, 200);
}

/** tools.rs `read`: numbered lines, 400 unless offset and limit. */
export function readFile(repo: SampleRepo, path: string, offset = 1, limit = 400): { text: string; lines: number } | null {
  const text = repo.files[repo.rel(path)];
  if (text === undefined) return null;
  const lines = text.split("\n");
  const shown = lines.slice(offset - 1, offset - 1 + limit).map((line, index) => `${offset + index}: ${line}`);
  return { text: shown.join("\n"), lines: lines.length };
}

export type Hunk = { old_start: number; new_start: number; lines: { op: "ctx" | "add" | "del"; text: string }[] };

/** A one-change diff with three lines of context: enough for the lab's single-passage edits. */
export function diffOf(before: string, after: string): Hunk[] {
  const a = before.split("\n");
  const b = after.split("\n");
  let start = 0;
  while (start < a.length && start < b.length && a[start] === b[start]) start++;
  let endA = a.length - 1;
  let endB = b.length - 1;
  while (endA >= start && endB >= start && a[endA] === b[endB]) {
    endA--;
    endB--;
  }
  if (start > endA && start > endB) return [];
  const from = Math.max(0, start - 3);
  const lines: Hunk["lines"] = [];
  for (let i = from; i < start; i++) lines.push({ op: "ctx", text: a[i]! });
  for (let i = start; i <= endA; i++) lines.push({ op: "del", text: a[i]! });
  for (let i = start; i <= endB; i++) lines.push({ op: "add", text: b[i]! });
  for (let i = endA + 1; i < Math.min(a.length, endA + 4); i++) lines.push({ op: "ctx", text: a[i]! });
  return [{ old_start: from + 1, new_start: from + 1, lines }];
}

/** tools.rs `edit`: an exact passage that occurs once. Applied only after approval. */
export function edit(repo: SampleRepo, path: string, old: string, next: string): { ok: true; hunks: Hunk[] } | { ok: false; error: string } {
  const rel = repo.rel(path);
  const text = repo.files[rel];
  if (text === undefined) return { ok: false, error: `${path} does not exist in a granted folder` };
  const count = text.split(old).length - 1;
  if (count === 0) return { ok: false, error: "`old` does not occur in the file; read it again and copy the passage exactly" };
  if (count > 1) return { ok: false, error: "`old` occurs more than once; include surrounding lines or set replace_all" };
  const after = text.replace(old, next);
  repo.files[rel] = after;
  return { ok: true, hunks: diffOf(text, after) };
}

/**
 * python_tests, simulated. Zephium runs stdlib unittest in a read-only copy on a qualified
 * macOS runtime. The lab cannot run Python, so the outcome is a fixture predicate over the
 * file text: the three tests pass exactly when the discount is read as a percentage.
 */
export function pythonTests(repo: SampleRepo, tests: string[]): { passed: boolean; output: string } {
  if (!tests.every((test) => repo.exists(test))) return { passed: false, output: "Refused: a listed test module is not in a granted folder." };
  const fixed = /discount_percent\s*\/\s*100/u.test(repo.files["shop/cart.py"] ?? "");
  if (fixed)
    return {
      passed: true,
      output: "...\n----------------------------------------------------------------------\nRan 3 tests in 0.001s\n\nOK",
    };
  return {
    passed: false,
    output: [
      "..F",
      "======================================================================",
      "FAIL: test_ten_percent_discount (test_cart.CartTest)",
      "----------------------------------------------------------------------",
      "Traceback (most recent call last):",
      '  File "tests/test_cart.py", line 14, in test_ten_percent_discount',
      "    self.assertEqual(Cart([{\"price\": 50, \"qty\": 2}], discount_percent=10).total(), 90.0)",
      "AssertionError: -900.0 != 90.0",
      "",
      "----------------------------------------------------------------------",
      "Ran 3 tests in 0.001s",
      "",
      "FAILED (failures=1)",
    ].join("\n"),
  };
}

/** git_changes `diff`: working copy against the base, per file. */
export function gitChanges(repo: SampleRepo, paths: string[]): { path: string; hunks: Hunk[] }[] {
  return paths
    .map((path) => repo.rel(path))
    .filter((path) => repo.files[path] !== repo.base[path])
    .map((path) => ({ path, hunks: diffOf(repo.base[path] ?? "", repo.files[path] ?? "") }));
}

/**
 * describe_project, ported in miniature from work_lead/project.rs: the stack from manifests,
 * the structure from a bounded walk (dependency folders skipped), scripts from the files that
 * define them. Git state is left out, as the Rust leaves it out until a confined runner exists.
 */
export function describeProject(repo: SampleRepo) {
  const files = Object.keys(repo.files).filter((path) => !skipped(path));
  const pkg = JSON.parse(repo.files["web/package.json"] ?? "{}") as { scripts?: Record<string, string>; dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
  const pyproject = repo.files["pyproject.toml"] ?? "";
  const version = (range?: string) => range?.replace(/^[^\d]*/u, "").split(".").slice(0, 2).join(".");
  const stack = [
    ...(pyproject ? [{ name: "Python", host: "python.org", version: pyproject.match(/requires-python = ">=([\d.]+)"/u)?.[1], role: "Service" }] : []),
    ...(pkg.dependencies?.svelte ? [{ name: "Svelte", host: "svelte.dev", version: version(pkg.dependencies.svelte), role: "Frontend" }] : []),
    ...(pkg.devDependencies?.typescript ? [{ name: "TypeScript", host: "typescriptlang.org", version: version(pkg.devDependencies.typescript) }] : []),
    ...(pkg.devDependencies?.vite ? [{ name: "Vite", host: "vite.dev", version: version(pkg.devDependencies.vite), role: "Build" }] : []),
    ...(pkg.devDependencies?.vitest ? [{ name: "Vitest", role: "Tests" }] : []),
    ...(files.some((path) => path.startsWith("tests/")) ? [{ name: "unittest", role: "Tests" }] : []),
    ...(repo.files["shop/store.py"]?.includes("sqlite3") ? [{ name: "SQLite", host: "sqlite.org", role: "Store" }] : []),
  ];
  const folders = [...new Set(files.flatMap((path) => path.split("/").slice(0, -1).map((_, i, parts) => parts.slice(0, i + 1).join("/"))))].sort();
  const top = folders.filter((folder) => !folder.includes("/") || folder.split("/").length === 2);
  const tree = [
    ...top.map((folder) => ({ path: folder, kind: "folder", ...(folder.includes("/") ? { more: files.filter((path) => path.startsWith(folder + "/")).length } : {}) })),
    ...files.filter((path) => !path.includes("/")).map((path) => ({ path, kind: "file" })),
  ];
  const scripts = [
    ...Object.entries(pkg.scripts ?? {}).map(([name, command]) => ({ name, command, source: "web/package.json" })),
    ...[...pyproject.matchAll(/^([\w-]+) = "([\w.:]+)"$/gmu)].filter((match) => match[1] !== "name" && match[1] !== "version" && match[1] !== "description").map((match) => ({ name: match[1]!, command: match[2]!, source: "pyproject.toml" })),
  ];
  return {
    kind: "project",
    name: "harbor-shop",
    summary: "Checkout service for a harbour chandlery: a stdlib Python HTTP service with a Svelte storefront.",
    root: ROOT,
    stack: stack.map((entry) => Object.fromEntries(Object.entries(entry).filter(([, value]) => value !== undefined))),
    tree,
    scripts,
  };
}

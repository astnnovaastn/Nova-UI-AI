// demoGraph.ts — SYNTHETIC data for previewing the look at high density. Not real memories.
import type { GraphCategory, GraphData, GraphEntity, GraphLink, GraphMemory } from "../../src/components/Memory/memory-globe/memoryTypes";

const NAMES = [
  "Personal preferences", "Tasks and projects", "User instructions", "Timezone preferences", "Long-term goals",
  "Tool preferences", "Collaborators", "Data privacy", "Conversations", "Session themes", "Contextual rules",
  "Knowledge and expertise", "Communication boundaries", "Response adaptation", "Media preferences",
  "Research and sources", "Files and media", "Timing patterns", "Current state", "Personal development",
];

const mulberry32 = (a: number) => () => {
  a |= 0; a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

export function generateDemoGraph(n = 3600, seed = 7): GraphData {
  const rnd = mulberry32(seed), K = 44;
  const w = Array.from({ length: K }, (_, i) => Math.pow(i + 1, -0.95)), tw = w.reduce((a, b) => a + b, 0);
  const cats: GraphCategory[] = [], mems: GraphMemory[] = [], byCat: GraphMemory[][] = [];
  for (let i = 0; i < K; i++) {
    const id = `${NAMES[i % NAMES.length].toLowerCase().replace(/ /g, "_")}${i >= NAMES.length ? "_" + Math.floor(i / NAMES.length) : ""}`;
    cats.push({ id, label: NAMES[i % NAMES.length] + (i >= NAMES.length ? ` ${1 + Math.floor(i / NAMES.length)}` : ""), description: "Sample category", count: 0 });
    byCat.push([]);
  }
  let t0 = Date.parse("2026-01-01T00:00:00Z");
  for (let i = 0; i < n; i++) {
    let r = rnd() * tw, c = 0;
    while (c < K - 1 && (r -= w[c]) > 0) c++;
    const m: GraphMemory = {
      id: `demo-${i}`, category: cats[c].id, label: `Sample note ${i}`, text: "Synthetic sample memory.", kind: "fact",
      created: (t0 += 60000 + rnd() * 600000), updated: t0, confidence: 1, revision: 1, source: "sample", sessionId: "",
      conflict: false, pending: rnd() < 0.004, derived: false,
    };
    mems.push(m); byCat[c].push(m); cats[c].count++;
  }
  const links: GraphLink[] = [], entities: GraphEntity[] = [];
  const pick = () => mems[Math.floor(rnd() * mems.length)];
  for (let e = 0; e < n / 14; e++) { // relay entities that gather memories from several categories
    const members = Array.from({ length: 2 + Math.floor(rnd() * 3) }, pick);
    const ids = [...new Set(members.map((m) => m.id))];
    entities.push({ id: `e${e}`, label: `Sample entity ${e}`, category: members[0].category, members: ids });
    ids.forEach((id) => links.push({ a: `ent:e${e}`, b: id, kind: "entity", weight: 0.7, reason: "Sample entity" }));
  }
  for (let i = 0; i < n * 0.5; i++) { // cross-category strings, biased to neighbouring categories
    const a = pick(), ci = cats.findIndex((c) => c.id === a.category);
    const cj = rnd() < 0.6 ? Math.min(K - 1, Math.max(0, ci + Math.floor(rnd() * 7) - 3)) : Math.floor(rnd() * K);
    const pool = byCat[cj];
    if (!pool.length) continue;
    const b = pool[Math.floor(rnd() * pool.length)];
    if (a.id !== b.id) links.push({ a: a.id, b: b.id, kind: "semantic", weight: 0.4 + rnd() * 0.5, reason: "Sample connection" });
  }
  for (let i = 0; i < K; i++) {
    links.push({ a: "cat:" + cats[i].id, b: "cat:" + cats[(i + 1) % K].id, kind: "catalog", weight: 0.6, reason: "Sample category link" });
    links.push({ a: "cat:" + cats[i].id, b: "cat:" + cats[Math.floor(rnd() * K)].id, kind: "catalog", weight: 0.6, reason: "Sample category link" });
  }
  return { categories: cats, memories: mems, entities, links: links.filter((l) => l.a !== l.b) };
}

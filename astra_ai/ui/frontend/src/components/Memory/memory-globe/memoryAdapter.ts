// memoryAdapter.ts — turns long_term.json into a graph and decides where new memories connect.
import type {
  GraphCategory, GraphData, GraphEntity, GraphLink, GraphMemory, RawMemoryFile, RawRecord,
} from "./memoryTypes";

// ---------- text helpers ----------
export const prettify = (s: string): string => {
  const t = s.replace(/[_-]+/g, " ").trim();
  return t.charAt(0).toUpperCase() + t.slice(1);
};
const clip = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + "…" : s);

function valueToText(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (Array.isArray(v)) return v.map(valueToText).join(", ");
  if (typeof v === "object") {
    return Object.entries(v as Record<string, unknown>)
      .map(([k, x]) => `${prettify(k)}: ${valueToText(x)}`)
      .join("; ");
  }
  return String(v);
}

const STOP = new Set((
  "the and for with that this from have has had are was were been will would could should your you not but can his her its our " +
  "their them they about into than then also just more some any all one two new use used using get got make made like what when " +
  "where which who how why user users shared asked question topic discussed nova there here very much many only over such " +
  "il lo la le gli un una di da in con per su tra fra che chi cui non mi ti ci vi si ed ma se come dove quando quanto del della " +
  "dei delle degli dello alla alle agli dal dalla nel nella sul sulla sono sei era hai hanno grazie mille"
).split(" "));

export function tokenize(s: string): string[] {
  return s
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 3 && !STOP.has(t) && !/^\d+$/.test(t) && !/^[0-9a-f]{12,}$/.test(t));
}

// ---------- raw record -> graph memory ----------
export function rawToMemory(r: RawRecord, kind: GraphMemory["kind"] = "fact", pending = false): GraphMemory {
  const date = typeof r.attributes?.original_date === "string" ? (r.attributes.original_date as string) : undefined;
  const derived = r.attributes?.derived_context === true;
  const text = valueToText(r.content ?? r.value);
  const label = /^derived[_ ]summary/i.test(r.key) ? `Daily trace${date ? " · " + date : ""}` : clip(prettify(r.key), 56);
  const created = Date.parse(r.created ?? "") || 0;
  return {
    id: r.id, category: r.category, label, text: clip(text, 1200), kind, created,
    updated: Date.parse(r.updated ?? "") || created,
    confidence: typeof r.confidence === "number" ? r.confidence : 1,
    revision: r.revision ?? 1, source: r.source ?? "unknown", sessionId: r.session_id ?? "",
    conflict: false, pending, derived, date,
  };
}

// ---------- semantic index (TF-IDF cosine) ----------
interface Doc { tf: Map<string, number>; norm: number; normVersion: number; mem: GraphMemory }
export interface Neighbor { id: string; sim: number; terms: string[] }

/** Finds the existing memories that a memory is most related to. Works for bulk load and for live adds. */
export class LinkIndex {
  private docs = new Map<string, Doc>();
  private post = new Map<string, string[]>();
  private df = new Map<string, number>();

  private idf(t: string): number {
    return Math.log(1 + (this.docs.size + 1) / (1 + (this.df.get(t) ?? 0)));
  }
  private vectorize(m: GraphMemory): Doc {
    const tf = new Map<string, number>();
    for (const t of tokenize(`${m.label} ${m.label} ${m.text}`)) tf.set(t, (tf.get(t) ?? 0) + 1);
    for (const [t, c] of tf) tf.set(t, 1 + Math.log(c));
    return { tf, norm: 1, normVersion: -1, mem: m };
  }
  private norm(d: Doc): number {
    if(d.normVersion===this.docs.size)return d.norm;
    let s = 0;
    for (const [t, w] of d.tf) { const x = w * this.idf(t); s += x * x; }
    d.normVersion=this.docs.size;
    return d.norm=Math.sqrt(s) || 1;
  }
  has(id: string): boolean { return this.docs.has(id); }

  add(m: GraphMemory): void {
    if (this.docs.has(m.id)) return;
    const d = this.vectorize(m);
    this.docs.set(m.id, d);
    for (const t of d.tf.keys()) {
      this.df.set(t, (this.df.get(t) ?? 0) + 1);
      const p = this.post.get(t);
      if (p) p.push(m.id); else this.post.set(t, [m.id]);
    }
    d.norm = this.norm(d);
  }
  addAll(ms: GraphMemory[]): void {
    ms.forEach((m) => this.add(m));
    for (const d of this.docs.values()) d.norm = this.norm(d); // idf is final now
  }

  neighbors(m: GraphMemory, k = 3, minSim = 0.22): Neighbor[] {
    const d = this.docs.get(m.id) ?? this.vectorize(m);
    const qn = this.norm(d);
    const N = this.docs.size;
    const acc = new Map<string, { dot: number; terms: Map<string, number> }>();
    for (const [t, w] of d.tf) {
      const df = this.df.get(t) ?? 0;
      if (N > 50 && df > N * 0.2) continue; // too common to carry meaning
      const idf = this.idf(t), post = this.post.get(t);
      if (!post) continue;
      for (const oid of post) {
        if (oid === m.id) continue;
        const od = this.docs.get(oid);
        const ow = od?.tf.get(t);
        if (!od || ow === undefined) continue;
        const c = w * idf * ow * idf;
        let a = acc.get(oid);
        if (!a) { a = { dot: 0, terms: new Map() }; acc.set(oid, a); }
        a.dot += c; a.terms.set(t, c);
      }
    }
    const out: Neighbor[] = [];
    for (const [oid, a] of acc) {
      const od = this.docs.get(oid)!;
      const sim = a.dot / (qn * this.norm(od));
      if (sim < minSim) continue;
      const other = od.mem;
      if (other.derived && m.derived && sim < 0.6) continue;           // avoid trace-to-trace hairballs
      if (other.category === m.category && sim < 0.5) continue;        // same category already shares a hub
      const terms = [...a.terms.entries()].sort((x, y) => y[1] - x[1]).slice(0, 3).map((x) => x[0]);
      out.push({ id: oid, sim, terms });
    }
    return out.sort((x, y) => y.sim - x.sim).slice(0, k);
  }
}

export function inferSemanticLinks(mems: GraphMemory[], perNode = 3): GraphLink[] {
  const index = new LinkIndex();
  index.addAll(mems);
  const seen = new Set<string>(), degree = new Map<string, number>(), out: GraphLink[] = [];
  for (const m of mems) {
    for (const n of index.neighbors(m, perNode)) {
      const key = m.id < n.id ? m.id + "|" + n.id : n.id + "|" + m.id;
      if (seen.has(key)) continue;
      if ((degree.get(m.id) ?? 0) >= 5 || (degree.get(n.id) ?? 0) >= 5) continue;
      seen.add(key);
      degree.set(m.id, (degree.get(m.id) ?? 0) + 1);
      degree.set(n.id, (degree.get(n.id) ?? 0) + 1);
      out.push({ a: m.id, b: n.id, kind: "semantic", weight: Math.min(1, n.sim * 1.4),
        reason: `Related content: ${n.terms.join(", ")} (${Math.round(n.sim * 100)}% match)` });
    }
  }
  return out;
}

// ---------- whole file -> graph ----------
export function buildGraph(raw: RawMemoryFile): GraphData {
  const recs = new Map<string, GraphMemory>();
  const take = (sec: RawMemoryFile["facts"], kind: GraphMemory["kind"]) => {
    for (const g of Object.values(sec ?? {})) for (const r of Object.values(g)) if (r?.id) recs.set(r.id, rawToMemory(r, kind));
  };
  take(raw.facts, "fact"); take(raw.events, "event"); take(raw.activity_history, "activity");
  for (const p of Object.values(raw.pending_approvals ?? {})) {
    const r = p?.record;
    if (!r?.id) continue;
    const m = recs.get(r.id);
    if (m) m.pending = true; else recs.set(r.id, rawToMemory(r, "fact", true));
  }
  for (const c of raw.conflicts ?? []) {
    const m = recs.get(c.record_id);
    if (!m) continue;
    m.conflict = true;
    if (c.status === "pending") m.pending = true;
  }
  const memories = [...recs.values()].sort((a,b) => a.id.localeCompare(b.id));

  // categories
  const counts = new Map<string, number>();
  memories.forEach((m) => counts.set(m.category, (counts.get(m.category) ?? 0) + 1));
  const defs = raw.category_definitions ?? {};
  const ids = new Set<string>([...Object.keys(defs), ...counts.keys()]);
  const categories: GraphCategory[] = [...ids].sort().map((id) => ({
    id, label: defs[id]?.label || prettify(id), description: defs[id]?.description ?? "", count: counts.get(id) ?? 0,
  }));

  // Registry memberships are counted organization, never factual relationships.
  for(const [cid,definition] of Object.entries(defs).sort((a,b)=>(a[1].member_ids?.length||0)-(b[1].member_ids?.length||0)||a[0].localeCompare(b[0]))){
    for(const id of definition.member_ids||[]){const memory=recs.get(id);if(memory&&memory.category!==cid&&!memory.displayCategory)memory.displayCategory=cid;}
  }
  // Presentation collections augment registered storage categories without changing a record's category.
  const visualTopics=[...(raw.visual_topics||[])].sort((a,b)=>a.member_ids.length-b.member_ids.length||a.id.localeCompare(b.id));
  const placed=new Set<string>(memories.filter(m=>m.displayCategory).map(m=>m.id));
  for(const topic of visualTopics){
    const members=topic.member_ids.filter(id=>recs.has(id)&&!placed.has(id));
    if(!members.length)continue;
    for(const id of members){recs.get(id)!.displayCategory=topic.id;placed.add(id);}
    categories.push({id:topic.id,label:topic.label,description:topic.description,count:members.length});
  }
  categories.forEach(c=>{if(!c.id.startsWith("topic:"))c.count=memories.filter(m=>(m.displayCategory??m.category)===c.id).length;});
  categories.sort((a,b)=>a.id.localeCompare(b.id));

  // entities
  const entities: GraphEntity[] = [];
  for (const e of Object.values(raw.entity_graph?.entities ?? {}).sort((a,b)=>a.id.localeCompare(b.id))) {
    const members = [...new Set(e.member_ids ?? [])].sort().filter((id) => recs.has(id));
    if (members.length) entities.push({ id: e.id, label: e.label ?? "Entity", category: e.category ?? "", members });
  }

  // links
  const links: GraphLink[] = [], seen = new Set<string>();
  const push = (l: GraphLink) => {
    const key = (l.a < l.b ? l.a + "|" + l.b : l.b + "|" + l.a) + l.kind;
    if (!seen.has(key) && l.a !== l.b) { seen.add(key); links.push(l); }
  };
  for (const e of entities) {
    for (const id of e.members) push({ a: "ent:" + e.id, b: id, kind: "entity", weight: 0.7, reason: `Part of entity “${e.label}”` });
  }
  const entityIds = new Set(entities.map(e => e.id));
  for (const r of Object.values(raw.entity_graph?.connections ?? {})) {
    if (r.state === "active" && entityIds.has(r.from) && entityIds.has(r.to)) push({a:"ent:"+r.from,b:"ent:"+r.to,kind:"explicit",weight:1,reason:r.evidence || r.type || "Evidenced relationship"});
  }
  for (const r of Object.values(raw.relationships_v3 ?? {})) {
    if (recs.has(r.from) && recs.has(r.to)) push({ a: r.from, b: r.to, kind: "explicit", weight: 1, reason: r.evidence || "Explicit relationship" });
  }
  for (const r of raw.catalog_relationships ?? []) {
    const [x, y] = r.categories ?? [];
    if (x && y && ids.has(x) && ids.has(y)) push({ a: "cat:" + x, b: "cat:" + y, kind: "catalog", weight: 0.6, reason: `${prettify(x)} relates to ${prettify(y)}` });
  }
  for(const [cid,d] of Object.entries(defs))for(const id of d.member_ids||[])if(recs.has(id))push({a:id,b:"cat:"+cid,kind:"category",weight:1,reason:"Registered category membership"});
  for (const [cid, d] of Object.entries(defs)) { // records that define a category but live elsewhere
    for (const rid of d.source_record_ids ?? []) {
      const m = recs.get(rid);
      if (m && m.category !== cid) push({ a: rid, b: "cat:" + cid, kind: "explicit", weight: 0.8, reason: `Helps define ${prettify(cid)}` });
    }
  }
  const bySession = new Map<string, GraphMemory[]>();
  for (const m of memories) if (m.sessionId) (bySession.get(m.sessionId) ?? bySession.set(m.sessionId, []).get(m.sessionId)!).push(m);
  for (const g of bySession.values()) {
    if (g.length < 2 || g.length > 14) continue;
    g.sort((x, y) => x.created - y.created);
    for (let i = 1; i < g.length; i++) push({ a: g[i - 1].id, b: g[i].id, kind: "session", weight: 0.5, reason: "Same conversation session" });
  }
  inferSemanticLinks(memories).forEach(push);
  links.sort((a,b)=>(a.kind+a.a+a.b).localeCompare(b.kind+b.a+b.b));
  return { categories, memories, entities, links };
}

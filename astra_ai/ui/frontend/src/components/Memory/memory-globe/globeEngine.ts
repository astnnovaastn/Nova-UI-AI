// Supplied memory-globe-package production engine, with documented Nova integration patches.
// globeEngine.ts — data-driven 3D memory globe (canvas 2D, no UI dependencies)
import { MEMORY_SHADES, MEMORY_HIGHLIGHT, categoryColorIndex, contrastShades, colorRgb, type CategoryPalette } from "./memoryPalette";
import type { MemoryCamera } from "./memoryView";
import { LinkIndex, prettify, rawToMemory } from "./memoryAdapter";
import type { GraphCategory, GraphData, GraphEntity, GraphMemory, LinkKind, RawRecord } from "./memoryTypes";

export type Vec = [number, number, number];
type NKind = "category" | "memory" | "entity" | "dust";

interface GNode {
  id: string; renderIndex: number; kind: NKind; col: number; r: number; label: string;
  x: number; y: number; z: number; born: number;
  sx: number; sy: number; z2: number; s: number; rr: number; g: number;
  glow: number; adj: Edge[]; cat: string;
  mem?: GraphMemory; catData?: GraphCategory; ent?: GraphEntity;
}
interface Edge {
  a: GNode; b: GNode; kind: LinkKind; weight: number; reason: string;
  curve: number; cx: number; cy: number; cz: number; i: number;
}
interface CatState { id: string; data: GraphCategory; d: Vec; u: Vec; v: Vec; rad: number; n: number; col: number; hub: GNode }
export interface PreparedLayout {nodes:Omit<GNode,'adj'>[];edges:(Omit<Edge,'a'|'b'>&{a:string;b:string})[];cats:(Omit<CatState,'hub'>&{hub:string})[];spacing:number;dotR:number;index:ReturnType<LinkIndex['exportState']>}
interface Packet { e: Edge; from: GNode; to: GNode; t0: number; dur: number; col: string; hops: number }
interface Pulse { from: GNode; to: GNode; e: Edge | null; t0: number; dur: number; kind: LinkKind }

export interface SelectionLink { id: string; title: string; kind: LinkKind; reason: string; weight: number }
export interface SelectionInfo {
  id: string; type: "memory" | "category" | "entity"; title: string; text: string;
  category: string; categoryLabel: string; created?: number; source?: string; confidence?: number;
  flags: string[]; links: SelectionLink[];
}
export interface HoverInfo { text: string; x: number; y: number }
export interface GlobeStats { memories: number; categories: number; links: number }
export interface GlobeOptions {
  prepareOnly?:boolean;
  theme?: "obsidian" | "glass"; // obsidian = black, fine grey wires, pink dots (default). glass = blue links + shell
  ambient?: boolean;          // faint decorative dust inside the globe (not data). Default: only for glass
  flows?: boolean; // legacy compatibility; Nova keeps this off
  idlePulses?: boolean;       // occasional signal along real connections while idle
  maxMemories?: number;       // growth cap for weak machines
  onHover?: (h: HoverInfo | null) => void;
  onSelect?: (s: SelectionInfo | null) => void;
  onStats?: (s: GlobeStats) => void;
}

const TAU = Math.PI * 2, GA = 2.39996;
const PAL = MEMORY_SHADES;
const GRAY = PAL.length, HUB = GRAY + 1, ENT = GRAY + 2, DUST = GRAY + 3;
const GLASS_COLS = [...PAL, "#9aa0b4", MEMORY_HIGHLIGHT, "#9b6bff", "#8a8f9c"];
const OBS_COLS = [...PAL, "#92908a", MEMORY_HIGHLIGHT, "#9b6bff", "#696866"];
const rgbOf = colorRgb;
const hexA = (h: string, a: number) => { const n = parseInt(h.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
const shadeOf = (cols: string[]) => cols.map((c) => [0.72, 0.9, 1].map((a) => hexA(c, a)));
const KIND_RGB: Record<LinkKind, string> = {
  category: "220,215,206", entity: "155,107,255", explicit: "111,207,127",
  semantic: "139,149,167", session: "255,179,193", catalog: "217,84,79",
};
const FLOW_COLS = Object.values(KIND_RGB);
const KIND_FLOW = KIND_RGB;
const CURVE: Record<LinkKind, number> = { category: .82, entity: 0.5, explicit: 0.4, semantic: 0.45, session: 0.5, catalog: 0.35 };
const MEANINGFUL = new Set<LinkKind>(["explicit", "semantic", "session"]);
const EDGE_STYLE = {
  glass: {
    struct: ["rgba(185,195,200,.04)", "rgba(185,195,200,.08)", "rgba(185,195,200,.14)"],
    mean: ["rgba(127,178,255,.12)", "rgba(127,178,255,.22)", "rgba(127,178,255,.38)"],
    dim: ["rgba(185,195,200,.015)", "rgba(185,195,200,.025)", "rgba(185,195,200,.04)"],
  },
  obsidian: {
    struct: ["rgba(150,150,150,.09)", "rgba(150,150,150,.16)", "rgba(150,150,150,.28)"],
    mean: ["rgba(160,160,160,.10)", "rgba(160,160,160,.18)", "rgba(165,165,165,.30)"],
    dim: ["rgba(150,150,150,.02)", "rgba(150,150,150,.03)", "rgba(150,150,150,.05)"],
  },
};

const nrm = (v: Vec): Vec => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
const cross = (a: Vec, b: Vec): Vec => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const s0r = (s: number, cs: {n:number}) => s * Math.sqrt(cs.n + 3) + .03;
const hash01 = (s: string) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967296; };
const wrap = (a: number) => a>=-Math.PI&&a<=Math.PI?a:((((a + Math.PI) % TAU) + TAU) % TAU) - Math.PI;
const fib = (n: number): Vec[] => Array.from({ length: n }, (_, i) => {
  const y = 1 - (2 * (i + 0.5)) / n, r = Math.sqrt(1 - y * y), t = i * GA;
  return [Math.cos(t) * r, y, Math.sin(t) * r] as Vec;
});

export class GlobeEngine {
  private ctx!: CanvasRenderingContext2D;
  private scene: HTMLCanvasElement|null = typeof document!=="undefined"?document.createElement("canvas"):null;
  private sceneKey=""; private sceneVersion=0; private dynamicUntil=0;
  private categoryPalettes = new Map<string,CategoryPalette | undefined>();
  private categoryEdges = new Map<string,Edge>();
  private lightSurface = false;
  private nodes: GNode[] = [];
  private edges: Edge[] = [];
  private byId = new Map<string, GNode>();
  private cats = new Map<string, CatState>();
  private index = new LinkIndex();
  private pulses: Pulse[] = [];
  private packets: Packet[] = []; private flowT = 0; private flowPool: Edge[] = []; private flowPoolN = -1;
  private focusSet: Set<string> | null = null;
  private sel: GNode | null = null;
  private selEdges: Edge[] = [];
  private focusYaw: number | null = null; private focusPitch = 0;
  private transition:{start:number;yaw:number;pitch:number;zoom:number;targetYaw:number;targetPitch:number;targetZoom:number}|null=null;
  private manualUntil=0;private panX=0;private panY=0;
  private membersByCategory=new Map<string,Set<GNode>>();
  private committedSeen=new Map<string,number>();private committedLinks=new Set<string>();
  private s = 0.03; private dotR = 0.006; private memCount = 0;

  private now = 0; private W = 0; private H = 0; private DPR = 1; private S = 1; private dprCap = 1.5;
  private yaw = 0.6; private pitch = 0.3; private vy = 0.002; private vp = 0;
  private zoom = 1.12; private zt = 1.12;
  private down = false; private mx = -1e3; private my = -1e3; private moved = 0;
  private ema = 16; private lod = 1; private cool = 0; private last = 0;
  private ptrs = new Map<number, [number, number]>(); private pinch = 0;
  private paintMs=16; private healthyFrames=0; private paintedAt=0;
  private metricsSince=0; private metricsFrames=0;
  private raf = 0; private lastHover = "";
  private reduced = false;
  private rot = { cy: 1, sy: 0, cp: 1, sp: 0, cx: 0, cyy: 0, sc: 1 };
  private bk: GNode[][] = Array.from({ length: (PAL.length+4) * 6 }, () => []);
  private eb: Edge[][][] = [[[], [], []], [[], [], []]];
  private cleanups: Array<() => void> = [];
  private opts: GlobeOptions;
  private theme: "obsidian" | "glass";
  private cols: string[];
  private shade: string[][];

  constructor(private cv: HTMLCanvasElement, opts: GlobeOptions = {}) {
    this.opts = { flows: false, idlePulses: false, maxMemories: Infinity, ...opts };
    this.theme = this.opts.theme ?? "obsidian";
    if (this.opts.ambient === undefined) this.opts.ambient = this.theme === "glass";
    this.cols = this.theme === "obsidian" ? OBS_COLS : GLASS_COLS;
    this.shade = shadeOf(this.cols);
    if(opts.prepareOnly)return;
    const ctx = cv.getContext("2d");
    if (!ctx) throw new Error("2D canvas not supported");
    this.ctx = ctx;
    const media = typeof matchMedia === "function" ? matchMedia("(prefers-reduced-motion: reduce)") : null;
    const motion = () => { this.reduced = !!media?.matches; if(this.reduced){if(this.transition){this.yaw=this.transition.targetYaw;this.pitch=this.transition.targetPitch;this.transition=null;}this.vy=this.vp=0;this.pulses=[];this.packets=[];if(this.focusYaw!==null){this.yaw=this.focusYaw;this.pitch=this.focusPitch;}this.zoom=this.zt;} };
    motion();media?.addEventListener("change",motion);this.cleanups.push(()=>media?.removeEventListener("change",motion));
    this.resize();
    this.bind();
    this.raf = requestAnimationFrame(this.frame);
  }

  setData(data: GraphData): void {
    if(data.layout){this.hydrate(data);return;}
    this.sceneVersion++;this.categoryEdges.clear();
    this.categoryPalettes = new Map(data.categories.map(c=>[c.id,c.palette]));
    this.nodes = []; this.edges = []; this.byId.clear(); this.cats.clear(); this.pulses = []; this.packets = [];this.flowPool=[];this.flowPoolN=-1;
    this.index = new LinkIndex(); this.memCount = 0; this.clearSelection();
    const N = data.memories.length;
    if(!this.opts.prepareOnly&&N>10000&&this.lod<3){this.lod=3;this.dprCap=1;this.resize();}
    this.s = Math.sqrt((0.55 * 4 * 0.94 * 0.94) / Math.max(N, 900)); // patch spacing, keeps coverage even
    this.dotR = Math.min(0.012, Math.max(0.0035, this.s * (this.theme === "obsidian" ? 0.16 : 0.2)));
    const { items, itemOf, mainOf } = this.splitCategories(data);
    this.layoutCategories(items, data.links);
    const sorted = [...data.memories].sort((a, b) => a.created - b.created || (a.id < b.id ? -1 : 1));
    for (const m of sorted) this.addLeaf(this.cats.get(itemOf.get(m.id) ?? m.displayCategory ?? m.category)!, m, false);
    for (const [sub, main] of mainOf) { // periods of one category stay tied together through the core
      const a = this.cats.get(sub), b = this.cats.get(main);
      if (a && b) this.link(a.hub, b.hub, "category", 0.6, "Same category, another period", 0.35);
    }
    this.index.addAll(data.memories);
    for (const e of data.entities) this.addEntity(e);
    for (const l of data.links) {
      const a = this.byId.get(l.a), b = this.byId.get(l.b);
      if (a && b) this.link(a, b, l.kind, l.weight, l.reason);
    }
    if (this.opts.ambient) this.addDust();
    this.nodes.forEach((n) => (n.born = -1e4));
    this.cacheMembership();
    this.emitStats();
  }
  static prepare(data:GraphData):PreparedLayout{
    const engine=new GlobeEngine({} as HTMLCanvasElement,{prepareOnly:true,ambient:false,theme:'obsidian'});engine.setData(data);
    return {nodes:engine.nodes.map(({adj,...node})=>node),edges:engine.edges.map(({a,b,...edge})=>({...edge,a:a.id,b:b.id})),cats:[...engine.cats.values()].map(({hub,...cat})=>({...cat,hub:hub.id})),spacing:engine.s,dotR:engine.dotR,index:engine.index.exportState()};
  }
  private hydrate(data:GraphData){
    const positions=new Map(this.nodes.map(n=>[n.id,{x:n.x,y:n.y,z:n.z,born:n.born,glow:n.glow}]));
    const layout=data.layout!;this.clearSelection();this.sceneVersion++;this.sceneKey='';this.pulses=[];this.packets=[];this.categoryEdges.clear();this.flowPool=[];this.flowPoolN=-1;
    this.categoryPalettes=new Map(data.categories.map(c=>[c.id,c.palette]));this.nodes=layout.nodes.map(n=>({...n,...positions.get(n.id),adj:[]}));this.byId=new Map(this.nodes.map(n=>[n.id,n]));
    this.edges=layout.edges.map(e=>({...e,a:this.byId.get(e.a)!,b:this.byId.get(e.b)!}));
    for(const e of this.edges){if(e.curve){e.cx=(e.a.x+e.b.x)*.5*e.curve;e.cy=(e.a.y+e.b.y)*.5*e.curve;e.cz=(e.a.z+e.b.z)*.5*e.curve;}e.a.adj.push(e);e.b.adj.push(e);if(e.kind==='category')this.categoryEdges.set([e.a.id,e.b.id].sort().join('|'),e);}
    this.cats=new Map(layout.cats.map(c=>{const hub=this.byId.get(c.hub)!,d=nrm([hub.x,hub.y,hub.z]),u=nrm(cross(d,Math.abs(d[1])>.9?[1,0,0]:[0,1,0])),v=cross(d,u);return [c.id,{...c,hub,d,u,v}];}));this.s=layout.spacing;this.dotR=layout.dotR;this.memCount=data.memories.length;this.index=new LinkIndex();this.index.restoreState(layout.index);this.cacheMembership();if(this.memCount>10000){this.lod=3;this.dprCap=1;this.resize();}this.emitStats();
  }
  committed(ids:string[],links:Array<{a:string;b:string;kind:LinkKind}>=[]){
    for(const id of ids){const node=this.byId.get(id);if(!node)continue;const revision=node.mem?.revision??node.catData?.count??1;if(this.committedSeen.get(id)===revision)continue;this.committedSeen.set(id,revision);node.born=this.now;node.glow=this.now+1600;}
    for(const link of links.slice(0,64)){const key=link.kind+'|'+[link.a,link.b].sort().join('|');if(this.committedLinks.has(key))continue;const edge=this.byId.get(link.a)?.adj.find(e=>e.kind===link.kind&&(e.a.id===link.b||e.b.id===link.b));if(edge){this.committedLinks.add(key);this.pulse(edge.a,edge.b,edge,0);}}
    this.dynamicUntil=this.now+1600;this.sceneVersion++;
  }
  private cacheMembership(){this.membersByCategory.clear();for(const n of this.nodes)if(n.mem){for(const cid of new Set([n.mem.category,n.mem.displayCategory??n.mem.category])){const group=this.membersByCategory.get(cid)??new Set<GNode>();group.add(n);this.membersByCategory.set(cid,group);}}for(const e of this.edges)if(e.kind==='category'){const hub=e.a.kind==='category'?e.a:e.b.kind==='category'?e.b:null,member=e.a.mem?e.a:e.b.mem?e.b:null;if(hub&&member){const cid=hub.cat.split('#')[0],group=this.membersByCategory.get(cid)??new Set<GNode>();group.add(member);this.membersByCategory.set(cid,group);}}}

  addMemory(input: RawRecord | GraphMemory): void {
    if (this.memCount >= (this.opts.maxMemories ?? 6000)) return;
    const m: GraphMemory = "label" in input ? input : rawToMemory(input, "fact");
    if (this.byId.has(m.id)) return;
    const category=m.displayCategory??m.category;
    const cs = this.cats.get(category) ?? this.createCategory(category);
    const nb = this.index.neighbors(m, 3, 0.2);
    const node = this.addLeaf(cs, m, true);
    this.committedSeen.set(m.id,m.revision);
    this.sceneVersion++;this.dynamicUntil=this.now+1600;
    this.index.add(m);
    this.pulse(cs.hub, node, node.adj[0] ?? null, 0);
    nb.forEach((n, i) => {
      const other = this.byId.get(n.id);
      if (!other) return;
      const e = this.link(node, other, "semantic", Math.min(1, n.sim * 1.4), `Related content: ${n.terms.join(", ")} (${Math.round(n.sim * 100)}% match)`);
      this.pulse(other, node, e, 250 + i * 150);
    });
    this.cacheMembership();this.emitStats();
  }

  recall(ids: string[]): void {
    this.dynamicUntil=this.now+5000;
    ids.forEach((id, i) => {
      const n = this.byId.get(id);
      if (!n) return;
      n.glow = this.now + 1800 + i * 90;
      const spoke = n.adj.find((e) => e.kind === "category");
      if (spoke) { const hub = spoke.a === n ? spoke.b : spoke.a; hub.glow = this.now + 1800; this.pulse(hub, n, spoke, i * 90); }
      n.adj.filter((e) => MEANINGFUL.has(e.kind)).slice(0, 2).forEach((e) => this.pulse(e.a === n ? e.b : e.a, n, e, i * 90 + 200));
    });
  }

  select(id: string | null): void {
    const n = id ? this.byId.get(id) ?? null : null;
    if (!n || n.kind === "dust") return this.clearSelection(true);
    this.sceneVersion++;
    this.sel = n;
    // A category can occupy several dated patches. Highlight its real members and
    // their existing edges, including members placed in more specific topic patches.
    const base = n.cat.split("#")[0];
    const members = n.kind === "category" ? n.cat.includes("#")?this.nodes.filter(other=>other.mem&&(other.cat===n.cat||other.cat.startsWith(n.cat+"#"))):[...(this.membersByCategory.get(base)??[])] : [n];
    this.selEdges = [...new Set(members.flatMap(other => other.adj).concat(n.adj))];
    this.focusSet = new Set([n.id, ...members.map(other => other.id), ...this.selEdges.flatMap(e => [e.a.id,e.b.id])]);
    const rho = Math.hypot(n.x, n.z);
    this.focusYaw = rho > 1e-4 ? Math.atan2(-n.x, n.z) : this.yaw;
    this.focusPitch = Math.atan2(n.y, rho);
    this.zt = Math.max(this.zt, n.kind === "category" ? 3.2 : n.kind === "memory" ? 2.6 : 2);
    this.startTransition(this.focusYaw,this.focusPitch,this.zt);
    this.opts.onSelect?.(this.describe(n));
  }

  search(q: string): string[] {
    this.sceneVersion++;
    const t = q.trim().toLowerCase();
    if (!t) { if (!this.sel) this.focusSet = null; return []; }
    const hit = this.nodes.filter((n) => n.kind !== "dust" && (n.label.toLowerCase().includes(t) || n.mem?.text.toLowerCase().includes(t)));
    this.focusSet = new Set(hit.map((n) => n.id));
    return hit.map((n) => n.id);
  }

  clearSelection(notify = false): void {
    this.sceneVersion++;
    this.sel = null; this.selEdges = []; this.focusSet = null; this.focusYaw = null;
    if (notify) this.opts.onSelect?.(null);
  }

  resize(): void {
    this.DPR = Math.min(window.devicePixelRatio || 1, this.dprCap);
    this.W = this.cv.clientWidth; this.H = this.cv.clientHeight;
    this.cv.width = this.W * this.DPR; this.cv.height = this.H * this.DPR;
    this.S = Math.min(this.W, this.H) * 0.4;
    if(this.scene){this.scene.width=this.cv.width;this.scene.height=this.cv.height;}this.sceneKey="";this.refreshAppearance();
  }

  destroy(): void {
    cancelAnimationFrame(this.raf);
    this.cleanups.forEach((f) => f());
    this.cleanups = [];
  }

  private mk(id: string, kind: NKind, x: number, y: number, z: number, col: number, r: number, label: string, cat: string): GNode {
    const n: GNode = { id, renderIndex: this.nodes.length, kind, col, r, label, x, y, z, born: this.now, sx: 0, sy: 0, z2: 0, s: 1, rr: 1, g: 1, glow: 0, adj: [], cat };
    this.nodes.push(n); this.byId.set(id, n);
    return n;
  }

  private link(a: GNode, b: GNode, kind: LinkKind, weight: number, reason: string, curve: number = CURVE[kind]): Edge {
    const key=[a.id,b.id].sort().join("|");
    if(kind==="category"&&this.categoryEdges.has(key))return this.categoryEdges.get(key)!;
    const e: Edge = { a, b, kind, weight, reason, curve, cx: 0, cy: 0, cz: 0, i: this.edges.length };
    if (curve) { e.cx = ((a.x + b.x) / 2) * curve; e.cy = ((a.y + b.y) / 2) * curve; e.cz = ((a.z + b.z) / 2) * curve; }
    if(kind==="category")this.categoryEdges.set(key,e);
    this.edges.push(e); a.adj.push(e); b.adj.push(e);
    return e;
  }

  private makeCat(data: GraphCategory, dir: Vec, rad: number, col: number): CatState {
    const d = nrm(dir), ax: Vec = Math.abs(d[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
    const u = nrm(cross(d, ax)), v = cross(d, u);
    const hub = this.mk("cat:" + data.id, "category", d[0] * rad, d[1] * rad, d[2] * rad, col, 0.012, data.label, data.id);
    hub.catData = data;
    if (this.theme === "obsidian" && data.count > 0) hub.col = col; // empty categories stay gray: no memory inside
    const cs: CatState = { id: data.id, data, d, u, v, rad, n: 0, col, hub };
    this.cats.set(data.id, cs);
    return cs;
  }

  private catColor(id: string, _i: number): number {
    return categoryColorIndex(id, this.categoryPalettes.get(id.split("#")[0]));
  }

  private splitCategories(data: GraphData) {
    const items: GraphCategory[] = [], itemOf = new Map<string, string>(), mainOf = new Map<string, string>();
    const by = new Map<string, GraphMemory[]>();
    for (const m of data.memories) { const cid=m.displayCategory??m.category;const g = by.get(cid); if (g) g.push(m); else by.set(cid, [m]); }
    for (const c of data.categories) {
      const ms = by.get(c.id) ?? [];
      if(c.id==='session_themes'&&ms.length){
        items.push({...c,count:0,totalCount:ms.length});
        const months=new Map<string,GraphMemory[]>();
        for(const m of ms){const day=m.date?.slice(0,10)||new Date(m.created||0).toISOString().slice(0,10),month=/^\d{4}-\d{2}/.test(day)?day.slice(0,7):'undated';const group=months.get(month)??[];group.push(m);months.set(month,group);}
        for(const [month,group] of [...months].sort((a,b)=>a[0].localeCompare(b[0]))){
          const monthId=c.id+'#'+month,monthLabel=month==='undated'?'Date not recorded':new Intl.DateTimeFormat('en',{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(month+'-15T12:00:00Z'));
          items.push({...c,id:monthId,label:c.label+' · '+monthLabel,count:group.length,totalCount:group.length});mainOf.set(monthId,c.id);
          group.forEach(m=>itemOf.set(m.id,monthId));
        }
        continue;
      }
      const greeting=/^(hello|greetings?|welcome)$/i.test(c.label),chunkSize=180;
      if (ms.length <= chunkSize || greeting) { items.push({ ...c, count: ms.length }); ms.forEach((m) => itemOf.set(m.id, c.id)); continue; }
      const groups = new Map<string, GraphMemory[]>();
      for (const m of ms) { const stamp=m.date?Date.parse(m.date.slice(0,10)+"T00:00:00Z"):NaN;
        const k=Number.isFinite(stamp)?new Date(Math.floor(stamp/(5*86400000))*(5*86400000)).toISOString().slice(0,10):"recent"; const g = groups.get(k); if (g) g.push(m); else groups.set(k, [m]); }
      const tiny = [...groups.entries()].filter(([k, g]) => k !== "recent" && g.length < 8);
      for (const [k, g] of tiny) { groups.delete(k); const r = groups.get("recent"); if (r) r.push(...g); else groups.set("recent", g); }
      let first = true;
      for (const k of [...groups.keys()].sort()) {
        const g = groups.get(k)!.sort((a, b) => a.created - b.created || (a.id < b.id ? -1 : 1));
        const parts = Math.ceil(g.length / chunkSize);
        for (let i = 0; i < parts; i++) {
          const chunk = g.slice(i * chunkSize, (i + 1) * chunkSize);
          const id = first ? c.id : `${c.id}#${k}${parts > 1 ? "-" + (i + 1) : ""}`;
          const label = first ? c.label : `${c.label} · ${k === "recent" ? "recent" : k}${parts > 1 ? " " + (i + 1) : ""}`;
          items.push({ ...c, id, label, count: chunk.length });
          chunk.forEach((m) => itemOf.set(m.id, id));
          if (!first) mainOf.set(id, c.id);
          first = false;
        }
      }
    }
    return { items, itemOf, mainOf };
  }

  private layoutCategories(items: GraphCategory[], links: GraphData["links"]): void {
    const baseIds = [...new Set(items.map((i) => i.id.split("#")[0]))].sort();
    const cats = [...items].sort((a, b) => b.count - a.count || (a.id < b.id ? -1 : 1));
    const n = cats.length;
    if (!n) return;
    const rc = cats.map((c) => (c.count >= 12 ? 0.94 : c.count>0?0.80+0.14*hash01(c.id):0.5+0.44*hash01(c.id)));
    const ang = cats.map((c, i) => Math.min(1.1, (this.s * Math.sqrt(c.count + 3)) / rc[i]));
    const idx = new Map(cats.map((c, i) => [c.id, i]));
    const linked = new Set<string>();
    for (const l of links) if (l.kind === "catalog") {
      const a = idx.get(l.a.slice(4)), b = idx.get(l.b.slice(4));
      if (a !== undefined && b !== undefined) linked.add(a < b ? `${a}|${b}` : `${b}|${a}`);
    }
    const P = fib(n);
    const iterations = Math.max(1, Math.min(260, Math.floor(2000000 / Math.max(1,n*(n-1)/2))));
    let pairWork=0;
    placement: for (let it = 0; it < iterations; it++) {
      const step = 0.14 * (1 - it / (iterations+40)), delta = P.map(() => [0, 0, 0]);
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
        if(++pairWork>2000000)break placement;
        const dot = Math.max(-1, Math.min(1, P[i][0] * P[j][0] + P[i][1] * P[j][1] + P[i][2] * P[j][2]));
        const angle = Math.acos(dot), want = (ang[i] + ang[j]) * 0.95;
        const t: Vec = [P[j][0] - P[i][0] * dot, P[j][1] - P[i][1] * dot, P[j][2] - P[i][2] * dot];
        const len = Math.hypot(t[0], t[1], t[2]);
        if (len < 1e-6) continue;
        let f = 0;
        if (angle < want && Math.abs(rc[i] - rc[j]) < 0.2) f = -(want - angle);
        else if (linked.has(`${i}|${j}`) && angle > want * 1.5) f = (angle - want * 1.5) * 0.15;
        if (!f) continue;
        for (let k = 0; k < 3; k++) { delta[i][k] += (t[k] / len) * f; delta[j][k] -= (t[k] / len) * f; }
      }
      for (let i = 0; i < n; i++) P[i] = nrm([P[i][0] + delta[i][0] * step * 3, P[i][1] + delta[i][1] * step * 3, P[i][2] + delta[i][2] * step * 3]);
    }
    cats.forEach((c, i) => this.makeCat(c, P[i], rc[i], this.catColor(c.id, baseIds.indexOf(c.id.split("#")[0]))));
  }

  private createCategory(id: string): CatState {
    const hubs = [...this.cats.values()].map((c) => c.hub);
    let best: Vec = [0, 1, 0], bestD = -1;
    for (const p of fib(300)) { // emptiest spot on the sphere
      let m = 9;
      for (const h of hubs) { const l = Math.hypot(h.x, h.y, h.z) || 1; m = Math.min(m, Math.acos(Math.max(-1, Math.min(1, (h.x * p[0] + h.y * p[1] + h.z * p[2]) / l)))); }
      if (m > bestD) { bestD = m; best = p; }
    }
    return this.makeCat({ id, label: prettify(id), description: "", count: 0 }, best, 0.94, this.catColor(id, this.cats.size));
  }

  private addLeaf(cs: CatState, m: GraphMemory, live: boolean): GNode {
    const j = cs.n++, obs = this.theme === "obsidian", h01 = hash01(m.id);
    const th = j * GA + (obs ? (h01 - 0.5) * 0.9 : 0);                       // loose, organic fans instead of a perfect spiral
    const off = (this.s * Math.sqrt(j + 3) * (obs ? 0.55 + 0.95 * hash01(m.id + "r") : 1)) / cs.rad;
    const c = Math.cos(th) * off, s = Math.sin(th) * off;
    const p = nrm([cs.d[0] + cs.u[0] * c + cs.v[0] * s, cs.d[1] + cs.u[1] * c + cs.v[1] * s, cs.d[2] + cs.u[2] * c + cs.v[2] * s]);
    const empty = obs && !m.text.trim(); // a memory with no content has no life: gray
    const n = this.mk(m.id, "memory", p[0] * cs.rad, p[1] * cs.rad, p[2] * cs.rad, empty ? GRAY : cs.col, this.dotR * (0.85 + 0.3 * m.confidence), m.label, cs.id);
    n.mem = m;
    if (live) n.born = this.now;
    this.memCount++;
    this.link(n, cs.hub, "category", 1, `Belongs to ${cs.data.label}`);
    cs.data.count = cs.n;
    if (obs) cs.hub.col = cs.col; // first memory wakes the hub up with the category colour
    cs.hub.r = (this.theme === "obsidian" ? 0.008 : 0.012) + (this.theme === "obsidian" ? 0.0005 : 0.0006) * Math.sqrt(cs.n);
    return n;
  }

  private addEntity(e: GraphEntity): void {
    const ms = e.members.map((id) => this.byId.get(id)).filter((x): x is GNode => !!x);
    if (!ms.length) return;
    const cx = ms.reduce((s, n) => s + n.x, 0) / ms.length, cy = ms.reduce((s, n) => s + n.y, 0) / ms.length, cz = ms.reduce((s, n) => s + n.z, 0) / ms.length;
    const j = (k: string) => (hash01(e.id + k) - 0.5) * 0.06; // small stable offset so relays never stack
    const n = this.mk("ent:" + e.id, "entity", cx * 0.5 + j("x"), cy * 0.5 + j("y"), cz * 0.5 + j("z"), this.catColor(e.category,0), 0.0045, e.label, e.category);
    n.ent = e;
  }

  private addDust(): void {
    for (let i = 0; i < 1300; i++) {
      const d = nrm([hash01("dx" + i) - 0.5, hash01("dy" + i) - 0.5, hash01("dz" + i) - 0.5]);
      const r = i % 5 < 3 ? 0.9 + 0.1 * hash01("dr" + i) : 0.12 + 0.8 * Math.cbrt(hash01("dr" + i)); // mostly a faint shell
      this.mk("dust:" + i, "dust", d[0] * r, d[1] * r, d[2] * r, DUST, 0.0026, "", "");
    }
  }

  private pathPoint(from: GNode, to: GNode, e: Edge | null, q: number, tmp: { sx: number; sy: number; z2: number; s: number }): [number, number] {
    if (e && e.curve) {
      this.project(e.cx, e.cy, e.cz, tmp);
      const i = 1 - q;
      return [i * i * from.sx + 2 * i * q * tmp.sx + q * q * to.sx, i * i * from.sy + 2 * i * q * tmp.sy + q * q * to.sy];
    }
    return [from.sx + (to.sx - from.sx) * q, from.sy + (to.sy - from.sy) * q];
  }

  private spawnFlow(t: number): void {
    if (this.flowPoolN !== this.edges.length) {
      this.flowPool = this.edges.filter((e) => e.kind !== "category");
      if (!this.flowPool.length) this.flowPool = this.edges;
      this.flowPoolN = this.edges.length;
    }
    const list = this.sel && this.selEdges.length && Math.random() < 0.5 ? this.selEdges : this.flowPool; // flows favour what you selected
    if (!list.length) return;
    const e = list[Math.floor(Math.random() * list.length)], fwd = Math.random() < 0.5;
    const col = Math.random() < 0.3 ? FLOW_COLS[Math.floor(Math.random() * FLOW_COLS.length)] : KIND_FLOW[e.kind];
    const burst = Math.random() < 0.12 ? 4 + Math.floor(Math.random() * 3) : 1; // a burst looks like a beam
    for (let i = 0; i < burst; i++) {
      this.packets.push({ e, from: fwd ? e.a : e.b, to: fwd ? e.b : e.a, t0: t + i * 70, dur: 380 + Math.random() * 340, col, hops: burst > 1 ? 0 : 1 + Math.floor(Math.random() * 3) });
    }
  }

  private pulse(from: GNode, to: GNode, e: Edge | null, delay: number): void {
    if(this.reduced){to.glow=this.now+1800;return;}
    const dur=1000+Math.random()*300;this.dynamicUntil=Math.max(this.dynamicUntil,this.now+delay+dur+1900);
    this.pulses.push({ from, to, e, t0: this.now + delay, dur, kind: e?.kind ?? "category" });
  }

  private emitStats(): void {
    this.opts.onStats?.({ memories: this.memCount, categories: [...this.cats.keys()].filter((k) => !k.includes("#")).length, links: this.edges.length });
  }

  private describe(n: GNode): SelectionInfo {
    const edges = n === this.sel ? this.selEdges : n.adj;
    const targets = new Map<string,SelectionLink>();
    for(const e of edges) for(const o of [e.a,e.b]) {
      if(o.id===n.id)continue;
      const key=o.id+":"+e.kind;
      if(!targets.has(key))targets.set(key,{id:o.id,title:o.label||o.id,kind:e.kind,reason:e.reason,weight:e.weight});
    }
    const links = [...targets.values()].sort((a,b)=>(a.kind==="category"?1:0)-(b.kind==="category"?1:0)||b.weight-a.weight||a.id.localeCompare(b.id));
    const cat = this.cats.get(n.cat);
    const base = { id: n.id, category: n.cat, categoryLabel: cat?.data.label ?? prettify(n.cat), links };
    if (n.mem) {
      const m = n.mem, flags: string[] = [];
      if (m.pending) flags.push("Needs review");
      if (m.conflict) flags.push("Had a conflict");
      if (m.derived) flags.push("Auto-derived");
      return { ...base, type: "memory", title: m.label, text: m.text, created: m.created, source: m.source, confidence: m.confidence, flags };
    }
    if (n.catData) return { ...base, type: "category", title: n.catData.label, text: `${n.catData.description}\n${this.nodes.filter(other=>other.mem&&(n.cat.includes("#")?other.cat===n.cat:(other.mem.displayCategory??other.mem.category)===n.cat||other.mem.category===n.cat)).length} memories in this category.`.trim(), flags: [] };
    return { ...base, type: "entity", title: n.label, text: `Groups ${n.ent?.members.length ?? 0} related memories.`, flags: [] };
  }

  private bind(): void {
    const cv = this.cv;
    const on = <K extends keyof HTMLElementEventMap>(t: K, f: (e: HTMLElementEventMap[K]) => void, o?: AddEventListenerOptions) => {
      cv.addEventListener(t, f as EventListener, o);
      this.cleanups.push(() => cv.removeEventListener(t, f as EventListener));
    };
    on("pointerdown", (e) => {
      cv.setPointerCapture(e.pointerId);
      this.ptrs.set(e.pointerId, [e.clientX, e.clientY]);
      this.down = true; this.moved = 0; this.focusYaw = null;
      this.transition=null;this.manualUntil=performance.now()+5000;
      cv.style.cursor = "grabbing";
      if (this.ptrs.size === 2) { const [a, b] = [...this.ptrs.values()]; this.pinch = Math.hypot(a[0] - b[0], a[1] - b[1]); }
    });
    on("pointermove", (e) => {
      const r = cv.getBoundingClientRect();
      this.mx = e.clientX - r.left; this.my = e.clientY - r.top;
      const p = this.ptrs.get(e.pointerId);
      if (!p) return;
      this.manualUntil=performance.now()+5000;
      if (this.ptrs.size === 1) {
        const dx = e.clientX - p[0], dy = e.clientY - p[1];
        this.moved += Math.abs(dx) + Math.abs(dy);
        this.yaw = wrap(this.yaw + dx * 0.006); this.pitch = wrap(this.pitch + dy * 0.006);
        this.vy = dx * 0.006; this.vp = dy * 0.006;
      }
      this.ptrs.set(e.pointerId, [e.clientX, e.clientY]);
      if (this.ptrs.size === 2) {
        const [a, b] = [...this.ptrs.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]);
        if (this.pinch) this.zt = Math.min(8, Math.max(0.6, (this.zt * d) / this.pinch));
        if(this.zt<1.35&&this.sel)this.clearSelection(true);
        this.pinch = d; this.moved = 99;
      }
    });
    const up = (e: PointerEvent) => {
      const wasTap = this.ptrs.size === 1 && this.moved < 6 && e.type === "pointerup";
      this.manualUntil=performance.now()+5000;
      this.ptrs.delete(e.pointerId);
      if (!this.ptrs.size) { this.down = false; cv.style.cursor = "grab"; }
      this.pinch = 0;
      if (wasTap) { const r = cv.getBoundingClientRect(); const h = this.hit(e.clientX - r.left, e.clientY - r.top); if (h) this.select(h.id); else this.clearSelection(true); }
    };
    on("pointerup", up); on("pointercancel", up);
    on("pointerleave", () => { this.mx = this.my = -1e3; });
    on("wheel", (e) => { e.preventDefault();this.manualUntil=performance.now()+5000;this.focusYaw=null;this.zt=Math.min(8,Math.max(.6,this.zt*Math.exp(-e.deltaY*.0013)));if(this.zt<1.35&&this.sel)this.clearSelection(true);this.startTransition(this.yaw,this.pitch,this.zt); }, { passive: false });
  }

  private hit(px: number, py: number): GNode | null {
    let best: GNode | null = null, bd = 1e9;
    for (const n of this.nodes) {
      if (n.kind === "dust" || n.z2 < -0.3) continue;
      const d = (n.sx - px) ** 2 + (n.sy - py) ** 2, rr = n.rr + 7;
      if (d < rr * rr && d - n.z2 * 30 < bd) { bd = d - n.z2 * 30; best = n; }
    }
    return best;
  }

  private project(x: number, y: number, z: number, o: { sx: number; sy: number; z2: number; s: number }): void {
    const { cy, sy, cp, sp, cx, cyy, sc } = this.rot;
    const x1 = x * cy + z * sy, z1 = -x * sy + z * cy, y2 = y * cp - z1 * sp, z2 = y * sp + z1 * cp, s = 3.6 / (3.6 - z2);
    o.sx = cx + x1 * s * sc; o.sy = cyy + y2 * s * sc; o.z2 = z2; o.s = s;
  }
  getCamera(): MemoryCamera { return {yaw:this.yaw,pitch:this.pitch,zoom:this.zt}; }
  private startTransition(yaw:number,pitch:number,zoom:number){this.transition={start:performance.now(),yaw:this.yaw,pitch:this.pitch,zoom:this.zoom,targetYaw:yaw,targetPitch:pitch,targetZoom:zoom};if(this.reduced){this.yaw=yaw;this.pitch=pitch;this.zoom=zoom;this.transition=null;}}
  view(command:{action:string;id?:string;zoom?:number;x?:number;y?:number;yaw?:number;pitch?:number;guided?:boolean;ids?:string[]}):{status:string;reason?:string}{
    if(command.guided&&(this.down||performance.now()<this.manualUntil))return {status:'deferred',reason:'user_interacting'};
    if(['focus','inspect','expand','category','entity','topic'].includes(command.action)){if(!command.id||!this.byId.has(command.id))return {status:'not_found'};this.select(command.id);}
    else if(command.action==='highlight'){const ids=command.ids??(command.id?[command.id]:[]);if(ids.some(id=>!this.byId.has(id)))return {status:'not_found'};this.recall(ids);}
    else if(command.action==='zoom'){if(!Number.isFinite(command.zoom))return {status:'rejected'};this.zt=Math.max(.6,Math.min(8,command.zoom!));if(this.zt<1.35)this.clearSelection(true);this.startTransition(this.yaw,this.pitch,this.zt);}
    else if(command.action==='rotate'){if(!Number.isFinite(command.yaw)||!Number.isFinite(command.pitch))return {status:'rejected'};this.focusYaw=wrap(command.yaw!);this.focusPitch=wrap(command.pitch!);this.startTransition(this.focusYaw,this.focusPitch,this.zt);}
    else if(command.action==='pan'){if(!Number.isFinite(command.x)||!Number.isFinite(command.y))return {status:'rejected'};this.panX=Math.max(-1,Math.min(1,command.x!));this.panY=Math.max(-1,Math.min(1,command.y!));this.sceneVersion++;}
    else if(command.action==='reset'){this.clearSelection(true);this.panX=this.panY=0;this.focusYaw=null;this.zt=1.12;this.startTransition(.6,.3,1.12);}
    else return {status:'rejected',reason:'unsupported_view_action'};
    return {status:'completed'};
  }
  restoreCamera(value: MemoryCamera): void {
    if(![value.yaw,value.pitch,value.zoom].every(Number.isFinite))return;
    this.yaw=wrap(value.yaw);this.pitch=wrap(value.pitch);this.zoom=this.zt=Math.min(8,Math.max(.6,value.zoom));this.sceneVersion++;
  }
  /** Resolve paint colors only on theme/size changes, never for every particle. */
  refreshAppearance(): void {
    if(typeof getComputedStyle!=="function")return;
    const values=getComputedStyle(this.cv.parentElement ?? this.cv).backgroundColor.match(/[\d.]+/g);
    this.lightSurface=!!values&&values.length>=3&&(.2126*Number(values[0])+.7152*Number(values[1])+.0722*Number(values[2]))>150;
    this.cols=[...contrastShades(this.lightSurface),this.lightSurface?"#76716a":"#92908a",this.lightSurface?"#4b4841":MEMORY_HIGHLIGHT,"#9b6bff","#696866"];
    this.shade=shadeOf(this.cols);this.sceneVersion++;this.sceneKey="";
  }
  private frame = (t: number): void => {
    this.raf = requestAnimationFrame(this.frame);
    if(!this.down&&this.focusYaw===null&&!this.pulses.length&&this.lod>1&&(this.memCount>6000||this.paintMs>8)&&t-this.paintedAt<32)return;
    this.paintedAt=t;const paintStart=performance.now();
    this.now = t;
    const dt = Math.min(50, t - this.last || 16); this.last = t;
    const f = dt / 16.7, { W, H, S } = this;let ctx=this.ctx;

    this.ema = this.ema * 0.95 + this.paintMs * 0.05; // adaptive quality for weak machines
    if (this.cool > 0) this.cool--;
    else if (this.ema > 20 && this.lod < 3) { this.lod++; this.cool = 90; if (this.lod === 3) { this.dprCap = 1; this.resize(); } }
    if(this.ema<14&&this.lod>1){if(++this.healthyFrames>90){this.lod--;this.healthyFrames=0;this.cool=90;if(this.lod<3){this.dprCap=1.5;this.resize();}}}else this.healthyFrames=0;

    if(this.transition&&!this.down){const a=this.transition,q=Math.min(1,Math.max(0,(t-a.start)/350)),ease=1-(1-q)**3;this.yaw=wrap(a.yaw+wrap(a.targetYaw-a.yaw)*ease);this.pitch=wrap(a.pitch+wrap(a.targetPitch-a.pitch)*ease);this.zoom=a.zoom+(a.targetZoom-a.zoom)*ease;this.vy=this.vp=0;if(q===1)this.transition=null;}
    else if (this.focusYaw !== null && !this.down) {
      if(this.reduced){this.yaw=this.focusYaw;this.pitch=this.focusPitch;}else{this.yaw += wrap(this.focusYaw - this.yaw) * 0.09 * f;this.pitch += wrap(this.focusPitch - this.pitch) * 0.09 * f;if(Math.abs(wrap(this.focusYaw-this.yaw))<.001&&Math.abs(wrap(this.focusPitch-this.pitch))<.001){this.yaw=this.focusYaw;this.pitch=this.focusPitch;}} this.vy = this.vp = 0;
    } else if (!this.down) {
      const spin = this.sel || this.reduced ? 0 : 0.00108;
      if(this.reduced)this.vy=this.vp=0;
      this.vy += (spin - this.vy) * 0.03 * f; this.vp += ((this.sel || this.reduced ? 0 : .00033) - this.vp) * .03 * f;
      this.yaw = wrap(this.yaw + this.vy * f); this.pitch = wrap(this.pitch + this.vp * f);
    }
    if(!this.transition)this.zoom += (this.zt - this.zoom) * (this.reduced ? 1 : Math.min(1, 0.12 * f));
    if(Math.abs(this.zt-this.zoom)<.001)this.zoom=this.zt;

    if(this.reduced)this.packets=[];
    if (this.opts.flows && !this.reduced) { // information keeps moving through the network
      this.flowT += dt;
      if (this.flowT > 80 && this.packets.length < ([60, 30, 12][this.lod - 1] ?? 12)) { this.flowT = 0; this.spawnFlow(t); }
    }

    this.rot = { cy: Math.cos(this.yaw), sy: Math.sin(this.yaw), cp: Math.cos(this.pitch), sp: Math.sin(this.pitch), cx: W / 2+this.panX*W*.4, cyy: H / 2+this.panY*H*.4, sc: S * this.zoom };
    for (const n of this.nodes) this.project(n.x, n.y, n.z, n);
    const detail = Math.min(1, Math.max(0, (this.zoom - 1.3) / 1.5)); // 0 = far away, 1 = zoomed into clusters

    const fs=this.focusSet,tmp={sx:0,sy:0,z2:0,s:1};let hov:GNode|null=null,hd=1e9;
    const keyScene=[this.sceneVersion,this.lod,this.yaw.toFixed(3),this.pitch.toFixed(3),this.zoom.toFixed(3),this.DPR].join(":");
    const sceneContext=this.scene?.getContext("2d");
    if(!sceneContext||this.sceneKey!==keyScene||t<this.dynamicUntil){
    ctx=sceneContext??this.ctx;
    ctx.setTransform(this.DPR, 0, 0, this.DPR, 0, 0);
    ctx.clearRect(0, 0, W, H);
    if (this.theme === "glass") { // faint globe shell so the sphere reads as round even when data is sparse
      const { cx, cyy, sc } = this.rot, rs = ((0.98 * 3.6) / Math.sqrt(3.6 * 3.6 - 0.98 * 0.98)) * sc;
      const gr = ctx.createRadialGradient(cx, cyy, rs * 0.2, cx, cyy, rs);
      gr.addColorStop(0, "rgba(120,140,190,.05)"); gr.addColorStop(0.85, "rgba(120,140,190,.035)"); gr.addColorStop(1, "rgba(150,170,220,.13)");
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(cx, cyy, rs, 0, TAU); ctx.fill();
    }

    // Retained strands always retain their real endpoint dots.
    const edgeNodes=new Set<GNode>();
    // strings: two styles x three depth bands
    const eb = this.eb;
    for (const c of eb) { c[0].length = c[1].length = c[2].length = 0; }
    for (const e of this.edges) {
      if (this.lod > 1 && e.i % (this.lod*this.lod)) continue;
      if(this.sel&&this.zoom>2.2&&fs&&!fs.has(e.a.id)&&!fs.has(e.b.id))continue;
      // A quadratic stays inside the bounding box of its endpoints and control.
      const bounds = [e.a,e.b];
      if(e.curve){const control={sx:0,sy:0,z2:0,s:1};this.project(e.cx,e.cy,e.cz,control);bounds.push(control as GNode);}
      if(bounds.every(n=>n.sx < -12)||bounds.every(n=>n.sx > W+12)||bounds.every(n=>n.sy < -12)||bounds.every(n=>n.sy > H+12))continue;
      edgeNodes.add(e.a);edgeNodes.add(e.b);
      const z = (e.a.z2 + e.b.z2) / 2;
      eb[MEANINGFUL.has(e.kind) ? 1 : 0][z < -0.25 ? 0 : z < 0.35 ? 1 : 2].push(e);
    }
    // Subdivide only curves crossing viewport boundaries. Rasterizing a giant
    // offscreen compound path is expensive even when Canvas eventually clips it.
    const segment=(ax:number,ay:number,bx:number,by:number)=>{
      let lo=0,hi=1;const dx=bx-ax,dy=by-ay;
      for(const [p,q] of [[-dx,ax+12],[dx,W+12-ax],[-dy,ay+12],[dy,H+12-ay]]){
        if(p===0){if(q<0)return;continue;}const u=q/p;
        if(p<0){lo=Math.max(lo,u);}else{hi=Math.min(hi,u);}if(lo>hi)return;
      }
      ctx.moveTo(ax+dx*lo,ay+dy*lo);ctx.lineTo(ax+dx*hi,ay+dy*hi);
    };
    const curve=(ax:number,ay:number,cx:number,cy:number,bx:number,by:number,depth=0)=>{
      const minx=Math.min(ax,bx,cx),maxx=Math.max(ax,bx,cx),miny=Math.min(ay,by,cy),maxy=Math.max(ay,by,cy);
      if(maxx < -12 || minx > W+12 || maxy < -12 || miny > H+12)return;
      if(minx>=-12&&maxx<=W+12&&miny>=-12&&maxy<=H+12){ctx.moveTo(ax,ay);ctx.quadraticCurveTo(cx,cy,bx,by);return;}
      const flat=Math.abs((bx-ax)*(ay-cy)-(by-ay)*(ax-cx))/Math.max(1,Math.hypot(bx-ax,by-ay));
      if(depth>=6||flat<.75){segment(ax,ay,bx,by);return;}
      const acx=(ax+cx)/2,acy=(ay+cy)/2,bcx=(bx+cx)/2,bcy=(by+cy)/2,mx=(acx+bcx)/2,my=(acy+bcy)/2;
      curve(ax,ay,acx,acy,mx,my,depth+1);curve(mx,my,bcx,bcy,bx,by,depth+1);
    };
    const path=(list:Edge[])=>{
      for(const e of list){
        if(e.curve){this.project(e.cx,e.cy,e.cz,tmp);curve(e.a.sx,e.a.sy,tmp.sx,tmp.sy,e.b.sx,e.b.sy);}
        else segment(e.a.sx,e.a.sy,e.b.sx,e.b.sy);
      }
    };
    const es = this.lightSurface ? {struct:["rgba(72,68,62,.12)","rgba(72,68,62,.18)","rgba(72,68,62,.28)"],mean:["rgba(72,68,62,.14)","rgba(72,68,62,.22)","rgba(72,68,62,.32)"],dim:["rgba(72,68,62,.025)","rgba(72,68,62,.04)","rgba(72,68,62,.06)"]} : EDGE_STYLE[this.theme];
    ctx.lineWidth = this.theme === "obsidian" ? 0.5 : 0.55;
    for (let c = 0; c < 2; c++) for (let k = 0; k < 3; k++) {
      ctx.strokeStyle = fs ? es.dim[k] : (c ? es.mean : es.struct)[k];
      ctx.beginPath(); path(eb[c][k]); ctx.stroke();
    }
    if (detail > 0.1 && !fs) { // bright branches when you zoom in
      ctx.globalCompositeOperation = "lighter"; ctx.lineWidth = 1.5; ctx.strokeStyle = `rgba(139,149,167,${0.1 * detail})`;
      ctx.beginPath(); path(eb[1][2]); path(eb[1][1]); ctx.stroke();
      ctx.globalCompositeOperation = "source-over";
    }
    if (this.sel) { // connections of the selected node, coloured by why they exist
      ctx.lineWidth = 1.3;
      // Individual-node detail stays complete. A very large collective category
      // retains all adjacency for inspection, with adaptive distant-context detail.
      const visible=(n:GNode)=>n.sx>=0&&n.sx<=W&&n.sy>=0&&n.sy<=H;
      let selectedEdges=this.selEdges.filter(e=>visible(e.a)||visible(e.b));
      for(const e of selectedEdges){edgeNodes.add(e.a);edgeNodes.add(e.b);}
      for (const kind of Object.keys(KIND_RGB) as LinkKind[]) {
        const list = selectedEdges.filter((e) => e.kind === kind);
        if (!list.length) continue;
        ctx.strokeStyle = `rgba(${KIND_RGB[kind]},${kind === "category" ? 0.35 : 0.9})`;
        ctx.beginPath(); path(list); ctx.stroke();
      }
    }

    // soft glow around each cluster
    ctx.globalCompositeOperation = "lighter";
    let halos=0;
    for (const cs of this.cats.values()) {
      if(halos >= 12)break;
      const hb = cs.hub;
      if (hb.z2 < -0.25) continue;
      const reach = s0r(this.s, cs);
      const r = Math.min(42, Math.max(12, reach * this.S * hb.s * 0.3));
      if (hb.sx < -r || hb.sx > W + r || hb.sy < -r || hb.sy > H + r) continue;
      halos++;
      const k = (0.35 + 0.35 * detail) * ((hb.z2 + 1.2) / 2.2), c = this.cols[cs.col];
      const g = ctx.createRadialGradient(hb.sx, hb.sy, 0, hb.sx, hb.sy, r);
      g.addColorStop(0, hexA(c, 0.2 * k)); g.addColorStop(0.55, hexA(c, 0.08 * k)); g.addColorStop(1, hexA(c, 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(hb.sx, hb.sy, r, 0, TAU); ctx.fill();
    }
    ctx.globalCompositeOperation = "source-over";

    // nodes: batched by colour, depth band and focus
    for (const b of this.bk) b.length = 0;
    const zs = Math.pow(this.zoom, 0.8), glowing: GNode[] = [];
    for (const n of this.nodes) {
      if(this.sel&&this.zoom>2.2&&fs&&n.mem&&!fs.has(n.id)&&!edgeNodes.has(n))continue;
      const age = t - n.born;
      n.g = !this.reduced && age < 600 ? 1 - Math.pow(1 - age / 600, 3) : 1;
      n.rr = Math.max(0.85, n.r * S * n.s * zs * n.g * (this.zoom > 1.4 ? 1.15 : 1));
      const dim = fs !== null && !fs.has(n.id) ? 1 : 0;
      const onScreen=n.sx>=-n.rr-12&&n.sx<=W+n.rr+12&&n.sy>=-n.rr-12&&n.sy<=H+n.rr+12;
      if(onScreen&&(n.kind!=="memory"||this.memCount<=6000||this.lod===1||edgeNodes.has(n)||fs?.has(n.id)||n.glow>t||n.renderIndex%(this.lod*this.lod)===0))
        this.bk[(n.col * 3 + (n.z2 < -0.2 ? 0 : n.z2 < 0.4 ? 1 : 2)) * 2 + dim].push(n);
      if (onScreen && !this.reduced && (age < 1500 || n.glow > t)) glowing.push(n);

    }
    for (let k = 0; k < this.bk.length; k++) {
      const a = this.bk[k];
      if (!a.length) continue;
      const dim = k % 2, ci = Math.floor(k / 2);
      ctx.globalAlpha = dim ? 0.18 : 1;
      ctx.fillStyle = this.shade[Math.floor(ci / 3)][ci % 3];
      ctx.beginPath();
      for (const n of a) { ctx.moveTo(n.sx + n.rr, n.sy); ctx.arc(n.sx, n.sy, n.rr, 0, TAU); }
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Important names appear progressively, with a small collision-aware label budget.
    ctx.font = "11px system-ui, -apple-system, sans-serif";
    const labels: {x:number;y:number;w:number}[]=[];
    const candidates=this.nodes.filter(n=>n.kind==="category"||n.kind==="entity"||(n.mem?.kind==="fact"&&!n.mem.derived&&n.adj.length>2))
      .filter(n=>n.z2>.05&&n.sx>0&&n.sx<W&&n.sy>0&&n.sy<H&&(!fs||fs.has(n.id))&&(!n.catData||n.catData.count>0))
      .sort((a,b)=>(b===this.sel?10000:0)+b.adj.length-(a===this.sel?10000:0)-a.adj.length||a.id.localeCompare(b.id));
    const budget=detail>.15?24:6;
    for(const n of candidates){
      if(labels.length>=budget)break;
      if(detail<=.15&&n.kind==="memory")continue;
      const text=n.label.slice(0,42),width=ctx.measureText(text)?.width||text.length*6,x=n.sx+n.rr+6,y=n.sy-6;
      if(x+width>W-8||labels.some(p=>Math.abs(y-p.y)<17&&x<p.x+p.w+6&&x+width+6>p.x))continue;
      labels.push({x,y,w:width});ctx.fillStyle=this.lightSurface?"#4b4841":MEMORY_HIGHLIGHT;ctx.fillText(text,x,y);
    }

    // birth pulses, recall glow, amber ring on memories that need review
    ctx.lineWidth = 1;
    for (const n of glowing) {
      const a = Math.max(0, Math.min(1, (t - n.born) / 1500, n.glow > t ? 1 - (n.glow - t) / 1800 : 1));
      ctx.strokeStyle = `rgba(255,255,255,${Math.max(0, (1 - a) * 0.85)})`;
      ctx.beginPath(); ctx.arc(n.sx, n.sy, n.rr + 2 + a * 14, 0, TAU); ctx.stroke();
    }
    ctx.strokeStyle = "rgba(255,190,80,.9)";
    ctx.beginPath();
    for (const n of this.nodes) if (n.sx>=-10&&n.sx<=W+10&&n.sy>=-10&&n.sy<=H+10&&n.mem?.pending && (!fs || fs.has(n.id))) { ctx.moveTo(n.sx + n.rr + 3, n.sy); ctx.arc(n.sx, n.sy, n.rr + 3, 0, TAU); }
    ctx.stroke();

    this.sceneKey=keyScene;
    }
    ctx=this.ctx;ctx.setTransform(this.DPR,0,0,this.DPR,0,0);
    if(sceneContext&&this.scene){ctx.clearRect(0,0,W,H);ctx.drawImage(this.scene,0,0,W,H);}
    for(const n of this.nodes) {
      if(!this.down&&n.kind!=="dust"&&n.z2>-.3){const d=(n.sx-this.mx)**2+(n.sy-this.my)**2,rr=n.rr+7;if(d<rr*rr&&d-n.z2*30<hd){hd=d-n.z2*30;hov=n;}}
    }
    // travelling signals
    this.pulses = this.pulses.filter((p) => t < p.t0 + p.dur);
    for (const p of this.pulses) {
      const u = (t - p.t0) / p.dur;
      if (u < 0) continue;
      const at = (q: number): [number, number] => {
        const a = p.from, b = p.to;
        if (p.e && p.e.curve) {
          this.project(p.e.cx, p.e.cy, p.e.cz, tmp);
          const i = 1 - q;
          return [i * i * a.sx + 2 * i * q * tmp.sx + q * q * b.sx, i * i * a.sy + 2 * i * q * tmp.sy + q * q * b.sy];
        }
        return [a.sx + (b.sx - a.sx) * q, a.sy + (b.sy - a.sy) * q];
      };
      for (let k = 0; k < 3; k++) {
        const q = Math.max(0, u - k * 0.05), [px, py] = at(q);
        ctx.fillStyle = `rgba(${rgbOf(this.cols[p.to.col])},${(1 - k * 0.24) * (1 - u * 0.3)})`;
        ctx.beginPath(); ctx.arc(px, py, 1.7 - k * 0.35, 0, TAU); ctx.fill();
      }
      if (u > 0.92) p.to.glow = Math.max(p.to.glow, t + 900);
    }

    // streams of information: coloured packets that hop from connection to connection
    ctx.globalCompositeOperation = "lighter";
    const nextPk: Packet[] = [];
    for (const p of this.packets) {
      const u = (t - p.t0) / p.dur;
      if (u >= 1) {
        const opts = p.to.adj.filter((e) => e !== p.e);
        if (p.hops > 0 && opts.length) {
          const ne = opts[Math.floor(Math.random() * opts.length)];
          nextPk.push({ e: ne, from: p.to, to: ne.a === p.to ? ne.b : ne.a, t0: t, dur: 320 + Math.random() * 300, col: p.col, hops: p.hops - 1 });
        }
        continue;
      }
      nextPk.push(p);
      if (u < 0) continue;
      const sz = Math.min(1.7, 0.8 + this.zoom * 0.25);
      for (let k = 0; k < 7; k++) {
        const [px, py] = this.pathPoint(p.from, p.to, p.e, Math.max(0, u - k * 0.035), tmp);
        ctx.fillStyle = `rgba(${p.col},${(1 - k / 7) * 0.85})`;
        ctx.beginPath(); ctx.arc(px, py, (k === 0 ? 2.6 : 2.1) * (1 - k * 0.08) * sz, 0, TAU); ctx.fill();
        if (k === 0) { ctx.fillStyle = `rgba(${p.col},0.16)`; ctx.beginPath(); ctx.arc(px, py, 7 * sz, 0, TAU); ctx.fill(); }
      }
    }
    this.packets = nextPk;
    ctx.globalCompositeOperation = "source-over";

    // hover + selection ring
    const h = hov as GNode | null;
    ctx.strokeStyle = this.lightSurface ? "#4b4841" : MEMORY_HIGHLIGHT; ctx.lineWidth = 1.2;
    if (h) { ctx.beginPath(); ctx.arc(h.sx, h.sy, h.rr + 3, 0, TAU); ctx.stroke(); }
    if (this.sel) { ctx.beginPath(); ctx.arc(this.sel.sx, this.sel.sy, this.sel.rr + 5, 0, TAU); ctx.stroke(); }
    this.paintMs=Math.max(.01,performance.now()-paintStart);
    this.metricsFrames++;
    if(this.cv.dataset&&t-this.metricsSince>=1000){
      this.cv.dataset.globeFps=(this.metricsFrames*1000/Math.max(1,t-this.metricsSince)).toFixed(1);
      this.cv.dataset.globePaintMs=this.paintMs.toFixed(2);
      this.cv.dataset.globeVisibleDots=String(this.bk.reduce((count,b)=>count+b.length,0));
      this.cv.dataset.globeQuality=String(this.lod);
      this.cv.dataset.globeYaw=this.yaw.toFixed(4);this.cv.dataset.globePitch=this.pitch.toFixed(4);this.cv.dataset.globeZoom=this.zoom.toFixed(3);
      this.metricsFrames=0;this.metricsSince=t;
    }
    const key = h ? `${h.id}|${Math.round(this.mx)}|${Math.round(this.my)}` : "";
    if (key !== this.lastHover) {
      this.lastHover = key;
      this.opts.onHover?.(h ? { text: h.kind === "category" ? `${h.label} · ${h.catData?.totalCount ?? h.catData?.count ?? 0} memories` : h.label, x: this.mx, y: this.my } : null);
    }
  };
}

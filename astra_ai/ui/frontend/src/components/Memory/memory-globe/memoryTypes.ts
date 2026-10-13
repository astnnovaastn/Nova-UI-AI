// memoryTypes.ts — raw long_term.json schema + the graph model the globe renders

// ---------- raw schema (what your backend stores) ----------
export interface RawRecord {
  id: string;
  kind?: string;
  category: string;
  key: string;
  value?: unknown;
  content?: unknown;
  created?: string;
  updated?: string;
  revision?: number;
  consent?: string;
  confidence?: number;
  source?: string;
  session_id?: string;
  turn_id?: string;
  event_type?: string;
  attributes?: Record<string, unknown>;
  provenance?: Record<string, unknown>;
  evidence_refs?: unknown[];
  history?: unknown[];
  lifecycle?: string;
  profile_id?: string;
  project_id?: string;
}
export interface RawRelation {
  id: string;
  from: string;
  to: string;
  type?: string;
  evidence?: string;
  categories?: string[];
}
type Groups = Record<string, Record<string, RawRecord>>;
export interface RawMemoryFile {
  visual_topics?: {id:string;label:string;description:string;member_ids:string[];visual_only:boolean;palette?: import("./memoryPalette").CategoryPalette}[];
  facts?: Groups;
  events?: Groups;
  activity_history?: Groups;
  category_definitions?: Record<string, { description?: string; label?: string; source_record_ids?: string[]; member_ids?: string[]; parent_id?: string|null; palette?: Record<string,unknown>; revision?:number }>;
  relationships_v3?: Record<string, RawRelation>;
  catalog_relationships?: RawRelation[];
  conflicts?: { id: string; record_id: string; status?: string; type?: string }[];
  pending_approvals?: Record<string, { id: string; record: RawRecord }>;
  entity_graph?: {
    connections?: Record<string, RawRelation & { state?: string; evidence_refs?: unknown[] }>;
    entities?: Record<string, { id: string; label?: string; category?: string; member_ids?: string[]; aliases?: string[] }>;
  };
}

// ---------- graph model ----------
/** category = a hub, entity = a relay node inside the globe, the rest are strings between nodes */
export type LinkKind = "category" | "entity" | "explicit" | "semantic" | "session" | "catalog";

export interface GraphCategory { id: string; label: string; description: string; count: number; totalCount?: number; palette?: import('./memoryPalette').CategoryPalette }
export interface GraphMemory {
  displayCategory?: string;
  id: string;
  category: string;
  label: string;
  text: string;
  kind: "fact" | "event" | "activity";
  created: number;
  updated: number;
  confidence: number;
  revision: number;
  source: string;
  sessionId: string;
  conflict: boolean; // had a value conflict at some point
  pending: boolean;  // waiting for approval, or has an unresolved conflict
  derived: boolean;  // auto-derived summary/trace, not a direct user fact
  date?: string;     // original date for derived traces
}
export interface GraphEntity { id: string; label: string; category: string; members: string[] }
/** a and b are node ids: a memory id, `cat:<categoryId>` or `ent:<entityId>` */
export interface GraphLink { a: string; b: string; kind: LinkKind; weight: number; reason: string }
export interface GraphData {
  layout?: import('./globeEngine').PreparedLayout;
  categories: GraphCategory[];
  memories: GraphMemory[];
  entities: GraphEntity[];
  links: GraphLink[];
}

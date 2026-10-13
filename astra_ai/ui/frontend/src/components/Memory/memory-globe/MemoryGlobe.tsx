// MemoryGlobe.tsx — React wrapper. Needs globeEngine.ts, memoryAdapter.ts, memoryTypes.ts next to it.
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { GlobeEngine, type GlobeStats, type HoverInfo, type SelectionInfo, type GlobeOptions } from "./globeEngine";
import type { GraphData, RawRecord } from "./memoryTypes";
import StructuredMemory from '../StructuredMemory.jsx';
import { MEMORY_BASES } from "./memoryPalette";
import {readMemoryCamera,rememberMemoryCamera} from "./memoryView";

export interface MemoryGlobeProps {
  /** Output of buildGraph(rawJson). The globe re-lays out whenever this changes. */
  data: GraphData | null;
  hideDetails?:boolean;
  /** Receive the engine to push live memories (addMemory) or show recall (recall). */
  onReady?: (engine: GlobeEngine|null) => void;
  onAction?: (action:string,id:string,value?:unknown,revision?:number)=>Promise<void>;
  onSelection?: (selection: SelectionInfo | null) => void;
  detail?: RawRecord | null;
  detailLoading?: boolean;
  detailError?: string;
  options?: Pick<GlobeOptions,"flows"|"idlePulses"|"maxMemories">;
  /** "obsidian" (default): black, fine grey wires, pink dots. "glass": blue links and a faint shell. */
  theme?: "obsidian" | "glass";
  /** Faint decorative dust inside the globe. It is not data. Default: glass only. */
  ambient?: boolean;
  className?: string;
  style?: CSSProperties;
}

const KIND_LABEL: Record<string, string> = {
  category: "Same category", entity: "Same entity", explicit: "Explicit link",
  semantic: "Similar content", session: "Same session", catalog: "Related category",
};
const KIND_COLOR: Record<string, string> = {
  category: "var(--widget-text, #DCD7CE)", entity: MEMORY_BASES.violet, explicit: MEMORY_BASES.pink, semantic: MEMORY_BASES.blue, session: MEMORY_BASES.pink, catalog: MEMORY_BASES.red,
};

const box: CSSProperties = {
  position: "relative", width: "100%", height: "100%", minHeight: 320, overflow: "hidden", color: "#eee",
  background: "var(--widget-surface)",
  font: "12px system-ui, -apple-system, 'Segoe UI', sans-serif",
};
const canvasCss: CSSProperties = { position: "absolute", inset: 0, width: "100%", height: "100%", touchAction: "none", cursor: "grab" };
const tipCss: CSSProperties = {
  position: "absolute", pointerEvents: "none", background: "var(--widget-surface)", border: "1px solid var(--widget-border, #6664)",
  borderRadius: 5, padding: "4px 8px", whiteSpace: "nowrap", maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis",
};
const statCss: CSSProperties = { position: "absolute", left: 10, bottom: 8, color: "#7d7d7d", pointerEvents: "none" };
const panelCss: CSSProperties = {
  position: "absolute", top: 94, right: 22, maxHeight:"calc(100% - 180px)", width: "min(340px, 88vw)", overflow: "auto",
  background: "var(--widget-surface)", color: "var(--widget-text, inherit)", border: "1px solid var(--widget-border, #6664)", borderRadius: 20, padding: 20, lineHeight: 1.45,
};

export default function MemoryGlobe({ data, onReady, theme = "obsidian", ambient, className, style, options, onSelection, onAction, detail, detailLoading, detailError,hideDetails }: MemoryGlobeProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GlobeEngine | null>(null);
  const previousGraph=useRef<GraphData|null>(null);
  const selectionRef = useRef<SelectionInfo | null>(null), callbackRef = useRef(onSelection); callbackRef.current = onSelection;
  const [unavailable,setUnavailable]=useState(false);
  const [hover, setHover] = useState<HoverInfo | null>(null);
  const [linkLimit,setLinkLimit]=useState(40),[editing,setEditing]=useState(false),[draft,setDraft]=useState(""),[saving,setSaving]=useState(false),[actionError,setActionError]=useState("");
  const [sel, setSel] = useState<SelectionInfo | null>(null);
  useEffect(()=>{setLinkLimit(40);setEditing(false);setActionError("");},[sel?.id]);
  const [stats, setStats] = useState<GlobeStats>({ memories: 0, categories: 0, links: 0 });

  useEffect(() => {
    const canvas = canvasRef.current, host = boxRef.current;
    if (!canvas || !host) return;
    let engine:GlobeEngine;
    try { engine = new GlobeEngine(canvas, { theme, ambient, ...options, onHover: setHover, onSelect: value => { selectionRef.current=value; setSel(value); callbackRef.current?.(value); }, onStats: value => { setStats(value); canvas.dataset.globeMemories=String(value.memories); canvas.dataset.globeLinks=String(value.links); } }); } catch { setUnavailable(true); return; }
    engineRef.current = engine;
    const camera=readMemoryCamera();if(camera)engine.restoreCamera(camera);
    const saveCamera=()=>rememberMemoryCamera(engine.getCamera());
    window.addEventListener("pagehide",saveCamera);
    const ro = new ResizeObserver(() => engine.resize());
    ro.observe(host);
    const appearance = () => engine.refreshAppearance();
    window.addEventListener("themechange", appearance);
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") engine.clearSelection(true); };
    window.addEventListener("keydown", onKey);
    return () => { saveCamera();window.removeEventListener("pagehide",saveCamera);window.removeEventListener("keydown", onKey); window.removeEventListener("themechange", appearance); ro.disconnect(); engine.destroy(); engineRef.current = null;onReady?.(null); };
    // the engine is created once; `theme` and `ambient` are read at mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!data || !engineRef.current) return;
    const selected=selectionRef.current?.id;
    const previous=previousGraph.current;engineRef.current.setData(data);
    if(previous){const oldNodes=new Set([...previous.memories.map(m=>m.id),...previous.categories.map(c=>'cat:'+c.id)]),oldLinks=new Set(previous.links.map(l=>l.kind+'|'+l.a+'|'+l.b));engineRef.current.committed([...data.memories.map(m=>m.id),...data.categories.map(c=>'cat:'+c.id)].filter(id=>!oldNodes.has(id)),data.links.filter(l=>!oldLinks.has(l.kind+'|'+l.a+'|'+l.b)&&l.kind!=='semantic'));}
    previousGraph.current=data;
    onReady?.(engineRef.current);
    if(selected) engineRef.current.select(selected); else engineRef.current.clearSelection(true);
  }, [data]);

  async function act(action:string){
    if(!sel||!detail||!onAction)return;setSaving(true);setActionError("");
    try{const original=detail.value??detail.content;const value=action==="update"&&typeof original!=="string"?JSON.parse(draft):draft;await onAction(action,sel.id,value,detail.revision);setEditing(false);}catch{setActionError("Change could not be saved. Refresh this memory and try again.");}finally{setSaving(false);}
  }
  return (
    <div ref={boxRef} className={className} style={{ ...box, ...style }}>
      {unavailable && <p role="status" style={{position:"absolute",top:80,left:20}}>The memory canvas is unavailable. Your memory library and conversation history remain available.</p>}
      <canvas className="memory-globe-canvas" ref={canvasRef} style={canvasCss} aria-label="Memory globe" />
      {hover && !sel && <div className="memory-globe-hover" style={{ ...tipCss, maxWidth: "calc(100% - 16px)", left: Math.max(8,Math.min(hover.x+14,(boxRef.current?.clientWidth||640)-Math.min(320,hover.text.length*7+20)-8)), top: Math.max(8,Math.min(hover.y+14,(boxRef.current?.clientHeight||480)-36)) }}>{hover.text}</div>}
      <div className="memory-globe-stats" style={statCss}>{stats.memories.toLocaleString()} memories · {stats.categories} categories · {stats.links.toLocaleString()} connections</div>
      {sel && !hideDetails && (
        <aside className="memory-globe-detail" style={panelCss}>
          <button onClick={() => engineRef.current?.clearSelection(true)} aria-label="Close"
            style={{ float: "right", background: "none", border: 0, color: "#aaa", cursor: "pointer", fontSize: 16 }}>×</button>
          <div style={{ color: "var(--widget-text, inherit)", opacity: .7 }}>{sel.type === "category" ? "Category" : sel.categoryLabel}</div>
          <h3 style={{ margin: "2px 0 8px", fontSize: 15, fontWeight: 600 }}>{sel.title}</h3>
          {sel.flags.map((f) => <span key={f} style={{ display: "inline-block", marginRight: 6, padding: "1px 7px", border: "1px solid #6a5a2a", color: "#ffbe50", borderRadius: 10 }}>{f}</span>)}
          <StructuredMemory raw={false} value={detailLoading && sel.type === "memory" ? "Loading full memory…" : detail && detail.id === sel.id ? (detail.value ?? detail.content) : sel.text}/>
          {detail&&detail.id===sel.id&&onAction&&<div className="memory-globe-actions">
            {editing?<><textarea aria-label="Correct memory" value={draft} onChange={e=>setDraft(e.target.value)}/><button disabled={saving} onClick={()=>act("update")}>Save correction</button><button disabled={saving} onClick={()=>setEditing(false)}>Cancel</button></>:<>{(detail.attributes?.transcript||detail.kind!=="activity")&&<button onClick={()=>{const value=detail.value??detail.content;setDraft(typeof value==="string"?value:JSON.stringify(value,null,2));setEditing(true);}}>Correct</button>}<button className="memory-forget-button" title="Hide from recall and the globe; restore from Forgotten memories." disabled={saving} onClick={()=>act("forget")}>Forget this memory</button></>}
            {actionError&&<p role="alert">{actionError}</p>}
          </div>}
          {detailError && <p role="status">{detailError}</p>}
          {detail && detail.id === sel.id && <details className="memory-detail-disclosure"><summary>Sources and history</summary><StructuredMemory raw={false} value={{revision:detail.revision,created:detail.created,updated:detail.updated,...(detail.provenance?{provenance:detail.provenance}:{}),...(detail.evidence_refs?.length?{evidence:detail.evidence_refs}:{}),...(detail.history?.length?{history:detail.history}:{})}}/></details>}
          {sel.created ? <div style={{ color: "var(--widget-text, inherit)", opacity: .7 }}>{new Date(sel.created).toLocaleString()} · {sel.source} · {Math.round((sel.confidence ?? 1) * 100)}% confidence</div> : null}
          <details className="memory-detail-disclosure" key={sel.id}><summary>Connections <span>{sel.links.length}</span></summary>
          {sel.links.slice(0,linkLimit).map((l, i) => (
            <button key={l.id + i} onClick={() => engineRef.current?.select(l.id)}
              style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: 0, borderTop: "1px solid var(--widget-border, #6664)", padding: "7px 0", color: "inherit", cursor: "pointer", font: "inherit" }}>
              <span style={{ color: KIND_COLOR[l.kind] }}>● {KIND_LABEL[l.kind]}</span> · {l.title}
              <div style={{ color: "#7d7d7d" }}>{l.reason}</div>
            </button>
          ))}
          {sel.links.length>linkLimit&&<button onClick={()=>setLinkLimit(v=>v+40)}>Show more connections ({sel.links.length-linkLimit} remaining)</button>}
          </details>
        </aside>
      )}
    </div>
  );
}

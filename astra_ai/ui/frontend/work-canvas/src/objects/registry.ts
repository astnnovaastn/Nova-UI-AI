/** Public, inert result contracts. HTML, scripts and model-supplied component names are never rendered. */
export const OBJECT_KINDS=['answer','document','report','note','draft','code','diff','test','image','video','audio','table','comparison','chart','timeline','calendar','checklist','decision','diagram','knowledge-graph','task','source'] as const;
export type ObjectKind=typeof OBJECT_KINDS[number];
export type WorkspaceObject={
 id:string;kind:ObjectKind;title:string;revision:number;task_id?:string;status:string;
 body?:string;language?:string;url?:string;caption?:string;
 columns?:string[];rows?:string[][];
 columnKinds?:('text'|'number'|'money'|'percent'|'date'|'duration'|'yes_no'|'rating'|'link'|'entity'|'tag')[];
 chartKind?:'bars'|'line'|'area';orientation?:'horizontal'|'vertical';
 
 entries?:{id:string;label:string;detail?:string;value?:number;unit?:string;start?:number;end?:number;date?:string;when?:string;done?:boolean}[];
 nodes?:{id:string;label:string;detail?:string;group?:string;nodeKind?:string;vendor?:string}[];
 edges?:{id:string;source:string;target:string;label?:string}[];
 sources:{id:string;title:string;url?:string}[];
};
const text=(v:unknown,max=Infinity)=>typeof v==='string'?v.slice(0,max):'';
export function safeUrl(value:unknown):string|undefined {try{const u=new URL(String(value));return ['http:','https:'].includes(u.protocol)&&!u.username&&!u.password?u.href:undefined;}catch{return undefined;}}
export function parseObject(value:unknown):WorkspaceObject|null {
 if(!value||typeof value!=='object')return null;const v=value as Record<string,unknown>;
 if(!text(v.id,200)||!OBJECT_KINDS.includes(v.kind as ObjectKind)||!text(v.title,300))return null;
 const arr=(v:unknown)=>Array.isArray(v)?v:[];
 const object:WorkspaceObject={id:text(v.id,200),kind:v.kind as ObjectKind,title:text(v.title,300),revision:Number.isInteger(v.revision)?Number(v.revision):1,status:text(v.status,40)||'recorded',task_id:text(v.task_id,200),body:text(v.body),language:text(v.language,40),url:safeUrl(v.url),caption:text(v.caption,1000),sources:arr(v.sources).filter(s=>s&&typeof s==='object').map(s=>({id:text(s.id,200),title:text(s.title,300),url:safeUrl(s.url)}))};
 if(['bars','line','area'].includes(String(v.chartKind)))object.chartKind=v.chartKind as WorkspaceObject['chartKind'];
 if(['horizontal','vertical'].includes(String(v.orientation)))object.orientation=v.orientation as WorkspaceObject['orientation'];
 if(v.columnKinds)object.columnKinds=arr(v.columnKinds).map(k=>['text','number','money','percent','date','duration','yes_no','rating','link','entity','tag'].includes(k)?k:'text');
 if(v.columns)object.columns=arr(v.columns).map(c=>text(c));
 if(v.rows)object.rows=arr(v.rows).filter(Array.isArray).map(r=>r.map(c=>text(c)));
 if(v.entries)object.entries=arr(v.entries).filter(e=>e&&typeof e==='object').map(e=>({id:text(e.id,200),label:text(e.label,500),detail:text(e.detail,4000),...(typeof e.value==='number'&&Number.isFinite(e.value)?{value:e.value}:{}),unit:text(e.unit,80),date:/^\d{4}-\d{2}-\d{2}$/.test(e.date)?e.date:undefined,when:text(e.when,100),...(typeof e.start==='number'&&Number.isFinite(e.start)?{start:e.start}:{}),...(typeof e.end==='number'&&Number.isFinite(e.end)?{end:e.end}:{}),...(typeof e.done==='boolean'?{done:e.done}:{})}));
 if(v.nodes)object.nodes=arr(v.nodes).filter(n=>n&&typeof n==='object').map(n=>({id:text(n.id,200),label:text(n.label,300),detail:text(n.detail,2000),group:text(n.group,200),nodeKind:text(n.nodeKind,80),vendor:typeof n.vendor==='string'&&/^[a-z0-9.-]+$/i.test(n.vendor)?n.vendor:undefined}));
 if(v.edges){const ids=new Set(object.nodes?.map(n=>n.id));object.edges=arr(v.edges).filter(e=>e&&ids.has(e.source)&&ids.has(e.target)).map(e=>({id:text(e.id,200),source:text(e.source,200),target:text(e.target,200),label:text(e.label,500)}));}
 return object;
}
export function objectSize(o:WorkspaceObject){
 const lines=(o.body||'').split('\n').length,entries=o.entries?.length||0;
 if(['diagram','knowledge-graph'].includes(o.kind))return {width:Math.min(1120,Math.max(760,(o.nodes?.length||0)*150)),height:Math.min(720,Math.max(320,180+Math.ceil((o.nodes?.length||0)/4)*100))};
 if(o.kind==='answer')return {width:640,height:Math.min(620,Math.max(240,140+Math.ceil((o.body?.length||0)/70)*24+(entries?96:0)))};
 if(['document','report','note'].includes(o.kind))return {width:640,height:Math.min(760,Math.max(300,160+Math.ceil((o.body?.length||0)/65)*24))};
 if(['table','comparison'].includes(o.kind))return {width:Math.min(1120,Math.max(640,(o.columns?.length||0)*160)),height:Math.min(640,160+Math.min(o.rows?.length||0,10)*44)};
 if(['code','diff','test'].includes(o.kind))return {width:640,height:Math.min(600,Math.max(200,90+lines*24))};
 if(o.kind==='calendar')return {width:904,height:720};
 if(['timeline','calendar','checklist','task','decision'].includes(o.kind))return {width:480,height:Math.min(640,Math.max(240,110+entries*76))};
 if(o.kind==='chart')return {width:640,height:Math.min(520,160+entries*46)};
 if(['image','video','source'].includes(o.kind))return {width:404,height:312};
 return {width:380,height:320};
}
export function objectItems(values:unknown[]=[]){return values.map(value=>{
 const parsed=parseObject(value);if(parsed)return parsed;
 if(!value||typeof value!=='object')return null;
 const v=value as Record<string,unknown>;
 if(!text(v.id,200)||!text(v.title,300))return null;
 return {id:text(v.id,200),kind:'note',title:text(v.title,300),revision:1,status:'unsupported',body:'This result type is not supported in this version: '+text(v.kind,80)+'. Its original record is unchanged.',sources:[]} as WorkspaceObject;
 }).filter((o):o is WorkspaceObject=>!!o).map(o=>({id:'object:'+o.id,type:'adaptive',kind:o.kind,title:o.title,detail:o.caption||'',status:o.status,orders:true,designer:true,size:objectSize(o),aegisObject:o}));}

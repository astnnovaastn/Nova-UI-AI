import {admittedPreset,type AdaptiveFields} from './adaptive-catalog';
/** Public, inert result contracts. HTML, scripts and model-supplied component names are never rendered. */
export const OBJECT_KINDS=['answer','document','report','note','draft','code','diff','test','image','video','audio','table','comparison','chart','timeline','calendar','checklist','decision','diagram','knowledge-graph','task','source','zephium'] as const;
/** V29: a typed Zephium artifact; `data` is that kind's exact Zephium wire data. */
export const ZEPHIUM_KINDS=['reply','picks','plan','list','sheet','plot','diagram','code','diff','document','draft','media','subject','project','page'] as const;
export type ZephiumKind=typeof ZEPHIUM_KINDS[number];
export type ObjectKind=typeof OBJECT_KINDS[number];
export type WorkspaceObject=AdaptiveFields & {
 id:string;kind:ObjectKind;title:string;revision:number;task_id?:string;status:string;
 /** V29: the Zephium kind of a `zephium` object, and its wire data (URLs sanitized, nothing else changed). */
 zkind?:ZephiumKind;data?:Record<string,unknown>;
 /** V29: the helper that made it (worker_a..), or the lead. */
 part?:string;
 recommendations?:{id:string;title:string;subtitle?:string;url?:string;image?:string;recommended:boolean;why?:string;imageRegion?:{x:number;y:number;width:number;height:number};facts:{label:string;value:string}[]}[];
 recommendationKind?:'article'|'video'|'course';
 planTotal?:{label:string;value:string};
 planMode?:'calendar'|'schedule';
 requestActivity?:{state:string;steps:{id:string;kind:'search'|'ask'|'page'|'live';title:string;detail?:string}[];made:{id:string;title:string;kind:'reply'|'plan'|'sheet'|'diagram'}[]};
 body?:string;language?:string;url?:string;caption?:string;
 columns?:string[];rows?:string[][];
 columnKinds?:('text'|'number'|'money'|'percent'|'date'|'duration'|'yes_no'|'rating'|'link'|'entity'|'tag')[];
 diagramDirection?:"right"|"down";
 metricPanels?:{id:string;title:string;subtitle?:string;values:{id:string;label:string;value?:number;display:string;highlight?:boolean}[]}[];
 chartKind?:'bars'|'line'|'area';orientation?:'horizontal'|'vertical';
 
 entries?:{id:string;label:string;detail?:string;value?:number;unit?:string;start?:number;end?:number;date?:string;when?:string;done?:boolean;stepKind?:'task'|'milestone'|'event'|'note'|'travel'|'stay';cost?:string;place?:string}[];
 nodes?:{id:string;label:string;detail?:string;group?:string;nodeKind?:string;vendor?:string}[];
 edges?:{id:string;source:string;target:string;label?:string}[];
 sources:{id:string;title:string;url?:string}[];
};
const text=(v:unknown,max=Infinity)=>typeof v==='string'?v.slice(0,max):'';
export function safeUrl(value:unknown):string|undefined {try{const u=new URL(String(value));return ['http:','https:'].includes(u.protocol)&&!u.username&&!u.password?u.href:undefined;}catch{return undefined;}}
/** Keys whose values are addresses: only http(s) ones are kept. */
const URL_KEYS=new Set(['url','poster','image','src','href','target_url','thumbnail','favicon','link','image_url']);
/** Zephium's own media-store references: AEGIS has no such store, so they never reach the canvas. */
const DROPPED_KEYS=new Set(['record_media','__proto__','constructor','prototype']);
/** Zephium wire data as sent, bounded, with every address checked; the kind is the object's own. */
export function sanitizeData(value:unknown,depth=0):unknown{
 if(depth>10)return undefined;
 if(typeof value==='string')return value.slice(0,20000);
 if(typeof value==='number')return Number.isFinite(value)?value:null;
 if(value===null||typeof value==='boolean')return value;
 if(Array.isArray(value))return value.slice(0,500).map(item=>sanitizeData(item,depth+1)).filter(item=>item!==undefined);
 if(typeof value!=='object')return undefined;
 const out:Record<string,unknown>={};
 for(const [key,item] of Object.entries(value as Record<string,unknown>).slice(0,200)){
  if(DROPPED_KEYS.has(key)||(depth===0&&key==='kind'))continue;
  if(key==='image_candidates'){out[key]=(Array.isArray(item)?item:[]).map(safeUrl).filter((u):u is string=>!!u).slice(0,3);continue;}
  if(URL_KEYS.has(key)&&typeof item==='string'){const u=safeUrl(item);if(u)out[key]=u;continue;}
  const clean=sanitizeData(item,depth+1);if(clean!==undefined)out[key]=clean;
 }
 return out;
}
/** What each Zephium kind's renderer reads unguarded: a missing list is empty, a missing text blank. */
const ZEPHIUM_SHAPE:Partial<Record<ZephiumKind,{lists?:string[];texts?:string[]}>>={
 reply:{lists:['figures','points'],texts:['headline','text']},picks:{lists:['items'],texts:['facet']},plan:{lists:['steps']},list:{lists:['items'],texts:['style']},
 sheet:{lists:['columns','rows']},plot:{lists:['series']},diagram:{lists:['nodes','edges','layers']},code:{lists:['notes'],texts:['language','text']},
 diff:{lists:['hunks'],texts:['path','language','summary']},document:{lists:['paragraphs']},draft:{texts:['destination','body']},media:{texts:['medium','url']},
 subject:{lists:['people','facts','labels'],texts:['noun','title']},project:{lists:['stack','tree','scripts'],texts:['name','summary','root']},page:{texts:['url','title']},
};
/** A reply's points are plain sentences in Zephium; a {label,text} point reads as "Label: text". */
export function replyPoints(value:unknown):string[]{
 return (Array.isArray(value)?value:[]).map(p=>typeof p==='string'?p:p&&typeof p==='object'?[(p as any).label,(p as any).text??(p as any).value].filter(x=>typeof x==='string'&&x).join(': '):'').filter(p=>p).slice(0,12);
}
function zephiumData(zkind:ZephiumKind,raw:unknown):Record<string,unknown>{
 const data=(sanitizeData(raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{})??{}) as Record<string,unknown>;
 const shape=ZEPHIUM_SHAPE[zkind]??{};
 for(const key of shape.lists??[])if(!Array.isArray(data[key]))data[key]=[];
 for(const key of shape.texts??[])if(typeof data[key]!=='string')data[key]='';
 if(zkind==='picks')data.items=(data.items as unknown[]).filter(i=>i&&typeof i==='object'&&typeof (i as any).name==='string').map(i=>({...(i as object),facts:Array.isArray((i as any).facts)?(i as any).facts:[],tags:Array.isArray((i as any).tags)?(i as any).tags:[]}));
 if(zkind==='reply')data.points=replyPoints(data.points);
 if(zkind==='media'&&!data.medium)data.medium='image';
 if(zkind==='draft'&&!data.destination)data.destination='message';
 return data;
}
function region(v:any){if(!v||![v.x,v.y,v.width,v.height].every(n=>typeof n==='number'&&Number.isFinite(n))||v.x<0||v.y<0||v.width<=0||v.height<=0||v.x+v.width>1||v.y+v.height>1)return undefined;return {x:v.x,y:v.y,width:v.width,height:v.height};}
export function parseObject(value:unknown):WorkspaceObject|null {
 if(!value||typeof value!=='object')return null;const v=value as Record<string,unknown>;
 if(v.contract_version===26&&!admittedPreset(String(v.family),String(v.preset)))return null;
 if(!text(v.id,200)||!OBJECT_KINDS.includes(v.kind as ObjectKind)||!text(v.title,300))return null;
 const arr=(v:unknown)=>Array.isArray(v)?v:[];
 const object:WorkspaceObject={id:text(v.id,200),kind:v.kind as ObjectKind,title:text(v.title,300),revision:Number.isInteger(v.revision)?Number(v.revision):1,status:text(v.status,40)||'recorded',task_id:text(v.task_id,200),body:text(v.body),language:text(v.language,40),url:safeUrl(v.url),caption:text(v.caption,1000),sources:arr(v.sources).filter(s=>s&&typeof s==='object').map(s=>({id:text(s.id,200),title:text(s.title,300),url:safeUrl(s.url)}))};
 if(typeof v.part==='string'&&/^(worker_[a-z]|lead)$/.test(v.part))object.part=v.part;
 if(v.kind==='zephium'){
  if(!ZEPHIUM_KINDS.includes(v.zkind as ZephiumKind))return null;
  object.zkind=v.zkind as ZephiumKind;object.data=zephiumData(object.zkind,v.data);
  return object;
 }
 // A legacy object may carry the Zephium fields it knows (reply points, plan checkable, code notes,
 // draft destination, sheet column metadata) as `data`; the wire then uses them instead of defaults.
 if(v.data&&typeof v.data==='object'&&!Array.isArray(v.data))object.data=sanitizeData(v.data) as Record<string,unknown>;
 if(['article','video','course'].includes(String(v.recommendationKind)))object.recommendationKind=v.recommendationKind as WorkspaceObject['recommendationKind'];
 if(Array.isArray(v.recommendations))object.recommendations=v.recommendations.slice(0,v.contract_version===26?10000:24).filter(p=>p&&typeof p==='object'&&text(p.title,300)).map(p=>({id:text(p.id,200),title:text(p.title,300),subtitle:text(p.subtitle,500),url:safeUrl(p.url),image:safeUrl(p.image),recommended:p.recommended===true,why:text(p.why,3000),imageRegion:region(p.imageRegion),facts:arr(p.facts).slice(0,12).filter(f=>f&&typeof f==='object').map(f=>({label:text(f.label,100),value:text(f.value,500)}))}));
 if(v.planMode==='calendar'||v.planMode==='schedule')object.planMode=v.planMode;
 if(v.requestActivity&&typeof v.requestActivity==='object'){const a=v.requestActivity as Record<string,unknown>;object.requestActivity={state:text(a.state,80),steps:arr(a.steps).slice(0,100).filter(e=>e&&['search','ask','page','live'].includes(e.kind)).map(e=>({id:text(e.id,100),kind:e.kind,title:text(e.title,500),detail:text(e.detail,1500)})),made:arr(a.made).slice(0,100).filter(e=>e&&['reply','plan','sheet','diagram'].includes(e.kind)).map(e=>({id:text(e.id,100),title:text(e.title,300),kind:e.kind}))};}
 if(v.planTotal&&typeof v.planTotal==='object'){const t=v.planTotal as Record<string,unknown>;object.planTotal={label:text(t.label,80),value:text(t.value,200)};}
 if(['bars','line','area'].includes(String(v.chartKind)))object.chartKind=v.chartKind as WorkspaceObject['chartKind'];
 if(['horizontal','vertical'].includes(String(v.orientation)))object.orientation=v.orientation as WorkspaceObject['orientation'];
 if(v.diagramDirection==='right'||v.diagramDirection==='down')object.diagramDirection=v.diagramDirection;
 if(Array.isArray(v.metricPanels))object.metricPanels=v.metricPanels.slice(0,6).filter(p=>p&&typeof p==='object').map(p=>({id:text(p.id,100),title:text(p.title,200),subtitle:text(p.subtitle,300),values:arr(p.values).slice(0,12).filter(e=>e&&typeof e==='object').map(e=>({id:text(e.id,100),label:text(e.label,200),display:text(e.display,100),highlight:e.highlight===true,...(typeof e.value==='number'&&Number.isFinite(e.value)&&e.value>=0?{value:e.value}:{})}))}));
 if(v.columnKinds)object.columnKinds=arr(v.columnKinds).map(k=>['text','number','money','percent','date','duration','yes_no','rating','link','entity','tag'].includes(k)?k:'text');
 if(v.columns)object.columns=arr(v.columns).map(c=>text(c));
 if(v.rows)object.rows=arr(v.rows).filter(Array.isArray).map(r=>r.map(c=>c===null?'Unknown':typeof c==='number'||typeof c==='boolean'?String(c):text(c)));
 if(v.entries)object.entries=arr(v.entries).filter(e=>e&&typeof e==='object').map(e=>({id:text(e.id,200),label:text(e.label,500),detail:text(e.detail,4000),stepKind:['task','milestone','event','note','travel','stay'].includes(e.stepKind)?e.stepKind:undefined,cost:text(e.cost,150),place:text(e.place,200),...(typeof e.value==='number'&&Number.isFinite(e.value)?{value:e.value}:{}),unit:text(e.unit,80),date:/^\d{4}-\d{2}-\d{2}$/.test(e.date)?e.date:undefined,when:text(e.when,100),...(typeof e.start==='number'&&Number.isFinite(e.start)?{start:e.start}:{}),...(typeof e.end==='number'&&Number.isFinite(e.end)?{end:e.end}:{}),...(typeof e.done==='boolean'?{done:e.done}:{})}));
 if(v.nodes)object.nodes=arr(v.nodes).filter(n=>n&&typeof n==='object').map(n=>({id:text(n.id,200),label:text(n.label,300),detail:text(n.detail,2000),group:text(n.group,200),nodeKind:text(n.nodeKind,80),vendor:typeof n.vendor==='string'&&/^[a-z0-9.-]+$/i.test(n.vendor)?n.vendor:undefined}));
 if(v.edges){const ids=new Set(object.nodes?.map(n=>n.id));object.edges=arr(v.edges).filter(e=>e&&ids.has(e.source)&&ids.has(e.target)).map(e=>({id:text(e.id,200),source:text(e.source,200),target:text(e.target,200),label:text(e.label,500)}));}
 if(v.contract_version===26){
  object.contract_version=26;object.family=String(v.family);object.preset=String(v.preset);
  object.blocks=arr(v.blocks).filter(b=>b&&['paragraph','heading','quote','bullets','figure','image'].includes(b.kind)).map(b=>({id:text(b.id,200),kind:b.kind,text:text(b.text),label:text(b.label),value:text(b.value),url:safeUrl(b.url),items:arr(b.items).map(i=>text(i))}));
  object.media=arr(v.media).filter(m=>m&&safeUrl(m.url)).map(m=>({id:text(m.id,200),kind:['image','video','source'].includes(m.kind)?m.kind:'source',url:safeUrl(m.url)!,thumbnail:safeUrl(m.thumbnail),title:text(m.title),caption:text(m.caption)}));
  object.provenance=arr(v.provenance).filter(p=>p&&['sourced','supplied','calculated','proposal','unknown'].includes(p.basis)).map(p=>({path:text(p.path),basis:p.basis,source_ids:arr(p.source_ids).map(i=>text(i)),calculation:text(p.calculation)}));
  object.row_ids=arr(v.row_ids).map(i=>text(i));
  object.series=arr(v.series).filter(s=>s&&Array.isArray(s.points)).map(s=>({id:text(s.id),name:text(s.name),unit:text(s.unit),points:s.points.map(p=>({id:text(p.id),x:text(p.x),y:typeof p.y==='number'&&Number.isFinite(p.y)?p.y:null}))}));
 }
 return object;
}
export function objectSize(o:WorkspaceObject){
 if(o.requestActivity)return {width:640,height:240};
 if(o.contract_version===26)return {width:['diagram','table','comparison','calendar'].includes(o.kind)?1120:760,height:o.kind==='diagram'?720:Math.min(860,Math.max(360,240+(o.blocks?.length||0)*60+(o.media?.length?260:0)))};
 const lines=(o.body||'').split('\n').length,entries=o.entries?.length||0;
 if(o.recommendations?.length){const height=Math.max(...o.recommendations.map(p=>100+(p.image?180:0)+Math.ceil(p.title.length/28)*24+(p.subtitle?40:0)+p.facts.reduce((h,f)=>h+Math.max(1,Math.ceil(f.value.length/22))*24+8,0)+Math.ceil((p.why?.length||0)/32)*23));return {width:Math.min(4,o.recommendations.length)*320+Math.max(0,Math.min(4,o.recommendations.length)-1)*16,height:Math.ceil(o.recommendations.length/4)*(height+50)};}
 if(o.kind==='timeline'&&o.planMode==='schedule')return {width:1100,height:660};
 if(o.kind==='timeline')return {width:560,height:110+(o.entries||[]).reduce((h,e)=>h+60+Math.ceil((e.detail?.length||0)/62)*20,0)+(o.planTotal?80:0)};
 if(o.kind==='diagram'&&!o.edges?.length&&o.nodes?.length)return {width:Math.min(1800,Math.max(900,new Set(o.nodes.map(n=>n.group)).size*280+80)),height:680};
 if(o.kind==='diagram'&&o.diagramDirection==='down')return {width:800,height:560};
 if(['diagram','knowledge-graph'].includes(o.kind))return {width:Math.min(1120,Math.max(760,(o.nodes?.length||0)*150)),height:Math.min(720,Math.max(320,180+Math.ceil((o.nodes?.length||0)/4)*100))};
 if(o.kind==='answer')return {width:640,height:Math.min(620,Math.max(240,140+Math.ceil((o.body?.length||0)/70)*24+(entries?96:0)))};
 if(['document','report','note'].includes(o.kind))return {width:640,height:Math.min(760,Math.max(300,160+Math.ceil((o.body?.length||0)/65)*24))};
 if(['table','comparison'].includes(o.kind))return {width:Math.min(1120,Math.max(640,(o.columns?.length||0)*160)),height:190+Math.min(o.rows?.length||0,8)*52};
 if(['code','diff','test'].includes(o.kind))return {width:640,height:Math.min(600,Math.max(200,90+lines*24))};
 if(o.kind==='calendar')return {width:904,height:720};
 if(['timeline','calendar','checklist','task','decision'].includes(o.kind))return {width:480,height:Math.min(640,Math.max(240,110+entries*76))};
 if(o.kind==='chart'&&o.metricPanels?.length)return {width:800,height:420};
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

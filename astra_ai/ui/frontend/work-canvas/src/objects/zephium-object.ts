/** AEGIS data -> original Zephium Work object contracts (MPL-2.0). */
import type {ObjectView} from '$features/work/lib/board/types';
import type {WorkspaceObject} from './registry';
/** Keep unified diff line offsets; file headers are metadata, never added/deleted code. */
function diffHunks(body:string){
 const hunks:{oldStart:number;newStart:number;lines:{op:'add'|'del'|'ctx';text:string}[]}[]=[];
 let current:typeof hunks[number]|undefined;
 const unified=/^@@ -\d+/m.test(body);
 for(const line of body.split('\n')){
  const header=/^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(line);
  if(header){current={oldStart:Number(header[1]),newStart:Number(header[2]),lines:[]};hunks.push(current);continue;}
  if(unified&&!current)continue;
  if(line.startsWith('diff --git ')){current=undefined;continue;}
  if(!current&&(line.startsWith('--- ')||line.startsWith('+++ ')))continue;
  if(line.startsWith('\\ No newline'))continue;
  if(!current){if(unified)continue;current={oldStart:1,newStart:1,lines:[]};hunks.push(current);}
  if(unified&&!/^[ +\-]/.test(line))continue;
  current.lines.push({op:line.startsWith('+')?'add':line.startsWith('-')?'del':'ctx',text:/^[ +\-]/.test(line)?line.slice(1):line});
 }
 return hunks;
}
export function zephiumObject(o:WorkspaceObject):ObjectView|null {
 const base={id:o.id,title:o.title,state:o.status==='pending'?'pending' as const:'ready' as const};
 switch(o.kind){
  case 'answer': return {...base,kind:'reply',headline:o.title,text:o.body||o.caption||'',figures:(o.entries||[]).filter(e=>e.value!==undefined).map(e=>({label:e.label,value:String(e.value),note:e.unit})),points:[]};
  case 'document': case 'report': case 'note': return {...base,kind:'document',content:{kind:'document',paragraphs:[o.body||'']}};
  case 'code': case 'test': return {...base,kind:'code',language:o.language||'text',text:o.body||'',notes:[]};
  case 'diff': return {...base,kind:'diff',path:o.title,language:o.language||'text',summary:o.caption||'',hunks:diffHunks(o.body||'')};
  case 'chart': return {...base,kind:'plot',spec:{kind:o.chartKind||'bars',horizontal:o.orientation==='vertical'?false:o.orientation==='horizontal'?true:undefined,series:[{name:o.title,points:(o.entries||[]).map(e=>({x:e.label,y:e.value??null,display:e.value===undefined?'Not recorded':String(e.value)+(e.unit?' '+e.unit:'')}))}],basis:o.caption}};
  case 'diagram': case 'knowledge-graph': return {...base,kind:'diagram',diagram:{kind:'diagram',nodes:(o.nodes||[]).map(n=>({id:n.id,name:n.label,kind:n.nodeKind||'component',vendor:n.vendor,note:n.detail,layer:n.group})),edges:(o.edges||[]).map(e=>({from:e.source,to:e.target,label:e.label})),layers:[...new Set((o.nodes||[]).map(n=>n.group).filter((g):g is string=>!!g))].map(id=>({id,name:id}))}};
  case 'table': case 'comparison': return {...base,kind:'sheet',columns:(o.columns||[]).map((label,i)=>({label,kind:o.columnKinds?.[i]||(o.kind==='comparison'&&i===0?'entity':'text')})),rows:(o.rows||[]).map(cells=>({cells})),note:o.caption};
  case 'checklist': case 'decision': case 'task': return {...base,kind:'list',style:o.kind==='decision'?'questions':'todo',items:(o.entries||[]).map(e=>({title:e.label,detail:e.detail,done:e.done}))};
  case 'timeline': case 'calendar': return {...base,kind:'plan',calendar:o.kind==='calendar',checkable:false,steps:(o.entries||[]).map(e=>({title:e.label,detail:e.detail,kind:'milestone',done:e.done,...(e.date?{date:e.date,when:e.when||e.date}:e.start!==undefined&&Math.abs(e.start)<1e11?{when:e.when||new Date(e.start*60000).toLocaleString(),date:new Date(e.start*60000).toISOString().slice(0,10)}:{when:e.when||'Undated'})}))};
  case 'image': case 'video': case 'audio': return o.url?{...base,kind:'media',media:o.kind,url:o.url,...(o.kind==='image'?{picture:{src:o.url}}:{})}:null;
  case 'draft': return {...base,kind:'draft',destination:'message',body:o.body||'',send:'draft'};
  default:return null;
 }
}

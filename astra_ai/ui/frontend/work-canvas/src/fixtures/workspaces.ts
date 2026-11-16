import {FAMILIES,type FamilyId} from '../designer/families';
import {objectItems,type WorkspaceObject,type ObjectKind} from '../objects/registry';
import {planLayout} from '../designer/planner';
import type {LayoutInput} from '../designer/types';

const profiles:Record<FamilyId,ObjectKind[]>={
 'focused-answer':['source','answer'], 'parallel-investigation':['task','task','task','report'],
 'branching-research':['task','source','source','note'],'evidence-convergence':['source','source','note','report'],
 'architecture-atlas':['code','diagram','document'],'dependency-explorer':['code','diagram','note'],
 'source-collections':['source','source','source'],'comparison-desk':['comparison','chart','answer'],
 'timeline-milestones':['timeline','checklist','note'],'execution-board':['task','task','checklist'],
 'daily-schedule':['calendar','checklist','note'],'research-publication':['source','note','report','table'],
 'visual-moodboard':['image','image','note'],'ui-teardown':['image','note','checklist'],
 'debugging-workbench':['code','diff','test','answer'],'decision-workspace':['decision','comparison','answer'],
 'knowledge-constellation':['note','diagram','source'],'document-production':['document','note','report'],
 'market-landscape':['comparison','chart','source'],'mixed-result':['answer','diagram','table','image'],
 'claim-review':['note','source','comparison'],'code-walkthrough':['code','answer','diagram'],
 'change-review':['diff','note','test'],'priority-inbox':['note','draft','checklist'],
 'trip-budget':['image','comparison','timeline','chart'],
};
const body='The workspace follows the evidence available to this task. Each result keeps its original context and can be inspected without leaving the canvas.\n\nThis is a local simulation. No provider, account or external action was used.';
const titles:Partial<Record<ObjectKind,string>>={answer:'A clearer path from evidence to a useful result',report:'Research findings and next steps',code:'Request routing · source reference',diff:'Proposed change · review before applying',test:'Validation output · simulated',comparison:'Compare the options that matter',diagram:'System architecture',calendar:'A focused working day',timeline:'From preparation to delivery',image:'Visual reference',draft:'Reply for your review',checklist:'Before the next step',chart:'Recorded comparison',source:'Source preview · fixture',note:'Evidence and observations'};
export function workspaceFixture(family:FamilyId,count=8,scenario='complete') {
 const label=FAMILIES.find(f=>f[0]===family)![1],kinds=profiles[family];
 const objects:WorkspaceObject[]=Array.from({length:Math.max(2,Math.min(100,count))},(_,i)=>{
  const kind=kinds[i%kinds.length];return {id:'fixture-'+i,kind,title:titles[kind]||label,revision:1,status:scenario==='failure'&&i===1?'failed':'simulation',task_id:'task-'+i,
   body:kind==='code'?'export async function loadContext(runId: string) {\n  const cached = cache.get(runId);\n  if (cached) return cached;\n  return await repository.read(runId);\n}':kind==='diff'?'@@ context loader @@\n- await fetchEveryPage();\n+ renderFirstPage();\n+ await loadRemainingPages();':kind==='test'?'LOCAL FIXTURE — not an executed test\n✓ Cached context\n✓ Stable source identities\n○ External provider check unavailable':body,
   ...(kind==='image'?{url:(typeof location!=='undefined'?location.origin:'http://127.0.0.1:5187')+'/fixtures/v20/reference.png',caption:'Supplied design reference · local fixture, not a generated webpage capture'}:{}),
   ...(kind==='source'?{caption:'Cached source metadata. No live browser is opened.'}:{}),
   columns:['Option','Configured in','Runs as','Checks from','Alerts'],columnKinds:['entity','text','text','text','yes_no'],rows:[['Uptime Kuma','Its web UI','One container','Your server','yes'],['Gatus','One YAML file','One container','Your server','yes'],['OpenStatus','Its dashboard','Several services','Hosted regions','yes']],
   orientation:i%2?'vertical':'horizontal',chartKind:'bars',
   entries:[{id:'a',label:'Prepare the context',detail:'Review the source material',start:29913600+i*120,done:true,value:32,unit:'units'},{id:'b',label:'Compare and verify',detail:'Keep assumptions explicit',start:29913720+i*120,value:58,unit:'units'},{id:'c',label:'Review the result',detail:'No external action is taken',start:29913840+i*120,value:44,unit:'units'}],
   nodes:[{id:'input',label:'Task instruction',detail:'The supplied request',group:'Task and environment',nodeKind:'input'},{id:'plan',label:'Plan and context',detail:'Registered capabilities',group:'Intelligence',nodeKind:'model'},{id:'result',label:'Recorded result',detail:'Validated data',group:'Execution',nodeKind:'output'}],edges:[{id:'p',source:'input',target:'plan',label:'Context'},{id:'r',source:'plan',target:'result',label:'Result'}],sources:[{id:'fixture-source',title:'Local fixture · synthetic content'}]};
 });
 const items=objectItems(objects),edges=items.slice(1).map((item,i)=>({id:'fixture-edge-'+i,source:items[family==='parallel-investigation'?0:i].id,target:item.id}));
 const input:LayoutInput={strategy:family,workflow:FAMILIES.find(f=>f[0]===family)![3].split(',')[0],width:1440,height:900,viewport:{x:0,y:0,zoom:1},edges,nodes:items.map((item,i)=>({id:item.id,title:item.title,type:'adaptive',objectKind:item.aegisObject.kind,group:family==='claim-review'?['Supporting','Conflicting','Unresolved'][i%3]:'Group '+(i%3),role:'Lane '+(i%3),status:i%3===0?'running':i%3===1?'done':'queued',start:['calendar','timeline'].includes(item.aegisObject.kind)?item.aegisObject.entries?.[0]?.start:undefined,x:0,y:0,...item.size}))};
 const plan=planLayout(input);
 const links=edges.map(e=>({...e,kind:'flow',strand:{label:'Recorded fixture relationship',status:'complete',relations:[{id:e.id,type:'delivers',source:e.source,target:e.target,status:'complete',detail:{fixture:true}}]}}));
 return {label,objects,items,links,input,plan};
}

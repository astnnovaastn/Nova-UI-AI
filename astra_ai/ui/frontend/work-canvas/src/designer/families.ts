import type {LayoutInput, LayoutNode} from './types';

/** Composition vocabulary, not pixel templates. No provider calls or camera dependencies. */
export const FAMILIES = [
 ['focused-answer','Focused answer','Read a supported answer','quick-research,meeting-prep'],
 ['parallel-investigation','Parallel investigation','Follow independent work',''],
 ['branching-research','Branching research','Explore related questions',''],
 ['evidence-convergence','Evidence convergence','Trace evidence into conclusions',''],
 ['architecture-atlas','Architecture atlas','Explore a system and its modules','map-a-project'],
 ['dependency-explorer','Dependency explorer','Trace dependencies and cycles',''],
 ['source-collections','Source collections','Inspect related pages',''],
 ['comparison-desk','Comparison desk','Compare like-for-like evidence','pricing-research,investor-list'],
 ['timeline-milestones','Timeline and milestones','Follow dated work','campaign-plan,learning-path'],
 ['execution-board','Execution board','See progress and blockers','weekly-status'],
 ['daily-schedule','Daily schedule','Resolve priorities and time conflicts','plan-my-day'],
 ['research-publication','Research publication','Read findings with their evidence','deep-research'],
 ['visual-moodboard','Visual moodboard','Choose a visual direction','moodboard'],
 ['ui-teardown','Annotated UI teardown','Inspect findings in context','ui-teardown'],
 ['debugging-workbench','Debugging workbench','Follow reproduction, fix and validation','fix-a-bug'],
 ['decision-workspace','Decision workspace','Compare choices and assumptions',''],
 ['knowledge-constellation','Knowledge constellation','Explore supported relationships','knowledge-map'],
 ['document-production','Document production','Review sections and revisions',''],
 ['market-landscape','Market landscape','Explore evidence-backed segments','market-map,competitor-landscape'],
 ['mixed-result','Mixed-result workspace','Read coordinated result types','exam-prep'],
 ['claim-review','Claim and contradiction review','Inspect support, conflict and gaps',''],
 ['code-walkthrough','Code walkthrough','Read code with its explanation','explain-code'],
 ['change-review','Change-review studio','Review changed lines and findings','review-a-change'],
 ['priority-inbox','Priority inbox','Review messages, actions and drafts','inbox-triage'],
 ['trip-budget','Trip and budget planner','Compare options and an itinerary',''],
] as const;
export type FamilyId = typeof FAMILIES[number][0];
export const isFamily = (id:string): id is FamilyId => FAMILIES.some(f=>f[0]===id);
export const familyForWorkflow = (workflow='') => FAMILIES.find(f=>f[3].split(',').includes(workflow))?.[0];
const kind=(n:LayoutNode)=>n.objectKind||n.type;
const matches=(n:LayoutNode,re:RegExp)=>re.test(kind(n));
const content=(n:LayoutNode)=>matches(n,/answer|report|paper|document|result/);
const group=(ns:LayoutNode[],key:(n:LayoutNode)=>string)=>{
 const m=new Map<string,LayoutNode[]>();for(const n of ns){const k=key(n);m.set(k,[...(m.get(k)||[]),n]);}
 return [...m].sort(([a],[b])=>a.localeCompare(b));
};

export function selectFamily(input:LayoutInput):FamilyId {
 if(input.previousFamily&&isFamily(input.previousFamily))return input.previousFamily;
 if(input.preferredFamily&&isFamily(input.preferredFamily))return input.preferredFamily;
 const workflow=familyForWorkflow(input.workflow);if(workflow)return workflow;
 const ns=input.nodes;
 if(ns.some(n=>matches(n,/diff/)))return 'change-review';
 if(ns.some(n=>matches(n,/code/)))return 'code-walkthrough';
 if(ns.some(n=>matches(n,/calendar/)))return 'daily-schedule';
 if(ns.some(n=>matches(n,/diagram|map/)))return 'architecture-atlas';
 if(ns.filter(n=>matches(n,/agent|task/)).length>=3)return 'parallel-investigation';
 return ns.length<=6?'focused-answer':'research-publication';
}

/** Output is subsequently constrained by the existing collision/pin/parent planner. */
export function familyPositions(input:LayoutInput,ns:LayoutNode[],rank:Map<string,number>,id:FamilyId) {
 const positions:Record<string,{x:number;y:number}>={};const gap=80;
 const put=(n:LayoutNode,x:number,y:number)=>positions[n.id]={x:Math.round(x/20)*20,y:Math.round(y/20)*20};
 const extent=(xs:LayoutNode[])=>({w:Math.max(0,...xs.map(n=>(positions[n.id]?.x||0)+n.width)),h:Math.max(0,...xs.map(n=>(positions[n.id]?.y||0)+n.height))});
 const column=(xs:LayoutNode[],x=0,y=0)=>{for(const n of xs){put(n,x,y);y+=n.height+gap;}return y;};
 const row=(xs:LayoutNode[],x=0,y=0)=>{for(const n of xs){put(n,x,y);x+=n.width+gap;}return x;};
 const tiles=(xs:LayoutNode[],x=0,y=0,cols=2)=>{
  const widths=Array(cols).fill(0),heights=Array(cols).fill(y);
  xs.forEach((n,i)=>widths[i%cols]=Math.max(widths[i%cols],n.width));
  xs.forEach((n,i)=>{const c=i%cols;put(n,x+widths.slice(0,c).reduce((s,w)=>s+w+gap,0),heights[c]);heights[c]+=n.height+gap;});
 };
 const bands=(key:(n:LayoutNode)=>string,horizontal=true)=>{let advance=0;for(const [,xs] of group(ns,key)){if(horizontal){column(xs,advance);advance+=Math.max(...xs.map(n=>n.width))+gap*2;}else{row(xs,0,advance);advance+=Math.max(...xs.map(n=>n.height))+gap*2;}}};
 const ordered=[...ns].sort((a,b)=>(rank.get(a.id)||0)-(rank.get(b.id)||0)||a.id.localeCompare(b.id));
 const results=ns.filter(content),support=ns.filter(n=>!content(n));
 const reading=(main:LayoutNode[],side:LayoutNode[],left=true)=>{
  tiles(side,0,0,side.length>5?2:1);const right=extent(side).w+gap;
  column(main,right,0);
  if(!left){const width=extent(main).w-right+gap;for(const n of side)positions[n.id].x+=width;for(const n of main)positions[n.id].x-=right;}
 };
 switch(id){
  case 'focused-answer': column(support);column(results,extent(support).w+160);break;
  case 'parallel-investigation': bands(n=>n.role||n.group||kind(n),false);break;
  case 'branching-research': bands(n=>String(rank.get(n.id)||0).padStart(5,'0'));for(const [,xs] of group(ns,n=>String(rank.get(n.id)||0))){const h=extent(xs).h;for(const n of xs)positions[n.id].y-=Math.round(h/40)*20;}break;
  case 'evidence-convergence': tiles(support,0,0,Math.max(1,Math.min(3,Math.ceil(Math.sqrt(support.length)))));column(results,extent(support).w+160,Math.max(0,extent(support).h/2-(results[0]?.height||0)/2));break;
  case 'architecture-atlas': bands(n=>String(rank.get(n.id)||0).padStart(5,'0'),false);break;
  case 'dependency-explorer': bands(n=>String(rank.get(n.id)||0).padStart(5,'0'));break;
  case 'source-collections':{let x=0;for(const [,xs] of group(ns,n=>n.group||kind(n))){tiles(xs,x,0,2);x=extent(xs).w+160;}break;}
  case 'comparison-desk': bands(n=>n.group||kind(n));break;
  case 'timeline-milestones': case 'daily-schedule':{
   const dated=ns.filter(n=>Number.isFinite(n.start)),undated=ns.filter(n=>!Number.isFinite(n.start));
   const origin=Math.min(...dated.map(n=>n.start!));
   const lanes=group(dated,n=>n.group||n.role||'Schedule');let x=0;
   // Time units are minutes. Labels show true dates; geometry is compressed for long spans.
   const range=Math.max(1,...dated.map(n=>n.start!-origin)),scale=Math.min(4,1800/range);
   for(const [,xs] of lanes){
    const width=Math.max(...xs.map(n=>n.width)),bottom:number[]=[];
    for(const n of [...xs].sort((a,b)=>a.start!-b.start!||a.id.localeCompare(b.id))){
     const y=Math.round((n.start!-origin)*scale/20)*20;
     let track=bottom.findIndex(end=>end<=y);
     if(track<0)track=bottom.length;
     put(n,x+track*(width+gap),y);bottom[track]=y+n.height+gap;
    }
    x+=bottom.length*(width+gap)+gap;
   }
   column(undated,x+gap);break;
  }
  case 'execution-board':bands(n=>(({queued:'1 Ready',running:'2 Working',blocked:'3 Blocked',failed:'3 Blocked',done:'4 Complete'} as Record<string,string>)[n.status||'queued']||'1 Ready'));break;
  case 'research-publication':reading(results,support);break;
  case 'visual-moodboard':tiles(ns,0,0,Math.max(1,Math.min(4,Math.ceil(Math.sqrt(ns.length)))));break;
  case 'ui-teardown':{const shots=ns.filter(n=>matches(n,/image|source|part/));column(shots);column(ns.filter(n=>!shots.includes(n)),extent(shots).w+gap,40);break;}
  case 'debugging-workbench':{const logs=ns.filter(n=>matches(n,/log|test/));row(ordered.filter(n=>!logs.includes(n)));row(logs,0,extent(ns.filter(n=>!logs.includes(n))).h+gap);break;}
  case 'decision-workspace':{const root=ordered[0];if(root){put(root,0,0);const rest=ordered.slice(1);column(rest,root.width+160,-Math.max(0,rest.reduce((s,n)=>s+n.height+gap,0)/2-root.height/2));}break;}
  case 'knowledge-constellation':{let x=0;for(const [,xs] of group(ns,n=>n.group||'Concepts')){tiles(xs,x,0,Math.ceil(Math.sqrt(xs.length)));x=extent(xs).w+160;}break;}
  case 'document-production':bands(n=>n.role||n.status||kind(n));break;
  case 'market-landscape':bands(n=>n.group||'Unclassified',false);break;
  case 'mixed-result':{const lead=results[0];if(lead)put(lead,0,0);tiles(ns.filter(n=>n!==lead),0,lead?lead.height+gap:0,3);break;}
  case 'claim-review':bands(n=>n.role||n.group||'Unclassified evidence');break;
  case 'code-walkthrough':{const code=ns.filter(n=>matches(n,/code/));reading(code,ns.filter(n=>!code.includes(n)),false);break;}
  case 'change-review':{const diff=ns.filter(n=>matches(n,/diff/));reading(diff,ns.filter(n=>!diff.includes(n)),false);break;}
  case 'priority-inbox':{const drafts=ns.filter(n=>matches(n,/draft|document/));column(ns.filter(n=>!drafts.includes(n)));column(drafts,extent(ns.filter(n=>!drafts.includes(n))).w+gap);break;}
  case 'trip-budget':{const itinerary=ns.filter(n=>matches(n,/timeline|calendar|report/));tiles(ns.filter(n=>!itinerary.includes(n)),0,0,3);column(itinerary,extent(ns.filter(n=>!itinerary.includes(n))).w+gap);break;}
 }
 return positions;
}

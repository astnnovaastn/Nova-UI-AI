import {FAMILIES} from '../designer/families';
import {workspaceFixture} from './workspaces';
import {referenceFixture} from './references';
import {learningFixture} from './learning';
import {presentationFixture,presentationObjects,placedObjects} from './presentations';
import type {WorkspaceObject} from '../objects/registry';
const kinds=['answer','report','document','note','draft','code','diff','test','image','table','comparison','chart','timeline','calendar','checklist','decision','diagram','task','source'] as const;
const names=['Supported answer','Research report','Document','Evidence note','Message draft','Code panel','Change diff','Test and log output','Image','Data table','Option comparison','Bar chart','Milestone timeline','Monthly calendar','Checklist','Decision list','Architecture diagram','Task summary','Source preview'];
export const CATALOG=[
 ...FAMILIES.map(([id,label,description])=>({id:'layout:'+id,label,description,group:'Workspace layouts'})),
 ...kinds.map((kind,i)=>({id:'card:'+kind,label:names[i],description:'Individual '+names[i].toLowerCase()+' presentation',group:'Core cards'})),
 ...[
 ['anchor','Visual anchor','Image recommendation with Top pick and aligned facts'],['market','Market map','Categorized companies with no connecting lines'],['table','Company directory','Eight-row preview with the full table on Open'],['campaign','Calendar and detailed plan','Dated milestones, costs and budget envelope'],['activity','Request activity','Recorded actions, answers and expandable steps'],
 ['reading','Core readings','Text recommendation with level, format and focus'],['watch','Watch first','Video recommendation opening the miniature browser'],['learning','Learning path','Twelve full milestones with pace and Tasks action'],['metrics','Resource comparison','Three panels with values and unknown states'],['fits','How it fits','Top-to-bottom monitoring diagram'],['architecture','Interactive architecture','Node details and highlighted relationships'],['video-stack','Sliding video stack','Individually selectable videos and native browsing'],['source-stack','Sliding source stack','Cached page previews and individual selection'],['questions','Clarification conversation','Options, free text and recorded answers'],['editorial-set','Editorial direction','Transparent answer paired with a visual anchor'],['market-set','Market overview','Figures, directory and category map'],['campaign-set','Campaign workspace','Calendar plan with request history'],['multi-picks','Recommendation collection','Multiple image recommendations in one result'],['vertical-chart','Vertical bars','Same recorded data with vertical orientation'],['line-chart','Line chart','Recorded observations shown over an ordered sequence']
 ].map(([id,label,description])=>({id,label,description,group:'Reference presentations'}))
];
export function catalogFixture(id:string){
 if(id.startsWith('layout:')){const family=FAMILIES.find(f=>'layout:'+f[0]===id);if(family)return workspaceFixture(family[0],5);}
 if(id.startsWith('card:')||id==='vertical-chart'||id==='line-chart'){
  const kind=id.startsWith('card:')?id.slice(5):'chart';
  for(const [family] of FAMILIES){const object=workspaceFixture(family,8).objects.find(o=>o.kind===kind);if(object)return placedObjects([{...object,...(id==='vertical-chart'?{orientation:'vertical' as const}:id==='line-chart'?{chartKind:'line' as const}:{} )}]);}
 }
 if(['reading','watch','learning'].includes(id)){const ix=['reading','watch','learning'].indexOf(id);return placedObjects([learningFixture().objects[ix]]);}
 if(['metrics','fits','architecture'].includes(id)){return placedObjects([referenceFixture().objects[['metrics','fits','architecture'].indexOf(id)]]);}
 if(id==='video-stack'){const ref=referenceFixture(3),item=ref.items.at(-1);return {...ref,items:[item],objects:[],plan:{geometry:{positions:{[item.id]:{x:40,y:40}},sizes:{[item.id]:item.size},constraints:{}}}};}
 if(id.endsWith('-set'))return presentationFixture(id.slice(0,-4));
 const all=presentationObjects();
 if(id==='multi-picks'){const first=all.anchor.recommendations![0];return placedObjects([{...all.anchor,title:'Visual references',recommendations:[first,{...first,id:'reference-2',title:'Type and hierarchy',recommended:false,why:'A second detail view of the supplied reference; not a separately researched source.'},{...first,id:'reference-3',title:'Image and atmosphere',recommended:false,why:'A third detail view of the same source, grouped for design review.'}]}]);}
 return placedObjects([all[id]||all.anchor]);
}

import {CARD_FAMILIES} from '../objects/adaptive-catalog';
import {placedObjects} from './presentations';
import {parseObject,type WorkspaceObject} from '../objects/registry';
export function adaptiveExample(familyId='answer',presetId='',count=8){
 const family=CARD_FAMILIES.find(f=>f.id===familyId)||CARD_FAMILIES[0];
 const preset=family.presets.find(p=>p.id===presetId&&p.available)||family.presets[0];
 const entries=Array.from({length:count},(_,i)=>({id:'item-'+i,label:['Collect evidence','Compare alternatives','Review findings','Record the decision'][i%4]+' '+(i+1),detail:'Supplied fixture observation. This is a proposed step, not an executed action.',value:i%5===0?undefined:(i+1)*7,unit:'ms',date:'2026-11-'+String(1+i%28).padStart(2,'0'),stepKind:i%3?'task':'milestone',done:false}));
 const media=Array.from({length:Math.min(count,3)},(_,i)=>({id:'media-'+i,kind:family.kind==='video'?'video':family.kind==='image'?'image':'source',url:family.kind==='video'?'https://www.youtube.com/watch?v=QbSarcWspvw':'https://example.com/reference/'+i,title:'Supplied reference '+(i+1),caption:'Fixture reference; no research or account action.',thumbnail:family.kind==='image'?location.origin+'/fixtures/v25/visual-reference.png':undefined}));
 const o:any={contract_version:26,id:'adaptive-example',family:family.id,preset:preset.id,kind:family.kind,title:family.label+' · fixture',revision:1,status:family.id==='test'?'needs-review':'partial',
  body:['## What the supplied evidence shows','The same card can explain a project, summarize research or support a decision. Its contents come from the supplied data.','## What remains uncertain','Missing evidence stays explicit. The current values are deterministic fixture measurements, not live research.'].join('\n\n'),
  caption:'Isolated fixture · no AI or search calls',sources:[{id:'S1',title:'Supplied fixture record',url:'https://example.com/evidence'}],
  blocks:[{id:'metric-a',kind:'figure',label:'Recorded items',value:String(count)},{id:'metric-b',kind:'figure',label:'Data origin',value:'Fixture'}],
  provenance:[{path:'/body',basis:'supplied',source_ids:['S1']}],media:family.id==='answer'?media.slice(0,1):[]};
 if(['timeline','calendar','checklist','decision','chart'].includes(family.id))o.entries=entries;
 if(family.id==='calendar')o.planMode='schedule';
 if(family.id==='chart'){o.chartKind='bars';o.orientation='horizontal';o.media=[];}
 if(['table','comparison'].includes(family.id)){o.columns=['Item','Category','Observed value'];o.columnKinds=['text','tag','number'];o.rows=entries.map((e,i)=>[e.label,'Group '+(i%3+1),e.value??null]);o.row_ids=entries.map(e=>e.id);}
 if(['diagram','category-map'].includes(family.id)){o.nodes=entries.map((e,i)=>({id:e.id,label:'Module '+(i+1),detail:e.detail,group:'Layer '+(i%3+1),nodeKind:'component'}));o.edges=family.id==='category-map'?[]:entries.slice(1).map((e,i)=>({id:'edge-'+i,source:entries[i].id,target:e.id,label:'supplied dependency'}));o.media=[];o.blocks=[];}
 if(family.id==='recommendation')o.recommendations=entries.map((e,i)=>({id:e.id,title:'Reference '+(i+1),subtitle:'A supplied resource',url:'https://example.com/resource/'+i,recommended:i===0,why:'Review this reference in the context of your task.',facts:[{label:'Basis',value:'Supplied fixture'},{label:'Purpose',value:'Cross-workflow example'}]}));
 if(['source','image','video'].includes(family.id)){o.media=media;o.url=media[0]?.url;o.blocks=[];}
 if(family.id==='code'){o.language='python';o.body='def summarize(records):\n    valid = [r for r in records if r.get("source_id")]\n    return {"count": len(valid), "records": valid}\n';}
 if(family.id==='diff'){o.language='python';o.body='--- a/summary.py\n+++ b/summary.py\n@@ -1,2 +1,2 @@\n def summarize(records):\n-    return len(records)\n+    return sum(bool(r.get("source_id")) for r in records)';}
 if(family.id==='test'){o.body='NOT EXECUTED — proposed validation\n\n1. Supply a record without a source.\n2. Verify it is marked unknown.\n3. Verify known records retain their evidence.';o.language='text';}
 if(family.id==='draft')o.body='Proposed message\n\nHere is the evidence collected so far. Two questions remain open. Please review the attached comparison before we decide.';
 return parseObject(o)!;
}
export function adaptiveFixture(familyId:string,presetId:string,count:number){return placedObjects([adaptiveExample(familyId,presetId,count)]);}

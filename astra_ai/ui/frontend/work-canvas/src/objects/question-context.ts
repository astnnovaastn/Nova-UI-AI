import type {WorkspaceObject} from './registry';
/** Public object facts for contextual Ask, including the inspected diagram part and its real neighbors. */
export function objectQuestionContext(object:WorkspaceObject,subject=object.title){
 const part=object.nodes?.find(n=>n.label===subject);
 const names=new Map(object.nodes?.map(n=>[n.id,n.label]));
 const edges=(object.edges||[]).filter(e=>!part||e.source===part.id||e.target===part.id);
 const facts=part?[part.label,part.detail||'',...edges.map(e=>`${names.get(e.source)} → ${names.get(e.target)}${e.label?' · '+e.label:''}`)]:[
 object.body||object.caption||'',...(object.recommendations||[]).flatMap(p=>[p.title,p.subtitle||'',...p.facts.map(f=>f.label+': '+f.value),p.why||'']),...(object.entries||[]).map(e=>e.label+': '+(e.detail||'')),...(object.nodes||[]).map(n=>n.label+(n.detail?' · '+n.detail:'')),...edges.map(e=>`${names.get(e.source)} → ${names.get(e.target)}${e.label?' · '+e.label:''}`),
 ...(object.metricPanels||[]).flatMap(p=>[p.title,...p.values.map(v=>v.label+': '+(v.display||'Not recorded'))])];
 return {id:object.id,kind:object.kind,title:subject,summary:facts.filter(Boolean).join('\n').slice(0,12000)};
}

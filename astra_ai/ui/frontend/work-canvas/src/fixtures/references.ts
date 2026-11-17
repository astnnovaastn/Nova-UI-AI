import {objectItems,type WorkspaceObject} from '../objects/registry';
import type {CollectedVideo} from '../collections';
export function referenceFixture(count=3){
 const base={revision:1,status:'simulation',sources:[{id:'reference',title:'Supplied reference · illustrative values, no live measurement'}]};
 const metrics:WorkspaceObject={...base,id:'metrics',kind:'chart',title:'What each takes to run',caption:'Reference values supplied in the screenshot · not a live infrastructure measurement.',metricPanels:[
 {id:'size',title:'Image to pull',subtitle:'Compressed, amd64',values:[{id:'kuma',label:'Uptime Kuma',value:617,display:'617 MB'},{id:'gatus',label:'Gatus',value:26,display:'26 MB',highlight:true},{id:'status',label:'OpenStatus',display:'Built from source'}]},
 {id:'containers',title:'Containers',subtitle:'To self-host',values:[{id:'kuma',label:'Uptime Kuma',value:1,display:'1'},{id:'gatus',label:'Gatus',value:1,display:'1',highlight:true},{id:'status',label:'OpenStatus',value:8,display:'8'}]},
 {id:'years',title:'In the open',subtitle:'Since the repo began',values:[{id:'kuma',label:'Uptime Kuma',value:5.3,display:'5.3 yrs'},{id:'gatus',label:'Gatus',value:7.1,display:'7.1 yrs',highlight:true},{id:'status',label:'OpenStatus',value:3.3,display:'3.3 yrs'}]}]};
 const diagram:WorkspaceObject={...base,id:'fits',kind:'diagram',title:'How it fits',diagramDirection:'down',nodes:[
 {id:'website',label:'zephium.app',detail:'Website and docs',group:'Watched',nodeKind:'service'},
 {id:'api',label:'api.zephium.app',detail:'Account API',group:'Watched',nodeKind:'service'},
 {id:'releases',label:'GitHub Releases',detail:'Update manifest',group:'Watched',nodeKind:'service',vendor:'github.com'},
 {id:'monitor',label:'Gatus',detail:'Every 30 seconds',group:'Monitor',nodeKind:'service'},
 {id:'status',label:'status.zephium.app',detail:'Public status page',group:'Reports',nodeKind:'service'},
 {id:'slack',label:'Slack',detail:'#all-zephium-dev',group:'Reports',nodeKind:'service',vendor:'slack.com'}],edges:[
 {id:'w',source:'website',target:'monitor',label:'GET /'},{id:'a',source:'api',target:'monitor',label:'/v1'},{id:'r',source:'releases',target:'monitor',label:'latest.json'},{id:'s',source:'monitor',target:'status',label:'Serves'},{id:'n',source:'monitor',target:'slack',label:'Alerts'}]};
 const architecture:WorkspaceObject={...base,id:'architecture',kind:'diagram',title:'Gemini Robotics: public architecture',nodes:[
 {id:'task',label:'Task instruction',detail:'Language goal; conceptual input',group:'Task and environment',nodeKind:'input'},
 {id:'vision',label:'Visual observations',group:'Task and environment',nodeKind:'input'},
 {id:'local',label:'Robotics On-Device 2',detail:'Local VLA variant; not an extra serial stage',group:'Gemini Robotics intelligence',nodeKind:'model'},
 {id:'er',label:'Gemini Robotics ER 2',detail:'World understanding and multi-step planning',group:'Gemini Robotics intelligence',nodeKind:'model'},
 {id:'vla',label:'Gemini Robotics 2.5',detail:'Vision-language-action robot control',group:'Gemini Robotics intelligence',nodeKind:'model'},
 {id:'hardware',label:'Robot hardware',group:'Physical execution',nodeKind:'component'},
 {id:'environment',label:'Physical environment',group:'Physical execution',nodeKind:'component'}],edges:[
 {id:'t',source:'task',target:'er',label:'Goal'},{id:'v',source:'vision',target:'er',label:'Scene context'},{id:'p',source:'er',target:'vla',label:'Plan → action'},{id:'e',source:'vision',target:'vla',label:'Visual feedback'},{id:'l',source:'local',target:'hardware',label:'Local VLA alternative'},{id:'h',source:'vla',target:'hardware',label:'Robot actions'},{id:'o',source:'hardware',target:'environment'}]};
 const objects=[metrics,diagram,architecture],items:any[]=objectItems(objects);
 const videos:CollectedVideo[]=Array.from({length:Math.max(1,Math.min(10,count))},(_,i)=>({id:'video-'+i,videoId:'QbSarcWspvw'.padEnd(11,'0'),url:'https://www.youtube.com/watch?v='+['QbSarcWspvw','dQw4w9WgXcQ','aqz-KE-bpKQ'][i%3],title:'Local video fixture '+(i+1),channel:'Playback test · source identity '+(i+1),provider:'fixture',thumbnail:location.origin+'/fixtures/v20/reference.png'}));
 items.push({id:'collection:videos',type:'collection',kind:'video',status:'complete',detail:'Local fixture videos',title:'Videos',orders:true,designer:true,size:{width:404,height:312},collection:{kind:'videos',researchId:'fixture',title:'Videos',state:'ready',note:'',images:[],videos}});
 const positions={'object:metrics':{x:40,y:40},'object:fits':{x:900,y:40},'object:architecture':{x:40,y:650},'collection:videos':{x:1300,y:660}};
 const sizes=Object.fromEntries(items.map(i=>[i.id,i.size]));
 return {label:'Reference presentations',objects,items,links:[],plan:{geometry:{positions,sizes,constraints:{},viewport:{x:0,y:0,zoom:1}}}};
}

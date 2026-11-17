import {describe,it,expect} from 'vitest';
import {youtubeVideoId,youtubeEmbed} from '../src/video-player';
import {parseObject,objectSize} from '../src/objects/registry';
import {zephiumObject} from '../src/objects/zephium-object';
import {objectQuestionContext} from '../src/objects/question-context';
describe('video player destinations',()=>{
 it('uses exact YouTube hosts and complete identifiers',()=>{
  for(const url of ['https://youtu.be/QbSarcWspvw','https://www.youtube.com/watch?v=QbSarcWspvw&list=test','https://youtube.com/shorts/QbSarcWspvw','https://www.youtube-nocookie.com/embed/QbSarcWspvw'])expect(youtubeVideoId(url)).toBe('QbSarcWspvw');
  for(const url of ['https://youtube.com.evil.test/watch?v=QbSarcWspvw','https://evil.test/embed/QbSarcWspvw','javascript:alert(1)','https://user:password@youtube.com/watch?v=QbSarcWspvw','https://youtu.be/QbSarcWspvwMORE','https://youtu.be/QbSarcWspvw/path'])expect(youtubeEmbed(url)).toBeNull();
 });
 it('constructs an inert destination for activation-time embedding',()=>expect(youtubeEmbed('https://youtu.be/QbSarcWspvw')).toBe('https://www.youtube-nocookie.com/embed/QbSarcWspvw?autoplay=1&playsinline=1&rel=0'));
});
describe('reference presentation contracts',()=>{
 it('preserves down direction and real edges through the original diagram adapter',()=>{
  const o=parseObject({id:'d',title:'How it fits',kind:'diagram',diagramDirection:'down',nodes:[{id:'a',label:'A'},{id:'b',label:'B'}],edges:[{id:'ab',source:'a',target:'b'},{id:'bad',source:'x',target:'b'}]})!;
  const view=zephiumObject(o);expect(view?.kind).toBe('diagram');if(view?.kind==='diagram'){expect(view.way).toBe('down');expect(view.diagram.edges).toHaveLength(1);}expect(objectSize(o)).toEqual({width:800,height:560});
 });
 it('keeps missing values unknown and bounds panel input',()=>{
  const o=parseObject({id:'c',title:'Resources',kind:'chart',metricPanels:Array.from({length:9},(_,i)=>({id:String(i),title:'Metric',values:[{id:'a',label:'Missing',value:NaN},{id:'b',label:'Invalid',value:-2},{id:'c',label:'Valid',value:26,highlight:true,display:'26 MB'}]}))})!;
  expect(o.metricPanels).toHaveLength(6);expect(o.metricPanels![0].values.map(v=>v.value)).toEqual([undefined,undefined,26]);expect(o.metricPanels![0].values[2].highlight).toBe(true);
 });
 it('contextual Ask includes the inspected part and real adjacent relationships',()=>{
  const object=parseObject({id:'g',kind:'diagram',title:'System',nodes:[{id:'a',label:'Input',detail:'Observed data'},{id:'b',label:'Model',detail:'Planning'},{id:'c',label:'Output'}],edges:[{id:'ab',source:'a',target:'b',label:'Context'},{id:'bc',source:'b',target:'c',label:'Actions'}]})!;
  const context=objectQuestionContext(object,'Model');expect(context.title).toBe('Model');expect(context.summary).toContain('Planning');expect(context.summary).toContain('Input → Model · Context');expect(context.summary).toContain('Model → Output · Actions');
 });
});

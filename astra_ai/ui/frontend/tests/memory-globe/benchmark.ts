/** Development-only performance fixture; excluded from the production entry. */
import {GlobeEngine} from '../../src/components/Memory/memory-globe/globeEngine';
if(!import.meta.env.DEV)throw Error('Development benchmark only');
const canvas=document.getElementById('globe') as HTMLCanvasElement;
const output=document.getElementById('result')!;
const engine=new GlobeEngine(canvas,{ambient:false,idlePulses:false,flows:false,maxMemories:Infinity,theme:'obsidian'});
const worker=new Worker(new URL('../../src/components/Memory/memory-globe/adapter.worker.ts',import.meta.url),{type:'module'});
let epoch=0,prepared=0,frames=0,started=0,last=0,paints:number[]=[],focusStart=0,focusLatency=0,size=0;
worker.onmessage=({data})=>{if(data.generation!==epoch)return;if(data.error){output.textContent=data.error;return;}prepared=performance.now()-started;engine.setData(data.graph);started=performance.now();last=started;frames=0;paints=[];tick(epoch);};
function tick(version:number){if(version!==epoch)return;frames++;const state=engine as any;paints.push(state.paintMs);if(focusStart&&!state.transition){focusLatency=performance.now()-focusStart;focusStart=0;}const elapsed=performance.now()-started;if(performance.now()-last>1000){const sorted=[...paints].sort((a,b)=>a-b);output.textContent=JSON.stringify({size,seconds:+(elapsed/1000).toFixed(1),fps:+(frames*1000/elapsed).toFixed(1),workerMs:+prepared.toFixed(1),paintP50:+(sorted[Math.floor(sorted.length*.5)]||0).toFixed(2),paintP95:+(sorted[Math.floor(sorted.length*.95)]||0).toFixed(2),focusMs:+focusLatency.toFixed(1),visibleDots:canvas.dataset.globeVisibleDots,quality:canvas.dataset.globeQuality});last=performance.now();}requestAnimationFrame(()=>tick(version));}
document.getElementById('run')!.onclick=()=>{size=Number((document.getElementById('size') as HTMLSelectElement).value);started=performance.now();epoch++;const facts:Record<string,Record<string,unknown>>={},category_definitions:Record<string,unknown>={};for(let c=0;c<40;c++){facts['fixture_'+c]={};category_definitions['fixture_'+c]={label:'Fixture category '+c};}for(let i=0;i<size;i++)facts['fixture_'+i%40]['r'+i]={id:'r'+i,category:'fixture_'+i%40,key:'Fixture '+i,value:'Synthetic datum '+i,created:'2026-01-01T00:00:00Z',source:'benchmark'};worker.postMessage({generation:epoch,raw:{facts,category_definitions}});output.textContent='Preparing synthetic graph in worker…';};
document.getElementById('focus')!.onclick=()=>{focusStart=performance.now();engine.view({action:'focus',id:'r1'});};
document.getElementById('overview')!.onclick=()=>engine.view({action:'reset'});
window.addEventListener('resize',()=>engine.resize());window.addEventListener('pagehide',()=>{worker.terminate();engine.destroy();});

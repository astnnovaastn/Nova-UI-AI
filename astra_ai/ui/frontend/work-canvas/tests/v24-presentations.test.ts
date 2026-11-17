import {describe,it,expect} from 'vitest';
import {parseObject,objectSize} from '../src/objects/registry';
import {zephiumObject} from '../src/objects/zephium-object';
import {clarificationPresentation} from '../src/clarifications';
import type {WorkRun} from '../src/work-run';
describe('V24 recommendation and plan projections',()=>{
 it('keeps evidence fields and blocks unsafe recommendation destinations',()=>{
  const o=parseObject({id:'book',kind:'comparison',title:'Read',recommendationKind:'article',recommendations:[{id:'b',title:'Book',url:'javascript:alert(1)',image:'file:///private',recommended:true,facts:[{label:'Level',value:'Beginner'}],why:'Read first'}]})!;
  expect(o.recommendations![0].url).toBeUndefined();expect(o.recommendations![0].image).toBeUndefined();
  const view=zephiumObject(o);expect(view?.kind).toBe('picks');if(view?.kind==='picks'){expect(view.items[0].facts[0].value).toBe('Beginner');expect(view.items[0].why).toBe('Read first');}
 });
 it('shows the complete undated learning sequence with its supplied pace',()=>{
  const o=parseObject({id:'p',kind:'timeline',title:'Learning',planTotal:{label:'Pace',value:'12 weeks'},entries:Array.from({length:12},(_,i)=>({id:String(i),label:'Week '+i,detail:'A meaningful recorded activity',when:'6 hours'}))})!;
  const view=zephiumObject(o);expect(objectSize(o).height).toBeGreaterThan(1000);if(view?.kind!=='plan')throw Error('Wrong renderer');expect(view.steps).toHaveLength(12);expect(view.steps[0].date).toBeUndefined();expect(view.steps[0].when).toBe('6 hours');expect(view.total?.value).toBe('12 weeks');
 });
});
describe('recorded clarification projection',()=>{
 const run=(request:any,state='needs_input',plan:any={})=>({request,state,plan,run_id:'r'} as WorkRun);
 it('restores answered turns and the next real question without inventing options',()=>{
  const p=clarificationPresentation(run({clarifications:[{id:'1',question:'Stage?',answer:'Seed'},{id:'2',question:'Focus?',options:['Tools','Models']}]},'needs_input',{clarification:'Focus?'}),[]);
  expect(p.exchange).toHaveLength(2);expect(p.exchange[0].answer).toBe('Seed');expect(p.question?.prompt).toBe('Focus?');expect(p.question?.options).toEqual(['Tools','Models']);
 });
 it('keeps historical questions readable and does not reopen a completed request',()=>{
  const p=clarificationPresentation(run({answer:'2026'},'completed'),[{seq:1,at:1,kind:'stage',stage:'question',question:'Which year?'}]);expect(p.question).toBeNull();expect(p.exchange[0].answer).toBe('2026');
 });
 it('does not fabricate history or suggested answers for legacy runs',()=>{
  expect(clarificationPresentation(null,[])).toEqual({question:null,exchange:[]});
  expect(clarificationPresentation(run({},'needs_input',{clarification:'Which scope?'}),[]).question?.options).toEqual([]);
 });
});

import {describe,it,expect} from 'vitest';
import {getSchema} from '@tiptap/core';
import {noteSchemaExtensions} from '../upstream/src/features/notes/lib/markdown/schema';
import {MarkdownDocument} from '../upstream/src/features/notes/lib/markdown/document';
import {zephiumObject} from '../src/objects/zephium-object';
import {parseObject} from '../src/objects/registry';
import {ROUTING_POLICY} from '../src/routing-plan';

describe('V21 durable upstream adapters',()=>{
 it('retains Markdown attachments, front matter and unknown blocks on an unchanged save',()=>{
  const markdown='---\ncategory: architecture\n---\n\n# Reference\n\n![Evidence](https://example.com/image.png)\n\n| A | B |\n| - | - |\n| 1 | 2 |\n\n<custom-block>preserve</custom-block>\n';
  const document=new MarkdownDocument(markdown),schema=getSchema(noteSchemaExtensions()),node=schema.nodeFromJSON(document.json);
  document.bind(node);expect(document.serialize(node)).toBe(markdown);
 });
 it('projects complete documents without shortening stored text',()=>{
  const body='Evidence and citations.\n'.repeat(10000);
  const object=parseObject({id:'report',kind:'report',title:'Full result',body})!;
  expect((zephiumObject(object) as any).content.paragraphs.join('')).toBe(body);
 });
 it('uses the actual diagram identities and dependency direction',()=>{
  const object=parseObject({id:'d',kind:'diagram',title:'System',nodes:[{id:'a',label:'Input',group:'Entry'},{id:'z',label:'Output',group:'Result'}],edges:[{id:'r',source:'z',target:'a',label:'Feedback'}]})!;
  const drawn=zephiumObject(object) as any;
  expect(drawn.diagram.edges).toEqual([{from:'z',to:'a',label:'Feedback'}]);
  expect(drawn.diagram.layers).toEqual([{id:'Entry',name:'Entry'},{id:'Result',name:'Result'}]);
 });
 it('retains every comparison row',()=>{
  const rows=Array.from({length:200},(_,i)=>[String(i),'Recorded evidence']);
  const object=parseObject({id:'t',kind:'comparison',title:'Options',columns:['ID','Evidence'],rows})!;
  expect((zephiumObject(object) as any).rows.map((r:any)=>r.cells)).toEqual(rows);
 });
 it('locks the production routing policy to visual card relays',()=>expect(ROUTING_POLICY).toBe('nearby-card-relay-v1'));
 it('retains real diff offsets and excludes unified file headers',()=>{
  const object=parseObject({id:'change',kind:'diff',title:'a.ts',body:'--- a/a.ts\n+++ b/a.ts\n@@ -40,2 +40,2 @@\n keep\n-old\n+new\n@@ -90 +92 @@\n-before\n+after\n'})!;
  expect((zephiumObject(object) as any).hunks).toEqual([
   {oldStart:40,newStart:40,lines:[{op:'ctx',text:'keep'},{op:'del',text:'old'},{op:'add',text:'new'}]},
   {oldStart:90,newStart:92,lines:[{op:'del',text:'before'},{op:'add',text:'after'}]},
  ]);
 });
});

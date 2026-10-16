import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

// Exercise the same pure decisions used by the React reader and real player.
const source = fs.readFileSync(new URL('../src/components/Research/ResearchWorkspace.tsx', import.meta.url), 'utf8');
const tree = ts.createSourceFile('research.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const names = ['citationParts', 'videoId', 'videoVolumeStep', 'previewPlacement', 'videoTimestamp'];
const selected = tree.statements.filter(n => ts.isFunctionDeclaration(n) && names.includes(n.name?.text)).map(n => n.getText(tree)).join('\n');
const context = { URL };
vm.createContext(context);
vm.runInContext(ts.transpileModule(selected, {compilerOptions:{target:ts.ScriptTarget.ES2020}}).outputText, context);
const plain = value => JSON.parse(JSON.stringify(value));
const sources = [{id:'S1',title:'First'},{id:'S2',title:'Second'}];

test('adjacent citations group in evidence order and repeated references deduplicate', () => {
  const parts=plain(context.citationParts('A supported claim [S2] [S1][S2].', sources));
  assert.deepEqual(parts, ['A supported claim ',[sources[1],sources[0]],'.']);
});
test('malformed or unknown citations remain visible instead of claiming support', () => {
  const parts=plain(context.citationParts('Unknown [S999]; mixed [S1][S999]; malformed [Sx].',sources));
  assert.equal(parts.filter(p=>typeof p==='string').join(''),'Unknown [S999]; mixed [S1][S999]; malformed [Sx].');
});
test('literal code, mathematical notation and quotation content remain exact', () => {
  const text='✨ example [S1] x² + y² = z² https://example.org/[S2]';
  assert.deepEqual(plain(context.citationParts(text,sources,true)),[text]);
  assert.equal(context.citationParts('✨ Findings',sources)[0],'Findings');
});
test('video routing accepts real YouTube forms and rejects lookalike hosts and malformed IDs', () => {
  for(const url of ['https://youtu.be/abcdefghijk','https://www.youtube.com/watch?v=abcdefghijk','https://youtube.com/shorts/abcdefghijk','https://youtube.com/embed/abcdefghijk'])assert.equal(context.videoId(url),'abcdefghijk');
  for(const url of ['https://youtube.com.attacker.invalid/watch?v=abcdefghijk','https://youtu.be/short','https://example.org/abcdefghijk'])assert.equal(context.videoId(url),null);
});
const idle={normal:null,manualOverride:false};
const speaking={talking:true,playing:true,muted:false,volume:80};
test('spoken turns duck to twenty percent once and restore the previous volume', () => {
  const down=context.videoVolumeStep(idle,speaking);
  assert.equal(down.setVolume,16);
  const steady=context.videoVolumeStep({normal:down.normal,manualOverride:false},{...speaking,volume:16});
  assert.equal(steady.setVolume,undefined);
  assert.equal(context.videoVolumeStep(steady,{...speaking,talking:false,volume:16}).setVolume,80);
});
test('native manual volume changes survive further speech events and restoration', () => {
  const state=context.videoVolumeStep({normal:80,manualOverride:false},{...speaking,volume:42});
  assert.equal(state.manualOverride,true);
  assert.equal(context.videoVolumeStep(state,{...speaking,volume:42}).setVolume,undefined);
  assert.equal(context.videoVolumeStep(state,{...speaking,talking:false,volume:42}).setVolume,undefined);
});
test('muted or paused video is not started or newly ducked by conversation', () => {
  assert.deepEqual(plain(context.videoVolumeStep(idle,{...speaking,muted:true})),idle);
  assert.deepEqual(plain(context.videoVolumeStep(idle,{...speaking,playing:false})),idle);
});

test('citation preview chooses measured space without obscuring its trigger',()=>{
 for(const t of [{left:200,right:280,top:50,bottom:72},{left:1100,right:1190,top:650,bottom:672},{left:400,right:480,top:330,bottom:352}]){
 const p=context.previewPlacement(t,332,240,1280,720);
 assert.ok(p.left>=12&&p.left+332<=1268&&p.top>=12&&p.top+240<=708);
 const overlap=p.left<t.right&&p.left+332>t.left&&p.top<t.bottom&&p.top+240>t.top;
 assert.equal(overlap,false);
 }
});

test('only supplied real timestamp parameters produce a seek destination',()=>{
 assert.equal(context.videoTimestamp('https://youtube.com/watch?v=abcdefghijk'),null);
 assert.equal(context.videoTimestamp('https://youtube.com/watch?v=abcdefghijk&t=3m45s'),225);
 assert.equal(context.videoTimestamp('https://youtu.be/abcdefghijk?t=252'),252);
 for(const t of ['-5','invented','100000000'])assert.equal(context.videoTimestamp('https://youtu.be/abcdefghijk?t='+t),null);
});

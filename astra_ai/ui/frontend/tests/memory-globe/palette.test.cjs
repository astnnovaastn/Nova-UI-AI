const test=require('node:test'),assert=require('node:assert/strict');
const {MEMORY_BASES,MEMORY_SHADES,mixOklch,categoryColorIndex,contrastShades}=require('./.compiled/memoryPalette.js');
const {memoryIsOpen,rememberMemoryOpen,readMemoryCamera,rememberMemoryCamera}=require('./.compiled/memoryView.js');
test('reload presentation keeps Memory and camera without saving record content or IDs',()=>{const data=new Map();global.localStorage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)};try{rememberMemoryOpen(true);assert.equal(memoryIsOpen(),true);rememberMemoryCamera({yaw:1,pitch:2,zoom:3,recordId:'must_not_store',content:'must_not_store'});assert.deepEqual(readMemoryCamera(),{yaw:1,pitch:2,zoom:3});assert.ok([...data.values()].every(v=>!v.includes('must_not_store')));rememberMemoryOpen(false);assert.equal(memoryIsOpen(),false);data.set('nova-memory-camera-v2','{"yaw":0,"pitch":0,"zoom":999}');assert.equal(readMemoryCamera(),null);}finally{delete global.localStorage;}});
test('supplied bases plus distinct yellow, orange and deep blue mixtures',()=>{assert.deepEqual(Object.values(MEMORY_BASES),['#5b8def','#8b95a7','#d9544f','#6fcf7f','#9b6bff','#ffb3c1','#8f1d2c','#5a3aa8','#F8E401','#C58D3D','#040273']);assert.equal(MEMORY_SHADES.length,99);assert.ok(MEMORY_SHADES.every(c=>/^#[a-f\d]{6}$/i.test(c)));assert.equal(mixOklch('#4C83B7','#916CB0',0).toLowerCase(),'#4c83b7');assert.equal(mixOklch('#4C83B7','#916CB0',1).toLowerCase(),'#916cb0');});
test('thousands of categories keep stable colors independently of order',()=>{const ids=Array.from({length:2400},(_,i)=>'category_'+i);const a=new Map(ids.map(id=>[id,categoryColorIndex(id)])),b=new Map(ids.reverse().map(id=>[id,categoryColorIndex(id)]));assert.ok([...a].every(([id,c])=>b.get(id)===c&&c>=0&&c<MEMORY_SHADES.length));assert.equal(categoryColorIndex('new#2026-10'),categoryColorIndex('new'));});
test('family metadata wins and malformed metadata stays bounded',()=>{assert.ok(categoryColorIndex('user_identity',{family:'red',blend_percent:12})>=18);for(const value of [-200,999,NaN,Infinity])assert.ok(categoryColorIndex('new',{family:'invalid',blend_percent:value})<MEMORY_SHADES.length);assert.notDeepEqual(contrastShades(true),contrastShades(false));});

test('default categories use five stable accents and old yellow cannot flood transcript patches',()=>{
 const chosen=new Set(Array.from({length:300},(_,i)=>Math.floor(categoryColorIndex('family_'+i)/9)));
 assert.equal(chosen.size,5);
 assert.equal(categoryColorIndex('session_themes',{family:'yellow'}),categoryColorIndex('session_themes',{family:'pink'}));
 const months=Array.from({length:12},(_,i)=>'session_themes#2026-'+String(i+1).padStart(2,'0'));
 assert.equal(new Set(months.map(id=>Math.floor(categoryColorIndex(id,{family:'yellow'})/9))).size,5);
 assert.ok(months.every(id=>Math.floor(categoryColorIndex(id,{family:'yellow'})/9)<8));
 assert.equal(Math.floor(categoryColorIndex('legacy',{family:'yellow'})/9),2);
 assert.equal(Math.floor(categoryColorIndex('important',{family:'deep_red'})/9),6);
});

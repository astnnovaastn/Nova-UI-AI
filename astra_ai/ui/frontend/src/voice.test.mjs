import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import {SpeechGate} from './speechGate.mjs';
import {EchoGuard} from './echoGuard.mjs';
function harness(){
 let resolveResume,wall=0;const sources=[],contexts=[];
 class AudioContext{constructor(){contexts.push(this);}state='running';currentTime=0;sampleRate=16000;destination={};audioWorklet={addModule:async()=>{}};resume(){return new Promise(r=>{resolveResume=()=>{this.state='running';r();};});}close(){return Promise.resolve();}createAnalyser(){return {connect(){},fftSize:0,smoothingTimeConstant:0};}createBuffer(_,length,rate){const samples=new Float32Array(length);return {duration:length/rate,sampleRate:rate,length,getChannelData(){return samples;}};}createBufferSource(){const s={connect(){},start(...args){s.started=true;s.startArgs=args;},stop(){s.stopped=true;},onended:null};sources.push(s);return s;}createMediaStreamSource(){return {connect(){},disconnect(){}};}createGain(){return {gain:{value:0},connect(){},disconnect(){}};}}
 let worklet;class AudioWorkletNode{port={};constructor(){worklet=this;}connect(){}disconnect(){}}
 class Worker{constructor(){queueMicrotask(()=>this.onmessage?.({data:{type:'ready'}}));}postMessage({pcm,epoch}){if(pcm){const p=new Int16Array(pcm);this.onmessage?.({data:{type:'score',epoch,probability:Math.max(...p)>1000?.95:0,pcm}});}}terminate(){}}
 const context={require:()=>({SpeechGate,EchoGuard}),Worker,URL,performance:{now:()=>wall},setTimeout,clearTimeout,queueMicrotask,exports:{},console:{log(){},error(){}},AudioContext,AudioWorkletNode,navigator:{mediaDevices:{getUserMedia:async()=>({getTracks:()=>[{stop(){}}]})}},Int16Array,Float32Array,ArrayBuffer,Math};
 vm.runInNewContext(ts.transpileModule(readFileSync(new URL('./voice.ts',import.meta.url),'utf8').replaceAll('import.meta.url',JSON.stringify('http://localhost/voice.ts')),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,context);
 return {api:context.exports,sources,AudioContext,contexts,advance:ms=>{wall+=ms;},getWorklet:()=>worklet,resolve:()=>resolveResume()};
}
test('stopped PCM cannot schedule after asynchronous AudioContext resume',async()=>{
 const h=harness();h.AudioContext.prototype.state='suspended';
 // Override instance state through a subclass to exercise the await race.
 const original=h.AudioContext.prototype.createAnalyser;h.AudioContext.prototype.createAnalyser=function(){this.state='suspended';return original.call(this);};
 const player=h.api.createAudioPlayer(),pending=player.enqueuePcm(new Int16Array(640).buffer);player.stop();h.resolve();await pending;assert.equal(h.sources.length,0);
});
test('stop cancels all queued PCM sources',async()=>{const h=harness(),player=h.api.createAudioPlayer();await player.enqueuePcm(new Int16Array(640).buffer);await player.enqueuePcm(new Int16Array(640).buffer);player.stop();assert.equal(h.sources.filter(s=>s.stopped).length,2);});
test('speech onset stays bounded and capture continues after onset',async()=>{
 const h=harness();let starts=0,frames=0;const input=h.api.createLiveVoiceInput(()=>frames++,()=>{},()=>starts++);input.start();await new Promise(r=>setTimeout(r,0));
 const send=values=>h.getWorklet().port.onmessage({data:Int16Array.from(values).buffer});
 for(let i=0;i<4;i++)send(Array(640).fill(200));assert.equal(starts,0);
 const speech=Array.from({length:640},(_,i)=>Math.sin(i*.08)*4000);send(speech);assert.equal(starts,0);send(speech);assert.equal(starts,0);send(speech);assert.equal(starts,1);assert.equal(frames,6);input.stop();
});

for(const delay of [0,50,100,250])test(`speech ${delay} ms after playback keeps the first captured samples`,async()=>{
 const h=harness();let started=0;const frames=[];
 const input=h.api.createLiveVoiceInput(frame=>frames.push(new Int16Array(frame)),()=>{},()=>started++);
 input.start();await new Promise(r=>setTimeout(r,0));
 // Speaking/listening are presentation states; resume never resets active VAD.
 input.resume();
 const send=pcm=>h.getWorklet().port.onmessage({data:pcm.buffer});
 for(let i=0;i<Math.ceil(delay/40);i++)send(new Int16Array(640));
 const first=Int16Array.from({length:640},(_,i)=>Math.sin(i*.08)*4000);
 send(first);input.resume();send(first.slice());send(first.slice());
 assert.equal(started,1);assert.ok(frames.some(p=>p.every((v,i)=>v===first[i])));
 assert.ok(frames.length<=7);input.stop();
});


test('false barge resumes only unplayed PCM from the held sample offset',async()=>{
 const h=harness(),player=h.api.createAudioPlayer();let finished=0;player.onFinished(()=>finished++);
 await player.enqueuePcm(new Int16Array(2400).fill(1000).buffer);
 await player.enqueuePcm(new Int16Array(2400).fill(2000).buffer);
 h.contexts[0].currentTime=.085;
 assert.equal(player.holdPcm(),true);assert.equal(finished,0);
 assert.ok(h.sources.slice(0,2).every(s=>s.stopped));
 h.advance(1500);assert.equal(player.resumeHeldPcm(),true);
 assert.ok(Math.abs(h.sources[2].startArgs[1]-.05)<.00001);
 assert.equal(h.sources[3].startArgs[1],0);
 assert.equal(player.resumeHeldPcm(),false,'checkpoint consumed once');
 player.finishPcmTurn();h.sources[2].onended();assert.equal(finished,0);h.sources[3].onended();assert.equal(finished,1);
});
for(const decision of ['stop','discardHeldPcm'])test(`genuine input or ${decision} prevents old audio resuming`,async()=>{
 const h=harness(),player=h.api.createAudioPlayer();await player.enqueuePcm(new Int16Array(2400).buffer);
 assert.ok(player.holdPcm());player[decision]();assert.equal(player.resumeHeldPcm(),false);assert.equal(h.sources.length,1);
});
test('audio checkpoint expires and oversized queues cannot be replayed partially',async()=>{
 const h=harness(),player=h.api.createAudioPlayer();await player.enqueuePcm(new Int16Array(2400).buffer);
 player.holdPcm();h.advance(5001);assert.equal(player.resumeHeldPcm(),false);
 await player.enqueuePcm(new Int16Array(24000*31).buffer);assert.equal(player.holdPcm(),false);player.stop();
});
test('microphone mute reports an active voice segment without stopping AI playback',async()=>{
 const h=harness(),ends=[],input=h.api.createLiveVoiceInput(()=>{},()=>{},()=>{},ms=>ends.push(ms));
 const player=h.api.createAudioPlayer();await player.enqueuePcm(new Int16Array(2400).buffer);
 input.start();await new Promise(r=>setTimeout(r,0));
 for(let i=0;i<3;i++)h.getWorklet().port.onmessage({data:new Int16Array(640).fill(4000).buffer});
 input.stop();assert.deepEqual(ends,[120]);assert.ok(!h.sources[0].stopped);player.stop();
});

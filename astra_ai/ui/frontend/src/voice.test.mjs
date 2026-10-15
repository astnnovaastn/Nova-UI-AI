import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import {SpeechGate} from './speechGate.mjs';
import {EchoGuard} from './echoGuard.mjs';
function harness(){
 let resolveResume;const sources=[];
 class AudioContext{state='running';currentTime=0;sampleRate=16000;destination={};audioWorklet={addModule:async()=>{}};resume(){return new Promise(r=>{resolveResume=()=>{this.state='running';r();};});}close(){return Promise.resolve();}createAnalyser(){return {connect(){},fftSize:0,smoothingTimeConstant:0};}createBuffer(){return {duration:.04,getChannelData(){return new Float32Array(640);}};}createBufferSource(){const s={connect(){},start(){s.started=true;},stop(){s.stopped=true;},onended:null};sources.push(s);return s;}createMediaStreamSource(){return {connect(){},disconnect(){}};}createGain(){return {gain:{value:0},connect(){},disconnect(){}};}}
 let worklet;class AudioWorkletNode{port={};constructor(){worklet=this;}connect(){}disconnect(){}}
 class Worker{constructor(){queueMicrotask(()=>this.onmessage?.({data:{type:'ready'}}));}postMessage({pcm,epoch}){if(pcm){const p=new Int16Array(pcm);this.onmessage?.({data:{type:'score',epoch,probability:Math.max(...p)>1000?.95:0,pcm}});}}terminate(){}}
 const context={require:()=>({SpeechGate,EchoGuard}),Worker,URL,performance,queueMicrotask,exports:{},console:{log(){},error(){}},AudioContext,AudioWorkletNode,navigator:{mediaDevices:{getUserMedia:async()=>({getTracks:()=>[{stop(){}}]})}},Int16Array,Float32Array,ArrayBuffer,Math};
 vm.runInNewContext(ts.transpileModule(readFileSync(new URL('./voice.ts',import.meta.url),'utf8').replaceAll('import.meta.url',JSON.stringify('http://localhost/voice.ts')),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,context);
 return {api:context.exports,sources,AudioContext,getWorklet:()=>worklet,resolve:()=>resolveResume()};
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

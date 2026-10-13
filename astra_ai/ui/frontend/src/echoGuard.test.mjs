import {test} from 'node:test';import assert from 'node:assert/strict';import {EchoGuard} from './echoGuard.mjs';import {SpeechGate} from './speechGate.mjs';
const wave=t=>.3*Math.sin(t*2*Math.PI*173)+.19*Math.sin(t*2*Math.PI*397)+.13*Math.sin(t*2*Math.PI*731);
const reference=()=>Float32Array.from({length:48000},(_,i)=>wave(i/24000));
const echo=()=>Int16Array.from({length:512},(_,i)=>wave(.368+i/16000)*32768*.2);
test('delayed quiet playback echo is recognized without using loudness',()=>{const g=new EchoGuard();g.add(reference(),24000,1000);assert.equal(g.isEcho(echo(),1550),true);});
test('unrelated user speech and overlapping stronger user speech are not rejected',()=>{const g=new EchoGuard();g.add(reference(),24000,1000);const human=Int16Array.from({length:512},(_,i)=>.5*Math.sin(i*.237)*32768);assert.equal(g.isEcho(human,1550),false);const mixed=Int16Array.from(human,(v,i)=>v+echo()[i]);assert.equal(g.isEcho(mixed,1550),false);});
test('queued future playback cannot suppress current speech; stop removes unplayed audio',()=>{const g=new EchoGuard();g.add(reference(),24000,2000);assert.equal(g.isEcho(echo(),1550),false);g.stop(1500);assert.equal(g.isEcho(echo(),2500),false);});
test('echo detection prevents false onset but allows genuine interruption',()=>{const g=new EchoGuard();g.add(reference(),24000,1000);let starts=0;const gate=new SpeechGate({onStart:()=>starts++,onFrame:()=>{}});for(let i=0;i<3;i++){const pcm=echo(),blocked=g.isEcho(pcm,1550);gate.push(blocked?new Int16Array(512):pcm,blocked?0:.95);}assert.equal(starts,0);const human=Int16Array.from({length:512},(_,i)=>.5*Math.sin(i*.237)*32768);for(let i=0;i<3;i++){const blocked=g.isEcho(human,1550);gate.push(human,blocked?0:.95);}assert.equal(starts,1);});

test('adding future queued chunks keeps the reference for current playback',()=>{const g=new EchoGuard();g.add(reference(),24000,1000);g.add(reference(),24000,4000);assert.equal(g.isEcho(echo(),1550),true);});

export class SpeechGate {
 constructor({onFrame,onStart,onEnd,rate=16000}){Object.assign(this,{onFrame,onStart,onEnd,rate});this.reset();}
 reset(){this.pre=[];this.preSamples=0;this.confirm=0;this.quiet=0;this.active=false;this.speechMs=0;}
 push(pcm,probability){const duration=pcm.length/this.rate*1000;
  if(!this.active){this.pre.push(pcm);this.preSamples+=pcm.length;while(this.preSamples>this.rate*.25&&this.pre.length>1)this.preSamples-=this.pre.shift().length;
   this.confirm=probability>=.65?this.confirm+duration:0;
   if(this.confirm>=96){this.active=true;this.quiet=0;this.speechMs=this.confirm;this.onStart?.();for(const part of this.pre)this.onFrame(part.buffer);this.pre=[];this.preSamples=0;}return;}
  if(probability>=.65)this.speechMs+=duration;
  this.onFrame(pcm.buffer);this.quiet=probability<.35?this.quiet+duration:0;
  if(this.quiet>=650){this.active=false;this.confirm=0;this.quiet=0;this.onEnd?.({speechMs:this.speechMs});}
 }
}

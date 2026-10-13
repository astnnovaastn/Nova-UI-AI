/** Ephemeral scheduled playback reference. No audio leaves this browser. */
export class EchoGuard {
 constructor(){this.chunks=[];}
 add(samples,rate,start){const n=Math.floor(samples.length*4000/rate),data=new Float32Array(n);for(let i=0;i<n;i++){const a=Math.floor(i*rate/4000),b=Math.min(samples.length,Math.floor((i+1)*rate/4000));let sum=0;for(let k=a;k<b;k++)sum+=samples[k];data[i]=sum/Math.max(1,b-a);}this.chunks.push({start,end:start+n/4,data});this.chunks=this.chunks.slice(-256);}
 prune(now){this.chunks=this.chunks.filter(c=>c.end>now-700).slice(-256);}
 stop(now){this.chunks=this.chunks.filter(c=>c.start<now).map(c=>({...c,end:Math.min(c.end,now),data:c.data.slice(0,Math.max(0,Math.ceil((now-c.start)*4)))}));}
 isEcho(pcm,end){this.prune(end);const n=Math.floor(pcm.length/4);if(n<64||!this.chunks.length)return false;const mic=new Float32Array(n);let sum=0,sq=0;for(let i=0;i<n;i++){let v=0;for(let k=0;k<4;k++)v+=pcm[i*4+k]/32768;v/=4;mic[i]=v;sum+=v;sq+=v*v;}const energy=sq-sum*sum/n;if(energy<1e-7)return false;
 const first=end-n/4-320,reference=new Float32Array(n+1281);for(const c of this.chunks){const from=Math.max(0,Math.round((c.start-first)*4)),to=Math.min(reference.length,Math.floor((c.end-first)*4));for(let i=from;i<to;i++){const k=Math.round(first*4+i-c.start*4);if(k>=0&&k<c.data.length)reference[i]=c.data[k];}}
 // Search physical echo delays without relying on microphone loudness.
 for(let offset=0;offset<=1280;offset+=4){let rs=0,rq=0,dot=0;for(let i=0;i<n;i++){const v=reference[offset+i];rs+=v;rq+=v*v;dot+=v*mic[i];}const re=rq-rs*rs/n;if(re<1e-7)continue;const correlation=Math.abs(dot-sum*rs/n)/Math.sqrt(energy*re);if(correlation>=.88)return true;}return false;
 }
}

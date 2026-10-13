import {acquireCamera,releaseCamera} from './cameraBroker';
import type {AegisSocket} from './ws';
export class PresenceCapture{
 private timer:ReturnType<typeof setInterval>|null=null;private video:HTMLVideoElement|null=null;private notice='';private generation=0;private disabled=false;private encoding=false;private cloudImage=false;private lease='';
 private indicator=document.createElement('div');
 constructor(private socket:AegisSocket){this.indicator.className='nova-presence-indicator';this.indicator.hidden=true;document.body.append(this.indicator);window.addEventListener('nova-camera-ended',()=>this.stop());}
 async start(notice:string){
  if(this.disabled){this.socket.send({type:'presence_status',state:'off'});return;}
  if(this.notice===notice&&this.timer)return;this.stop(false);const generation=++this.generation,lease='presence:'+generation;this.lease=lease;this.notice=notice;
  this.indicator.hidden=false;this.indicator.replaceChildren(document.createTextNode('Camera · checking presence '));const stop=document.createElement('button');stop.textContent='Stop';stop.onclick=()=>{this.disabled=true;this.stop();};this.indicator.append(stop);
  try{
   const stream=await acquireCamera(lease);if(generation!==this.generation){releaseCamera(lease);return;}
   this.video=document.createElement('video');this.video.srcObject=stream;this.video.muted=true;this.video.playsInline=true;await this.video.play();
   const canvas=document.createElement('canvas');
   const tick=()=>{if(this.encoding||!this.video?.videoWidth||!this.socket.isConnected())return;this.encoding=true;canvas.width=320;canvas.height=Math.max(96,Math.min(240,Math.round(320*this.video.videoHeight/this.video.videoWidth)));canvas.getContext('2d')?.drawImage(this.video,0,0,canvas.width,canvas.height);const cloud=this.cloudImage;this.cloudImage=false;canvas.toBlob(blob=>{if(!blob){this.encoding=false;return;}const reader=new FileReader();reader.onload=()=>{if(generation===this.generation)this.socket.send({type:'presence_frame',notice_id:notice,jpeg:String(reader.result).split(',')[1],cloud_image:cloud,cloud_allowed:localStorage.getItem('nova-camera-cloud-consent')==='true'});this.encoding=false;};reader.onerror=()=>{this.encoding=false;};reader.readAsDataURL(blob);},'image/jpeg',.65);};
   tick();this.timer=setInterval(tick,1100);this.socket.send({type:'presence_status',state:'live'});
  }catch{if(generation===this.generation){this.stop();this.socket.send({type:'presence_status',state:'unavailable'});}}
 }
 requestImage(notice:string){if(notice===this.notice&&localStorage.getItem('nova-camera-cloud-consent')==='true')this.cloudImage=true;}
 stop(notify=true){this.generation++;if(this.timer)clearInterval(this.timer);this.timer=null;this.video=null;this.notice='';this.indicator.hidden=true;if(this.lease)releaseCamera(this.lease);this.lease='';if(notify)this.socket.send({type:'presence_status',state:'off'});}
 result(state:string){if(!this.notice)return;const text=this.indicator.firstChild;if(text)text.textContent='Camera · '+(state==='present'?'person nearby':state==='absent'?'waiting for presence':'checking presence')+' ';}
}

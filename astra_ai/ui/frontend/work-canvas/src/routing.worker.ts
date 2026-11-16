import {createRoutePlanner,type RoutingInput} from './routing-plan';
const planner=createRoutePlanner();let generation=0;
self.onmessage=async(event:MessageEvent<RoutingInput>)=>{
 const own=++generation,batch=planner.start(event.data);let next=batch.next(),slice=performance.now();
 while(!next.done){
  if(own!==generation)return;
  if(performance.now()-slice>=4){await new Promise(resolve=>setTimeout(resolve,0));slice=performance.now();if(own!==generation)return;}
  next=batch.next();
 }
 if(own===generation)self.postMessage(next.value);
};

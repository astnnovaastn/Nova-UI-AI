import * as ort from 'onnxruntime-web/wasm';
ort.env.wasm.numThreads=1;ort.env.wasm.wasmPaths='/speech/ort/';
let state=new Float32Array(256),context=new Float32Array(64),samples:number[]=[],session:ort.InferenceSession;
let queue=Promise.resolve(),epoch=0,pending=0;
async function ready(){session=await ort.InferenceSession.create('/speech/silero.onnx',{executionProviders:['wasm']});postMessage({type:'ready'});}
const initialization=ready().catch(e=>{postMessage({type:'error',message:String(e)});throw e;});
onmessage=e=>{if(e.data.type==='reset'){epoch=e.data.epoch??epoch+1;queue=queue.then(()=>{state.fill(0);context.fill(0);samples=[];});return;}
 const version=e.data.epoch??epoch;if(pending>=64){epoch++;postMessage({type:'error',message:'Speech processing fell behind. Reconnect to retry.'});return;}pending++;const input=new Int16Array(e.data.pcm);queue=queue.then(async()=>{await initialization;if(version!==epoch)return;for(const v of input)samples.push(v/32768);
 while(samples.length>=512){const frame=new Float32Array(samples.splice(0,512)),combined=new Float32Array(576);combined.set(context);combined.set(frame,64);
 const result=await session.run({input:new ort.Tensor('float32',combined,[1,576]),state:new ort.Tensor('float32',state,[2,1,128]),sr:new ort.Tensor('int64',BigInt64Array.of(16000n),[])});
 state=new Float32Array(result.stateN.data as Float32Array);context=frame.slice(-64);const pcm=Int16Array.from(frame,v=>Math.max(-32768,Math.min(32767,Math.round(v*32768))));postMessage({type:'score',epoch:version,probability:Number(result.output.data[0]),capturedAt:(e.data.capturedAt||performance.now())-samples.length/16,pcm:pcm.buffer},{transfer:[pcm.buffer]});
 }}).catch(error=>postMessage({type:'error',message:String(error)})).finally(()=>pending--);};

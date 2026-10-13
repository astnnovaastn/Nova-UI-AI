/** A single browser-selected camera, shared by its active purposes. */
let stream:MediaStream|null=null,pending:Promise<MediaStream>|null=null;
const purposes=new Set<string>();
export async function acquireCamera(purpose:string):Promise<MediaStream>{
 purposes.add(purpose);
 if(stream?.active)return stream;
 if(!pending)pending=navigator.mediaDevices.getUserMedia({video:{width:{ideal:640},height:{ideal:480},frameRate:{ideal:5,max:10}},audio:false}).then(value=>{stream=value;value.getVideoTracks()[0]?.addEventListener('ended',()=>{stream=null;purposes.clear();window.dispatchEvent(new Event('nova-camera-ended'));});return value;}).finally(()=>{pending=null;});
 try{const value=await pending;if(!purposes.size){value.getTracks().forEach(t=>t.stop());stream=null;throw Error('Camera purpose canceled');}return value;}catch(error){purposes.delete(purpose);throw error;}
}
export function releaseCamera(purpose:string){purposes.delete(purpose);if(!purposes.size&&stream){stream.getTracks().forEach(t=>t.stop());stream=null;}}
export function cameraPurposes(){return [...purposes];}

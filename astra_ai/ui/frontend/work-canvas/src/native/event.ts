/** In-process events for the original resource sessions. No native execution. */
type Unlisten=()=>void;
export const listen=async<T>(name:string,callback:(event:{event:string;id:number;payload:T})=>void):Promise<Unlisten>=>{const handler=(event:Event)=>callback({event:name,id:0,payload:(event as CustomEvent<T>).detail});window.addEventListener(name,handler);return()=>window.removeEventListener(name,handler);};
export const once=async<T>(name:string,callback:(event:{event:string;id:number;payload:T})=>void)=>{let stop:Unlisten;stop=await listen<T>(name,event=>{stop();callback(event);});return stop;};
export const emit=async(name:string,payload?:unknown)=>{window.dispatchEvent(new CustomEvent(name,{detail:payload}));};
export const emitTo=async(_target:unknown,name:string,payload?:unknown)=>emit(name,payload);

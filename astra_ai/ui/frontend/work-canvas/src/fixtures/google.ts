/** Injected simulation adapter. No fetch, tokens, provider clients or persisted account state. */
let connected=true;
export async function fakeGoogleApi<T=Record<string,unknown>>(path:string,init:RequestInit={}):Promise<T>{
 let data:unknown;
 if(path==='/api/work/google/connect')data={authorization_url:'https://accounts.google.com/o/oauth2/v2/auth?fixture=not-a-real-authorization'};
 else if(path==='/api/work/google') {if(init.method==='DELETE')connected=false;data={configured:true,connected,services:connected?['calendar','gmail']:[]};}
 else if(path.startsWith('/api/work/google/messages?'))data={items:[{id:'fixture1',subject:'Fixture: review the design',from:'Synthetic sender',date:'16 November 2026',snippet:'A synthetic message for offline interaction verification.',url:'https://example.org/fixture'}],has_more:false};
 else if(path.startsWith('/api/work/google/events?'))data={items:[{id:'fixture1',summary:'Fixture: design review',start:{dateTime:'2026-11-16T10:00:00+01:00'},end:{dateTime:'2026-11-16T11:00:00+01:00'}}],has_more:false};
 else throw new Error('Simulation refuses unsupported account request');
 return data as T;
}


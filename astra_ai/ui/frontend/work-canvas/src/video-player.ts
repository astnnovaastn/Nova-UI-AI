/** Only known YouTube URL forms become an embedded player. Never interpolate a source URL as HTML. */
export function youtubeVideoId(value:string):string {
 try {const u=new URL(value);if(!['https:','http:'].includes(u.protocol)||u.username||u.password)return '';
 const host=u.hostname.toLowerCase();let id='';
 if(host==='youtu.be')id=u.pathname.slice(1);
 else if(['youtube.com','www.youtube.com','m.youtube.com','youtube-nocookie.com','www.youtube-nocookie.com'].includes(host)){
 if(u.pathname==='/watch')id=u.searchParams.get('v')||'';
 else {const match=/^\/(?:embed|shorts|live)\/([^/]+)\/?$/.exec(u.pathname);id=match?.[1]||'';}}
 return /^[a-zA-Z0-9_-]{11}$/.test(id)?id:'';
 }catch{return '';}
}
export function youtubeEmbed(value:string){const id=youtubeVideoId(value);return id?`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&playsinline=1&rel=0`:null;}

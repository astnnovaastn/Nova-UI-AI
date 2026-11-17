import {safeUrl,type WorkspaceObject} from './registry';
/** All activation paths share the existing source browser. No external window or iframe player. */
export function openWorkspaceObject(object:WorkspaceObject,event?:Event){
 const video=['video','source'].includes(object.kind)?{url:object.url||object.media?.[0]?.url,title:object.title,id:object.id}:object.recommendationKind==='video'?object.recommendations?.[0]:null;
 if(video){
  const url=safeUrl(video.url);
  if(url&&event?.isTrusted)window.dispatchEvent(new CustomEvent('aegis-open-source-window',{detail:{url,title:video.title,sourceId:video.id,control:'video-recommendation',activation:event}}));
  return;
 }
 window.dispatchEvent(new CustomEvent('aegis-object-open',{detail:{object}}));
}

export interface MemoryCamera { yaw: number; pitch: number; zoom: number; rotationPaused?:boolean }
function storage(): Storage | undefined { try { return typeof localStorage === 'undefined' ? undefined : localStorage; } catch { return undefined; } }
export function memoryIsOpen(): boolean { try { return storage()?.getItem('nova-current-workspace') === 'memory'; } catch { return false; } }
export function rememberMemoryOpen(open: boolean): void { try { if(open||storage()?.getItem('nova-current-workspace')==='memory')storage()?.setItem('nova-current-workspace',open?'memory':'dashboard'); } catch {} }
export function readMemoryCamera(): MemoryCamera | null {
  try { const v=JSON.parse(storage()?.getItem('nova-memory-camera-v2')||'null'); return v && [v.yaw,v.pitch,v.zoom].every(Number.isFinite) && v.zoom>=.6 && v.zoom<=8 ? {yaw:v.yaw,pitch:v.pitch,zoom:v.zoom,...(v.rotationPaused===true?{rotationPaused:true}:{})}:null; } catch { return null; }
}
export function rememberMemoryCamera(camera: MemoryCamera): void {
  if(![camera.yaw,camera.pitch,camera.zoom].every(Number.isFinite))return;
  try { storage()?.setItem('nova-memory-camera-v2',JSON.stringify({yaw:camera.yaw,pitch:camera.pitch,zoom:Math.min(8,Math.max(.6,camera.zoom)),...(camera.rotationPaused?{rotationPaused:true}:{})})); } catch {}
}

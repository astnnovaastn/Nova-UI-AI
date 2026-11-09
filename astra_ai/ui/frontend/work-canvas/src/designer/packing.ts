import type { Rect } from './types';
export const GAP = 32;
const hits = (a: Rect, b: Rect, pad=GAP) => a.x < b.x+b.width+pad && a.x+a.width+pad > b.x && a.y < b.y+b.height+pad && a.y+a.height+pad > b.y;

/** Measured rows, never the largest document's height for every source. */
export function packedRows<T extends {width:number;height:number}>(nodes:T[], columns:number) {
 const out:{x:number;y:number}[]=[]; let y=0;
 for(let i=0;i<nodes.length;i+=columns) {
  const row=nodes.slice(i,i+columns); let x=0;
  for(const n of row){out.push({x,y});x+=n.width+GAP;}
  y+=Math.max(...row.map(n=>n.height))+GAP;
 }
 return out;
}
/** Search adjacent free rectangles in both axes. Stable tie breaks prevent jitter. */
export function freeRectangle(desired:Rect, occupied:Rect[], gap=GAP):Rect {
 if(!occupied.some(o=>hits(desired,o,gap)))return desired;
 const candidates:Rect[]=[];
 for(const o of occupied) {
  for(const y of [o.y,o.y+o.height-desired.height,desired.y])
   for(const x of [o.x+o.width+gap,o.x-desired.width-gap])
    candidates.push({...desired,x,y});
  for(const x of [o.x,o.x+o.width-desired.width,desired.x])
   for(const y of [o.y+o.height+gap,o.y-desired.height-gap])
    candidates.push({...desired,x,y});
 }
 const available=candidates.filter(r=>!occupied.some(o=>hits(r,o,gap)));
 // A free position beyond the occupied bounds always exists.
 available.push({...desired,x:Math.max(...occupied.map(o=>o.x+o.width))+gap});
 return available.sort((a,b)=>Math.hypot(a.x-desired.x,a.y-desired.y)-Math.hypot(b.x-desired.x,b.y-desired.y)||a.y-b.y||a.x-b.x)[0];
}

/** Balanced columns pack tall activity cards beside short evidence without empty rows. */
export function masonry<T extends {width:number;height:number}>(nodes:T[], columns:number) {
 const widths=Array.from({length:columns},()=>0),heights=[...widths];
 const columnWidth=Math.max(280,...nodes.map(n=>n.width));
 return nodes.map(n=>{
  const column=heights.indexOf(Math.min(...heights));
  const p={x:column*(columnWidth+GAP),y:heights[column]};
  heights[column]+=n.height+GAP;return p;
 });
}

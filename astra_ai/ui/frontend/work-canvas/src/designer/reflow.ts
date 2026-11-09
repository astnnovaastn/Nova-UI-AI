import type {LayoutNode} from './types';
import {emptyGeometry} from './types';
import {freeRectangle} from './packing';
/** Local inline expansion leaves the saved arrangement and manual pins untouched. */
export function reflowExpanded(nodes:LayoutNode[], sizes:ReadonlyMap<string,{width:number;height:number}>) {
 const result=emptyGeometry();
 const containers=nodes.filter(n=>n.container);
 const roots=nodes.filter(n=>!n.container && !n.parentId && !containers.some(c=>c.id===n.group));
 const protectedNode=(n:LayoutNode)=>!!(n.constraint?.pinned||n.constraint?.manual||n.editing||n.dragging);
 const order=[...roots.filter(protectedNode),...roots.filter(n=>!protectedNode(n)&&sizes.has(n.id)),...roots.filter(n=>!protectedNode(n)&&!sizes.has(n.id))];
 const occupied:LayoutNode[]=[...containers];
 for(const n of order) {
  const box={...n,...sizes.get(n.id)};
  const target=protectedNode(n)?box:freeRectangle(box,occupied,12);
  result.positions[n.id]={x:target.x,y:target.y};
  result.sizes[n.id]={width:target.width,height:target.height};
  occupied.push({...n,...target});
 }
 for(const n of nodes)if(!result.positions[n.id])result.positions[n.id]={x:n.x,y:n.y};
 return result;
}

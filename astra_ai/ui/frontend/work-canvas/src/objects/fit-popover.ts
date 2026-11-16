/** Keep original anchored inspectors inside their reading panel or canvas. */
export function fitPopover(root:HTMLElement|undefined){
 if(!root)return ()=>{};
 let frame=0,x=0,y=0;
 const fit=()=>{frame=0;const boundary=root.closest<HTMLElement>('.lift')||root.closest<HTMLElement>('.svelte-flow');
  const box=boundary?.getBoundingClientRect()||{left:0,top:0,right:innerWidth,bottom:innerHeight};
  const rect=root.getBoundingClientRect(),scale=rect.width/Math.max(1,root.offsetWidth);
  const dx=rect.right>box.right-16?box.right-16-rect.right:rect.left<box.left+16?box.left+16-rect.left:0;
  const dy=rect.bottom>box.bottom-16?box.bottom-16-rect.bottom:rect.top<box.top+16?box.top+16-rect.top:0;
  x+=dx/scale;y+=dy/scale;root.style.translate=`${x}px ${y}px`;
  root.style.maxHeight=`${Math.max(80,(box.bottom-box.top-32)/scale)}px`;root.style.maxWidth=`${Math.max(180,(box.right-box.left-32)/scale)}px`;root.style.overflow='auto';
 };
 const queue=()=>{frame ||= requestAnimationFrame(fit);};
 const resize=new ResizeObserver(queue);resize.observe(root);queue();window.addEventListener('resize',queue);window.addEventListener('scroll',queue,true);
 return()=>{cancelAnimationFrame(frame);resize.disconnect();window.removeEventListener('resize',queue);window.removeEventListener('scroll',queue,true);};
}

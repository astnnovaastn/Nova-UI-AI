import {resizeResearchComposer} from "./resizeResearchComposer";
import {useEffect,useLayoutEffect,useRef} from 'react';
/** Presentation-only sizing and native details-popover dismissal. */
export function useResearchQueryBar(value:string){
 const form=useRef<HTMLFormElement>(null);
 useLayoutEffect(()=>{const input=form.current?.querySelector('textarea');if(!input)return;resizeResearchComposer(input,value);},[value]);
 useEffect(()=>{
   const root=form.current;if(!root)return;
   const outside=(event:Event)=>{root.querySelectorAll<HTMLDetailsElement>('details[open]').forEach(menu=>{if(!menu.contains(event.target as Node))menu.open=false;});};
   const option=(event:Event)=>{const button=(event.target as Element).closest('button');if(button&&root.contains(button))button.closest('details')?.removeAttribute('open');};
   const escape=(event:KeyboardEvent)=>{if(event.key!=='Escape')return;const open=root.querySelector<HTMLDetailsElement>('details[open]');if(open){event.preventDefault();open.open=false;open.querySelector<HTMLElement>('summary')?.focus();}};
   const toggle=(event:Event)=>{const target=event.target as HTMLDetailsElement;if(target.tagName==='DETAILS'&&target.open)root.querySelectorAll<HTMLDetailsElement>('details[open]').forEach(other=>{if(other!==target)other.open=false;});};
   document.addEventListener('pointerdown',outside);document.addEventListener('click',option);root.addEventListener('keydown',escape);root.addEventListener('toggle',toggle,true);
   return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('click',option);root.removeEventListener('keydown',escape);root.removeEventListener('toggle',toggle,true);};
 },[]);
 return form;
}

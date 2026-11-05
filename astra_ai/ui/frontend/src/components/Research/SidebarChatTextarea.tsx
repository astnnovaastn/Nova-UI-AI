import {resizeResearchComposer} from "./resizeResearchComposer";
import React,{useLayoutEffect,useRef} from 'react';
export function SidebarChatTextarea(props:React.TextareaHTMLAttributes<HTMLTextAreaElement>){
 const input=useRef<HTMLTextAreaElement>(null);
 useLayoutEffect(()=>{const el=input.current;if(!el)return;resizeResearchComposer(el,String(props.value||''));},[props.value]);
 return <textarea {...props} ref={input} rows={1} onKeyDown={event=>{
   props.onKeyDown?.(event);
   if(!event.defaultPrevented&&event.key==='Enter'&&!event.shiftKey&&!event.nativeEvent.isComposing){
     event.preventDefault();const form=event.currentTarget.form;
     if(form&&!form.querySelector<HTMLButtonElement>('button[type="submit"]')?.disabled)form.requestSubmit();
   }
 }}/>;
}

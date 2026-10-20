import React, {useEffect, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import './ResearchHistoryItem.css';
const paths:Record<string,string>={more:'M5 12h.01M12 12h.01M19 12h.01',rename:'m16 3 5 5-12 12-6 1 1-6L16 3Zm-2 2 5 5',archive:'M3 3h18v5H3zM5 8v13h14V8M10 12h4',trash:'M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7M14 10v7'};
function Glyph({name}:{name:string}) {return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]}/></svg>;}
export function historyActivity(item:any){
 const phase=item.phase || '', waiting=['waiting_for_quota','waiting_for_report','paused'].includes(phase);
 const pending=!waiting && !['failed','complete','completed','draft','cancelled'].includes(phase) && (['queued','collecting_sources','comparing_evidence','preparing_report','running'].includes(phase)||item.completeness==='pending');
 return {pending,waiting,stateLabel:waiting?'Waiting to continue':pending?'Research in progress':''};
}
export function ResearchHistoryItem({item,active,selecting,checked,disabled,onPick,onWarm,onToggle,onUpdate,onDelete}:any) {
 const title=item.history_title || String(item.display_title || item.query || 'Research findings').split(/\s+/).slice(0,7).join(' ');
 const {pending,waiting,stateLabel}=historyActivity(item);
 const row=useRef<HTMLDivElement>(null), menu=useRef<HTMLDivElement>(null), trigger=useRef<HTMLButtonElement>(null);
 const [position,setPosition]=useState<{top:number;left:number}|null>(null),[editing,setEditing]=useState(false),[draft,setDraft]=useState(title),[busy,setBusy]=useState(false),[error,setError]=useState('');
 useEffect(()=>{if(!position)return;const close=(e:Event)=>{if(!menu.current?.contains(e.target as Node)&&!trigger.current?.contains(e.target as Node))setPosition(null);};const key=(e:KeyboardEvent)=>{if(e.key==='Escape'){setPosition(null);trigger.current?.focus();}};document.addEventListener('pointerdown',close);document.addEventListener('keydown',key);window.addEventListener('resize',close);return()=>{document.removeEventListener('pointerdown',close);document.removeEventListener('keydown',key);window.removeEventListener('resize',close);};},[position]);
 useEffect(()=>{if(position)menu.current?.querySelector<HTMLButtonElement>('button')?.focus();},[position]);
 async function update(value:any){setBusy(true);setError('');try{await onUpdate(value);setEditing(false);setPosition(null);}catch(e:any){setError(e.message);}finally{setBusy(false);}}
 function warm(e:React.SyntheticEvent<HTMLButtonElement>){
   const button=e.currentTarget, label=button.querySelector<HTMLElement>('.rh-title'), text=label?.querySelector<HTMLElement>('span');
   if(label&&text){
     const distance=Math.max(0,text.scrollWidth-label.clientWidth);
     button.dataset.overflow=distance>1?'true':'false';
     button.style.setProperty('--rh-shift',`${-distance}px`);
     button.style.setProperty('--rh-duration',`${Math.max(1.2,Math.min(8,distance/32))}s`);
   }
   if(!selecting)onWarm();
 }

 return <div className="rh-item" ref={row} data-open={!!position || undefined}>
  {editing ? <form className="rh-rename" onSubmit={e=>{e.preventDefault();void update({title:draft});}}><input autoFocus aria-label="Research title" maxLength={80} value={draft} onChange={e=>setDraft(e.target.value)} onKeyDown={e=>{if(e.key==='Escape')setEditing(false);}}/><div><button disabled={busy||!draft.trim()} type="submit">{busy?'Saving…':'Save'}</button><button type="button" disabled={busy} onClick={()=>setEditing(false)}>Cancel</button></div></form> : <>
  {selecting&&<input className="rh-check" aria-label={'Select '+title} type="checkbox" checked={checked} disabled={disabled} onChange={onToggle}/>}
  <button className="rh-row" data-selecting={selecting||undefined} aria-current={active?'true':undefined} aria-pressed={selecting?checked:undefined} title={title} disabled={disabled} onPointerEnter={warm} onFocus={warm} onClick={selecting?onToggle:onPick}>{(pending||waiting)&&<span className={pending?'rh-spinner':'rh-waiting'} role="status" aria-label={stateLabel} title={stateLabel}>{waiting?'Ⅱ':null}</span>}<span className="rh-title"><span>{title}</span></span></button>
  {!selecting&&<button className="rh-dots" ref={trigger} aria-label={'Options for '+title} aria-haspopup="menu" aria-expanded={!!position} disabled={disabled||busy} onClick={()=>{if(position){setPosition(null);return;}const rect=trigger.current!.getBoundingClientRect();setPosition({top:Math.min(rect.bottom+5,window.innerHeight-160),left:Math.min(rect.left,window.innerWidth-190)});}}><Glyph name="more"/></button>}
  </>}
  {error&&<p className="rh-error" role="alert">{error}</p>}
  {position&&createPortal(<div className="rh-menu" role="menu" aria-label={'Actions for '+title} ref={menu} style={position} onKeyDown={e=>{const buttons=Array.from(menu.current?.querySelectorAll<HTMLButtonElement>('button')||[]);const index=buttons.indexOf(document.activeElement as HTMLButtonElement);if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();buttons[(index+(e.key==='ArrowDown'?1:buttons.length-1))%buttons.length]?.focus();}}}>
    <button role="menuitem" disabled={busy} onClick={()=>{setDraft(title);setEditing(true);setPosition(null);}}><Glyph name="rename"/>Rename</button>
    <button role="menuitem" disabled={busy} onClick={()=>void update({archived:!item.archived})}><Glyph name="archive"/>{item.archived?'Unarchive':'Archive'}</button>
    <button role="menuitem" className="rh-delete" disabled={busy} onClick={()=>{setPosition(null);onDelete();}}><Glyph name="trash"/>Delete</button>
  </div>,row.current?.closest('.research-workspace')||document.body)}
 </div>;
}

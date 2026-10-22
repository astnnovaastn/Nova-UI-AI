/** Measure off-screen so typing never flashes a collapsed textarea. */
export function resizeResearchComposer(input:HTMLTextAreaElement,value:string){
 const form=input.closest('form');if(!form)return;
 const style=getComputedStyle(input),probe=input.cloneNode(false) as HTMLTextAreaElement;
 const reserved=parseFloat(getComputedStyle(form).getPropertyValue('--composer-controls-space'))||170;
 const width=input.getBoundingClientRect().width;
 probe.removeAttribute('id');probe.removeAttribute('aria-describedby');probe.tabIndex=-1;probe.setAttribute('aria-hidden','true');probe.value=value;
 Object.assign(probe.style,{position:'fixed',left:'-10000px',top:'0',visibility:'hidden',height:'0px',minHeight:'0px',maxHeight:'none',width:width+'px',boxSizing:'border-box',padding:'10px '+reserved+'px 10px 14px',border:'0',font:style.font,lineHeight:style.lineHeight,letterSpacing:style.letterSpacing,whiteSpace:'pre-wrap',overflowWrap:'anywhere',overflow:'hidden',transition:'none'});
 document.body.appendChild(probe);
 const expanded=!!value && (value.includes('\n')||probe.scrollHeight>46);
 form.dataset.expanded=String(expanded);
 probe.style.paddingRight=expanded?'14px':reserved+'px';
 const naturalHeight=value?probe.scrollHeight:44;const height=Math.min(200,Math.max(44,naturalHeight));probe.remove();
 input.style.height=height+'px';input.style.overflowY=naturalHeight>200?'auto':'hidden';
 form.style.setProperty('--ai-editor-height',height+'px');
}

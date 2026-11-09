<script lang="ts">
 import {Popover} from 'bits-ui';
 import {STRATEGIES,eligibility} from './planner';
 import type {Designer} from './coordinator';
 let {designer,version=0}:{designer:Designer;version?:number}=$props();
 let open=$state(false);
 const phase=$derived((version,designer.phase));
 const usable=$derived(phase==='idle'||phase==='preview');
 const snapshot=$derived((version,designer.api.snapshot()));
 const selected=$derived(snapshot.nodes.filter(n=>n.selected).map(n=>n.id));
</script>
<div class="arrange-control" data-layout-metrics={JSON.stringify((version,designer.metrics))}>
 <Popover.Root bind:open>
  <Popover.Trigger class="arrange-trigger" aria-label="Auto Arrange canvas">
   <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" aria-hidden="true"><rect x="2" y="2" width="6" height="6" rx="1.5"/><rect x="12" y="2" width="6" height="6" rx="1.5"/><rect x="2" y="12" width="6" height="6" rx="1.5"/><path d="M12 15h6m-3-3v6"/></svg>
   <span>Auto Arrange</span>
  </Popover.Trigger>
  <Popover.Content class="arrange-popover" side="bottom" align="end" sideOffset={8} collisionPadding={{left:72,right:16,top:16,bottom:96}}>
   <div class="head"><strong>Arrange canvas</strong><span>On-device · no AI requests</span></div>
   <label>Arrangement<select bind:value={designer.strategy} disabled={!usable}><option value="auto">Auto — choose the best fit</option>
    {#each STRATEGIES as [id,label]}<option value={id} disabled={!!eligibility(designer.input(),id)}>{label}{eligibility(designer.input(),id)?' — '+eligibility(designer.input(),id):''}</option>{/each}
   </select></label>
   <label>Scope<select bind:value={designer.selectedOnly} disabled={!usable}><option value={false}>Entire canvas</option><option value={true} disabled={!selected.length}>Selected cards ({selected.length})</option></select></label>
   <label>Organizer cursors<select bind:value={designer.cursorMode} disabled={!usable}><option value="adaptive">Adaptive — one or two</option><option value="one">One cursor</option><option value="two">Two cursors</option><option value="off">Off</option></select></label>
   <label class="check"><input type="checkbox" bind:checked={designer.follow}/> Follow movement</label>
   <p class="status" role="status">{designer.message}</p>
   <div class="actions">
    <button onclick={()=>designer.focusActive()} disabled={!snapshot.nodes.length}>Focus on active work</button>
    {#if usable}
     <button onclick={()=>designer.arrange(false)} disabled={!snapshot.nodes.length}>Arrange now</button>
     <button onclick={()=>designer.arrange(true)} disabled={!snapshot.nodes.length}>Preview</button>
    {/if}
    {#if phase==='preview'}<button class="primary" onclick={()=>designer.apply()}>Apply</button><button onclick={()=>designer.stop()}>Cancel</button>{/if}
    {#if phase==='moving'}<button onclick={()=>designer.pause()}>Pause</button>{/if}
    {#if phase==='moving'||phase==='paused'}<button onclick={()=>designer.skip()}>Skip animation</button>{/if}
    {#if phase==='paused'}<button onclick={()=>designer.resume()}>Resume</button>{/if}
    {#if ['moving','paused','planning'].includes(phase)}<button onclick={()=>designer.stop()}>Stop</button>{/if}
    {#if phase==='unsaved'}{#if designer.conflict}<button onclick={()=>void designer.replan()}>Refresh and replan</button>{:else}<button onclick={()=>designer.retry()}>Retry save</button>{/if}<button onclick={()=>{designer.stop();void designer.refresh();}}>Cancel</button>{/if}
    {#if phase==='loading'}<button onclick={()=>void designer.refresh(true)}>Retry loading</button>{/if}
    <button disabled={phase!=='idle'||!designer.record.previous} onclick={()=>void designer.undo()}>Undo arrangement</button>
   </div>
   {#if selected.length}
    <div class="protect" aria-label="Selected card protection"><span>{selected.length} selected</span>
     <button disabled={phase!=='idle'} onclick={()=>void designer.constraint(selected,'pinned')}>Toggle pin</button>
     <button disabled={phase!=='idle'} onclick={()=>void designer.constraint(selected,'lockedSize')}>Toggle size lock</button>
     <button disabled={phase!=='idle'} onclick={()=>void designer.constraint(selected,'manual')}>Release manual positions</button>
    </div>
   {/if}
  </Popover.Content>
 </Popover.Root>
 {#if !open&&['moving','paused','saving','unsaved','preview'].includes(phase)}
  <span class="compact" role="status">{phase==='preview'?'Preview ready':phase==='moving'?'Arranging cards':designer.message}</span>
 {/if}
</div>
<style>
 .arrange-control{display:flex;align-items:center;gap:8px;pointer-events:auto;font-size:12px}
 :global(.arrange-trigger){display:flex;align-items:center;gap:7px;border:1px solid var(--color-border);border-radius:10px;background:var(--color-float);color:var(--color-text);padding:8px 10px;font:inherit;cursor:pointer}
 :global(.arrange-popover){z-index:60;width:min(330px,calc(100vw - 104px));max-height:calc(100dvh - 120px);overflow:auto;padding:16px;border:1px solid var(--color-border);border-radius:16px;background:var(--color-float);color:var(--color-text);box-shadow:var(--shadow-popover);font-family:var(--font-sans);font-size:12px}
 .head{display:flex;flex-direction:column;gap:4px;margin-bottom:14px}.head strong{font-size:14px}.head span,.status,.protect>span{color:var(--color-muted)}
 label{display:flex;flex-direction:column;gap:6px;margin-block:10px}select{max-width:100%;padding:8px;border:1px solid var(--color-border);border-radius:8px;background:var(--color-canvas);color:var(--color-text);font:inherit}.check{flex-direction:row;align-items:center}
 .status{line-height:1.5;min-height:32px}.actions,.protect{display:flex;flex-wrap:wrap;gap:6px}.protect{margin-top:12px;padding-top:12px;border-top:1px solid var(--color-border)}.protect>span{width:100%}
 button{padding:7px 10px;border:1px solid var(--color-border);border-radius:8px;background:var(--color-canvas);color:var(--color-text);font:inherit;cursor:pointer}
 button.primary{background:var(--color-text);color:var(--color-canvas)}button:disabled{opacity:.4;cursor:default}
 button:focus-visible,select:focus-visible,:global(.arrange-trigger:focus-visible){outline:2px solid var(--color-ring,var(--color-text));outline-offset:3px}
 .compact{max-width:160px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--color-muted)}
 @media(max-width:640px){.compact{display:none}:global(.arrange-trigger){padding:9px}:global(.arrange-trigger span){display:none}}
</style>

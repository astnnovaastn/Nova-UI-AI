<script lang="ts">
 import type {WorkspaceObject} from './registry';
 let {object}:{object:WorkspaceObject}=$props();
</script>
<section class="metric-panels" aria-label={object.title}>
 <h3>{object.title}</h3>
 <div class="panels">{#each object.metricPanels||[] as panel (panel.id)}
  {@const max=Math.max(1,...panel.values.map(v=>v.value||0))}
  <section class="metric-panel" aria-label={panel.title}><h4>{panel.title}</h4><p>{panel.subtitle||''}</p>
   <div class="bars">{#each panel.values as value (value.id)}
    <div class="column" class:highlight={value.highlight}><div class="plot"><div class="bar" class:unknown={value.value===undefined} style:height={(value.value===undefined?12:Math.max(3,value.value/max*132))+'px'}><span>{value.display||'Not recorded'}</span></div></div><div class="legend" title={value.label}><span class="mark" aria-hidden="true">{value.label.slice(0,1)}</span><span>{value.label}</span></div></div>
   {/each}</div>
  </section>
 {/each}</div>
 {#if object.caption}<footer>{object.caption}</footer>{/if}
</section>
<style>
 .metric-panels{padding:24px;border-radius:20px;background:var(--color-surface);color:var(--color-text);box-sizing:border-box;width:100%}h3{font-size:22px;letter-spacing:-.025em;margin:0 0 24px;font-weight:650}h4{font-size:14px;font-weight:600;margin:0}p{margin:4px 0 28px;font-size:12px;color:var(--color-muted);min-height:16px}.panels{display:grid;grid-template-columns:repeat(auto-fit,minmax(185px,1fr));gap:28px}.metric-panel{min-width:0}.bars{display:flex;gap:12px}.column{flex:1;min-width:0}.plot{height:145px;display:flex;align-items:end;justify-content:center;border-bottom:1px solid var(--color-border)}.bar{position:relative;min-width:20px;width:60%;max-width:38px;background:color-mix(in srgb,var(--color-text) 22%,var(--color-surface));border-radius:6px 6px 0 0}.highlight .bar{background:#6090c9}.bar.unknown{background:none;border:1px dashed var(--color-border);box-sizing:border-box}.bar>span{position:absolute;bottom:calc(100% + 6px);left:50%;transform:translateX(-50%);text-align:center;font-size:12px;font-weight:600;min-width:65px;max-width:85px;line-height:1.2}.legend{display:flex;flex-direction:column;align-items:center;gap:5px;padding-top:10px;text-align:center;font-size:10px;color:var(--color-muted);overflow-wrap:anywhere}.mark{display:grid;place-items:center;width:22px;height:22px;border-radius:50%;background:var(--color-control);font-weight:700;color:var(--color-text)}.highlight .mark{color:#91c3aa}footer{font-size:12px;color:var(--color-muted);margin-top:22px;line-height:1.5}
</style>

<script lang="ts">
 import {CARD_FAMILIES} from '../objects/adaptive-catalog';
 let {family,preset,count,onchange}:{family:string;preset:string;count:number;onchange:(family:string,preset:string,count:number)=>void}=$props();
 const spec=$derived(CARD_FAMILIES.find(f=>f.id===family)||CARD_FAMILIES[0]);
</script>
<aside class="adaptive-gallery" aria-label="Adaptive card library">
 <h2>Adaptive cards</h2><p>20 families · 800 specifications</p>
 <label>Family<select aria-label="Family" value={family} onchange={e=>onchange(e.currentTarget.value,'',count)}>{#each CARD_FAMILIES as f}<option value={f.id}>{f.label}</option>{/each}</select></label>
 <label>Presentation<select aria-label="Presentation" value={preset||spec.presets[0].id} onchange={e=>onchange(family,e.currentTarget.value,count)}>{#each spec.presets as p}<option value={p.id} disabled={!p.available}>{p.label}{!p.available?' · awaiting design review':''}</option>{/each}</select></label>
 <label>Data size<select aria-label="Data size" value={count} onchange={e=>onchange(family,preset,Number(e.currentTarget.value))}>{#each [1,3,8,24,50,100] as n}<option value={n}>{n} items</option>{/each}</select></label>
 <p>{spec.purpose}</p><details><summary>15 uses across workflows</summary><ol>{#each spec.uses as use}<li>{use}</li>{/each}</ol></details>
 <p class="notice">Fixture data only. No research is started and no external action is performed.</p>
</aside>
<style>.adaptive-gallery{position:absolute;top:100px;right:16px;bottom:16px;z-index:30;background:var(--color-raised);border:1px solid var(--color-border);border-radius:16px;width:280px;box-sizing:border-box;padding:20px;overflow:auto;font:13px/1.5 var(--font-sans);color:var(--color-text)}h2{font-size:20px;margin:0}p{color:var(--color-muted);font-size:12px}label{display:flex;flex-direction:column;gap:6px;margin:16px 0}select{font:inherit;color:inherit;background:var(--color-control);border:1px solid var(--color-border);border-radius:8px;padding:8px;max-width:100%}select:focus-visible,summary:focus-visible{outline:2px solid var(--color-ring)}li{margin-bottom:6px}.notice{border-top:1px solid var(--color-border);padding-top:12px}@media(max-width:700px){.adaptive-gallery{position:absolute;width:240px;max-height:50vh;top:auto;bottom:16px}}</style>

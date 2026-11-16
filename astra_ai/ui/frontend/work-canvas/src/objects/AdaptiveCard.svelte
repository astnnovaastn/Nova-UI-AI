<script lang="ts">
 import {useViewport} from '@xyflow/svelte';
 import WorkspaceObject from './ZephiumWorkspaceObject.svelte';
 import {parseObject} from './registry';
 let {value}:{value:unknown}=$props();const object=$derived(parseObject(value));
 const viewport=useViewport();let detail=$state<'compact'|'summary'|'full'>('full');
 $effect(()=>{const zoom=viewport.current.zoom;if(zoom<.42)detail='compact';else if(zoom>.83)detail='full';else if(zoom>.48&&zoom<.77)detail='summary';});
</script>
{#if object}<WorkspaceObject {object} {detail}/>{:else}<p role="status">This result type is unavailable.</p>{/if}

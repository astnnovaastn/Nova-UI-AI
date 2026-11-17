import {workApi} from '../work-panels.svelte';
import type {WorkspaceObject} from './registry';
export type ResultActions={save:(object:WorkspaceObject,action:'note'|'task')=>Promise<Record<string,any>>;open:(kind:'notes'|'tasks',id?:string)=>void};
export const resultActionsKey=Symbol('aegis-result-actions');
export const resultActions:ResultActions={
 save:(object,action)=>workApi('/api/workspace/v21/from-result',{method:'POST',body:JSON.stringify({action,object})}),
 open:(kind,id)=>{window.dispatchEvent(new CustomEvent('aegis-open-tools',{detail:{kind,noteId:kind==='notes'?id:undefined}}));},
};

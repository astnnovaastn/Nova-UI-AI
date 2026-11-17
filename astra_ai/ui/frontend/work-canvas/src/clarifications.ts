import type {WorkRun} from './work-run';
import type {TraceEvent} from './research-trace';
import type {QuestionAsk} from '$features/work/components/asks/asks';
export type ClarificationRecord={id:string;question:string;answer?:string;options?:string[]};
/** Recorded facts only. Legacy questions use their original trace; never invent suggested answers. */
export function clarificationPresentation(run:WorkRun|null|undefined,trace:readonly TraceEvent[]){
 const records:ClarificationRecord[]=(run?.request.clarifications||[]).filter(r=>r&&typeof r.question==='string'&&r.question.trim()).map(r=>({...r,answer:typeof r.answer==='string'?r.answer:undefined}));
 const event=[...trace].reverse().find(e=>e.kind==='stage'&&e.stage==='question'&&typeof e.question==='string');
 const prompt=typeof event?.question==='string'?event.question:run?.plan.clarification||'';
 const options=(Array.isArray(event?.options)?event.options:run?.plan.clarification_options||[]).filter((o):o is string=>typeof o==='string'&&!!o.trim()).slice(0,6);
 const pending=run?.state==='needs_input'&&!!prompt;
 if(prompt&&!records.some(r=>r.question===prompt&&(pending?!r.answer:true)))records.push({id:String(event?.id||'legacy-question'),question:prompt,answer:pending?undefined:run?.request.answer,options});
 const latest=records.at(-1);
 const question:QuestionAsk|null=pending&&latest?{kind:'question',step:run!.run_id+':'+latest.id+':'+records.length,part:null,state:'open',prompt:latest.question,options:latest.options||options,answer:null}:null;
 return {question,exchange:records.map(r=>({kind:'ask' as const,question:r.question,answer:r.answer||null}))};
}

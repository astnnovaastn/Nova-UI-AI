<script lang="ts">
 import QuestionCard from '$features/work/components/asks/QuestionCard.svelte';
 import {Character} from '$shared/ui/presence';
 import type {QuestionAsk} from '$features/work/components/asks/asks';
 let {question,disabled=false,listening=false,heard='',embedded=false,onvoice,onanswer}:{
  question:QuestionAsk;disabled?:boolean;
  /** The microphone is on: a finished spoken sentence is taken as the answer. */
  listening?:boolean;
  /** What the microphone heard so far for this question. */
  heard?:string;
  /** V30: drawn inside the top-centre island, which supplies the frame and the status line. */
  embedded?:boolean;
  /** Turns the microphone on or off, to answer aloud. */
  onvoice?:()=>void;
  onanswer:(text:string)=>void|Promise<void>;
 }=$props();
 let submitted=$state(false),error=$state('');
 // The step id, by value: the run is re-read often and its question object is rebuilt each time.
 const step=$derived(question.step);
 $effect(()=>{void step;submitted=false;error='';});
 async function answer(text:string){if(disabled||submitted)return;submitted=true;error='';try{await onanswer(text);}catch(e){submitted=false;error=e instanceof Error?e.message:'Could not send answer. Try again.';}}
</script>
<section class="clarification nodrag nopan nowheel" class:embedded aria-label="AEGIS question" aria-live="polite" aria-busy={submitted}>
 {#if !embedded}
 <header><Character kind="lead" mood={listening?'reading':'waiting'} size={24}/><span>{submitted?'Sending your answer…':listening?'Listening for your answer':'Waiting for you'}</span>
  {#if onvoice}<button type="button" class="voice" class:on={listening} aria-pressed={listening} disabled={disabled||submitted} onclick={onvoice}>{listening?'Stop listening':'Answer by voice'}</button>{/if}
 </header>
 {:else if onvoice}
 <div class="voice-row"><span>{submitted?'Sending your answer…':listening?'Listening for your answer':''}</span><button type="button" class="voice" class:on={listening} aria-pressed={listening} disabled={disabled||submitted} onclick={onvoice}>{listening?'Stop listening':'Answer by voice'}</button></div>
 {/if}
 {#key question.step}<QuestionCard ask={question} placement="island" busy={disabled||submitted} onanswer={answer}/>{/key}
 {#if listening&&heard}<p class="heard"><span>Heard</span> “{heard}”</p>{/if}
 {#if error}<p role="alert">{error}</p>{/if}
</section>
<style>
 .clarification{width:min(560px,calc(100vw - 32px));box-sizing:border-box;padding:20px 24px 16px;border:1px solid var(--color-border);border-radius:24px;background:var(--color-raised);color:var(--color-text);box-shadow:0 12px 40px #0003;max-height:calc(100vh - 150px);overflow:auto;scrollbar-width:none;font-family:var(--font-sans)}
 .clarification.embedded{width:auto;padding:4px 20px 16px;border:0;border-radius:0;background:none;box-shadow:none;max-height:min(60vh,calc(100vh - 180px))}
 .clarification::-webkit-scrollbar{display:none}
 header{display:flex;align-items:center;gap:10px;font-size:13px;font-weight:600;margin-bottom:24px}p{font-size:13px;color:var(--color-muted)}
 .voice-row{display:flex;align-items:center;gap:10px;margin:0 0 12px;font-size:12px;color:var(--color-muted)}
 .voice{margin-inline-start:auto;border:0;border-radius:999px;padding:5px 12px;font:600 12px var(--font-sans);color:var(--color-text);background:color-mix(in oklab,var(--color-text) 8%,transparent);cursor:pointer}
 .voice.on{color:#1b1b1b;background:#ff8a3d}
 .voice:disabled{opacity:.5;cursor:default}
 .voice:focus-visible{outline:2px solid var(--color-text);outline-offset:2px}
 .heard{margin:12px 0 0;color:var(--color-text)}.heard span{color:var(--color-muted);margin-inline-end:6px}
</style>

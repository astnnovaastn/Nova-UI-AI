import {objectItems,type WorkspaceObject} from '../objects/registry';
export const learningSteps=[
 ['Map the problem','Watch the RAG overview; write a one-page definition of working memory, episodic memory, semantic memory, and external retrieval.'],
 ['Embeddings','Read the NLP foundations: tokenization, language modeling, embeddings, and similarity. Implement cosine similarity over a small document set.'],
 ['Transformers and limits','Study transformer attention and context windows. Explain why in-context history alone is not durable memory.'],
 ['First retrieval system','Build a minimal chunk → embed → retrieve pipeline over 20–50 notes. Inspect the top-k results manually.'],
 ['Chunking and indexing','Add chunking experiments: fixed size, overlap, and semantic boundaries. Create a small query set and compare retrieval failures.'],
 ['RAG baseline','Add the generation step: retrieve evidence, construct a grounded prompt, and require citations to retrieved chunks.'],
 ['Memory architecture','Separate short-term conversation state from long-term memory. Define schemas for user profile, facts, events, and preferences.'],
 ['Memory writes','Implement write policies: what to store, summarize, merge, expire, and never store. Add explicit user-controlled deletion.'],
 ['Memory reads','Implement read policies: query rewriting, metadata filters, recency, reranking, and token-budget allocation.'],
 ['Evaluation','Create an evaluation set with answer quality, retrieval recall, groundedness, latency, and cost. Run an error taxonomy.'],
 ['Safety and operations','Harden the system: prompt-injection-resistant document handling, tenant isolation, PII minimization, and audit logs.'],
 ['Capstone','Ship a capstone: a memory-enabled assistant with ingestion, retrieval, memory writes, evaluations, and a design document describing trade-offs.'],
];
export function learningFixture(){
 const base={revision:1,status:'simulation',sources:[{id:'supplied',title:'User-supplied design reference · local fixture'}]};
 const reading:WorkspaceObject={...base,id:'reading',kind:'comparison',title:'Core readings',recommendationKind:'article',recommendations:[{id:'book',title:'Speech and Language Processing (3rd-ed. draft)',subtitle:'Open online NLP textbook',recommended:true,facts:[{label:'Level',value:'Beginner to intermediate'},{label:'Format',value:'Free online textbook'},{label:'Focus',value:'NLP, neural networks, transformers'}],why:'Use it to build the NLP and transformer vocabulary needed before designing retrieval and memory layers.'}]};
 // A real supplied Zephium video URL; the illustrative poster remains explicitly a local fixture.
 const video:WorkspaceObject={...base,id:'watch',kind:'comparison',title:'Watch first',recommendationKind:'video',recommendations:[{id:'zephium-video',title:'Zephium Work — workspace demonstration',subtitle:'Supplied YouTube video · local fixture',url:'https://www.youtube.com/watch?v=QbSarcWspvw',image:location.origin+'/fixtures/v20/reference.png',recommended:true,facts:[{label:'Length',value:'See original video'},{label:'Level',value:'Introduction'},{label:'Format',value:'Product demonstration'}],why:'Open this video in the AEGIS miniature browser. The poster is a local design reference, not a captured video frame.'}]};
 const plan:WorkspaceObject={...base,id:'learning-plan',kind:'timeline',title:'12-week memory LLM path',planTotal:{label:'Pace',value:'12 weeks · ~72 hours'},entries:learningSteps.map(([label,detail],i)=>({id:'week-'+(i+1),label:'Week '+(i+1)+' · '+label,detail,when:'6 hours'}))};
 const objects=[reading,video,plan],items:any[]=objectItems(objects);
 items.push({id:'learning-prompt',type:'request',kind:'request',title:'Build a learning path for memory in LLM applications',detail:'',status:'complete',when:'Local fixture',orders:true,designer:true,size:{width:480,height:160}});
 const positions={'learning-prompt':{x:20,y:20},'object:reading':{x:20,y:240},'object:watch':{x:400,y:240},'object:learning-plan':{x:820,y:240}};
 return {label:'Learning resources',objects,items,links:[],plan:{geometry:{positions,sizes:Object.fromEntries(items.map(i=>[i.id,i.size])),constraints:{},viewport:{x:0,y:0,zoom:1}}}};
}
export const questions=[
 {id:'scope',question:'To find investors, what is your company’s AI focus, stage, target round size, and base city/country?',options:['Pre-seed — $500k — US','Seed — $2m — US','Series A — $8m — US','I’ll provide details']},
 {id:'focus',question:'Which focus should I target for this US pre-seed $500k raise?',options:['OpenAI applications','NVIDIA / AI infrastructure','Both / developer tools','Other AI focus']},
];

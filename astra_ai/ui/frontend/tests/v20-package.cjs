const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const front=path.resolve(__dirname,'..'),root=path.resolve(front,'../../..'),out=path.join(front,'v20-verification'),docs=path.join(root,'docs/v20');
fs.mkdirSync(docs,{recursive:true});
const source=fs.readFileSync(path.join(front,'work-canvas/src/designer/families.ts'),'utf8');
const rows=[...source.matchAll(/\['([^']+)','([^']+)','([^']*)','([^']*)'\]/g)].map(m=>({id:m[1],title:m[2],purpose:m[3],workflows:m[4]}));
const rules=[
 'Supporting inputs in a compact column; a prominent answer in the adjacent reading column.',
 'Independent task roles form horizontal lanes. Lane length follows measured card bounds.',
 'Dependency ranks form columns. Branch groups are vertically balanced around their parent level.',
 'Evidence is packed in up to three columns; conclusions sit at the convergence side.',
 'Dependency depth forms horizontal subsystem bands; nested component objects render local graphs.',
 'Directed dependency ranks form columns. Subject cycles remain representable inside diagram objects.',
 'Meaningful group IDs create compact two-column page collections. Source record identity is retained.',
 'Comparable groups form columns, with typed comparison objects aligning attributes within each column.',
 'Real timestamps determine the time-axis position. Undated objects occupy a separate column.',
 'Recorded task statuses form Ready, Working, Blocked and Complete columns.',
 'Calendar timestamps share a time scale; unscheduled objects remain in an adjacent column.',
 'A reading column holds reports; evidence and supporting objects occupy a compact side rail.',
 'Visual references form a measured grid, with differing card sizes retained.',
 'Screenshot references occupy one column; findings and recommendations occupy the adjacent rail.',
 'Reproduction, code and proposed changes follow dependency order; test/log output gets a separate row.',
 'A leading decision anchors an options column, centered around the starting question.',
 'Stable concept groups form compact local clusters with their own measured size.',
 'Editorial roles or object kinds determine columns for drafts, reviews and final output.',
 'Recorded classification groups form horizontal market bands. No unsourced numeric axes are created.',
 'One primary answer sits above a locally packed set of compatible result objects.',
 'Supplied supporting/conflicting/unresolved groups form distinct review columns.',
 'Code is the primary reading column; explanations and diagrams occupy the adjacent rail.',
 'Diff is primary; findings and validation objects occupy the review rail.',
 'Message/context objects occupy the list column; draft documents occupy the detail column.',
 'Options and comparisons form a compact three-column area; itinerary/report sits beside them.',
];
const interactions=[
 'Open answer; contextual Ask; inspect recorded sources.',
 'Select a task lane; inspect status/output. Task-scoped execution retry is not yet exposed by this renderer.',
 'Select a topic and follow its logical edges. Topic collapse is a future object action.',
 'Select evidence or conclusion; inspect original edge memberships.',
 'Open the architecture object; select a component to emphasize its immediate connections.',
 'Select a dependency node; retain original edge direction and saved canvas position.',
 'Use the existing hover/keyboard/touch source stack and intentional page-open controller.',
 'Read aligned comparison rows; Open for readability. Per-cell provenance is not yet implemented.',
 'Read timestamped entries and open their details. Date writes require a future registered capability.',
 'Inspect actual status; dragging changes presentation, not execution.',
 'Inspect dated and undated entries. Calendar conflict editing and save remain unavailable.',
 'Open the report in the existing Reader; retain full persisted body and citations.',
 'Open supplied image; retain its reference and caption. Compare sources on the canvas.',
 'Open screenshot and finding; region-linked annotation editing remains future work.',
 'Read code/diff/logs; a proposed patch is not an executed change.',
 'Read decision criteria and evidence. Recalculating weighted decisions remains future work.',
 'Open the concept diagram and select a node to emphasize its immediate edges.',
 'Read drafts and notes. Revision comparison/comment resolution remain future work.',
 'Inspect classification and comparison evidence; no invented company data.',
 'Open a section independently while keeping the surrounding canvas unchanged.',
 'Read agreement, contradiction and gaps; contextual Ask uses the selected object.',
 'Read source code and linked explanation. Symbol-to-file navigation requires repository access.',
 'Read changed lines and findings; executed validation requires a real runner.',
 'Review supplied message and draft; no sending or account mutation is simulated.',
 'Read supplied/fixture options, itinerary and totals. No bookings or live travel data are invented.',
];
let md='# The 25 adaptive layout families\n\nEach package is a deterministic composition family, a screen concept and an interaction specification. The current implementation shares production renderers and preserves saved geometry. These are not 25 color themes.\n\n';
rows.forEach((r,i)=>{
 md+='## '+String(i+1).padStart(2,'0')+' — '+r.title+'\n\n'+r.purpose+'.\n\n**Composition:** '+rules[i]+'\n\n**Interaction:** '+interactions[i]+'\n\n**States:** normal, selected with the existing contextual toolbar, focused result, missing content, recorded failure, narrow viewport and reduced motion. Only validated available content is rendered.\n\n**Rules:** 20-unit grid; measured dimensions; stable IDs break ties; manual constraints win. Existing runs are never rearranged simply by reopening. Camera gestures do not select another family.\n\n**Fixtures:** '+r.id+' at 5, 20, 50 and 100 objects. Workflows: '+(r.workflows||'selected explicitly or by compatible output structure')+'.\n\n[Overview](../../astra_ai/ui/frontend/v20-verification/'+r.id+'-overview.png) · [Selected](../../astra_ai/ui/frontend/v20-verification/'+r.id+'-selected.png) · [Focused](../../astra_ai/ui/frontend/v20-verification/'+r.id+'-focus.png)\n\n';
});
fs.writeFileSync(path.join(docs,'AEGIS_25_LAYOUT_FAMILIES.md'),md);
const cards=rows.map((r,i)=>'<article><a href="'+r.id+'-overview.png"><img loading="lazy" src="'+r.id+'-overview.png" alt="'+r.title+' overview"></a><h2>'+String(i+1).padStart(2,'0')+' · '+r.title+'</h2><p>'+rules[i]+'</p><nav><a href="'+r.id+'-selected.png">Selected state</a><a href="'+r.id+'-focus.png">Focused result</a><a href="http://127.0.0.1:5187/v20-simulation.html?aegisFixture='+r.id+'&count=5">Try local fixture</a></nav></article>').join('');
fs.writeFileSync(path.join(out,'index.html'),'<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>AEGIS · 25 workspace designs</title><style>body{margin:0;padding:40px;background:#111418;color:#e0e4e8;font:15px/1.6 Inter,system-ui,sans-serif}h1{font-size:38px;letter-spacing:-.04em;margin:0}header{max-width:780px;margin-bottom:40px}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(350px,1fr));gap:28px}article{background:#1c2026;border:1px solid #353b43;border-radius:16px;overflow:hidden}img{width:100%;aspect-ratio:1.5;object-fit:cover}h2,p,nav{margin:18px 22px}h2{font-size:19px}p{color:#b3bbc4}nav{display:flex;flex-wrap:wrap;gap:16px}a{color:#b6d4c5}footer{margin-top:40px}</style><header><h1>AEGIS Work · 25 workspace designs</h1><p>Actual captures of the production canvas, using clearly labeled local fixtures. Select a design to inspect its composition, selection toolbar and focused reading state. These captures demonstrate presentation; they do not claim connected accounts, executed code changes or live research.</p></header><main>'+cards+'</main><footer>Generated from the production family registry. See docs/v20 for implementation status, test evidence and rollback.</footer></html>');
console.log('Wrote 25 design packages and visual index');

import { emptyGeometry, type LayoutInput, type LayoutNode, type LayoutPlan, type Rect, type Geometry } from './types';
export const STRATEGIES = [
    ['pipeline', 'Horizontal pipeline'], ['timeline', 'Vertical timeline'], ['milestones', 'Milestone groups'],
    ['tree', 'Left-to-right branching tree'], ['hierarchy', 'Top-down hierarchy'], ['dependency', 'Service dependency graph'],
    ['swimlanes', 'Agent swimlanes'], ['evidence', 'Evidence clusters'], ['subgraphs', 'Grouped subgraphs'],
    ['radial', 'Question-centered radial'], ['hub', 'Synthesis hub-and-spoke'],
    ['comparison', 'Comparison columns'], ['matrix', 'Matrix'], ['gallery', 'Document/media gallery'],
    ['editorial', 'Mixed editorial'], ['cause', 'Cause-and-effect'], ['converging', 'Converging multi-agent']
] as const;
import { GAP, packedRows, freeRectangle, masonry } from './packing';
export const overlap = (a: Rect, b: Rect, pad = 0) => a.x < b.x + b.width + pad && a.x + a.width + pad > b.x && a.y < b.y + b.height + pad && a.y + a.height + pad > b.y;
const center = (n: Rect) => ({ x: n.x + n.width / 2, y: n.y + n.height / 2 });
const isSource = (n: LayoutNode) => /source|page|part|link|input/.test(n.type);
const isAgent = (n: LayoutNode) => /agent/.test(n.type);
const isDocument = (n: LayoutNode) => /paper|result|document|media/.test(n.type);
export function eligibility(input: LayoutInput, id: string): string {
    const ns = input.nodes.filter(n => !n.container), es = input.edges;
    if (['tree', 'hierarchy', 'dependency', 'cause'].includes(id) && !es.length)
        return 'Needs recorded connections.';
    if (['swimlanes', 'converging'].includes(id) && ns.filter(isAgent).length < 2)
        return 'Needs at least two recorded agents.';
    if (id === 'evidence' && !ns.some(isSource))
        return 'Needs source cards.';
    if (id === 'gallery' && !ns.some(isDocument))
        return 'Needs documents or media.';
    if (['comparison', 'matrix', 'milestones'].includes(id) && new Set(ns.map(n => n.group).filter(Boolean)).size < 2)
        return 'Needs at least two recorded groups.';
    if (id === 'radial' && !ns.some(n => /request|objective/.test(n.type)))
        return 'Needs a question card.';
    if (id === 'hub' && !ns.some(isDocument))
        return 'Needs a synthesis or document card.';
    return '';
}
function components(nodes: LayoutNode[], edges: LayoutInput['edges']): LayoutNode[][] {
    const todo = new Map(nodes.map(n => [n.id, n])), out: LayoutNode[][] = [];
    while (todo.size) {
        const root = todo.keys().next().value!;
        const ids = [root], block: LayoutNode[] = [];
        for (let i = 0; i < ids.length; i++) {
            const n = todo.get(ids[i]);
            if (!n)
                continue;
            todo.delete(n.id);
            block.push(n);
            for (const e of edges) {
                if (e.source === n.id && todo.has(e.target))
                    ids.push(e.target);
                if (e.target === n.id && todo.has(e.source))
                    ids.push(e.source);
            }
        }
        out.push(block);
    }
    return out;
}
function levels(nodes: LayoutNode[], edges: LayoutInput['edges']): Map<string, number> {
    // Condense cycles first: cyclic dependencies remain together instead of looping.
    const reach = new Map(nodes.map(n => [n.id, [] as string[]]));
    edges.forEach(e => { if (reach.has(e.source) && reach.has(e.target))
        reach.get(e.source)!.push(e.target); });
    let index = 0;
    const stack: string[] = [], on = new Set<string>(), idx = new Map<string, number>(), low = new Map<string, number>(), comps: string[][] = [];
    function visit(v: string) {
        idx.set(v, index);
        low.set(v, index++);
        stack.push(v);
        on.add(v);
        for (const w of reach.get(v)!) {
            if (!idx.has(w)) {
                visit(w);
                low.set(v, Math.min(low.get(v)!, low.get(w)!));
            }
            else if (on.has(w))
                low.set(v, Math.min(low.get(v)!, idx.get(w)!));
        }
        if (low.get(v) === idx.get(v)) {
            const c: string[] = [];
            let w: string;
            do {
                w = stack.pop()!;
                on.delete(w);
                c.push(w);
            } while (w !== v);
            comps.push(c);
        }
    }
    nodes.forEach(n => { if (!idx.has(n.id))
        visit(n.id); });
    const ci = new Map<string, number>();
    comps.forEach((c, i) => c.forEach(id => ci.set(id, i)));
    const depth = new Map<number, number>();
    function rank(c: number): number { if (depth.has(c))
        return depth.get(c)!; const incoming = edges.filter(e => ci.get(e.target) === c && ci.has(e.source) && ci.get(e.source) !== c).map(e => ci.get(e.source)!); const r = incoming.length ? 1 + Math.max(...incoming.map(rank)) : 0; depth.set(c, r); return r; }
    return new Map(nodes.map(n => [n.id, rank(ci.get(n.id)!)]));
}
const buckets = (nodes: LayoutNode[], key: (n: LayoutNode) => string) => { const m = new Map<string, LayoutNode[]>(); for (const n of nodes) {
    const k = key(n);
    m.set(k, [...(m.get(k) || []), n]);
} return [...m.entries()].sort(([a], [b]) => a.localeCompare(b)); };
function candidate(input: LayoutInput, strategy: string): LayoutPlan {
    const warnings: string[] = [], geometry = emptyGeometry();
    const all = [...input.nodes].map(n => ({...n})).sort((a, b) => a.id.localeCompare(b.id));
    // Paper previews have a bounded reading surface; full documents still open in Reader.
    for (const n of all) if(n.type === 'paper' && !n.constraint?.lockedSize && !n.constraint?.manual && !n.constraint?.pinned && !n.editing && !n.dragging && !(input.incremental && input.known?.includes(n.id)) && !(input.selectedOnly && !n.selected)) {
        n.width = Math.max(n.minWidth ?? 560, Math.min(n.width, 640));
        n.height = Math.max(n.minHeight ?? 640, Math.min(n.height, 800));
    }
    const known = new Set(input.known || []);
    const protectedIds = new Set(all.filter(n => n.constraint?.pinned || n.constraint?.manual || n.editing || n.dragging || (input.selectedOnly && !n.selected) || (input.incremental && known.has(n.id))).map(n => n.id));
    const byId = new Map(all.map(n => [n.id, n]));
    // Protection is structural, not a persisted pin: ancestors and fixed containers keep their contents.
    for (let pass = 0; pass < all.length; pass++) {
        let changed = false;
        for (const n of all) {
            if (n.parentId && protectedIds.has(n.id) && !protectedIds.has(n.parentId)) {
                protectedIds.add(n.parentId);
                changed = true;
            }
            const owner = byId.get(n.parentId || '') || byId.get(n.group || '');
            if (owner && (protectedIds.has(owner.id) || (owner.container && owner.constraint?.lockedSize)) && !protectedIds.has(n.id)) {
                protectedIds.add(n.id);
                changed = true;
            }
        }
        if (!changed)
            break;
    }
    const fixed = (n: LayoutNode) => protectedIds.has(n.id);
    const descendants = (id: string) => all.filter(n => { let p = n.parentId; const seen = new Set<string>(); while (p && !seen.has(p)) {
        if (p === id)
            return true;
        seen.add(p);
        p = byId.get(p)?.parentId;
    } return false; });
    const envelope = (n: LayoutNode, pos: {
        x: number;
        y: number;
    }) => { const ds = [n, ...descendants(n.id)], x = Math.min(...ds.map(d => d.x)), y = Math.min(...ds.map(d => d.y)); return { x: pos.x + x - n.x, y: pos.y + y - n.y, width: Math.max(...ds.map(d => d.x + d.width)) - x, height: Math.max(...ds.map(d => d.y + d.height)) - y }; };
    all.forEach(n => { geometry.positions[n.id] = { x: n.x, y: n.y }; geometry.sizes[n.id] = { width: n.width, height: n.height }; if (n.constraint)
        geometry.constraints[n.id] = { ...n.constraint }; });
    // Parent-owned children and container backgrounds travel with their owner.
    const roots = all.filter(n => !n.container && !n.parentId), movable = roots.filter(n => !fixed(n));
    const rank = levels(roots, input.edges), maxW = Math.max(280, ...roots.map(n => n.width)), maxH = Math.max(160, ...roots.map(n => n.height));
    const ox = Math.min(0, ...roots.map(n => n.x)), oy = Math.min(0, ...roots.map(n => n.y));
    const put = (n: LayoutNode, x: number, y: number) => { if (!fixed(n))
        geometry.positions[n.id] = { x: ox + x, y: oy + y }; };
    const row = (ns: LayoutNode[], x: number, y: number, vertical = false) => { for (const n of ns) {
        put(n, x, y);
        if (vertical)
            y += n.height + GAP;
        else
            x += n.width + GAP;
    } };
    const grid = (ns: LayoutNode[], x: number, y: number, cols: number) => {
        packedRows(ns,cols).forEach((p,i)=>put(ns[i],x+p.x,y+p.y));
    };
    const addGroup = (title: string, ns: LayoutNode[]) => { if (ns.length < 2)
        return; const rs = ns.map(n => ({ ...geometry.positions[n.id], ...geometry.sizes[n.id] })); const x = Math.min(...rs.map(n => n.x)) - 24, y = Math.min(...rs.map(n => n.y)) - 48; geometry.groups.push({ id: 'layout:' + ns[0].id, title, members: ns.map(n => n.id), x, y, width: Math.max(...rs.map(n => n.x + n.width)) - x + 24, height: Math.max(...rs.map(n => n.y + n.height)) - y + 24 }); };
    const grouped = buckets(roots, n => n.group || n.role || n.type);
    if (strategy === 'pipeline')
        row(roots, 0, 0);
    else if (strategy === 'timeline')
        roots.forEach((n, i) => put(n, i % 2 ? 48 : 0, roots.slice(0, i).reduce((s, m) => s + m.height + GAP, 0)));
    else if (['tree', 'hierarchy', 'dependency', 'cause'].includes(strategy)) {
        const bands = buckets(roots, n => String(rank.get(n.id) || 0).padStart(5, '0'));
        let advance=0;
        bands.forEach(([_, ns], l) => {
            if(strategy==='cause') {
                ns.forEach((n,i)=>put(n,l*(maxW+GAP*2),((i%2?1:-1)*Math.ceil(i/2))*(maxH+GAP)));
                return;
            }
            const cols=strategy==='hierarchy'?Math.min(3,ns.length):Math.max(1,Math.ceil(Math.sqrt(ns.length/2)));
            const cells=packedRows(ns,cols);
            const w=Math.max(...ns.map((n,i)=>cells[i].x+n.width));
            const h=Math.max(...ns.map((n,i)=>cells[i].y+n.height));
            ns.forEach((n,i)=>put(n,strategy==='hierarchy'?cells[i].x:advance+cells[i].x,
                strategy==='hierarchy'?advance+cells[i].y:cells[i].y-(strategy==='tree'?h/2:0)));
            advance+=(strategy==='hierarchy'?h:w)+(strategy==='dependency'?64:GAP);
        });
    }
    else if (strategy === 'radial' || strategy === 'hub') {
        const hub = roots.find(strategy === 'radial' ? n => /request|objective/.test(n.type) : isDocument) || roots[0];
        if (hub) {
            put(hub, 0, 0);
            const rest = roots.filter(n => n !== hub);
            const radius = Math.max(maxW + maxH, (rest.length * (maxW + GAP)) / (2 * Math.PI));
            rest.forEach((n, i) => { const angle = -Math.PI / 2 + i * Math.PI * 2 / Math.max(rest.length, 1); put(n, Math.cos(angle) * radius, Math.sin(angle) * radius * (strategy === 'hub' ? .75 : 1)); });
        }
    }
    else if (strategy === 'gallery') {
        let x = 0, y = 0, h = 0;
        const width = 1440; // Logical canvas units: browser size and zoom never change composition.
        [...roots].sort((a, b) => Number(isDocument(b)) - Number(isDocument(a)) || a.id.localeCompare(b.id)).forEach(n => {
            if (x && x + n.width > width) {
                x = 0;
                y += h + 32;
                h = 0;
            }
            put(n, x, y);
            x += n.width + 32;
            h = Math.max(h, n.height);
        });
    }
    else if (strategy === 'editorial') {
        const doc = roots.filter(isDocument), other = roots.filter(n => !isDocument(n));
        const cols=Math.max(2,Math.min(3,Math.ceil(Math.sqrt(other.length/4))));
        const sorted=[...other].sort((a,b)=>(rank.get(a.id)??0)-(rank.get(b.id)??0)||a.id.localeCompare(b.id));
        masonry(sorted,cols).forEach((p,i)=>put(sorted[i],p.x,p.y));
        const right=other.length?cols*(Math.max(280,...other.map(n=>n.width))+GAP):0;
        row(doc,right,0,true);
    }
    else if (strategy === 'converging') {
        const agents = roots.filter(isAgent), lead = agents.find(n => /lead|synth/i.test(n.role || n.title)) || agents.at(-1);
        const evidence=roots.filter(n=>!isAgent(n)&&!isDocument(n));
        const helpers=agents.filter(n=>n!==lead);
        const helperCells=packedRows(helpers,Math.max(1,Math.min(3,helpers.length)));
        helperCells.forEach((p,i)=>put(helpers[i],p.x,p.y));
        const header=helpers.length?Math.max(...helpers.map((n,i)=>helperCells[i].y+n.height))+GAP:0;
        const cols=evidence.length>3?2:1;
        masonry(evidence,cols).forEach((p,i)=>put(evidence[i],p.x,header+p.y));
        const edge=Math.max(cols*(Math.max(280,...evidence.map(n=>n.width))+GAP),
            ...helpers.map((n,i)=>helperCells[i].x+n.width+GAP));
        if(lead)put(lead,edge,0);
        row(roots.filter(isDocument),edge,lead?lead.height+GAP:0,true);
    }
    else {
        const groups = strategy === 'subgraphs' ? components(roots, input.edges).map((ns, i) => ['Connected group ' + (i + 1), ns] as [
            string,
            LayoutNode[]
        ]) :
            strategy === 'evidence' ? buckets(roots, n => n.group || (isSource(n) ? 'Collected evidence' : n.type)) :
                strategy === 'swimlanes' ? buckets(roots, n => n.role || n.group || n.type) : grouped;
        let x = 0, y = 0;
        groups.forEach(([title, ns], g) => {
            if (strategy === 'matrix')
                ns.forEach((n, i) => put(n, g * (maxW + 80), i * (maxH + 80)));
            else if (strategy === 'comparison')
                row(ns, x, 0, true);
            else if (strategy === 'milestones') {
                grid(ns, x, g % 2 ? 80 : 0, 2);
            }
            else if (strategy === 'swimlanes')
                row(ns, 0, y);
            else
                grid(ns, x, y, Math.max(1, Math.ceil(Math.sqrt(ns.length))));
            if (strategy === 'swimlanes')
                y += maxH + 120;
            else if (strategy === 'evidence') {
                x += (Math.ceil(Math.sqrt(ns.length)) * (maxW + GAP)) + 80;
                if (g % 2 === 1) {
                    x = 0;
                    y += Math.ceil(Math.sqrt(ns.length)) * (maxH + GAP) + 120;
                }
            }
            else if (strategy === 'subgraphs') {
                y += Math.ceil(Math.sqrt(ns.length)) * (maxH + GAP) + 120;
            }
            else
                x += (strategy === 'milestones' ? 2 : 1) * (maxW + GAP) + 80;
            addGroup(title, ns);
        });
    }
    // Stable arrivals stay near recorded neighbours, not at the bottom of a global column.
    const occupied: Rect[] = roots.filter(fixed).map(n => envelope(n,n));
    const placedIds = new Set(roots.filter(fixed).map(n=>n.id));
    for (const n of movable) {
        let initial = geometry.positions[n.id];
        if (input.incremental) {
            const neighbours = input.edges.flatMap(e => e.source===n.id?[e.target]:e.target===n.id?[e.source]:[])
                .filter(id=>placedIds.has(id)).sort();
            const near = neighbours[0] ?? [...placedIds].sort()[0];
            if(near)initial={x:geometry.positions[near].x+geometry.sizes[near].width+GAP,y:geometry.positions[near].y};
        }
        const box=envelope(n,initial), r=freeRectangle(box,occupied);
        geometry.positions[n.id]={x:initial.x+r.x-box.x,y:initial.y+r.y-box.y};
        occupied.push(r); placedIds.add(n.id);
    }
    const positioned = new Set<string>();
    function placeChild(n: LayoutNode, chain = new Set<string>()) {
        if (positioned.has(n.id) || !n.parentId || fixed(n))
            return;
        if (chain.has(n.id)) {
            warnings.push('Invalid cyclic container ownership.');
            return;
        }
        chain.add(n.id);
        const parent = byId.get(n.parentId);
        if (!parent)
            return;
        placeChild(parent, chain);
        const pos = geometry.positions[parent.id];
        geometry.positions[n.id] = { x: pos.x + n.x - parent.x, y: pos.y + n.y - parent.y };
        positioned.add(n.id);
    }
    all.forEach(n => placeChild(n));
    // Background map groups are resized around their known children, never treated as cards.
    for (const n of all.filter(n => n.container)) {
        const members = all.filter(c => c.group === n.id);
        if (!members.length || fixed(n))
            continue;
        const rs = members.map(m => ({ ...geometry.positions[m.id], ...geometry.sizes[m.id] }));
        const x = Math.min(...rs.map(r => r.x)) - 24, y = Math.min(...rs.map(r => r.y)) - 48;
        geometry.positions[n.id] = { x, y };
        if (!n.constraint?.lockedSize)
            geometry.sizes[n.id] = { width: Math.max(...rs.map(r => r.x + r.width)) - x + 24, height: Math.max(...rs.map(r => r.y + r.height)) - y + 24 };
    }
    for (const n of all.filter(n => n.container && (fixed(n) || n.constraint?.lockedSize))) {
        const box = {...geometry.positions[n.id], ...geometry.sizes[n.id]};
        const outside = all.filter(c => c.group === n.id).some(c => {
            const r = {...geometry.positions[c.id], ...geometry.sizes[c.id]};
            return r.x < box.x || r.y < box.y || r.x+r.width > box.x+box.width || r.y+r.height > box.y+box.height;
        });
        if (outside) warnings.push('The locked group '+n.title+' cannot contain its cards. Release its constraints before arranging.');
    }
    // Recalculate presentation bounds after obstacle avoidance.
    geometry.groups = geometry.groups.map(g => { const rs = g.members.map(id => ({ ...geometry.positions[id], ...geometry.sizes[id] })); const x = Math.min(...rs.map(r => r.x)) - 24, y = Math.min(...rs.map(r => r.y)) - 48; return { ...g, x, y, width: Math.max(...rs.map(r => r.x + r.width)) - x + 24, height: Math.max(...rs.map(r => r.y + r.height)) - y + 24 }; });
    const order = input.nodes.filter(n => Math.hypot(geometry.positions[n.id].x - n.x, geometry.positions[n.id].y - n.y) > .5 || geometry.sizes[n.id].width !== n.width || geometry.sizes[n.id].height !== n.height).map(n => n.id);
    const displacement = roots.reduce((s, n) => s + Math.hypot(geometry.positions[n.id].x - n.x, geometry.positions[n.id].y - n.y), 0) / Math.max(1, roots.length);
    const rs = roots.map(n => ({ ...geometry.positions[n.id], ...geometry.sizes[n.id] }));
    const width = rs.length ? Math.max(...rs.map(r => r.x + r.width)) - Math.min(...rs.map(r => r.x)) : 0;
    const height = rs.length ? Math.max(...rs.map(r => r.y + r.height)) - Math.min(...rs.map(r => r.y)) : 0;
    let crossings = 0;
    const segments = input.edges.filter(e => geometry.positions[e.source] && geometry.positions[e.target]).map(e => [center({ ...geometry.positions[e.source], ...geometry.sizes[e.source] }), center({ ...geometry.positions[e.target], ...geometry.sizes[e.target] })]);
    const cross = (a: {
        x: number;
        y: number;
    }, b: {
        x: number;
        y: number;
    }, c: {
        x: number;
        y: number;
    }) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
    for (let i = 0; i < segments.length; i++)
        for (let j = i + 1; j < segments.length; j++) {
            const [a, b] = segments[i], [c, d] = segments[j];
            if (cross(a, b, c) * cross(a, b, d) < 0 && cross(c, d, a) * cross(c, d, b) < 0)
                crossings++;
        }
    let collisions = 0;
    for (let i = 0; i < rs.length; i++)
        for (let j = i + 1; j < rs.length; j++)
            if (overlap(rs[i], rs[j]))
                collisions++;
    if (collisions)
        warnings.push('Some protected cards overlap. Release their position constraints to arrange them.');
    const area=width*height, used=rs.reduce((s,r)=>s+r.width*r.height,0);
    const longEdges=segments.reduce((s,[a,b])=>s+Math.hypot(a.x-b.x,a.y-b.y),0);
    const aspect=width && height ? Math.max(width/height/2, height/width*1.2, 1)-1 : 0;
    const text=(input.topic ?? '').toLowerCase();
    const preference=/compar|versus|vs\\b/.test(text)?['comparison','matrix']:
        /architect|dependenc|system design/.test(text)?['tree','dependency','hierarchy']:
        roots.filter(isAgent).length>=3?['swimlanes','converging']:['editorial','evidence','gallery'];
    const semantic=preference.includes(strategy)?-120:0;
    const score = collisions*1e9 + crossings*90 + area/5000 + Math.max(0,area-used)/2000 + longEdges*.06 + aspect*1000 + displacement*.025 + semantic;
    return { strategy, reason: STRATEGIES.find(s => s[0] === strategy)?.[1] + ' — arranged from existing cards and recorded connections.', geometry, order, routes: input.edges, warnings, requiresPreview: !input.incremental && (order.length > 20 || geometry.groups.length > 0 || displacement > 1200), score };
}
export function planLayout(input: LayoutInput): LayoutPlan {
    if (input.nodes.length > 1000)
        throw Error('Arrange up to 1,000 canvas nodes at once.');
    if (input.nodes.some(n => ![n.x, n.y, n.width, n.height].every(Number.isFinite) || n.width <= 0 || n.height <= 0))
        throw Error('Wait for valid card dimensions before arranging.');
    if (input.strategy !== 'auto') {
        if (!STRATEGIES.some(s => s[0] === input.strategy))
            throw Error('Unknown arrangement');
        const why = eligibility(input, input.strategy);
        if (why)
            throw Error(why);
        return candidate(input, input.strategy);
    }
    // One-dimensional recipes remain explicit choices; Auto avoids long chains.
    const ranked = STRATEGIES.filter(([id]) => !eligibility(input, id) && !(input.nodes.length>6 && ['pipeline','timeline'].includes(id))).map(([id]) => candidate(input, id)).sort((a, b) => a.score - b.score || a.strategy.localeCompare(b.strategy));
    const topic=(input.topic ?? '').toLowerCase();
    const preferred=/compar|versus|\\bvs\\b/.test(topic)?['comparison','matrix']:
        /architect|dependenc|system design/.test(topic)?['tree','dependency','hierarchy']:
        input.nodes.filter(isAgent).length>=3?['swimlanes','converging']:[];
    const semantic=ranked.filter(p=>preferred.includes(p.strategy)&&!p.warnings.length);
    // Prefer appropriate topology only within a bounded spatial-quality penalty.
    const best=ranked[0];
    const footprint=(p:LayoutPlan)=>{
        const rs=input.nodes.filter(n=>!n.container&&!n.parentId).map(n=>({...p.geometry.positions[n.id],...p.geometry.sizes[n.id]}));
        const w=Math.max(...rs.map(r=>r.x+r.width))-Math.min(...rs.map(r=>r.x));
        const h=Math.max(...rs.map(r=>r.y+r.height))-Math.min(...rs.map(r=>r.y));
        return {area:w*h,ratio:Math.max(w/h,h/w)};
    };
    const baseline=best?footprint(best):{area:1,ratio:1};
    return semantic.find(p=>{const f=footprint(p);return f.ratio<=4&&f.area<=baseline.area*3;}) ?? best ?? candidate(input,'editorial');
}

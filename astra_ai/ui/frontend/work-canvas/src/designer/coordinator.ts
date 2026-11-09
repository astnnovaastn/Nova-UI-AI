import { emptyRecord, emptyGeometry, type CanvasDesignerApi, type Geometry, type LayoutRecord, type LayoutSave, type LayoutInput, type LayoutPlan, type Cursor, type Snapshot } from './types';
export type DesignerActions = {
    getCanvasLayout(page: string): Promise<LayoutRecord>;
    saveCanvasLayout(page: string, payload: LayoutSave): Promise<LayoutRecord>;
};
export type Phase = 'loading' | 'idle' | 'planning' | 'preview' | 'moving' | 'paused' | 'saving' | 'unsaved';
export function geometryOf(snapshot: Snapshot): Geometry {
    const g = emptyGeometry();
    for (const n of snapshot.nodes) {
        g.positions[n.id] = { x: n.x, y: n.y };
        g.sizes[n.id] = { width: n.width, height: n.height };
        if (n.constraint)
            g.constraints[n.id] = { ...n.constraint };
    }
    return g;
}
export const ease = (t: number) => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
export class Designer {
    record = emptyRecord();
    phase: Phase = 'loading';
    message = 'Loading saved arrangement…';
    plan: LayoutPlan | null = null;
    cursors: Cursor[] = [];
    strategy = 'auto';
    cursorMode = 'one';
    follow = false;
    selectedOnly = false;
    automatic = false;
    private dead = false;
    private worker: Worker;
    private workerFailed = false;
    private request = 0;
    private frame = 0;
    private poll = 0;
    private quiet = 0;
    private before: Geometry | null = null;
    private pending: LayoutSave | null = null;
    private elapsed = 0;
    private last = 0;
    private hiddenPaused = false;
    private jobs: {
        id: string;
        start: number;
        duration: number;
        lane: number;
        from: {
            x: number;
            y: number;
        };
    }[] = [];
    private watchdog = 0;
    private refreshBusy = false;
    private graphKey = '';
    private graphSince = 0;
    private latestGraphKey = '';
    private initiated = false;
    private observedRunning = false;
    private completed = false;
    private finalPending = false;
    private finalPass = false;
    private plannedKey = '';
    topic = '';
    /** Only a live run witnessed in its initiating window can trigger final composition. */
    observeRun(state: string, topic = '') {
        this.topic = topic;
        if (!this.initiated || this.dead) return;
        if (['running','waiting','queued'].includes(state)) this.observedRunning = true;
        if (state === 'completed' && this.observedRunning && !this.completed) {
            this.completed = true; this.finalPending = true;
        }
        this.checkGraph();
    }
    conflict = false;
    private manualBefore: Geometry | null = null;
    private manualDuringSave = false;
    private deferredMoves = new Set<string>();
    /** `organizes` says whether this canvas still wants the organizer to arrange it while a run grows. */
    constructor(public api: CanvasDesignerApi, private actions: DesignerActions, public page: string, private changed: () => void, private applied: (record: LayoutRecord) => void, private organizes: () => boolean = () => true) {
        this.worker = new Worker(new URL('./planner.worker.ts', import.meta.url), { type: 'module' });
        this.worker.onmessage = e => {
            if (this.dead || e.data.id !== this.request || this.phase !== 'planning')
                return;
            clearTimeout(this.watchdog);
            if (e.data.error) {
                this.stop();
                this.phase = 'idle';
                this.message = e.data.error;
                this.changed();
                return;
            }
            this.plan = e.data.plan;
            this.phase = 'preview';
            this.message = this.plan!.reason;
            this.changed();
            if (this.autoApply && (!this.plan!.requiresPreview || this.finalPass))
                this.apply();
        };
        this.worker.onerror = () => { if(this.dead)return;this.workerFailed=true;this.stop();clearTimeout(this.watchdog);this.phase = 'idle'; this.message = 'Layout worker could not load. Retry, or reload after a UI update. Your saved canvas is unchanged.'; this.changed(); };
        try {
            this.initiated = sessionStorage.getItem('aegis-layout-initiator:' + page) === '1';
        }
        catch { }
        window.addEventListener('aegis-canvas-layout', this.remote);
        window.addEventListener('focus', this.refreshEvent);
        document.addEventListener('visibilitychange', this.visibility);
        window.addEventListener('offline', this.disconnected);
        window.addEventListener('keydown', this.userInput, true);
        window.addEventListener('pointerdown', this.userInput, true);
        this.poll = window.setInterval(() => { if (!document.hidden) {
            void this.refresh();
            this.checkGraph();
        } }, 2500);
        void this.refresh(true);
    }
    metrics: {
        frames: number;
        meanFrameMs: number;
        p95FrameMs: number;
    } | null = null;
    private frameDeltas: number[] = [];
    private autoApply = false;
    focusActive() {
        const nodes=this.api.snapshot().nodes;
        const id=this.cursors[0]?.target ?? nodes.find(n=>n.type==='request')?.id ?? nodes.find(n=>n.type==='paper')?.id;
        if(id)this.api.focus?.(id);
    }
    private userInput = () => { if(this.follow){this.follow=false;this.changed();} };
    private remote = (event: Event) => { if ((event as CustomEvent).detail?.research_id === this.page)
        void this.refresh(); };
    private refreshEvent = () => { void this.refresh(); };
    private disconnected = () => { this.stop(); this.message = 'Connection lost. The saved arrangement is unchanged.'; this.changed(); };
    private visibility = () => {
        if (document.hidden && this.phase === 'moving') {
            this.pause();
            this.hiddenPaused = true;
        }
        else if (!document.hidden) {
            void this.refresh();
            if (this.hiddenPaused && this.phase === 'paused')
                this.resume();
            this.hiddenPaused = false;
        }
    };
    async refresh(first = false) {
        if (this.dead || this.refreshBusy || (!first && ['planning', 'moving', 'paused', 'saving', 'unsaved'].includes(this.phase)))
            return;
        this.refreshBusy = true;
        try {
            const next = await this.actions.getCanvasLayout(this.page);
            if (this.dead)
                return;
            if (first || this.phase === 'loading' || next.revision > this.record.revision) {
                this.record = next;
                this.strategy = next.strategy;
                this.automatic = next.automatic || (first && this.initiated);
                if (next.revision) {
                    this.plan = null;
                    this.api.setGeometry(next);
                    this.applied(next);
                }
                this.phase = 'idle';
                this.message = next.revision ? 'Saved arrangement ready.' : 'Organize existing cards. No AI requests.';
            }
            else if (first)
                this.phase = 'idle';
            if (first) {
                this.graphKey = this.initiated ? '' : this.key();
                this.checkGraph();
            }
        }
        catch (e) {
            if (!this.dead) {
                this.message = e instanceof Error ? e.message : 'Layout is unavailable.';
                if (first)
                    this.phase = 'loading';
            }
        }
        finally {
            this.refreshBusy = false;
            this.changed();
        }
    }
    private key() { return this.api.snapshot().nodes.map(n => n.id).sort().join('|'); }
    checkGraph() {
        if (this.dead || !this.automatic || !this.initiated || !this.observedRunning || this.phase !== 'idle' || !this.organizes())
            return;
        const key = this.key();
        if (!key || (key === this.graphKey && !this.finalPending))
            return;
        if (!this.graphSince)
            this.graphSince = performance.now();
        if (this.latestGraphKey === key && this.quiet)
            return;
        this.latestGraphKey = key;
        clearTimeout(this.quiet);
        this.quiet = window.setTimeout(() => { this.quiet = 0; this.graphKey = this.key(); this.graphSince = 0; this.arrange(false, !this.finalPending, this.finalPending); }, Math.max(0, Math.min(900, 3000 - (performance.now() - this.graphSince))));
    }
    input(incremental = false): LayoutInput {
        const s = this.api.snapshot();
        const nodes = s.nodes.map(n => ({ ...n, constraint: this.record.constraints[n.id] || {} }));
        return { ...s, nodes, strategy: this.strategy, topic:this.topic, selectedOnly: this.selectedOnly, incremental, known: Object.keys(this.record.positions) };
    }
    arrange(preview = true, incremental = false, final = false) {
        if (!['idle', 'preview'].includes(this.phase))
            return;
        if(this.workerFailed){const onmessage=this.worker.onmessage,onerror=this.worker.onerror;this.worker.terminate();this.worker=new Worker(new URL('./planner.worker.ts',import.meta.url),{type:'module'});this.worker.onmessage=onmessage;this.worker.onerror=onerror;this.workerFailed=false;}
        this.before = { ...geometryOf(this.api.snapshot()), constraints: structuredClone(this.record.constraints), groups: structuredClone(this.record.groups) };
        this.finalPass = final;
        this.plannedKey = this.key();
        this.plan = null;
        this.phase = 'planning';
        this.message = final ? 'Composing the finished canvas…' : 'Calculating arrangement locally…';
        this.autoApply = !preview;
        this.watchdog = window.setTimeout(() => { if (this.phase === 'planning') {
            this.stop();
            this.workerFailed=true;this.worker.terminate();this.message = 'Planning timed out. Retry with a smaller selection, or reload after a UI update.';
            this.changed();
        } }, 15000);
        try {
            this.worker.postMessage({ id: ++this.request, input: this.input(incremental) });
        }
        catch (e) {
            this.stop();
            this.message = 'Could not prepare this canvas for the layout worker.';
        }
        this.changed();
    }
    apply() {
        if (!this.plan || this.phase !== 'preview')
            return;
        if (this.plan.warnings.length) {
            this.message = this.plan.warnings.join(' ');
            this.changed();
            return;
        }
        const s = this.api.snapshot(), targets = new Set(this.plan.order);
        if (s.nodes.some(n => targets.has(n.id) && (n.editing || n.dragging))) {
            this.message = 'Finish editing or dragging before arranging.';
            this.changed();
            return;
        }
        this.before ??= geometryOf(s);
        this.elapsed = 0;
        this.last = 0;
        this.frameDeltas = [];
        this.metrics = null;
        this.phase = 'moving';
        this.message = this.plan.reason;
        this.api.setAnimating(true);
        const independent = new Set(s.nodes.filter(n => targets.has(n.id)).map(n => n.group || n.role || n.type)).size > 1;
        const lanes = this.cursorMode === 'two' || (this.cursorMode === 'adaptive' && independent && targets.size >= 4) ? 2 : 1;
        const occupied = [0, 0];
        const laneGroups = new Map<string, number>();
        this.jobs = this.plan.order.map(id => {
            const n = s.nodes.find(n => n.id === id)!;
            const group = n.group || n.parentId || id;
            const lane = laneGroups.get(group) ?? (occupied[0] <= occupied[1] ? 0 : lanes - 1);
            laneGroups.set(group, lane);
            const distance = Math.hypot(this.plan!.geometry.positions[id].x - n.x, this.plan!.geometry.positions[id].y - n.y);
            const duration = Math.min(1800, Math.max(1000, 700 + Math.sqrt(distance)*24));
            const start = occupied[lane];
            occupied[lane] += duration + 100;
            return { id, start, duration, lane, from: { x: n.x, y: n.y } };
        });
        // Compress the schedule into waves, never speed up individual drags.
        // One representative cursor owns each wave; other real cards move alongside it.
        const waveSize = Math.max(1, Math.ceil(this.jobs.length / (lanes * 7)));
        const clocks=[0,0], counts=[0,0], waves=[0,0];
        this.jobs=this.jobs.map(j=>{
            const index=counts[j.lane]++;
            if(index%waveSize===0){waves[j.lane]=clocks[j.lane];clocks[j.lane]+=1920;}
            return {...j,start:waves[j.lane]};
        });
        // Parent/child geometry moves as one unit, preserving relative coordinates each frame.
        for (let pass = 0; pass < s.nodes.length; pass++)
            for (const job of this.jobs) {
                const node = s.nodes.find(n => n.id === job.id), parent = this.jobs.find(j => j.id === node?.parentId);
                if (parent) {
                    job.start = parent.start;
                    job.duration = parent.duration;
                }
            }
        if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
            this.api.setGeometry(this.plan.geometry, true);
            void this.finish();
            return;
        }
        this.frame = requestAnimationFrame(this.tick);
        this.changed();
    }
    private tick = (time: number) => {
        if (this.dead || this.phase !== 'moving' || !this.plan || !this.before)
            return;
        if (this.last) {
            const delta = time - this.last;
            this.elapsed += Math.min(64, delta);
            this.frameDeltas.push(delta);
        }
        this.last = time;
        const g: Geometry = structuredClone(this.before);
        g.constraints = this.plan.geometry.constraints;
        g.groups = this.plan.geometry.groups;
        const cursors = new Map<number, Cursor>();
        let remaining = false;
        for (const j of this.jobs) {
            const raw = (this.elapsed - j.start) / j.duration;
            if (raw < 0) {
                remaining = true;
                continue;
            }
            const t = ease(Math.max(0, Math.min(1, (raw - .18) / .72))), to = this.plan.geometry.positions[j.id], from = this.before.positions[j.id], oldSize = this.before.sizes[j.id], size = this.plan.geometry.sizes[j.id];
            if (!from || !to)
                continue;
            g.positions[j.id] = { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t };
            g.sizes[j.id] = { width: oldSize.width + (size.width - oldSize.width) * t, height: oldSize.height + (size.height - oldSize.height) * t };
            if (raw < 1) {
                remaining = true;
                const pos = g.positions[j.id], resize = oldSize.width !== size.width || oldSize.height !== size.height;
                const approach = ease(Math.min(1, raw / .18));
                const preceding=this.jobs.filter(p=>p.lane===j.lane && p.start<j.start);
                const previous=preceding.find(p=>p.start===preceding.at(-1)?.start);
                const previousPos=previous?this.plan.geometry.positions[previous.id]:null;
                const previousSize=previous?this.plan.geometry.sizes[previous.id]:null;
                const previousResized=previous && this.before.sizes[previous.id] && previousSize &&
                    (previousSize.width!==this.before.sizes[previous.id].width || previousSize.height!==this.before.sizes[previous.id].height);
                const grab={x:pos.x+(resize?g.sizes[j.id].width:24),y:pos.y+(resize?g.sizes[j.id].height:20)};
                const origin=previousPos?{x:previousPos.x+(previousResized?previousSize!.width:24),y:previousPos.y+(previousResized?previousSize!.height:20)}:{x:from.x-80,y:from.y-40};
                if(!cursors.has(j.lane))cursors.set(j.lane, { x: raw<.18?origin.x+(grab.x-origin.x)*approach:grab.x, y:raw<.18?origin.y+(grab.y-origin.y)*approach:grab.y, label: j.lane ? 'Organizer' : 'Layout Agent', target: j.id, phase: raw < .15 ? 'approach' : raw > .9 ? 'release' : 'grab' });
            }
        }
        this.api.setGeometry(g, true);
        this.cursors = this.cursorMode === 'off' ? [] : [...cursors.values()];
        if (this.follow && this.cursors.length)
            this.api.follow(this.cursors[0].target);
        this.changed();
        if (remaining)
            this.frame = requestAnimationFrame(this.tick);
        else
            void this.finish();
    };
    private async finish() {
        if (!this.plan || this.dead)
            return;
        const sorted = [...this.frameDeltas].sort((a, b) => a - b);
        this.metrics = sorted.length ? { frames: sorted.length, meanFrameMs: this.frameDeltas.reduce((a, b) => a + b, 0) / sorted.length, p95FrameMs: sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * .95))] } : null;
        this.api.setGeometry(this.plan.geometry, true);
        this.cursors = [];
        // Keep provisional geometry authoritative until the save is acknowledged or cancelled.
        await this.save(this.plan.geometry, this.plan.strategy);
    }
    private async save(geometry: Geometry, strategy = this.strategy, undo = false) {
        this.phase = 'saving';
        this.message = 'Saving arrangement…';
        // Constraints only travel with a card that is on the canvas; the server refuses the rest.
        geometry = { ...geometry, constraints: Object.fromEntries(Object.entries(geometry.constraints ?? {}).filter(([id]) => id in geometry.positions)) };
        this.pending ??= { expected_revision: this.record.revision, operation_id: crypto.randomUUID(), layout: { ...geometry, strategy, automatic: this.automatic }, before: this.before ?? undefined, undo };
        this.changed();
        try {
            const saved = await this.actions.saveCanvasLayout(this.page, this.pending);
            if (this.dead)
                return;
            this.record = saved;
            this.pending = null;
            this.plan = null;
            this.before = null;
            this.phase = 'idle';
            this.message = 'Arrangement saved.';
            this.conflict = false;
            if (!this.manualDuringSave) {
                this.api.setGeometry(saved);
                this.applied(saved);
            }
            else
                this.manualDuringSave = false;
            this.api.setAnimating(false);
            this.graphKey = this.plannedKey || this.key();
            if(this.finalPass) {
                this.finalPass=false;this.finalPending=false;this.initiated=false;
                try { sessionStorage.removeItem('aegis-layout-initiator:'+this.page); } catch {}
            }
            this.changed();
            this.checkGraph();
            if (this.deferredMoves.size) {
                const ids = [...this.deferredMoves];
                this.deferredMoves.clear();
                await this.moved(ids);
            }
        }
        catch (e) {
            if (!this.dead) {
                this.phase = 'unsaved';
                this.conflict = e instanceof Error && /another window|changed.*preview/i.test(e.message);
                this.message = (e instanceof Error ? e.message : 'Save failed') + ' Your arrangement has not been confirmed.';
                this.changed();
            }
        }
    }
    async replan() { if (!this.conflict)
        return; this.stop(); await this.refresh(); if (this.phase === 'idle')
        this.arrange(true); }
    retry() { if (this.phase === 'unsaved' && this.pending)
        void this.save(this.pending.layout, this.pending.layout.strategy, !!this.pending.undo); }
    skip() {
        if(!['moving','paused'].includes(this.phase) || !this.plan)return;
        cancelAnimationFrame(this.frame); void this.finish();
    }
    pause() { if (this.phase !== 'moving')
        return; cancelAnimationFrame(this.frame); this.phase = 'paused'; this.message = 'Arrangement paused.'; this.changed(); }
    resume() { if (this.phase !== 'paused')
        return; this.phase = 'moving'; this.last = 0; this.frame = requestAnimationFrame(this.tick); this.changed(); }
    stop() {
        if (this.phase === 'saving')
            return;
        ++this.request;
        clearTimeout(this.quiet); this.quiet=0;
        if(this.initiated || this.finalPass){this.finalPending=false;this.finalPass=false;this.initiated=false;
            try{sessionStorage.removeItem('aegis-layout-initiator:'+this.page);}catch{}}
        clearTimeout(this.watchdog);
        cancelAnimationFrame(this.frame);
        this.api.setAnimating(false);
        if (this.before)
            this.api.setGeometry(this.before);
        this.before = null;
        this.pending = null;
        this.plan = null;
        this.cursors = [];
        this.conflict = false;
        this.phase = 'idle';
        this.message = 'Arrangement cancelled. Previous positions restored.';
        this.changed();
    }
    async undo() { if (this.phase !== 'idle' || !this.record.previous)
        return; this.before = geometryOf(this.api.snapshot()); await this.save(this.record, this.record.strategy, true); }
    manual(kind: string) { if (kind === 'camera') {
        this.follow = false;
        this.changed();
        return;
    } if (['moving', 'paused', 'planning', 'preview', 'unsaved'].includes(this.phase))
        this.stop(); if (this.phase === 'saving')
        this.manualDuringSave = true; this.manualBefore = geometryOf(this.api.snapshot()); }
    async moved(ids: string[]) {
        if (this.dead)
            return;
        if (this.phase === 'saving') {
            ids.forEach(id => this.deferredMoves.add(id));
            return;
        }
        if (this.phase !== 'idle')
            return;
        const g = geometryOf(this.api.snapshot());
        g.constraints = structuredClone(this.record.constraints);
        g.groups = structuredClone(this.record.groups);
        for (const id of ids)
            if (g.positions[id])
                g.constraints[id] = { ...g.constraints[id], manual: true };
        this.before = this.record.revision ? { ...this.record } : this.manualBefore;
        this.manualBefore = null;
        await this.save(g);
    }
    async constraint(ids: string[], kind: 'pinned' | 'lockedSize' | 'manual') {
        if (this.phase !== 'idle')
            return;
        const g = geometryOf(this.api.snapshot());
        g.groups = structuredClone(this.record.groups);
        g.constraints = structuredClone(this.record.constraints);
        const next = kind === 'manual' ? false : !ids.every(id => g.constraints[id]?.[kind]);
        for (const id of ids)
            if (g.positions[id])
                g.constraints[id] = {
                    ...g.constraints[id],
                    [kind]: next,
                    ...(kind === 'manual' ? { pinned: false } : {}),
                };
        this.before = this.record.revision ? { ...this.record } : geometryOf(this.api.snapshot());
        await this.save(g);
    }
    dispose() {
        this.dead = true;
        ++this.request;
        cancelAnimationFrame(this.frame);
        clearInterval(this.poll);
        clearTimeout(this.quiet);
        clearTimeout(this.watchdog);
        this.worker.terminate();
        this.api.setAnimating(false);
        window.removeEventListener('aegis-canvas-layout', this.remote);
        window.removeEventListener('focus', this.refreshEvent);
        window.removeEventListener('offline', this.disconnected);
        window.removeEventListener('keydown', this.userInput, true);
        window.removeEventListener('pointerdown', this.userInput, true);
        document.removeEventListener('visibilitychange', this.visibility);
    }
}

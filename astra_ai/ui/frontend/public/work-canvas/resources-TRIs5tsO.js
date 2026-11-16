import { $ as e, _t as t, at as n, ht as r, yt as i } from "./index-client-C_2wYFnt.js";
import { i as a, n as o, r as s } from "./index-client-RfUBbaI1.js";
import { n as c, t as l } from "./close-CwepY0WV.js";
import { t as u } from "./native-events-Bexa20bU.js";
import { t as d } from "./bindings-CWWuBYk9.js";
import { t as f } from "./platform-Mb6CdXdB.js";
// upstream/src/domain/resources/transport.ts
var p = 9e3;
async function m(e, t, n) {
	let r = await c(Promise.resolve().then(() => d.resourceCall(e, t)), p, n);
	if (r.state !== "received") return {
		kind: "error",
		error: "outcome_unknown"
	};
	let i = r.value;
	return i.profile !== e && i.response.kind !== "error" ? {
		kind: "error",
		error: "unavailable"
	} : i.response;
}
// upstream/src/domain/resources/resource-model.ts
var h = 1e3;
function g(e, t) {
	return [...new Map([...e, ...t].map((e) => [e.id, e])).values()].slice(0, h);
}
function _(e, t) {
	let n = e.findIndex((e) => e.id === t.id);
	if (n < 0) return [t, ...e].slice(0, h);
	let r = [...e];
	return r[n] = t, r;
}
function v(e, t) {
	let n = (e) => /^[1-9][0-9]{0,18}$/u.test(e);
	return n(e) && n(t) && BigInt(e) > BigInt(t);
}
// upstream/src/domain/resources/tasks.svelte.ts
var y = 100, b = 180, x = 100, S = 1e3, C = [
	500,
	1500,
	4e3
], w = /* @__PURE__ */ new Set([
	"status",
	"schedule",
	"deadline",
	"organization"
]), T = "pending:", E = () => ({
	inbox: 0,
	today: 0,
	overdue: 0,
	upcoming: 0,
	all: 0,
	completed: 0,
	trash: 0
});
function D() {
	let e = new a();
	return `${e.getFullYear()}-${String(e.getMonth() + 1).padStart(2, "0")}-${String(e.getDate()).padStart(2, "0")}`;
}
function O(e) {
	return {
		list: e.details?.list ?? null,
		inbox: e.details?.inbox ?? !1,
		priority: e.details?.priority ?? "none",
		steps: e.details?.steps ?? [],
		completed_at: e.details?.completed_at ?? null,
		deadline: e.details?.deadline ?? null,
		duration: e.details?.duration ?? null
	};
}
function k(e, t) {
	let n = O(t);
	return {
		id: e,
		list: n.list,
		inbox: n.inbox,
		priority: n.priority,
		steps: n.steps.length,
		steps_done: n.steps.filter((e) => e.completed).length,
		completed_at: n.completed_at,
		deadline: n.deadline,
		duration: n.duration
	};
}
function A(e, t, n) {
	return {
		id: e.id,
		revision: e.revision,
		title: e.title,
		description: n?.description ?? null,
		createdAt: n?.createdAt ?? null,
		pinned: e.pinned,
		updatedAt: e.updated_at,
		status: e.status ?? (e.completed ? "done" : "open"),
		assignee: e.assignee ?? "user",
		origin: e.origin ?? "user",
		dueDate: e.due_date,
		dueTime: e.due_time,
		deadline: t?.deadline ?? null,
		duration: t?.duration ?? null,
		context: e.context,
		sortKey: e.sort_key,
		work: e.work,
		pending: !1,
		list: t?.list ?? null,
		inbox: t?.inbox ?? !1,
		priority: t?.priority ?? "none",
		steps: n?.steps,
		stepCount: t?.steps ?? 0,
		stepDone: t?.steps_done ?? 0,
		completedAt: t?.completed_at ?? null
	};
}
function j(e) {
	let t = e.draft.content.kind === "task" ? e.draft.content : null;
	return {
		id: e.id,
		revision: e.revision,
		title: e.draft.title,
		pinned: e.draft.pinned,
		updated_at: e.updated_at,
		completed: t?.completed ?? null,
		due_date: t?.due_date ?? null,
		due_time: t?.due_time ?? null,
		status: t?.status ?? null,
		assignee: t?.assignee ?? null,
		origin: t?.origin ?? null,
		context: t?.context ?? null,
		sort_key: t?.sort_key ?? null,
		work: t?.work ?? null
	};
}
function M(e) {
	switch (e.field) {
		case "title": return { title: e.value };
		case "description": return { description: e.value };
		case "status": return { status: e.value };
		case "schedule": return {
			dueDate: e.date,
			dueTime: e.time
		};
		case "deadline": return { deadline: e.date };
		case "duration": return { duration: e.minutes };
		case "organization": return {
			list: e.list,
			inbox: e.inbox
		};
		case "priority": return { priority: e.value };
		case "steps": return {
			steps: e.value,
			stepCount: e.value.length,
			stepDone: e.value.filter((e) => e.completed).length
		};
		case "pinned": return { pinned: e.value };
		case "position": return { sortKey: e.sort_key };
	}
}
function N(e, t) {
	switch (t.field) {
		case "title": return {
			field: "title",
			value: e.title
		};
		case "description": return e.description === null ? null : {
			field: "description",
			value: e.description
		};
		case "status": return {
			field: "status",
			value: e.status
		};
		case "schedule": return {
			field: "schedule",
			date: e.dueDate,
			time: e.dueTime
		};
		case "deadline": return {
			field: "deadline",
			date: e.deadline
		};
		case "duration": return {
			field: "duration",
			minutes: e.duration
		};
		case "organization": return {
			field: "organization",
			list: e.list,
			inbox: e.inbox
		};
		case "priority": return {
			field: "priority",
			value: e.priority
		};
		case "steps": return e.steps ? {
			field: "steps",
			value: e.steps
		} : null;
		case "pinned": return {
			field: "pinned",
			value: e.pinned
		};
		case "position": return {
			field: "position",
			sort_key: e.sortKey
		};
	}
}
function P(e) {
	return new Map(e.map((e) => [e.id, e]));
}
function F(e, t) {
	return e.length === t.length && e.every((e, n) => e.id === t[n].id && e.title === t[n].title && e.completed === t[n].completed);
}
var I = class {
	profile;
	#e = t([]);
	get items() {
		return e(this.#e);
	}
	set items(e) {
		r(this.#e, e);
	}
	#t = t("");
	get query() {
		return e(this.#t);
	}
	set query(e) {
		r(this.#t, e, !0);
	}
	#n = t("all");
	get scope() {
		return e(this.#n);
	}
	set scope(e) {
		r(this.#n, e, !0);
	}
	#r = t(null);
	get listId() {
		return e(this.#r);
	}
	set listId(e) {
		r(this.#r, e, !0);
	}
	#i = t([]);
	get lists() {
		return e(this.#i);
	}
	set lists(e) {
		r(this.#i, e);
	}
	#a = new o();
	#o = t(null);
	#s = t(null);
	#c = null;
	#l = t("");
	get day() {
		return e(this.#l);
	}
	set day(e) {
		r(this.#l, e, !0);
	}
	#u = t(!1);
	get trash() {
		return e(this.#u);
	}
	set trash(e) {
		r(this.#u, e, !0);
	}
	#d = t(!1);
	get loading() {
		return e(this.#d);
	}
	set loading(e) {
		r(this.#d, e, !0);
	}
	#f = t(null);
	get error() {
		return e(this.#f);
	}
	set error(e) {
		r(this.#f, e, !0);
	}
	#p = t(null);
	get next() {
		return e(this.#p);
	}
	set next(e) {
		r(this.#p, e, !0);
	}
	#m = t(E());
	get counts() {
		return e(this.#m);
	}
	set counts(e) {
		r(this.#m, e);
	}
	#h = t("");
	get captureDraft() {
		return e(this.#h);
	}
	set captureDraft(e) {
		r(this.#h, e, !0);
	}
	#g = t(null);
	get captureContext() {
		return e(this.#g);
	}
	set captureContext(e) {
		r(this.#g, e);
	}
	#_ = t(null);
	get selectedId() {
		return e(this.#_);
	}
	set selectedId(e) {
		r(this.#_, e, !0);
	}
	#v = t(null);
	get notice() {
		return e(this.#v);
	}
	set notice(e) {
		r(this.#v, e);
	}
	#y = new o();
	#b = new o();
	#x = new o();
	#S = new o();
	#C = new o();
	#w = new o();
	#T = t([]);
	#E = 0;
	#D = t(null);
	#O = null;
	#k = !1;
	#A = 0;
	#j = 0;
	#M = null;
	#N;
	#P;
	#F;
	#I = new s();
	#L;
	removeCloseTask;
	constructor(e) {
		this.profile = e, this.removeCloseTask = l(() => this.flush());
	}
	#R = /* @__PURE__ */ new WeakMap();
	#z = i(() => P(this.items));
	#B = i(() => this.items.flatMap((e) => {
		let t = this.#a.get(e.id), n = this.#y.get(e.id), r = this.#x.get(e.id), i = this.#b.get(e.id);
		if (r?.some((e) => e.hide && !e.error)) return [];
		let a = this.#R.get(e), o;
		if (a && a.meta === t && a.body === n && a.jobs === r && a.draft === i) o = a.row;
		else {
			o = A(e, t, n);
			for (let e of r ?? []) o = {
				...o,
				...e.patch
			};
			o = {
				...o,
				...i,
				pending: r !== void 0 || i !== void 0
			}, this.#R.set(e, {
				meta: t,
				body: n,
				jobs: r,
				draft: i,
				row: o
			});
		}
		return !this.#H(o) && !r?.some((e) => e.error) ? [] : [o];
	}));
	get rows() {
		return e(this.#B);
	}
	set rows(e) {
		r(this.#B, e);
	}
	#V = i(() => e(this.#s) ?? e(this.#D)?.error ?? [...this.#x.values()].flat().find((e) => e.error)?.error ?? this.error);
	get failure() {
		return e(this.#V);
	}
	set failure(e) {
		r(this.#V, e);
	}
	saving(e) {
		return this.#S.has(e);
	}
	get active() {
		return this.#k;
	}
	get undoable() {
		return e(this.#T).length > 0;
	}
	get empty() {
		return !this.loading && this.rows.length === 0 && this.failure === null;
	}
	get retained() {
		return this.#x.size > 0 || this.#b.size > 0 || e(this.#D) !== null || e(this.#o) !== null || this.captureDraft.length > 0;
	}
	#H(e) {
		return this.trash || this.query.trim() ? !0 : this.listId ? e.list === this.listId : this.scope !== "inbox" || e.inbox;
	}
	async start(e = "") {
		if (this.#k) return;
		this.query = e.slice(0, 512), this.#k = !0;
		let t = ++this.#A;
		try {
			let e = await u.resourceChanged.listen(({ payload: e }) => {
				t === this.#A && e.profile === this.profile && (e.kind === "task" ? this.#te(e.id, e.revision) : e.kind === "task_list" && this.#ce());
			});
			if (!this.#k || t !== this.#A) {
				e();
				return;
			}
			this.#M = e, await this.reload();
		} catch {
			this.error = "unavailable";
		}
	}
	stop() {
		if (!this.#k) return;
		this.#k = !1;
		let e = ++this.#A;
		this.#j++, clearTimeout(this.#L), clearTimeout(this.#N), clearTimeout(this.#P), clearTimeout(this.#F), this.#I.clear(), this.#M?.(), this.#M = null, this.flush().then((t) => {
			e === this.#A && (this.loading = !1, t && !this.retained && (this.error = null));
		});
	}
	async flush() {
		for (let e of this.#C.values()) clearTimeout(e);
		this.#C.clear();
		let t = [...this.#w.values()];
		this.#w.clear();
		for (let e of t) e(!0);
		return await Promise.allSettled([
			...this.#S.values(),
			...this.#O ? [this.#O] : [],
			...this.#c ? [this.#c] : []
		]), this.#x.size === 0 && this.#b.size === 0 && e(this.#D) === null && e(this.#o) === null;
	}
	search(e) {
		this.query = e.slice(0, 512), clearTimeout(this.#L), this.#L = setTimeout(() => void this.reload(!1, !0), b);
	}
	setView(e, t, n = this.listId) {
		(e !== this.scope || t !== this.day || n !== this.listId) && (this.listId = n, this.scope = e, this.day = t, this.#k && this.reload(!1, !0));
	}
	showTrash(e) {
		this.trash !== e && (this.trash = e, this.#k && this.reload(!1, !0));
	}
	async retry() {
		if (this.error = null, e(this.#D) && await this.#U(), e(this.#o)) {
			if (e(this.#s) === "conflict") {
				await this.reload();
				let t = e(this.#o).intent;
				if (t.kind === "rename_task_list" || t.kind === "delete_task_list") {
					let n = this.lists.find((e) => e.id === t.id);
					n && r(this.#o, {
						...e(this.#o),
						request_id: crypto.randomUUID(),
						intent: {
							...t,
							expected_revision: n.revision
						}
					});
				}
			}
			await this.#ie();
		}
		for (let [e, t] of this.#x) {
			for (let e of t) e.error !== "outcome_unknown" && (e.command = void 0, e.expect = void 0), e.error = null;
			this.#x.set(e, [...t]), await this.#Q(e);
		}
		await this.reload();
	}
	async discard() {
		for (let e of this.#C.values()) clearTimeout(e);
		this.#C.clear(), this.#w.clear(), this.#x.clear(), this.#b.clear(), r(this.#D, null), r(this.#o, null), r(this.#s, null), this.error = null, await this.reload();
	}
	async reload(e = !1, t = !1) {
		if (clearTimeout(this.#N), !this.#k || e && (!this.next || this.loading)) return;
		let n = ++this.#j;
		this.loading = !0;
		let r = this.day || D(), i = this.query.trim(), a = {
			list: i ? null : this.listId,
			view: this.trash ? "trash" : i ? "all" : this.scope,
			today: r,
			search: i,
			limit: y
		}, o = await this.#le({
			kind: "list_tasks",
			query: {
				...a,
				after: e ? this.next : null
			}
		});
		if (n !== this.#j || !this.#k) return;
		if (o.kind !== "task_page") {
			this.loading = !1, this.error = o.kind === "error" ? o.error : "unavailable";
			return;
		}
		let s = o, c = e || t ? y : Math.max(y, this.items.length);
		for (; s.next && s.items.length < c;) {
			if (o = await this.#le({
				kind: "list_tasks",
				query: {
					...a,
					after: s.next
				}
			}), n !== this.#j || !this.#k) return;
			if (o.kind !== "task_page") {
				this.loading = !1, this.error = o.kind === "error" ? o.error : "unavailable";
				return;
			}
			s.items = g(s.items, o.items), s.next = o.next, s.counts = o.counts, s.lists = o.lists, s.metadata = [...s.metadata, ...o.metadata];
		}
		this.error = null, this.loading = !1, this.counts = s.counts, this.lists = s.lists;
		for (let e of s.metadata) this.#a.set(e.id, e);
		let l = this.items.filter((e) => (this.#x.has(e.id) || this.#b.has(e.id)) && !s.items.some((t) => t.id === e.id));
		this.items = e ? g(this.items, s.items) : g(s.items, l), this.next = s.next, e || this.#re();
		let u = this.items.find((e) => e.id === this.selectedId);
		u && this.#y.get(u.id)?.revision !== u.revision && this.load(u.id);
	}
	async load(e) {
		this.selectedId = e;
		let t = this.items.find((t) => t.id === e)?.revision;
		if (this.#y.get(e)?.revision === t) return;
		let n = await this.#le({
			kind: "get",
			id: e
		});
		n.kind !== "record" || n.record.draft.content.kind !== "task" ? this.error = n.kind === "error" ? n.error : "unavailable" : this.#ee(n.record);
	}
	async create(t) {
		let n = t.title.trim().slice(0, 256), i = e(this.#D);
		if (i) {
			let e = await this.#U();
			if (e === null || i.input.title.trim() === n) return e;
		}
		if (!n) return null;
		let a = t.list === void 0 ? this.listId : t.list, o = {
			title: n,
			pinned: !1,
			related: [],
			content: {
				kind: "task",
				details: {
					list: a,
					inbox: t.inbox ?? !a,
					priority: t.priority ?? "none",
					steps: [],
					completed_at: null,
					deadline: t.deadline ?? null,
					duration: t.duration ?? null
				},
				description: "",
				completed: !1,
				status: "open",
				assignee: "user",
				origin: t.origin ?? "user",
				due_date: t.dueDate ?? null,
				due_time: t.dueDate ? t.dueTime ?? null : null,
				context: t.context ? {
					url: t.context.url,
					title: t.context.title.slice(0, 256)
				} : null,
				sort_key: null,
				work: null
			}
		};
		return r(this.#D, {
			input: {
				...t,
				title: n
			},
			draft: t.draft ?? this.captureDraft,
			error: null,
			command: {
				version: 1,
				request_id: crypto.randomUUID(),
				intent: {
					kind: "create",
					draft: o
				}
			}
		}), this.#U();
	}
	#U() {
		if (this.#O) return this.#O;
		let t = e(this.#D);
		return t ? (this.#O = (async () => {
			let e = await this.#ae(t.command);
			if (e.kind !== "applied" || e.request_id !== t.command.request_id) {
				let n = e.kind === "error" ? e.error : "outcome_unknown";
				return r(this.#D, {
					...t,
					error: n
				}), null;
			}
			return this.#oe(t.command.request_id), r(this.#D, null), this.captureDraft === t.draft && (this.captureDraft = "", this.captureContext = null), this.#ee(e.record), this.#q({
				id: e.record.id,
				action: "change",
				title: e.record.draft.title,
				run: () => this.setTrashed(e.record.id, !0, !1)
			}), this.#ce(), e.record.id;
		})().finally(() => {
			this.#O = null;
		}), this.#O) : Promise.resolve(null);
	}
	setStatus(e, t, n = !0) {
		let r = this.#J(e), i = t === "done" && r?.status !== "done" ? "complete" : "change";
		return this.#X(e, [{
			field: "status",
			value: t
		}], {
			reversible: n,
			action: i
		});
	}
	move(e, t, n, r = !0) {
		return this.#X(e, [{
			field: "status",
			value: t
		}, {
			field: "position",
			sort_key: n
		}], {
			reversible: r,
			action: t === "done" ? "complete" : "change"
		});
	}
	setPinned(e, t) {
		return this.#X(e, [{
			field: "pinned",
			value: t
		}]);
	}
	schedule(e, t, n = null, r = !0) {
		return this.#X(e, [{
			field: "schedule",
			date: t,
			time: t === null ? null : n
		}], { reversible: r });
	}
	setPosition(e, t) {
		return this.#X(e, [{
			field: "position",
			sort_key: t
		}], { reversible: !1 });
	}
	setDeadline(e, t) {
		return this.#X(e, [{
			field: "deadline",
			date: t
		}]);
	}
	setDuration(e, t) {
		return this.#X(e, [{
			field: "duration",
			minutes: t
		}]);
	}
	organize(e, t, n = !1) {
		return this.#X(e, [{
			field: "organization",
			list: t,
			inbox: n
		}]);
	}
	prioritize(e, t) {
		return this.#X(e, [{
			field: "priority",
			value: t
		}]);
	}
	rename(e, t) {
		this.#W(e, "title", t.slice(0, 256));
	}
	describe(e, t) {
		this.#W(e, "description", t.slice(0, 4096));
	}
	#W(e, t, n) {
		let r = `${t}:${e}`;
		if (this.#b.set(e, {
			...this.#b.get(e),
			[t]: n
		}), clearTimeout(this.#C.get(r)), !this.#w.has(r)) {
			let n = this.#K(e)?.[t] ?? null, i = (a) => {
				let o = this.#b.get(e)?.[t];
				if (o == null) return;
				if (t === "title" && !o.trim()) {
					a ? this.#G(e, t) : this.#w.set(r, i);
					return;
				}
				this.#G(e, t);
				let s = t === "title" && a ? o.trim() : o;
				s !== n && this.#X(e, [{
					field: t,
					value: s
				}], {
					reversible: !1,
					expect: n === null ? [] : [{
						field: t,
						value: n
					}]
				});
			};
			this.#w.set(r, i);
		}
		this.#Y(r);
	}
	renameStep(e, t, n) {
		let r = this.#K(e)?.steps;
		if (!r) return;
		let i = (this.#b.get(e)?.steps ?? r).map((e) => e.id === t ? {
			...e,
			title: n.slice(0, 256)
		} : e);
		this.#b.set(e, {
			...this.#b.get(e),
			steps: i
		});
		let a = `steps:${e}`;
		if (clearTimeout(this.#C.get(a)), !this.#w.has(a)) {
			let t = (n) => {
				let i = this.#b.get(e)?.steps;
				if (!i) return;
				if (!n && i.some((e) => !e.title.trim())) {
					this.#w.set(a, t);
					return;
				}
				this.#G(e, "steps");
				let o = n ? i.flatMap((e) => {
					let t = e.title.trim() || r.find((t) => t.id === e.id)?.title;
					return t ? [{
						...e,
						title: t
					}] : [];
				}) : i;
				F(o, r) || this.#X(e, [{
					field: "steps",
					value: o
				}], {
					reversible: !1,
					expect: [{
						field: "steps",
						value: r
					}]
				});
			};
			this.#w.set(a, t);
		}
		this.#Y(a);
	}
	commitText(e) {
		for (let [t, n] of [...this.#w]) (e === void 0 || t.slice(t.indexOf(":") + 1) === e) && (clearTimeout(this.#C.get(t)), this.#C.delete(t), this.#w.delete(t), n(!0));
	}
	#G(e, t) {
		let n = { ...this.#b.get(e) };
		delete n[t], Object.keys(n).length ? this.#b.set(e, n) : this.#b.delete(e);
	}
	#K(t) {
		let n = e(this.#z).get(t);
		if (!n) return;
		let r = A(n, this.#a.get(t), this.#y.get(t));
		for (let e of this.#x.get(t) ?? []) r = {
			...r,
			...e.patch
		};
		return r;
	}
	async updateSteps(e, t) {
		if (!await this.flush()) return !1;
		let n = t.map((e) => ({
			id: e.id,
			title: e.title,
			completed: e.completed
		}));
		return this.#X(e, [{
			field: "steps",
			value: n
		}], { reversible: !1 });
	}
	setTrashed(e, t, n = !0) {
		let r = this.#J(e)?.title ?? "";
		return this.#Z(e, {
			patch: {},
			build: (n) => ({
				kind: t ? "trash" : "restore",
				id: e,
				expected_revision: n.revision
			}),
			error: null,
			hide: t !== this.trash,
			undo: n ? {
				id: e,
				action: t ? "delete" : "restore",
				title: r,
				run: () => this.setTrashed(e, !t, !1)
			} : void 0
		});
	}
	async undo() {
		let t = e(this.#T).at(-1);
		t && (r(this.#T, e(this.#T).slice(0, -1)), this.notice = null, await t.run());
	}
	dismissNotice() {
		this.notice = null;
	}
	#q(t) {
		r(this.#T, [...e(this.#T), t].slice(-16)), t.action !== "change" && (this.notice = {
			serial: ++this.#E,
			action: t.action,
			title: t.title
		});
	}
	#J(e) {
		return this.rows.find((t) => t.id === e);
	}
	#Y(e) {
		this.#C.set(e, setTimeout(() => {
			this.#C.delete(e);
			let t = this.#w.get(e);
			this.#w.delete(e), t?.(!1);
		}, S));
	}
	#X(e, t, n = {}) {
		let r = this.#J(e), i = r ? t.map((e) => N(r, e)) : [], a = n.reversible !== !1 && r && i.every((e) => e !== null) ? {
			id: e,
			action: n.action ?? "change",
			title: r.title,
			run: () => this.#X(e, i, { reversible: !1 })
		} : void 0;
		return this.#Z(e, {
			patch: Object.assign({}, ...t.map(M)),
			set: t,
			expect: n.expect,
			error: null,
			undo: a
		});
	}
	#Z(e, t) {
		return e.startsWith(T) ? Promise.resolve(!1) : (this.#x.set(e, [...this.#x.get(e) ?? [], t]), this.#Q(e));
	}
	#Q(e) {
		let t = this.#S.get(e);
		if (t) return t;
		let n = (async () => {
			let t = !1;
			for (; this.#x.get(e)?.length;) {
				let n = this.#x.get(e)[0];
				if (n.error) return !1;
				if (!n.command) {
					let t;
					if (n.set) t = {
						kind: "update_task",
						id: e,
						set: n.set,
						expect: n.expect ?? []
					};
					else {
						let r = await this.#le({
							kind: "get",
							id: e
						});
						if (r.kind !== "record" || r.record.draft.content.kind !== "task") return this.#$(e, n, r.kind === "error" ? r.error : "unavailable"), !1;
						t = n.build?.(r.record) ?? null;
					}
					if (!t) return this.#$(e, n, "invalid"), !1;
					n.command = {
						version: 1,
						request_id: crypto.randomUUID(),
						intent: t
					};
				}
				let r = await this.#ae(n.command);
				if (r.kind !== "applied" || r.request_id !== n.command.request_id) return this.#$(e, n, r.kind === "error" ? r.error : "outcome_unknown"), !1;
				this.#oe(n.command.request_id), this.#ee(r.record);
				let i = this.#x.get(e).slice(1);
				i.length ? this.#x.set(e, i) : this.#x.delete(e), n.undo && this.#q(n.undo), t ||= !n.set || n.set.some((e) => w.has(e.field));
			}
			return t && this.#ce(), !0;
		})().finally(() => this.#S.delete(e));
		return this.#S.set(e, n), n;
	}
	#$(e, t, n) {
		t.error = n, this.#x.set(e, [...this.#x.get(e)]);
	}
	#ee(t) {
		let n = t.draft.content;
		if (n.kind !== "task" || !this.#k) return;
		let r = e(this.#z).get(t.id);
		r && BigInt(r.revision) > BigInt(t.revision) || (t.trashed === this.trash ? (this.items = _(this.items, j(t)), this.#a.set(t.id, k(t.id, n)), this.#y.set(t.id, {
			steps: O(n).steps,
			description: n.description,
			createdAt: t.created_at,
			revision: t.revision
		})) : (this.items = this.items.filter((e) => e.id !== t.id), this.#re()));
	}
	#te(t, n) {
		let r = e(this.#z).get(t);
		r && !v(n, r.revision) || this.#S.has(t) || (!r && this.#O ? this.#O.then(() => this.#te(t, n)) : !r && this.query.trim() ? this.#se() : (this.#I.add(t), clearTimeout(this.#F), this.#F = setTimeout(() => void this.#ne(), x)));
	}
	async #ne() {
		let e = [...this.#I];
		this.#I.clear();
		let t = this.#A;
		for (let n of e) {
			let e = await this.#le({
				kind: "get",
				id: n
			});
			if (t !== this.#A) return;
			e.kind === "record" ? this.#ee(e.record) : e.kind === "error" && e.error === "not_found" && (this.items = this.items.filter((e) => e.id !== n), this.#re());
		}
		this.#ce();
	}
	#re() {
		let t = e(this.#z);
		for (let e of [...this.#a.keys()]) t.has(e) || this.#a.delete(e);
		for (let e of [...this.#y.keys()]) t.has(e) || this.#y.delete(e);
	}
	async saveList(t, n) {
		if (e(this.#o)) return this.#ie();
		let i = this.lists.find((e) => e.id === n), a = t.trim().slice(0, 64);
		return a ? (r(this.#o, {
			version: 1,
			request_id: crypto.randomUUID(),
			intent: i ? {
				kind: "rename_task_list",
				id: i.id,
				expected_revision: i.revision,
				title: a
			} : {
				kind: "create_task_list",
				title: a
			}
		}), this.#ie()) : null;
	}
	async deleteList(t) {
		if (e(this.#o)) return !1;
		let n = this.lists.find((e) => e.id === t);
		return n ? (r(this.#o, {
			version: 1,
			request_id: crypto.randomUUID(),
			intent: {
				kind: "delete_task_list",
				id: t,
				expected_revision: n.revision
			}
		}), await this.#ie() !== null) : !1;
	}
	#ie() {
		if (this.#c) return this.#c;
		let t = e(this.#o);
		return t ? (this.#c = (async () => {
			let e = await this.#ae(t);
			return e.kind !== "task_list_applied" || e.request_id !== t.request_id ? (r(this.#s, e.kind === "error" ? e.error : "outcome_unknown", !0), null) : (this.#oe(t.request_id), r(this.#s, null), r(this.#o, null), this.lists = this.lists.filter((t) => t.id !== e.list.id), e.list.deleted || (this.lists = [...this.lists, e.list].sort((e, t) => e.title.localeCompare(t.title))), e.list.deleted && this.#se(), e.list);
		})().finally(() => this.#c = null), this.#c) : Promise.resolve(null);
	}
	async #ae(e) {
		for (let t = 0;; t++) {
			let n = await this.#le({
				kind: "mutate",
				command: e
			}), r = C[t];
			if (r === void 0 || n.kind !== "error" || n.error !== "capacity" && n.error !== "outcome_unknown") return n;
			await new Promise((e) => setTimeout(e, r));
		}
	}
	#oe(e) {
		this.#le({
			kind: "acknowledge",
			request_id: e
		});
	}
	#se() {
		this.#k && (clearTimeout(this.#N), this.#N = setTimeout(() => void this.reload(), x));
	}
	#ce() {
		this.#k && (clearTimeout(this.#P), this.#P = setTimeout(async () => {
			let e = this.#A, t = await this.#le({
				kind: "task_overview",
				today: this.day || D()
			});
			e === this.#A && t.kind === "task_overview" && (this.counts = t.counts, this.lists = t.lists);
		}, x));
	}
	#le(e) {
		return m(this.profile, e);
	}
}, L = 6, R = new o(), z = 0, B = !1;
function V() {
	B || typeof document > "u" || (B = !0, document.addEventListener("visibilitychange", () => {
		if (document.visibilityState === "hidden") for (let { session: e } of R.values()) e.commitText();
	}));
}
function H() {
	for (; R.size >= L;) {
		let e;
		for (let t of R) !t[1].session.active && !t[1].session.retained && (!e || t[1].used < e[1].used) && (e = t);
		if (!e) return;
		let [t, { session: n, dispose: r }] = e;
		R.delete(t), n.removeCloseTask(), r();
	}
}
function U(e, t) {
	let r = `${e}:${t}`, i = R.get(r);
	if (i) return i.used = ++z, i.session;
	V(), H();
	let a, o = n(() => {
		a = new I(e);
	}), s = a ?? new I(e);
	return R.set(r, {
		session: s,
		dispose: o,
		used: ++z
	}), s;
}
// src/media.ts
var W = /* @__PURE__ */ new Map(), G = /* @__PURE__ */ new Map();
function K(e) {
	W.clear(), G.clear();
	for (let [t, n] of e.pictures) W.set(t, n);
	for (let [t, n] of e.frames) G.set(t, n);
}
function q(e, t) {
	return W.get(t) ?? null;
}
function J(e, t) {
	return G.get(t) ?? null;
}
// upstream/src/domain/resources/media.ts
var Y = /^[0-9a-f]{64}$/, X = /^[0-9A-HJKMNP-TV-Z]{26}$/, Z = f ? "zephium-media://localhost/" : "http://zephium-media.localhost/";
function Q(e) {
	return e < 1024 ? `${e} B` : e < 1048576 ? `${(e / 1024).toFixed(0)} KB` : `${(e / 1048576).toFixed(1)} MB`;
}
function $(e) {
	return !X.test(e.profile) || !Y.test(e.source) || !Y.test(e.digest) || e.width < 1 || e.width > 320 || e.height < 1 || e.height > 240 ? null : `${Z}record/${btoa(JSON.stringify(e)).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/u, "")}`;
}
function ee(e, t = 720) {
	return e.record ? $(e.record) : q(e.profile, e.digest, t);
}
export { J as a, q as i, ee as n, K as o, $ as r, U as s, Q as t };

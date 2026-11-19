import { Ct as e, H as t, J as n, L as r, Mt as i, U as a, W as o, Y as s, h as c, jt as l, lt as u, mt as d, pt as f, r as p, tt as m, zt as h } from "./index-client-DH73-vTM.js";
import "./disclose-version-7ONGmeVC.js";
import { t as g } from "./Icon-D2j1Ej6Z.js";
import "./Icon-CmjKIKuh.js";
import { t as _ } from "./Globe02Icon-CZ5JtleP.js";
import { t as v } from "./Tick02Icon-D7tHNRMx.js";
import { t as y } from "./runtime-Ci9kzAvr.js";
import { t as b } from "./FavIcon-B-1SmexQ.js";
import { t as x } from "./FavIcon-Dsc27BCG.js";
// upstream/src/shared/i18n/messages/task_due_today.js
var S = () => "Today", C = ((e = {}, t = {}) => (t.locale ?? y(), S(e))), ee = () => "Tomorrow", w = ((e = {}, t = {}) => (t.locale ?? y(), ee(e))), te = () => "Yesterday", ne = ((e = {}, t = {}) => (t.locale ?? y(), te(e))), re = (e) => `${e?.count}h`, T = ((e, t = {}) => (t.locale ?? y(), re(e))), E = (e) => `${e?.count}m`, D = ((e, t = {}) => (t.locale ?? y(), E(e))), O = (e) => `${e?.hours}h ${e?.minutes}m`, ie = ((e, t = {}) => (t.locale ?? y(), O(e))), ae = () => "Created by an agent", oe = ((e = {}, t = {}) => (t.locale ?? y(), ae(e))), se = () => "Priority", ce = ((e = {}, t = {}) => (t.locale ?? y(), se(e))), le = () => "High", k = ((e = {}, t = {}) => (t.locale ?? y(), le(e))), ue = () => "Low", A = ((e = {}, t = {}) => (t.locale ?? y(), ue(e))), de = () => "Medium", j = ((e = {}, t = {}) => (t.locale ?? y(), de(e))), fe = () => "No priority", M = ((e = {}, t = {}) => (t.locale ?? y(), fe(e))), N = () => "In progress", P = ((e = {}, t = {}) => (t.locale ?? y(), N(e))), F = () => "Blocked", I = ((e = {}, t = {}) => (t.locale ?? y(), F(e))), L = () => "Completed", R = ((e = {}, t = {}) => (t.locale ?? y(), L(e))), z = () => "To do", B = ((e = {}, t = {}) => (t.locale ?? y(), z(e))), V = (e) => `${e?.done} of ${e?.total} subtasks complete`, pe = ((e, t = {}) => (t.locale ?? y(), V(e))), me = 864e5, he = new Intl.DateTimeFormat(void 0, {
	weekday: "long",
	timeZone: "UTC"
}), ge = new Intl.DateTimeFormat(void 0, {
	day: "numeric",
	month: "short",
	timeZone: "UTC"
}), _e = new Intl.DateTimeFormat(void 0, {
	day: "numeric",
	month: "short",
	year: "numeric",
	timeZone: "UTC"
}), ve = new Intl.DateTimeFormat(void 0, {
	hour: "numeric",
	minute: "2-digit",
	timeZone: "UTC"
});
function H(e) {
	let t = /^(\d{2}):(\d{2})$/u.exec(e);
	return t ? ve.format(new Date(Date.UTC(2026, 0, 1, Number(t[1]), Number(t[2])))) : e;
}
function ye() {
	return be(/* @__PURE__ */ new Date());
}
function be(e) {
	return `${e.getFullYear()}-${String(e.getMonth() + 1).padStart(2, "0")}-${String(e.getDate()).padStart(2, "0")}`;
}
function U(e) {
	let t = /^(\d{4})-(\d{2})-(\d{2})$/u.exec(e);
	if (!t) return null;
	let n = Date.UTC(Number(t[1]), Number(t[2]) - 1, Number(t[3]));
	return Number.isNaN(n) ? null : n;
}
function W(e, t) {
	let n = U(e), r = U(t);
	return n === null || r === null ? null : Math.round((n - r) / me);
}
function G(e, t) {
	let n = e === null ? null : W(e, t);
	return n === null ? null : n < 0 ? "overdue" : n === 0 ? "today" : n <= 7 ? "soon" : "later";
}
function xe(e, t, n, r = null) {
	let i = W(e, t), a = U(e);
	if (i === null || a === null) return e;
	let o = r === null ? "" : ` ${H(r)}`;
	if (i === 0) return n.today + o;
	if (i === 1) return n.tomorrow + o;
	if (i === -1) return n.yesterday + o;
	let s = new Date(a);
	if (i > 1 && i <= 6) return he.format(s) + o;
	let c = U(t);
	return (c !== null && new Date(c).getUTCFullYear() === s.getUTCFullYear() ? ge : _e).format(s) + o;
}
function K(e) {
	return e.deadline === null ? e.dueDate : e.dueDate === null || e.deadline < e.dueDate ? e.deadline : e.dueDate;
}
function Se(e, t) {
	let n = Math.floor(e / 60), r = e % 60;
	return n === 0 ? t.minutes(r) : r === 0 ? t.hours(n) : t.mixed(n, r);
}
var Ce = {
	blocked: 0,
	active: 1,
	open: 2,
	done: 3
};
function q(e, t = !1) {
	let n = t ? "open" : e.status;
	return {
		row: e,
		rank: Ce[n],
		pinned: e.pinned,
		sortKey: e.sortKey,
		day: K(e),
		time: e.dueTime,
		finished: n === "done" ? BigInt(e.completedAt ?? "0") : null
	};
}
function J(e, t) {
	return e.id === t.id ? 0 : e.id < t.id ? -1 : 1;
}
function Y(e, t) {
	return e.finished !== null && t.finished !== null ? e.finished === t.finished ? J(e.row, t.row) : e.finished > t.finished ? -1 : 1 : e.rank === t.rank ? e.pinned === t.pinned ? e.sortKey === t.sortKey ? e.day === t.day ? e.time === t.time ? J(e.row, t.row) : e.time === null ? 1 : t.time === null || e.time < t.time ? -1 : 1 : e.day === null ? 1 : t.day === null || e.day < t.day ? -1 : 1 : e.sortKey === null ? 1 : t.sortKey === null || e.sortKey < t.sortKey ? -1 : 1 : e.pinned ? -1 : 1 : e.rank - t.rank;
}
function we(e, t) {
	return Y(q(e), q(t));
}
function X(e, t) {
	if (e.status === "done") return "completed";
	let n = K(e), r = n === null ? null : W(n, t);
	return r === null ? "anytime" : r < 0 ? "overdue" : r === 0 ? "today" : r === 1 ? "tomorrow" : "upcoming";
}
var Z = [
	"overdue",
	"today",
	"tomorrow",
	"upcoming",
	"anytime",
	"completed"
], Te = {
	today: ["overdue", "today"],
	inbox: Z.filter((e) => e !== "completed"),
	upcoming: ["tomorrow", "upcoming"],
	completed: ["completed"],
	all: Z
};
function Ee(e, t) {
	let { scope: n, today: r, labels: i, holding: a } = t, o = new Set(Te[n]), s = /* @__PURE__ */ new Map();
	for (let t of e) {
		let e = a?.has(t.id) ?? !1 ? X({
			...t,
			status: "open"
		}, r) : X(t, r);
		if (!o.has(e)) continue;
		let n = s.get(e);
		n ? n.push(t) : s.set(e, [t]);
	}
	let c = t.completedLimit ?? Infinity;
	return Z.filter((e) => o.has(e) && s.get(e)?.length).map((e) => {
		let t = s.get(e).map((e) => q(e, a?.has(e.id))).sort(Y).map((e) => e.row);
		return {
			key: e,
			label: i[e],
			total: t.length,
			rows: e === "completed" ? t.slice(0, c) : t
		};
	});
}
function De(e, t) {
	return e === t || e.id === t.id && e.status === t.status && e.pinned === t.pinned && e.sortKey === t.sortKey && e.dueDate === t.dueDate && e.dueTime === t.dueTime && e.deadline === t.deadline && e.completedAt === t.completedAt;
}
function Oe() {
	let e = null;
	return (t, n) => {
		let r = [
			n.scope,
			n.today,
			n.completedLimit ?? "",
			...Z.map((e) => n.labels[e]),
			...n.holding ?? []
		].join("\n"), i = e;
		if (i && i.key === r && i.rows.length === t.length && t.every((e, t) => De(e, i.rows[t]))) {
			let e = t.filter((e, t) => e !== i.rows[t]);
			if (e.length) {
				let t = new Map(e.map((e) => [e.id, e]));
				i.result = i.result.map((e) => ({
					...e,
					rows: e.rows.map((e) => t.get(e.id) ?? e)
				}));
			}
			return i.rows = t, i.result;
		}
		let a = Ee(t, n);
		return e = {
			rows: t,
			key: r,
			result: a
		}, a;
	};
}
function Q(e) {
	try {
		return new URL(e).host.replace(/^www\./u, "");
	} catch {
		return e;
	}
}
function ke(e, t, n) {
	return e.dueDate === null ? !1 : e.dueTime !== null || G(e.dueDate, n) === "overdue" || t !== "today" && t !== "tomorrow" && t !== "completed";
}
// upstream/src/features/tasks/lib/priority.ts
function $(e) {
	return [
		0,
		1,
		2
	].map((t) => ["rect", {
		x: String(3.5 + t * 6.5),
		y: String(14 - t * 4.5),
		width: "4",
		height: String(6 + t * 4.5),
		rx: "1.25",
		fill: "currentColor",
		stroke: "none",
		opacity: t < e ? "1" : "0.28",
		key: String(t)
	}]);
}
var Ae = {
	none: $(0),
	low: $(1),
	medium: $(2),
	high: $(3)
}, je = {
	get today() {
		return C();
	},
	get tomorrow() {
		return w();
	},
	get yesterday() {
		return ne();
	}
}, Me = {
	minutes: (e) => D({ count: e }),
	hours: (e) => T({ count: e }),
	mixed: (e, t) => ie({
		hours: e,
		minutes: t
	})
}, Ne = {
	high: k,
	medium: j,
	low: A,
	none: M
}, Pe = {
	open: B,
	active: P,
	blocked: I,
	done: R
};
// upstream/src/features/tasks/components/SiteMark.svelte
function Fe(n, o) {
	i(o, !0);
	let s = p(o, "size", 3, 12), c = e(() => b(o.url));
	var u = a(), f = d(u), h = (e) => {
		x(e, {
			get image() {
				return m(c).image;
			},
			get tone() {
				return m(c).tone;
			},
			get size() {
				return s();
			},
			lit: !0,
			get fallback() {
				return _;
			}
		});
	}, v = (e) => {
		g(e, {
			get icon() {
				return _;
			},
			get size() {
				return s();
			}
		});
	};
	r(f, (e) => {
		m(c) ? e(h) : e(v, -1);
	}), t(n, u), l();
}
// upstream/src/features/tasks/components/TaskCheck.svelte
var Ie = o("<span class=\"mark svelte-rhg4vk\" aria-hidden=\"true\"><!></span>"), Le = o("<span class=\"state svelte-rhg4vk\" aria-hidden=\"true\"></span>"), Re = o("<button type=\"button\" class=\"task-check svelte-rhg4vk\" role=\"checkbox\"><!></button>");
function ze(n, a) {
	i(a, !0);
	let o = p(a, "size", 3, "regular"), d = p(a, "disabled", 3, !1), _ = p(a, "tabindex", 19, () => -1);
	var y = Re(), b = f(y), x = (n) => {
		var r = Ie(), i = f(r);
		{
			let t = e(() => o() === "small" ? 10 : 12);
			g(i, {
				get icon() {
					return v;
				},
				get size() {
					return m(t);
				},
				strokeWidth: 2.6
			});
		}
		h(r), t(n, r);
	}, S = (e) => {
		var n = Le();
		t(e, n);
	};
	r(b, (e) => {
		a.status === "done" ? e(x) : a.status !== "open" && e(S, 1);
	}), h(y), u(() => {
		c(y, "aria-checked", a.status === "done"), c(y, "aria-label", a.label), c(y, "title", a.label), c(y, "data-status", a.status), c(y, "data-size", o()), y.disabled = d(), c(y, "tabindex", _());
	}), s("click", y, () => a.ontoggle(a.status === "done" ? "open" : "done")), t(n, y), l();
}
n(["click"]);
export { j as C, oe as D, ce as E, w as O, M as S, k as T, pe as _, Ne as a, I as b, we as c, G as d, Se as f, ye as g, H as h, Me as i, C as k, Oe as l, ke as m, Fe as n, Pe as o, Q as p, je as r, Ae as s, ze as t, xe as u, B as v, A as w, P as x, R as y };

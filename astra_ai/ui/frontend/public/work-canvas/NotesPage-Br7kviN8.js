import { B as e, C as t, Ct as n, E as r, H as i, I as a, J as o, K as s, L as c, M as l, Mt as u, P as d, Rt as f, S as p, U as m, W as h, Wt as g, X as _, Y as v, bt as y, dt as b, gt as x, h as S, ht as C, it as w, j as T, jt as E, lt as D, m as O, mt as k, p as A, pt as j, r as M, rt as ee, s as N, tt as P, u as F, ut as I, vt as L, x as R, zt as z } from "./index-client-DH73-vTM.js";
import "./disclose-version-7ONGmeVC.js";
import { t as B } from "./Icon-D2j1Ej6Z.js";
import "./Icon-CmjKIKuh.js";
import { t as te } from "./Add01Icon-CxgurxUR.js";
import { t as V } from "./ArrowLeft01Icon-CqGHWA57.js";
import { t as H } from "./ArrowLeft02Icon-Dfed5Wek.js";
import { s as ne, v as re, y as ie } from "./DueMenu-C7IXey3W.js";
import { i as U, n as ae } from "./Menu-BPg_6BBl.js";
import { n as oe } from "./Flag02Icon-CMlWs54y.js";
import { t as se } from "./Cancel01Icon-6hDfDS5l.js";
import { t as W } from "./CheckListIcon-D8ytJXXy.js";
import { A as ce, C as le, D as G, E as K, O as q, S as J, T as Y, _ as X, a as Z, b as ue, c as de, d as fe, g as pe, h as me, i as he, j as ge, k as _e, l as ve, m as ye, n as be, o as xe, r as Se, s as Ce, t as we, u as Te, v as Ee, w as De, x as Oe, y as ke } from "./enter-DVQzselG.js";
import { t as Ae } from "./Delete02Icon-Z8r1VIoL.js";
import { t as je } from "./Folder01Icon-BHrTk5xe.js";
import { t as Me } from "./MoreHorizontalIcon-CIX2KIjy.js";
import { t as Ne } from "./PencilEdit02Icon-C35CFL3M.js";
import { t as Pe } from "./PinIcon-Cq04IxnM.js";
import { t as Fe } from "./Search01Icon-BQoE0w_i.js";
import { t as Ie } from "./Tick02Icon-D7tHNRMx.js";
import { t as Q } from "./runtime-Ci9kzAvr.js";
import { a as Le, o as Re } from "./task-order-C4dYLrd2.js";
import { n as ze, t as Be } from "./LazyView-CE8TfU_-.js";
import { c as Ve, i as He, l as Ue, o as We, r as Ge, t as Ke } from "./Tasks-BDF4XWZG.js";
import { t as qe } from "./task_board-H2JRCnZ2.js";
import { n as Je, t as Ye } from "./index-client-AzfegT-i.js";
import { t as Xe, y as Ze } from "./bindings-DgGe59oq.js";
import { t as Qe } from "./notes-x7bostuM.js";
import { s as $e } from "./resources-m1AI3WJ9.js";
import { R as et, b as tt } from "./popover-BrVWNVPz.js";
import { n as nt, r as rt, t as it } from "./motion-CNlXCFGr.js";
import { t as at } from "./IconButton-Ds6WftAQ.js";
import { t as ot } from "./lag.svelte-x9LNdi7-.js";
// upstream/src/shared/ui/SearchField/SearchField.svelte
var st = h("<form role=\"search\" class=\"ui-search svelte-1sis143\"><label class=\"sr-only\"> </label><!><input/></form>");
function ct(t, r) {
	let a = s();
	u(r, !0);
	let o = M(r, "size", 3, "chrome"), d = M(r, "value", 15, ""), f = M(r, "ref", 15), p = M(r, "inputProps", 19, () => ({}));
	var h = st(), g = j(h), v = j(g, !0);
	z(g);
	var y = C(g), b = (e) => {
		var t = m(), n = k(t);
		l(n, () => r.lead), i(e, t);
	}, x = (e) => {
		{
			let t = n(() => o() === "page" ? 16 : 14);
			B(e, {
				get icon() {
					return Fe;
				},
				get size() {
					return P(t);
				}
			});
		}
	};
	c(y, (e) => {
		r.lead ? e(b) : e(x, -1);
	});
	var w = C(y), T = (e) => r.oninput?.(e.currentTarget.value);
	A(w, () => ({
		id: a,
		type: "search",
		placeholder: r.placeholder,
		autocomplete: "off",
		...p(),
		oninput: T
	}), void 0, void 0, void 0, "svelte-1sis143", !0), N(w, (e) => f(e), () => f()), z(h), D(() => {
		S(h, "data-size", o()), S(g, "for", a), e(v, r.label);
	}), _("submit", h, (e) => {
		e.preventDefault(), r.onsubmit?.(d().trim());
	}), F(w, d), i(t, h), E();
}
// upstream/src/shared/i18n/messages/note_all.js
var lt = () => "All notes", ut = ((e = {}, t = {}) => (t.locale ?? Q(), lt(e))), dt = () => "Notes", ft = ((e = {}, t = {}) => (t.locale ?? Q(), dt(e))), pt = () => "Close Notes", mt = ((e = {}, t = {}) => (t.locale ?? Q(), pt(e))), ht = () => "Not saved yet — trying again", gt = ((e = {}, t = {}) => (t.locale ?? Q(), ht(e))), _t = () => "Show Notes Folder", vt = ((e = {}, t = {}) => (t.locale ?? Q(), _t(e))), yt = () => "Saving…", bt = ((e = {}, t = {}) => (t.locale ?? Q(), yt(e))), xt = () => "Search notes", St = ((e = {}, t = {}) => (t.locale ?? Q(), xt(e))), Ct = () => "Each note is saved as a Markdown file in a folder you own.", wt = ((e = {}, t = {}) => (t.locale ?? Q(), Ct(e))), Tt = () => "Choose a note, or start a new one", Et = ((e = {}, t = {}) => (t.locale ?? Q(), Tt(e))), Dt = () => "This view could not be loaded.", Ot = ((e = {}, t = {}) => (t.locale ?? Q(), Dt(e))), kt = () => "Opening view…", At = ((e = {}, t = {}) => (t.locale ?? Q(), kt(e))), jt = () => "Try again", Mt = ((e = {}, t = {}) => (t.locale ?? Q(), jt(e))), Nt = () => "Trash", Pt = ((e = {}, t = {}) => (t.locale ?? Q(), Nt(e))), Ft = (e) => `${e?.count} tasks`, It = ((e, t = {}) => (t.locale ?? Q(), Ft(e))), Lt = (e) => `Actions for ${e?.title}`, Rt = ((e, t = {}) => (t.locale ?? Q(), Lt(e))), zt = () => "Remove list · keep tasks in Inbox", Bt = ((e = {}, t = {}) => (t.locale ?? Q(), zt(e))), Vt = () => "List name", Ht = ((e = {}, t = {}) => (t.locale ?? Q(), Vt(e))), Ut = () => "Rename list", Wt = ((e = {}, t = {}) => (t.locale ?? Q(), Ut(e))), Gt = () => "Save list", Kt = ((e = {}, t = {}) => (t.locale ?? Q(), Gt(e))), qt = () => "List", Jt = ((e = {}, t = {}) => (t.locale ?? Q(), qt(e))), Yt = () => "My lists", Xt = ((e = {}, t = {}) => (t.locale ?? Q(), Yt(e))), Zt = () => "New list", Qt = ((e = {}, t = {}) => (t.locale ?? Q(), Zt(e))), $t = () => "Close tasks", en = ((e = {}, t = {}) => (t.locale ?? Q(), $t(e))), tn = () => "Tasks", nn = ((e = {}, t = {}) => (t.locale ?? Q(), tn(e))), rn = () => "All tasks", an = ((e = {}, t = {}) => (t.locale ?? Q(), rn(e))), on = () => "Completed", sn = ((e = {}, t = {}) => (t.locale ?? Q(), on(e))), cn = () => "Today", ln = ((e = {}, t = {}) => (t.locale ?? Q(), cn(e))), un = () => "Upcoming", dn = ((e = {}, t = {}) => (t.locale ?? Q(), un(e))), fn = () => "Search results", pn = ((e = {}, t = {}) => (t.locale ?? Q(), fn(e))), mn = (e) => `${e?.count} overdue`, hn = ((e, t = {}) => (t.locale ?? Q(), mn(e))), gn = () => "View", _n = ((e = {}, t = {}) => (t.locale ?? Q(), gn(e))), vn = () => "Search tasks", yn = ((e = {}, t = {}) => (t.locale ?? Q(), vn(e))), bn = x({
	page: null,
	source: null
}), xn = null, Sn = {
	async open(e) {
		if (e === "notes" || e === "tasks") {
			if (e === "notes" && Ze.available && (new URLSearchParams(location.search).get("research") ?? localStorage.getItem("nova-research-surface")) !== "classic") {
				let e = sessionStorage.getItem("nova-current-workspace") || "dashboard";
				xn = {
					workspace: e,
					page: Ze.page
				}, Ze.page = "notes", e !== "research" && window.dispatchEvent(new Event("nova-open-research"));
			} else bn.page = e, window.dispatchEvent(new CustomEvent("aegis-tools-page", { detail: { kind: e } }));
		}
	},
	async close() {
		if (Ze.page === "notes") {
			let e = xn;
			xn = null, Ze.page = e?.page ?? null, (e?.workspace === "dashboard" || e?.workspace === "memory") && window.dispatchEvent(new Event("nova-open-" + e.workspace));
		} else bn.page = null, window.dispatchEvent(new CustomEvent("aegis-tools-page", { detail: { kind: null } }));
	}
}, Cn = {
	profile: () => ({ id: "aegis-owner" }),
	activeTab: () => bn.source
}, wn = () => ({
	scope: "today",
	trashed: !1,
	board: !1,
	list: null
}), Tn = new Je(), En = "unbound", Dn = y(x(wn())), On = () => P(Dn);
function kn(e) {
	En !== e && (Tn.set(En, P(Dn)), En = e, L(Dn, Tn.get(e) ?? wn(), !0));
}
function $(e, t) {
	t && kn(t), L(Dn, {
		...P(Dn),
		...e
	}, !0);
}
// upstream/src/features/tasks/index.ts
var An = () => import("./Tasks-BDF4XWZG.js").then((e) => e.n);
// ../../../../../../../../Escritorio/MAIN RICH FODER/Nova-UI-AI-NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS/astra_ai/ui/frontend/work-canvas/node_modules/bits-ui/dist/bits/utilities/config/components/bits-config.svelte
function jn(e, t) {
	u(t, !0), tt({
		defaultPortalTo: et(() => t.defaultPortalTo),
		defaultLocale: et(() => t.defaultLocale)
	});
	var n = m(), r = k(n);
	l(r, () => t.children ?? g), i(e, n), E();
}
// upstream/src/shared/ui/SegmentedControl/SegmentedControl.svelte
var Mn = h("<button type=\"button\" role=\"radio\" class=\"segment svelte-1w7qvif\"><!> <span class=\"text svelte-1w7qvif\"> </span></button>"), Nn = h("<div class=\"segmented svelte-1w7qvif\" role=\"radiogroup\"><span class=\"thumb svelte-1w7qvif\" aria-hidden=\"true\"></span> <!></div>");
function Pn(t, r) {
	u(r, !0);
	let a = M(r, "value", 15, ""), o = M(r, "size", 3, "regular"), s = M(r, "full", 3, !1), l = M(r, "iconOnly", 3, !1), f = M(r, "disabled", 3, !1), p = n(() => r.options.findIndex((e) => e.value === a())), m = x([]);
	function h(e) {
		e !== a() && (a(e), r.onchange?.(e));
	}
	function g(e) {
		let t = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : null, n = Math.max(0, P(p)), i = null;
		if (t === null ? e.key === "Home" ? i = 0 : e.key === "End" && (i = r.options.length - 1) : i = (n + (getComputedStyle(e.currentTarget).direction === "rtl" ? -t : t) + r.options.length) % r.options.length, i === null) return;
		e.preventDefault();
		let a = r.options[i];
		a && !a.disabled && (h(a.value), m[i]?.focus());
	}
	var _ = Nn();
	let y;
	var b = j(_), w = C(b, 2);
	d(w, 19, () => r.options, (e) => e.value, (t, n, r) => {
		var o = Mn(), s = j(o), u = (e) => {
			B(e, {
				get icon() {
					return P(n).icon;
				},
				size: 13
			});
		};
		c(s, (e) => {
			P(n).icon && e(u);
		});
		var d = C(s, 2), _ = j(d, !0);
		z(d), z(o), N(o, (e, t) => m[t] = e, (e) => m?.[e], () => [P(r)]), D((t) => {
			S(o, "aria-checked", P(n).value === a()), S(o, "tabindex", t), o.disabled = f() || P(n).disabled, S(o, "title", l() ? P(n).label : void 0), e(_, P(n).label);
		}, [() => P(r) === Math.max(0, P(p)) ? 0 : -1]), v("click", o, () => h(P(n).value)), v("keydown", o, g), i(t, o);
	}), z(_), D((e) => {
		S(_, "aria-label", r.label), S(_, "aria-disabled", f() || void 0), S(_, "data-size", o()), S(_, "data-full", s()), S(_, "data-icon-only", l()), y = R(_, "", y, e), S(b, "data-visible", P(p) >= 0);
	}, [() => ({
		"--seg-count": r.options.length,
		"--seg-index": Math.max(0, P(p))
	})]), i(t, _), E();
}
o(["click", "keydown"]);
// upstream/src/features/tasks/components/TasksNavigation.svelte
var Fn = h("<small class=\"svelte-1ln288b\"> </small>"), In = h("<button type=\"button\" class=\"nav-row svelte-1ln288b\"><!><span class=\"svelte-1ln288b\"> </span><!></button>"), Ln = h("<div class=\"list-row svelte-1ln288b\"><button class=\"nav-row svelte-1ln288b\" type=\"button\"><!><span class=\"svelte-1ln288b\"> </span><!></button> <!></div>"), Rn = h("<form class=\"list-editor svelte-1ln288b\"><!><input maxlength=\"64\" class=\"svelte-1ln288b\"/><!></form>"), zn = h("<button type=\"button\" class=\"nav-row create-list svelte-1ln288b\"><!><span class=\"svelte-1ln288b\"> </span></button>"), Bn = h("<nav class=\"task-navigation svelte-1ln288b\"><header class=\"navigation-head svelte-1ln288b\"><span> </span><!></header> <div class=\"navigation-group svelte-1ln288b\"></div> <div class=\"navigation-lists svelte-1ln288b\"><div class=\"navigation-heading svelte-1ln288b\"><span> </span><!></div> <div class=\"navigation-group svelte-1ln288b\"><!> <!></div></div> <div class=\"navigation-secondary svelte-1ln288b\"><button type=\"button\" class=\"nav-row svelte-1ln288b\"><!><span class=\"svelte-1ln288b\"> </span></button><button type=\"button\" class=\"nav-row svelte-1ln288b\"><!><span class=\"svelte-1ln288b\"> </span></button></div></nav>");
function Vn(t, r) {
	u(r, !0);
	let a = n(On), o = y(null), s = y(void 0), l = y(!1), f = n(() => [
		{
			id: "inbox",
			icon: ie,
			label: ne(),
			total: r.session.counts.inbox
		},
		{
			id: "today",
			icon: re,
			label: ln(),
			total: r.session.counts.today
		},
		{
			id: "upcoming",
			icon: oe,
			label: dn(),
			total: r.session.counts.upcoming
		},
		{
			id: "all",
			icon: W,
			label: an(),
			total: r.session.counts.all
		}
	]);
	async function p(e = null, t = "") {
		L(o, {
			id: e,
			title: t
		}, !0), await ee(), P(s)?.focus(), P(s)?.select();
	}
	async function m() {
		if (!P(o)?.title.trim() || P(l)) return;
		L(l, !0);
		let e = await r.session.saveList(P(o).title, P(o).id ?? void 0);
		e && (L(o, null), $({
			scope: "all",
			list: e.id,
			trashed: !1
		})), L(l, !1);
	}
	var h = Bn(), g = j(h), b = j(g), x = j(b, !0);
	z(b);
	var w = C(b);
	{
		let e = n(() => en());
		at(w, {
			get icon() {
				return se;
			},
			get label() {
				return P(e);
			},
			get onclick() {
				return r.onclose;
			}
		});
	}
	z(g);
	var T = C(g, 2);
	d(T, 21, () => P(f), (e) => e.id, (t, n) => {
		var r = In(), o = j(r);
		B(o, {
			get icon() {
				return P(n).icon;
			},
			size: 17
		});
		var s = C(o), l = j(s, !0);
		z(s);
		var u = C(s), d = (t) => {
			var r = Fn(), a = j(r, !0);
			z(r), D(() => e(a, P(n).total)), i(t, r);
		};
		c(u, (e) => {
			P(n).total && e(d);
		}), z(r), D(() => {
			S(r, "aria-current", !P(a).trashed && !P(a).list && P(a).scope === P(n).id ? "page" : void 0), e(l, P(n).label);
		}), v("click", r, () => $({
			scope: P(n).id,
			list: null,
			trashed: !1
		})), i(t, r);
	}), z(T);
	var k = C(T, 2), A = j(k), M = j(A), I = j(M, !0);
	z(M);
	var R = C(M);
	{
		let e = n(() => Qt());
		at(R, {
			get icon() {
				return te;
			},
			get label() {
				return P(e);
			},
			onclick: () => void p()
		});
	}
	z(A);
	var V = C(A, 2), H = j(V);
	d(H, 17, () => r.session.lists, (e) => e.id, (t, o) => {
		var s = Ln(), l = j(s), u = j(l);
		B(u, {
			get icon() {
				return je;
			},
			size: 16
		});
		var d = C(u), f = j(d, !0);
		z(d);
		var m = C(d), h = (t) => {
			var n = Fn(), r = j(n, !0);
			z(n), D(() => e(r, P(o).count)), i(t, n);
		};
		c(m, (e) => {
			P(o).count && e(h);
		}), z(l);
		var g = C(l, 2);
		{
			let e = (e) => {
				B(e, {
					get icon() {
						return Me;
					},
					size: 14
				});
			}, t = n(() => Rt({ title: P(o).title })), i = n(() => [
				{
					kind: "item",
					id: "rename",
					label: Wt()
				},
				{ kind: "separator" },
				{
					kind: "item",
					id: "delete",
					label: Bt(),
					danger: !0
				}
			]);
			ae(g, {
				get label() {
					return P(t);
				},
				triggerClass: "list-menu",
				get entries() {
					return P(i);
				},
				onselect: (e) => {
					e === "rename" ? p(P(o).id, P(o).title) : r.session.deleteList(P(o).id).then((e) => {
						e && P(a).list === P(o).id && $({
							scope: "inbox",
							list: null,
							trashed: !1
						});
					});
				},
				trigger: e,
				$$slots: { trigger: !0 }
			});
		}
		z(s), D(() => {
			S(l, "aria-current", !P(a).trashed && P(a).list === P(o).id ? "page" : void 0), e(f, P(o).title);
		}), v("click", l, () => $({
			scope: "all",
			list: P(o).id,
			trashed: !1
		})), i(t, s);
	});
	var U = C(H, 2), ce = (e) => {
		var t = Rn(), r = j(t);
		B(r, {
			get icon() {
				return je;
			},
			size: 16
		});
		var a = C(r);
		O(a), N(a, (e) => L(s, e), () => P(s));
		var c = C(a);
		{
			let e = n(() => Kt()), t = n(() => P(l) || !P(o).title.trim());
			at(c, {
				get icon() {
					return Ie;
				},
				get label() {
					return P(e);
				},
				get disabled() {
					return P(t);
				},
				onclick: () => void m()
			});
		}
		z(t), D((e, t) => {
			S(a, "aria-label", e), S(a, "placeholder", t), a.disabled = P(l);
		}, [() => Ht(), () => Ht()]), _("submit", t, (e) => {
			e.preventDefault(), m();
		}), v("keydown", a, (e) => {
			e.key === "Escape" && L(o, null);
		}), F(a, () => P(o).title, (e) => P(o).title = e), i(e, t);
	}, le = (t) => {
		var n = zn(), r = j(n);
		B(r, {
			get icon() {
				return te;
			},
			size: 16
		});
		var a = C(r), o = j(a, !0);
		z(a), z(n), D((t) => e(o, t), [() => Qt()]), v("click", n, () => void p()), i(t, n);
	};
	c(U, (e) => {
		P(o) ? e(ce) : r.session.lists.length === 0 && e(le, 1);
	}), z(V), z(k);
	var G = C(k, 2), K = j(G), q = j(K);
	B(q, {
		get icon() {
			return Ie;
		},
		size: 17
	});
	var J = C(q), Y = j(J, !0);
	z(J), z(K);
	var X = C(K), Z = j(X);
	B(Z, {
		get icon() {
			return Ae;
		},
		size: 16
	});
	var ue = C(Z), de = j(ue, !0);
	z(ue), z(X), z(G), z(h), D((t, n, r, i, o) => {
		S(h, "aria-label", t), e(x, n), e(I, r), S(K, "aria-current", !P(a).trashed && !P(a).list && P(a).scope === "completed" ? "page" : void 0), e(Y, i), S(X, "aria-current", P(a).trashed ? "page" : void 0), e(de, o);
	}, [
		() => We(),
		() => nn(),
		() => Xt(),
		() => sn(),
		() => Pt()
	]), v("click", K, () => $({
		scope: "completed",
		list: null,
		trashed: !1
	})), v("click", X, () => $({
		trashed: !0,
		list: null
	})), i(t, h), E();
}
o(["click", "keydown"]);
// upstream/src/features/tasks/lib/detail-motion.ts
var Hn = ".page-column", Un = ":scope > .page-detail";
function Wn(e) {
	if (!e || rt()) return null;
	let t = e.querySelector(Un);
	return {
		column: e.querySelector(Hn)?.getBoundingClientRect() ?? null,
		detail: t,
		detailRect: t?.getBoundingClientRect() ?? null
	};
}
function Gn(e, t) {
	if (!e || !t) return;
	let n = it("page"), r = e.querySelector(Hn), i = r?.getBoundingClientRect();
	if (r && i && t.column) {
		let e = t.column.left - i.left;
		Math.abs(e) > 1 && r.animate([{ transform: `translateX(${e}px)` }, { transform: "none" }], {
			duration: n,
			easing: nt("emphasized")
		});
	}
	let a = e.querySelector(Un);
	a && a !== t.detail && a.animate([{
		opacity: 0,
		transform: "translateX(28px)"
	}, {
		opacity: 1,
		transform: "none"
	}], {
		duration: n,
		easing: nt("emphasized"),
		fill: "backwards"
	});
	let o = t.detail, s = t.detailRect;
	if (o && s && !o.isConnected) {
		for (let e of [o, ...o.querySelectorAll("[id]")]) e.removeAttribute("id");
		o.setAttribute("aria-hidden", "true"), o.inert = !0;
		let t = e.getBoundingClientRect();
		Object.assign(o.style, {
			position: "absolute",
			left: `${s.left - t.left}px`,
			top: `${s.top - t.top}px`,
			width: `${s.width}px`,
			height: `${s.height}px`,
			pointerEvents: "none"
		}), e.append(o), o.animate([{
			opacity: 1,
			transform: "none"
		}, {
			opacity: 0,
			transform: "translateX(28px)"
		}], {
			duration: it("base"),
			easing: nt("exit"),
			fill: "forwards"
		}).finished.catch(() => void 0).then(() => o.remove());
	}
}
// upstream/src/features/tasks/components/TasksPage.svelte
var Kn = h("<!> <!>", 1), qn = h("<div class=\"page-detail svelte-1i0urwu\"><!></div>"), Jn = h("<section class=\"library-shell task-page svelte-1i0urwu\" role=\"group\"><div class=\"page-nav svelte-1i0urwu\"><!></div> <div><div><div><header class=\"page-head svelte-1i0urwu\"><div class=\"page-heading svelte-1i0urwu\"><h1 class=\"svelte-1i0urwu\"> </h1> <p class=\"svelte-1i0urwu\"> </p></div> <div class=\"page-tools svelte-1i0urwu\"><!> <!></div></header> <!></div></div> <!> <!></div></section>");
function Yn(t, r) {
	u(r, !0);
	let o = () => import("./TaskBoard-yQXSg84c.js"), s = () => import("./TaskDetail-Bitfi7x0.js"), l = n(() => Cn.profile()?.id ?? "unbound"), d = y(w(() => $e(P(l), "page"))), f = y(x(w(() => P(d).query))), h = y(!1), _ = y(void 0);
	I(() => {
		let e = P(l);
		return w(() => {
			kn(e);
			let t = $e(e, "page");
			return L(d, t), L(f, t.query, !0), t.start(t.query), () => t.stop();
		});
	}), I(() => Re());
	let O = n(On);
	I(() => {
		let e = P(O).trashed, t = P(O).scope, n = Le(), r = P(O).list;
		w(() => {
			P(d).showTrash(e), P(d).setView(t, n, r);
		});
	});
	let A = n(() => Cn.activeTab()), M = n(() => P(A)?.url && /^https?:\/\//iu.test(P(A).url) ? {
		url: P(A).url,
		title: P(A).title
	} : null), F = new Ye("(min-width: 1100px)"), R = n(() => P(d).rows.find((e) => e.id === P(d).selectedId) ?? null), B = y(void 0), te = n(() => P(R) !== null), V = null, H = null;
	b(() => {
		let e = P(te);
		w(() => {
			V !== null && V !== e && F.current && (H = Wn(P(B)));
		});
	}), I(() => {
		let e = P(te);
		w(() => {
			V !== null && V !== e && Gn(P(B), H), H = null, V = e;
		});
	}), I(() => void s());
	let re = n(() => P(f).trim().length > 0), ie = n(() => !P(O).trashed && !P(re) && (P(O).scope === "all" || !!P(O).list)), U = n(() => P(O).board && P(ie)), ae = n(() => P(d).lists.find((e) => e.id === P(O).list) ?? null), oe = {
		inbox: ne,
		today: ln,
		upcoming: dn,
		all: an,
		completed: sn
	}, se = new Intl.DateTimeFormat(void 0, {
		weekday: "long",
		month: "long",
		day: "numeric",
		timeZone: "UTC"
	}), W = n(() => P(re) ? pn() : P(O).trashed ? Pt() : P(O).list ? P(ae)?.title ?? an() : oe[P(O).scope]()), ce = n(() => {
		if (P(re)) return It({ count: P(d).rows.length });
		let e = P(d).counts;
		if (P(O).trashed) return It({ count: e.trash });
		if (P(O).list) return It({ count: P(ae)?.count ?? 0 });
		if (P(O).scope === "today") {
			let [t, n, r] = Le().split("-").map(Number), i = se.format(new Date(Date.UTC(t, n - 1, r)));
			return e.overdue ? `${i} · ${hn({ count: e.overdue })}` : i;
		}
		let t = {
			inbox: e.inbox,
			upcoming: e.upcoming,
			all: e.all,
			completed: e.completed
		}[P(O).scope];
		return It({ count: t });
	});
	function le() {
		P(d).selectedId = null, (P(O).trashed || P(O).scope === "completed") && $({
			scope: "all",
			trashed: !1
		}), $({ board: !1 }), L(h, !0);
	}
	async function G() {
		let e = P(d).selectedId;
		P(d).selectedId = null, await ee(), P(_)?.querySelector(`[data-task-id="${CSS.escape(e ?? "")}"] .task-title, [data-task-card="${CSS.escape(e ?? "")}"] .board-card-title`)?.focus();
	}
	function K(e) {
		if (e.defaultPrevented || e.target.closest("input,textarea,select,[contenteditable=true]")) return;
		let t = !e.metaKey && !e.ctrlKey && !e.altKey;
		e.key === "Escape" && P(R) ? (e.preventDefault(), G()) : t && e.key.toLowerCase() === "n" && !P(O).trashed ? (e.preventDefault(), le()) : t && e.key === "/" ? (e.preventDefault(), P(_)?.querySelector(".page-tools input")?.focus()) : (e.metaKey || e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === "z" && P(d).undoable && (e.preventDefault(), P(d).undo());
	}
	var q = Jn(), J = j(q);
	Vn(j(J), {
		get session() {
			return P(d);
		},
		onclose: () => void Sn.close()
	}), z(J);
	var Y = C(J, 2);
	let X;
	var Z = j(Y);
	let ue;
	var de = j(Z);
	let fe;
	var pe = j(de), me = j(pe), he = j(me), ge = j(he, !0);
	z(he);
	var _e = C(he, 2), ve = j(_e, !0);
	z(_e), z(me);
	var ye = C(me, 2), be = j(ye);
	{
		let e = n(() => yn()), t = n(() => yn());
		ct(be, {
			get label() {
				return P(e);
			},
			get placeholder() {
				return P(t);
			},
			size: "chrome",
			get value() {
				return P(f);
			},
			oninput: (e) => {
				L(f, e, !0), P(d).search(e);
			}
		});
	}
	var xe = C(be, 2), Se = (e) => {
		{
			let t = n(() => _n()), r = n(() => P(U) ? "board" : "list"), i = n(() => [{
				value: "list",
				label: Jt()
			}, {
				value: "board",
				label: qe()
			}]);
			Pn(e, {
				get label() {
					return P(t);
				},
				get value() {
					return P(r);
				},
				get options() {
					return P(i);
				},
				onchange: (e) => $({ board: e === "board" })
			});
		}
	};
	c(xe, (e) => {
		P(ie) && e(Se);
	}), z(ye), z(pe);
	var Ce = C(pe, 2), we = (e) => {
		var t = Kn(), r = k(t);
		Ge(r, { get session() {
			return P(d);
		} });
		var a = C(r, 2);
		{
			let e = (e, t = g) => {
				var n = m(), r = k(n);
				T(r, t, (e, t) => {
					t(e, {
						get rows() {
							return P(d).rows;
						},
						get selectedId() {
							return P(d).selectedId;
						},
						onmove: (e, t, n) => P(d).move(e, t, n),
						onselect: (e) => void P(d).load(e),
						onopenpage: (e) => void Xe.browserOpenUrl(e, !1)
					});
				}), i(e, n);
			}, t = n(() => Ue()), r = n(() => Ve()), s = n(() => ze());
			Be(a, {
				loader: o,
				get loadingLabel() {
					return P(t);
				},
				get failureLabel() {
					return P(r);
				},
				get retryLabel() {
					return P(s);
				},
				children: e,
				$$slots: { default: !0 }
			});
		}
		i(e, t);
	}, Te = (e) => {
		Ke(e, {
			get session() {
				return P(d);
			},
			get scope() {
				return P(O).scope;
			},
			get listId() {
				return P(O).list;
			},
			density: "page",
			get page() {
				return P(M);
			},
			get query() {
				return P(f);
			},
			get composing() {
				return P(h);
			},
			inlineDetail: !1,
			notices: !1,
			oncomposed: () => L(h, !1)
		});
	};
	c(Ce, (e) => {
		P(U) ? e(we) : e(Te, -1);
	}), z(de), z(Z);
	var Ee = C(Z, 2), De = (e) => {
		var t = qn(), r = j(t);
		{
			let e = (e, t = g) => {
				var r = m(), o = k(r);
				a(o, () => P(R).id, (e) => {
					var r = m(), a = k(r);
					{
						let e = n(() => P(d).saving(P(R).id)), r = n(Le), i = n(() => !F.current);
						T(a, t, (t, n) => {
							n(t, {
								get task() {
									return P(R);
								},
								get saving() {
									return P(e);
								},
								get today() {
									return P(r);
								},
								get lists() {
									return P(d).lists;
								},
								get compact() {
									return P(i);
								},
								get trashed() {
									return P(O).trashed;
								},
								onclose: () => void G(),
								ontoggle: (e, t) => void P(d).setStatus(e, t),
								onschedule: (e, t, n) => void P(d).schedule(e, t, n),
								ondeadline: (e, t) => void P(d).setDeadline(e, t),
								onduration: (e, t) => void P(d).setDuration(e, t),
								onorganize: (e, t, n) => void P(d).organize(e, t, n),
								onpriority: (e, t) => void P(d).prioritize(e, t),
								onsteps: (e, t) => P(d).updateSteps(e, t),
								onsteprename: (e, t, n) => P(d).renameStep(e, t, n),
								onrename: (e, t) => P(d).rename(e, t),
								ondescribe: (e, t) => P(d).describe(e, t),
								oncommit: (e) => P(d).commitText(e),
								onpin: (e, t) => void P(d).setPinned(e, t),
								onremove: (e) => {
									P(d).selectedId = null, P(d).setTrashed(e, !P(O).trashed);
								},
								onopenpage: (e) => void Xe.browserOpenUrl(e, !1)
							});
						});
					}
					i(e, r);
				}), i(e, r);
			}, t = n(() => Ue()), o = n(() => Ve()), c = n(() => ze());
			Be(r, {
				loader: s,
				get loadingLabel() {
					return P(t);
				},
				get failureLabel() {
					return P(o);
				},
				get retryLabel() {
					return P(c);
				},
				children: e,
				$$slots: { default: !0 }
			});
		}
		z(t), i(e, t);
	};
	c(Ee, (e) => {
		P(R) && e(De);
	});
	var Oe = C(Ee, 2);
	He(Oe, {
		get notice() {
			return P(d).notice;
		},
		onundo: () => void P(d).undo(),
		ondismiss: () => P(d).dismissNotice()
	}), z(Y), N(Y, (e) => L(B, e), () => P(B)), z(q), N(q, (e) => L(_, e), () => P(_)), D((t) => {
		S(q, "aria-label", t), X = p(Y, 1, "page-stage svelte-1i0urwu", null, X, {
			"has-detail": P(R) !== null,
			compact: !F.current
		}), ue = p(Z, 1, "page-list svelte-1i0urwu", null, ue, { concealed: !F.current && P(R) !== null }), fe = p(de, 1, "page-column svelte-1i0urwu", null, fe, { board: P(U) }), e(ge, P(W)), e(ve, P(ce));
	}, [() => We()]), v("keydown", q, K), i(t, q), E();
}
o(["keydown"]);
// upstream/src/shared/ui/Disclosure/Disclosure.svelte
var Xn = h("<div class=\"ui-disclosure svelte-9j66p3\" role=\"presentation\"><button type=\"button\"><!></button> <div><!></div></div>");
function Zn(e, n) {
	u(n, !0);
	let r = M(n, "menu", 3, !1), a = M(n, "align", 3, "start"), o = M(n, "triggerClass", 3, ""), s = M(n, "panelClass", 3, ""), c = y(!1), d = y(void 0), f = y(void 0), m = y(void 0), h = y(void 0), g = () => [...P(m)?.querySelectorAll("[role=\"menuitem\"]:not(:disabled):not([aria-disabled=\"true\"])") ?? []];
	function _(e = !1) {
		L(d, U(P(h)), !0), L(c, !0), n.onopen?.(), r() && queueMicrotask(() => {
			P(c) && (e ? g().at(-1) : g()[0])?.focus();
		});
	}
	function b(e) {
		P(c) && (L(c, !1), n.onclose?.(), e && P(h)?.focus());
	}
	I(() => {
		if (!P(c)) return;
		let e = (e) => {
			e.target instanceof Node && P(f)?.contains(e.target) || b(!1);
		}, t = () => b(!1);
		return window.addEventListener("pointerdown", e, !0), window.addEventListener("blur", t), () => {
			window.removeEventListener("pointerdown", e, !0), window.removeEventListener("blur", t);
		};
	});
	function x(e) {
		if (r() && !P(c) && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
			e.preventDefault(), _(e.key === "ArrowUp");
			return;
		}
		if (e.key === "Escape" && P(c)) {
			e.stopPropagation(), b(!0);
			return;
		}
		if (!r() || !P(c)) return;
		let t = g(), n = t.indexOf(document.activeElement), i = e.key === "ArrowDown" ? 1 : e.key === "ArrowUp" ? -1 : e.key === "Home" ? 0 : null;
		e.key === "End" ? (e.preventDefault(), t.at(-1)?.focus()) : i === 0 ? (e.preventDefault(), t[0]?.focus()) : i !== null && t.length > 0 && (e.preventDefault(), t[(n + i + t.length) % t.length]?.focus());
	}
	var w = Xn(), T = j(w), O = j(T);
	l(O, () => n.trigger), z(T), N(T, (e) => L(h, e), () => P(h));
	var k = C(T, 2), A = j(k);
	l(A, () => n.children), z(k), N(k, (e) => L(m, e), () => P(m)), z(w), N(w, (e) => L(f, e), () => P(f)), D(() => {
		p(T, 1, t(o()), "svelte-9j66p3"), S(T, "aria-label", n.label), S(T, "title", n.triggerTitle), S(T, "aria-haspopup", r() ? "menu" : "dialog"), S(T, "aria-expanded", P(c)), S(T, "data-state", P(c) ? "open" : "closed"), S(k, "data-menu-material", P(d)), p(k, 1, t([
			"ui-menu",
			"ui-disclosure-panel",
			!r() && "ui-popover",
			s()
		]), "svelte-9j66p3"), S(k, "role", r() ? "menu" : "group"), S(k, "aria-label", n.label), S(k, "data-align", a()), S(k, "data-open", P(c)), k.inert = !P(c);
	}), v("keydown", w, x), v("focusout", w, (e) => {
		let t = e.relatedTarget;
		t instanceof Node && !P(f)?.contains(t) && b(!1);
	}), v("click", T, () => P(c) ? b(!1) : _()), v("click", k, (e) => {
		let t = e.target;
		(t?.closest("[data-dismiss]") || r() && !t?.closest("[data-keep-open]") && t?.closest("[role=\"menuitem\"]")) && b(!0);
	}), i(e, w), E();
}
o([
	"keydown",
	"focusout",
	"click"
]);
// upstream/src/features/notes/components/NotesPage.svelte
var Qn = h("<button type=\"button\" class=\"head-button svelte-om6rno\"><!></button>"), $n = h("<strong class=\"svelte-om6rno\"> </strong> <span> </span>", 1), er = h("<div class=\"column-empty svelte-om6rno\"><!></div>"), tr = h("<footer class=\"column-foot svelte-om6rno\"><button type=\"button\" class=\"foot-row svelte-om6rno\"><!><span> </span></button></footer>"), nr = h("<div class=\"stage-scroll svelte-om6rno\"><div class=\"stage-column svelte-om6rno\"><!></div></div>"), rr = h("<header><div class=\"stage-side svelte-om6rno\"><!></div> <div class=\"stage-heading svelte-om6rno\"><span> </span> <span class=\"sr-only\" aria-live=\"polite\"> </span> <span> </span></div> <div class=\"stage-side end svelte-om6rno\"><!> <!></div></header> <!>", 1), ir = h("<div class=\"stage-empty svelte-om6rno\"><span class=\"stage-empty-icon svelte-om6rno\"><!></span> <div class=\"stage-empty-text svelte-om6rno\"><h2 class=\"svelte-om6rno\"> </h2> <p class=\"svelte-om6rno\"> </p></div> <div class=\"stage-empty-actions svelte-om6rno\"><button type=\"button\" class=\"stage-new svelte-om6rno\"><!><span> </span><span class=\"stage-hint svelte-om6rno\">⌥⌘N</span></button> <button type=\"button\" class=\"stage-link svelte-om6rno\"> </button></div></div>"), ar = h("<section><div class=\"notes-column svelte-om6rno\"><header class=\"column-head svelte-om6rno\"><div class=\"column-title svelte-om6rno\"><!> <div class=\"title-text svelte-om6rno\"><h1 class=\"svelte-om6rno\"> </h1> <p class=\"svelte-om6rno\"> </p></div> <!> <button type=\"button\" class=\"head-button svelte-om6rno\"><!></button></div> <!></header> <!> <!></div> <div class=\"notes-stage svelte-om6rno\" data-note-bounds=\"\"><!> <!></div></section>");
function or(t, o) {
	u(o, !0);
	let s = n(() => o.profile ? Qe(o.profile, "page") : null);
	I(() => {
		let e = P(s);
		if (e) return w(() => (e.start(), () => e.stop()));
	});
	let l = new Ye("(min-width: 900px)"), d = n(() => P(s)?.note ?? null), h = y(x(w(() => P(s)?.query ?? ""))), g = y(void 0), T = y(!1);
	b(() => {
		P(d)?.version, L(T, !1);
	});
	let O = y(x(Date.now())), A = n(() => Number(P(d)?.summary?.modified_at) || 0);
	b(() => {
		P(A), L(O, Date.now(), !0);
	}), I(() => {
		if (P(O), !P(A)) return;
		let e = setTimeout(() => L(O, Date.now(), !0), de(P(A), Date.now()) + 250);
		return () => clearTimeout(e);
	});
	let M = n(() => P(s)?.trash ? pe() : ve()), ee = n(() => {
		if (!P(s)?.loaded) return "";
		let e = P(s).items.length, t = P(s).next ? "+" : "";
		return `${Ce(e)}${t}`;
	}), F = ot(() => P(s)?.saveState === "saving"), R = n(() => P(s)?.saveState === "retrying"), te = n(() => !P(s) || !P(d)?.summary ? "" : P(R) ? gt() : F.current ? bt() : xe(P(A), P(O))), ne = n(() => P(d)?.trashed ? [
		{
			kind: "item",
			id: "restore",
			label: X(),
			icon: ce
		},
		{ kind: "separator" },
		{
			kind: "item",
			id: "destroy",
			label: Y(),
			icon: Ae,
			danger: !0
		}
	] : [{
		kind: "item",
		id: "copy",
		label: G(),
		icon: ge
	}, ...P(d)?.id ? [
		{
			kind: "item",
			id: "reveal",
			label: Z(),
			icon: _e
		},
		{ kind: "separator" },
		{
			kind: "item",
			id: "delete",
			label: K(),
			icon: Ae,
			danger: !0,
			hint: "⌘⌫"
		}
	] : []]);
	async function re(e) {
		let t = P(s), n = t?.note?.id;
		t && (e === "copy" ? await navigator.clipboard.writeText(t.markdown) : e === "reveal" && n ? await t.reveal(n) : e === "delete" && n ? await t.moveToTrash(n) : e === "restore" && n ? await t.restore(n) : e === "destroy" && n && await t.deleteForever(n));
	}
	function ie() {
		P(g)?.querySelector(".note-document")?.focus();
	}
	async function U() {
		(!P(s) || await P(s).close()) && o.onclose();
	}
	function oe(e) {
		if (e.defaultPrevented) return;
		let t = e.target.closest("input, textarea, [contenteditable='true']");
		e.key === "Escape" && t?.closest(".note-document") ? (e.preventDefault(), document.querySelector(`[data-note-id="${P(d)?.id}"] .note-row-open`)?.focus()) : t || (e.key === "/" && !e.metaKey && !e.ctrlKey ? (e.preventDefault(), document.querySelector(".notes-page .ui-search input")?.focus()) : e.key !== "n" || e.metaKey || e.ctrlKey || e.altKey || (e.preventDefault(), P(s)?.create()));
	}
	var W = m(), je = k(W), Fe = (t) => {
		var o = ar();
		let u;
		var m = j(o), y = j(m), b = j(y), x = j(b), w = (e) => {
			var t = Qn(), n = j(t);
			B(n, {
				get icon() {
					return H;
				},
				size: 17
			}), z(t), D((e, n) => {
				S(t, "aria-label", e), S(t, "title", n);
			}, [() => ut(), () => ut()]), v("click", t, () => void P(s)?.showTrash(!1)), i(e, t);
		};
		c(x, (e) => {
			P(s).trash && e(w);
		});
		var E = C(x, 2), O = j(E), A = j(O, !0);
		z(O);
		var F = C(O, 2), I = j(F, !0);
		z(F), z(E);
		var W = C(E, 2), ce = (e) => {
			var t = Qn(), n = j(t);
			B(n, {
				get icon() {
					return Ne;
				},
				size: 17
			}), z(t), D((e, n) => {
				S(t, "aria-label", e), S(t, "title", `${n ?? ""}  ⌥⌘N`);
			}, [() => ke(), () => ke()]), v("click", t, () => void P(s)?.create()), i(e, t);
		};
		c(W, (e) => {
			P(s).trash || e(ce);
		});
		var G = C(W, 2), K = j(G);
		B(K, {
			get icon() {
				return se;
			},
			size: 17
		}), z(G), z(b);
		var Y = C(b, 2);
		{
			let e = n(() => St()), t = n(() => St());
			ct(Y, {
				get label() {
					return P(e);
				},
				get placeholder() {
					return P(t);
				},
				size: "chrome",
				get value() {
					return P(h);
				},
				oninput: (e) => {
					L(h, e, !0), P(s)?.search(e);
				}
			});
		}
		z(y);
		var X = C(y, 2), Z = (t) => {
			var r = er(), a = j(r), o = (t) => {
				var n = $n(), r = k(n), a = j(r, !0);
				z(r);
				var o = C(r, 2), s = j(o, !0);
				z(o), D((t, n) => {
					e(a, t), e(s, n);
				}, [() => le(), () => J()]), i(t, n);
			}, l = n(() => P(h).trim()), u = (t) => {
				var n = $n(), r = k(n), a = j(r, !0);
				z(r);
				var o = C(r, 2), s = j(o, !0);
				z(o), D((t, n) => {
					e(a, t), e(s, n);
				}, [() => me(), () => ye()]), i(t, n);
			}, d = (t) => {
				var n = $n(), r = k(n), a = j(r, !0);
				z(r);
				var o = C(r, 2), s = j(o, !0);
				z(o), D((t, n) => {
					e(a, t), e(s, n);
				}, [() => Oe(), () => De()]), i(t, n);
			};
			c(a, (e) => {
				P(l) ? e(o) : P(s).trash ? e(u, 1) : e(d, -1);
			}), z(r), i(t, r);
		}, de = (e) => {
			he(e, {
				get session() {
					return P(s);
				},
				density: "page",
				onopen: (e) => void P(s)?.open(e),
				onedit: ie
			});
		};
		c(X, (e) => {
			P(s).loaded && !P(s).items.length ? e(Z) : e(de, -1);
		});
		var ge = C(X, 2), _e = (t) => {
			var n = tr(), r = j(n), a = j(r);
			B(a, {
				get icon() {
					return Ae;
				},
				size: 15
			});
			var o = C(a), c = j(o, !0);
			z(o), z(r), z(n), D((t) => e(c, t), [() => pe()]), v("click", r, () => void P(s)?.showTrash(!0)), i(t, n);
		};
		c(ge, (e) => {
			P(s).trash || e(_e);
		}), z(m);
		var xe = C(m, 2), Ce = j(xe), je = (t) => {
			var o = rr(), u = k(o);
			let f;
			var m = j(u), h = j(m), g = (e) => {
				var t = Qn(), n = j(t);
				B(n, {
					get icon() {
						return V;
					},
					size: 16
				}), z(t), D((e) => S(t, "aria-label", e), [() => ft()]), v("click", t, () => void P(s)?.close()), i(e, t);
			};
			c(h, (e) => {
				l.current || e(g);
			}), z(m);
			var y = C(m, 2), b = j(y);
			let x;
			var w = j(b, !0);
			z(b);
			var E = C(b, 2), O = j(E, !0);
			z(E);
			var A = C(E, 2);
			let M;
			var ee = j(A, !0);
			z(A), z(y);
			var N = C(y, 2), F = j(N), I = (e) => {
				var t = Qn(), r = j(t);
				{
					let e = n(() => P(d).summary?.pinned ? q : Pe);
					B(r, {
						get icon() {
							return P(e);
						},
						size: 16
					});
				}
				z(t), D((e, n) => {
					S(t, "aria-label", e), S(t, "title", n), S(t, "aria-pressed", P(d).summary?.pinned ?? !1);
				}, [() => P(d).summary?.pinned ? fe() : Ee(), () => P(d).summary?.pinned ? fe() : Ee()]), v("click", t, () => P(d).id && void P(s)?.setPinned(P(d).id, !P(d).summary?.pinned)), i(e, t);
			};
			c(F, (e) => {
				P(d).id && !P(d).trashed && e(I);
			});
			var H = C(F, 2);
			{
				let e = (e) => {
					B(e, {
						get icon() {
							return Me;
						},
						size: 16
					});
				}, t = n(() => ue());
				ae(H, {
					get label() {
						return P(t);
					},
					get entries() {
						return P(ne);
					},
					side: "bottom",
					align: "end",
					triggerClass: "head-button",
					onselect: (e) => void re(e),
					trigger: e,
					$$slots: { trigger: !0 }
				});
			}
			z(N), z(u);
			var ie = C(u, 2);
			a(ie, () => P(d).version, (e) => {
				var t = nr(), n = j(t), a = j(n);
				Se(a, {
					get session() {
						return P(s);
					},
					density: "page",
					autofocus: !0
				}), z(n), z(t), r(t, (e, t) => we?.(e, t), () => "forward"), _("scroll", t, (e) => L(T, e.currentTarget.scrollTop > 56)), i(e, t);
			}), D((t, n) => {
				f = p(u, 1, "stage-bar svelte-om6rno", null, f, { scrolled: P(T) }), x = p(b, 1, "stage-status svelte-om6rno", null, x, { away: P(T) }), e(w, P(te)), e(O, t), M = p(A, 1, "stage-title svelte-om6rno", null, M, { away: !P(T) }), S(A, "aria-hidden", !P(T)), e(ee, n);
			}, [() => P(R) ? gt() : "", () => P(d).summary?.title || Te()]), i(t, o);
		}, Fe = (t) => {
			var n = ir(), r = j(n), a = j(r);
			B(a, {
				get icon() {
					return Ne;
				},
				size: 26
			}), z(r);
			var o = C(r, 2), c = j(o), l = j(c, !0);
			z(c);
			var u = C(c, 2), d = j(u, !0);
			z(u), z(o);
			var p = C(o, 2), m = j(p), h = j(m);
			B(h, {
				get icon() {
					return Ne;
				},
				size: 15
			});
			var g = C(h), _ = j(g, !0);
			z(g), f(), z(m);
			var y = C(m, 2), b = j(y, !0);
			z(y), z(p), z(n), D((t, n, r, i) => {
				e(l, t), e(d, n), e(_, r), e(b, i);
			}, [
				() => Et(),
				() => wt(),
				() => ke(),
				() => vt()
			]), v("click", m, () => void P(s)?.create()), v("click", y, () => void P(s)?.reveal(null)), i(t, n);
		};
		c(Ce, (e) => {
			P(d) ? e(je) : e(Fe, -1);
		});
		var Ie = C(Ce, 2);
		be(Ie, { get session() {
			return P(s);
		} }), z(xe), N(xe, (e) => L(g, e), () => P(g)), z(o), D((t, n, r) => {
			u = p(o, 1, "notes-page svelte-om6rno", null, u, {
				narrow: !l.current,
				reading: P(d) !== null
			}), S(o, "aria-label", t), e(A, P(M)), e(I, P(ee)), S(G, "aria-label", n), S(G, "title", r);
		}, [
			() => ve(),
			() => mt(),
			() => mt()
		]), v("keydown", o, oe), v("click", G, () => void U()), i(t, o);
	};
	c(je, (e) => {
		P(s) && e(Fe);
	}), i(t, W), E();
}
o(["keydown", "click"]);
export { ct as C, ut as S, Mt as _, jn as a, St as b, Sn as c, yn as d, dn as f, Pt as g, an as h, Pn as i, Cn as l, sn as m, Zn as n, An as o, ln as p, Yn as r, $ as s, or as t, bn as u, At as v, ft as x, Ot as y };

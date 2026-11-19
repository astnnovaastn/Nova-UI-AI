import "./disclose-version-7ONGmeVC.js";
import { B as e, Ct as t, H as n, J as r, L as i, Mt as a, P as o, W as s, X as c, Y as l, bt as u, h as d, ht as f, jt as p, lt as m, mt as h, pt as g, r as _, tt as v, ut as y, vt as b, x, zt as S } from "./index-client-DH73-vTM.js";
import { t as C } from "./Icon-D2j1Ej6Z.js";
import { a as w, n as T } from "./Menu-BPg_6BBl.js";
import "./Icon-CmjKIKuh.js";
import { r as E } from "./index-client-AzfegT-i.js";
import { t as D } from "./Alert02Icon-B5KhDP6a.js";
import { t as O } from "./ArrowDown01Icon-BD9DK2_Q.js";
import { n as ee, t as te } from "./Flag02Icon-CMlWs54y.js";
import { t as ne } from "./CheckListIcon-D8ytJXXy.js";
import { t as k } from "./CheckmarkCircle02Icon-BHrFtGZK.js";
import { t as A } from "./CircleIcon-BiaK_JU6.js";
import { n as re, t as ie } from "./SparklesIcon-Obe_A8gQ.js";
import { t as ae } from "./MoreHorizontalIcon-CIX2KIjy.js";
import { t as oe } from "./PinIcon-Cq04IxnM.js";
import { t as j } from "./PlayCircleIcon-dIVcUuVM.js";
import { a as M, c as N, i as P, l as se, n as F, o as I, t as L, u as ce } from "./task-order-C4dYLrd2.js";
import { t as R } from "./task_board-H2JRCnZ2.js";
import { D as le, E as ue, _ as de, c as fe, d as z, f as pe, i as me, n as he, p as ge, r as B, s as _e, t as ve, u as V } from "./TaskCheck-B3I-d4Tu.js";
import { t as H } from "./runtime-Ci9kzAvr.js";
// upstream/src/shared/i18n/messages/task_announce_moved.js
var U = (e) => `Moved ${e?.title} to ${e?.column}`, ye = ((e, t = {}) => (t.locale ?? H(), U(e))), W = () => "In progress", be = ((e = {}, t = {}) => (t.locale ?? H(), W(e))), G = () => "Blocked", xe = ((e = {}, t = {}) => (t.locale ?? H(), G(e))), K = () => "Done", Se = ((e = {}, t = {}) => (t.locale ?? H(), K(e))), q = () => "To do", Ce = ((e = {}, t = {}) => (t.locale ?? H(), q(e))), J = () => "Move down", we = ((e = {}, t = {}) => (t.locale ?? H(), J(e))), Y = () => "Move up", Te = ((e = {}, t = {}) => (t.locale ?? H(), Y(e))), X = () => "This position could not be saved. Try a different position.", Ee = ((e = {}, t = {}) => (t.locale ?? H(), X(e))), De = s("<p class=\"board-error svelte-9ufszc\" role=\"alert\"> </p>"), Oe = s("<span class=\"board-marker svelte-9ufszc\" aria-hidden=\"true\"></span>"), ke = s("<button type=\"button\" class=\"board-card-menu\"><!></button>"), Ae = s("<span class=\"svelte-9ufszc\"><!></span>"), Z = s("<span class=\"svelte-9ufszc\"><!> </span>"), je = s("<span class=\"board-deadline svelte-9ufszc\"><!> </span>"), Me = s("<button type=\"button\" class=\"board-site svelte-9ufszc\"><!> </button>"), Ne = s("<div class=\"board-card-meta svelte-9ufszc\"><!> <!> <!> <!> <!> <!> <!></div>"), Pe = s("<!> <article class=\"board-card svelte-9ufszc\"><div class=\"board-card-line svelte-9ufszc\"><!> <button type=\"button\" class=\"board-card-title svelte-9ufszc\"><!><span class=\"svelte-9ufszc\"> </span></button> <!></div> <!></article>", 1), Fe = s("<div class=\"board-empty svelte-9ufszc\" aria-hidden=\"true\"></div>"), Ie = s("<section class=\"board-column svelte-9ufszc\"><header class=\"board-heading svelte-9ufszc\"><!><span class=\"svelte-9ufszc\"> </span><small class=\"svelte-9ufszc\"> </small></header> <div class=\"board-cards svelte-9ufszc\"><!> <!> <!></div></section>"), Le = s("<div class=\"board-ghost svelte-9ufszc\"> </div>"), Re = s("<!> <div class=\"board svelte-9ufszc\" role=\"group\"></div> <!>", 1);
function Q(r, s) {
	a(s, !0);
	let H = _(s, "selectedId", 3, null), U = [
		{
			id: "open",
			label: Ce,
			icon: A
		},
		{
			id: "active",
			label: be,
			icon: j
		},
		{
			id: "blocked",
			label: xe,
			icon: D
		},
		{
			id: "done",
			label: Se,
			icon: k
		}
	], W = t(M), G = new E();
	y(() => I());
	let K = t(() => U.map((e) => ({
		...e,
		rows: s.rows.filter((t) => t.status === e.id).sort(fe)
	}))), q = u(null), J = P({ ondrop(e, t) {
		let n = Be(t);
		if (b(q, null), !n) return;
		let { status: r, over: i, after: a } = n, o = v(K).find((e) => e.id === r).rows.map((e) => e.id), s = F(o, e.id, i, a), c = L(s.before === null ? null : Y(s.before), s.after === null ? null : Y(s.after));
		c === null ? b(X, Ee(), !0) : Q(e, r, c);
	} }), Y = (e) => s.rows.find((t) => t.id === e)?.sortKey ?? null, X = u("");
	async function Q(e, t, n) {
		b(X, ""), await s.onmove(e.id, t, n) && s.announce?.(ye({
			title: e.title,
			column: U.find((e) => e.id === t).label()
		}));
	}
	function ze(e, t) {
		let n = v(K).find((t) => t.id === e.status), r = n.rows.findIndex((t) => t.id === e.id), i = n.rows[r + t];
		if (!i) return;
		let a = F(n.rows.map((e) => e.id), e.id, i.id, t > 0), o = L(a.before ? Y(a.before) : null, a.after ? Y(a.after) : null);
		o === null ? b(X, Ee(), !0) : Q(e, e.status, o);
	}
	function Be(e) {
		let t = (e?.closest("[data-task-column]"))?.dataset.taskColumn;
		if (!t) return null;
		let n = e?.closest("[data-task-card]");
		if (!n) return {
			status: t,
			over: null,
			after: !1
		};
		let r = n.getBoundingClientRect();
		return {
			status: t,
			over: n.dataset.taskCard ?? null,
			after: J.at.y > r.top + r.height / 2
		};
	}
	function Ve(e) {
		if (J.move(e), !J.item) return;
		let t = Be(document.elementFromPoint(J.at.x, J.at.y));
		b(q, t ? {
			column: t.status,
			before: t.over === null ? null : t.after ? He(t) : t.over
		} : null, !0);
	}
	function He(e) {
		let t = v(K).find((t) => t.id === e.status).rows.map((e) => e.id), n = t.indexOf(e.over ?? "");
		return n < 0 ? null : t[n + 1] ?? null;
	}
	var Ue = Re(), We = h(Ue), Ge = (t) => {
		var r = De(), i = g(r, !0);
		S(r), m(() => e(i, v(X))), n(t, r);
	};
	i(We, (e) => {
		v(X) && e(Ge);
	});
	var $ = f(We, 2);
	o($, 21, () => v(K), (e) => e.id, (r, a) => {
		var u = Ie(), p = g(u), _ = g(p);
		C(_, {
			get icon() {
				return v(a).icon;
			},
			size: 14
		});
		var y = f(_), b = g(y, !0);
		S(y);
		var x = f(y), E = g(x, !0);
		S(x), S(p);
		var D = f(p, 2), k = g(D);
		o(k, 17, () => v(a).rows, (e) => e.id, (r, o) => {
			var u = Pe(), p = h(u), _ = (e) => {
				var t = Oe();
				n(e, t);
			};
			i(p, (e) => {
				v(q)?.column === v(a).id && v(q).before === v(o).id && e(_);
			});
			var y = f(p, 2), b = g(y), x = g(b);
			ve(x, {
				get status() {
					return v(o).status;
				},
				get label() {
					return v(o).title;
				},
				ontoggle: (e) => void Q(v(o), e, v(o).sortKey)
			});
			var E = f(x, 2), D = g(E), k = (e) => {
				{
					let n = t(() => le());
					C(e, {
						get icon() {
							return ie;
						},
						size: 12,
						get label() {
							return v(n);
						}
					});
				}
			};
			i(D, (e) => {
				v(o).origin === "agent" && e(k);
			});
			var A = f(D), j = g(A, !0);
			S(A), S(E);
			var M = f(E, 2), P = (e) => {
				var t = ke(), r = g(t);
				C(r, {
					get icon() {
						return ae;
					},
					size: 14
				}), S(t), m((e) => d(t, "aria-label", e), [() => N()]), n(e, t);
			}, F = t(() => !G.has(v(o).id)), I = (e) => {
				{
					let n = (e) => {
						C(e, {
							get icon() {
								return ae;
							},
							size: 14
						});
					}, r = t(() => N()), i = t(() => [
						...U.map((e) => ({
							kind: "item",
							id: e.id,
							label: e.label(),
							icon: e.icon,
							checked: e.id === v(o).status
						})),
						{ kind: "separator" },
						{
							kind: "item",
							id: "up",
							label: Te(),
							icon: w,
							disabled: v(a).rows[0]?.id === v(o).id
						},
						{
							kind: "item",
							id: "down",
							label: we(),
							icon: O,
							disabled: v(a).rows.at(-1)?.id === v(o).id
						}
					]);
					T(e, {
						get label() {
							return v(r);
						},
						get entries() {
							return v(i);
						},
						triggerClass: "board-card-menu",
						onselect: (e) => {
							e === "up" || e === "down" ? ze(v(o), e === "up" ? -1 : 1) : e !== v(o).status && Q(v(o), e, null);
						},
						trigger: n,
						$$slots: { trigger: !0 }
					});
				}
			};
			i(M, (e) => {
				v(F) ? e(P) : e(I, -1);
			}), S(b);
			var L = f(b, 2), R = (r) => {
				var a = Ne(), c = g(a), u = (e) => {
					var r = Ae(), i = g(r);
					{
						let e = t(() => ue());
						C(i, {
							get icon() {
								return _e[v(o).priority];
							},
							size: 12,
							get label() {
								return v(e);
							}
						});
					}
					S(r), m(() => d(r, "data-priority", v(o).priority)), n(e, r);
				};
				i(c, (e) => {
					v(o).priority !== "none" && e(u);
				});
				var p = f(c, 2), h = (e) => {
					var r = Ae(), i = g(r);
					{
						let e = t(() => ce());
						C(i, {
							get icon() {
								return oe;
							},
							size: 11,
							get label() {
								return v(e);
							}
						});
					}
					S(r), n(e, r);
				};
				i(p, (e) => {
					v(o).pinned && e(h);
				});
				var _ = f(p, 2), y = (t) => {
					var r = Z(), i = g(r);
					C(i, {
						get icon() {
							return ee;
						},
						size: 11
					});
					var a = f(i, 1, !0);
					S(r), m((t, n) => {
						d(r, "data-tone", t), e(a, n);
					}, [() => v(o).status === "done" ? null : z(v(o).dueDate, v(W)), () => V(v(o).dueDate, v(W), B, v(o).dueTime)]), n(t, r);
				};
				i(_, (e) => {
					v(o).dueDate && e(y);
				});
				var b = f(_, 2), x = (t) => {
					var r = je(), i = g(r);
					C(i, {
						get icon() {
							return te;
						},
						size: 11
					});
					var a = f(i, 1, !0);
					S(r), m((t, n, i) => {
						d(r, "data-tone", t), d(r, "aria-label", n), e(a, i);
					}, [
						() => v(o).status === "done" ? null : z(v(o).deadline, v(W)),
						() => se({ date: V(v(o).deadline, v(W), B) }),
						() => V(v(o).deadline, v(W), B)
					]), n(t, r);
				};
				i(b, (e) => {
					v(o).deadline && e(x);
				});
				var w = f(b, 2), T = (t) => {
					var r = Z(), i = g(r);
					C(i, {
						get icon() {
							return re;
						},
						size: 11
					});
					var a = f(i, 1, !0);
					S(r), m((t) => e(a, t), [() => pe(v(o).duration, me)]), n(t, r);
				};
				i(w, (e) => {
					v(o).duration && e(T);
				});
				var E = f(w, 2), D = (t) => {
					var r = Z(), i = g(r);
					C(i, {
						get icon() {
							return ne;
						},
						size: 11
					});
					var a = f(i);
					S(r), m((t) => {
						d(r, "aria-label", t), e(a, `${v(o).stepDone ?? ""}/${v(o).stepCount ?? ""}`);
					}, [() => de({
						done: v(o).stepDone,
						total: v(o).stepCount
					})]), n(t, r);
				};
				i(E, (e) => {
					v(o).stepCount && e(D);
				});
				var O = f(E, 2), k = (t) => {
					var r = Me(), i = g(r);
					he(i, {
						get url() {
							return v(o).context.url;
						},
						size: 11
					});
					var a = f(i, 1, !0);
					S(r), m((t) => {
						d(r, "title", v(o).context.url), e(a, t);
					}, [() => ge(v(o).context.url)]), l("click", r, () => {
						J.absorbClick() || s.onopenpage(v(o).context.url);
					}), n(t, r);
				};
				i(O, (e) => {
					v(o).context && e(k);
				}), S(a), n(r, a);
			};
			i(L, (e) => {
				(v(o).priority !== "none" || v(o).pinned || v(o).dueDate || v(o).deadline || v(o).duration || v(o).stepCount || v(o).context) && e(R);
			}), S(y), m(() => {
				d(y, "data-task-card", v(o).id), d(y, "data-carrying", J.item?.id === v(o).id), d(y, "data-selected", H() === v(o).id), d(y, "data-status", v(o).status), e(j, v(o).title);
			}), c("pointerenter", y, () => G.add(v(o).id)), l("focusin", y, () => G.add(v(o).id)), l("pointerdown", y, (e) => J.begin(e, v(o))), l("pointermove", y, Ve), l("pointerup", y, function(...e) {
				J.end?.apply(this, e);
			}), c("pointercancel", y, function(...e) {
				J.cancel?.apply(this, e);
			}), l("click", E, () => {
				J.absorbClick() || s.onselect(v(o).id);
			}), n(r, u);
		});
		var A = f(k, 2), j = (e) => {
			var t = Oe();
			n(e, t);
		};
		i(A, (e) => {
			v(q)?.column === v(a).id && v(q).before === null && e(j);
		});
		var M = f(A, 2), P = (e) => {
			var t = Fe();
			n(e, t);
		};
		i(M, (e) => {
			v(a).rows.length || e(P);
		}), S(D), S(u), m((t) => {
			d(u, "data-task-column", v(a).id), d(u, "data-over", J.item !== null && v(q)?.column === v(a).id), d(p, "data-status", v(a).id), e(b, t), e(E, v(a).rows.length);
		}, [() => v(a).label()]), n(r, u);
	}), S($);
	var Ke = f($, 2), qe = (t) => {
		var r = Le();
		let i;
		var a = g(r, !0);
		S(r), m(() => {
			i = x(r, "", i, { translate: `${J.at.x + 12}px ${J.at.y + 8}px` }), e(a, J.item.title);
		}), n(t, r);
	};
	i(Ke, (e) => {
		J.item && e(qe);
	}), m((e) => {
		d($, "aria-label", e), d($, "data-dragging", J.item !== null);
	}, [() => R()]), n(r, Ue), p();
}
r([
	"focusin",
	"pointerdown",
	"pointermove",
	"pointerup",
	"click"
]);
export { Q as default };

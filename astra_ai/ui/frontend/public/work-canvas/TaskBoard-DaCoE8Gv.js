import "./disclose-version-DFvUDwEH.js";
import { $ as e, B as t, Dt as n, F as r, Ft as i, H as a, J as o, K as s, M as c, Ot as l, R as u, _t as d, dt as f, ft as p, h as m, ht as h, ot as g, q as _, r as v, st as y, ut as b, x, yt as S } from "./index-client-C_2wYFnt.js";
import { a as ee, n as C, s as w } from "./virtual-window.svelte-BaceNdhT.js";
import { t as T } from "./Icon-E4BzZ4dm.js";
import { r as E } from "./index-client-RfUBbaI1.js";
import { t as D } from "./Alert02Icon-Bvd3pGhx.js";
import { t as O } from "./ArrowDown01Icon-BOikJdel.js";
import { n as te, t as ne } from "./Flag02Icon-D5hm0ILw.js";
import { t as re } from "./CheckListIcon-BDgbvlUi.js";
import { t as k } from "./CheckmarkCircle02Icon-i44BIzoe.js";
import { t as A } from "./CircleIcon-D_E7DOWZ.js";
import { n as ie, t as ae } from "./SparklesIcon-bR5iXJxe.js";
import { t as oe } from "./MoreHorizontalIcon-CyEtVQ2N.js";
import { t as j } from "./PlayCircleIcon-B8ebJtDO.js";
import { E as se, H as M, R as ce, S as le, W as ue, X as de, _ as N, a as fe, b as P, c as F, d as I, f as pe, g as L, l as me, o as R, p as he, q as ge, s as z, v as B, x as _e, y as V } from "./Tasks-CCTBR112.js";
import { t as H } from "./runtime-Ci9kzAvr.js";
import { t as ve } from "./WorkspaceTools-CdRZL-_r.js";
// upstream/src/shared/i18n/messages/task_announce_moved.js
var U = (e) => `Moved ${e?.title} to ${e?.column}`, ye = ((e, t = {}) => (t.locale ?? H(), U(e))), W = () => "In progress", be = ((e = {}, t = {}) => (t.locale ?? H(), W(e))), G = () => "Blocked", xe = ((e = {}, t = {}) => (t.locale ?? H(), G(e))), K = () => "Done", Se = ((e = {}, t = {}) => (t.locale ?? H(), K(e))), q = () => "To do", Ce = ((e = {}, t = {}) => (t.locale ?? H(), q(e))), J = () => "Move down", we = ((e = {}, t = {}) => (t.locale ?? H(), J(e))), Y = () => "Move up", Te = ((e = {}, t = {}) => (t.locale ?? H(), Y(e))), X = () => "This position could not be saved. Try a different position.", Ee = ((e = {}, t = {}) => (t.locale ?? H(), X(e))), De = a("<p class=\"board-error svelte-9ufszc\" role=\"alert\"> </p>"), Oe = a("<span class=\"board-marker svelte-9ufszc\" aria-hidden=\"true\"></span>"), ke = a("<button type=\"button\" class=\"board-card-menu\"><!></button>"), Ae = a("<span class=\"svelte-9ufszc\"><!></span>"), Z = a("<span class=\"svelte-9ufszc\"><!> </span>"), je = a("<span class=\"board-deadline svelte-9ufszc\"><!> </span>"), Me = a("<button type=\"button\" class=\"board-site svelte-9ufszc\"><!> </button>"), Ne = a("<div class=\"board-card-meta svelte-9ufszc\"><!> <!> <!> <!> <!> <!> <!></div>"), Pe = a("<!> <article class=\"board-card svelte-9ufszc\"><div class=\"board-card-line svelte-9ufszc\"><!> <button type=\"button\" class=\"board-card-title svelte-9ufszc\"><!><span class=\"svelte-9ufszc\"> </span></button> <!></div> <!></article>", 1), Fe = a("<div class=\"board-empty svelte-9ufszc\" aria-hidden=\"true\"></div>"), Ie = a("<section class=\"board-column svelte-9ufszc\"><header class=\"board-heading svelte-9ufszc\"><!><span class=\"svelte-9ufszc\"> </span><small class=\"svelte-9ufszc\"> </small></header> <div class=\"board-cards svelte-9ufszc\"><!> <!> <!></div></section>"), Le = a("<div class=\"board-ghost svelte-9ufszc\"> </div>"), Re = a("<!> <div class=\"board svelte-9ufszc\" role=\"group\"></div> <!>", 1);
function Q(a, s) {
	l(s, !0);
	let H = v(s, "selectedId", 3, null), U = [
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
	], W = S(L), G = new E();
	y(() => N());
	let K = S(() => U.map((e) => ({
		...e,
		rows: s.rows.filter((t) => t.status === e.id).sort(B)
	}))), q = d(null), J = F({ ondrop(t, n) {
		let r = Be(n);
		if (h(q, null), !r) return;
		let { status: i, over: a, after: o } = r, s = e(K).find((e) => e.id === i).rows.map((e) => e.id), c = z(s, t.id, a, o), l = R(c.before === null ? null : Y(c.before), c.after === null ? null : Y(c.after));
		l === null ? h(X, Ee(), !0) : Q(t, i, l);
	} }), Y = (e) => s.rows.find((t) => t.id === e)?.sortKey ?? null, X = d("");
	async function Q(e, t, n) {
		h(X, ""), await s.onmove(e.id, t, n) && s.announce?.(ye({
			title: e.title,
			column: U.find((e) => e.id === t).label()
		}));
	}
	function ze(t, n) {
		let r = e(K).find((e) => e.id === t.status), i = r.rows.findIndex((e) => e.id === t.id), a = r.rows[i + n];
		if (!a) return;
		let o = z(r.rows.map((e) => e.id), t.id, a.id, n > 0), s = R(o.before ? Y(o.before) : null, o.after ? Y(o.after) : null);
		s === null ? h(X, Ee(), !0) : Q(t, t.status, s);
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
		h(q, t ? {
			column: t.status,
			before: t.over === null ? null : t.after ? He(t) : t.over
		} : null, !0);
	}
	function He(t) {
		let n = e(K).find((e) => e.id === t.status).rows.map((e) => e.id), r = n.indexOf(t.over ?? "");
		return r < 0 ? null : n[r + 1] ?? null;
	}
	var Ue = Re(), We = f(Ue), Ge = (n) => {
		var r = De(), a = b(r, !0);
		i(r), g(() => u(a, e(X))), t(n, r);
	};
	r(We, (t) => {
		e(X) && t(Ge);
	});
	var $ = p(We, 2);
	c($, 21, () => e(K), (e) => e.id, (n, a) => {
		var l = Ie(), d = b(l), h = b(d);
		T(h, {
			get icon() {
				return e(a).icon;
			},
			size: 14
		});
		var v = p(h), y = b(v, !0);
		i(v);
		var x = p(v), E = b(x, !0);
		i(x), i(d);
		var D = p(d, 2), k = b(D);
		c(k, 17, () => e(a).rows, (e) => e.id, (n, c) => {
			var l = Pe(), d = f(l), h = (e) => {
				var n = Oe();
				t(e, n);
			};
			r(d, (t) => {
				e(q)?.column === e(a).id && e(q).before === e(c).id && t(h);
			});
			var v = p(d, 2), y = b(v), x = b(y);
			fe(x, {
				get status() {
					return e(c).status;
				},
				get label() {
					return e(c).title;
				},
				ontoggle: (t) => void Q(e(c), t, e(c).sortKey)
			});
			var E = p(x, 2), D = b(E), k = (t) => {
				{
					let n = S(() => ue());
					T(t, {
						get icon() {
							return ae;
						},
						size: 12,
						get label() {
							return e(n);
						}
					});
				}
			};
			r(D, (t) => {
				e(c).origin === "agent" && t(k);
			});
			var A = p(D), j = b(A, !0);
			i(A), i(E);
			var N = p(E, 2), F = (e) => {
				var n = ke(), r = b(n);
				T(r, {
					get icon() {
						return oe;
					},
					size: 14
				}), i(n), g((e) => m(n, "aria-label", e), [() => M()]), t(e, n);
			}, L = S(() => !G.has(e(c).id)), R = (t) => {
				{
					let n = (e) => {
						T(e, {
							get icon() {
								return oe;
							},
							size: 14
						});
					}, r = S(() => M()), i = S(() => [
						...U.map((t) => ({
							kind: "item",
							id: t.id,
							label: t.label(),
							icon: t.icon,
							checked: t.id === e(c).status
						})),
						{ kind: "separator" },
						{
							kind: "item",
							id: "up",
							label: Te(),
							icon: w,
							disabled: e(a).rows[0]?.id === e(c).id
						},
						{
							kind: "item",
							id: "down",
							label: we(),
							icon: O,
							disabled: e(a).rows.at(-1)?.id === e(c).id
						}
					]);
					C(t, {
						get label() {
							return e(r);
						},
						get entries() {
							return e(i);
						},
						triggerClass: "board-card-menu",
						onselect: (t) => {
							t === "up" || t === "down" ? ze(e(c), t === "up" ? -1 : 1) : t !== e(c).status && Q(e(c), t, null);
						},
						trigger: n,
						$$slots: { trigger: !0 }
					});
				}
			};
			r(N, (t) => {
				e(L) ? t(F) : t(R, -1);
			}), i(y);
			var z = p(y, 2), B = (n) => {
				var a = Ne(), o = b(a), l = (n) => {
					var r = Ae(), a = b(r);
					{
						let t = S(() => ce());
						T(a, {
							get icon() {
								return he[e(c).priority];
							},
							size: 12,
							get label() {
								return e(t);
							}
						});
					}
					i(r), g(() => m(r, "data-priority", e(c).priority)), t(n, r);
				};
				r(o, (t) => {
					e(c).priority !== "none" && t(l);
				});
				var d = p(o, 2), f = (n) => {
					var r = Ae(), a = b(r);
					{
						let t = S(() => de());
						T(a, {
							get icon() {
								return ee;
							},
							size: 11,
							get label() {
								return e(t);
							}
						});
					}
					i(r), t(n, r);
				};
				r(d, (t) => {
					e(c).pinned && t(f);
				});
				var h = p(d, 2), v = (n) => {
					var r = Z(), a = b(r);
					T(a, {
						get icon() {
							return te;
						},
						size: 11
					});
					var o = p(a, 1, !0);
					i(r), g((e, t) => {
						m(r, "data-tone", e), u(o, t);
					}, [() => e(c).status === "done" ? null : P(e(c).dueDate, e(W)), () => V(e(c).dueDate, e(W), I, e(c).dueTime)]), t(n, r);
				};
				r(h, (t) => {
					e(c).dueDate && t(v);
				});
				var y = p(h, 2), x = (n) => {
					var r = je(), a = b(r);
					T(a, {
						get icon() {
							return ne;
						},
						size: 11
					});
					var o = p(a, 1, !0);
					i(r), g((e, t, n) => {
						m(r, "data-tone", e), m(r, "aria-label", t), u(o, n);
					}, [
						() => e(c).status === "done" ? null : P(e(c).deadline, e(W)),
						() => ge({ date: V(e(c).deadline, e(W), I) }),
						() => V(e(c).deadline, e(W), I)
					]), t(n, r);
				};
				r(y, (t) => {
					e(c).deadline && t(x);
				});
				var C = p(y, 2), w = (n) => {
					var r = Z(), a = b(r);
					T(a, {
						get icon() {
							return ie;
						},
						size: 11
					});
					var o = p(a, 1, !0);
					i(r), g((e) => u(o, e), [() => _e(e(c).duration, pe)]), t(n, r);
				};
				r(C, (t) => {
					e(c).duration && t(w);
				});
				var E = p(C, 2), D = (n) => {
					var r = Z(), a = b(r);
					T(a, {
						get icon() {
							return re;
						},
						size: 11
					});
					var o = p(a);
					i(r), g((t) => {
						m(r, "aria-label", t), u(o, `${e(c).stepDone ?? ""}/${e(c).stepCount ?? ""}`);
					}, [() => se({
						done: e(c).stepDone,
						total: e(c).stepCount
					})]), t(n, r);
				};
				r(E, (t) => {
					e(c).stepCount && t(D);
				});
				var O = p(E, 2), k = (n) => {
					var r = Me(), a = b(r);
					me(a, {
						get url() {
							return e(c).context.url;
						},
						size: 11
					});
					var o = p(a, 1, !0);
					i(r), g((t) => {
						m(r, "title", e(c).context.url), u(o, t);
					}, [() => le(e(c).context.url)]), _("click", r, () => {
						J.absorbClick() || s.onopenpage(e(c).context.url);
					}), t(n, r);
				};
				r(O, (t) => {
					e(c).context && t(k);
				}), i(a), t(n, a);
			};
			r(z, (t) => {
				(e(c).priority !== "none" || e(c).pinned || e(c).dueDate || e(c).deadline || e(c).duration || e(c).stepCount || e(c).context) && t(B);
			}), i(v), g(() => {
				m(v, "data-task-card", e(c).id), m(v, "data-carrying", J.item?.id === e(c).id), m(v, "data-selected", H() === e(c).id), m(v, "data-status", e(c).status), u(j, e(c).title);
			}), o("pointerenter", v, () => G.add(e(c).id)), _("focusin", v, () => G.add(e(c).id)), _("pointerdown", v, (t) => J.begin(t, e(c))), _("pointermove", v, Ve), _("pointerup", v, function(...e) {
				J.end?.apply(this, e);
			}), o("pointercancel", v, function(...e) {
				J.cancel?.apply(this, e);
			}), _("click", E, () => {
				J.absorbClick() || s.onselect(e(c).id);
			}), t(n, l);
		});
		var A = p(k, 2), j = (e) => {
			var n = Oe();
			t(e, n);
		};
		r(A, (t) => {
			e(q)?.column === e(a).id && e(q).before === null && t(j);
		});
		var N = p(A, 2), F = (e) => {
			var n = Fe();
			t(e, n);
		};
		r(N, (t) => {
			e(a).rows.length || t(F);
		}), i(D), i(l), g((t) => {
			m(l, "data-task-column", e(a).id), m(l, "data-over", J.item !== null && e(q)?.column === e(a).id), m(d, "data-status", e(a).id), u(y, t), u(E, e(a).rows.length);
		}, [() => e(a).label()]), t(n, l);
	}), i($);
	var Ke = p($, 2), qe = (e) => {
		var n = Le();
		let r;
		var a = b(n, !0);
		i(n), g(() => {
			r = x(n, "", r, { translate: `${J.at.x + 12}px ${J.at.y + 8}px` }), u(a, J.item.title);
		}), t(e, n);
	};
	r(Ke, (e) => {
		J.item && e(qe);
	}), g((e) => {
		m($, "aria-label", e), m($, "data-dragging", J.item !== null);
	}, [() => ve()]), t(a, Ue), n();
}
s([
	"focusin",
	"pointerdown",
	"pointermove",
	"pointerup",
	"click"
]);
export { Q as default };

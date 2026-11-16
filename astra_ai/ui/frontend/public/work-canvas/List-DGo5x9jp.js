import "./disclose-version-DFvUDwEH.js";
import { $ as e, B as t, Dt as n, F as r, Ft as i, H as a, J as o, K as s, M as c, N as l, Ot as u, R as d, S as f, V as p, _ as m, _t as h, dt as g, ft as _, h as v, ht as y, m as b, ot as x, q as S, r as C, s as w, tt as T, u as E, ut as D, yt as O } from "./index-client-C_2wYFnt.js";
import { r as k } from "./index-client-RfUBbaI1.js";
import { t as A } from "./Icon-E4BzZ4dm.js";
import { t as j } from "./MakeTasks-D9lKyDbj.js";
import { t as M } from "./Mark-BTIzBHOo.js";
import { t as N } from "./work_env_open-CZM6S6RQ.js";
import { t as P } from "./work_list_open_in-Bj6MoqBE.js";
import { t as F } from "./Title-BF8NXEcN.js";
import { t as I } from "./Tick02Icon-COqFGcdx.js";
import { t as L } from "./ArrowUpRight01Icon-BuQKjoN4.js";
import { t as R } from "./runtime-Ci9kzAvr.js";
// upstream/src/shared/i18n/messages/work_block_add_item.js
var z = () => "Add an item", B = ((e = {}, t = {}) => (t.locale ?? R(), z(e))), V = () => "Priority", H = ((e = {}, t = {}) => (t.locale ?? R(), V(e))), U = () => "Show answer", W = ((e = {}, t = {}) => (t.locale ?? R(), U(e))), G = a("<h3 class=\"svelte-uvek3x\"> </h3>"), K = a("<span class=\"count svelte-uvek3x\"> </span>"), q = a("<li><button type=\"button\" class=\"box nodrag nopan svelte-uvek3x\"><!></button> <input class=\"text nodrag nopan svelte-uvek3x\"/></li>"), J = a("<section class=\"checklist svelte-uvek3x\"><header class=\"svelte-uvek3x\"><!> <!></header> <ul class=\"svelte-uvek3x\"></ul> <label class=\"add svelte-uvek3x\"><span class=\"box ghost svelte-uvek3x\" aria-hidden=\"true\"></span> <input class=\"text nodrag nopan svelte-uvek3x\"/></label></section>");
function Y(a, s) {
	u(s, !0);
	let p = h(void 0), g = h(""), C = O(() => s.object.items.filter((e) => e.done).length);
	function k(e) {
		s.actions.edit?.(s.object.id, (t) => t.kind === "list" ? {
			...t,
			items: e([...t.items])
		} : t);
	}
	async function j(t) {
		await T();
		let n = e(p)?.querySelector(`[data-item="${t}"]`);
		n?.focus(), n?.setSelectionRange(n.value.length, n.value.length);
	}
	let M = (e) => k((t) => t.map((t, n) => n === e ? {
		...t,
		done: !t.done
	} : t));
	function N(e, t) {
		let n = t.trim();
		n !== s.object.items[e]?.title && k((t) => n ? t.map((t, r) => r === e ? {
			...t,
			title: n
		} : t) : t.filter((t, n) => n !== e));
	}
	function P(e, t) {
		let n = e.currentTarget;
		if (e.key === "Enter") {
			e.preventDefault();
			let r = n.value.trim();
			if (!r) return;
			k((e) => {
				let n = e.map((e, n) => n === t ? {
					...e,
					title: r
				} : e);
				return n.splice(t + 1, 0, { title: "" }), n;
			}), j(t + 1);
		} else e.key === "Backspace" && !n.value ? (e.preventDefault(), k((e) => e.filter((e, n) => n !== t)), j(Math.max(0, t - 1))) : e.key === "Escape" && n.blur();
	}
	function F(t) {
		if (t.key !== "Enter") return;
		t.preventDefault();
		let n = e(g).trim();
		n && (k((e) => [...e, { title: n }]), y(g, ""));
	}
	var L = J(), R = D(L), z = D(R), V = (e) => {
		var n = G(), r = D(n, !0);
		i(n), x(() => d(r, s.object.title)), t(e, n);
	};
	r(z, (e) => {
		s.object.title && e(V);
	});
	var H = _(z, 2), U = (n) => {
		var r = K(), a = D(r);
		i(r), x(() => d(a, `${e(C) ?? ""}/${s.object.items.length ?? ""}`)), t(n, r);
	};
	r(H, (e) => {
		s.object.items.length && e(U);
	}), i(R);
	var W = _(R, 2);
	c(W, 21, () => s.object.items, l, (n, a, s) => {
		var c = q();
		let l;
		var u = D(c), d = D(u), p = (e) => {
			A(e, {
				get icon() {
					return I;
				},
				size: 12
			});
		};
		r(d, (t) => {
			e(a).done && t(p);
		}), i(u);
		var h = _(u, 2);
		b(h), v(h, "data-item", s), i(c), x(() => {
			l = f(c, 1, "svelte-uvek3x", null, l, { done: e(a).done }), v(u, "aria-pressed", !!e(a).done), v(u, "aria-label", e(a).title), m(h, e(a).title), v(h, "aria-label", e(a).title);
		}), S("click", u, () => M(s)), o("blur", h, (e) => N(s, e.currentTarget.value)), S("keydown", h, (e) => P(e, s)), t(n, c);
	}), i(W);
	var Y = _(W, 2), X = _(D(Y), 2);
	b(X), i(Y), i(L), w(L, (e) => y(p, e), () => e(p)), x((e) => {
		v(L, "aria-label", s.object.title), v(X, "placeholder", e);
	}, [() => B()]), S("keydown", X, F), E(X, () => e(g), (e) => y(g, e)), t(a, L), n();
}
s(["click", "keydown"]);
// upstream/src/features/work/components/objects/List.svelte
var X = a("<span class=\"hint svelte-ddoo8x\"> </span>"), Z = a("<li class=\"svelte-ddoo8x\"><button type=\"button\"><span class=\"face obverse svelte-ddoo8x\"><span class=\"number svelte-ddoo8x\"></span> <span class=\"question svelte-ddoo8x\"> </span> <!></span> <span class=\"face reverse svelte-ddoo8x\"><span class=\"asked svelte-ddoo8x\"> </span> <span class=\"answer svelte-ddoo8x\"> </span></span></button></li>"), Q = a("<ol class=\"cards svelte-ddoo8x\"></ol>"), $ = a("<button type=\"button\" class=\"box nodrag nopan svelte-ddoo8x\"><!></button>"), ee = a("<span class=\"box svelte-ddoo8x\" aria-hidden=\"true\"><!></span>"), te = a("<span class=\"lead svelte-ddoo8x\" aria-hidden=\"true\"></span>"), ne = a("<span class=\"priority svelte-ddoo8x\"> </span>"), re = a("<span class=\"due svelte-ddoo8x\"> </span>"), ie = a("<span class=\"when svelte-ddoo8x\"><!><!></span>"), ae = a("<p class=\"detail svelte-ddoo8x\"> </p>"), oe = a("<a class=\"back nodrag svelte-ddoo8x\"><!></a>"), se = a("<blockquote class=\"svelte-ddoo8x\"> </blockquote>"), ce = a("<div class=\"from svelte-ddoo8x\"><!> <span class=\"who\"> </span> <!></div> <!>", 1), le = a("<li><!> <div class=\"body svelte-ddoo8x\"><div class=\"line svelte-ddoo8x\"><h4 class=\"svelte-ddoo8x\"> </h4> <!></div> <!> <!></div></li>"), ue = a("<ul class=\"items svelte-ddoo8x\"></ul>"), de = a("<footer class=\"svelte-ddoo8x\"><!></footer>"), fe = a("<section><!> <!> <!></section>");
function pe(a, o) {
	u(o, !0);
	let s = C(o, "actions", 19, () => ({})), m = C(o, "centre", 3, !1), h = O(() => o.object.style === "todo"), y = O(() => o.object.style === "questions"), b = new k(), w = (e) => {
		b.delete(e) || b.add(e);
	}, T = (e) => (t) => {
		s().link && (t.preventDefault(), s().link(e));
	};
	var E = p(), R = g(E), z = (e) => {
		Y(e, {
			get object() {
				return o.object;
			},
			get actions() {
				return s();
			}
		});
	}, B = (n) => {
		var a = fe();
		let u;
		var C = D(a), E = (e) => {
			F(e, { get text() {
				return o.object.title;
			} });
		};
		r(C, (e) => {
			o.object.title && e(E);
		});
		var k = _(C, 2), R = (n) => {
			var a = Q();
			c(a, 21, () => o.object.items, l, (n, a, o) => {
				var s = Z(), c = D(s);
				let l;
				var u = D(c), p = D(u);
				p.textContent = o + 1;
				var m = _(p, 2), h = D(m, !0);
				i(m);
				var g = _(m, 2), y = (e) => {
					var n = X(), r = D(n, !0);
					i(n), x((e) => d(r, e), [() => W()]), t(e, n);
				};
				r(g, (t) => {
					e(a).detail && t(y);
				}), i(u);
				var C = _(u, 2), T = D(C), E = D(T, !0);
				i(T);
				var O = _(T, 2), k = D(O, !0);
				i(O), i(C), i(c), i(s), x((t, n, r, i) => {
					l = f(c, 1, "card nodrag nopan svelte-ddoo8x", null, l, t), v(c, "aria-pressed", n), v(u, "aria-hidden", r), d(h, e(a).title), v(C, "aria-hidden", i), d(E, e(a).title), d(k, e(a).detail ?? "");
				}, [
					() => ({ turned: b.has(o) }),
					() => b.has(o),
					() => b.has(o),
					() => !b.has(o)
				]), S("click", c, () => w(o)), t(n, s);
			}), i(a), t(n, a);
		}, z = (n) => {
			var a = ue();
			c(a, 21, () => o.object.items, l, (n, a, c) => {
				var l = le();
				let u;
				var m = D(l), y = (n) => {
					var l = p(), u = g(l), d = (n) => {
						var l = $(), u = D(l), d = (e) => {
							A(e, {
								get icon() {
									return I;
								},
								size: 12
							});
						};
						r(u, (t) => {
							e(a).done && t(d);
						}), i(l), x(() => {
							v(l, "aria-pressed", !!e(a).done), v(l, "aria-label", e(a).title);
						}), S("click", l, () => s().check?.(o.object.id, c, !e(a).done)), t(n, l);
					}, f = (n) => {
						var o = ee(), s = D(o), c = (e) => {
							A(e, {
								get icon() {
									return I;
								},
								size: 12
							});
						};
						r(s, (t) => {
							e(a).done && t(c);
						}), i(o), t(n, o);
					};
					r(u, (e) => {
						s().check ? e(d) : e(f, -1);
					}), t(n, l);
				}, b = (e) => {
					var n = te();
					t(e, n);
				};
				r(m, (t) => {
					e(h) ? t(y) : t(b, -1);
				});
				var C = _(m, 2), w = D(C), E = D(w), k = D(E, !0);
				i(E);
				var j = _(E, 2), F = (n) => {
					var o = ie(), s = D(o), c = (e) => {
						var n = ne(), r = D(n, !0);
						i(n), x((e) => d(r, e), [() => H()]), t(e, n);
					};
					r(s, (t) => {
						e(a).priority === "high" && t(c);
					});
					var l = _(s), u = (n) => {
						var r = re(), o = D(r, !0);
						i(r), x(() => d(o, e(a).due)), t(n, r);
					};
					r(l, (t) => {
						e(a).due && t(u);
					}), i(o), t(n, o);
				};
				r(j, (t) => {
					(e(a).priority === "high" || e(a).due) && t(F);
				}), i(w);
				var R = _(w, 2), z = (n) => {
					var r = ae(), o = D(r, !0);
					i(r), x(() => d(o, e(a).detail)), t(n, r);
				};
				r(R, (t) => {
					e(a).detail && t(z);
				});
				var B = _(R, 2), V = (n) => {
					let o = O(() => e(a).from);
					var s = ce(), c = g(s), l = D(c), u = (t) => {
						M(t, {
							get address() {
								return e(o).host;
							},
							size: 14
						});
					};
					r(l, (t) => {
						e(o).host && t(u);
					});
					var f = _(l, 2), p = D(f, !0);
					i(f);
					var m = _(f, 2), h = (n) => {
						var r = oe(), a = O(() => T(e(o).url)), s = D(r);
						A(s, {
							get icon() {
								return L;
							},
							size: 13
						}), i(r), x((t) => {
							v(r, "href", e(o).url), v(r, "title", t);
						}, [() => e(o).app ? P({ app: e(o).app }) : N()]), S("click", r, function(...t) {
							e(a)?.apply(this, t);
						}), t(n, r);
					};
					r(m, (t) => {
						e(o).url && t(h);
					}), i(c);
					var y = _(c, 2), b = (n) => {
						var r = se(), a = D(r, !0);
						i(r), x(() => d(a, e(o).quote)), t(n, r);
					};
					r(y, (t) => {
						e(o).quote && t(b);
					}), x((e) => d(p, e), [() => [
						e(o).who,
						e(o).app,
						e(o).when
					].filter(Boolean).join(" · ")]), t(n, s);
				};
				r(B, (t) => {
					e(a).from && t(V);
				}), i(C), i(l), x(() => {
					u = f(l, 1, "svelte-ddoo8x", null, u, { done: e(a).done }), d(k, e(a).title);
				}), t(n, l);
			}), i(a), t(n, a);
		};
		r(k, (t) => {
			e(y) ? t(R) : t(z, -1);
		});
		var B = _(k, 2), V = (e) => {
			var n = de(), r = D(n);
			j(r, { get id() {
				return o.object.id;
			} }), i(n), t(e, n);
		};
		r(B, (t) => {
			e(h) && !m() && t(V);
		}), i(a), x(() => {
			u = f(a, 1, "list svelte-ddoo8x", null, u, { deck: e(y) }), v(a, "aria-label", o.object.title);
		}), t(n, a);
	};
	r(R, (t) => {
		s().edit && e(h) ? t(z) : t(B, -1);
	}), t(a, E), n();
}
s(["click"]);
export { pe as default };

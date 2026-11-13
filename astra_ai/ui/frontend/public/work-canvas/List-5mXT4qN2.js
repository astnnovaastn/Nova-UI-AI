import "./disclose-version-DFvUDwEH.js";
import { $ as e, B as t, Et as n, F as r, H as i, J as a, K as o, M as s, N as c, Nt as l, Q as u, R as d, S as f, Tt as p, V as m, _ as h, _t as g, ct as _, h as v, ht as y, it as b, lt as x, m as S, pt as C, q as w, r as T, s as E, u as D, ut as O } from "./index-client-oI5R0J23.js";
import { r as k } from "./index-client-zcLcgEWT.js";
import { t as A } from "./Icon-BfOzno3u.js";
import { t as j } from "./MakeTasks-BGsTWFmC.js";
import { t as M } from "./Mark-k2Ui4Fuu.js";
import { t as N } from "./Title-DCqcKCqa.js";
import { t as P } from "./work_env_open-CZM6S6RQ.js";
import { t as F } from "./work_list_open_in-Bj6MoqBE.js";
import { t as I } from "./Tick02Icon-COqFGcdx.js";
import { t as L } from "./ArrowUpRight01Icon-BuQKjoN4.js";
import { t as R } from "./runtime-Ci9kzAvr.js";
// upstream/src/shared/i18n/messages/work_block_add_item.js
var z = () => "Add an item", B = ((e = {}, t = {}) => (t.locale ?? R(), z(e))), V = () => "Priority", H = ((e = {}, t = {}) => (t.locale ?? R(), V(e))), U = () => "Show answer", W = ((e = {}, t = {}) => (t.locale ?? R(), U(e))), G = i("<h3 class=\"svelte-uvek3x\"> </h3>"), K = i("<span class=\"count svelte-uvek3x\"> </span>"), q = i("<li><button type=\"button\" class=\"box nodrag nopan svelte-uvek3x\"><!></button> <input class=\"text nodrag nopan svelte-uvek3x\"/></li>"), J = i("<section class=\"checklist svelte-uvek3x\"><header class=\"svelte-uvek3x\"><!> <!></header> <ul class=\"svelte-uvek3x\"></ul> <label class=\"add svelte-uvek3x\"><span class=\"box ghost svelte-uvek3x\" aria-hidden=\"true\"></span> <input class=\"text nodrag nopan svelte-uvek3x\"/></label></section>");
function Y(i, o) {
	n(o, !0);
	let m = y(void 0), x = y(""), T = g(() => o.object.items.filter((e) => e.done).length);
	function k(e) {
		o.actions.edit?.(o.object.id, (t) => t.kind === "list" ? {
			...t,
			items: e([...t.items])
		} : t);
	}
	async function j(t) {
		await e();
		let n = u(m)?.querySelector(`[data-item="${t}"]`);
		n?.focus(), n?.setSelectionRange(n.value.length, n.value.length);
	}
	let M = (e) => k((t) => t.map((t, n) => n === e ? {
		...t,
		done: !t.done
	} : t));
	function N(e, t) {
		let n = t.trim();
		n !== o.object.items[e]?.title && k((t) => n ? t.map((t, r) => r === e ? {
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
	function F(e) {
		if (e.key !== "Enter") return;
		e.preventDefault();
		let t = u(x).trim();
		t && (k((e) => [...e, { title: t }]), C(x, ""));
	}
	var L = J(), R = _(L), z = _(R), V = (e) => {
		var n = G(), r = _(n, !0);
		l(n), b(() => d(r, o.object.title)), t(e, n);
	};
	r(z, (e) => {
		o.object.title && e(V);
	});
	var H = O(z, 2), U = (e) => {
		var n = K(), r = _(n);
		l(n), b(() => d(r, `${u(T) ?? ""}/${o.object.items.length ?? ""}`)), t(e, n);
	};
	r(H, (e) => {
		o.object.items.length && e(U);
	}), l(R);
	var W = O(R, 2);
	s(W, 21, () => o.object.items, c, (e, n, i) => {
		var o = q();
		let s;
		var c = _(o), d = _(c), p = (e) => {
			A(e, {
				get icon() {
					return I;
				},
				size: 12
			});
		};
		r(d, (e) => {
			u(n).done && e(p);
		}), l(c);
		var m = O(c, 2);
		S(m), v(m, "data-item", i), l(o), b(() => {
			s = f(o, 1, "svelte-uvek3x", null, s, { done: u(n).done }), v(c, "aria-pressed", !!u(n).done), v(c, "aria-label", u(n).title), h(m, u(n).title), v(m, "aria-label", u(n).title);
		}), w("click", c, () => M(i)), a("blur", m, (e) => N(i, e.currentTarget.value)), w("keydown", m, (e) => P(e, i)), t(e, o);
	}), l(W);
	var Y = O(W, 2), X = O(_(Y), 2);
	S(X), l(Y), l(L), E(L, (e) => C(m, e), () => u(m)), b((e) => {
		v(L, "aria-label", o.object.title), v(X, "placeholder", e);
	}, [() => B()]), w("keydown", X, F), D(X, () => u(x), (e) => C(x, e)), t(i, L), p();
}
o(["click", "keydown"]);
// upstream/src/features/work/components/objects/List.svelte
var X = i("<span class=\"hint svelte-ddoo8x\"> </span>"), Z = i("<li class=\"svelte-ddoo8x\"><button type=\"button\"><span class=\"face obverse svelte-ddoo8x\"><span class=\"number svelte-ddoo8x\"></span> <span class=\"question svelte-ddoo8x\"> </span> <!></span> <span class=\"face reverse svelte-ddoo8x\"><span class=\"asked svelte-ddoo8x\"> </span> <span class=\"answer svelte-ddoo8x\"> </span></span></button></li>"), Q = i("<ol class=\"cards svelte-ddoo8x\"></ol>"), $ = i("<button type=\"button\" class=\"box nodrag nopan svelte-ddoo8x\"><!></button>"), ee = i("<span class=\"box svelte-ddoo8x\" aria-hidden=\"true\"><!></span>"), te = i("<span class=\"lead svelte-ddoo8x\" aria-hidden=\"true\"></span>"), ne = i("<span class=\"priority svelte-ddoo8x\"> </span>"), re = i("<span class=\"due svelte-ddoo8x\"> </span>"), ie = i("<span class=\"when svelte-ddoo8x\"><!><!></span>"), ae = i("<p class=\"detail svelte-ddoo8x\"> </p>"), oe = i("<a class=\"back nodrag svelte-ddoo8x\"><!></a>"), se = i("<blockquote class=\"svelte-ddoo8x\"> </blockquote>"), ce = i("<div class=\"from svelte-ddoo8x\"><!> <span class=\"who\"> </span> <!></div> <!>", 1), le = i("<li><!> <div class=\"body svelte-ddoo8x\"><div class=\"line svelte-ddoo8x\"><h4 class=\"svelte-ddoo8x\"> </h4> <!></div> <!> <!></div></li>"), ue = i("<ul class=\"items svelte-ddoo8x\"></ul>"), de = i("<footer class=\"svelte-ddoo8x\"><!></footer>"), fe = i("<section><!> <!> <!></section>");
function pe(e, i) {
	n(i, !0);
	let a = T(i, "actions", 19, () => ({})), o = T(i, "centre", 3, !1), h = g(() => i.object.style === "todo"), y = g(() => i.object.style === "questions"), S = new k(), C = (e) => {
		S.delete(e) || S.add(e);
	}, E = (e) => (t) => {
		a().link && (t.preventDefault(), a().link(e));
	};
	var D = m(), R = x(D), z = (e) => {
		Y(e, {
			get object() {
				return i.object;
			},
			get actions() {
				return a();
			}
		});
	}, B = (e) => {
		var n = fe();
		let p;
		var T = _(n), D = (e) => {
			N(e, { get text() {
				return i.object.title;
			} });
		};
		r(T, (e) => {
			i.object.title && e(D);
		});
		var k = O(T, 2), R = (e) => {
			var n = Q();
			s(n, 21, () => i.object.items, c, (e, n, i) => {
				var a = Z(), o = _(a);
				let s;
				var c = _(o), p = _(c);
				p.textContent = i + 1;
				var m = O(p, 2), h = _(m, !0);
				l(m);
				var g = O(m, 2), y = (e) => {
					var n = X(), r = _(n, !0);
					l(n), b((e) => d(r, e), [() => W()]), t(e, n);
				};
				r(g, (e) => {
					u(n).detail && e(y);
				}), l(c);
				var x = O(c, 2), T = _(x), E = _(T, !0);
				l(T);
				var D = O(T, 2), k = _(D, !0);
				l(D), l(x), l(o), l(a), b((e, t, r, i) => {
					s = f(o, 1, "card nodrag nopan svelte-ddoo8x", null, s, e), v(o, "aria-pressed", t), v(c, "aria-hidden", r), d(h, u(n).title), v(x, "aria-hidden", i), d(E, u(n).title), d(k, u(n).detail ?? "");
				}, [
					() => ({ turned: S.has(i) }),
					() => S.has(i),
					() => S.has(i),
					() => !S.has(i)
				]), w("click", o, () => C(i)), t(e, a);
			}), l(n), t(e, n);
		}, z = (e) => {
			var n = ue();
			s(n, 21, () => i.object.items, c, (e, n, o) => {
				var s = le();
				let c;
				var p = _(s), y = (e) => {
					var s = m(), c = x(s), d = (e) => {
						var s = $(), c = _(s), d = (e) => {
							A(e, {
								get icon() {
									return I;
								},
								size: 12
							});
						};
						r(c, (e) => {
							u(n).done && e(d);
						}), l(s), b(() => {
							v(s, "aria-pressed", !!u(n).done), v(s, "aria-label", u(n).title);
						}), w("click", s, () => a().check?.(i.object.id, o, !u(n).done)), t(e, s);
					}, f = (e) => {
						var i = ee(), a = _(i), o = (e) => {
							A(e, {
								get icon() {
									return I;
								},
								size: 12
							});
						};
						r(a, (e) => {
							u(n).done && e(o);
						}), l(i), t(e, i);
					};
					r(c, (e) => {
						a().check ? e(d) : e(f, -1);
					}), t(e, s);
				}, S = (e) => {
					var n = te();
					t(e, n);
				};
				r(p, (e) => {
					u(h) ? e(y) : e(S, -1);
				});
				var C = O(p, 2), T = _(C), D = _(T), k = _(D, !0);
				l(D);
				var j = O(D, 2), N = (e) => {
					var i = ie(), a = _(i), o = (e) => {
						var n = ne(), r = _(n, !0);
						l(n), b((e) => d(r, e), [() => H()]), t(e, n);
					};
					r(a, (e) => {
						u(n).priority === "high" && e(o);
					});
					var s = O(a), c = (e) => {
						var r = re(), i = _(r, !0);
						l(r), b(() => d(i, u(n).due)), t(e, r);
					};
					r(s, (e) => {
						u(n).due && e(c);
					}), l(i), t(e, i);
				};
				r(j, (e) => {
					(u(n).priority === "high" || u(n).due) && e(N);
				}), l(T);
				var R = O(T, 2), z = (e) => {
					var r = ae(), i = _(r, !0);
					l(r), b(() => d(i, u(n).detail)), t(e, r);
				};
				r(R, (e) => {
					u(n).detail && e(z);
				});
				var B = O(R, 2), V = (e) => {
					let i = g(() => u(n).from);
					var a = ce(), o = x(a), s = _(o), c = (e) => {
						M(e, {
							get address() {
								return u(i).host;
							},
							size: 14
						});
					};
					r(s, (e) => {
						u(i).host && e(c);
					});
					var f = O(s, 2), p = _(f, !0);
					l(f);
					var m = O(f, 2), h = (e) => {
						var n = oe(), r = g(() => E(u(i).url)), a = _(n);
						A(a, {
							get icon() {
								return L;
							},
							size: 13
						}), l(n), b((e) => {
							v(n, "href", u(i).url), v(n, "title", e);
						}, [() => u(i).app ? F({ app: u(i).app }) : P()]), w("click", n, function(...e) {
							u(r)?.apply(this, e);
						}), t(e, n);
					};
					r(m, (e) => {
						u(i).url && e(h);
					}), l(o);
					var y = O(o, 2), S = (e) => {
						var n = se(), r = _(n, !0);
						l(n), b(() => d(r, u(i).quote)), t(e, n);
					};
					r(y, (e) => {
						u(i).quote && e(S);
					}), b((e) => d(p, e), [() => [
						u(i).who,
						u(i).app,
						u(i).when
					].filter(Boolean).join(" · ")]), t(e, a);
				};
				r(B, (e) => {
					u(n).from && e(V);
				}), l(C), l(s), b(() => {
					c = f(s, 1, "svelte-ddoo8x", null, c, { done: u(n).done }), d(k, u(n).title);
				}), t(e, s);
			}), l(n), t(e, n);
		};
		r(k, (e) => {
			u(y) ? e(R) : e(z, -1);
		});
		var B = O(k, 2), V = (e) => {
			var n = de(), r = _(n);
			j(r, { get id() {
				return i.object.id;
			} }), l(n), t(e, n);
		};
		r(B, (e) => {
			u(h) && !o() && e(V);
		}), l(n), b(() => {
			p = f(n, 1, "list svelte-ddoo8x", null, p, { deck: u(y) }), v(n, "aria-label", i.object.title);
		}), t(e, n);
	};
	r(R, (e) => {
		a().edit && u(h) ? e(z) : e(B, -1);
	}), t(e, D), p();
}
o(["click"]);
export { pe as default };

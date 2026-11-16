import "./disclose-version-DFvUDwEH.js";
import { $ as e, B as t, Dt as n, F as r, Ft as i, H as a, K as o, M as s, N as c, Ot as l, R as u, S as d, V as f, dt as p, ft as m, h, ot as g, q as _, r as v, ut as y, x as b, yt as x } from "./index-client-C_2wYFnt.js";
import { t as S } from "./Icon-E4BzZ4dm.js";
import { t as ee } from "./File01Icon-C7ue_hSG.js";
import { t as C } from "./Folder01Icon-DE8-U2cv.js";
import { t as w } from "./GitBranchIcon-BNLwRvty.js";
import { t as T } from "./Mark-BTIzBHOo.js";
import { t as E } from "./runtime-Ci9kzAvr.js";
// upstream/src/shared/i18n/messages/work_project_ahead.js
var D = (e) => `${e?.count} ahead`, te = ((e, t = {}) => (t.locale ?? E(), D(e))), O = (e) => `${e?.count} behind`, k = ((e, t = {}) => (t.locale ?? E(), O(e))), A = (e) => `${e?.count} changed`, ne = ((e, t = {}) => (t.locale ?? E(), A(e))), j = () => "No changes", M = ((e = {}, t = {}) => (t.locale ?? E(), j(e))), N = (e) => `${e?.count} more`, P = ((e, t = {}) => (t.locale ?? E(), N(e))), F = () => "Scripts", re = ((e = {}, t = {}) => (t.locale ?? E(), F(e))), I = () => "Show the whole tree", ie = ((e = {}, t = {}) => (t.locale ?? E(), I(e))), L = () => "Stack", R = ((e = {}, t = {}) => (t.locale ?? E(), L(e))), z = () => "Structure", B = ((e = {}, t = {}) => (t.locale ?? E(), z(e)));
// upstream/src/features/work/components/objects/project.ts
function V(e, t) {
	let n = [], r = (e, t, i) => {
		let a = [...e].sort((e, t) => Number(t.folder) - Number(e.folder) || e.name.localeCompare(t.name));
		for (let e of a) {
			let i = !!e.children?.length;
			n.push({
				name: e.name,
				folder: e.folder,
				depth: t,
				...!i && e.more ? { holds: e.more } : {}
			}), i && r(e.children, t + 1, e.more);
		}
		i && n.push({
			more: i,
			depth: t
		});
	};
	return r(e, 0, t), n;
}
// upstream/src/features/work/components/objects/Project.svelte
var H = a("<p class=\"summary svelte-1xtjuz2\"> </p>"), U = a("<span class=\"path svelte-1xtjuz2\"> </span>"), W = a("<span class=\"branch svelte-1xtjuz2\"> </span>"), G = a("<span class=\"sync svelte-1xtjuz2\"> </span>"), K = a("<span class=\"git svelte-1xtjuz2\"><!> <!> <span class=\"changes svelte-1xtjuz2\"> </span> <!> <!></span>"), q = a("<p class=\"meta svelte-1xtjuz2\"><!> <!></p>"), J = a("<header class=\"svelte-1xtjuz2\"><span class=\"glyph svelte-1xtjuz2\" aria-hidden=\"true\"><!></span> <div class=\"head svelte-1xtjuz2\"><h3 class=\"svelte-1xtjuz2\"> </h3> <!> <!></div></header>"), Y = a("<span class=\"count rest svelte-1xtjuz2\"> </span>"), ae = a("<span class=\"count svelte-1xtjuz2\"> </span>"), oe = a("<!><span class=\"entry svelte-1xtjuz2\"> </span><!>", 1), se = a("<li><!></li>"), ce = a("<button type=\"button\" class=\"all nodrag nopan svelte-1xtjuz2\"> </button>"), le = a("<h4 class=\"svelte-1xtjuz2\"> </h4> <ul class=\"tree svelte-1xtjuz2\"></ul> <!>", 1), ue = a("<span class=\"source svelte-1xtjuz2\"> </span>"), de = a("<dd class=\"svelte-1xtjuz2\"> </dd>"), fe = a("<div class=\"svelte-1xtjuz2\"><dt class=\"svelte-1xtjuz2\"><span> </span><!></dt> <!></div>"), pe = a("<h4 class=\"svelte-1xtjuz2\"> </h4> <dl class=\"scripts svelte-1xtjuz2\"></dl>", 1), X = a("<span class=\"version svelte-1xtjuz2\"> </span>"), me = a("<li class=\"svelte-1xtjuz2\"><!> <span class=\"name svelte-1xtjuz2\"> </span> <!></li>"), he = a("<ul class=\"stack svelte-1xtjuz2\"></ul>"), Z = a("<div class=\"column svelte-1xtjuz2\"><!></div>"), ge = a("<section class=\"project svelte-1xtjuz2\"><!> <!> <div><!> <!></div></section>"), _e = a("<li class=\"svelte-1xtjuz2\"><span class=\"mark svelte-1xtjuz2\"><!></span> <span class=\"name svelte-1xtjuz2\"> </span> <!></li>"), Q = a("<div class=\"piece stack-piece svelte-1xtjuz2\"><h4 class=\"svelte-1xtjuz2\"> </h4> <ul class=\"manifest svelte-1xtjuz2\"></ul></div>"), ve = a("<div class=\"piece tree-piece svelte-1xtjuz2\"><!></div>"), ye = a("<div class=\"piece scripts-piece svelte-1xtjuz2\"><!></div>"), be = a("<section class=\"map svelte-1xtjuz2\"><div class=\"piece lead svelte-1xtjuz2\"><!></div> <!> <!> <!></section>");
function $(a, o) {
	l(o, !0);
	let E = (n) => {
		var a = J(), s = y(a), c = y(s);
		S(c, {
			get icon() {
				return C;
			},
			size: 22
		}), i(s);
		var l = m(s, 2), d = y(l), f = y(d, !0);
		i(d);
		var p = m(d, 2), _ = (e) => {
			var n = H(), r = y(n, !0);
			i(n), g(() => u(r, o.object.summary)), t(e, n);
		};
		r(p, (e) => {
			o.object.summary && e(_);
		});
		var v = m(p, 2), b = (n) => {
			var a = q(), s = y(a), c = (n) => {
				var r = U(), a = y(r, !0);
				i(r), g(() => {
					h(r, "title", o.object.root), u(a, e(L));
				}), t(n, r);
			};
			r(s, (e) => {
				o.object.root && e(c);
			});
			var l = m(s, 2), d = (n) => {
				var a = K(), o = y(a);
				S(o, {
					get icon() {
						return w;
					},
					size: 13
				});
				var s = m(o, 2), c = (n) => {
					var r = W(), a = y(r, !0);
					i(r), g(() => u(a, e(I).branch)), t(n, r);
				};
				r(s, (t) => {
					e(I).branch && t(c);
				});
				var l = m(s, 2), d = y(l, !0);
				i(l);
				var f = m(l, 2), p = (n) => {
					var r = G(), a = y(r, !0);
					i(r), g((e) => u(a, e), [() => te({ count: e(I).ahead })]), t(n, r);
				};
				r(f, (t) => {
					e(I).ahead && t(p);
				});
				var h = m(f, 2), _ = (n) => {
					var r = G(), a = y(r, !0);
					i(r), g((e) => u(a, e), [() => k({ count: e(I).behind })]), t(n, r);
				};
				r(h, (t) => {
					e(I).behind && t(_);
				}), i(a), g((e) => u(d, e), [() => e(I).changed ? ne({ count: e(I).changed }) : M()]), t(n, a);
			};
			r(l, (t) => {
				e(I) && t(d);
			}), i(a), t(n, a);
		};
		r(v, (t) => {
			(o.object.root || e(I)) && t(b);
		}), i(l), i(a), g(() => u(f, o.object.name)), t(n, a);
	}, D = (n) => {
		var a = le(), l = p(a), f = y(l, !0);
		i(l);
		var h = m(l, 2);
		s(h, 21, () => e(F), c, (n, a) => {
			var o = se();
			let s, c;
			var l = y(o), f = (n) => {
				var r = Y(), o = y(r, !0);
				i(r), g((e) => u(o, e), [() => P({ count: e(a).more })]), t(n, r);
			}, h = (n) => {
				var o = oe(), s = p(o);
				{
					let t = x(() => e(a).folder ? C : ee);
					S(s, {
						get icon() {
							return e(t);
						},
						size: 14
					});
				}
				var c = m(s), l = y(c, !0);
				i(c);
				var d = m(c), f = (n) => {
					var r = ae(), o = y(r, !0);
					i(r), g(() => u(o, e(a).holds)), t(n, r);
				};
				r(d, (t) => {
					e(a).holds && t(f);
				}), g(() => u(l, e(a).name)), t(n, o);
			};
			r(l, (t) => {
				"more" in e(a) ? t(f) : t(h, -1);
			}), i(o), g(() => {
				s = d(o, 1, "svelte-1xtjuz2", null, s, { folder: "folder" in e(a) && e(a).folder }), c = b(o, "", c, { "padding-inline-start": `${e(a).depth * 18}px` });
			}), t(n, o);
		}), i(h);
		var v = m(h, 2), w = (e) => {
			var n = ce(), r = y(n, !0);
			i(n), g((e) => u(r, e), [() => ie()]), _("click", n, () => A().open?.(o.object.id)), t(e, n);
		};
		r(v, (t) => {
			e(F).length < e(N).length && t(w);
		}), g((e) => u(f, e), [() => B()]), t(n, a);
	}, O = (n) => {
		var a = pe(), l = p(a), d = y(l, !0);
		i(l);
		var f = m(l, 2);
		s(f, 21, () => o.object.scripts, c, (n, a) => {
			var o = fe(), s = y(o), c = y(s), l = y(c, !0);
			i(c);
			var d = m(c), f = (n) => {
				var r = ue(), o = y(r, !0);
				i(r), g(() => u(o, e(a).source)), t(n, r);
			};
			r(d, (t) => {
				e(a).source && t(f);
			}), i(s);
			var p = m(s, 2), h = (n) => {
				var r = de(), o = y(r, !0);
				i(r), g(() => u(o, e(a).command)), t(n, r);
			};
			r(p, (t) => {
				e(a).command && e(a).command !== e(a).name && t(h);
			}), i(o), g(() => u(l, e(a).name)), t(n, o);
		}), i(f), g((e) => u(d, e), [() => re()]), t(n, a);
	}, A = v(o, "actions", 19, () => ({})), j = v(o, "centre", 3, !1), N = x(() => V(o.object.tree, o.object.more)), F = x(() => j() ? e(N) : e(N).slice(0, 12)), I = x(() => o.object.git), L = x(() => o.object.root.replace(/^\/(?:Users|home)\/[^/]+/u, "~"));
	var z = f(), $ = p(z), xe = (n) => {
		var a = ge(), c = y(a);
		E(c);
		var l = m(c, 2), f = (n) => {
			var a = he();
			s(a, 21, () => o.object.stack, (e) => e.name, (n, a) => {
				var o = me(), s = y(o), c = (t) => {
					T(t, {
						get address() {
							return e(a).host;
						},
						size: 16
					});
				};
				r(s, (t) => {
					e(a).host && t(c);
				});
				var l = m(s, 2), d = y(l, !0);
				i(l);
				var f = m(l, 2), p = (n) => {
					var r = X(), o = y(r, !0);
					i(r), g(() => u(o, e(a).version)), t(n, r);
				};
				r(f, (t) => {
					e(a).version && t(p);
				}), i(o), g(() => {
					h(o, "title", e(a).role), u(d, e(a).name);
				}), t(n, o);
			}), i(a), g((e) => h(a, "aria-label", e), [() => R()]), t(n, a);
		};
		r(l, (e) => {
			o.object.stack.length && e(f);
		});
		var p = m(l, 2);
		let _;
		var v = y(p), b = (e) => {
			var n = Z(), r = y(n);
			D(r), i(n), t(e, n);
		};
		r(v, (t) => {
			e(N).length && t(b);
		});
		var x = m(v, 2), S = (e) => {
			var n = Z(), r = y(n);
			O(r), i(n), t(e, n);
		};
		r(x, (e) => {
			o.object.scripts.length && e(S);
		}), i(p), i(a), g(() => {
			h(a, "aria-label", o.object.name), _ = d(p, 1, "body svelte-1xtjuz2", null, _, { single: !o.object.scripts.length || !e(N).length });
		}), t(n, a);
	}, Se = (n) => {
		var a = be(), c = y(a), l = y(c);
		E(l), i(c);
		var d = m(c, 2), f = (n) => {
			var a = Q(), c = y(a), l = y(c, !0);
			i(c);
			var d = m(c, 2);
			s(d, 21, () => o.object.stack, (e) => e.name, (n, a) => {
				var o = _e(), s = y(o), c = y(s), l = (t) => {
					T(t, {
						get address() {
							return e(a).host;
						},
						size: 16
					});
				};
				r(c, (t) => {
					e(a).host && t(l);
				}), i(s);
				var d = m(s, 2), f = y(d, !0);
				i(d);
				var p = m(d, 2), _ = (n) => {
					var r = X(), o = y(r, !0);
					i(r), g(() => u(o, e(a).version)), t(n, r);
				};
				r(p, (t) => {
					e(a).version && t(_);
				}), i(o), g(() => {
					h(o, "title", e(a).role), u(f, e(a).name);
				}), t(n, o);
			}), i(d), i(a), g((e) => u(l, e), [() => R()]), t(n, a);
		};
		r(d, (e) => {
			o.object.stack.length && e(f);
		});
		var p = m(d, 2), _ = (e) => {
			var n = ve(), r = y(n);
			D(r), i(n), t(e, n);
		};
		r(p, (t) => {
			e(N).length && t(_);
		});
		var v = m(p, 2), b = (e) => {
			var n = ye(), r = y(n);
			O(r), i(n), t(e, n);
		};
		r(v, (e) => {
			o.object.scripts.length && e(b);
		}), i(a), g(() => h(a, "aria-label", o.object.name)), t(n, a);
	};
	r($, (e) => {
		j() ? e(xe) : e(Se, -1);
	}), t(a, z), n();
}
o(["click"]);
export { $ as default };

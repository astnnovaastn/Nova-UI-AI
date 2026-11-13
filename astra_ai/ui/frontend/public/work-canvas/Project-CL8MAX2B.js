import "./disclose-version-DFvUDwEH.js";
import { B as e, Et as t, F as n, H as r, K as i, M as a, N as o, Nt as s, Q as c, R as l, S as u, Tt as d, V as f, _t as p, ct as m, h, it as g, lt as _, q as v, r as y, ut as b, x } from "./index-client-oI5R0J23.js";
import { t as S } from "./Icon-BfOzno3u.js";
import { t as C } from "./File01Icon-C7ue_hSG.js";
import { t as w } from "./Folder01Icon-DE8-U2cv.js";
import { t as T } from "./GitBranchIcon-BNLwRvty.js";
import { t as E } from "./Mark-k2Ui4Fuu.js";
import { t as D } from "./runtime-Ci9kzAvr.js";
// upstream/src/shared/i18n/messages/work_project_ahead.js
var O = (e) => `${e?.count} ahead`, k = ((e, t = {}) => (t.locale ?? D(), O(e))), A = (e) => `${e?.count} behind`, ee = ((e, t = {}) => (t.locale ?? D(), A(e))), j = (e) => `${e?.count} changed`, te = ((e, t = {}) => (t.locale ?? D(), j(e))), M = () => "No changes", ne = ((e = {}, t = {}) => (t.locale ?? D(), M(e))), N = (e) => `${e?.count} more`, P = ((e, t = {}) => (t.locale ?? D(), N(e))), F = () => "Scripts", I = ((e = {}, t = {}) => (t.locale ?? D(), F(e))), L = () => "Show the whole tree", re = ((e = {}, t = {}) => (t.locale ?? D(), L(e))), R = () => "Stack", z = ((e = {}, t = {}) => (t.locale ?? D(), R(e))), B = () => "Structure", V = ((e = {}, t = {}) => (t.locale ?? D(), B(e)));
// upstream/src/features/work/components/objects/project.ts
function H(e, t) {
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
var U = r("<p class=\"summary svelte-1xtjuz2\"> </p>"), W = r("<span class=\"path svelte-1xtjuz2\"> </span>"), G = r("<span class=\"branch svelte-1xtjuz2\"> </span>"), K = r("<span class=\"sync svelte-1xtjuz2\"> </span>"), q = r("<span class=\"git svelte-1xtjuz2\"><!> <!> <span class=\"changes svelte-1xtjuz2\"> </span> <!> <!></span>"), J = r("<p class=\"meta svelte-1xtjuz2\"><!> <!></p>"), Y = r("<header class=\"svelte-1xtjuz2\"><span class=\"glyph svelte-1xtjuz2\" aria-hidden=\"true\"><!></span> <div class=\"head svelte-1xtjuz2\"><h3 class=\"svelte-1xtjuz2\"> </h3> <!> <!></div></header>"), X = r("<span class=\"count rest svelte-1xtjuz2\"> </span>"), ie = r("<span class=\"count svelte-1xtjuz2\"> </span>"), ae = r("<!><span class=\"entry svelte-1xtjuz2\"> </span><!>", 1), oe = r("<li><!></li>"), se = r("<button type=\"button\" class=\"all nodrag nopan svelte-1xtjuz2\"> </button>"), ce = r("<h4 class=\"svelte-1xtjuz2\"> </h4> <ul class=\"tree svelte-1xtjuz2\"></ul> <!>", 1), le = r("<span class=\"source svelte-1xtjuz2\"> </span>"), ue = r("<dd class=\"svelte-1xtjuz2\"> </dd>"), de = r("<div class=\"svelte-1xtjuz2\"><dt class=\"svelte-1xtjuz2\"><span> </span><!></dt> <!></div>"), fe = r("<h4 class=\"svelte-1xtjuz2\"> </h4> <dl class=\"scripts svelte-1xtjuz2\"></dl>", 1), Z = r("<span class=\"version svelte-1xtjuz2\"> </span>"), pe = r("<li class=\"svelte-1xtjuz2\"><!> <span class=\"name svelte-1xtjuz2\"> </span> <!></li>"), me = r("<ul class=\"stack svelte-1xtjuz2\"></ul>"), Q = r("<div class=\"column svelte-1xtjuz2\"><!></div>"), he = r("<section class=\"project svelte-1xtjuz2\"><!> <!> <div><!> <!></div></section>"), ge = r("<li class=\"svelte-1xtjuz2\"><span class=\"mark svelte-1xtjuz2\"><!></span> <span class=\"name svelte-1xtjuz2\"> </span> <!></li>"), _e = r("<div class=\"piece stack-piece svelte-1xtjuz2\"><h4 class=\"svelte-1xtjuz2\"> </h4> <ul class=\"manifest svelte-1xtjuz2\"></ul></div>"), ve = r("<div class=\"piece tree-piece svelte-1xtjuz2\"><!></div>"), ye = r("<div class=\"piece scripts-piece svelte-1xtjuz2\"><!></div>"), be = r("<section class=\"map svelte-1xtjuz2\"><div class=\"piece lead svelte-1xtjuz2\"><!></div> <!> <!> <!></section>");
function $(r, i) {
	t(i, !0);
	let D = (t) => {
		var r = Y(), a = m(r), o = m(a);
		S(o, {
			get icon() {
				return w;
			},
			size: 22
		}), s(a);
		var u = b(a, 2), d = m(u), f = m(d, !0);
		s(d);
		var p = b(d, 2), _ = (t) => {
			var n = U(), r = m(n, !0);
			s(n), g(() => l(r, i.object.summary)), e(t, n);
		};
		n(p, (e) => {
			i.object.summary && e(_);
		});
		var v = b(p, 2), y = (t) => {
			var r = J(), a = m(r), o = (t) => {
				var n = W(), r = m(n, !0);
				s(n), g(() => {
					h(n, "title", i.object.root), l(r, c(R));
				}), e(t, n);
			};
			n(a, (e) => {
				i.object.root && e(o);
			});
			var u = b(a, 2), d = (t) => {
				var r = q(), i = m(r);
				S(i, {
					get icon() {
						return T;
					},
					size: 13
				});
				var a = b(i, 2), o = (t) => {
					var n = G(), r = m(n, !0);
					s(n), g(() => l(r, c(L).branch)), e(t, n);
				};
				n(a, (e) => {
					c(L).branch && e(o);
				});
				var u = b(a, 2), d = m(u, !0);
				s(u);
				var f = b(u, 2), p = (t) => {
					var n = K(), r = m(n, !0);
					s(n), g((e) => l(r, e), [() => k({ count: c(L).ahead })]), e(t, n);
				};
				n(f, (e) => {
					c(L).ahead && e(p);
				});
				var h = b(f, 2), _ = (t) => {
					var n = K(), r = m(n, !0);
					s(n), g((e) => l(r, e), [() => ee({ count: c(L).behind })]), e(t, n);
				};
				n(h, (e) => {
					c(L).behind && e(_);
				}), s(r), g((e) => l(d, e), [() => c(L).changed ? te({ count: c(L).changed }) : ne()]), e(t, r);
			};
			n(u, (e) => {
				c(L) && e(d);
			}), s(r), e(t, r);
		};
		n(v, (e) => {
			(i.object.root || c(L)) && e(y);
		}), s(u), s(r), g(() => l(f, i.object.name)), e(t, r);
	}, O = (t) => {
		var r = ce(), d = _(r), f = m(d, !0);
		s(d);
		var h = b(d, 2);
		a(h, 21, () => c(F), o, (t, r) => {
			var i = oe();
			let a, o;
			var d = m(i), f = (t) => {
				var n = X(), i = m(n, !0);
				s(n), g((e) => l(i, e), [() => P({ count: c(r).more })]), e(t, n);
			}, h = (t) => {
				var i = ae(), a = _(i);
				{
					let e = p(() => c(r).folder ? w : C);
					S(a, {
						get icon() {
							return c(e);
						},
						size: 14
					});
				}
				var o = b(a), u = m(o, !0);
				s(o);
				var d = b(o), f = (t) => {
					var n = ie(), i = m(n, !0);
					s(n), g(() => l(i, c(r).holds)), e(t, n);
				};
				n(d, (e) => {
					c(r).holds && e(f);
				}), g(() => l(u, c(r).name)), e(t, i);
			};
			n(d, (e) => {
				"more" in c(r) ? e(f) : e(h, -1);
			}), s(i), g(() => {
				a = u(i, 1, "svelte-1xtjuz2", null, a, { folder: "folder" in c(r) && c(r).folder }), o = x(i, "", o, { "padding-inline-start": `${c(r).depth * 18}px` });
			}), e(t, i);
		}), s(h);
		var y = b(h, 2), T = (t) => {
			var n = se(), r = m(n, !0);
			s(n), g((e) => l(r, e), [() => re()]), v("click", n, () => j().open?.(i.object.id)), e(t, n);
		};
		n(y, (e) => {
			c(F).length < c(N).length && e(T);
		}), g((e) => l(f, e), [() => V()]), e(t, r);
	}, A = (t) => {
		var r = fe(), u = _(r), d = m(u, !0);
		s(u);
		var f = b(u, 2);
		a(f, 21, () => i.object.scripts, o, (t, r) => {
			var i = de(), a = m(i), o = m(a), u = m(o, !0);
			s(o);
			var d = b(o), f = (t) => {
				var n = le(), i = m(n, !0);
				s(n), g(() => l(i, c(r).source)), e(t, n);
			};
			n(d, (e) => {
				c(r).source && e(f);
			}), s(a);
			var p = b(a, 2), h = (t) => {
				var n = ue(), i = m(n, !0);
				s(n), g(() => l(i, c(r).command)), e(t, n);
			};
			n(p, (e) => {
				c(r).command && c(r).command !== c(r).name && e(h);
			}), s(i), g(() => l(u, c(r).name)), e(t, i);
		}), s(f), g((e) => l(d, e), [() => I()]), e(t, r);
	}, j = y(i, "actions", 19, () => ({})), M = y(i, "centre", 3, !1), N = p(() => H(i.object.tree, i.object.more)), F = p(() => M() ? c(N) : c(N).slice(0, 12)), L = p(() => i.object.git), R = p(() => i.object.root.replace(/^\/(?:Users|home)\/[^/]+/u, "~"));
	var B = f(), $ = _(B), xe = (t) => {
		var r = he(), o = m(r);
		D(o);
		var d = b(o, 2), f = (t) => {
			var r = me();
			a(r, 21, () => i.object.stack, (e) => e.name, (t, r) => {
				var i = pe(), a = m(i), o = (e) => {
					E(e, {
						get address() {
							return c(r).host;
						},
						size: 16
					});
				};
				n(a, (e) => {
					c(r).host && e(o);
				});
				var u = b(a, 2), d = m(u, !0);
				s(u);
				var f = b(u, 2), p = (t) => {
					var n = Z(), i = m(n, !0);
					s(n), g(() => l(i, c(r).version)), e(t, n);
				};
				n(f, (e) => {
					c(r).version && e(p);
				}), s(i), g(() => {
					h(i, "title", c(r).role), l(d, c(r).name);
				}), e(t, i);
			}), s(r), g((e) => h(r, "aria-label", e), [() => z()]), e(t, r);
		};
		n(d, (e) => {
			i.object.stack.length && e(f);
		});
		var p = b(d, 2);
		let _;
		var v = m(p), y = (t) => {
			var n = Q(), r = m(n);
			O(r), s(n), e(t, n);
		};
		n(v, (e) => {
			c(N).length && e(y);
		});
		var x = b(v, 2), S = (t) => {
			var n = Q(), r = m(n);
			A(r), s(n), e(t, n);
		};
		n(x, (e) => {
			i.object.scripts.length && e(S);
		}), s(p), s(r), g(() => {
			h(r, "aria-label", i.object.name), _ = u(p, 1, "body svelte-1xtjuz2", null, _, { single: !i.object.scripts.length || !c(N).length });
		}), e(t, r);
	}, Se = (t) => {
		var r = be(), o = m(r), u = m(o);
		D(u), s(o);
		var d = b(o, 2), f = (t) => {
			var r = _e(), o = m(r), u = m(o, !0);
			s(o);
			var d = b(o, 2);
			a(d, 21, () => i.object.stack, (e) => e.name, (t, r) => {
				var i = ge(), a = m(i), o = m(a), u = (e) => {
					E(e, {
						get address() {
							return c(r).host;
						},
						size: 16
					});
				};
				n(o, (e) => {
					c(r).host && e(u);
				}), s(a);
				var d = b(a, 2), f = m(d, !0);
				s(d);
				var p = b(d, 2), _ = (t) => {
					var n = Z(), i = m(n, !0);
					s(n), g(() => l(i, c(r).version)), e(t, n);
				};
				n(p, (e) => {
					c(r).version && e(_);
				}), s(i), g(() => {
					h(i, "title", c(r).role), l(f, c(r).name);
				}), e(t, i);
			}), s(d), s(r), g((e) => l(u, e), [() => z()]), e(t, r);
		};
		n(d, (e) => {
			i.object.stack.length && e(f);
		});
		var p = b(d, 2), _ = (t) => {
			var n = ve(), r = m(n);
			O(r), s(n), e(t, n);
		};
		n(p, (e) => {
			c(N).length && e(_);
		});
		var v = b(p, 2), y = (t) => {
			var n = ye(), r = m(n);
			A(r), s(n), e(t, n);
		};
		n(v, (e) => {
			i.object.scripts.length && e(y);
		}), s(r), g(() => h(r, "aria-label", i.object.name)), e(t, r);
	};
	n($, (e) => {
		M() ? e(xe) : e(Se, -1);
	}), e(r, B), d();
}
i(["click"]);
export { $ as default };

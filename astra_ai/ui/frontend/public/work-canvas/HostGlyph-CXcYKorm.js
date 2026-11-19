import "./disclose-version-7ONGmeVC.js";
import { a as e, n as t, t as n } from "./FavIcon-B-1SmexQ.js";
import { t as r } from "./Icon-D2j1Ej6Z.js";
import { Ct as i, H as a, L as o, Mt as s, Nt as c, U as l, W as u, jt as d, kt as f, lt as p, mt as m, n as h, pt as g, r as _, tt as v, x as y, zt as b } from "./index-client-DH73-vTM.js";
import "./Icon-CmjKIKuh.js";
import { t as x } from "./File01Icon-1POdYzZt.js";
import { t as S } from "./FavIcon-Dsc27BCG.js";
// upstream/src/features/work/lib/canvas-context.ts
var C = Symbol("canvas-inspection"), w = Symbol("canvas-resize"), T = Symbol("canvas-action"), E = Symbol("canvas-evidence"), D = Symbol("canvas-focus-result"), O = Symbol("canvas-open"), k = Symbol("canvas-open-link"), A = Symbol("canvas-open-tasks"), j = Symbol("canvas-areas"), M = Symbol("canvas-pictures"), N = Symbol("canvas-area-actions"), P = Symbol("canvas-arrival"), F = Symbol("canvas-probe"), I = Symbol("canvas-work"), L = Symbol("canvas-seen"), R = Symbol("canvas-toolbar"), z = Symbol("canvas-far"), B = Symbol("canvas-board"), V = Symbol("site-marks");
function H(e) {
	c(V, e);
}
function U() {
	return f(V);
}
// upstream/src/features/work/lib/run/site.ts
var W = /* @__PURE__ */ new Set(/* @__PURE__ */ "co.uk,org.uk,ac.uk,gov.uk,me.uk,com.au,net.au,org.au,co.nz,co.jp,ne.jp,or.jp,co.kr,com.br,com.mx,com.ar,com.tr,com.cn,com.hk,com.sg,com.tw,co.in,co.za,co.il,com.pl,com.ua,github.io,gitlab.io,vercel.app,netlify.app,pages.dev,workers.dev,herokuapp.com,blogspot.com".split(","));
function G(e) {
	try {
		return new URL(e).hostname.replace(/^www\./u, "").toLowerCase();
	} catch {
		return "";
	}
}
function K(e) {
	let t = e.replace(/^www\./u, "").toLowerCase().split(".").filter(Boolean);
	if (t.length <= 2 || /^\d+$/u.test(t.at(-1))) return t.join(".");
	let n = t.slice(-2).join(".");
	return W.has(n) ? t.slice(-3).join(".") : n;
}
function q(e) {
	let t = K(e);
	return t.split(".")[0] ?? t;
}
var J = {
	ycombinator: "Y Combinator",
	linkedin: "LinkedIn",
	github: "GitHub",
	gitlab: "GitLab",
	youtube: "YouTube",
	openai: "OpenAI",
	paypal: "PayPal",
	tripadvisor: "Tripadvisor",
	booking: "Booking.com",
	airbnb: "Airbnb",
	stackoverflow: "Stack Overflow",
	duckduckgo: "DuckDuckGo",
	wikipedia: "Wikipedia",
	greenhouse: "Greenhouse",
	ashbyhq: "Ashby",
	lever: "Lever",
	google: "Google",
	reddit: "Reddit",
	lot: "LOT",
	lufthansa: "Lufthansa",
	amazon: "Amazon",
	apple: "Apple",
	microsoft: "Microsoft",
	notion: "Notion",
	slack: "Slack",
	figma: "Figma",
	stripe: "Stripe",
	cloudflare: "Cloudflare",
	vercel: "Vercel",
	hetzner: "Hetzner",
	skyscanner: "Skyscanner",
	kayak: "Kayak",
	expedia: "Expedia",
	lego: "LEGO",
	epam: "EPAM",
	mit: "MIT",
	stanford: "Stanford",
	cmu: "Carnegie Mellon",
	berkeley: "UC Berkeley",
	harvard: "Harvard",
	coursera: "Coursera",
	edx: "edX",
	udemy: "Udemy",
	medium: "Medium",
	substack: "Substack"
}, Y = {
	"mail.google.com": "Gmail",
	"calendar.google.com": "Google Calendar",
	"docs.google.com": "Google Docs",
	"drive.google.com": "Google Drive",
	"meet.google.com": "Google Meet",
	"maps.google.com": "Google Maps",
	"outlook.live.com": "Outlook",
	"outlook.office.com": "Outlook",
	"teams.microsoft.com": "Teams",
	"aws.amazon.com": "AWS",
	"console.aws.amazon.com": "AWS"
}, X = (e) => e.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
function ee(e, t = []) {
	let n = Y[e.replace(/^www\./u, "").toLowerCase()];
	if (n) return n;
	let r = K(e), i = q(e);
	if (!i) return e;
	if (J[i]) return J[i];
	let a = X(r);
	for (let e of t) for (let t of e.split(/\s+[|·•–—-]\s+|\s*[|·•]\s*/u)) {
		let e = t.trim();
		if (e && e.length <= 32 && (X(e) === i || X(e) === a)) return e;
	}
	let o = RegExp(`(?:^|[^\\p{L}\\p{N}])(${i.replace(/[^a-z0-9]/gu, "")})(?![\\p{L}\\p{N}])`, "iu");
	for (let e of t) {
		let t = o.exec(e)?.[1];
		if (t && t !== t.toLowerCase()) return t;
	}
	return r;
}
// upstream/src/shared/ui/data/Artifact/HostGlyph.svelte
var te = u("<span class=\"glyph svelte-1jlsa7o\" aria-hidden=\"true\"><!></span>");
function Z(e, t) {
	s(t, !0);
	let n = _(t, "host", 3, ""), c = _(t, "url", 3, ""), u = _(t, "file", 3, !1), f = _(t, "size", 3, 16), h = U(), C = i(() => !u() && h ? h(c() || n()) : null);
	var w = l(), T = m(w), E = (e) => {
		S(e, {
			get image() {
				return v(C).image;
			},
			get tone() {
				return v(C).tone;
			},
			get size() {
				return f();
			}
		});
	}, D = (e) => {
		var t = te();
		let n;
		var o = g(t);
		{
			let e = i(() => Math.round(f() * .62));
			r(o, {
				get icon() {
					return x;
				},
				get size() {
					return v(e);
				}
			});
		}
		b(t), p(() => n = y(t, "", n, { "--glyph": `${f()}px` })), a(e, t);
	};
	o(T, (e) => {
		v(C) ? e(E) : u() && e(D, 1);
	}), a(e, w), d();
}
// upstream/src/features/work/components/cards/HostGlyph.svelte
function Q(e) {
	let t = e.trim();
	if (!t) return null;
	let r = t;
	if (/^https?:\/\//iu.test(t)) {
		let e = n(t);
		if (e) return e;
		try {
			r = new URL(t).host;
		} catch {
			return null;
		}
	}
	let i = r.replace(/^www\./iu, ""), a = (e) => n(`https://${e}`) ?? n(`https://www.${e}`) ?? n(`http://${e}`), o = K(i);
	return a(i) ?? (o === i ? null : a(o));
}
function $(e) {
	let t = e.trim();
	if (!t) return null;
	try {
		let e = new URL(/^https?:\/\//iu.test(t) ? t : `https://${t}`);
		return e.protocol === "https:" && e.hostname.includes(".") ? e.origin : null;
	} catch {
		return null;
	}
}
function ne(n, r) {
	s(r, !0);
	let c = _(r, "host", 3, ""), u = _(r, "url", 3, ""), p = _(r, "icon", 3, null), g = _(r, "file", 3, !1), y = _(r, "size", 3, 16), b = _(r, "loading", 3, !1);
	_(r, "initial", 3, !0);
	let C = i(() => p() ? t(p()) : null), w = i(() => g() ? null : v(C) ? {
		image: v(C),
		tone: e(p())
	} : Q(u() || c())), T = f(F);
	h(() => {
		if (g() || v(w) || !T) return;
		let e = $(u() || c());
		if (!e) return;
		T(e);
		let t = new URL(e).hostname.replace(/^www\./iu, ""), n = K(t);
		n !== t && T(`https://${n}`);
	});
	var E = l(), D = m(E), O = (e) => {
		{
			let t = i(() => v(w)?.image ?? null), n = i(() => v(w)?.tone ?? "mid"), r = i(() => g() ? x : void 0);
			S(e, {
				get image() {
					return v(t);
				},
				get tone() {
					return v(n);
				},
				get size() {
					return y();
				},
				get loading() {
					return b();
				},
				get fallback() {
					return v(r);
				}
			});
		}
	}, k = (e) => {
		Z(e, {
			get host() {
				return c();
			},
			get file() {
				return g();
			},
			get size() {
				return y();
			}
		});
	};
	o(D, (e) => {
		v(w) || b() ? e(O) : g() && e(k, 1);
	}), a(n, E), d();
}
export { F as C, I as D, R as E, M as S, L as T, D as _, G as a, k as b, ee as c, N as d, j as f, z as g, E as h, Z as i, H as l, B as m, Q as n, K as o, P as p, $ as r, q as s, ne as t, T as u, C as v, w, A as x, O as y };

import "./disclose-version-DFvUDwEH.js";
import { B as e, Et as t, F as n, H as r, J as i, K as a, M as o, N as s, Nt as c, Q as l, R as u, Tt as d, _t as f, at as p, c as m, ct as h, dt as g, et as _, h as v, ht as y, it as b, lt as x, n as S, pt as C, q as w, s as T, st as E, ut as D } from "./index-client-oI5R0J23.js";
import { t as O } from "./Icon-BfOzno3u.js";
import { t as k } from "./bindings-BGIzoVqy.js";
import { t as A } from "./native-events-Bexa20bU.js";
import { n as j, t as M } from "./platform-DSkpmG3d.js";
import { t as N } from "./Cancel01Icon-D3Oj0kt9.js";
import { i as ee, n as te, r as ne, t as P } from "./daily-reset-CSj0eIlG.js";
import { r as F } from "./motion-CNlXCFGr.js";
import { t as I } from "./runtime-Ci9kzAvr.js";
// upstream/src/shared/i18n/messages/voice_cancel.js
var L = () => "Cancel dictation", re = ((e = {}, t = {}) => (t.locale ?? I(), L(e))), R = () => "Cancel (Esc)", ie = ((e = {}, t = {}) => (t.locale ?? I(), R(e))), z = () => "Your audio is sent here to be transcribed, then discarded", ae = ((e = {}, t = {}) => (t.locale ?? I(), z(e))), B = () => "Dismiss", oe = ((e = {}, t = {}) => (t.locale ?? I(), B(e))), V = () => "On this device", H = ((e = {}, t = {}) => (t.locale ?? I(), V(e))), U = () => "Groq", W = ((e = {}, t = {}) => (t.locale ?? I(), U(e))), G = () => "On this Mac", K = ((e = {}, t = {}) => (t.locale ?? I(), G(e))), q = () => "OpenAI", J = ((e = {}, t = {}) => (t.locale ?? I(), q(e))), Y = () => "Aegis AI", X = ((e = {}, t = {}) => (t.locale ?? I(), Y(e))), se = () => "Dictation", ce = ((e = {}, t = {}) => (t.locale ?? I(), se(e))), le = () => "Listening", ue = ((e = {}, t = {}) => (t.locale ?? I(), le(e))), de = () => "Recordings can be up to 4 minutes.", fe = ((e = {}, t = {}) => (t.locale ?? I(), de(e))), pe = () => "Your Aegis account is under billing review.", me = ((e = {}, t = {}) => (t.locale ?? I(), pe(e))), he = (e) => `${e?.engine} is busy. Try again in a moment.`, ge = ((e, t = {}) => (t.locale ?? I(), he(e))), _e = (e) => `${e?.engine} has no credit left for dictation.`, ve = ((e, t = {}) => (t.locale ?? I(), _e(e))), ye = (e) => `You’ve reached your daily limit. It resets at ${e?.time}.`, be = ((e, t = {}) => (t.locale ?? I(), ye(e))), xe = () => "Dictation is off on this Mac. Turn it on in System Settings → Keyboard.", Se = ((e = {}, t = {}) => (t.locale ?? I(), xe(e))), Ce = () => "Free Aegis AI usage is paused right now. Credits and your own key still work.", we = ((e = {}, t = {}) => (t.locale ?? I(), Ce(e))), Te = () => "Aegis AI is paused for now. Try again later, or use your own key.", Ee = ((e = {}, t = {}) => (t.locale ?? I(), Te(e))), De = () => "Couldn’t read that recording. Try again.", Oe = ((e = {}, t = {}) => (t.locale ?? I(), De(e))), ke = (e) => `${e?.engine} refused your key. Check it in Settings → AI.`, Ae = ((e, t = {}) => (t.locale ?? I(), ke(e))), je = () => "This device can’t recognize your language. Choose another way to dictate in Settings → AI.", Me = ((e = {}, t = {}) => (t.locale ?? I(), je(e))), Ne = () => "Aegis can’t use the microphone. Allow it in Privacy settings.", Pe = ((e = {}, t = {}) => (t.locale ?? I(), Ne(e))), Fe = () => "Dictation needs Aegis AI or your own OpenAI or Groq key. Set one up in Settings → AI.", Ie = ((e = {}, t = {}) => (t.locale ?? I(), Fe(e))), Le = () => "This Mac can’t recognize your language. Sign in to Aegis AI or add an OpenAI or Groq key in Settings → AI.", Re = ((e = {}, t = {}) => (t.locale ?? I(), Le(e))), ze = () => "No microphone is available.", Be = ((e = {}, t = {}) => (t.locale ?? I(), ze(e))), Ve = () => "Didn’t catch that.", He = ((e = {}, t = {}) => (t.locale ?? I(), Ve(e))), Ue = (e) => `Couldn’t reach ${e?.engine}. Check your connection.`, We = ((e, t = {}) => (t.locale ?? I(), Ue(e))), Ge = () => "Dictation needs a different Aegis plan.", Ke = ((e = {}, t = {}) => (t.locale ?? I(), Ge(e))), qe = () => "Speech recognition is off for Aegis. Allow it in Privacy settings.", Je = ((e = {}, t = {}) => (t.locale ?? I(), qe(e))), Ye = () => "Sign in to Aegis AI again to dictate.", Xe = ((e = {}, t = {}) => (t.locale ?? I(), Ye(e))), Ze = () => "That was too long to transcribe. Try a shorter one.", Qe = ((e = {}, t = {}) => (t.locale ?? I(), Ze(e))), $e = () => "Dictation isn’t available right now.", et = ((e = {}, t = {}) => (t.locale ?? I(), $e(e))), tt = () => "That recording’s format isn’t supported. Try recording again.", nt = ((e = {}, t = {}) => (t.locale ?? I(), tt(e))), rt = () => "Open Keyboard Settings", it = ((e = {}, t = {}) => (t.locale ?? I(), rt(e))), at = () => "Open Privacy Settings", ot = ((e = {}, t = {}) => (t.locale ?? I(), at(e))), st = () => "Try again", ct = ((e = {}, t = {}) => (t.locale ?? I(), st(e))), lt = () => "Settings", ut = ((e = {}, t = {}) => (t.locale ?? I(), lt(e))), dt = () => "Stop and insert", Z = ((e = {}, t = {}) => (t.locale ?? I(), dt(e))), ft = () => "Transcribing…", Q = ((e = {}, t = {}) => (t.locale ?? I(), ft(e))), pt = class {
	commit;
	#e = y("idle");
	get phase() {
		return l(this.#e);
	}
	set phase(e) {
		C(this.#e, e, !0);
	}
	#t = y(null);
	get engine() {
		return l(this.#t);
	}
	set engine(e) {
		C(this.#t, e);
	}
	#n = y("");
	get partial() {
		return l(this.#n);
	}
	set partial(e) {
		C(this.#n, e, !0);
	}
	#r = y(null);
	get problem() {
		return l(this.#r);
	}
	set problem(e) {
		C(this.#r, e);
	}
	#i = y(null);
	get since() {
		return l(this.#i);
	}
	set since(e) {
		C(this.#i, e, !0);
	}
	current = "idle";
	take = null;
	generation = 0;
	listening = null;
	stops = [];
	sinks = [];
	disposed = !1;
	constructor(e) {
		this.commit = e;
	}
	get active() {
		return this.current === "starting" || this.current === "listening" || this.current === "transcribing";
	}
	to(e) {
		this.current = e, this.phase = e;
	}
	onLevels(e) {
		return this.sinks.push(e), () => {
			this.sinks = this.sinks.filter((t) => t !== e);
		};
	}
	listen() {
		return this.listening ??= (async () => {
			let e = await Promise.all([A.voiceChanged.listen(({ payload: e }) => this.changed(e)), A.voiceLevels.listen(({ payload: e }) => {
				if (e.take === this.take && this.current === "listening") for (let t of this.sinks) t(e.levels);
			})]);
			if (this.disposed) for (let t of e) t();
			else this.stops = e;
		})(), this.listening;
	}
	async start() {
		if (this.active || this.disposed) return;
		let e = ++this.generation;
		if (this.reset(), this.engine = null, this.to("starting"), await this.listen(), e !== this.generation) return;
		let t;
		try {
			t = await k.voiceStart();
		} catch {
			t = {
				take: null,
				engine: null,
				fault: "unavailable"
			};
		}
		if (e !== this.generation) t.take !== null && k.voiceCancel().catch(() => {});
		else {
			if (t.fault) return this.fail(t.fault);
			if (t.take === null) return this.reset();
			this.take = t.take, this.engine = t.engine, this.current === "starting" && this.heard();
		}
	}
	heard() {
		this.to("listening"), this.since = performance.now();
	}
	changed(e) {
		if (this.take === null && this.current === "starting" && (this.take = e.take), e.take === this.take) switch (e.engine && (this.engine = e.engine), e.phase) {
			case "listening":
				this.current === "starting" && this.heard(), e.partial !== null && (this.partial = e.partial);
				return;
			case "transcribing":
				this.current === "listening" && this.to("transcribing");
				return;
			case "done": {
				let t = (e.text ?? "").trim();
				if (!t) return this.fail("nothing_heard");
				this.reset(), this.commit(t);
				return;
			}
			case "failed": return this.fail(e.fault ?? "unavailable");
			case "cancelled": return this.reset();
		}
	}
	stop() {
		if (this.current === "starting") return this.cancel();
		this.current === "listening" && this.take !== null && k.voiceStop(this.take).catch(() => this.fail("unavailable"));
	}
	cancel() {
		let e = this.active;
		this.generation += 1, this.reset(), e && k.voiceCancel().catch(() => {});
	}
	fail(e) {
		this.reset(), this.problem = e, this.to("failed");
	}
	reset() {
		this.to("idle"), this.problem = null, this.partial = "", this.since = null, this.take = null;
	}
	dispose() {
		this.cancel(), this.disposed = !0;
		for (let e of this.stops) e();
		this.stops = [], this.sinks = [];
	}
};
// upstream/src/domain/voice/settings.svelte.ts
function $(e) {
	switch (e) {
		case "on_device": return M ? K() : H();
		case "zephium": return X();
		case "open_ai": return J();
		case "groq": return W();
	}
}
// upstream/src/features/work/lib/voice-problem.ts
function mt(e, t) {
	let n = t ? $(t) : X();
	switch (e) {
		case "microphone_denied": return {
			message: Pe(),
			remedy: "microphone"
		};
		case "recognition_denied": return {
			message: Je(),
			remedy: "recognition"
		};
		case "dictation_off": return {
			message: Se(),
			remedy: "dictation"
		};
		case "no_microphone": return {
			message: Be(),
			remedy: "retry"
		};
		case "language_unavailable": return {
			message: Me(),
			remedy: "settings"
		};
		case "no_engine": return {
			message: M ? Re() : Ie(),
			remedy: "settings"
		};
		case "key_refused": return {
			message: Ae({ engine: n }),
			remedy: "settings"
		};
		case "signed_out": return {
			message: Xe(),
			remedy: "settings"
		};
		case "out_of_credit": return {
			message: ve({ engine: n }),
			remedy: t === "zephium" || t === null ? "plans" : "settings"
		};
		case "plan_required": return {
			message: Ke(),
			remedy: "plans"
		};
		case "free_usage_paused": return {
			message: we(),
			remedy: "plans"
		};
		case "billing_review": return {
			message: me(),
			remedy: "account"
		};
		case "daily_limit": return {
			message: be({ time: P() }),
			remedy: "limit"
		};
		case "hosted_paused": return {
			message: Ee(),
			remedy: "settings"
		};
		case "invalid_audio": return {
			message: Oe(),
			remedy: "retry"
		};
		case "unsupported_audio": return {
			message: nt(),
			remedy: "retry"
		};
		case "audio_too_long": return {
			message: fe(),
			remedy: "retry"
		};
		case "rate_limited":
		case "provider_down": return {
			message: ge({ engine: n }),
			remedy: "retry"
		};
		case "offline": return {
			message: We({ engine: n }),
			remedy: "retry"
		};
		case "too_long": return {
			message: Qe(),
			remedy: "retry"
		};
		case "nothing_heard": return {
			message: He(),
			remedy: "retry"
		};
		case "busy":
		case "unavailable": return {
			message: et(),
			remedy: "retry"
		};
	}
}
// upstream/src/features/work/components/bar/VoiceWave.svelte
var ht = r("<span class=\"bar svelte-183kw1n\"></span>"), gt = r("<div class=\"wave svelte-183kw1n\" aria-hidden=\"true\"><div class=\"strip svelte-183kw1n\"></div></div>");
function _t(n, r) {
	t(r, !0);
	let i = [
		.45,
		.75,
		1,
		.75,
		.45
	], a = y(0), u = y(void 0), _ = F(), x = f(() => _ ? i.length : Math.min(160, Math.max(12, Math.floor(l(a) / 4) + 1))), S = g([]), w = (e) => .12 + .88 * Math.min(1, e / 100) ** .75, E = [], D = [];
	function O(e = 0) {
		let t = S.slice(0, l(x));
		if (_) {
			let e = E.at(-1) ?? 0;
			t.forEach((t, n) => {
				t.style.transform = `scaleY(${w(e * i[n])})`;
			});
			return;
		}
		let n = E.length - t.length;
		t.forEach((e, t) => {
			e.style.transform = `scaleY(${w(E[n + t] ?? 0)})`;
		}), l(u) && (l(u).style.transform = `translateX(${-e * 4}px)`);
	}
	p(() => r.take.onLevels((e) => {
		D.push(...e), D.length > 12 && (D = D.slice(-4)), _ && (E = [D.at(-1) ?? 0], D = [], O());
	})), p(() => {
		if (_ || r.phase !== "listening") return;
		l(x);
		let e = 0, t = performance.now(), n = 0, i = (r) => {
			for (n += r - t, t = r; n >= 80;) {
				n -= 80;
				let e = Math.max(D.shift() ?? 0, D.shift() ?? 0);
				E.push(e), E.length > l(x) + 1 && (E = E.slice(-(l(x) + 1)));
			}
			O(n / 80), e = requestAnimationFrame(i);
		};
		return e = requestAnimationFrame(i), () => cancelAnimationFrame(e);
	});
	var k = gt(), A = h(k);
	o(A, 21, () => ({ length: l(x) }), s, (t, n, r) => {
		var i = ht();
		T(i, (e, t) => S[t] = e, (e) => S?.[e], () => [r]), e(t, i);
	}), c(A), T(A, (e) => C(u, e), () => l(u)), c(k), b(() => {
		v(k, "data-phase", r.phase), v(k, "data-reduce", _);
	}), m(k, "clientWidth", (e) => C(a, e)), e(n, k), d();
}
// upstream/src/features/work/components/bar/VoiceView.svelte
var vt = r("<p class=\"partial svelte-1xboy4n\"> </p>"), yt = r("<button type=\"button\" class=\"remedy svelte-1xboy4n\"> </button>"), bt = r("<span class=\"problem-mark svelte-1xboy4n\" aria-hidden=\"true\"><!></span> <p class=\"message svelte-1xboy4n\" role=\"alert\"> </p> <!> <button type=\"button\" class=\"ghost svelte-1xboy4n\"><!></button>", 1), xt = r("<span class=\"working svelte-1xboy4n\"> </span>"), St = r("<span class=\"engine svelte-1xboy4n\"> </span>"), Ct = r("<span class=\"spinner svelte-1xboy4n\" aria-hidden=\"true\"></span>"), wt = r("<span class=\"square svelte-1xboy4n\" aria-hidden=\"true\"></span>"), Tt = r("<button type=\"button\" class=\"ghost svelte-1xboy4n\"><!></button> <div class=\"listen svelte-1xboy4n\"><!> <!></div> <span class=\"meta svelte-1xboy4n\"><!> <span class=\"time svelte-1xboy4n\" aria-hidden=\"true\"> </span></span> <button type=\"button\" class=\"stop svelte-1xboy4n\"><!></button>", 1), Et = r("<div class=\"voice svelte-1xboy4n\" role=\"group\"><!> <div class=\"strip svelte-1xboy4n\"><!></div> <span class=\"sr-only svelte-1xboy4n\" aria-live=\"polite\"> </span></div>");
function Dt(r, a) {
	t(a, !0);
	let o = _(() => a.take) ?? new pt((e) => a.oncommit(e)), s = y(void 0), m = y(g(performance.now()));
	function A() {
		o.phase === "listening" || o.phase === "starting" ? o.stop() : o.phase === "failed" && (o.cancel(), a.onclose());
	}
	S(() => (_(() => a.take) || o.start(), l(s)?.focus(), () => o.dispose()));
	let M = !1;
	p(() => {
		o.phase === "idle" ? M && a.onclose() : M = !0;
	}), p(() => {
		if (o.phase !== "listening") return;
		let e = setInterval(() => C(m, performance.now(), !0), 250);
		return () => clearInterval(e);
	});
	let P = f(() => {
		let e = o.since === null ? 0 : Math.max(0, Math.floor((l(m) - o.since) / 1e3));
		return `${Math.floor(e / 60)}:${String(e % 60).padStart(2, "0")}`;
	}), F = f(() => o.engine !== null && o.engine !== "on_device"), I = f(() => o.problem ? mt(o.problem, o.engine) : null), L = f(() => o.phase === "listening" ? ue() : o.phase === "transcribing" ? Q() : "");
	function R() {
		o.cancel(), a.onclose();
	}
	function z() {
		switch (l(I)?.remedy) {
			case "settings": return k.runCommand("settings.ai"), R();
			case "plans":
			case "account":
			case "limit": return k.runCommand("settings.account"), R();
			case "microphone":
			case "recognition":
			case "dictation": return k.voiceOpenPrivacy(l(I).remedy).catch(() => !1), R();
			case "retry":
				o.start();
				return;
		}
	}
	let B = f(() => l(I)?.remedy === "settings" ? ut() : l(I)?.remedy === "plans" ? te() : l(I)?.remedy === "account" ? ee() : l(I)?.remedy === "limit" ? ne() : l(I)?.remedy === "microphone" || l(I)?.remedy === "recognition" ? ot() : l(I)?.remedy === "dictation" ? it() : l(I)?.remedy === "retry" ? ct() : null);
	var V = { toggle: A }, H = Et();
	i("keydown", E, (e) => {
		e.key !== "Escape" || e.isComposing || o.phase === "idle" || (e.preventDefault(), e.stopPropagation(), R());
	});
	var U = h(H), W = (t) => {
		var n = vt(), r = h(n, !0);
		c(n), b(() => u(r, o.partial)), e(t, n);
	};
	n(U, (e) => {
		o.phase === "listening" && o.partial && e(W);
	});
	var G = D(U, 2), K = h(G), q = (t) => {
		var r = bt(), i = x(r), a = h(i);
		O(a, {
			get icon() {
				return j;
			},
			size: 15
		}), c(i);
		var o = D(i, 2), s = h(o, !0);
		c(o);
		var d = D(o, 2), f = (t) => {
			var n = yt(), r = h(n, !0);
			c(n), b(() => u(r, l(B))), w("click", n, z), e(t, n);
		};
		n(d, (e) => {
			l(B) && e(f);
		});
		var p = D(d, 2), m = h(p);
		O(m, {
			get icon() {
				return N;
			},
			size: 15,
			strokeWidth: 1.8
		}), c(p), b((e) => {
			u(s, l(I).message), v(p, "aria-label", e);
		}, [() => oe()]), w("click", p, R), e(t, r);
	}, J = (t) => {
		var r = Tt(), i = x(r), a = h(i);
		O(a, {
			get icon() {
				return N;
			},
			size: 15,
			strokeWidth: 1.8
		}), c(i);
		var d = D(i, 2), f = h(d);
		_t(f, {
			get take() {
				return o;
			},
			get phase() {
				return o.phase;
			}
		});
		var p = D(f, 2), m = (t) => {
			var n = xt(), r = h(n, !0);
			c(n), b((e) => u(r, e), [() => Q()]), e(t, n);
		};
		n(p, (e) => {
			o.phase === "transcribing" && e(m);
		}), c(d);
		var g = D(d, 2), _ = h(g), y = (t) => {
			var n = St(), r = h(n, !0);
			c(n), b((e, t) => {
				v(n, "title", e), u(r, t);
			}, [() => ae(), () => $(o.engine)]), e(t, n);
		};
		n(_, (e) => {
			l(F) && o.engine && e(y);
		});
		var S = D(_, 2), E = h(S, !0);
		c(S), c(g);
		var k = D(g, 2), A = h(k), j = (t) => {
			var n = Ct();
			e(t, n);
		}, M = (t) => {
			var n = wt();
			e(t, n);
		};
		n(A, (e) => {
			o.phase === "transcribing" ? e(j) : e(M, -1);
		}), c(k), T(k, (e) => C(s, e), () => l(s)), b((e, t, n, r) => {
			v(i, "aria-label", e), v(i, "title", t), u(E, l(P)), v(k, "aria-label", n), v(k, "title", r), v(k, "aria-busy", o.phase === "transcribing" || void 0), k.disabled = o.phase === "transcribing";
		}, [
			() => re(),
			() => ie(),
			() => o.phase === "transcribing" ? Q() : Z(),
			() => Z()
		]), w("click", i, R), w("click", k, () => o.stop()), e(t, r);
	};
	n(K, (e) => {
		l(I) ? e(q) : e(J, -1);
	}), c(G);
	var Y = D(G, 2), X = h(Y, !0);
	return c(Y), c(H), b((e) => {
		v(H, "data-phase", o.phase), v(H, "aria-label", e), u(X, l(L));
	}, [() => ce()]), e(r, H), d(V);
}
a(["click"]);
export { Dt as default };

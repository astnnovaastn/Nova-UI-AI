import "./disclose-version-DFvUDwEH.js";
import { $ as e, B as t, Dt as n, F as r, Ft as i, H as a, J as o, K as s, M as c, N as l, Ot as u, R as d, _t as f, c as p, dt as m, ft as h, h as g, ht as _, lt as v, n as y, nt as b, ot as x, pt as S, q as C, s as w, st as T, ut as E, yt as D } from "./index-client-C_2wYFnt.js";
import { t as O } from "./Icon-E4BzZ4dm.js";
import { t as k } from "./bindings-CWWuBYk9.js";
import { t as A } from "./native-events-Bexa20bU.js";
import { t as j } from "./platform-Mb6CdXdB.js";
import { t as M } from "./Alert02Icon-Bvd3pGhx.js";
import { t as N } from "./Cancel01Icon-D3Oj0kt9.js";
import { i as ee, n as te, r as ne, t as P } from "./daily-reset-CSj0eIlG.js";
import { r as F } from "./motion-CNlXCFGr.js";
import { t as I } from "./runtime-Ci9kzAvr.js";
// upstream/src/shared/i18n/messages/voice_cancel.js
var L = () => "Cancel dictation", re = ((e = {}, t = {}) => (t.locale ?? I(), L(e))), R = () => "Cancel (Esc)", ie = ((e = {}, t = {}) => (t.locale ?? I(), R(e))), z = () => "Your audio is sent here to be transcribed, then discarded", ae = ((e = {}, t = {}) => (t.locale ?? I(), z(e))), B = () => "Dismiss", oe = ((e = {}, t = {}) => (t.locale ?? I(), B(e))), V = () => "On this device", H = ((e = {}, t = {}) => (t.locale ?? I(), V(e))), U = () => "Groq", W = ((e = {}, t = {}) => (t.locale ?? I(), U(e))), G = () => "On this Mac", K = ((e = {}, t = {}) => (t.locale ?? I(), G(e))), q = () => "OpenAI", J = ((e = {}, t = {}) => (t.locale ?? I(), q(e))), Y = () => "Aegis AI", X = ((e = {}, t = {}) => (t.locale ?? I(), Y(e))), se = () => "Dictation", ce = ((e = {}, t = {}) => (t.locale ?? I(), se(e))), le = () => "Listening", ue = ((e = {}, t = {}) => (t.locale ?? I(), le(e))), de = () => "Recordings can be up to 4 minutes.", fe = ((e = {}, t = {}) => (t.locale ?? I(), de(e))), pe = () => "Your Aegis account is under billing review.", me = ((e = {}, t = {}) => (t.locale ?? I(), pe(e))), he = (e) => `${e?.engine} is busy. Try again in a moment.`, ge = ((e, t = {}) => (t.locale ?? I(), he(e))), _e = (e) => `${e?.engine} has no credit left for dictation.`, ve = ((e, t = {}) => (t.locale ?? I(), _e(e))), ye = (e) => `You’ve reached your daily limit. It resets at ${e?.time}.`, be = ((e, t = {}) => (t.locale ?? I(), ye(e))), xe = () => "Dictation is off on this Mac. Turn it on in System Settings → Keyboard.", Se = ((e = {}, t = {}) => (t.locale ?? I(), xe(e))), Ce = () => "Free Aegis AI usage is paused right now. Credits and your own key still work.", we = ((e = {}, t = {}) => (t.locale ?? I(), Ce(e))), Te = () => "Aegis AI is paused for now. Try again later, or use your own key.", Ee = ((e = {}, t = {}) => (t.locale ?? I(), Te(e))), De = () => "Couldn’t read that recording. Try again.", Oe = ((e = {}, t = {}) => (t.locale ?? I(), De(e))), ke = (e) => `${e?.engine} refused your key. Check it in Settings → AI.`, Ae = ((e, t = {}) => (t.locale ?? I(), ke(e))), je = () => "This device can’t recognize your language. Choose another way to dictate in Settings → AI.", Me = ((e = {}, t = {}) => (t.locale ?? I(), je(e))), Ne = () => "Aegis can’t use the microphone. Allow it in Privacy settings.", Pe = ((e = {}, t = {}) => (t.locale ?? I(), Ne(e))), Fe = () => "Dictation needs Aegis AI or your own OpenAI or Groq key. Set one up in Settings → AI.", Ie = ((e = {}, t = {}) => (t.locale ?? I(), Fe(e))), Le = () => "This Mac can’t recognize your language. Sign in to Aegis AI or add an OpenAI or Groq key in Settings → AI.", Re = ((e = {}, t = {}) => (t.locale ?? I(), Le(e))), ze = () => "No microphone is available.", Be = ((e = {}, t = {}) => (t.locale ?? I(), ze(e))), Ve = () => "Didn’t catch that.", He = ((e = {}, t = {}) => (t.locale ?? I(), Ve(e))), Ue = (e) => `Couldn’t reach ${e?.engine}. Check your connection.`, We = ((e, t = {}) => (t.locale ?? I(), Ue(e))), Ge = () => "Dictation needs a different Aegis plan.", Ke = ((e = {}, t = {}) => (t.locale ?? I(), Ge(e))), qe = () => "Speech recognition is off for Aegis. Allow it in Privacy settings.", Je = ((e = {}, t = {}) => (t.locale ?? I(), qe(e))), Ye = () => "Sign in to Aegis AI again to dictate.", Xe = ((e = {}, t = {}) => (t.locale ?? I(), Ye(e))), Ze = () => "That was too long to transcribe. Try a shorter one.", Qe = ((e = {}, t = {}) => (t.locale ?? I(), Ze(e))), $e = () => "Dictation isn’t available right now.", et = ((e = {}, t = {}) => (t.locale ?? I(), $e(e))), tt = () => "That recording’s format isn’t supported. Try recording again.", nt = ((e = {}, t = {}) => (t.locale ?? I(), tt(e))), rt = () => "Open Keyboard Settings", it = ((e = {}, t = {}) => (t.locale ?? I(), rt(e))), at = () => "Open Privacy Settings", ot = ((e = {}, t = {}) => (t.locale ?? I(), at(e))), st = () => "Try again", ct = ((e = {}, t = {}) => (t.locale ?? I(), st(e))), lt = () => "Settings", ut = ((e = {}, t = {}) => (t.locale ?? I(), lt(e))), dt = () => "Stop and insert", Z = ((e = {}, t = {}) => (t.locale ?? I(), dt(e))), ft = () => "Transcribing…", Q = ((e = {}, t = {}) => (t.locale ?? I(), ft(e))), pt = class {
	commit;
	#e = f("idle");
	get phase() {
		return e(this.#e);
	}
	set phase(e) {
		_(this.#e, e, !0);
	}
	#t = f(null);
	get engine() {
		return e(this.#t);
	}
	set engine(e) {
		_(this.#t, e);
	}
	#n = f("");
	get partial() {
		return e(this.#n);
	}
	set partial(e) {
		_(this.#n, e, !0);
	}
	#r = f(null);
	get problem() {
		return e(this.#r);
	}
	set problem(e) {
		_(this.#r, e);
	}
	#i = f(null);
	get since() {
		return e(this.#i);
	}
	set since(e) {
		_(this.#i, e, !0);
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
		case "on_device": return j ? K() : H();
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
			message: j ? Re() : Ie(),
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
var ht = a("<span class=\"bar svelte-183kw1n\"></span>"), gt = a("<div class=\"wave svelte-183kw1n\" aria-hidden=\"true\"><div class=\"strip svelte-183kw1n\"></div></div>");
function _t(r, a) {
	u(a, !0);
	let o = [
		.45,
		.75,
		1,
		.75,
		.45
	], s = f(0), d = f(void 0), m = F(), h = D(() => m ? o.length : Math.min(160, Math.max(12, Math.floor(e(s) / 4) + 1))), v = S([]), y = (e) => .12 + .88 * Math.min(1, e / 100) ** .75, b = [], C = [];
	function O(t = 0) {
		let n = v.slice(0, e(h));
		if (m) {
			let e = b.at(-1) ?? 0;
			n.forEach((t, n) => {
				t.style.transform = `scaleY(${y(e * o[n])})`;
			});
			return;
		}
		let r = b.length - n.length;
		n.forEach((e, t) => {
			e.style.transform = `scaleY(${y(b[r + t] ?? 0)})`;
		}), e(d) && (e(d).style.transform = `translateX(${-t * 4}px)`);
	}
	T(() => a.take.onLevels((e) => {
		C.push(...e), C.length > 12 && (C = C.slice(-4)), m && (b = [C.at(-1) ?? 0], C = [], O());
	})), T(() => {
		if (m || a.phase !== "listening") return;
		e(h);
		let t = 0, n = performance.now(), r = 0, i = (a) => {
			for (r += a - n, n = a; r >= 80;) {
				r -= 80;
				let t = Math.max(C.shift() ?? 0, C.shift() ?? 0);
				b.push(t), b.length > e(h) + 1 && (b = b.slice(-(e(h) + 1)));
			}
			O(r / 80), t = requestAnimationFrame(i);
		};
		return t = requestAnimationFrame(i), () => cancelAnimationFrame(t);
	});
	var k = gt(), A = E(k);
	c(A, 21, () => ({ length: e(h) }), l, (e, n, r) => {
		var i = ht();
		w(i, (e, t) => v[t] = e, (e) => v?.[e], () => [r]), t(e, i);
	}), i(A), w(A, (e) => _(d, e), () => e(d)), i(k), x(() => {
		g(k, "data-phase", a.phase), g(k, "data-reduce", m);
	}), p(k, "clientWidth", (e) => _(s, e)), t(r, k), n();
}
// upstream/src/features/work/components/bar/VoiceView.svelte
var vt = a("<p class=\"partial svelte-1xboy4n\"> </p>"), yt = a("<button type=\"button\" class=\"remedy svelte-1xboy4n\"> </button>"), bt = a("<span class=\"problem-mark svelte-1xboy4n\" aria-hidden=\"true\"><!></span> <p class=\"message svelte-1xboy4n\" role=\"alert\"> </p> <!> <button type=\"button\" class=\"ghost svelte-1xboy4n\"><!></button>", 1), xt = a("<span class=\"working svelte-1xboy4n\"> </span>"), St = a("<span class=\"engine svelte-1xboy4n\"> </span>"), Ct = a("<span class=\"spinner svelte-1xboy4n\" aria-hidden=\"true\"></span>"), wt = a("<span class=\"square svelte-1xboy4n\" aria-hidden=\"true\"></span>"), Tt = a("<button type=\"button\" class=\"ghost svelte-1xboy4n\"><!></button> <div class=\"listen svelte-1xboy4n\"><!> <!></div> <span class=\"meta svelte-1xboy4n\"><!> <span class=\"time svelte-1xboy4n\" aria-hidden=\"true\"> </span></span> <button type=\"button\" class=\"stop svelte-1xboy4n\"><!></button>", 1), Et = a("<div class=\"voice svelte-1xboy4n\" role=\"group\"><!> <div class=\"strip svelte-1xboy4n\"><!></div> <span class=\"sr-only svelte-1xboy4n\" aria-live=\"polite\"> </span></div>");
function Dt(a, s) {
	u(s, !0);
	let c = b(() => s.take) ?? new pt((e) => s.oncommit(e)), l = f(void 0), p = f(S(performance.now()));
	function A() {
		c.phase === "listening" || c.phase === "starting" ? c.stop() : c.phase === "failed" && (c.cancel(), s.onclose());
	}
	y(() => (b(() => s.take) || c.start(), e(l)?.focus(), () => c.dispose()));
	let j = !1;
	T(() => {
		c.phase === "idle" ? j && s.onclose() : j = !0;
	}), T(() => {
		if (c.phase !== "listening") return;
		let e = setInterval(() => _(p, performance.now(), !0), 250);
		return () => clearInterval(e);
	});
	let P = D(() => {
		let t = c.since === null ? 0 : Math.max(0, Math.floor((e(p) - c.since) / 1e3));
		return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
	}), F = D(() => c.engine !== null && c.engine !== "on_device"), I = D(() => c.problem ? mt(c.problem, c.engine) : null), L = D(() => c.phase === "listening" ? ue() : c.phase === "transcribing" ? Q() : "");
	function R() {
		c.cancel(), s.onclose();
	}
	function z() {
		switch (e(I)?.remedy) {
			case "settings": return k.runCommand("settings.ai"), R();
			case "plans":
			case "account":
			case "limit": return k.runCommand("settings.account"), R();
			case "microphone":
			case "recognition":
			case "dictation": return k.voiceOpenPrivacy(e(I).remedy).catch(() => !1), R();
			case "retry":
				c.start();
				return;
		}
	}
	let B = D(() => e(I)?.remedy === "settings" ? ut() : e(I)?.remedy === "plans" ? te() : e(I)?.remedy === "account" ? ee() : e(I)?.remedy === "limit" ? ne() : e(I)?.remedy === "microphone" || e(I)?.remedy === "recognition" ? ot() : e(I)?.remedy === "dictation" ? it() : e(I)?.remedy === "retry" ? ct() : null);
	var V = { toggle: A }, H = Et();
	o("keydown", v, (e) => {
		e.key !== "Escape" || e.isComposing || c.phase === "idle" || (e.preventDefault(), e.stopPropagation(), R());
	});
	var U = E(H), W = (e) => {
		var n = vt(), r = E(n, !0);
		i(n), x(() => d(r, c.partial)), t(e, n);
	};
	r(U, (e) => {
		c.phase === "listening" && c.partial && e(W);
	});
	var G = h(U, 2), K = E(G), q = (n) => {
		var a = bt(), o = m(a), s = E(o);
		O(s, {
			get icon() {
				return M;
			},
			size: 15
		}), i(o);
		var c = h(o, 2), l = E(c, !0);
		i(c);
		var u = h(c, 2), f = (n) => {
			var r = yt(), a = E(r, !0);
			i(r), x(() => d(a, e(B))), C("click", r, z), t(n, r);
		};
		r(u, (t) => {
			e(B) && t(f);
		});
		var p = h(u, 2), _ = E(p);
		O(_, {
			get icon() {
				return N;
			},
			size: 15,
			strokeWidth: 1.8
		}), i(p), x((t) => {
			d(l, e(I).message), g(p, "aria-label", t);
		}, [() => oe()]), C("click", p, R), t(n, a);
	}, J = (n) => {
		var a = Tt(), o = m(a), s = E(o);
		O(s, {
			get icon() {
				return N;
			},
			size: 15,
			strokeWidth: 1.8
		}), i(o);
		var u = h(o, 2), f = E(u);
		_t(f, {
			get take() {
				return c;
			},
			get phase() {
				return c.phase;
			}
		});
		var p = h(f, 2), v = (e) => {
			var n = xt(), r = E(n, !0);
			i(n), x((e) => d(r, e), [() => Q()]), t(e, n);
		};
		r(p, (e) => {
			c.phase === "transcribing" && e(v);
		}), i(u);
		var y = h(u, 2), b = E(y), S = (e) => {
			var n = St(), r = E(n, !0);
			i(n), x((e, t) => {
				g(n, "title", e), d(r, t);
			}, [() => ae(), () => $(c.engine)]), t(e, n);
		};
		r(b, (t) => {
			e(F) && c.engine && t(S);
		});
		var T = h(b, 2), D = E(T, !0);
		i(T), i(y);
		var k = h(y, 2), A = E(k), j = (e) => {
			var n = Ct();
			t(e, n);
		}, M = (e) => {
			var n = wt();
			t(e, n);
		};
		r(A, (e) => {
			c.phase === "transcribing" ? e(j) : e(M, -1);
		}), i(k), w(k, (e) => _(l, e), () => e(l)), x((t, n, r, i) => {
			g(o, "aria-label", t), g(o, "title", n), d(D, e(P)), g(k, "aria-label", r), g(k, "title", i), g(k, "aria-busy", c.phase === "transcribing" || void 0), k.disabled = c.phase === "transcribing";
		}, [
			() => re(),
			() => ie(),
			() => c.phase === "transcribing" ? Q() : Z(),
			() => Z()
		]), C("click", o, R), C("click", k, () => c.stop()), t(n, a);
	};
	r(K, (t) => {
		e(I) ? t(q) : t(J, -1);
	}), i(G);
	var Y = h(G, 2), X = E(Y, !0);
	return i(Y), i(H), x((t) => {
		g(H, "data-phase", c.phase), g(H, "aria-label", t), d(X, e(L));
	}, [() => ce()]), t(a, H), n(V);
}
s(["click"]);
export { Dt as default };

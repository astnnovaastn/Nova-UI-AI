import "./disclose-version-DFvUDwEH.js";
import { A as e, At as t, Ct as n, F as r, G as i, L as a, M as o, St as s, U as c, W as l, Y as u, Z as d, at as f, c as p, ct as m, ft as h, it as g, k as _, m as v, mt as y, n as b, nt as x, ot as S, s as C, st as w, tt as T, ut as E, z as D } from "./index-client-BSGo5gVb.js";
import { t as O } from "./Icon-BWISRU-8.js";
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
	#e = h("idle");
	get phase() {
		return u(this.#e);
	}
	set phase(e) {
		E(this.#e, e, !0);
	}
	#t = h(null);
	get engine() {
		return u(this.#t);
	}
	set engine(e) {
		E(this.#t, e);
	}
	#n = h("");
	get partial() {
		return u(this.#n);
	}
	set partial(e) {
		E(this.#n, e, !0);
	}
	#r = h(null);
	get problem() {
		return u(this.#r);
	}
	set problem(e) {
		E(this.#r, e);
	}
	#i = h(null);
	get since() {
		return u(this.#i);
	}
	set since(e) {
		E(this.#i, e, !0);
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
var ht = D("<span class=\"bar svelte-183kw1n\"></span>"), gt = D("<div class=\"wave svelte-183kw1n\" aria-hidden=\"true\"><div class=\"strip svelte-183kw1n\"></div></div>");
function _t(r, i) {
	n(i, !0);
	let o = [
		.45,
		.75,
		1,
		.75,
		.45
	], c = h(0), l = h(void 0), d = F(), g = y(() => d ? o.length : Math.min(160, Math.max(12, Math.floor(u(c) / 4) + 1))), b = m([]), S = (e) => .12 + .88 * Math.min(1, e / 100) ** .75, w = [], D = [];
	function O(e = 0) {
		let t = b.slice(0, u(g));
		if (d) {
			let e = w.at(-1) ?? 0;
			t.forEach((t, n) => {
				t.style.transform = `scaleY(${S(e * o[n])})`;
			});
			return;
		}
		let n = w.length - t.length;
		t.forEach((e, t) => {
			e.style.transform = `scaleY(${S(w[n + t] ?? 0)})`;
		}), u(l) && (u(l).style.transform = `translateX(${-e * 4}px)`);
	}
	x(() => i.take.onLevels((e) => {
		D.push(...e), D.length > 12 && (D = D.slice(-4)), d && (w = [D.at(-1) ?? 0], D = [], O());
	})), x(() => {
		if (d || i.phase !== "listening") return;
		u(g);
		let e = 0, t = performance.now(), n = 0, r = (i) => {
			for (n += i - t, t = i; n >= 80;) {
				n -= 80;
				let e = Math.max(D.shift() ?? 0, D.shift() ?? 0);
				w.push(e), w.length > u(g) + 1 && (w = w.slice(-(u(g) + 1)));
			}
			O(n / 80), e = requestAnimationFrame(r);
		};
		return e = requestAnimationFrame(r), () => cancelAnimationFrame(e);
	});
	var k = gt(), A = f(k);
	_(A, 21, () => ({ length: u(g) }), e, (e, t, n) => {
		var r = ht();
		C(r, (e, t) => b[t] = e, (e) => b?.[e], () => [n]), a(e, r);
	}), t(A), C(A, (e) => E(l, e), () => u(l)), t(k), T(() => {
		v(k, "data-phase", i.phase), v(k, "data-reduce", d);
	}), p(k, "clientWidth", (e) => E(c, e)), a(r, k), s();
}
// upstream/src/features/work/components/bar/VoiceView.svelte
var vt = D("<p class=\"partial svelte-1xboy4n\"> </p>"), yt = D("<button type=\"button\" class=\"remedy svelte-1xboy4n\"> </button>"), bt = D("<span class=\"problem-mark svelte-1xboy4n\" aria-hidden=\"true\"><!></span> <p class=\"message svelte-1xboy4n\" role=\"alert\"> </p> <!> <button type=\"button\" class=\"ghost svelte-1xboy4n\"><!></button>", 1), xt = D("<span class=\"working svelte-1xboy4n\"> </span>"), St = D("<span class=\"engine svelte-1xboy4n\"> </span>"), Ct = D("<span class=\"spinner svelte-1xboy4n\" aria-hidden=\"true\"></span>"), wt = D("<span class=\"square svelte-1xboy4n\" aria-hidden=\"true\"></span>"), Tt = D("<button type=\"button\" class=\"ghost svelte-1xboy4n\"><!></button> <div class=\"listen svelte-1xboy4n\"><!> <!></div> <span class=\"meta svelte-1xboy4n\"><!> <span class=\"time svelte-1xboy4n\" aria-hidden=\"true\"> </span></span> <button type=\"button\" class=\"stop svelte-1xboy4n\"><!></button>", 1), Et = D("<div class=\"voice svelte-1xboy4n\" role=\"group\"><!> <div class=\"strip svelte-1xboy4n\"><!></div> <span class=\"sr-only svelte-1xboy4n\" aria-live=\"polite\"> </span></div>");
function Dt(e, c) {
	n(c, !0);
	let p = d(() => c.take) ?? new pt((e) => c.oncommit(e)), _ = h(void 0), D = h(m(performance.now()));
	function A() {
		p.phase === "listening" || p.phase === "starting" ? p.stop() : p.phase === "failed" && (p.cancel(), c.onclose());
	}
	b(() => (d(() => c.take) || p.start(), u(_)?.focus(), () => p.dispose()));
	let M = !1;
	x(() => {
		p.phase === "idle" ? M && c.onclose() : M = !0;
	}), x(() => {
		if (p.phase !== "listening") return;
		let e = setInterval(() => E(D, performance.now(), !0), 250);
		return () => clearInterval(e);
	});
	let P = y(() => {
		let e = p.since === null ? 0 : Math.max(0, Math.floor((u(D) - p.since) / 1e3));
		return `${Math.floor(e / 60)}:${String(e % 60).padStart(2, "0")}`;
	}), F = y(() => p.engine !== null && p.engine !== "on_device"), I = y(() => p.problem ? mt(p.problem, p.engine) : null), L = y(() => p.phase === "listening" ? ue() : p.phase === "transcribing" ? Q() : "");
	function R() {
		p.cancel(), c.onclose();
	}
	function z() {
		switch (u(I)?.remedy) {
			case "settings": return k.runCommand("settings.ai"), R();
			case "plans":
			case "account":
			case "limit": return k.runCommand("settings.account"), R();
			case "microphone":
			case "recognition":
			case "dictation": return k.voiceOpenPrivacy(u(I).remedy).catch(() => !1), R();
			case "retry":
				p.start();
				return;
		}
	}
	let B = y(() => u(I)?.remedy === "settings" ? ut() : u(I)?.remedy === "plans" ? te() : u(I)?.remedy === "account" ? ee() : u(I)?.remedy === "limit" ? ne() : u(I)?.remedy === "microphone" || u(I)?.remedy === "recognition" ? ot() : u(I)?.remedy === "dictation" ? it() : u(I)?.remedy === "retry" ? ct() : null);
	var V = { toggle: A }, H = Et();
	i("keydown", g, (e) => {
		e.key !== "Escape" || e.isComposing || p.phase === "idle" || (e.preventDefault(), e.stopPropagation(), R());
	});
	var U = f(H), W = (e) => {
		var n = vt(), i = f(n, !0);
		t(n), T(() => r(i, p.partial)), a(e, n);
	};
	o(U, (e) => {
		p.phase === "listening" && p.partial && e(W);
	});
	var G = w(U, 2), K = f(G), q = (e) => {
		var n = bt(), i = S(n), s = f(i);
		O(s, {
			get icon() {
				return j;
			},
			size: 15
		}), t(i);
		var c = w(i, 2), d = f(c, !0);
		t(c);
		var p = w(c, 2), m = (e) => {
			var n = yt(), i = f(n, !0);
			t(n), T(() => r(i, u(B))), l("click", n, z), a(e, n);
		};
		o(p, (e) => {
			u(B) && e(m);
		});
		var h = w(p, 2), g = f(h);
		O(g, {
			get icon() {
				return N;
			},
			size: 15,
			strokeWidth: 1.8
		}), t(h), T((e) => {
			r(d, u(I).message), v(h, "aria-label", e);
		}, [() => oe()]), l("click", h, R), a(e, n);
	}, J = (e) => {
		var n = Tt(), i = S(n), s = f(i);
		O(s, {
			get icon() {
				return N;
			},
			size: 15,
			strokeWidth: 1.8
		}), t(i);
		var c = w(i, 2), d = f(c);
		_t(d, {
			get take() {
				return p;
			},
			get phase() {
				return p.phase;
			}
		});
		var m = w(d, 2), h = (e) => {
			var n = xt(), i = f(n, !0);
			t(n), T((e) => r(i, e), [() => Q()]), a(e, n);
		};
		o(m, (e) => {
			p.phase === "transcribing" && e(h);
		}), t(c);
		var g = w(c, 2), y = f(g), b = (e) => {
			var n = St(), i = f(n, !0);
			t(n), T((e, t) => {
				v(n, "title", e), r(i, t);
			}, [() => ae(), () => $(p.engine)]), a(e, n);
		};
		o(y, (e) => {
			u(F) && p.engine && e(b);
		});
		var x = w(y, 2), D = f(x, !0);
		t(x), t(g);
		var k = w(g, 2), A = f(k), j = (e) => {
			var t = Ct();
			a(e, t);
		}, M = (e) => {
			var t = wt();
			a(e, t);
		};
		o(A, (e) => {
			p.phase === "transcribing" ? e(j) : e(M, -1);
		}), t(k), C(k, (e) => E(_, e), () => u(_)), T((e, t, n, a) => {
			v(i, "aria-label", e), v(i, "title", t), r(D, u(P)), v(k, "aria-label", n), v(k, "title", a), v(k, "aria-busy", p.phase === "transcribing" || void 0), k.disabled = p.phase === "transcribing";
		}, [
			() => re(),
			() => ie(),
			() => p.phase === "transcribing" ? Q() : Z(),
			() => Z()
		]), l("click", i, R), l("click", k, () => p.stop()), a(e, n);
	};
	o(K, (e) => {
		u(I) ? e(q) : e(J, -1);
	}), t(G);
	var Y = w(G, 2), X = f(Y, !0);
	return t(Y), t(H), T((e) => {
		v(H, "data-phase", p.phase), v(H, "aria-label", e), r(X, u(L));
	}, [() => ce()]), a(e, H), s(V);
}
c(["click"]);
export { Dt as default };

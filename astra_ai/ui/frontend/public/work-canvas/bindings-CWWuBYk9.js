// src/native/host-session.ts
var e = () => ({});
function t(t) {
	e = t;
}
function n() {
	return {
		"Content-Type": "application/json",
		...e()
	};
}
// src/native/core.ts
var r = {
	favicon_probe: !0,
	work_release_memory: !0,
	keymap_entries: []
}, i = /* @__PURE__ */ new Set(), a;
function o(e) {
	e.isTrusted && (a = e, queueMicrotask(() => {
		a === e && (a = void 0);
	}));
}
var s = () => [...i];
async function c(e, t) {
	if (e === "browser_open_url") {
		let e = new URL(String(t?.url));
		if (!a?.isTrusted || !["http:", "https:"].includes(e.protocol) || e.username || e.password) throw Error("Choose a valid page to open.");
		window.dispatchEvent(new CustomEvent("aegis-open-source-window", { detail: {
			url: e.href,
			activation: a
		} }));
	} else {
		if (e === "resource_call") {
			let e = await fetch("/api/workspace/v22/resources", {
				method: "POST",
				credentials: "same-origin",
				headers: n(),
				body: JSON.stringify(t)
			});
			if (!e.ok) throw Error("Task request failed");
			let r = await e.json(), i = r.response;
			return i.kind === "applied" && window.dispatchEvent(new CustomEvent("zephium:resource-changed", { detail: {
				profile: r.profile,
				kind: "task",
				id: i.record.id,
				revision: i.record.revision
			} })), i.kind === "task_list_applied" && window.dispatchEvent(new CustomEvent("zephium:task-lists-changed", { detail: { profile: r.profile } })), r;
		}
		if (e === "work_save_calendar") {
			if (typeof t?.text != "string" || !t.text.startsWith("BEGIN:VCALENDAR")) throw Error("Invalid calendar");
			let e = URL.createObjectURL(new Blob([t.text], { type: "text/calendar;charset=utf-8" })), n = document.createElement("a");
			return n.href = e, n.download = String(t.name || "calendar.ics").replace(/[\\/]/g, "-"), n.click(), setTimeout(() => URL.revokeObjectURL(e), 1e3), !0;
		}
		if (e === "note_call") {
			let e = t?.call;
			if (e?.kind === "reveal" && !e.id) {
				let e = window.aegisDesktop;
				if (!e) return {
					profile: t?.expectedProfile,
					response: {
						kind: "error",
						error: "unavailable"
					}
				};
				if (!await e.invoke("notes_folder_select")) return {
					profile: t?.expectedProfile,
					response: { kind: "done" }
				};
				let r = await fetch("/api/workspace/v21/notes/export", { headers: n() }).then((e) => e.json()), i = await e.invoke("notes_folder_sync", { notes: r.items });
				for (let e of i.updates || []) await c("note_call", {
					...t,
					call: {
						kind: "write",
						request_id: crypto.randomUUID(),
						...e
					}
				});
				return {
					profile: t?.expectedProfile,
					response: {
						kind: i.conflicts?.length ? "error" : "done",
						...i.conflicts?.length ? { error: "conflict" } : {}
					}
				};
			}
			if (e?.kind === "reveal" && e.id) {
				let n = await c("note_call", {
					...t,
					call: {
						kind: "get",
						id: e.id
					}
				});
				if (n.response.kind !== "record") return n;
				let r = new Blob([n.response.record.markdown], { type: "text/markdown;charset=utf-8" }), i = URL.createObjectURL(r), a = document.createElement("a");
				return a.href = i, a.download = e.id + ".md", a.click(), setTimeout(() => URL.revokeObjectURL(i), 1e3), {
					profile: t?.expectedProfile,
					response: { kind: "done" }
				};
			}
			let r = await fetch("/api/workspace/v21/notes", {
				method: "POST",
				credentials: "same-origin",
				headers: n(),
				body: JSON.stringify(t)
			});
			if (!r.ok) throw Error("Notes request failed");
			return r.json();
		}
		if (e in r) return r[e];
		throw i.add(e), Error(`"${e}" is not available in AEGIS Research.`);
	}
}
// src/native/event.ts
var l = async (e, t) => {
	let n = (n) => t({
		event: e,
		id: 0,
		payload: n.detail
	});
	return window.addEventListener(e, n), () => window.removeEventListener(e, n);
}, u = async (e, t) => {
	let n;
	return n = await l(e, (e) => {
		n(), t(e);
	}), n;
}, d = async (e, t) => {
	window.dispatchEvent(new CustomEvent(e, { detail: t }));
}, f = {
	workCall: (e, t) => c("work_call", {
		expectedProfile: e,
		call: t
	}),
	workSaveCalendar: (e, t) => c("work_save_calendar", {
		name: e,
		text: t
	}),
	workEditDraft: (e, t, n, r, i, a, o) => c("work_edit_draft", {
		expectedProfile: e,
		work: t,
		expectedRevision: n,
		command: r,
		execution: i,
		artifact: a,
		body: o
	}),
	workOperation: (e, t, n) => c("work_operation", {
		expectedProfile: e,
		operation: t,
		input: n
	}),
	workOperationStatus: (e, t, n, r) => c("work_operation_status", {
		expectedProfile: e,
		work: t,
		operation: n,
		acknowledge: r
	}),
	workRunning: () => c("work_running"),
	workContextPreview: (e, t, n) => c("work_context_preview", {
		expectedProfile: e,
		purpose: t,
		selection: n
	}),
	mediaImport: (e) => p(c("media_import", { expectedProfile: e })),
	mediaOpen: (e, t) => p(c("media_open", {
		expectedProfile: e,
		id: t
	})),
	mediaAdmitRemote: (e, t, n, r) => p(c("media_admit_remote", {
		expectedProfile: e,
		environment: t,
		element: n,
		url: r
	})),
	linkDescribe: (e, t, n) => p(c("link_describe", {
		expectedProfile: e,
		environment: t,
		element: n
	})),
	workAdmitFolder: (e, t) => p(c("work_admit_folder", {
		expectedProfile: e,
		path: t
	})),
	workPickFolder: (e) => p(c("work_pick_folder", { expectedProfile: e })),
	workRevealPath: (e, t) => p(c("work_reveal_path", {
		expectedProfile: e,
		path: t
	})),
	workReleaseMemory: (e) => c("work_release_memory", { idle: e }),
	workChooseFolder: (e, t) => p(c("work_choose_folder", {
		expectedProfile: e,
		start: t
	})),
	workActivity: (e, t) => c("work_activity", {
		expectedProfile: e,
		work: t
	}),
	workHumanPages: (e, t) => c("work_human_pages", {
		expectedProfile: e,
		work: t
	}),
	workHumanPresent: (e, t, n, r) => c("work_human_present", {
		expectedProfile: e,
		work: t,
		page: n,
		region: r
	}),
	workHumanContinue: (e, t, n, r) => c("work_human_continue", {
		expectedProfile: e,
		work: t,
		page: n,
		account: r
	}),
	workHumanRelease: (e, t, n) => c("work_human_release", {
		expectedProfile: e,
		work: t,
		page: n
	}),
	workHumanExtend: (e, t, n) => c("work_human_extend", {
		expectedProfile: e,
		work: t,
		page: n
	}),
	workHumanCheck: (e, t, n) => c("work_human_check", {
		expectedProfile: e,
		work: t,
		page: n
	}),
	workDecisionPreference: (e) => c("work_decision_preference", { expectedProfile: e }),
	workSetDecisionPreference: (e, t) => c("work_set_decision_preference", {
		expectedProfile: e,
		choice: t
	}),
	workSetDecisionKey: (e, t) => c("work_set_decision_key", {
		expectedProfile: e,
		secret: t
	}),
	workClearDecisionKey: (e) => c("work_clear_decision_key", { expectedProfile: e }),
	workModels: (e) => c("work_models", { expectedProfile: e }),
	workModelsReady: (e) => c("work_models_ready", { expectedProfile: e }),
	workChooseModel: (e, t, n) => c("work_choose_model", {
		expectedProfile: e,
		role: t,
		id: n
	}),
	workSetModelEffort: (e, t) => c("work_set_model_effort", {
		expectedProfile: e,
		effort: t
	}),
	workSetProviderKey: (e, t, n) => c("work_set_provider_key", {
		expectedProfile: e,
		provider: t,
		key: n
	}),
	workTestProviderKey: (e, t) => c("work_test_provider_key", {
		expectedProfile: e,
		provider: t
	}),
	workClearProviderKey: (e, t) => c("work_clear_provider_key", {
		expectedProfile: e,
		provider: t
	}),
	workSetModelEndpoint: (e, t) => c("work_set_model_endpoint", {
		expectedProfile: e,
		base: t
	}),
	workMoreModels: (e, t) => c("work_more_models", {
		expectedProfile: e,
		provider: t
	}),
	workLocalServers: () => c("work_local_servers"),
	voiceStatus: () => c("voice_status"),
	voiceChooseEngine: (e) => c("voice_choose_engine", { engine: e }),
	voiceChooseLanguage: (e) => c("voice_choose_language", { language: e }),
	voiceStart: () => c("voice_start"),
	voiceStop: (e) => c("voice_stop", { take: e }),
	voiceCancel: () => c("voice_cancel"),
	voiceOpenPrivacy: (e) => c("voice_open_privacy", { kind: e }),
	pageAssistStatus: (e, t) => c("page_assist_status", {
		space: e,
		tab: t
	}),
	pageAssistAsk: (e) => c("page_assist_ask", { request: e }),
	pageAssistStop: (e) => c("page_assist_stop", { space: e }),
	pageAssistCite: (e, t, n) => c("page_assist_cite", {
		conversation: e,
		reply: t,
		n
	}),
	pageAssistFocus: (e, t, n, r) => c("page_assist_focus", {
		conversation: e,
		reply: t,
		block: n,
		n: r
	}),
	pageAssistDecide: (e, t, n, r) => c("page_assist_decide", {
		conversation: e,
		reply: t,
		block: n,
		decision: r
	}),
	pageAssistResume: (e, t) => c("page_assist_resume", {
		conversation: e,
		reply: t
	}),
	pageAssistContinue: (e, t, n) => c("page_assist_continue", {
		conversation: e,
		reply: t,
		block: n
	}),
	pageAssistNew: (e) => c("page_assist_new", { space: e }),
	pageAssistHistory: (e) => c("page_assist_history", { space: e }),
	pageAssistOpen: (e, t) => c("page_assist_open", {
		space: e,
		conversation: t
	}),
	pageAssistDelete: (e, t) => c("page_assist_delete", {
		space: e,
		conversation: t
	}),
	pageAssistPick: (e, t) => c("page_assist_pick", {
		space: e,
		tab: t
	}),
	pageAssistPickCancel: (e) => c("page_assist_pick_cancel", { tab: e }),
	pageAssistDetach: (e, t) => c("page_assist_detach", {
		tab: e,
		pick: t
	}),
	pageAssistClose: (e) => c("page_assist_close", { space: e }),
	pageStyles: (e) => c("page_styles", { tab: e }),
	pageStyleToggle: (e, t, n) => c("page_style_toggle", {
		tab: e,
		style: t,
		enabled: n
	}),
	pageStyleRemove: (e, t) => c("page_style_remove", {
		tab: e,
		style: t
	}),
	pageStylesAll: (e) => c("page_styles_all", { profile: e }),
	pageStyleToggleFor: (e, t, n, r) => c("page_style_toggle_for", {
		profile: e,
		site: t,
		style: n,
		enabled: r
	}),
	pageStyleRemoveFor: (e, t, n) => c("page_style_remove_for", {
		profile: e,
		site: t,
		style: n
	}),
	accountGet: () => c("account_get"),
	accountSendCode: (e) => c("account_send_code", { email: e }),
	accountVerify: (e) => c("account_verify", { code: e }),
	accountCancelCode: () => c("account_cancel_code"),
	accountSignOut: () => c("account_sign_out"),
	accountRefresh: () => c("account_refresh"),
	accountBuy: (e) => c("account_buy", { purchase: e }),
	accountManage: () => c("account_manage"),
	accountSetDailyLimit: (e) => c("account_set_daily_limit", { limit: e }),
	accountPlanPreview: (e, t) => c("account_plan_preview", {
		plan: e,
		interval: t
	}),
	accountPlanConfirm: () => c("account_plan_confirm"),
	accountPlanDismiss: () => c("account_plan_dismiss"),
	accountSessions: () => c("account_sessions"),
	accountRevokeSession: (e) => c("account_revoke_session", { id: e }),
	accountSetServer: (e) => c("account_set_server", { server: e }),
	accountDeletionCode: () => c("account_deletion_code"),
	accountDelete: (e) => c("account_delete", { code: e }),
	accountSetName: (e) => c("account_set_name", { name: e }),
	accountReauthCode: () => c("account_reauth_code"),
	accountEmailCode: (e) => c("account_email_code", { email: e }),
	accountChangeEmail: (e, t) => c("account_change_email", {
		email: e,
		code: t
	}),
	accountSignOutEverywhere: () => c("account_sign_out_everywhere"),
	accountExport: () => c("account_export"),
	accountUsageHistory: (e) => c("account_usage_history", { cursor: e }),
	accountReceipt: (e) => c("account_receipt", { id: e }),
	accountAvatarPick: () => p(c("account_avatar_pick")),
	accountAvatarSave: (e, t) => c("account_avatar_save", {
		token: e,
		crop: t
	}),
	accountAvatarDiscard: (e) => c("account_avatar_discard", { token: e }),
	accountAvatarRemove: () => c("account_avatar_remove"),
	workSites: (e) => c("work_sites", { expectedProfile: e }),
	workSetSite: (e, t) => c("work_set_site", {
		expectedProfile: e,
		change: t
	}),
	workScreenshotSites: (e) => c("work_screenshot_sites", { expectedProfile: e }),
	workSetScreenshotSite: (e, t) => c("work_set_screenshot_site", {
		expectedProfile: e,
		change: t
	}),
	workClearWebsiteData: (e) => c("work_clear_website_data", { expectedProfile: e }),
	workConnections: (e) => c("work_connections", { expectedProfile: e }),
	workSaveConnection: (e, t) => c("work_save_connection", {
		expectedProfile: e,
		draft: t
	}),
	workPreviewConnection: (e, t) => c("work_preview_connection", {
		expectedProfile: e,
		draft: t
	}),
	workRemoveConnection: (e, t) => c("work_remove_connection", {
		expectedProfile: e,
		id: t
	}),
	workCheckConnection: (e, t) => c("work_check_connection", {
		expectedProfile: e,
		id: t
	}),
	workSignInConnection: (e, t) => c("work_sign_in_connection", {
		expectedProfile: e,
		id: t
	}),
	workCancelConnectionSignIn: (e, t, n) => c("work_cancel_connection_sign_in", {
		expectedProfile: e,
		id: t,
		requestId: n
	}),
	workMemories: (e, t) => c("work_memories", {
		expectedProfile: e,
		query: t
	}),
	workChangeMemory: (e, t, n) => c("work_change_memory", {
		expectedProfile: e,
		query: t,
		change: n
	}),
	workSkills: (e) => c("work_skills", { expectedProfile: e }),
	workSkillText: (e, t) => c("work_skill_text", {
		expectedProfile: e,
		name: t
	}),
	workChangeSkill: (e, t) => c("work_change_skill", {
		expectedProfile: e,
		change: t
	}),
	tabsBootstrap: () => c("tabs_bootstrap"),
	tabsOpen: () => c("tabs_open"),
	tabsActivate: (e) => c("tabs_activate", { id: e }),
	tabsClose: (e) => c("tabs_close", { id: e }),
	tabsSetEssential: (e, t, n) => c("tabs_set_essential", {
		id: e,
		essential: t,
		before: n
	}),
	essentialsKeep: (e) => c("essentials_keep", { site: e }),
	essentialsRelease: (e) => c("essentials_release", { site: e }),
	profileRename: (e) => c("profile_rename", { name: e }),
	onboardingPlayIntro: () => c("onboarding_play_intro"),
	onboardingFinish: () => c("onboarding_finish"),
	tabsNavigate: (e, t) => c("tabs_navigate", {
		id: e,
		input: t
	}),
	tabsReload: (e) => c("tabs_reload", { id: e }),
	tabsAnswerPageRequest: (e, t, n) => c("tabs_answer_page_request", {
		id: e,
		request: t,
		answer: n
	}),
	tabsAnswerSignIn: (e, t, n) => c("tabs_answer_sign_in", {
		id: e,
		request: t,
		credentials: n
	}),
	tabsContinuePastCertificate: (e) => c("tabs_continue_past_certificate", { id: e }),
	tabsContinuePastBlock: (e, t) => c("tabs_continue_past_block", {
		id: e,
		url: t
	}),
	tabsLeaveBlockedPage: (e) => c("tabs_leave_blocked_page", { id: e }),
	diagnosticsShowLogs: () => c("diagnostics_show_logs"),
	diagnosticsReport: () => c("diagnostics_report"),
	tabsBack: (e) => c("tabs_back", { id: e }),
	tabsForward: (e) => c("tabs_forward", { id: e }),
	workPaneShow: (e, t) => c("work_pane_show", {
		target: e,
		rect: t
	}),
	workPaneSetRect: (e, t) => c("work_pane_set_rect", {
		rect: e,
		generation: t
	}),
	workPaneHide: () => c("work_pane_hide"),
	tabsSplit: (e) => c("tabs_split", { other: e }),
	tabsUnsplit: () => c("tabs_unsplit"),
	tabsLeaveSplit: (e) => c("tabs_leave_split", { id: e }),
	chromeMenuPopup: (e, t, n, r) => c("chrome_menu_popup", {
		x: e,
		y: t,
		page: n,
		canSplit: r
	}),
	extensionActionInvoke: (e, t, n, r, i, a, o, s) => c("extension_action_invoke", {
		profileId: e,
		installId: t,
		runtimeGeneration: n,
		actionRevision: r,
		anchorX: i,
		anchorY: a,
		anchorWidth: o,
		anchorHeight: s
	}),
	extensionActionMenu: (e, t, n, r, i, a, o, s) => c("extension_action_menu", {
		profileId: e,
		installId: t,
		runtimeGeneration: n,
		actionRevision: r,
		anchorX: i,
		anchorY: a,
		anchorWidth: o,
		anchorHeight: s
	}),
	webExtensionPrepare: (e) => p(c("web_extension_prepare", { tabId: e })),
	webExtensionStoreButton: (e, t, n, r) => c("web_extension_store_button", {
		tabId: e,
		extensionId: t,
		state: n,
		label: r
	}),
	webExtensionConfirm: (e, t) => p(c("web_extension_confirm", {
		id: e,
		reviewId: t
	})),
	webExtensionCancel: (e) => c("web_extension_cancel", { reviewId: e }),
	webExtensionList: () => p(c("web_extension_list")),
	webExtensionSetEnabled: (e, t) => p(c("web_extension_set_enabled", {
		id: e,
		enabled: t
	})),
	webExtensionSetPinned: (e, t) => p(c("web_extension_set_pinned", {
		id: e,
		pinned: t
	})),
	webExtensionRetry: (e, t) => p(c("web_extension_retry", {
		profileId: e,
		installId: t
	})),
	webExtensionUninstall: (e) => p(c("web_extension_uninstall", { id: e })),
	webExtensionAnswerAccess: (e, t) => p(c("web_extension_answer_access", {
		request: e,
		allowed: t
	})),
	webExtensionSetAccess: (e, t, n) => p(c("web_extension_set_access", {
		id: e,
		mode: t,
		sites: n
	})),
	webExtensionOpenOptions: (e) => p(c("web_extension_open_options", { id: e })),
	webExtensionChooseFile: (e) => p(c("web_extension_choose_file", { folder: e })),
	webExtensionPrepareFile: (e) => p(c("web_extension_prepare_file", { path: e })),
	webExtensionReviewUpdate: (e) => p(c("web_extension_review_update", { id: e })),
	browserCredentialCapability: () => c("browser_credential_capability"),
	browserPasskeyAuthorizationRequest: () => c("browser_passkey_authorization_request"),
	pagePermissionRespond: (e, t, n, r) => c("page_permission_respond", {
		profileId: e,
		itemId: t,
		requestId: n,
		decision: r
	}),
	pagePermissionCardHost: (e) => c("page_permission_card_host", { available: e }),
	chromeModal: (e) => c("chrome_modal", { open: e }),
	tabSetMuted: (e, t) => c("tab_set_muted", {
		id: e,
		muted: t
	}),
	mediaPlayer: (e, t) => c("media_player", {
		id: e,
		action: t
	}),
	sitePermissions: (e) => p(c("site_permissions", { origin: e })),
	sitePermissionSet: (e, t, n, r) => c("site_permission_set", {
		origin: e,
		kind: t,
		decision: n,
		scheme: r
	}),
	blockerStatus: () => p(c("blocker_status")),
	blockerStats: (e) => p(c("blocker_stats", { profile: e })),
	blockerSetEnabled: (e) => c("blocker_set_enabled", { enabled: e }),
	blockerSiteChange: (e, t) => c("blocker_site_change", {
		context: e,
		action: t
	}),
	blockerPicker: (e, t) => p(c("blocker_picker", {
		context: e,
		action: t
	})),
	blockerRetry: (e) => c("blocker_retry", { failedGeneration: e }),
	blockerRefreshSources: () => c("blocker_refresh_sources"),
	profilesDelete: (e) => c("profiles_delete", { profile: e }),
	profilesGet: () => p(c("profiles_get")),
	profilesCreate: (e, t, n) => c("profiles_create", {
		name: e,
		avatar: t,
		andSwitch: n
	}),
	profilesSwitch: (e) => c("profiles_switch", { profile: e }),
	profilesRename: (e, t) => c("profiles_rename", {
		profile: e,
		name: t
	}),
	profilesSetAvatar: (e, t) => c("profiles_set_avatar", {
		profile: e,
		avatar: t
	}),
	profileAvatarPick: () => p(c("profile_avatar_pick")),
	spacesCreate: (e, t) => c("spaces_create", {
		name: e,
		look: t
	}),
	spacesUpdate: (e, t, n) => c("spaces_update", {
		space: e,
		name: t,
		look: n
	}),
	spacesDelete: (e) => c("spaces_delete", { space: e }),
	spacesReorder: (e, t) => c("spaces_reorder", {
		space: e,
		before: t
	}),
	spacesSwitch: (e) => c("spaces_switch", { space: e }),
	spacesStep: (e) => c("spaces_step", { step: e }),
	spacesMoveTab: (e, t) => c("spaces_move_tab", {
		tab: e,
		space: t
	}),
	spacesMenuPopup: (e, t) => c("spaces_menu_popup", {
		x: e,
		y: t
	}),
	operationStatus: (e) => c("operation_status", { operationId: e }),
	operationsReconcile: () => c("operations_reconcile"),
	operationAcknowledge: (e) => c("operation_acknowledge", { operationId: e }),
	runCommand: (e) => c("run_command", { id: e }),
	panelHide: () => c("panel_hide"),
	panelReady: () => c("panel_ready"),
	tabSwitcherOpen: () => c("tab_switcher_open"),
	tabSwitcherAction: (e, t) => c("tab_switcher_action", {
		sessionId: e,
		intent: t
	}),
	panelIntent: (e) => c("panel_intent", { intent: e }),
	panelLayout: (e) => c("panel_layout", { layout: e }),
	launcherEdit: (e, t) => c("launcher_edit", {
		tabId: e,
		url: t
	}),
	launcherTrigger: () => c("launcher_trigger"),
	launcherSetShortcut: (e) => c("launcher_set_shortcut", { accelerator: e }),
	launcherRecordShortcut: (e) => c("launcher_record_shortcut", { active: e }),
	launcherSetDoubleTap: (e) => c("launcher_set_double_tap", { mode: e }),
	launcherOpenAccessibility: () => c("launcher_open_accessibility"),
	settingGet: (e) => c("setting_get", { key: e }),
	searchShortcutDefaults: () => c("search_shortcut_defaults"),
	settingSet: (e, t) => c("setting_set", {
		key: e,
		value: t
	}),
	windowsDiagnosticsSettings: () => c("windows_diagnostics_settings"),
	windowsReputationManaged: () => c("windows_reputation_managed"),
	uiInfo: () => c("ui_info"),
	uiReady: () => c("ui_ready"),
	captionReplay: () => c("caption_replay"),
	menuPopup: (e, t) => c("menu_popup", {
		x: e,
		y: t
	}),
	addMenuPopup: (e, t, n) => c("add_menu_popup", {
		x: e,
		y: t,
		canSplit: n
	}),
	tabMenuPopup: (e, t, n, r) => c("tab_menu_popup", {
		id: e,
		x: t,
		y: n,
		context: r
	}),
	bookmarkMenuPopup: (e, t, n) => c("bookmark_menu_popup", {
		x: e,
		y: t,
		folder: n
	}),
	profileMenuPopup: (e, t) => c("profile_menu_popup", {
		x: e,
		y: t
	}),
	sidebarMenuPopup: (e, t, n, r, i, a, o) => c("sidebar_menu_popup", {
		x: e,
		y: t,
		siteProtected: n,
		canHide: r,
		canClearData: i,
		extensions: a,
		manageExtensions: o
	}),
	toolsMenuPopup: (e, t) => c("tools_menu_popup", {
		x: e,
		y: t
	}),
	newtabSearchContext: (e) => c("newtab_search_context", { tabId: e }),
	newtabSearch: (e, t) => c("newtab_search", {
		query: e,
		context: t
	}),
	newtabRun: (e, t) => c("newtab_run", {
		action: e,
		context: t
	}),
	newtabCancel: (e) => c("newtab_cancel", { context: e }),
	launcherSearch: (e, t) => c("launcher_search", {
		query: e,
		requestId: t
	}),
	launcherRun: (e, t, n) => c("launcher_run", {
		action: e,
		context: t,
		background: n
	}),
	sidebarSetWidth: (e, t, n) => c("sidebar_set_width", {
		width: e,
		animate: t,
		revision: n
	}),
	sidebarSetHidden: (e) => c("sidebar_set_hidden", { hidden: e }),
	sidebarPeek: (e, t, n) => c("sidebar_peek", {
		peek: e,
		lights: t,
		slide: n
	}),
	sidebarResize: (e, t, n) => c("sidebar_resize", {
		width: e,
		enabled: t,
		revision: n
	}),
	sidebarResizeGuide: (e) => c("sidebar_resize_guide", { width: e }),
	tabDragOver: (e, t) => c("tab_drag_over", {
		x: e,
		y: t
	}),
	resourceCall: (e, t) => c("resource_call", {
		expectedProfile: e,
		call: t
	}),
	noteCall: (e, t) => c("note_call", {
		expectedProfile: e,
		call: t
	}),
	historyCall: (e, t) => c("history_call", {
		expectedProfile: e,
		call: t
	}),
	browsingDataCall: (e, t) => c("browsing_data_call", {
		expectedProfile: e,
		call: t
	}),
	faviconProbe: (e, t) => c("favicon_probe", {
		expectedProfile: e,
		origins: t
	}),
	downloadCall: (e, t) => c("download_call", {
		expectedProfile: e,
		call: t
	}),
	downloadOpenAccessSettings: () => c("download_open_access_settings"),
	aboutInfo: () => c("about_info"),
	systemClock24h: () => c("system_clock_24h"),
	updateStatus: () => c("update_status"),
	updateCheck: () => c("update_check"),
	updateRelaunch: () => c("update_relaunch"),
	appRelaunch: () => c("app_relaunch"),
	updateHighlights: () => c("update_highlights"),
	openSoftwareUpdate: () => c("open_software_update"),
	browserOpenUrl: (e, t) => c("browser_open_url", {
		url: e,
		newTab: t
	}),
	keymapEntries: () => c("keymap_entries"),
	keymapBind: (e, t, n) => c("keymap_bind", {
		id: e,
		accelerator: t,
		replace: n
	}),
	keymapReset: (e) => c("keymap_reset", { id: e }),
	keymapRecord: (e) => c("keymap_record", { active: e }),
	defaultBrowserStatus: () => c("default_browser_status"),
	defaultBrowserRequest: () => c("default_browser_request"),
	loginItemStatus: () => c("login_item_status"),
	loginItemSet: (e) => c("login_item_set", { enabled: e }),
	loginItemOpenSettings: () => c("login_item_open_settings"),
	haptic: (e) => c("haptic", { kind: e }),
	bookmarkCall: (e, t) => c("bookmark_call", {
		expectedProfile: e,
		call: t
	}),
	timeCall: (e, t) => c("time_call", {
		expectedProfile: e,
		call: t
	}),
	zoomCall: (e, t) => c("zoom_call", {
		expectedProfile: e,
		call: t
	}),
	focusControl: (e) => c("focus_control", { control: e }),
	pageFind: (e, t) => c("page_find", {
		query: e,
		forward: t
	}),
	importSources: () => c("import_sources"),
	importStart: (e, t, n) => c("import_start", {
		source: e,
		profile: t,
		kinds: n
	}),
	importCancel: () => c("import_cancel"),
	importOpenPermission: (e) => c("import_open_permission", { source: e }),
	exportBrowserData: (e) => c("export_browser_data", { kind: e }),
	historyMenuPopup: (e, t, n, r) => c("history_menu_popup", {
		id: e,
		forward: t,
		x: n,
		y: r
	}),
	pageSource: (e) => c("page_source", { id: e }),
	resourceCloseReady: (e, t) => c("resource_close_ready", {
		token: e,
		success: t
	}),
	tabDrop: (e, t, n) => c("tab_drop", {
		id: e,
		x: t,
		y: n
	}),
	dividerGrab: (e, t) => c("divider_grab", {
		x: e,
		y: t
	}),
	dividerDrag: (e, t) => c("divider_drag", {
		x: e,
		y: t
	}),
	dividerRelease: (e, t) => c("divider_release", {
		x: e,
		y: t
	}),
	swipeRegion: (e) => c("swipe_region", { region: e })
};
m("blocker-status-changed"), m("browser-credential-capability-changed"), m("downloads-changed"), m("extension-action-failed"), m("extension-action-shortcut"), m("extension-actions-changed"), m("favicons-changed"), m("find-changed"), m("focus-changed"), m("items-changed"), m("layout-changed"), m("media-player-changed"), m("note-open-requested"), m("notes-changed"), m("operation-processed"), m("page-permission-prompt-changed"), m("resource-changed"), m("runtime-status-changed"), m("search-changed"), m("tab-changed"), m("ui-command"), m("web-extension-access-requested"), m("web-extension-store-clicked"), m("work-changed"), m("work-environment-changed"), m("zephium:account-changed"), m("zephium:import-progress"), m("zephium:keymap-changed"), m("zephium:page-assist-changed"), m("zephium:swipe"), m("zephium:voice-changed"), m("zephium:voice-levels"), m("zephium:work-decision-preference-changed"), m("zephium:work-human-changed"), m("zephium:work-models-changed");
async function p(e) {
	try {
		return {
			status: "ok",
			data: await e
		};
	} catch (e) {
		if (e instanceof Error) throw e;
		return {
			status: "error",
			error: e
		};
	}
}
function m(e, t, n) {
	let r = (e) => (t) => e({
		...t,
		payload: n ? n(t.payload) : t.payload
	}), i = (e) => t ? t(e) : e;
	return Object.assign((t) => ({
		listen: (n) => t.listen(e, r(n)),
		once: (n) => t.once(e, r(n)),
		emit: ((n) => t.emit(e, i(n)))
	}), {
		listen: (t) => l(e, r(t)),
		once: (t) => u(e, r(t)),
		emit: ((t) => d(e, i(t)))
	});
}
export { t as a, s as i, o as n, c as r, f as t };

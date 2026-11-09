// src/native/core.ts
var e = {
	favicon_probe: !0,
	work_release_memory: !0,
	keymap_entries: []
}, t = /* @__PURE__ */ new Set(), n = () => [...t];
async function r(n) {
	if (n in e) return e[n];
	throw t.add(n), Error(`"${n}" is not available in AEGIS Research.`);
}
// src/native/event.ts
var i = async () => () => {}, a = async () => () => {}, o = async () => {}, s = {
	workCall: (e, t) => r("work_call", {
		expectedProfile: e,
		call: t
	}),
	workSaveCalendar: (e, t) => r("work_save_calendar", {
		name: e,
		text: t
	}),
	workEditDraft: (e, t, n, i, a, o, s) => r("work_edit_draft", {
		expectedProfile: e,
		work: t,
		expectedRevision: n,
		command: i,
		execution: a,
		artifact: o,
		body: s
	}),
	workOperation: (e, t, n) => r("work_operation", {
		expectedProfile: e,
		operation: t,
		input: n
	}),
	workOperationStatus: (e, t, n, i) => r("work_operation_status", {
		expectedProfile: e,
		work: t,
		operation: n,
		acknowledge: i
	}),
	workRunning: () => r("work_running"),
	workContextPreview: (e, t, n) => r("work_context_preview", {
		expectedProfile: e,
		purpose: t,
		selection: n
	}),
	mediaImport: (e) => c(r("media_import", { expectedProfile: e })),
	mediaOpen: (e, t) => c(r("media_open", {
		expectedProfile: e,
		id: t
	})),
	mediaAdmitRemote: (e, t, n, i) => c(r("media_admit_remote", {
		expectedProfile: e,
		environment: t,
		element: n,
		url: i
	})),
	linkDescribe: (e, t, n) => c(r("link_describe", {
		expectedProfile: e,
		environment: t,
		element: n
	})),
	workAdmitFolder: (e, t) => c(r("work_admit_folder", {
		expectedProfile: e,
		path: t
	})),
	workPickFolder: (e) => c(r("work_pick_folder", { expectedProfile: e })),
	workRevealPath: (e, t) => c(r("work_reveal_path", {
		expectedProfile: e,
		path: t
	})),
	workReleaseMemory: (e) => r("work_release_memory", { idle: e }),
	workChooseFolder: (e, t) => c(r("work_choose_folder", {
		expectedProfile: e,
		start: t
	})),
	workActivity: (e, t) => r("work_activity", {
		expectedProfile: e,
		work: t
	}),
	workHumanPages: (e, t) => r("work_human_pages", {
		expectedProfile: e,
		work: t
	}),
	workHumanPresent: (e, t, n, i) => r("work_human_present", {
		expectedProfile: e,
		work: t,
		page: n,
		region: i
	}),
	workHumanContinue: (e, t, n, i) => r("work_human_continue", {
		expectedProfile: e,
		work: t,
		page: n,
		account: i
	}),
	workHumanRelease: (e, t, n) => r("work_human_release", {
		expectedProfile: e,
		work: t,
		page: n
	}),
	workHumanExtend: (e, t, n) => r("work_human_extend", {
		expectedProfile: e,
		work: t,
		page: n
	}),
	workHumanCheck: (e, t, n) => r("work_human_check", {
		expectedProfile: e,
		work: t,
		page: n
	}),
	workDecisionPreference: (e) => r("work_decision_preference", { expectedProfile: e }),
	workSetDecisionPreference: (e, t) => r("work_set_decision_preference", {
		expectedProfile: e,
		choice: t
	}),
	workSetDecisionKey: (e, t) => r("work_set_decision_key", {
		expectedProfile: e,
		secret: t
	}),
	workClearDecisionKey: (e) => r("work_clear_decision_key", { expectedProfile: e }),
	workModels: (e) => r("work_models", { expectedProfile: e }),
	workModelsReady: (e) => r("work_models_ready", { expectedProfile: e }),
	workChooseModel: (e, t, n) => r("work_choose_model", {
		expectedProfile: e,
		role: t,
		id: n
	}),
	workSetModelEffort: (e, t) => r("work_set_model_effort", {
		expectedProfile: e,
		effort: t
	}),
	workSetProviderKey: (e, t, n) => r("work_set_provider_key", {
		expectedProfile: e,
		provider: t,
		key: n
	}),
	workTestProviderKey: (e, t) => r("work_test_provider_key", {
		expectedProfile: e,
		provider: t
	}),
	workClearProviderKey: (e, t) => r("work_clear_provider_key", {
		expectedProfile: e,
		provider: t
	}),
	workSetModelEndpoint: (e, t) => r("work_set_model_endpoint", {
		expectedProfile: e,
		base: t
	}),
	workMoreModels: (e, t) => r("work_more_models", {
		expectedProfile: e,
		provider: t
	}),
	workLocalServers: () => r("work_local_servers"),
	voiceStatus: () => r("voice_status"),
	voiceChooseEngine: (e) => r("voice_choose_engine", { engine: e }),
	voiceChooseLanguage: (e) => r("voice_choose_language", { language: e }),
	voiceStart: () => r("voice_start"),
	voiceStop: (e) => r("voice_stop", { take: e }),
	voiceCancel: () => r("voice_cancel"),
	voiceOpenPrivacy: (e) => r("voice_open_privacy", { kind: e }),
	pageAssistStatus: (e, t) => r("page_assist_status", {
		space: e,
		tab: t
	}),
	pageAssistAsk: (e) => r("page_assist_ask", { request: e }),
	pageAssistStop: (e) => r("page_assist_stop", { space: e }),
	pageAssistCite: (e, t, n) => r("page_assist_cite", {
		conversation: e,
		reply: t,
		n
	}),
	pageAssistFocus: (e, t, n, i) => r("page_assist_focus", {
		conversation: e,
		reply: t,
		block: n,
		n: i
	}),
	pageAssistDecide: (e, t, n, i) => r("page_assist_decide", {
		conversation: e,
		reply: t,
		block: n,
		decision: i
	}),
	pageAssistResume: (e, t) => r("page_assist_resume", {
		conversation: e,
		reply: t
	}),
	pageAssistContinue: (e, t, n) => r("page_assist_continue", {
		conversation: e,
		reply: t,
		block: n
	}),
	pageAssistNew: (e) => r("page_assist_new", { space: e }),
	pageAssistHistory: (e) => r("page_assist_history", { space: e }),
	pageAssistOpen: (e, t) => r("page_assist_open", {
		space: e,
		conversation: t
	}),
	pageAssistDelete: (e, t) => r("page_assist_delete", {
		space: e,
		conversation: t
	}),
	pageAssistPick: (e, t) => r("page_assist_pick", {
		space: e,
		tab: t
	}),
	pageAssistPickCancel: (e) => r("page_assist_pick_cancel", { tab: e }),
	pageAssistDetach: (e, t) => r("page_assist_detach", {
		tab: e,
		pick: t
	}),
	pageAssistClose: (e) => r("page_assist_close", { space: e }),
	pageStyles: (e) => r("page_styles", { tab: e }),
	pageStyleToggle: (e, t, n) => r("page_style_toggle", {
		tab: e,
		style: t,
		enabled: n
	}),
	pageStyleRemove: (e, t) => r("page_style_remove", {
		tab: e,
		style: t
	}),
	pageStylesAll: (e) => r("page_styles_all", { profile: e }),
	pageStyleToggleFor: (e, t, n, i) => r("page_style_toggle_for", {
		profile: e,
		site: t,
		style: n,
		enabled: i
	}),
	pageStyleRemoveFor: (e, t, n) => r("page_style_remove_for", {
		profile: e,
		site: t,
		style: n
	}),
	accountGet: () => r("account_get"),
	accountSendCode: (e) => r("account_send_code", { email: e }),
	accountVerify: (e) => r("account_verify", { code: e }),
	accountCancelCode: () => r("account_cancel_code"),
	accountSignOut: () => r("account_sign_out"),
	accountRefresh: () => r("account_refresh"),
	accountBuy: (e) => r("account_buy", { purchase: e }),
	accountManage: () => r("account_manage"),
	accountSetDailyLimit: (e) => r("account_set_daily_limit", { limit: e }),
	accountPlanPreview: (e, t) => r("account_plan_preview", {
		plan: e,
		interval: t
	}),
	accountPlanConfirm: () => r("account_plan_confirm"),
	accountPlanDismiss: () => r("account_plan_dismiss"),
	accountSessions: () => r("account_sessions"),
	accountRevokeSession: (e) => r("account_revoke_session", { id: e }),
	accountSetServer: (e) => r("account_set_server", { server: e }),
	accountDeletionCode: () => r("account_deletion_code"),
	accountDelete: (e) => r("account_delete", { code: e }),
	accountSetName: (e) => r("account_set_name", { name: e }),
	accountReauthCode: () => r("account_reauth_code"),
	accountEmailCode: (e) => r("account_email_code", { email: e }),
	accountChangeEmail: (e, t) => r("account_change_email", {
		email: e,
		code: t
	}),
	accountSignOutEverywhere: () => r("account_sign_out_everywhere"),
	accountExport: () => r("account_export"),
	accountUsageHistory: (e) => r("account_usage_history", { cursor: e }),
	accountReceipt: (e) => r("account_receipt", { id: e }),
	accountAvatarPick: () => c(r("account_avatar_pick")),
	accountAvatarSave: (e, t) => r("account_avatar_save", {
		token: e,
		crop: t
	}),
	accountAvatarDiscard: (e) => r("account_avatar_discard", { token: e }),
	accountAvatarRemove: () => r("account_avatar_remove"),
	workSites: (e) => r("work_sites", { expectedProfile: e }),
	workSetSite: (e, t) => r("work_set_site", {
		expectedProfile: e,
		change: t
	}),
	workScreenshotSites: (e) => r("work_screenshot_sites", { expectedProfile: e }),
	workSetScreenshotSite: (e, t) => r("work_set_screenshot_site", {
		expectedProfile: e,
		change: t
	}),
	workClearWebsiteData: (e) => r("work_clear_website_data", { expectedProfile: e }),
	workConnections: (e) => r("work_connections", { expectedProfile: e }),
	workSaveConnection: (e, t) => r("work_save_connection", {
		expectedProfile: e,
		draft: t
	}),
	workPreviewConnection: (e, t) => r("work_preview_connection", {
		expectedProfile: e,
		draft: t
	}),
	workRemoveConnection: (e, t) => r("work_remove_connection", {
		expectedProfile: e,
		id: t
	}),
	workCheckConnection: (e, t) => r("work_check_connection", {
		expectedProfile: e,
		id: t
	}),
	workSignInConnection: (e, t) => r("work_sign_in_connection", {
		expectedProfile: e,
		id: t
	}),
	workCancelConnectionSignIn: (e, t, n) => r("work_cancel_connection_sign_in", {
		expectedProfile: e,
		id: t,
		requestId: n
	}),
	workMemories: (e, t) => r("work_memories", {
		expectedProfile: e,
		query: t
	}),
	workChangeMemory: (e, t, n) => r("work_change_memory", {
		expectedProfile: e,
		query: t,
		change: n
	}),
	workSkills: (e) => r("work_skills", { expectedProfile: e }),
	workSkillText: (e, t) => r("work_skill_text", {
		expectedProfile: e,
		name: t
	}),
	workChangeSkill: (e, t) => r("work_change_skill", {
		expectedProfile: e,
		change: t
	}),
	tabsBootstrap: () => r("tabs_bootstrap"),
	tabsOpen: () => r("tabs_open"),
	tabsActivate: (e) => r("tabs_activate", { id: e }),
	tabsClose: (e) => r("tabs_close", { id: e }),
	tabsSetEssential: (e, t, n) => r("tabs_set_essential", {
		id: e,
		essential: t,
		before: n
	}),
	essentialsKeep: (e) => r("essentials_keep", { site: e }),
	essentialsRelease: (e) => r("essentials_release", { site: e }),
	profileRename: (e) => r("profile_rename", { name: e }),
	onboardingPlayIntro: () => r("onboarding_play_intro"),
	onboardingFinish: () => r("onboarding_finish"),
	tabsNavigate: (e, t) => r("tabs_navigate", {
		id: e,
		input: t
	}),
	tabsReload: (e) => r("tabs_reload", { id: e }),
	tabsAnswerPageRequest: (e, t) => r("tabs_answer_page_request", {
		id: e,
		answer: t
	}),
	tabsAnswerSignIn: (e, t, n) => r("tabs_answer_sign_in", {
		id: e,
		request: t,
		credentials: n
	}),
	tabsContinuePastCertificate: (e) => r("tabs_continue_past_certificate", { id: e }),
	diagnosticsShowLogs: () => r("diagnostics_show_logs"),
	diagnosticsReport: () => r("diagnostics_report"),
	tabsBack: (e) => r("tabs_back", { id: e }),
	tabsForward: (e) => r("tabs_forward", { id: e }),
	workPaneShow: (e, t) => r("work_pane_show", {
		target: e,
		rect: t
	}),
	workPaneSetRect: (e, t) => r("work_pane_set_rect", {
		rect: e,
		generation: t
	}),
	workPaneHide: () => r("work_pane_hide"),
	tabsSplit: (e) => r("tabs_split", { other: e }),
	tabsUnsplit: () => r("tabs_unsplit"),
	tabsLeaveSplit: (e) => r("tabs_leave_split", { id: e }),
	chromeMenuPopup: (e, t, n, i) => r("chrome_menu_popup", {
		x: e,
		y: t,
		page: n,
		canSplit: i
	}),
	extensionActionInvoke: (e, t, n, i, a, o, s, c) => r("extension_action_invoke", {
		profileId: e,
		installId: t,
		runtimeGeneration: n,
		actionRevision: i,
		anchorX: a,
		anchorY: o,
		anchorWidth: s,
		anchorHeight: c
	}),
	extensionActionMenu: (e, t, n, i, a, o, s, c) => r("extension_action_menu", {
		profileId: e,
		installId: t,
		runtimeGeneration: n,
		actionRevision: i,
		anchorX: a,
		anchorY: o,
		anchorWidth: s,
		anchorHeight: c
	}),
	webExtensionPrepare: (e) => c(r("web_extension_prepare", { tabId: e })),
	webExtensionStoreButton: (e, t, n, i) => r("web_extension_store_button", {
		tabId: e,
		extensionId: t,
		state: n,
		label: i
	}),
	webExtensionConfirm: (e, t) => c(r("web_extension_confirm", {
		id: e,
		reviewId: t
	})),
	webExtensionCancel: (e) => r("web_extension_cancel", { reviewId: e }),
	webExtensionList: () => c(r("web_extension_list")),
	webExtensionSetEnabled: (e, t) => c(r("web_extension_set_enabled", {
		id: e,
		enabled: t
	})),
	webExtensionSetPinned: (e, t) => c(r("web_extension_set_pinned", {
		id: e,
		pinned: t
	})),
	webExtensionRetry: (e, t) => c(r("web_extension_retry", {
		profileId: e,
		installId: t
	})),
	webExtensionUninstall: (e) => c(r("web_extension_uninstall", { id: e })),
	webExtensionAnswerAccess: (e, t) => c(r("web_extension_answer_access", {
		request: e,
		allowed: t
	})),
	webExtensionSetAccess: (e, t, n) => c(r("web_extension_set_access", {
		id: e,
		mode: t,
		sites: n
	})),
	webExtensionOpenOptions: (e) => c(r("web_extension_open_options", { id: e })),
	webExtensionChooseFile: (e) => c(r("web_extension_choose_file", { folder: e })),
	webExtensionPrepareFile: (e) => c(r("web_extension_prepare_file", { path: e })),
	webExtensionReviewUpdate: (e) => c(r("web_extension_review_update", { id: e })),
	browserCredentialCapability: () => r("browser_credential_capability"),
	browserPasskeyAuthorizationRequest: () => r("browser_passkey_authorization_request"),
	pagePermissionRespond: (e, t, n, i) => r("page_permission_respond", {
		profileId: e,
		itemId: t,
		requestId: n,
		decision: i
	}),
	pagePermissionCardHost: (e) => r("page_permission_card_host", { available: e }),
	tabSetMuted: (e, t) => r("tab_set_muted", {
		id: e,
		muted: t
	}),
	mediaPlayer: (e, t) => r("media_player", {
		id: e,
		action: t
	}),
	sitePermissions: (e) => c(r("site_permissions", { origin: e })),
	sitePermissionSet: (e, t, n) => r("site_permission_set", {
		origin: e,
		kind: t,
		decision: n
	}),
	blockerStatus: () => c(r("blocker_status")),
	blockerStats: (e) => c(r("blocker_stats", { profile: e })),
	blockerSetEnabled: (e) => r("blocker_set_enabled", { enabled: e }),
	blockerSiteChange: (e, t) => r("blocker_site_change", {
		context: e,
		action: t
	}),
	blockerPicker: (e, t) => c(r("blocker_picker", {
		context: e,
		action: t
	})),
	blockerRetry: (e) => r("blocker_retry", { failedGeneration: e }),
	blockerRefreshSources: () => r("blocker_refresh_sources"),
	profilesDelete: (e) => r("profiles_delete", { profile: e }),
	profilesGet: () => c(r("profiles_get")),
	profilesCreate: (e, t, n) => r("profiles_create", {
		name: e,
		avatar: t,
		andSwitch: n
	}),
	profilesSwitch: (e) => r("profiles_switch", { profile: e }),
	profilesRename: (e, t) => r("profiles_rename", {
		profile: e,
		name: t
	}),
	profilesSetAvatar: (e, t) => r("profiles_set_avatar", {
		profile: e,
		avatar: t
	}),
	profileAvatarPick: () => c(r("profile_avatar_pick")),
	spacesCreate: (e, t) => r("spaces_create", {
		name: e,
		look: t
	}),
	spacesUpdate: (e, t, n) => r("spaces_update", {
		space: e,
		name: t,
		look: n
	}),
	spacesDelete: (e) => r("spaces_delete", { space: e }),
	spacesReorder: (e, t) => r("spaces_reorder", {
		space: e,
		before: t
	}),
	spacesSwitch: (e) => r("spaces_switch", { space: e }),
	spacesStep: (e) => r("spaces_step", { step: e }),
	spacesMoveTab: (e, t) => r("spaces_move_tab", {
		tab: e,
		space: t
	}),
	spacesMenuPopup: (e, t) => r("spaces_menu_popup", {
		x: e,
		y: t
	}),
	operationStatus: (e) => r("operation_status", { operationId: e }),
	operationsReconcile: () => r("operations_reconcile"),
	operationAcknowledge: (e) => r("operation_acknowledge", { operationId: e }),
	runCommand: (e) => r("run_command", { id: e }),
	panelHide: () => r("panel_hide"),
	panelReady: () => r("panel_ready"),
	panelIntent: (e) => r("panel_intent", { intent: e }),
	panelLayout: (e) => r("panel_layout", { layout: e }),
	launcherEdit: (e, t) => r("launcher_edit", {
		tabId: e,
		url: t
	}),
	launcherTrigger: () => r("launcher_trigger"),
	launcherSetShortcut: (e) => r("launcher_set_shortcut", { accelerator: e }),
	launcherRecordShortcut: (e) => r("launcher_record_shortcut", { active: e }),
	launcherSetDoubleTap: (e) => r("launcher_set_double_tap", { mode: e }),
	launcherOpenAccessibility: () => r("launcher_open_accessibility"),
	settingGet: (e) => r("setting_get", { key: e }),
	settingSet: (e, t) => r("setting_set", {
		key: e,
		value: t
	}),
	windowsDiagnosticsSettings: () => r("windows_diagnostics_settings"),
	windowsReputationManaged: () => r("windows_reputation_managed"),
	uiInfo: () => r("ui_info"),
	uiReady: () => r("ui_ready"),
	menuPopup: (e, t) => r("menu_popup", {
		x: e,
		y: t
	}),
	addMenuPopup: (e, t, n) => r("add_menu_popup", {
		x: e,
		y: t,
		canSplit: n
	}),
	tabMenuPopup: (e, t, n, i) => r("tab_menu_popup", {
		id: e,
		x: t,
		y: n,
		context: i
	}),
	bookmarkMenuPopup: (e, t, n) => r("bookmark_menu_popup", {
		x: e,
		y: t,
		folder: n
	}),
	profileMenuPopup: (e, t) => r("profile_menu_popup", {
		x: e,
		y: t
	}),
	sidebarMenuPopup: (e, t, n, i, a, o, s) => r("sidebar_menu_popup", {
		x: e,
		y: t,
		siteProtected: n,
		canHide: i,
		canClearData: a,
		extensions: o,
		manageExtensions: s
	}),
	toolsMenuPopup: (e, t) => r("tools_menu_popup", {
		x: e,
		y: t
	}),
	newtabSearchContext: (e) => r("newtab_search_context", { tabId: e }),
	newtabSearch: (e, t) => r("newtab_search", {
		query: e,
		context: t
	}),
	newtabRun: (e, t) => r("newtab_run", {
		action: e,
		context: t
	}),
	newtabCancel: (e) => r("newtab_cancel", { context: e }),
	launcherSearch: (e, t) => r("launcher_search", {
		query: e,
		requestId: t
	}),
	launcherRun: (e, t, n) => r("launcher_run", {
		action: e,
		context: t,
		background: n
	}),
	sidebarSetWidth: (e, t, n) => r("sidebar_set_width", {
		width: e,
		animate: t,
		revision: n
	}),
	sidebarSetHidden: (e) => r("sidebar_set_hidden", { hidden: e }),
	sidebarPeek: (e, t, n) => r("sidebar_peek", {
		peek: e,
		lights: t,
		slide: n
	}),
	sidebarResize: (e, t, n) => r("sidebar_resize", {
		width: e,
		enabled: t,
		revision: n
	}),
	sidebarResizeGuide: (e) => r("sidebar_resize_guide", { width: e }),
	tabDragOver: (e, t) => r("tab_drag_over", {
		x: e,
		y: t
	}),
	resourceCall: (e, t) => r("resource_call", {
		expectedProfile: e,
		call: t
	}),
	noteCall: (e, t) => r("note_call", {
		expectedProfile: e,
		call: t
	}),
	historyCall: (e, t) => r("history_call", {
		expectedProfile: e,
		call: t
	}),
	browsingDataCall: (e, t) => r("browsing_data_call", {
		expectedProfile: e,
		call: t
	}),
	faviconProbe: (e, t) => r("favicon_probe", {
		expectedProfile: e,
		origins: t
	}),
	downloadCall: (e, t) => r("download_call", {
		expectedProfile: e,
		call: t
	}),
	downloadOpenAccessSettings: () => r("download_open_access_settings"),
	aboutInfo: () => r("about_info"),
	systemClock24h: () => r("system_clock_24h"),
	updateStatus: () => r("update_status"),
	updateCheck: () => r("update_check"),
	updateRelaunch: () => r("update_relaunch"),
	updateHighlights: () => r("update_highlights"),
	openSoftwareUpdate: () => r("open_software_update"),
	browserOpenUrl: (e, t) => r("browser_open_url", {
		url: e,
		newTab: t
	}),
	keymapEntries: () => r("keymap_entries"),
	keymapBind: (e, t, n) => r("keymap_bind", {
		id: e,
		accelerator: t,
		replace: n
	}),
	keymapReset: (e) => r("keymap_reset", { id: e }),
	keymapRecord: (e) => r("keymap_record", { active: e }),
	defaultBrowserStatus: () => r("default_browser_status"),
	defaultBrowserRequest: () => r("default_browser_request"),
	loginItemStatus: () => r("login_item_status"),
	loginItemSet: (e) => r("login_item_set", { enabled: e }),
	loginItemOpenSettings: () => r("login_item_open_settings"),
	haptic: (e) => r("haptic", { kind: e }),
	bookmarkCall: (e, t) => r("bookmark_call", {
		expectedProfile: e,
		call: t
	}),
	timeCall: (e, t) => r("time_call", {
		expectedProfile: e,
		call: t
	}),
	zoomCall: (e, t) => r("zoom_call", {
		expectedProfile: e,
		call: t
	}),
	focusControl: (e) => r("focus_control", { control: e }),
	pageFind: (e, t) => r("page_find", {
		query: e,
		forward: t
	}),
	importSources: () => r("import_sources"),
	importStart: (e, t, n) => r("import_start", {
		source: e,
		profile: t,
		kinds: n
	}),
	importCancel: () => r("import_cancel"),
	importOpenPermission: (e) => r("import_open_permission", { source: e }),
	exportBrowserData: (e) => r("export_browser_data", { kind: e }),
	historyMenuPopup: (e, t, n, i) => r("history_menu_popup", {
		id: e,
		forward: t,
		x: n,
		y: i
	}),
	pageSource: (e) => r("page_source", { id: e }),
	resourceCloseReady: (e, t) => r("resource_close_ready", {
		token: e,
		success: t
	}),
	tabDrop: (e, t, n) => r("tab_drop", {
		id: e,
		x: t,
		y: n
	}),
	dividerGrab: (e, t) => r("divider_grab", {
		x: e,
		y: t
	}),
	dividerDrag: (e, t) => r("divider_drag", {
		x: e,
		y: t
	}),
	dividerRelease: (e, t) => r("divider_release", {
		x: e,
		y: t
	}),
	swipeRegion: (e) => r("swipe_region", { region: e })
};
l("blocker-status-changed"), l("browser-credential-capability-changed"), l("downloads-changed"), l("extension-action-failed"), l("extension-action-shortcut"), l("extension-actions-changed"), l("favicons-changed"), l("find-changed"), l("focus-changed"), l("items-changed"), l("layout-changed"), l("media-player-changed"), l("note-open-requested"), l("notes-changed"), l("operation-processed"), l("page-permission-prompt-changed"), l("resource-changed"), l("runtime-status-changed"), l("search-changed"), l("tab-changed"), l("ui-command"), l("web-extension-access-requested"), l("web-extension-store-clicked"), l("work-changed"), l("work-environment-changed"), l("zephium:account-changed"), l("zephium:import-progress"), l("zephium:keymap-changed"), l("zephium:page-assist-changed"), l("zephium:swipe"), l("zephium:voice-changed"), l("zephium:voice-levels"), l("zephium:work-decision-preference-changed"), l("zephium:work-human-changed"), l("zephium:work-models-changed");
async function c(e) {
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
function l(e, t, n) {
	let r = (e) => (t) => e({
		...t,
		payload: n ? n(t.payload) : t.payload
	}), s = (e) => t ? t(e) : e;
	return Object.assign((t) => ({
		listen: (n) => t.listen(e, r(n)),
		once: (n) => t.once(e, r(n)),
		emit: ((n) => t.emit(e, s(n)))
	}), {
		listen: (t) => i(e, r(t)),
		once: (t) => a(e, r(t)),
		emit: ((t) => o(e, s(t)))
	});
}
export { n, s as t };

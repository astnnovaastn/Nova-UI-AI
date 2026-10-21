import { mountSoundSettings, showNotificationHistory } from "./notifications";
import {initVoiceEnrollment} from './voiceEnrollment';
import {conversationSnapshot} from './conversation';
/**
 * AEGIS — Settings Panel
 *
 * Overlay panel for API keys, connection status, preferences, and system info.
 * Slides in from the right with glass-morphism styling.
 */

import { orbThemes, type OrbTheme } from "./orb-themes";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StatusResponse {
  research_writer?: ResearchWriterStatus | null;
  aegis_ai_connected: boolean;
  models?:Record<string,{preferred:string;effective:string|null;verified:boolean;fallback_reason:string|null}>;
  google_calendar_accessible: boolean;
  google_mail_accessible: boolean;
  memory_count: number;
  task_count: number;
  server_port: number;
  uptime_seconds: number;
  env_keys_set: {
    gemini: boolean;
    openai_research?: boolean;
    groq: boolean;
    elevenlabs: boolean;
    elevenlabs_voice_id: boolean;
    quick_search?: boolean;
    deep_research?: boolean;
  };
  timestamp: string;
}

type ResearchProvider = "gemini" | "openai";
interface ResearchWriterStatus {
  provider: ResearchProvider | "none";
  switching: boolean;
  voice_model: string;
  providers: Array<{id: ResearchProvider; configured: boolean; active: boolean; model: string; effective_model: string;
    requests_used: number; request_limit: number; tokens_used: number; token_limit: number; local_limit_reached: boolean}>;
}

interface PreferencesResponse {
  user_name: string;
  honorific: string;
  calendar_accounts: string;
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

const ORB_THEME_KEY = "aegisai_orb_theme";
let panelEl: HTMLElement | null = null;
let isOpen = false;
let isFirstTimeSetup = false;
let setupStep = 0; // 0=groq, 1=fish, 2=name, 3=done
let orbThemeChangeHandler: ((themeName: string) => void) | null = null;
let researchWriterStatus: ResearchWriterStatus | null = null;
let selectedResearchProvider: ResearchProvider | null = null;
let changingResearchProvider = false;

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

async function apiGet<T>(url: string): Promise<T> {
  const res = await fetch(url, {headers: {"X-Nova-Client": conversationSnapshot().clientId || ""}});
  const data = await res.json().catch(() => ({ error: 'Backend unavailable. Start Nova with start_nova_ai.ps1.' }));
  if (!res.ok) throw new Error(data.error || data.detail || `Settings request failed (${res.status}).`);
  return data;
}

async function apiPost<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Nova-Client": conversationSnapshot().clientId || "" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({ error: 'Backend unavailable. Start Nova with start_nova_ai.ps1.' }));
  if (!res.ok) throw new Error(data.error || data.detail || `Settings request failed (${res.status}).`);
  return data;
}

// ---------------------------------------------------------------------------
// Panel HTML
// ---------------------------------------------------------------------------

function buildPanelHTML(): string {
  return `
    <div class="settings-backdrop" id="settings-backdrop"></div>
    <div class="settings-panel" id="settings-panel-inner">
      <div class="settings-header">
        <h2>Settings</h2>
        <button class="settings-close" id="settings-close">&times;</button>
      </div>

      <div class="settings-welcome" id="settings-welcome" style="display:none">
        <p>Welcome to AEGIS. Let's get you set up.</p>
      </div>

      <div class="settings-body">

        <section class="settings-section" id="section-research-provider" aria-labelledby="research-provider-heading">
          <h3 id="research-provider-heading">Research writer</h3>
          <p id="research-provider-active" role="status">Checking the active research writer…</p>
          <div class="research-provider-choices" role="group" aria-label="Choose a research writer">
            <button type="button" class="research-provider-choice" data-research-provider="gemini" aria-pressed="false"><strong>Gemini</strong><small>Default</small><span id="research-provider-gemini-state">Checking key…</span></button>
            <button type="button" class="research-provider-choice" data-research-provider="openai" aria-pressed="false"><strong>OpenAI</strong><small>Research</small><span id="research-provider-openai-state">Checking key…</span></button>
          </div>
          <div class="settings-field">
            <label for="input-research-model">Research model</label>
            <input type="text" id="input-research-model" autocomplete="off" spellcheck="false" list="research-model-suggestions" />
            <datalist id="research-model-suggestions"></datalist>
          </div>
          <p id="research-provider-usage"></p>
          <p id="research-provider-budget-warning" role="status"></p>
          <div class="settings-actions research-provider-actions">
            <button type="button" class="settings-btn primary" id="btn-activate-research-provider" disabled>Activate writer</button>
            <button type="button" class="settings-btn" id="btn-deactivate-research-provider" disabled>Deactivate writing</button>
          </div>
          <p id="research-provider-result" role="status" aria-live="polite"></p>
          <p id="research-live-provider-note">Chat and voice continue using Gemini Live. Switching writers preserves your research, drafts, and usage counters.</p>
        </section>

        <!-- API Keys -->
        <section class="settings-section" id="section-api-keys">
          <h3>API Keys</h3>
          <div class="settings-field">
            <label for="input-gemini-key">Gemini API Key (voice and AI)</label>
            <div class="settings-input-row">
              <input type="password" id="input-gemini-key" placeholder="Google AI Studio API key" autocomplete="off" />
              <span class="status-dot" id="status-gemini"></span>
            </div>
            <p id="gemini-key-status">Save your key to enable Gemini conversations.</p>
          </div>

          <div class="settings-field">
            <label for="input-openai-research-key">OpenAI API Key (research only)</label>
            <div class="settings-input-row"><input type="password" id="input-openai-research-key" placeholder="Saved keys are never displayed" autocomplete="off" /><span class="status-dot" id="status-openai-research"></span></div>
            <p>Saving a key does not activate its provider. Choose the research writer above.</p>
          </div>

          <div class="settings-field">
            <label>Groq API Key</label>
            <div class="settings-input-row">
              <input type="password" id="input-groq-key" placeholder="gsk-..." />
              <button class="settings-btn" id="btn-test-groq">Test</button>
              <span class="status-dot" id="status-groq"></span>
            </div>
          </div>

          <div class="settings-field">
            <label>ElevenLabs API Key</label>
            <div class="settings-input-row">
              <input type="password" id="input-fish-key" placeholder="sk_..." />
              <button class="settings-btn" id="btn-test-fish">Test</button>
              <span class="status-dot" id="status-fish"></span>
            </div>
          </div>

          <div class="settings-field">
            <label>ElevenLabs Voice ID</label>
            <div class="settings-input-row">
              <input type="text" id="input-fish-voice-id" placeholder="e.g., MuWZEhlucXEKPv3WaubS" />
              <button class="settings-btn" id="btn-save-voice-id">Save</button>
            </div>
          </div>

          <div class="settings-field">
            <label for="input-quick-search-key">Quick Search · SerpAPI</label>
            <div class="settings-input-row"><input type="password" id="input-quick-search-key" autocomplete="off" placeholder="Conversation search key" /><span class="status-dot" id="status-quick-search"></span></div>
            <p>Fills missing or current information in conversations.</p>
          </div>
          <div class="settings-field">
            <label for="input-deep-research-key">Deep Research · Tavily</label>
            <div class="settings-input-row"><input type="password" id="input-deep-research-key" autocomplete="off" placeholder="Detailed research key" /><span class="status-dot" id="status-deep-research"></span></div>
            <p>Used for extensive investigations. Conversation searches never use this key.</p>
          </div>
          <div class="settings-actions">
            <button class="settings-btn primary" id="btn-save-keys">Save Keys</button>
          </div>
          <p id="keys-save-result" role="status" aria-live="polite"></p>
        </section>

        <!-- Connection Status -->
        <section class="settings-section" id="section-status">
          <h3>Connection Status</h3>
          <div class="settings-model-status" id="settings-model-status"></div>
          <div class="status-grid">
            <div class="status-row"><span class="status-dot" id="status-claude-cli"></span><span>Aegis AI</span></div>
            <div class="status-row"><span class="status-dot" id="status-calendar"></span><span>Google Calendar</span></div>
            <div class="status-row"><span class="status-dot" id="status-mail"></span><span>Google Mail</span></div>
            <div class="status-row"><span class="status-dot" id="status-server"></span><span>Server</span><span class="status-detail" id="status-server-detail"></span></div>
          </div>
        </section>

        <!-- User Preferences -->
        <section class="settings-section" id="section-preferences">
          <h3>User Preferences</h3>
          <div class="settings-field settings-sound-controls" id="settings-sound-controls"></div>
          <button class="settings-btn" id="btn-notification-history">Notification history</button>

          <div class="settings-field">
            <label>Your Name</label>
            <input type="text" id="input-user-name" placeholder="Your name" />
          </div>

          <div class="settings-field">
            <label>Honorific</label>
            <select id="input-honorific">
              <option value="sir">Sir</option>
              <option value="ma'am">Ma'am</option>
              <option value="none">None</option>
            </select>
          </div>

          <div class="settings-field">
            <label>Calendar Accounts</label>
            <textarea id="input-calendar-accounts" rows="2" placeholder="auto (or comma-separated emails)"></textarea>
          </div>

          <div class="settings-actions">
            <button class="settings-btn primary" id="btn-save-prefs">Save Preferences</button>
          </div>
        </section>

        <!-- Orb Theme Picker -->
        <section class="settings-section" id="section-orb-themes">
          <h3>Orb Themes</h3>
          <div class="orb-theme-grid" id="orb-theme-grid"></div>
        </section>

        <!-- System Info -->
        <section class="settings-section" id="section-sysinfo">
          <h3>System Info</h3>
          <div class="sysinfo-grid">
            <button type="button" id="btn-memory-workspace" class="sysinfo-row memory-entry-button"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18 M5 6.5c4 3 10 3 14 0 M5 17.5c4-3 10-3 14 0"/></svg><span><strong>Memory</strong><small>Explore your connected memories</small></span><span id="sysinfo-memory">--</span><span aria-hidden="true">›</span></button>
            <div class="sysinfo-row"><span class="sysinfo-label">Tasks</span><span id="sysinfo-tasks">--</span></div>
            <div class="sysinfo-row"><span class="sysinfo-label">Server port</span><span id="sysinfo-port">--</span></div>
            <div class="sysinfo-row"><span class="sysinfo-label">Uptime</span><span id="sysinfo-uptime">--</span></div>
          </div>
        </section>

        <!-- Setup Navigation (first-time only) -->
        <div class="setup-nav" id="setup-nav" style="display:none">
          <button class="settings-btn primary" id="btn-setup-next">Next</button>
        </div>

      </div>
    </div>
  `;
}

// ---------------------------------------------------------------------------
// Panel lifecycle
// ---------------------------------------------------------------------------

function createPanel(): HTMLElement {
  const container = document.createElement("div");
  container.id = "settings-container";
  container.innerHTML = buildPanelHTML();
  document.body.appendChild(container);
  return container;
}

function setDotStatus(id: string, status: "green" | "red" | "yellow" | "off") {
  const dot = document.getElementById(id);
  if (!dot) return;
  dot.className = "status-dot";
  if (status !== "off") dot.classList.add(`status-${status}`);
}

function formatUptime(seconds: number): string {
  if (seconds < 60) return `${Math.floor(seconds)}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

function getSavedOrbTheme(): string {
  return localStorage.getItem(ORB_THEME_KEY) || "default";
}

function setSavedOrbTheme(themeName: string) {
  localStorage.setItem(ORB_THEME_KEY, themeName);
  const grid = document.getElementById("orb-theme-grid");
  if (!grid) return;
  grid.querySelectorAll<HTMLButtonElement>(".orb-theme-card").forEach((button) => {
    button.classList.toggle("active", button.dataset.theme === themeName);
  });
  if (orbThemeChangeHandler) {
    orbThemeChangeHandler(themeName);
  }
}

function renderOrbThemeOptions() {
  const grid = document.getElementById("orb-theme-grid");
  if (!grid) return;
  const selected = getSavedOrbTheme();
  grid.innerHTML = orbThemes
    .map((theme) => `
      <button type="button" class="orb-theme-card ${theme.name === selected ? "active" : ""}" data-theme="${theme.name}">
        <span class="orb-theme-color" style="background:${theme.orbColor}"></span>
        <span class="orb-theme-label">${theme.label}</span>
      </button>
    `)
    .join("");

  grid.querySelectorAll<HTMLButtonElement>(".orb-theme-card").forEach((button) => {
    button.addEventListener("click", () => {
      const themeName = button.dataset.theme;
      if (!themeName) return;
      setSavedOrbTheme(themeName);
    });
  });
}

export function registerOrbThemeChangedHandler(handler: (themeName: string) => void) {
  orbThemeChangeHandler = handler;
}

function researchWriterPresentation(status: ResearchWriterStatus, selected: ResearchProvider, model: string, busy: boolean) {
  const active = status.providers.find(row => row.id === status.provider);
  const choice = status.providers.find(row => row.id === selected);
  const label = selected === "gemini" ? "Gemini" : "OpenAI";
  const same = status.provider === selected && choice?.model === model.trim();
  return {
    active: status.switching ? "Switching research writer…" : active ? `Active: ${active.id === "gemini" ? "Gemini" : "OpenAI"} · ${active.model}${active.effective_model && active.effective_model !== active.model ? ` · last used ${active.effective_model}` : ""}` : "Research writing is deactivated.",
    activateLabel: same ? `${label} is active` : `Activate ${label}`,
    activateDisabled: busy || status.switching || !choice?.configured || !model.trim() || same,
    deactivateDisabled: busy || status.switching || status.provider === "none",
    usage: choice ? `${label} today: ${choice.requests_used.toLocaleString()} / ${choice.request_limit.toLocaleString()} requests · ${choice.tokens_used.toLocaleString()} / ${choice.token_limit.toLocaleString()} tokens.` : "",
    warning: choice?.local_limit_reached ? "This provider’s local daily allowance is used up. Saved research will wait for its next allowance; switching preserves usage." : !choice?.configured ? `Save a ${label} key below before activating it.` : "",
  };
}

function renderResearchWriter(status: ResearchWriterStatus) {
  researchWriterStatus = status;
  const model = document.getElementById("input-research-model") as HTMLInputElement | null;
  if (!model) return;
  if (!selectedResearchProvider) {
    selectedResearchProvider = status.provider === "none" ? "gemini" : status.provider;
    model.value = status.providers.find(row => row.id === selectedResearchProvider)?.model || "";
  }
  const view = researchWriterPresentation(status, selectedResearchProvider, model.value, changingResearchProvider);
  document.getElementById("research-provider-active")!.textContent = view.active;
  document.getElementById("research-provider-usage")!.textContent = view.usage;
  document.getElementById("research-provider-budget-warning")!.textContent = view.warning;
  for (const row of status.providers) {
    document.getElementById(`research-provider-${row.id}-state`)!.textContent = row.active ? "Active" : row.configured ? "Key saved · inactive" : "No key saved";
  }
  document.querySelectorAll<HTMLButtonElement>("[data-research-provider]").forEach(button => {
    button.setAttribute("aria-pressed", String(button.dataset.researchProvider === selectedResearchProvider));
    button.disabled = changingResearchProvider || status.switching;
  });
  const activate = document.getElementById("btn-activate-research-provider") as HTMLButtonElement;
  activate.textContent = view.activateLabel; activate.disabled = view.activateDisabled;
  (document.getElementById("btn-deactivate-research-provider") as HTMLButtonElement).disabled = view.deactivateDisabled;
  model.disabled = changingResearchProvider || status.switching;
  const list = document.getElementById("research-model-suggestions")!;
  const suggestions = selectedResearchProvider === "gemini" ? ["gemini-3.5-flash", "gemini-3.8-flash", "gemini-flash-latest"] : ["gpt-4.1-mini", "gpt-4.1", "gpt-4o-mini"];
  list.replaceChildren(...suggestions.map(value => { const option = document.createElement("option"); option.value = value; return option; }));
  document.getElementById("research-live-provider-note")!.textContent = `Chat and voice stay on Gemini Live · ${status.voice_model}. Inactive research writers receive no new requests. Your reports, drafts, and keys stay saved.`;
}

async function changeResearchWriter(deactivate: boolean) {
  if (changingResearchProvider || !selectedResearchProvider) return;
  const result = document.getElementById("research-provider-result")!;
  changingResearchProvider = true;
  if (researchWriterStatus) renderResearchWriter(researchWriterStatus);
  result.textContent = "Finishing any current write before changing the research writer…";
  try {
    const provider = deactivate ? "none" : selectedResearchProvider;
    const model = (document.getElementById("input-research-model") as HTMLInputElement).value.trim();
    const status = await apiPost<ResearchWriterStatus>("/api/settings/research-provider", {provider, ...(deactivate ? {} : {model})});
    renderResearchWriter(status);
    result.textContent = deactivate ? "Research writing deactivated. Saved work is preserved; Gemini Live continues." : `${provider === "gemini" ? "Gemini" : "OpenAI"} activated for research. Gemini Live chat and voice are unchanged.`;
  } catch (error) {
    result.textContent = error instanceof Error ? error.message : "The research writer could not be changed. Your previous choice is preserved.";
    await loadStatus();
  } finally {
    changingResearchProvider = false;
    if (researchWriterStatus) renderResearchWriter(researchWriterStatus);
  }
}

async function loadStatus() {
  // Always start with red (disconnected)
  setDotStatus("status-server", "red");
  setDotStatus("status-claude-cli", "red");
  setDotStatus("status-calendar", "red");
  setDotStatus("status-mail", "red");
  setDotStatus("status-groq", "red");
  setDotStatus("status-fish", "red");
  try {
    const status = await apiGet<StatusResponse>("/api/settings/status");
    if (status.research_writer) renderResearchWriter(status.research_writer);
    // If we got a response, server is definitely connected
    setDotStatus("status-server", "green");
    // Aegis_AI connection - if server is running and aegis_ai.py is the subprocess
    const aegisAiConnected = status.aegis_ai_connected === true;
    setDotStatus("status-claude-cli", aegisAiConnected ? "green" : "red");
    // Google Calendar - only green if explicitly accessible
    const calendarConnected = status.google_calendar_accessible === true;
    setDotStatus("status-calendar", calendarConnected ? "green" : "red");
    // Google Mail - only green if explicitly accessible
    const mailConnected = status.google_mail_accessible === true;
    setDotStatus("status-mail", mailConnected ? "green" : "red");
    const serverDetail = document.getElementById("status-server-detail");
    if (serverDetail) serverDetail.textContent = `port ${status.server_port} | up ${formatUptime(status.uptime_seconds)}`;
    // API key status dots (in the API Keys section)
    const geminiConfigured = status.env_keys_set?.gemini === true;
    setDotStatus("status-gemini", geminiConfigured ? "green" : "red");
    setDotStatus("status-openai-research", status.env_keys_set?.openai_research ? "green" : "off");
    const geminiStatus = document.getElementById("gemini-key-status");
    if (geminiStatus) geminiStatus.textContent = geminiConfigured ? "Gemini key configured. Start a conversation to check access." : "Save your key to enable Gemini conversations.";
    const groqConnected = status.env_keys_set?.groq === true;
    setDotStatus("status-quick-search", status.env_keys_set?.quick_search ? "green" : "red");
    setDotStatus("status-deep-research", status.env_keys_set?.deep_research ? "green" : "red");
    setDotStatus("status-groq", groqConnected ? "green" : "red");
    const elevenlabsConnected = status.env_keys_set?.elevenlabs === true;
    setDotStatus("status-fish", elevenlabsConnected ? "green" : "red");
    const modelStatus=document.getElementById('settings-model-status');
    if(modelStatus){modelStatus.replaceChildren();for(const [kind,model] of Object.entries(status.models||{})){const row=document.createElement('p');row.textContent=`${kind==='voice'?'Voice':'Text'} · ${model.effective||model.preferred}${model.verified?'':' · access not checked'}${model.fallback_reason?' · '+model.fallback_reason:''}`;modelStatus.append(row);}}
    // System info
    const memEl = document.getElementById("sysinfo-memory");
    if (memEl) memEl.textContent = String(status.memory_count || 0);
    const taskEl = document.getElementById("sysinfo-tasks");
    if (taskEl) taskEl.textContent = String(status.task_count || 0);
    const portEl = document.getElementById("sysinfo-port");
    if (portEl) portEl.textContent = String(status.server_port || 8340);
    const upEl = document.getElementById("sysinfo-uptime");
    if (upEl) upEl.textContent = formatUptime(status.uptime_seconds || 0);
    console.log("[SETTINGS] Status loaded:", {
      server: "green",
      aegis_ai: aegisAiConnected ? "green" : "red",
      calendar: calendarConnected ? "green" : "red",
      mail: mailConnected ? "green" : "red"
    });
    return status;
  } catch (e) {
    console.error("[settings] failed to load status:", e);
    // If we can't reach the server at all, everything stays red
    return null;
  }
}

async function loadPreferences() {
  try {
    const prefs = await apiGet<PreferencesResponse>("/api/settings/preferences");
    const nameEl = document.getElementById("input-user-name") as HTMLInputElement;
    const honEl = document.getElementById("input-honorific") as HTMLSelectElement;
    const calEl = document.getElementById("input-calendar-accounts") as HTMLTextAreaElement;
    if (nameEl) nameEl.value = prefs.user_name || "";
    if (honEl) honEl.value = prefs.honorific || "sir";
    if (calEl) calEl.value = prefs.calendar_accounts || "auto";
  } catch (e) {
    console.error("[settings] failed to load preferences:", e);
  }
}

function wireEvents() {
  document.querySelectorAll<HTMLButtonElement>("[data-research-provider]").forEach(button => {
    button.addEventListener("click", () => {
      selectedResearchProvider = button.dataset.researchProvider as ResearchProvider;
      const model = document.getElementById("input-research-model") as HTMLInputElement;
      model.value = researchWriterStatus?.providers.find(row => row.id === selectedResearchProvider)?.model || (selectedResearchProvider === "gemini" ? "gemini-3.5-flash" : "gpt-4.1-mini");
      if (researchWriterStatus) renderResearchWriter(researchWriterStatus);
    });
  });
  document.getElementById("input-research-model")?.addEventListener("input", () => { if (researchWriterStatus) renderResearchWriter(researchWriterStatus); });
  document.getElementById("btn-activate-research-provider")?.addEventListener("click", () => { void changeResearchWriter(false); });
  document.getElementById("btn-deactivate-research-provider")?.addEventListener("click", () => { void changeResearchWriter(true); });
  const soundHost=document.getElementById("settings-sound-controls");
  if(soundHost) mountSoundSettings(soundHost);
  document.getElementById("btn-notification-history")?.addEventListener("click", showNotificationHistory);
  // Close
  document.getElementById("btn-memory-workspace")?.addEventListener("click", () => { closeSettings(); window.dispatchEvent(new Event("nova-open-memory")); });
  document.getElementById("settings-close")?.addEventListener("click", closeSettings);
  document.getElementById("settings-backdrop")?.addEventListener("click", closeSettings);

  // Save keys
  document.getElementById("btn-save-keys")?.addEventListener("click", async () => {
    const button = document.getElementById("btn-save-keys") as HTMLButtonElement;
    const feedback = document.getElementById("keys-save-result")!;
    button.disabled = true;
    feedback.textContent = "Saving keys…";
    try {
    for (const [id, key] of [["input-quick-search-key", "QUICK_SEARCH_API_KEY"], ["input-deep-research-key", "DEEP_RESEARCH_API_KEY"]]) {
      const input = document.getElementById(id) as HTMLInputElement;
      if (input.value.trim()) { await apiPost("/api/settings/keys", {key_name: key, key_value: input.value.trim()}); input.value = ""; }
    }
    const geminiInput = document.getElementById("input-gemini-key") as HTMLInputElement;
    const openaiInput = document.getElementById("input-openai-research-key") as HTMLInputElement;
    if (openaiInput.value.trim()) {
      await apiPost("/api/settings/keys", {key_name: "NOVA_RESEARCH_OPENAI_API_KEY", key_value: openaiInput.value.trim()});
      openaiInput.value = "";
    }
    const geminiKey = geminiInput.value.trim();
    if (geminiKey) {
      await apiPost("/api/settings/keys", { key_name: "GEMINI_API_KEY", key_value: geminiKey });
      geminiInput.value = "";
    }
    const groqKey = (document.getElementById("input-groq-key") as HTMLInputElement).value.trim();
    const elevenlabsKey = (document.getElementById("input-fish-key") as HTMLInputElement).value.trim();
    const elevenlabsVoiceId = (document.getElementById("input-fish-voice-id") as HTMLInputElement).value.trim();

    if (groqKey) {
      await apiPost("/api/settings/keys", { key_name: "GROQ_API_KEY", key_value: groqKey });
    }
    if (elevenlabsKey) {
      await apiPost("/api/settings/keys", { key_name: "ELEVENLABS_API_KEY", key_value: elevenlabsKey });
    }
    if (elevenlabsVoiceId) {
      await apiPost("/api/settings/keys", { key_name: "elevenlabs_voice_id", key_value: elevenlabsVoiceId });
    }
    await loadStatus();
    feedback.textContent = "Keys saved. The active research writer has not changed.";
    } catch (error) {
      feedback.textContent = error instanceof Error ? error.message : "Keys could not be saved. Your entries are preserved.";
    } finally { button.disabled = false; }
  });

  // Save voice ID
  document.getElementById("btn-save-voice-id")?.addEventListener("click", async () => {
    const voiceId = (document.getElementById("input-fish-voice-id") as HTMLInputElement).value.trim();
    if (voiceId) {
      await apiPost("/api/settings/keys", { key_name: "elevenlabs_voice_id", key_value: voiceId });
    }
  });

  // Test Groq
  document.getElementById("btn-test-groq")?.addEventListener("click", async () => {
    setDotStatus("status-groq", "yellow");
    const key = (document.getElementById("input-groq-key") as HTMLInputElement).value.trim();
    try {
      const result = await apiPost<{ valid: boolean; error?: string }>("/api/settings/test-groq", { api_key: key || undefined });
      setDotStatus("status-groq", result.valid ? "green" : "red");
      if (result.valid) {
        // Save and restart on successful test
        await apiPost("/api/settings/keys", { key_name: "GROQ_API_KEY", key_value: key });
        setTimeout(() => location.reload(), 1000);
      }
    } catch {
      setDotStatus("status-groq", "red");
    }
  });

  // Test ElevenLabs
  document.getElementById("btn-test-fish")?.addEventListener("click", async () => {
    setDotStatus("status-fish", "yellow");
    const key = (document.getElementById("input-fish-key") as HTMLInputElement).value.trim();
    try {
      const result = await apiPost<{ valid: boolean; error?: string }>("/api/settings/test-elevenlabs", { api_key: key || undefined });
      setDotStatus("status-fish", result.valid ? "green" : "red");
      if (result.valid) {
        // Save and restart on successful test
        await apiPost("/api/settings/keys", { key_name: "ELEVENLABS_API_KEY", key_value: key });
        setTimeout(() => location.reload(), 1000);
      }
    } catch {
      setDotStatus("status-fish", "red");
    }
  });

  // Save preferences
  document.getElementById("btn-save-prefs")?.addEventListener("click", async () => {
    const user_name = (document.getElementById("input-user-name") as HTMLInputElement).value.trim();
    const honorific = (document.getElementById("input-honorific") as HTMLSelectElement).value;
    const calendar_accounts = (document.getElementById("input-calendar-accounts") as HTMLTextAreaElement).value.trim();
    const button = document.getElementById("btn-save-prefs") as HTMLButtonElement;
    let status = document.getElementById("preferences-save-status");
    if (!status) {
      status = document.createElement("p");
      status.id = "preferences-save-status";
      status.setAttribute("role", "status");
      button.insertAdjacentElement("afterend", status);
    }
    button.disabled = true;
    try {
      await apiPost("/api/settings/preferences", { user_name, honorific, calendar_accounts });
      status.textContent = "Preferences saved.";
      await loadStatus();
    } catch {
      status.textContent = "Could not save preferences. Your entries are still here; reconnect and try again.";
    } finally { button.disabled = false; }
  });

  // Setup next button
  document.getElementById("btn-setup-next")?.addEventListener("click", advanceSetup);
}

// ---------------------------------------------------------------------------
// First-time setup wizard
// ---------------------------------------------------------------------------

function enterSetupMode() {
  isFirstTimeSetup = true;
  setupStep = 0;

  const welcome = document.getElementById("settings-welcome");
  if (welcome) welcome.style.display = "block";

  const nav = document.getElementById("setup-nav");
  if (nav) nav.style.display = "flex";

  // Hide sections except API keys
  showSetupStep(0);
}

function showSetupStep(step: number) {
  const sections = ["section-api-keys", "section-status", "section-preferences", "section-sysinfo", "section-research-provider"];
  sections.forEach((id, i) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (step === 0 && i === 0) el.style.display = "";
    else if (step === 1 && i === 0) el.style.display = "";
    else if (step === 2 && i === 2) el.style.display = "";
    else if (step === 3) el.style.display = "";
    else el.style.display = "none";
  });

  const nextBtn = document.getElementById("btn-setup-next");
  if (nextBtn) {
    if (step === 0) nextBtn.textContent = "Next: Test Keys";
    else if (step === 1) nextBtn.textContent = "Next: Set Your Name";
    else if (step === 2) nextBtn.textContent = "Finish Setup";
    else nextBtn.style.display = "none";
  }
}

async function advanceSetup() {
  setupStep++;
  if (setupStep >= 3) {
    // Done — save everything and close
    isFirstTimeSetup = false;
    const welcome = document.getElementById("settings-welcome");
    if (welcome) welcome.style.display = "none";
    const nav = document.getElementById("setup-nav");
    if (nav) nav.style.display = "none";

    // Show all sections
    ["section-api-keys", "section-status", "section-preferences", "section-sysinfo", "section-research-provider"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.style.display = "";
    });

    closeSettings();
    return;
  }
  showSetupStep(setupStep);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function openSettings() {
  if (isOpen) return;
  isOpen = true;

  if (!panelEl) {
    panelEl = createPanel();
    wireEvents();
  }

  initVoiceEnrollment();
  panelEl.style.display = "block";

  // Trigger animation
  requestAnimationFrame(() => {
    panelEl!.classList.add("open");
  });

  // Load data
  const status = await loadStatus();
  await loadPreferences();
  renderOrbThemeOptions();

  // Refresh connection status every 3 seconds while open
  const statusRefreshInterval = setInterval(async () => {
    if (!isOpen) {
      clearInterval(statusRefreshInterval);
    } else {
      await loadStatus();
    }
  }, 3000);

  // Check for first-time setup
  if (status && !status.env_keys_set.groq) {
    enterSetupMode();
  }
}

export function closeSettings() {
  if (!panelEl || !isOpen) return;
  isOpen = false;
  panelEl.classList.remove("open");
  setTimeout(() => {
    if (panelEl) panelEl.style.display = "none";
  }, 300);
}

export function isSettingsOpen(): boolean {
  return isOpen;
}

/**
 * Check if first-time setup is needed and auto-open.
 */
export async function checkFirstTimeSetup(): Promise<boolean> {
  try {
    const status = await apiGet<StatusResponse>("/api/settings/status");
    if (!status.env_keys_set.groq) {
      openSettings();
      return true;
    }
  } catch {
    // Server not ready yet, skip
  }
  return false;
}

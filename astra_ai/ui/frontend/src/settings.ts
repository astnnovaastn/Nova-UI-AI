/**
 * JARVIS — Settings Panel
 *
 * Overlay panel for API keys, connection status, preferences, and system info.
 * Slides in from the right with glass-morphism styling.
 */

import { orbThemes, type OrbTheme } from "./orb-themes";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StatusResponse {
  nova_ai_connected: boolean;
  google_calendar_accessible: boolean;
  google_mail_accessible: boolean;
  memory_count: number;
  task_count: number;
  server_port: number;
  uptime_seconds: number;
  env_keys_set: {
    groq: boolean;
    elevenlabs: boolean;
    elevenlabs_voice_id: boolean;
  };
  timestamp: string;
}

interface PreferencesResponse {
  user_name: string;
  honorific: string;
  calendar_accounts: string;
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

const ORB_THEME_KEY = "novaai_orb_theme";
let panelEl: HTMLElement | null = null;
let isOpen = false;
let isFirstTimeSetup = false;
let setupStep = 0; // 0=groq, 1=fish, 2=name, 3=done
let orbThemeChangeHandler: ((themeName: string) => void) | null = null;

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

async function apiGet<T>(url: string): Promise<T> {
  const res = await fetch(url);
  return res.json();
}

async function apiPost<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
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
        <p>Welcome to JARVIS. Let's get you set up.</p>
      </div>

      <div class="settings-body">

        <!-- API Keys -->
        <section class="settings-section" id="section-api-keys">
          <h3>API Keys</h3>

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

          <div class="settings-actions">
            <button class="settings-btn primary" id="btn-save-keys">Save Keys</button>
          </div>
        </section>

        <!-- Connection Status -->
        <section class="settings-section" id="section-status">
          <h3>Connection Status</h3>
          <div class="status-grid">
            <div class="status-row"><span class="status-dot" id="status-claude-cli"></span><span>Nova_AI</span></div>
            <div class="status-row"><span class="status-dot" id="status-calendar"></span><span>Google Calendar</span></div>
            <div class="status-row"><span class="status-dot" id="status-mail"></span><span>Google Mail</span></div>
            <div class="status-row"><span class="status-dot" id="status-server"></span><span>Server</span><span class="status-detail" id="status-server-detail"></span></div>
          </div>
        </section>

        <!-- User Preferences -->
        <section class="settings-section" id="section-preferences">
          <h3>User Preferences</h3>

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
            <div class="sysinfo-row"><span class="sysinfo-label">Memory entries</span><span id="sysinfo-memory">--</span></div>
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
    // If we got a response, server is definitely connected
    setDotStatus("status-server", "green");
    // Nova_AI connection - if server is running and nova_ai.py is the subprocess
    const novaAiConnected = status.nova_ai_connected === true;
    setDotStatus("status-claude-cli", novaAiConnected ? "green" : "red");
    // Google Calendar - only green if explicitly accessible
    const calendarConnected = status.google_calendar_accessible === true;
    setDotStatus("status-calendar", calendarConnected ? "green" : "red");
    // Google Mail - only green if explicitly accessible
    const mailConnected = status.google_mail_accessible === true;
    setDotStatus("status-mail", mailConnected ? "green" : "red");
    const serverDetail = document.getElementById("status-server-detail");
    if (serverDetail) serverDetail.textContent = `port ${status.server_port} | up ${formatUptime(status.uptime_seconds)}`;
    // API key status dots (in the API Keys section)
    const groqConnected = status.env_keys_set?.groq === true;
    setDotStatus("status-groq", groqConnected ? "green" : "red");
    const elevenlabsConnected = status.env_keys_set?.elevenlabs === true;
    setDotStatus("status-fish", elevenlabsConnected ? "green" : "red");
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
      nova_ai: novaAiConnected ? "green" : "red",
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
  // Close
  document.getElementById("settings-close")?.addEventListener("click", closeSettings);
  document.getElementById("settings-backdrop")?.addEventListener("click", closeSettings);

  // Save keys
  document.getElementById("btn-save-keys")?.addEventListener("click", async () => {
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
    await apiPost("/api/settings/preferences", { user_name, honorific, calendar_accounts });
    await loadStatus();
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
  const sections = ["section-api-keys", "section-status", "section-preferences", "section-sysinfo"];
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
    ["section-api-keys", "section-status", "section-preferences", "section-sysinfo"].forEach((id) => {
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

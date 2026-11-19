// The full-window Settings route keeps the underlying workspace and tab untouched.
export type SettingsSection =
  | "accounts"
  | "search" | "appearance" | "new-tab" | "tabs" | "privacy" | "permissions" | "downloads" | "focus" | "tasks"
  | "ai" | "keys" | "voice" | "work" | "skills" | "memory" | "connections" | "system";

export type SectionInfo = { id: SettingsSection; group: "identity" | "browser" | "aegis"; title: string; description: string };

/** Navigation order: groups in `GROUPS` order, sections within a group as listed. Ids are deep-link targets. */
export const SECTIONS: readonly SectionInfo[] = [
  { id: "accounts", group: "identity", title: "Profile and accounts", description: "Your AEGIS profile, your browser profile, Google, and what AEGIS agents may use." },
  { id: "search", group: "browser", title: "Search engine", description: "Used when you type words instead of an address in a tab. AEGIS agents never use it." },
  { id: "appearance", group: "browser", title: "Appearance", description: "Color mode, themes, accent, window surfaces and interface scale." },
  { id: "new-tab", group: "browser", title: "New Tab", description: "The new tab wallpaper and indicators, and the Dashboard orb." },
  { id: "tabs", group: "browser", title: "Tabs and startup", description: "What opens when AEGIS starts, and tabs you closed." },
  { id: "privacy", group: "browser", title: "Privacy and blocking", description: "Adverts and trackers, history and cached files in your tabs." },
  { id: "permissions", group: "browser", title: "Site access", description: "Camera, microphone, location and notifications that sites asked for." },
  { id: "downloads", group: "browser", title: "Downloads", description: "Files downloaded since AEGIS started." },
  { id: "focus", group: "browser", title: "Focus", description: "Focus rounds, breaks, the daily goal and sites held back during focus." },
  { id: "tasks", group: "browser", title: "Tasks", description: "Your one task list, shared by Browse, Work, research and AEGIS's assistant." },
  { id: "ai", group: "aegis", title: "AI models", description: "Which provider writes research, its model and backups. Chat and voice stay on Gemini Live." },
  { id: "keys", group: "aegis", title: "API keys", description: "Provider keys, kept by the AEGIS server in its environment file. Saved keys are never shown." },
  { id: "voice", group: "aegis", title: "Voice and sound", description: "Your voice profile, sounds and your name as AEGIS uses it." },
  { id: "work", group: "aegis", title: "Work", description: "The models AEGIS Work routes to, and their availability." },
  { id: "skills", group: "aegis", title: "Skills", description: "Manage the instructions available to AEGIS Work and research." },
  { id: "memory", group: "aegis", title: "Memory", description: "Open the saved memories in your AEGIS workspace." },
  { id: "connections", group: "aegis", title: "Connections and devices", description: "Services AEGIS reaches, windows connected to it, and paired computers." },
  { id: "system", group: "aegis", title: "System", description: "The AEGIS server, memories and tasks it holds, and recovery." },
];

export const GROUPS = [
  { id: "browser", label: "Browser" },
  { id: "aegis", label: "AEGIS" },
] as const;

/** Words each section answers to in the settings search (labels of the rows it holds). */
const WORDS: Record<SettingsSection, string> = {
  accounts: "profile account google sign in sign out oauth gmail calendar agents authorization browser profile name",
  search: "search engine google bing duckduckgo brave searxng custom address",
  appearance: "light dark system appearance palette theme accent color colour glass frosted font reduced motion zoom scale",
  "new-tab": "background wallpaper picture colour sky dim clock figures trackers focus tasks orb theme",
  tabs: "tabs startup restore reopen closed",
  privacy: "privacy blocker adverts trackers allow history cache clear",
  permissions: "permissions camera microphone location notifications forget",
  downloads: "downloads files",
  focus: "focus round minutes breaks goal held back sites shut",
  tasks: "tasks today due overdue lists board",
  ai: "ai model research writer gemini openai groq backup fallback cooperative",
  keys: "api keys gemini openai groq elevenlabs serpapi tavily quick search deep research voice id",
  voice: "voice speaker profile enrollment recognition sound notification volume cues name honorific calendar accounts",
  work: "work models router availability",
  skills: "skills work workflows custom built-in instructions",
  memory: "memories memory context saved workspace",
  connections: "connections status server calendar mail windows devices pair pairing",
  system: "system memory tasks port uptime restart server fix",
};

export function searchSections(query: string): SectionInfo[] {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  return SECTIONS.filter((section) => {
    const text = `${section.title} ${section.description} ${WORDS[section.id]}`.toLowerCase();
    return words.every((word) => text.includes(word));
  });
}

class SettingsView {
  section = $state<SettingsSection>("search");
  query = $state("");
  isOpen = $state(false);
  revision = $state(0);
  private opener: HTMLElement | null = null;

  select(section: SettingsSection) {
    this.section = section;
    this.query = "";
    this.revision++;
  }

  open(section?: string) {
    const known = SECTIONS.find((row) => row.id === section);
    if (!this.isOpen && typeof document !== "undefined") {
      this.opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    }
    this.select(known?.id ?? this.section);
    this.isOpen = true;
  }

  dismiss() {
    this.isOpen = false;
    this.query = "";
    this.opener = null;
  }

  close() {
    const opener = this.opener;
    this.dismiss();
    if (opener) requestAnimationFrame(() => {
      if (!this.isOpen && opener.isConnected) opener.focus({ preventScroll: true });
    });
  }
}

export const settingsView = new SettingsView();

export type AssistComposerState = {
  draft: string;
  disabled: boolean;
  busy: boolean;
  sending: boolean;
  muted: boolean;
  model: string;
  hasNativeBrowser: boolean;
  change(text: string): void;
  send(text: string): void;
  stop(): void;
  microphone(): void;
  models(): void;
  openTool(tool: "browser" | "work"): void;
};

type ThemeRecord = { id: string; name: string; tokens: { bg: string; fg: string; accent: string } };
type AppearanceOptions = {
  mode: "theme" | "light" | "dark" | "system";
  accent: string;
  font: string;
  motion: string;
  frosted: boolean;
  uiScale: number;
};
export function applyTheme(theme: unknown, appearanceOnly?: boolean): ThemeRecord;
export function readAppearance(): AppearanceOptions & { themeId: string };
export function setAppearance(patch: Partial<AppearanceOptions>): void;
export const themeApi: {
  list(): Promise<{ builtins: ThemeRecord[]; custom: ThemeRecord[] }>;
  setDefault(id: string): Promise<{ theme?: ThemeRecord } | undefined>;
};

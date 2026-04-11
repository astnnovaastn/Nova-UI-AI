/// <reference types="vite/client" />

export interface OrbTheme {
  name: string;
  label: string;
  orbColor: string;
}

const modules = import.meta.glob('./*.json', { eager: true, query: '?json' }) as Record<string, { default: OrbTheme }>;

export const orbThemes: OrbTheme[] = Object.keys(modules)
  .sort()
  .map((path) => modules[path].default)
  .filter((theme) => !!theme.name && !!theme.orbColor);

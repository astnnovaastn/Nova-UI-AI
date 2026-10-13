import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { appearanceTokens, contrast, readable, widgetSurfaces } from './appearance.js';
const source = readFileSync(new URL('./theme.js', import.meta.url), 'utf8');
const paletteBlock = source.slice(source.indexOf('const palettes ='), source.indexOf('export const BUILTIN_THEMES'));
const palettes = [...paletteBlock.matchAll(/(\w+): \[([^\]]+)\]/g)].map(([, name, values]) => ({ name, values: [...values.matchAll(/'(#[a-fA-F0-9]+)'/g)].map(match => match[1]) }));
for (const {name, values} of palettes) test(`${name}: palette preserved and panel text remains readable`, () => {
  const [bg, fg, panel, border, accent] = values;
  const tokens = { bg, fg, panel, border, accent };
  const before = JSON.stringify(tokens);
  const derived = appearanceTokens(tokens);
  assert.equal(JSON.stringify(tokens), before);
  for (const key of ['--panel-text', '--panel-text-muted', '--panel-text-faint', '--accent-readable']) assert.ok(contrast(derived[key], panel) >= 4.5, `${name} ${key}`);
  assert.ok(contrast(derived['--text-primary'], bg) >= 4.5);
  assert.ok(contrast(derived['--on-accent'], accent) >= 4.5);
});
test('all built-in palettes have coverage', () => assert.equal(palettes.length, 16));
test('already readable theme colors retain their exact value', () => assert.equal(readable('#64d2ff', '#091422'), '#64d2ff'));
test('custom pale text on a pale panel is corrected without changing hue unnecessarily', () => assert.ok(contrast(readable('#ff6b9d', '#fff8fa'), '#fff8fa') >= 4.5));

for (const {name, values} of palettes) test(`${name}: readable on gradients and translucent panels`, () => {
  const [bg, fg, panel, border, accent] = values;
  for (const panelOpacity of [.5, .75, .94, 1]) {
    const tokens = { bg, fg, panel, border, accent, frosted: true, panelOpacity };
    const derived = appearanceTokens(tokens);
    for (const surface of widgetSurfaces(tokens)) for (const key of ['--panel-text','--panel-text-muted','--panel-text-faint','--accent-readable']) assert.ok(contrast(derived[key], surface) >= 4.5, `${name} ${key} opacity ${panelOpacity}`);
  }
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { groupNewsMedia, hasEditorialMediaRail, normalizeBriefingSections, resolveNewsMediaLayout, resolveEditorialMediaPlan, resolveEditorialSectionLayout } from './newsMedia.js';

const media = (id, aspectRatio, type = 'photo') => ({ id, url: `https://example.test/${id}.jpg`, aspectRatio, type, qualityScore: 80 });

test('uses a text-paired layout for portrait media instead of a wide empty hero', () => {
  assert.equal(resolveNewsMediaLayout([media('portrait', 0.62)], 520, { hasSupportingText: true }).presentation, 'mediaWithText');
});

test('uses contained treatment for graphics and never crops their content', () => {
  const layout = resolveNewsMediaLayout([media('chart', 1.6, 'infographic')], 520, {});
  assert.equal(layout.presentation, 'containedGraphic');
  assert.equal(layout.fit, 'contain');
});

test('groups compatible, related images without mixing separate sections', () => {
  const groups = groupNewsMedia([
    { ...media('one', 0.67), relatedSectionId: 'context' },
    { ...media('two', 0.7), relatedSectionId: 'context' },
    { ...media('three', 1.8), relatedSectionId: 'latest' },
  ]);
  assert.equal(groups.length, 2);
  assert.deepEqual(groups[0].items.map((item) => item.id), ['one', 'two']);
});

test('builds distinct editorial slots without repeating hero media', () => {
  const plan = resolveEditorialMediaPlan([
    { ...media('hero', 1.7), recommendedSlot: 'hero' },
    { ...media('support', 1.35), recommendedSlot: 'supporting' },
    { ...media('related', 1.6), recommendedSlot: 'related' },
  ]);
  assert.deepEqual(plan.hero.map((item) => item.id), ['hero']);
  assert.deepEqual(plan.supporting.map((item) => item.id), ['support']);
  assert.deepEqual(plan.related.map((item) => item.id), ['related']);
});

test('rejects a low-quality thumbnail from premium editorial slots', () => {
  const plan = resolveEditorialMediaPlan([
    { ...media('tiny', 1.7), width: 280, height: 160, qualityScore: 12, recommendedSlot: 'hero' },
    { ...media('strong', 1.7), width: 1920, height: 1080, qualityScore: 92, recommendedSlot: 'hero' },
  ]);
  assert.deepEqual(plan.hero.map((item) => item.id), ['strong']);
});

test('lets a section span full width when it has no assigned contextual media', () => {
  assert.equal(resolveEditorialSectionLayout({ id: 'analysis' }, []).variant, 'text');
  assert.equal(resolveEditorialSectionLayout({ id: 'market-context' }, [
    { ...media('context', 1.4), relatedSectionId: 'market-context' },
  ]).variant, 'textRightMedia');
});

test('omits placeholder and duplicate briefing sections from the editorial flow', () => {
  const sections = normalizeBriefingSections([
    { id: 'placeholder', title: 'Market Context', body: '...' },
    { id: 'duplicate', title: 'Latest Developments', body: 'The policy outlook is changing.' },
    { id: 'analysis', title: 'Analysis', body: 'A second section adds distinct context.' },
  ], 'The policy outlook is changing.');
  assert.deepEqual(sections.map((section) => section.id), ['analysis']);
});

test('removes the editorial media rail when no fitted media is available', () => {
  assert.equal(hasEditorialMediaRail({ hero: [], supporting: [], quote: [] }), false);
  assert.equal(hasEditorialMediaRail({ hero: [media('hero', 1.6)], supporting: [], quote: [] }), true);
});

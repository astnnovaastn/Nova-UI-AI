import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_AEGIS_LAYOUT,
  buildLayoutContentManifest,
  createLayoutBlock,
  resolveNewsLayout,
  validateNewsLayout,
  resolveRenderFlow,
} from './newsLayout.js';

test('default layout is valid and keeps the required headline binding', () => {
  const result = validateNewsLayout(DEFAULT_AEGIS_LAYOUT);
  assert.equal(result.valid, true);
  assert.equal(DEFAULT_AEGIS_LAYOUT.blocks.some((block) => block.binding === 'headline'), true);
});

test('dynamic sections produce a bounded, layout-aware content manifest', () => {
  const layout = structuredClone(DEFAULT_AEGIS_LAYOUT);
  layout.blocks.push(
    createLayoutBlock('dynamicSection', { x: 0, y: 44, w: 12, minRows: 4 }, { depth: 'deep', purpose: 'impact' }),
  );
  const manifest = buildLayoutContentManifest(layout);
  assert.equal(manifest.dynamicSections.count, 5);
  assert.equal(manifest.dynamicSections.items.at(-1).purpose, 'impact');
  assert.equal(manifest.heroMedia.maxItems, 4);
});

test('empty optional blocks collapse and permit their sibling to fill a band', () => {
  const layout = {
    ...DEFAULT_AEGIS_LAYOUT,
    blocks: [
      createLayoutBlock('headline', { x: 0, y: 8, w: 12, minRows: 2 }),
      createLayoutBlock('dynamicSection', { x: 0, y: 0, w: 7, minRows: 4 }),
      createLayoutBlock('quote', { x: 7, y: 0, w: 5, minRows: 4 }, { priority: 'optional' }),
    ],
  };
  const resolved = resolveNewsLayout(layout, { briefingSections: [{ id: 'one', title: 'Context', body: 'Full context.' }], insight: null });
  const contentBand = resolved.bands.find((band) => band.y === 0);
  assert.equal(contentBand.blocks.length, 1);
  assert.equal(contentBand.blocks[0].layout.w, 24);
});

test('invalid overlaps and a missing headline cannot be saved', () => {
  const layout = { ...DEFAULT_AEGIS_LAYOUT, blocks: [createLayoutBlock('intro', { x: 0, y: 0, w: 8, minRows: 3 }), createLayoutBlock('quote', { x: 4, y: 0, w: 5, minRows: 3 })] };
  const result = validateNewsLayout(layout);
  assert.equal(result.valid, false);
  assert.match(result.errors.join(' '), /headline|overlap/i);
});

test('render flow keeps all visible fixture-backed blocks and removes empty editor row ranges', () => {
  const layout = { ...DEFAULT_AEGIS_LAYOUT, blocks: [
    createLayoutBlock('headline', { x: 0, y: 0, w: 12, minRows: 4 }),
    createLayoutBlock('heroCarousel', { x: 12, y: 0, w: 12, minRows: 12 }),
    createLayoutBlock('intro', { x: 0, y: 5, w: 12, minRows: 5 }),
    createLayoutBlock('relatedCoverage', { x: 0, y: 38, w: 24, minRows: 6 }),
    createLayoutBlock('sourceCoverage', { x: 0, y: 50, w: 24, minRows: 4 }),
  ] };
  const flow = resolveRenderFlow(layout, { headline: 'Fixture', body: 'Fixture body', mediaPlan: { heroMedia: [{ id: 'hero', url: 'https://example.test/hero.jpg' }], supportingMedia: [] }, relatedStories: [{ id: 'related', headline: 'Related' }], sources: [{ id: 'source', name: 'Source' }] }, 'preview');
  assert.equal(flow.blocks.length, 5);
  assert.equal(flow.bands.length, 3);
  assert.equal(flow.bands[0].blocks.find((block) => block.binding === 'heroMedia').renderStart, 1);
  assert.equal(flow.bands[1].blocks[0].renderStart, 1);
});
test('Add and Duplicate use free canvas space without extending the workspace', async () => {
  const { addLayoutBlock, duplicateLayoutBlock } = await import('./newsLayout.js');
  const layout = { ...DEFAULT_AEGIS_LAYOUT, workspace: { rows: 20 }, blocks: [
    createLayoutBlock('headline', { x: 0, y: 0, w: 12, minRows: 4 }),
    createLayoutBlock('intro', { x: 0, y: 6, w: 12, minRows: 5 }),
  ] };
  const added = addLayoutBlock(layout, 'supportingImage', { anchor: { x: 13, y: 0 } });
  const image = added.blocks.find((block) => block.kind === 'supportingImage');
  assert.ok(image);
  assert.equal(added.workspace.rows, 20);
  assert.ok(image.layout.desktop.y < 12);
  const duplicated = duplicateLayoutBlock(added, image.id, { anchor: { x: 13, y: 10 } });
  assert.equal(duplicated.workspace.rows, 20);
  assert.equal(duplicated.blocks.length, added.blocks.length + 1);
});

test('Compact removes vertical gaps without changing a row’s horizontal geometry, while Fit only changes workspace bounds', async () => {
  const { compactLayout, fitWorkspaceToContent } = await import('./newsLayout.js');
  const layout = { ...DEFAULT_AEGIS_LAYOUT, workspace: { rows: 60 }, blocks: [
    createLayoutBlock('headline', { x: 0, y: 0, w: 12, minRows: 4 }),
    createLayoutBlock('heroCarousel', { x: 12, y: 0, w: 12, minRows: 8 }),
    createLayoutBlock('intro', { x: 0, y: 28, w: 12, minRows: 5 }),
    createLayoutBlock('supportingImage', { x: 12, y: 28, w: 12, minRows: 5 }),
  ] };
  const fitted = fitWorkspaceToContent(layout);
  assert.equal(fitted.blocks[2].layout.desktop.y, 28);
  const compacted = compactLayout(layout);
  assert.equal(compacted.blocks[0].layout.desktop.x, 0);
  assert.equal(compacted.blocks[1].layout.desktop.x, 12);
  assert.equal(compacted.blocks[2].layout.desktop.y, 10);
  assert.equal(compacted.blocks[3].layout.desktop.x, 12);
});

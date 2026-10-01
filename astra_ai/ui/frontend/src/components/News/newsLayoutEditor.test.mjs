import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_AEGIS_LAYOUT,
  addLayoutBlock,
  buildLayoutContentManifest,
  createLayoutBlock,
  duplicateLayoutBlock,
  getDropPreview,
  fitWorkspaceToContent,
  normalizeNewsLayout,
  moveLayoutBlock,
  renameLayoutBlock,
  resizeLayoutBlock,
  resolveNewsLayout,
  commitPlacement,
  evaluatePlacement,
  getBlockConstraints,
  validateRect,
} from './newsLayout.js';

const copy = (value) => JSON.parse(JSON.stringify(value));

test('editor operations create independently addressable dynamic blocks', () => {
  const layout = copy(DEFAULT_AEGIS_LAYOUT);
  const added = addLayoutBlock(layout, 'dynamicSection');
  const duplicate = duplicateLayoutBlock(added, added.blocks.at(-1).id);

  assert.equal(duplicate.blocks.filter((block) => block.kind === 'dynamicSection').length, 6);
  assert.notEqual(duplicate.blocks.at(-1).id, duplicate.blocks.at(-2).id);
});

test('rename, move and resize keep a block inside the responsive grid', () => {
  const layout = copy(DEFAULT_AEGIS_LAYOUT);
  const headline = layout.blocks.find((block) => block.kind === 'headline');
  const renamed = renameLayoutBlock(layout, headline.id, 'Primary detailed text');
  const moved = moveLayoutBlock(renamed, headline.id, { x: 8, y: 42 });
  const resized = resizeLayoutBlock(moved, headline.id, { w: 9, minRows: 5 });
  const changed = resized.blocks.find((block) => block.id === headline.id);

  assert.equal(changed.label, 'Primary detailed text');
  assert.ok(changed.layout.desktop.x + changed.layout.desktop.w <= 24);
  assert.equal(changed.layout.desktop.w, 9);
  assert.ok(changed.layout.desktop.minRows >= 2);
});

test('empty optional blocks collapse and do not leave a partial-width band', () => {
  const layout = copy(DEFAULT_AEGIS_LAYOUT);
  const quote = layout.blocks.find((block) => block.kind === 'quote');
  const section = layout.blocks.find((block) => block.kind === 'dynamicSection');
  quote.layout.desktop.y = section.layout.desktop.y;
  quote.layout.desktop.x = 7;
  section.layout.desktop.w = 7;
  const resolved = resolveNewsLayout(layout, {
    headline: 'A complete headline',
    body: 'A complete introduction.',
    briefingSections: [{ id: 'context', title: 'Context', body: 'Complete context.' }],
  });
  const band = resolved.bands.find((item) => item.y === section.layout.desktop.y);

  assert.equal(band.blocks.length, 1);
  assert.equal(band.blocks[0].layout.w, 24);
});
test('moving a block into occupied space preserves its original rectangle', () => {
  const layout = {
    ...DEFAULT_AEGIS_LAYOUT,
    blocks: [
      createLayoutBlock('headline', { x: 0, y: 0, w: 12, minRows: 2 }),
      createLayoutBlock('quote', { x: 0, y: 4, w: 5, minRows: 2 }),
    ],
  };
  const quote = layout.blocks[1];
  const moved = moveLayoutBlock(layout, quote.id, { x: 0, y: 0 });
  const changed = moved.blocks.find((block) => block.id === quote.id);

  assert.deepEqual(changed.layout.desktop, quote.layout.desktop);
});

test('dynamic requirements preserve semantic density and content role in the manifest', () => {
  const layout = {
    ...DEFAULT_AEGIS_LAYOUT,
    blocks: [
      createLayoutBlock('headline', { x: 0, y: 0, w: 12, minRows: 2 }),
      createLayoutBlock('dynamicSection', { x: 0, y: 3, w: 12, minRows: 4 }, {
        density: 'research',
        contentRole: 'financialContext',
        instruction: 'Focus on financial impact.',
      }),
    ],
  };
  const manifest = buildLayoutContentManifest(layout);

  assert.deepEqual(manifest.dynamicSections.items[0], {
    id: layout.blocks[1].id,
    label: 'Dynamic News Section',
    purpose: 'financialContext',
    contentRole: 'financialContext',
    density: 'research',
    depth: 'research',
    instruction: 'Focus on financial impact.',
  });
});
test('migrates legacy 12-column layouts into a bounded 24-column workspace', () => {
  const migrated = normalizeNewsLayout({
    ...DEFAULT_AEGIS_LAYOUT,
    schemaVersion: 3,
    grid: { columns: 12, gap: 14 },
    blocks: [createLayoutBlock('headline', { x: 2, y: 3, w: 7, minRows: 3 })],
  });

  assert.equal(migrated.grid.columns, 24);
  assert.equal(migrated.blocks[0].layout.desktop.x, 4);
  assert.equal(migrated.blocks[0].layout.desktop.w, 14);
  assert.ok(migrated.workspace.rows >= 10);
});

test('previewing a normal valid drop does not mutate the persisted block', () => {
  const layout = normalizeNewsLayout({
    ...DEFAULT_AEGIS_LAYOUT,
    workspace: { rows: 16 },
    blocks: [
      createLayoutBlock('headline', { x: 0, y: 0, w: 12, minRows: 3 }),
      createLayoutBlock('supportingImage', { x: 18, y: 0, w: 6, minRows: 6 }),
      createLayoutBlock('dynamicSection', { x: 0, y: 8, w: 12, minRows: 4 }),
    ],
  });
  const moving = layout.blocks[2];
  const preview = getDropPreview(layout, moving.id, { x: 12, y: 6, w: 12, minRows: 5 });

  assert.equal(preview.state, 'valid');
  assert.equal(preview.rect.x, 12);
  assert.ok(preview.rect.w >= 4);
  assert.ok(preview.rect.w >= 6);
});

test('fits workspace to visible content with stable bottom padding', () => {
  const layout = normalizeNewsLayout({
    ...DEFAULT_AEGIS_LAYOUT,
    workspace: { rows: 80 },
    blocks: [createLayoutBlock('headline', { x: 0, y: 10, w: 14, minRows: 4 })],
  });

  assert.equal(fitWorkspaceToContent(layout).workspace.rows, 18);
});

const rectOf = (layout, id) => structuredClone(layout.blocks.find((block) => block.id === id).layout.desktop);

test('placement evaluation and commit preserve dimensions for a valid move', () => {
  const layout = { ...DEFAULT_AEGIS_LAYOUT, workspace: { rows: 30 }, blocks: [
    createLayoutBlock('headline', { x: 0, y: 0, w: 10, minRows: 4 }),
    createLayoutBlock('quote', { x: 12, y: 0, w: 6, minRows: 4 }),
  ] };
  const headline = layout.blocks[0];
  const original = rectOf(layout, headline.id);
  const evaluation = evaluatePlacement(layout, headline.id, { ...original, x: 0, y: 10 });
  const committed = commitPlacement(layout, headline.id, original, evaluation);
  assert.deepEqual(rectOf(committed, headline.id), { ...original, x: 0, y: 10 });
  assert.deepEqual(rectOf(committed, layout.blocks[1].id), rectOf(layout, layout.blocks[1].id));
});

test('invalid placement preserves exact geometry and never relocates a block', () => {
  const layout = { ...DEFAULT_AEGIS_LAYOUT, workspace: { rows: 18 }, blocks: [
    createLayoutBlock('headline', { x: 0, y: 0, w: 12, minRows: 4 }),
    createLayoutBlock('quote', { x: 12, y: 0, w: 6, minRows: 4 }),
  ] };
  const quote = layout.blocks[1];
  const original = rectOf(layout, quote.id);
  const evaluation = evaluatePlacement(layout, quote.id, { ...original, x: 0, y: 0 });
  const committed = commitPlacement(layout, quote.id, original, evaluation);
  assert.equal(evaluation.state, 'invalid');
  assert.deepEqual(rectOf(committed, quote.id), original);
});

test('fit-to-space is explicit and only changes size at the requested origin', () => {
  const layout = { ...DEFAULT_AEGIS_LAYOUT, workspace: { rows: 18 }, blocks: [
    createLayoutBlock('headline', { x: 0, y: 0, w: 12, minRows: 4 }),
    createLayoutBlock('quote', { x: 12, y: 0, w: 6, minRows: 4 }),
    createLayoutBlock('supportingImage', { x: 0, y: 8, w: 10, minRows: 6 }),
    createLayoutBlock('quote', { x: 20, y: 8, w: 4, minRows: 4 }),
  ] };
  const image = layout.blocks[2];
  const original = rectOf(layout, image.id);
  const evaluation = evaluatePlacement(layout, image.id, { ...original, x: 14, y: 8 });
  assert.equal(evaluation.state, 'fitToSpace');
  assert.deepEqual(evaluation.rect, { x: 14, y: 8, w: 6, minRows: 6 });
  assert.deepEqual(rectOf(layout, image.id), original);
});

test('geometry validation rejects NaN, zero, negative, and below-minimum rectangles', () => {
  const block = createLayoutBlock('headline', { x: 0, y: 0, w: 10, minRows: 4 });
  for (const rect of [{ x: NaN, y: 0, w: 10, minRows: 4 }, { x: 0, y: 0, w: 0, minRows: 4 }, { x: 0, y: -1, w: 10, minRows: 4 }, { x: 0, y: 0, w: 7, minRows: 3 }]) {
    assert.equal(validateRect(rect, { columns: 24, rows: 30 }, getBlockConstraints(block)).valid, false);
  }
});

test('resize evaluation preserves anchor and restores the original rectangle when invalid', () => {
  const layout = { ...DEFAULT_AEGIS_LAYOUT, workspace: { rows: 18 }, blocks: [
    createLayoutBlock('headline', { x: 0, y: 0, w: 10, minRows: 4 }),
    createLayoutBlock('quote', { x: 12, y: 0, w: 6, minRows: 4 }),
  ] };
  const headline = layout.blocks[0];
  const original = rectOf(layout, headline.id);
  const valid = evaluatePlacement(layout, headline.id, { ...original, w: 12, minRows: 5 }, { allowFit: false });
  assert.deepEqual(commitPlacement(layout, headline.id, original, valid).blocks.find((block) => block.id === headline.id).layout.desktop, { x: 0, y: 0, w: 12, minRows: 5 });
  const invalid = evaluatePlacement(layout, headline.id, { ...original, w: 20 }, { allowFit: false });
  assert.equal(invalid.state, 'invalid');
  assert.deepEqual(rectOf(commitPlacement(layout, headline.id, original, invalid), headline.id), original);
});
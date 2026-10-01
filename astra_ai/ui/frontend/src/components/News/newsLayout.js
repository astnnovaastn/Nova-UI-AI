export const NEWS_LAYOUT_SCHEMA_VERSION = 4;
export const DEFAULT_COLUMNS = 24;
const WORKSPACE_PADDING = 4;

export const BLOCK_DEFINITIONS = {
  topStoryLabel: { label: 'Top Story Label', category: 'Text', binding: 'topStoryLabel', singleton: true, defaultWidth: 8, defaultRows: 2 },
  headline: { label: 'Headline', category: 'Text', binding: 'headline', singleton: true, defaultWidth: 14, defaultRows: 6, required: true },
  metadata: { label: 'Metadata', category: 'Data', binding: 'metadata', singleton: true, defaultWidth: 14, defaultRows: 2 },
  intro: { label: 'Intro / Summary', category: 'Text', binding: 'intro', singleton: true, defaultWidth: 14, defaultRows: 8 },
  text: { label: 'Text Box', category: 'Text', binding: 'bodyText', defaultWidth: 24, defaultRows: 6 },
  dynamicSection: { label: 'Dynamic News Section', category: 'Text', binding: 'dynamicSection', defaultWidth: 24, defaultRows: 8 },
  timeline: { label: 'Timeline', category: 'Data', binding: 'timeline', singleton: true, defaultWidth: 24, defaultRows: 6 },
  quote: { label: 'Quote / Insight', category: 'Special', binding: 'insight', singleton: true, defaultWidth: 10, defaultRows: 6, optional: true },
  whatToWatch: { label: 'What To Watch', category: 'Text', binding: 'whatToWatch', singleton: true, defaultWidth: 24, defaultRows: 4, optional: true },
  list: { label: 'List Box', category: 'Text', binding: 'list', defaultWidth: 14, defaultRows: 6, optional: true },
  heroCarousel: { label: 'Hero Slideshow', category: 'Media', binding: 'heroMedia', singleton: true, defaultWidth: 10, defaultRows: 14, optional: true },
  supportingImage: { label: 'Supporting Image', category: 'Media', binding: 'supportingMedia', defaultWidth: 10, defaultRows: 8, optional: true },
  imageGallery: { label: 'Image Gallery', category: 'Media', binding: 'mediaGallery', defaultWidth: 24, defaultRows: 8, optional: true },
  relatedCoverage: { label: 'Related Coverage', category: 'Sources', binding: 'relatedCoverage', singleton: true, defaultWidth: 24, defaultRows: 6, optional: true },
  sourceCoverage: { label: 'Source Coverage', category: 'Sources', binding: 'sourceCoverage', singleton: true, defaultWidth: 24, defaultRows: 4, optional: true },
  fullSearchAction: { label: 'Full Search Link', category: 'Navigation', binding: 'fullSearchAction', singleton: true, defaultWidth: 8, defaultRows: 2, optional: true },
  divider: { label: 'Divider', category: 'Layout', binding: 'divider', defaultWidth: 24, defaultRows: 2 },
  group: { label: 'Layout Guide', category: 'Layout', binding: 'container', defaultWidth: 24, defaultRows: 4, optional: true },
};

const copy = (value) => JSON.parse(JSON.stringify(value));
const layout = (x, y, w, minRows) => ({ x, y, w, minRows });
const positionOf = (block) => block.layout.desktop;
const rangesOverlap = (left, right) => left.x < right.x + right.w && right.x < left.x + left.w;
const rectanglesOverlap = (left, right) => left.y < right.y + right.minRows && right.y < left.y + left.minRows && rangesOverlap(left, right);
const isMedia = (kind) => ['heroCarousel', 'supportingImage', 'imageGallery'].includes(kind);
const isText = (kind) => ['headline', 'intro', 'text', 'dynamicSection', 'quote', 'list', 'timeline', 'whatToWatch'].includes(kind);

const defaultSettings = (kind) => {
  const shared = { fontScale: 'normal', density: 'medium', alignment: 'start', padding: 'normal', minimumContent: 'auto', maximumContent: 'auto' };
  if (kind === 'dynamicSection' || kind === 'text') return { ...shared, density: 'auto', depth: 'auto', purpose: 'auto', contentRole: 'auto', instruction: '', optional: false };
  if (kind === 'list') return { ...shared, purpose: 'whatToWatch', itemCount: 5, instruction: '' };
  if (kind === 'heroCarousel') return { ...shared, role: 'hero', maxItems: 4, navigation: 'insideEdges', pagination: 'dots', autoplay: 'off', fit: 'auto', aspectLock: false };
  if (kind === 'supportingImage' || kind === 'imageGallery') return { ...shared, role: kind === 'imageGallery' ? 'gallery' : 'supporting', fit: 'auto', aspectLock: false };
  if (kind === 'quote') return { ...shared, quoteRole: 'keyInsight', instruction: '' };
  if (kind === 'relatedCoverage') return { ...shared, cardCount: 5, thumbnails: true, publisher: true, date: true, navigation: 'arrows' };
  return shared;
};

let blockSequence = 0;
export function createLayoutBlock(kind, blockLayout, settings = {}) {
  const definition = BLOCK_DEFINITIONS[kind];
  if (!definition) throw new Error(`Unknown News layout block: ${kind}`);
  blockSequence += 1;
  return { id: `${kind}-${Date.now().toString(36)}-${blockSequence}`, kind, label: definition.label, binding: definition.binding, priority: definition.required ? 'required' : definition.optional ? 'optional' : 'preferred', collapseWhenEmpty: !definition.required, locked: false, hidden: false, layout: { desktop: { ...layout(0, 0, definition.defaultWidth, definition.defaultRows), ...(blockLayout || {}) } }, settings: { ...defaultSettings(kind), ...settings } };
}

const starter = [
  createLayoutBlock('topStoryLabel', layout(0, 0, 14, 2)), createLayoutBlock('headline', layout(0, 2, 14, 6)), createLayoutBlock('metadata', layout(0, 8, 14, 2)), createLayoutBlock('intro', layout(0, 10, 14, 8)), createLayoutBlock('heroCarousel', layout(14, 0, 10, 14)), createLayoutBlock('dynamicSection', layout(0, 20, 14, 8), { purpose: 'auto', depth: 'detailed' }), createLayoutBlock('supportingImage', layout(14, 16, 10, 10)), createLayoutBlock('dynamicSection', layout(0, 30, 24, 8), { purpose: 'analysis' }), createLayoutBlock('dynamicSection', layout(0, 40, 14, 8), { purpose: 'impact' }), createLayoutBlock('quote', layout(14, 40, 10, 6)), createLayoutBlock('dynamicSection', layout(0, 50, 24, 8), { purpose: 'future' }), createLayoutBlock('whatToWatch', layout(0, 60, 24, 4)), createLayoutBlock('relatedCoverage', layout(0, 66, 24, 6)), createLayoutBlock('sourceCoverage', layout(0, 74, 24, 4)), createLayoutBlock('fullSearchAction', layout(0, 80, 8, 2)),
];
export const DEFAULT_AEGIS_LAYOUT = Object.freeze({ id: 'default-aegis', name: 'Default AEGIS', schemaVersion: NEWS_LAYOUT_SCHEMA_VERSION, grid: { columns: DEFAULT_COLUMNS, gap: 14 }, workspace: { rows: 88 }, globalSettings: { fontFamily: 'theme', contentDensity: 'balanced', mediaDensity: 'balanced', textScale: 'normal', sectionGap: 'normal', animations: 'subtle' }, blocks: starter });

export function getBlockConstraints(block) {
  if (block.kind === 'headline') return { minWidth: 8, minRows: 4 };
  if (isMedia(block.kind)) return { minWidth: 6, minRows: 5 };
  if (block.kind === 'relatedCoverage') return { minWidth: 10, minRows: 5 };
  return { minWidth: 4, minRows: 2 };
}

function contentBottom(blocks) { return blocks.reduce((bottom, block) => { const rect = positionOf(block); return Math.max(bottom, Number.isFinite(rect?.y) && Number.isFinite(rect?.minRows) ? rect.y + rect.minRows : bottom); }, 0); }
function clampLegacyRect(rect, columns, rows, constraints) { const w = Math.max(constraints.minWidth, Math.min(columns, Math.round(Number(rect?.w) || constraints.minWidth))); const minRows = Math.max(constraints.minRows, Math.min(rows, Math.round(Number(rect?.minRows) || constraints.minRows))); return { x: Math.max(0, Math.min(columns - w, Math.round(Number(rect?.x) || 0))), y: Math.max(0, Math.min(Math.max(0, rows - minRows), Math.round(Number(rect?.y) || 0))), w, minRows }; }
const sameRect = (left, right) => left && right && left.x === right.x && left.y === right.y && left.w === right.w && left.minRows === right.minRows;

export function validateRect(rect, workspace, constraints) {
  const columns = Number(workspace?.columns); const rows = Number(workspace?.rows);
  if (!rect || !Number.isInteger(rect.x) || !Number.isInteger(rect.y) || !Number.isInteger(rect.w) || !Number.isInteger(rect.minRows)) return { valid: false, error: 'Geometry must use finite integer grid values.' };
  if (!Number.isInteger(columns) || !Number.isInteger(rows) || columns < 1 || rows < 1) return { valid: false, error: 'Workspace bounds are invalid.' };
  if (rect.x < 0 || rect.y < 0 || rect.w < constraints.minWidth || rect.minRows < constraints.minRows) return { valid: false, error: 'Geometry is below its component minimum.' };
  if (rect.x + rect.w > columns || rect.y + rect.minRows > rows) return { valid: false, error: 'Geometry is outside the workspace.' };
  return { valid: true, rect: { x: rect.x, y: rect.y, w: rect.w, minRows: rect.minRows } };
}
function canPlace(rect, blocks, excludedId) { return !blocks.some((block) => block.id !== excludedId && !block.hidden && rectanglesOverlap(rect, positionOf(block))); }
const workspaceOf = (layoutDefinition) => ({ columns: Number(layoutDefinition?.grid?.columns) || DEFAULT_COLUMNS, rows: Number(layoutDefinition?.workspace?.rows) || 0 });

export function getOccupancy(input, excludedId) { return (input?.blocks || []).filter((block) => block.id !== excludedId && !block.hidden).map((block) => ({ id: block.id, ...positionOf(block) })); }
export function evaluatePlacement(input, blockId, requested, options = {}) {
  const block = (input?.blocks || []).find((item) => item.id === blockId); if (!block) return { state: 'invalid', rect: null, reason: 'missing-block' };
  const original = positionOf(block); const constraints = getBlockConstraints(block); const workspace = workspaceOf(input); const allowFit = options.allowFit !== false;
  const candidate = { x: requested?.x, y: requested?.y, w: requested?.w, minRows: requested?.minRows };
  const candidateValidity = validateRect(candidate, workspace, constraints);
  if (!candidateValidity.valid) return { state: 'invalid', rect: null, reason: candidateValidity.error };
  if (canPlace(candidate, input.blocks || [], blockId)) return { state: 'valid', rect: candidate };
  if (!allowFit || candidate.w !== original.w || candidate.minRows !== original.minRows) return { state: 'invalid', rect: null, reason: 'occupied' };
  let best = null;
  for (let h = original.minRows; h >= constraints.minRows; h -= 1) for (let w = original.w; w >= constraints.minWidth; w -= 1) {
    const fit = { x: candidate.x, y: candidate.y, w, minRows: h };
    if (!validateRect(fit, workspace, constraints).valid || !canPlace(fit, input.blocks || [], blockId)) continue;
    if (!best || fit.w * fit.minRows > best.w * best.minRows) best = fit;
  }
  return best ? { state: 'fitToSpace', rect: best } : { state: 'invalid', rect: null, reason: 'occupied' };
}
export const getDropPreview = evaluatePlacement;
export function commitPlacement(input, blockId, originalRect, evaluation) {
  if (!evaluation || !['valid', 'fitToSpace'].includes(evaluation.state) || !evaluation.rect) return input;
  const block = (input?.blocks || []).find((item) => item.id === blockId); if (!block || block.locked || !sameRect(positionOf(block), originalRect)) return input;
  const verified = evaluatePlacement(input, blockId, evaluation.rect, { allowFit: false });
  if (verified.state !== 'valid' || !sameRect(verified.rect, evaluation.rect)) return input;
  return { ...input, blocks: input.blocks.map((item) => item.id === blockId ? { ...item, layout: { ...item.layout, desktop: { ...evaluation.rect } } } : item) };
}
export function fitWorkspaceToContent(input) { const normalized = normalizeNewsLayout(input); return { ...normalized, workspace: { ...normalized.workspace, rows: Math.max(12, contentBottom(normalized.blocks.filter((block) => !block.hidden)) + WORKSPACE_PADDING) } }; }
export function canReduceWorkspace(input, delta = 8) { const normalized = normalizeNewsLayout(input); return normalized.workspace.rows - delta >= contentBottom(normalized.blocks.filter((block) => !block.hidden)) + WORKSPACE_PADDING; }
export function resizeWorkspace(input, delta) { const normalized = normalizeNewsLayout(input); if (delta < 0 && !canReduceWorkspace(normalized, Math.abs(delta))) return normalized; return { ...normalized, workspace: { ...normalized.workspace, rows: Math.max(12, normalized.workspace.rows + delta) } }; }
export function compactLayout(input) {
  const normalized = normalizeNewsLayout(input);
  const ordered = normalized.blocks.slice().sort((a, b) => positionOf(a).y - positionOf(b).y || positionOf(a).x - positionOf(b).x);
  const rows = [];
  for (const block of ordered) {
    const rect = positionOf(block); const bottom = rect.y + rect.minRows;
    const current = rows.at(-1);
    if (!current || rect.y >= current.bottom) rows.push({ top: rect.y, bottom, blocks: [block] });
    else { current.blocks.push(block); current.bottom = Math.max(current.bottom, bottom); }
  }
  let cursor = 0; const patches = new Map();
  for (const row of rows) {
    const delta = cursor - row.top;
    for (const block of row.blocks) patches.set(block.id, { ...positionOf(block), y: positionOf(block).y + delta });
    cursor += row.bottom - row.top + 2;
  }
  const next = { ...normalized, blocks: normalized.blocks.map((block) => patches.has(block.id) ? { ...block, layout: { ...block.layout, desktop: patches.get(block.id) } } : block) };
  return fitWorkspaceToContent(next);
}

export function validateNewsLayout(input) {
  const errors = []; if (!input || typeof input !== 'object') return { valid: false, errors: ['Layout must be an object.'] }; const blocks = Array.isArray(input.blocks) ? input.blocks : []; const columns = Number(input.grid?.columns) || DEFAULT_COLUMNS; const rows = Number(input.workspace?.rows) || Math.max(12, contentBottom(blocks) + WORKSPACE_PADDING); const seen = new Set(); const singletons = new Set();
  for (const block of blocks) { const definition = BLOCK_DEFINITIONS[block?.kind]; if (!definition) { errors.push(`Unknown block kind: ${block?.kind || 'missing'}.`); continue; } if (!block.id || seen.has(block.id)) errors.push('Each block must have a unique id.'); seen.add(block.id); if (definition.singleton && singletons.has(block.kind)) errors.push(`${definition.label} can appear only once.`); if (definition.singleton) singletons.add(block.kind); const rect = positionOf(block); if (!Number.isInteger(rect.x) || !Number.isInteger(rect.y) || !Number.isInteger(rect.w) || !Number.isInteger(rect.minRows) || rect.x < 0 || rect.y < 0 || rect.w < 1 || rect.minRows < 1 || rect.x + rect.w > columns || rect.y + rect.minRows > rows) errors.push(`Invalid canvas bounds for ${definition.label}.`); }
  if (!blocks.some((block) => block?.binding === 'headline' && !block.hidden)) errors.push('A visible Headline block is required.');
  for (let index = 0; index < blocks.length; index += 1) for (let next = index + 1; next < blocks.length; next += 1) if (rectanglesOverlap(positionOf(blocks[index]), positionOf(blocks[next]))) errors.push(`Blocks overlap: ${blocks[index].label || blocks[index].kind} and ${blocks[next].label || blocks[next].kind}.`);
  return { valid: errors.length === 0, errors };
}

export function normalizeNewsLayout(input) {
  const source = input && typeof input === 'object' ? copy(input) : copy(DEFAULT_AEGIS_LAYOUT); const sourceColumns = Number(source.grid?.columns) || 12; const factor = sourceColumns === 12 ? 2 : 1; const rawBlocks = Array.isArray(source.blocks) ? source.blocks : [];
  const blocks = rawBlocks.map((raw, index) => { const definition = BLOCK_DEFINITIONS[raw?.kind]; if (!definition) return null; const sourceRect = raw.layout?.desktop || {}; const rect = { x: Math.round((Number(sourceRect.x) || 0) * factor), y: Math.max(0, Math.round(Number.isFinite(Number(sourceRect.y)) ? Number(sourceRect.y) : index * 6)), w: Math.round((Number(sourceRect.w) || definition.defaultWidth / factor) * factor), minRows: Math.max(1, Math.round(Number(sourceRect.minRows) || definition.defaultRows)) }; const constraints = getBlockConstraints({ kind: raw.kind }); const desktop = clampLegacyRect(rect, DEFAULT_COLUMNS, Number(source.workspace?.rows) || 10000, constraints); return { ...createLayoutBlock(raw.kind, desktop, raw.settings || {}), ...raw, id: String(raw.id || `${raw.kind}-${index + 1}`), label: String(raw.label || definition.label).slice(0, 80), priority: ['required', 'preferred', 'optional'].includes(raw.priority) ? raw.priority : definition.required ? 'required' : definition.optional ? 'optional' : 'preferred', collapseWhenEmpty: raw.collapseWhenEmpty !== false, layout: { ...raw.layout, desktop }, settings: { ...defaultSettings(raw.kind), ...(raw.settings || {}) } }; }).filter(Boolean);
  const requestedRows = Number(source.workspace?.rows); const rows = Math.max(12, requestedRows || 0, contentBottom(blocks) + WORKSPACE_PADDING);
  const normalized = { ...copy(DEFAULT_AEGIS_LAYOUT), ...source, schemaVersion: NEWS_LAYOUT_SCHEMA_VERSION, grid: { ...DEFAULT_AEGIS_LAYOUT.grid, ...(source.grid || {}), columns: DEFAULT_COLUMNS }, workspace: { rows }, globalSettings: { ...DEFAULT_AEGIS_LAYOUT.globalSettings, ...(source.globalSettings || {}) }, blocks };
  return validateNewsLayout(normalized).errors.some((error) => /visible Headline|Unknown block kind|Layout must/.test(error)) ? copy(DEFAULT_AEGIS_LAYOUT) : normalized;
}

export function createLayoutFromTemplate(template = DEFAULT_AEGIS_LAYOUT, name = template.name) { const result = normalizeNewsLayout(template); result.id = `layout-${crypto.randomUUID?.() || Math.random().toString(36).slice(2)}`; result.name = name; result.blocks = result.blocks.map((block) => ({ ...block, id: `${block.kind}-${crypto.randomUUID?.() || Math.random().toString(36).slice(2)}` })); return result; }
const uniqueId = (kind) => `${kind}-${crypto.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`}`;
const updateBlock = (input, id, change) => ({ ...input, blocks: (input?.blocks || []).map((block) => block.id === id ? change(block) : block) });
function nearbyRect(input, block, anchor = null) {
  const normalized = normalizeNewsLayout(input); const workspace = workspaceOf(normalized); const base = positionOf(block); const constraints = getBlockConstraints(block);
  const target = anchor || base; const candidates = [];
  for (let y = 0; y <= workspace.rows - constraints.minRows; y += 1) for (let x = 0; x <= workspace.columns - constraints.minWidth; x += 1) {
    for (let w = Math.min(base.w, workspace.columns - x); w >= constraints.minWidth; w -= 1) for (let h = Math.min(base.minRows, workspace.rows - y); h >= constraints.minRows; h -= 1) {
      const rect = { x, y, w, minRows: h };
      if (!canPlace(rect, normalized.blocks, block.id)) continue;
      const sizeLoss = (base.w * base.minRows) - (w * h);
      candidates.push({ rect, score: Math.abs(x - target.x) + Math.abs(y - target.y) * 1.5 + sizeLoss * .15 });
      break;
    }
  }
  candidates.sort((left, right) => left.score - right.score || left.rect.y - right.rect.y || left.rect.x - right.rect.x);
  return candidates[0]?.rect || null;
}

export function addLayoutBlock(input, kind, context = {}) {
  const normalized = normalizeNewsLayout(input); const definition = BLOCK_DEFINITIONS[kind];
  if (!definition || definition.singleton && normalized.blocks.some((block) => block.kind === kind)) return normalized;
  const anchor = context.anchor || { x: 0, y: Math.max(0, Math.min(normalized.workspace.rows - definition.defaultRows, Number(context.viewportY) || 0)) };
  const block = createLayoutBlock(kind, { x: 0, y: 0, w: definition.defaultWidth, minRows: definition.defaultRows });
  const rect = nearbyRect(normalized, block, anchor);
  if (!rect) return { ...normalized, placementError: 'No available space for this block. Add workspace or compact the layout.' };
  block.layout.desktop = rect;
  return { ...normalized, blocks: [...normalized.blocks, block] };
}
export function duplicateLayoutBlock(input, id, context = {}) {
  const normalized = normalizeNewsLayout(input); const source = normalized.blocks.find((block) => block.id === id); if (!source) return normalized;
  const clone = copy(source); clone.id = uniqueId(source.kind); clone.label = `${source.label || BLOCK_DEFINITIONS[source.kind].label} copy`.slice(0, 80);
  clone.layout.desktop = { ...positionOf(source) };
  const sourceRect = positionOf(source); const rect = nearbyRect(normalized, clone, context.anchor || { x: Math.min(normalized.grid.columns - sourceRect.w, sourceRect.x + sourceRect.w + 1), y: sourceRect.y });
  if (!rect) return { ...normalized, placementError: 'No available space for this block. Add workspace or compact the layout.' };
  clone.layout.desktop = rect;
  return { ...normalized, blocks: [...normalized.blocks, clone] };
}export function removeLayoutBlock(input, id) { const normalized = normalizeNewsLayout(input); const block = normalized.blocks.find((item) => item.id === id); return !block || block.binding === 'headline' ? normalized : { ...normalized, blocks: normalized.blocks.filter((item) => item.id !== id) }; }
export function renameLayoutBlock(input, id, label) { return updateBlock(input, id, (block) => ({ ...block, label: String(label || '').trim().slice(0, 80) || BLOCK_DEFINITIONS[block.kind].label })); }
export function moveLayoutBlock(input, id, placement) { const block = (input?.blocks || []).find((item) => item.id === id); if (!block) return input; const original = positionOf(block); return commitPlacement(input, id, original, evaluatePlacement(input, id, placement, { allowFit: false })); }
export function resizeLayoutBlock(input, id, dimensions) { const block = (input?.blocks || []).find((item) => item.id === id); if (!block) return input; const original = positionOf(block); return commitPlacement(input, id, original, evaluatePlacement(input, id, { ...original, ...dimensions }, { allowFit: false })); }
export function updateLayoutBlock(input, id, patch) { return updateBlock(input, id, (block) => ({ ...block, ...patch, settings: { ...block.settings, ...(patch.settings || {}) } })); }

export function buildLayoutContentManifest(layoutDefinition) { const normalized = normalizeNewsLayout(layoutDefinition); const blocks = normalized.blocks.filter((block) => !block.hidden); const dynamic = blocks.filter((block) => block.binding === 'dynamicSection'); const media = (binding) => blocks.filter((block) => block.binding === binding); const hero = media('heroMedia')[0]; return { version: NEWS_LAYOUT_SCHEMA_VERSION, required: { headline: blocks.some((block) => block.binding === 'headline'), intro: blocks.some((block) => block.binding === 'intro') }, dynamicSections: { count: Math.min(12, dynamic.length), items: dynamic.map((block) => { const contentRole = block.settings?.contentRole && block.settings.contentRole !== 'auto' ? block.settings.contentRole : block.settings?.purpose || 'auto'; const density = block.settings?.density || block.settings?.depth || 'auto'; return { id: block.id, label: block.label, purpose: contentRole, contentRole, density, depth: density, instruction: String(block.settings?.instruction || '').slice(0, 500) }; }) }, heroMedia: { maxItems: Math.min(8, Math.max(0, Number(hero?.settings?.maxItems) || (hero ? 4 : 0))) }, supportingMedia: Math.min(6, media('supportingMedia').length), timeline: blocks.some((block) => block.binding === 'timeline') ? 'optional' : 'none', quote: blocks.some((block) => block.binding === 'insight') ? 'optional' : 'none', relatedCoverage: Math.min(10, blocks.some((block) => block.binding === 'relatedCoverage') ? 6 : 0) }; }

const hasContent = (block, news) => { const sections = news?.briefingSections || news?.briefing_sections || []; const media = news?.mediaPlan || news?.media_plan || {}; return Boolean({ topStoryLabel: news?.headline, headline: news?.headline, metadata: news?.publishedAt || news?.updatedAt, intro: news?.body || news?.summary, bodyText: news?.body || news?.summary, dynamicSection: sections.length, timeline: (news?.timeline || []).length, insight: news?.insight?.text, whatToWatch: news?.whatToWatch || news?.what_to_watch, list: (news?.keyPoints || news?.key_points || news?.timeline || []).length || news?.whatToWatch, heroMedia: (media.heroMedia || media.hero_media || []).length, supportingMedia: (media.supportingMedia || media.supporting_media || []).length, mediaGallery: (news?.media || []).length, relatedCoverage: (news?.relatedStories || news?.related_stories || []).length, sourceCoverage: (news?.sources || []).length, fullSearchAction: (news?.fullSearchResults || news?.full_search_results || []).length, divider: true }[block.binding]); };
function rectForBreakpoint(block, breakpoint = 'desktop') {
  return { ...positionOf(block), ...(block.layout?.[breakpoint] || {}) };
}

// Produces a content-flow view from the exact saved canvas rectangles.  It deliberately
// does not turn a lone block into a full-width row or preserve empty editor tracks.
// Connected vertical ranges form one editorial band; each band owns only the rows it uses.
export function resolveRenderFlow(layoutDefinition, news, mode = 'live', breakpoint = 'desktop') {
  const normalized = normalizeNewsLayout(layoutDefinition);
  let dynamicIndex = 0;
  const visible = normalized.blocks.map((block) => {
    if (block.hidden) return null;
    const rect = rectForBreakpoint(block, breakpoint);
    if (block.binding === 'dynamicSection') {
      const contentIndex = dynamicIndex; dynamicIndex += 1;
      const sections = news?.briefingSections || news?.briefing_sections || [];
      return { ...block, layout: rect, contentIndex, hasAssignedContent: Boolean(sections[contentIndex]?.body || sections[contentIndex]?.content || sections[contentIndex]?.text) };
    }
    return { ...block, layout: rect, hasAssignedContent: hasContent(block, news) };
  }).filter((block) => block && (mode !== 'live' || block.hasAssignedContent || !block.collapseWhenEmpty));
  const ordered = visible.sort((left, right) => left.layout.y - right.layout.y || left.layout.x - right.layout.x);
  const bands = [];
  let current = null;
  for (const block of ordered) {
    const top = block.layout.y; const bottom = top + block.layout.minRows;
    if (!current || top >= current.bottom) {
      current = { y: top, bottom, blocks: [block] };
      bands.push(current);
    } else {
      current.blocks.push(block); current.bottom = Math.max(current.bottom, bottom);
    }
  }
  return {
    columns: normalized.grid.columns,
    gap: Number(normalized.grid?.gap) || 14,
    blocks: visible,
    bands: bands.map((band) => {
      const lines = [...new Set(band.blocks.map((block) => block.layout.y))].sort((a, b) => a - b);
      return {
        y: band.y,
        rows: Math.max(1, lines.length),
        blocks: band.blocks.map((block) => {
          const start = lines.indexOf(block.layout.y) + 1;
          const last = block.layout.y + block.layout.minRows;
          const endLine = lines.findIndex((line) => line >= last);
          return { ...block, renderStart: start, renderSpan: Math.max(1, (endLine === -1 ? lines.length + 1 : endLine) - start) };
        }),
      };
    }),
  };
}

// Legacy public resolver preserves its historical optional-sibling fill behaviour.
// Preview uses resolveRenderFlow directly so the user's selected widths remain exact.
export function resolveNewsLayout(layoutDefinition, news, breakpoint = 'desktop') {
  const flow = resolveRenderFlow(layoutDefinition, news, 'live', breakpoint);
  return { ...flow, bands: flow.bands.map((band) => {
    if (band.blocks.length !== 1 || band.blocks[0].layout.w >= flow.columns || band.blocks[0].settings?.fillWhenSiblingEmpty === false) return band;
    const block = band.blocks[0];
    return { ...band, blocks: [{ ...block, layout: { ...block.layout, x: 0, w: flow.columns } }] };
  }) };
}
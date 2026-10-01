const number = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;

export const mediaBand = (item) => {
  const ratio = number(item?.aspectRatio) || (number(item?.width) && number(item?.height) ? number(item.width) / number(item.height) : 1);
  const type = String(item?.type || item?.imageType || '').toLowerCase();
  if (/chart|diagram|graphic|logo|screenshot|infographic|document/.test(type)) return 'graphic';
  if (ratio < 0.8) return 'portrait';
  if (ratio <= 1.15) return 'square';
  if (ratio <= 1.8) return 'landscape';
  return 'wide';
};

export const groupNewsMedia = (items) => {
  const buckets = new Map();
  (Array.isArray(items) ? items : []).filter((item) => item?.id && item?.url).forEach((item) => {
    const key = `${item.relatedSectionId || 'primary'}:${mediaBand(item)}`;
    const group = buckets.get(key) || { id: key, sectionId: item.relatedSectionId || '', band: mediaBand(item), items: [] };
    if (!group.items.some((existing) => existing.url === item.url)) group.items.push(item);
    buckets.set(key, group);
  });
  return [...buckets.values()];
};

export const resolveNewsMediaLayout = (items, containerWidth = 0, context = {}) => {
  const usable = Array.isArray(items) ? items.filter((item) => item?.url) : [];
  const first = usable[0]; const band = mediaBand(first);
  if (!first) return { presentation: 'none', fit: 'contain', band: 'none' };
  if (band === 'graphic') return { presentation: 'containedGraphic', fit: 'contain', band };
  if (usable.length > 1 && containerWidth >= 420) return { presentation: band === 'portrait' ? 'portraitPair' : 'carousel', fit: band === 'wide' ? 'cover' : 'contain', band };
  if ((band === 'portrait' || band === 'square') && context.hasSupportingText && containerWidth >= 440) return { presentation: 'mediaWithText', fit: 'contain', band };
  if (band === 'wide') return { presentation: 'wideHero', fit: 'cover', band };
  if (band === 'landscape') return { presentation: 'standardHero', fit: 'cover', band };
  return { presentation: band === 'portrait' ? 'portraitFeature' : 'squareFeature', fit: 'contain', band };
};

const isEditorialQuality = (item) => {
  const width = number(item?.width); const height = number(item?.height); const quality = number(item?.qualityScore);
  return !(width && width < 480) && !(height && height < 270) && quality >= 0;
};

export const resolveEditorialMediaPlan = (items, plan = {}) => {
  const all = (Array.isArray(items) ? items : []).filter((item) => item?.id && item?.url && isEditorialQuality(item));
  const ordered = [...all].sort((a, b) => number(b.qualityScore) - number(a.qualityScore));
  const claimed = new Set();
  const take = (source, count) => (Array.isArray(source) ? source : ordered)
    .map((candidate) => typeof candidate === 'string' ? all.find((item) => item.id === candidate) : candidate)
    .filter((item) => item?.url && !claimed.has(item.url) && all.some((known) => known.id === item.id))
    .slice(0, count)
    .map((item) => { claimed.add(item.url); return item; });
  const hero = take(plan.heroMedia || plan.hero_media || ordered.filter((item) => item.recommendedSlot === 'hero'), 4);
  const supporting = take(plan.supportingMedia || plan.supporting_media || ordered.filter((item) => item.recommendedSlot === 'supporting'), 2);
  const quote = take(plan.quoteMedia || plan.quote_media || ordered.filter((item) => item.recommendedSlot === 'quote'), 1);
  const related = take(plan.relatedCoverageMedia || plan.related_coverage_media || ordered.filter((item) => item.recommendedSlot === 'related'), 6);
  return { hero, supporting, quote, related };
};

export const hasEditorialMediaRail = (plan) => ['hero', 'supporting', 'quote']
  .some((slot) => Array.isArray(plan?.[slot]) && plan[slot].length > 0);

export const resolveEditorialSectionLayout = (section, media) => {
  const item = (Array.isArray(media) ? media : []).find((candidate) => candidate?.url);
  if (!item) return { variant: 'text', media: null };
  const band = mediaBand(item);
  if (band === 'graphic') return { variant: 'fullMedia', media: item };
  if (band === 'portrait' || band === 'square') return { variant: 'mediaLeftText', media: item };
  return { variant: 'textRightMedia', media: item };
};

const compactBriefingText = (value) => String(value || '')
  .replace(/(?:\s*(?:\.\.\.|…)\s*)+$/g, '')
  .replace(/\s+/g, ' ')
  .trim()
  .toLocaleLowerCase();

export const normalizeBriefingSections = (sections, leadText = '') => {
  const seen = new Set([compactBriefingText(leadText)]);
  return (Array.isArray(sections) ? sections : []).flatMap((section) => {
    const body = String(section?.body || '').replace(/(?:\s*(?:\.\.\.|…)\s*)+$/g, '').trim();
    const fingerprint = compactBriefingText(body);
    if (fingerprint.length < 24 || seen.has(fingerprint)) return [];
    seen.add(fingerprint);
    return [{ ...section, body }];
  });
};

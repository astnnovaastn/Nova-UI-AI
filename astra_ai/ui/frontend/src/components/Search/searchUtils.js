const HEADING_ALIASES = new Map([
  ['direct answer', 'Direct Answer'],
  ['additional information', 'Additional Information'],
  ['background and context', 'Background and Context'],
  ['current relevance', 'Current Relevance'],
  ['key facts and details', 'Key Facts and Details'],
  ['comparisons and alternatives', 'Comparisons and Alternatives'],
  ['practical applications', 'Practical Applications'],
  ['challenges and considerations', 'Challenges and Considerations'],
  ['future outlook', 'Future Outlook'],
  ['conclusion', 'Conclusion'],
  ['sources', 'Sources'],
]);

const cleanHeading = (value) => String(value || '')
  .replace(/^\s{0,3}#{1,6}\s*/, '')
  .replace(/^\s*\*\*(.*?)\*\*\s*:?[ \t]*$/, '$1')
  .replace(/:\s*$/, '')
  .trim()
  .toLowerCase();

export const parseSearchAnswer = (answer) => {
  const text = String(answer || '')
    .replace(/\r\n?/g, '\n')
    .replace(/^(?:\s*SEARCH(?:_|\s+)RESULT\s*:?\s*)+/i, '')
    .trim();
  if (!text) return { directAnswer: '', sections: [] };

  const lines = text.split('\n');
  const foundHeading = lines.some((line) => HEADING_ALIASES.has(cleanHeading(line)));
  if (!foundHeading) return { directAnswer: text, sections: [] };

  const collected = [];
  let current = { title: 'Direct Answer', body: [] };
  const flush = () => {
    const body = current.body.join('\n').trim();
    if (body) collected.push({ title: current.title, body });
  };

  lines.forEach((line) => {
    const recognized = HEADING_ALIASES.get(cleanHeading(line));
    if (recognized) {
      flush();
      current = { title: recognized, body: [] };
    } else {
      current.body.push(line);
    }
  });
  flush();

  const direct = collected.find((section) => section.title === 'Direct Answer');
  return {
    directAnswer: direct?.body || '',
    sections: collected.filter((section) => section !== direct),
  };
};

const asText = (...values) => {
  const found = values.find((value) => value !== null && value !== undefined && String(value).trim());
  return found === undefined ? '' : String(found).trim();
};

export const safeExternalUrl = (value) => {
  try {
    const url = new URL(String(value || ''));
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : '';
  } catch {
    return '';
  }
};

export const domainFromUrl = (value) => {
  try {
    return new URL(String(value || '')).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
};

const cleanSourceLabel = (value) => String(value || '')
  .replace(/^https?:\/\//i, '')
  .replace(/^www\./i, '')
  .replace(/\/$/, '')
  .trim();

export const normalizeSearchResults = (items) => {
  if (!Array.isArray(items)) return [];
  return items.filter((item) => item && typeof item === 'object').map((item, index) => {
    const sourceValue = asText(item.source_name, item.publisher, item.source, item.domain);
    const sourceUrl = safeExternalUrl(sourceValue);
    const link = safeExternalUrl(asText(item.link, item.url, sourceUrl));
    const title = asText(item.title, item.headline, item.name, item.question, `Result ${index + 1}`);
    const domain = cleanSourceLabel(asText(item.domain, domainFromUrl(sourceUrl), domainFromUrl(link)));
    const source = cleanSourceLabel(asText(sourceUrl ? domainFromUrl(sourceUrl) : sourceValue, domain, 'Web source'));
    return {
      id: asText(item.id, item.result_id, item.request_id, `${index}-${title}`),
      title,
      snippet: asText(item.snippet, item.answer, item.summary, item.description, item.excerpt),
      link,
      source,
      source_name: source,
      domain: domain || source,
      date: asText(item.date, item.published_at, item.published),
      thumbnail: safeExternalUrl(asText(item.thumbnail, item.image, item.image_url)),
      position: asText(item.position, item.rank),
      relevance: asText(item.relevance, item.score),
      kind: asText(item.type, item.result_type, item.kind, 'web').toLowerCase(),
    };
  });
};

export const compactSearchSources = (results, limit = 3) => {
  const seen = new Set();
  return normalizeSearchResults(results).filter((result) => {
    if (!result.link) return false;
    const key = (result.domain || domainFromUrl(result.link) || result.link).toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, Math.max(0, limit));
};

export const normalizeSearchHistory = (items) => {
  if (!Array.isArray(items)) return [];
  return items.filter(Boolean).map((entry, index) => ({
    id: asText(entry.request_id, `history-${index}`),
    request_id: asText(entry.request_id),
    display_topic: asText(entry.display_topic, entry.query, 'Search result'),
    display_subtopic: asText(entry.display_subtopic),
    query: asText(entry.query),
    saved_at: asText(entry.saved_at, entry.timestamp),
    error: asText(entry.error),
  }));
};

export const formatSavedAt = (value) => {
  if (!value) return 'Saved recently';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(date);
};

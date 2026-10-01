import test from 'node:test';
import assert from 'node:assert/strict';
import {
  compactSearchSources,
  formatSavedAt,
  normalizeSearchHistory,
  normalizeSearchResults,
  parseSearchAnswer,
} from './searchUtils.js';

test('parses recognized answer headings without manufacturing results', () => {
  const parsed = parseSearchAnswer(`## Direct Answer\nA concise answer.\n\n**Additional Information**\nUseful context.\n\nConclusion:\nA final note.`);
  assert.equal(parsed.directAnswer, 'A concise answer.');
  assert.deepEqual(parsed.sections, [
    { title: 'Additional Information', body: 'Useful context.' },
    { title: 'Conclusion', body: 'A final note.' },
  ]);
});

test('normalizes structured source metadata and builds a safe deduplicated preview', () => {
  const results = [
    { title: 'First report', link: 'https://www.example.test/one', source_name: 'Example Research' },
    { title: 'Duplicate report', link: 'https://www.example.test/one', publisher: 'Example' },
    { title: 'Second report', link: 'https://news.test/two', domain: 'news.test' },
    { title: 'Unsafe report', link: 'javascript:alert(1)', source: 'https://unsafe.test' },
  ];
  const normalized = normalizeSearchResults(results);
  assert.equal(normalized[0].source_name, 'Example Research');
  assert.equal(normalized[0].domain, 'example.test');
  assert.deepEqual(compactSearchSources(results).map((item) => item.title), ['First report', 'Second report']);
});

test('keeps an unstructured answer intact as the direct answer', () => {
  const answer = 'Paragraph one.\n\nParagraph two.';
  assert.deepEqual(parseSearchAnswer(answer), { directAnswer: answer, sections: [] });
});

test('strips repeated legacy result markers before parsing the real direct answer', () => {
  const parsed = parseSearchAnswer('SEARCH_RESULT: SEARCH RESULT\n\nDirect Answer\nThe requested topic.\n\nAdditional Information\nMore context.');
  assert.equal(parsed.directAnswer, 'The requested topic.');
  assert.deepEqual(parsed.sections, [{ title: 'Additional Information', body: 'More context.' }]);
});

test('normalizes heterogeneous result fields and rejects unsafe links', () => {
  const results = normalizeSearchResults([
    { headline: 'News title', url: 'https://news.example.test/story', summary: 'Summary', published: 'Today' },
    { name: 'Knowledge entity', answer: 'Known fact', type: 'knowledge_graph' },
    { title: 'Unsafe', link: 'javascript:alert(1)', image: 'data:text/html,bad' },
  ]);
  assert.equal(results[0].source, 'news.example.test');
  assert.equal(results[0].snippet, 'Summary');
  assert.equal(results[1].link, '');
  assert.equal(results[1].snippet, 'Known fact');
  assert.equal(results[2].link, '');
  assert.equal(results[2].thumbnail, '');
});

test('uses an http source URL as the clickable result fallback', () => {
  const [result] = normalizeSearchResults([{ title: 'Report', source: 'https://source.example/report' }]);
  assert.equal(result.link, 'https://source.example/report');
  assert.equal(result.domain, 'source.example');
});

test('maps saved_at into history and formats valid dates', () => {
  const history = normalizeSearchHistory([{ request_id: 'one', query: 'Astra', saved_at: '2026-08-07T09:30:00+02:00' }]);
  assert.equal(history[0].saved_at, '2026-08-07T09:30:00+02:00');
  assert.notEqual(formatSavedAt(history[0].saved_at), 'Saved recently');
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { addDays, dateKey, monthRange, startOfWeek, viewRange } from './calendarUtils.js';

test('month range always renders six complete weeks', () => {
  const monday = monthRange(new Date(2026, 6, 1, 12), 1);
  const sunday = monthRange(new Date(2026, 6, 1, 12), 0);
  assert.equal(monday.length, 42);
  assert.equal(sunday.length, 42);
  assert.equal(monday[0].getDay(), 1);
  assert.equal(sunday[0].getDay(), 0);
});

test('week range honors configured first day', () => {
  const focus = new Date(2026, 6, 20, 12);
  assert.equal(startOfWeek(focus, 1).getDay(), 1);
  assert.equal(startOfWeek(focus, 0).getDay(), 0);
  const range = viewRange('week', focus, 1);
  assert.equal(dateKey(range.end), dateKey(addDays(range.start, 7)));
});

test('year range includes leap-year boundary without drift', () => {
  const range = viewRange('year', new Date(2028, 1, 29, 12), 1);
  assert.equal(dateKey(range.start), '2028-01-01');
  assert.equal(dateKey(range.end), '2029-01-01');
});

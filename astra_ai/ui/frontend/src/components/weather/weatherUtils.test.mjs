import { test } from 'node:test';
import assert from 'node:assert/strict';
import { convertWeatherValue, clampWeatherWindow } from './weatherUtils.js';
test('metric values convert without turning missing values into zero', () => {
  assert.equal(convertWeatherValue(20, 'temperature', 'imperial'), 68);
  assert.equal(convertWeatherValue(16, 'wind', 'imperial'), 9.9);
  assert.equal(convertWeatherValue(25.4, 'precipitation', 'imperial'), 1);
  assert.equal(convertWeatherValue(null, 'temperature', 'imperial'), '--');
  assert.equal(convertWeatherValue('--', 'temperature', 'imperial'), '--');
});
test('window geometry is finite and contained even on a small viewport', () => {
  assert.deepEqual(clampWeatherWindow({ x: 28, y: 24, width: 640, height: 500 }, 390, 844), { x: 10, y: 24, width: 370, height: 500 });
  const result = clampWeatherWindow({ x: NaN, y: -40, width: -1, height: Infinity }, 1440, 900);
  assert.equal(result.width, 420);
  assert.equal(result.height, 500);
  assert.equal(result.y, 10);
});

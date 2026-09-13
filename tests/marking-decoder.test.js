import test from 'node:test';
import assert from 'node:assert/strict';
import { decodeMarking } from '../src/domain/marking-decoder.js';

test('decodes mm/m as diameter plus length without extra conversion', () => {
  const result = decodeMarking('0,20 mm / 140 m');
  assert.equal(result.kind, 'mm-m');
  assert.equal(result.values.diameterMm, 0.20);
  assert.equal(result.values.lengthM, 140);
});

test('decodes lb/yd and only converts the length safely', () => {
  const result = decodeMarking('8 lb / 100 yd');
  assert.equal(result.kind, 'lb-yd');
  assert.equal(result.values.pounds, 8);
  assert.equal(result.values.yards, 100);
  assert.equal(result.values.meters, 91.44);
  assert.match(result.warning, /lb.*mm/i);
});

test('decodes PE to denier without inventing mm or lb', () => {
  const result = decodeMarking('PE #1.2 / 150 m');
  assert.equal(result.kind, 'pe');
  assert.equal(result.values.pe, 1.2);
  assert.equal(result.values.denier, 240);
  assert.equal(result.values.lengthM, 150);
  assert.equal('diameterMm' in result.values, false);
  assert.equal('pounds' in result.values, false);
});

test('decodes explicit No. marking but does not turn it into diameter', () => {
  const result = decodeMarking('No. 2 / 150 m');
  assert.equal(result.kind, 'no');
  assert.equal(result.values.number, 2);
  assert.equal(result.values.lengthM, 150);
  assert.equal('diameterMm' in result.values, false);
});

test('supports Japanese number sign and returns unknown for unsupported text', () => {
  assert.equal(decodeMarking('号 1.5 / 100 m').kind, 'no');
  assert.equal(decodeMarking('2500S').kind, 'unknown');
  assert.equal(decodeMarking('').kind, 'unknown');
});

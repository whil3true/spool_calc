import test from 'node:test';
import assert from 'node:assert/strict';
import { conditionalCapacity, estimateMonoLength, summarizeReferencePairs } from '../src/domain/capacity.js';
import { estimateBackingLength } from '../src/domain/backing.js';
import { MATERIAL, rangeAround, uncertaintyFraction } from '../src/domain/uncertainty.js';
import { classifyMarking, peToDenier, yardsToMeters } from '../src/domain/units.js';
import { parseLocalizedNumber } from '../src/domain/number.js';
import { validatePositiveInput } from '../src/domain/validation.js';
import { reelProfiles } from './fixtures/reels.js';

test('mono formula reproduces known Shimano pair within report-scale error', () => {
  assert.ok(Math.abs(estimateMonoLength(170, 0.18, 0.20) - 137.7) < 0.1);
});

test('multiple passport pairs use median conditional capacity and expose spread', () => {
  const summary = summarizeReferencePairs(reelProfiles[0].pairs);
  assert.equal(summary.capacities.length, 3);
  assert.ok(summary.capacity > 5 && summary.capacity < 6);
  assert.ok(summary.spreadRatio > 0);
});

test('regression profiles remain internally plausible', () => {
  for (const profile of reelProfiles) {
    const summary = summarizeReferencePairs(profile.pairs);
    assert.ok(summary.spreadRatio < 0.25, `${profile.name} spread unexpectedly changed`);
    for (const pair of profile.pairs) {
      const predicted = summary.capacity / pair.diameterMm ** 2;
      const relativeError = Math.abs(predicted - pair.lengthM) / pair.lengthM;
      assert.ok(relativeError < 0.20, `${profile.name} regression error too high`);
    }
  }
});

test('backing returns zero and overflow flag when main line already exceeds capacity', () => {
  const result = estimateBackingLength({ capacity: conditionalCapacity(100, 0.20), mainLengthM: 150, mainDiameterMm: 0.20, backingDiameterMm: 0.25 });
  assert.equal(result.backingLengthM, 0);
  assert.equal(result.exceedsCapacity, true);
});

test('uncertainty is wider for braid than mono', () => {
  const mono = uncertaintyFraction({ material: MATERIAL.MONO, referencePairCount: 3, spreadRatio: 0.03, diameterRatio: 1.2 });
  const braid = uncertaintyFraction({ material: MATERIAL.BRAID_MM, referencePairCount: 3, spreadRatio: 0.03, diameterRatio: 1.2 });
  assert.ok(braid > mono);
  const range = rangeAround(100, 0.1);
  assert.equal(range.min, 90);
  assert.ok(Math.abs(range.max - 110) < Number.EPSILON * 100);
});

test('PE converts only to denier, while decoder keeps unit meanings separate', () => {
  assert.equal(peToDenier(1.5), 300);
  assert.equal(classifyMarking('PE #1.2 / 150 m').kind, 'pe');
  assert.equal(classifyMarking('8 lb / 100 yd').kind, 'lb-yd');
  assert.equal(classifyMarking('0.20 mm / 140 m').kind, 'mm-m');
});

test('localized parsing accepts comma and dot but rejects junk', () => {
  assert.equal(parseLocalizedNumber('0,25'), 0.25);
  assert.equal(parseLocalizedNumber('0.25'), 0.25);
  assert.ok(Number.isNaN(parseLocalizedNumber('0.25mm')));
});

test('validation rejects empty, zero, negative and extreme values', () => {
  assert.equal(validatePositiveInput('', { label: 'Диаметр' }).ok, false);
  assert.equal(validatePositiveInput('0', { label: 'Диаметр' }).ok, false);
  assert.equal(validatePositiveInput('-1', { label: 'Диаметр' }).ok, false);
  assert.equal(validatePositiveInput('999', { label: 'Диаметр', max: 20 }).ok, false);
});

test('unit conversion yard to meter is exact by definition', () => {
  assert.equal(yardsToMeters(100), 91.44);
});

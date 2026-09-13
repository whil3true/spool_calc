import test from 'node:test';
import assert from 'node:assert/strict';
import { estimateSpoolCapacity } from '../src/domain/capacity-estimate.js';
import { MATERIAL } from '../src/domain/uncertainty.js';

test('capacity estimate uses multiple pairs and exposes a bounded mono range', () => {
  const result = estimateSpoolCapacity({
    referencePairs: [
      { diameterMm: 0.18, lengthM: 170 },
      { diameterMm: 0.20, lengthM: 140 },
      { diameterMm: 0.25, lengthM: 90 },
    ],
    targetDiameterMm: 0.22,
    material: MATERIAL.MONO,
  });
  assert.ok(result.center > 110 && result.center < 120);
  assert.equal(result.consistency, 'good');
  assert.equal(result.confidence, 'medium');
  assert.ok(result.range.min < result.center && result.range.max > result.center);
});

test('braid by declared mm is explicitly lower confidence and wider', () => {
  const input = {
    referencePairs: [{ diameterMm: 0.20, lengthM: 140 }],
    targetDiameterMm: 0.18,
  };
  const mono = estimateSpoolCapacity({ ...input, material: MATERIAL.MONO });
  const braid = estimateSpoolCapacity({ ...input, material: MATERIAL.BRAID_MM });
  assert.equal(braid.confidence, 'low');
  assert.ok(braid.uncertaintyFraction > mono.uncertaintyFraction);
});

test('poorly consistent passport pairs lower confidence instead of hiding disagreement', () => {
  const result = estimateSpoolCapacity({
    referencePairs: [
      { diameterMm: 0.20, lengthM: 200 },
      { diameterMm: 0.25, lengthM: 100 },
    ],
    targetDiameterMm: 0.22,
    material: MATERIAL.MONO,
  });
  assert.equal(result.consistency, 'poor');
  assert.equal(result.confidence, 'low');
});

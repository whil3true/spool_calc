import test from 'node:test';
import assert from 'node:assert/strict';
import { estimateBackingPlan } from '../src/domain/backing-estimate.js';
import { MATERIAL } from '../src/domain/uncertainty.js';

const spool = [
  { diameterMm: 0.18, lengthM: 170 },
  { diameterMm: 0.20, lengthM: 140 },
  { diameterMm: 0.25, lengthM: 90 },
];

test('mono backing plan returns a positive estimate and range', () => {
  const result = estimateBackingPlan({
    referencePairs: spool,
    mainLengthM: 100,
    mainDiameterMm: 0.20,
    backingDiameterMm: 0.25,
    mainMaterial: MATERIAL.MONO,
  });
  assert.equal(result.status, 'needed');
  assert.ok(result.center > 20);
  assert.ok(result.range.min < result.center);
  assert.ok(result.range.max > result.center);
});

test('main line that exceeds central capacity is surfaced', () => {
  const result = estimateBackingPlan({
    referencePairs: [{ diameterMm: 0.20, lengthM: 100 }],
    mainLengthM: 150,
    mainDiameterMm: 0.20,
    backingDiameterMm: 0.25,
    mainMaterial: MATERIAL.MONO,
  });
  assert.equal(result.status, 'main-too-long');
  assert.equal(result.center, 0);
});

test('braid main line widens backing range and lowers confidence', () => {
  const base = {
    referencePairs: spool,
    mainLengthM: 100,
    mainDiameterMm: 0.18,
    backingDiameterMm: 0.25,
  };
  const mono = estimateBackingPlan({ ...base, mainMaterial: MATERIAL.MONO });
  const braid = estimateBackingPlan({ ...base, mainMaterial: MATERIAL.BRAID_MM });
  assert.equal(braid.confidence, 'low');
  assert.ok((braid.range.max - braid.range.min) > (mono.range.max - mono.range.min));
});

test('range can honestly show that backing may not be needed', () => {
  const result = estimateBackingPlan({
    referencePairs: [{ diameterMm: 0.20, lengthM: 100 }],
    mainLengthM: 85,
    mainDiameterMm: 0.20,
    backingDiameterMm: 0.25,
    mainMaterial: MATERIAL.MONO,
  });
  assert.equal(result.status, 'uncertain-need');
  assert.equal(result.range.min, 0);
  assert.ok(result.range.max > 0);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { buildWindingGuide, WINDING_MATERIAL } from '../src/domain/winding-guide.js';

test('mono guide includes twist-direction check and lip verification', () => {
  const guide = buildWindingGuide({ material: WINDING_MATERIAL.MONO });
  assert.equal(guide.material, 'mono');
  assert.ok(guide.steps.some((step) => /переверните упаковочную шпулю/i.test(step)));
  assert.ok(guide.steps.some((step) => /2–3 мм/i.test(step)));
  assert.ok(guide.warnings.some((warning) => /не имеет одного универсального стандарта/i.test(warning)));
});

test('fluoro follows mono-style twist control', () => {
  const guide = buildWindingGuide({ material: WINDING_MATERIAL.FLUORO });
  assert.ok(guide.checks.some((check) => /крупные петли/i.test(check)));
});

test('braid guide prioritizes manufacturer instructions and stable packing', () => {
  const guide = buildWindingGuide({ material: WINDING_MATERIAL.BRAID });
  assert.ok(guide.steps.some((step) => /инструкцию производителя/i.test(step)));
  assert.ok(guide.steps.some((step) => /мягких витков/i.test(step)));
  assert.ok(guide.warnings.some((warning) => /нет универсального правила подачи/i.test(warning)));
});

test('backing option adds reverse-winding method', () => {
  const guide = buildWindingGuide({ material: WINDING_MATERIAL.BRAID, hasBacking: true });
  assert.match(guide.steps[0], /обратной намотки/i);
});

test('guide rejects unsupported material', () => {
  assert.throws(() => buildWindingGuide({ material: 'wire' }), RangeError);
});

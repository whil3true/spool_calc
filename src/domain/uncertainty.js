import { assertPositiveFinite } from './number.js';

export const MATERIAL = Object.freeze({
  MONO: 'mono',
  FLUORO: 'fluoro',
  BRAID_MM: 'braid-mm',
  BRAID_PE: 'braid-pe',
});

export function uncertaintyFraction({ material, referencePairCount = 1, spreadRatio = 0, diameterRatio = 1 }) {
  assertPositiveFinite(diameterRatio, 'diameterRatio');
  const transition = Math.max(diameterRatio, 1 / diameterRatio);
  if (material === MATERIAL.BRAID_MM) return Math.max(0.20, Math.min(0.35, 0.20 + spreadRatio));
  if (material === MATERIAL.BRAID_PE) return Math.max(0.15, Math.min(0.30, 0.15 + spreadRatio));
  let fraction = referencePairCount > 1 ? 0.10 : 0.15;
  if (transition >= 1.75) fraction = Math.max(fraction, 0.15);
  if (spreadRatio >= 0.10) fraction = Math.max(fraction, Math.min(0.20, spreadRatio));
  return fraction;
}

export function rangeAround(center, fraction) {
  assertPositiveFinite(center, 'center');
  if (!Number.isFinite(fraction) || fraction < 0 || fraction >= 1) throw new RangeError('fraction must be in [0, 1)');
  return { min: center * (1 - fraction), max: center * (1 + fraction) };
}

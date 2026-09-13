import { assertPositiveFinite } from './number.js';

export function conditionalCapacity(lengthM, diameterMm) {
  assertPositiveFinite(lengthM, 'lengthM');
  assertPositiveFinite(diameterMm, 'diameterMm');
  return lengthM * diameterMm ** 2;
}

export function estimateLengthFromCapacity(capacity, diameterMm) {
  assertPositiveFinite(capacity, 'capacity');
  assertPositiveFinite(diameterMm, 'diameterMm');
  return capacity / diameterMm ** 2;
}

export function estimateMonoLength(referenceLengthM, referenceDiameterMm, targetDiameterMm) {
  return estimateLengthFromCapacity(
    conditionalCapacity(referenceLengthM, referenceDiameterMm),
    targetDiameterMm,
  );
}

export function median(values) {
  if (!Array.isArray(values) || values.length === 0) throw new RangeError('values must not be empty');
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

export function summarizeReferencePairs(pairs) {
  if (!Array.isArray(pairs) || pairs.length === 0) throw new RangeError('at least one reference pair is required');
  const capacities = pairs.map(({ lengthM, diameterMm }) => conditionalCapacity(lengthM, diameterMm));
  const center = median(capacities);
  const min = Math.min(...capacities);
  const max = Math.max(...capacities);
  const spreadRatio = center === 0 ? 0 : (max - min) / center;
  return { capacity: center, capacities, min, max, spreadRatio };
}

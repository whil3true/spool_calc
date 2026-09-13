import { assertPositiveFinite } from './number.js';

export function estimateBackingLength({ capacity, mainLengthM, mainDiameterMm, backingDiameterMm }) {
  assertPositiveFinite(capacity, 'capacity');
  assertPositiveFinite(mainLengthM, 'mainLengthM');
  assertPositiveFinite(mainDiameterMm, 'mainDiameterMm');
  assertPositiveFinite(backingDiameterMm, 'backingDiameterMm');
  const mainCapacity = mainLengthM * mainDiameterMm ** 2;
  const remaining = capacity - mainCapacity;
  return {
    mainCapacity,
    remainingCapacity: remaining,
    backingLengthM: remaining <= 0 ? 0 : remaining / backingDiameterMm ** 2,
    exceedsCapacity: remaining < 0,
  };
}

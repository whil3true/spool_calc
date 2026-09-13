import { estimateBackingLength } from './backing.js';
import { conditionalCapacity, summarizeReferencePairs } from './capacity.js';
import { MATERIAL, rangeAround, uncertaintyFraction } from './uncertainty.js';

export function estimateBackingPlan({ referencePairs, mainLengthM, mainDiameterMm, backingDiameterMm, mainMaterial = MATERIAL.MONO }) {
  const summary = summarizeReferencePairs(referencePairs);
  const spoolFraction = uncertaintyFraction({
    material: MATERIAL.MONO,
    referencePairCount: referencePairs.length,
    spreadRatio: summary.spreadRatio,
    diameterRatio: 1,
  });
  const mainFraction = uncertaintyFraction({
    material: mainMaterial,
    referencePairCount: 1,
    spreadRatio: 0,
    diameterRatio: 1,
  });

  const center = estimateBackingLength({
    capacity: summary.capacity,
    mainLengthM,
    mainDiameterMm,
    backingDiameterMm,
  });
  const spoolRange = rangeAround(summary.capacity, spoolFraction);
  const mainCapacity = conditionalCapacity(mainLengthM, mainDiameterMm);
  const mainCapacityRange = rangeAround(mainCapacity, mainFraction);
  const minBacking = Math.max(0, (spoolRange.min - mainCapacityRange.max) / backingDiameterMm ** 2);
  const maxBacking = Math.max(0, (spoolRange.max - mainCapacityRange.min) / backingDiameterMm ** 2);

  const consistency = summary.spreadRatio < 0.05 ? 'good' : summary.spreadRatio < 0.10 ? 'fair' : 'poor';
  const status = center.exceedsCapacity ? 'main-too-long' : maxBacking === 0 ? 'not-needed' : minBacking === 0 ? 'uncertain-need' : 'needed';
  const confidence = mainMaterial === MATERIAL.BRAID_MM || consistency === 'poor' ? 'low' : 'limited';

  return {
    center: center.backingLengthM,
    range: { min: minBacking, max: maxBacking },
    status,
    confidence,
    consistency,
    summary,
    spoolUncertaintyFraction: spoolFraction,
    mainUncertaintyFraction: mainFraction,
  };
}

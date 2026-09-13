import { summarizeReferencePairs, estimateLengthFromCapacity } from './capacity.js';
import { MATERIAL, rangeAround, uncertaintyFraction } from './uncertainty.js';

export function estimateSpoolCapacity({ referencePairs, targetDiameterMm, material }) {
  const summary = summarizeReferencePairs(referencePairs);
  const center = estimateLengthFromCapacity(summary.capacity, targetDiameterMm);
  const referenceDiameter = referencePairs[0].diameterMm;
  const fraction = uncertaintyFraction({
    material,
    referencePairCount: referencePairs.length,
    spreadRatio: summary.spreadRatio,
    diameterRatio: targetDiameterMm / referenceDiameter,
  });
  const range = rangeAround(center, fraction);
  const consistency = summary.spreadRatio < 0.05 ? 'good' : summary.spreadRatio < 0.10 ? 'fair' : 'poor';
  const confidence = material === MATERIAL.BRAID_MM || consistency === 'poor' ? 'low' : referencePairs.length > 1 ? 'medium' : 'limited';
  return { center, range, uncertaintyFraction: fraction, consistency, confidence, summary };
}

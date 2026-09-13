import { assertPositiveFinite } from './number.js';

const METERS_PER_YARD = 0.9144;

export function yardsToMeters(yards) {
  assertPositiveFinite(yards, 'yards');
  return yards * METERS_PER_YARD;
}

export function metersToYards(meters) {
  assertPositiveFinite(meters, 'meters');
  return meters / METERS_PER_YARD;
}

export function peToDenier(pe) {
  assertPositiveFinite(pe, 'pe');
  return pe * 200;
}

export function classifyMarking(text) {
  if (typeof text !== 'string' || !text.trim()) return { kind: 'unknown' };
  const value = text.toLowerCase().replace(/,/g, '.');
  if (/\bpe\s*#?\s*\d/.test(value) || /\bpe\s*\d/.test(value)) return { kind: 'pe' };
  if (/\blb\b/.test(value) && /\byd\b/.test(value)) return { kind: 'lb-yd' };
  if (/\b(?:mm|мм)\b/.test(value) && /\b(?:m|м)\b/.test(value)) return { kind: 'mm-m' };
  if (/\b(?:no\.?|号)\s*\d/i.test(text)) return { kind: 'no' };
  return { kind: 'unknown' };
}

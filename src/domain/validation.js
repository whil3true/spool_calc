import { parseLocalizedNumber } from './number.js';

export function validatePositiveInput(raw, { label, max = Number.POSITIVE_INFINITY } = {}) {
  const value = parseLocalizedNumber(raw);
  if (!String(raw ?? '').trim()) return { ok: false, error: `${label ?? 'Значение'} не заполнено.` };
  if (!Number.isFinite(value)) return { ok: false, error: `${label ?? 'Значение'} должно быть числом.` };
  if (value <= 0) return { ok: false, error: `${label ?? 'Значение'} должно быть больше нуля.` };
  if (value > max) return { ok: false, error: `${label ?? 'Значение'} выглядит нереалистично большим.` };
  return { ok: true, value };
}

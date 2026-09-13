import { peToDenier, yardsToMeters } from './units.js';

function numberToken(value) {
  return Number(value.replace(',', '.'));
}

function matchNumber(text, unitPattern) {
  const match = text.match(new RegExp(`(\\d+(?:[.,]\\d+)?)\\s*${unitPattern}`, 'i'));
  return match ? numberToken(match[1]) : null;
}

function result(kind, values, explanation, warning = '') {
  return { kind, values, explanation, warning };
}

export function decodeMarking(input) {
  if (typeof input !== 'string' || !input.trim()) {
    return result('unknown', {}, 'Введите маркировку со шпули или упаковки.');
  }

  const text = input.trim();
  const diameterMm = matchNumber(text, '(?:mm|мм)\\b');
  const lengthM = matchNumber(text, '(?:m|м)\\b');
  if (diameterMm && lengthM) {
    return result(
      'mm-m',
      { diameterMm, lengthM },
      `${diameterMm} mm — заявленный диаметр материала; ${lengthM} m — длина, указанная для этого диаметра.`,
      'Для расчёта вместимости используйте именно фактический или заявленный диаметр в mm. Паспортные числа обычно округлены.',
    );
  }

  const pounds = matchNumber(text, 'lb\\b');
  const yards = matchNumber(text, 'yd\\b');
  if (pounds && yards) {
    const meters = yardsToMeters(yards);
    return result(
      'lb-yd',
      { pounds, yards, meters },
      `${pounds} lb — заявленная разрывная нагрузка; ${yards} yd — длина, это ${meters.toFixed(2)} m.`,
      'lb не задаёт диаметр. Переводить lb в mm без данных конкретной лески или шнура нельзя.',
    );
  }

  const peMatch = text.match(/\bpe\s*#?\s*(\d+(?:[.,]\d+)?)/i);
  if (peMatch) {
    const pe = numberToken(peMatch[1]);
    const denier = peToDenier(pe);
    const peLengthM = matchNumber(text, '(?:m|м)\\b');
    return result(
      'pe',
      { pe, denier, lengthM: peLengthM },
      `PE #${pe} — размер по линейной массе; по стандартному соотношению это ${denier.toFixed(0)} denier.${peLengthM ? ` Длина: ${peLengthM} m.` : ''}`,
      'PE — не диаметр и не разрывная нагрузка. Универсального точного PE → mm или PE → lb преобразования нет.',
    );
  }

  const noMatch = text.match(/(?:\bno\.?|号)\s*#?\s*(\d+(?:[.,]\d+)?)/i);
  if (noMatch) {
    const number = numberToken(noMatch[1]);
    const noLengthM = matchNumber(text, '(?:m|м)\\b');
    return result(
      'no',
      { number, lengthM: noLengthM },
      `No. ${number} — номер размерной системы производителя или стандарта.${noLengthM ? ` Длина: ${noLengthM} m.` : ''}`,
      'Сам по себе No. не даёт универсальный диаметр в mm. Для расчёта ищите таблицу конкретного производителя или отдельную маркировку mm/m.',
    );
  }

  return result(
    'unknown',
    {},
    'Маркировка не распознана как mm/m, lb/yd, PE или No.',
    'Перепишите строку целиком, включая единицы. Не пытайтесь угадывать диаметр по одному номеру катушки или lb.',
  );
}

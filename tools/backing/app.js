import { estimateBackingPlan } from '../../src/domain/backing-estimate.js';
import { MATERIAL } from '../../src/domain/uncertainty.js';
import { validatePositiveInput } from '../../src/domain/validation.js';
import { emitAnalyticsEvent } from '../../src/analytics/events.js';

const form = document.querySelector('#backing-form');
const pairsRoot = document.querySelector('#reference-pairs');
const addPairButton = document.querySelector('#add-pair');
const result = document.querySelector('#result');
let pairCount = 0;

function createPairRow() {
  pairCount += 1;
  const row = document.createElement('div');
  row.className = 'pair-row';
  row.innerHTML = `
    <div class="field-grid">
      <label class="field">Диаметр, мм
        <input name="referenceDiameter" inputmode="decimal" autocomplete="off" placeholder="0,18" aria-describedby="pair-error-${pairCount}">
      </label>
      <label class="field">Длина, м
        <input name="referenceLength" inputmode="decimal" autocomplete="off" placeholder="170" aria-describedby="pair-error-${pairCount}">
      </label>
    </div>
    <p id="pair-error-${pairCount}" class="field-error" aria-live="polite"></p>
    ${pairCount > 1 ? '<button type="button" class="text-button remove-pair">Удалить строку</button>' : ''}
  `;
  row.querySelector('.remove-pair')?.addEventListener('click', () => row.remove());
  pairsRoot.append(row);
}

function formatMeters(value) { if (value <= 0) return 0; return Math.max(1, Math.round(value / 5) * 5); }
function confidenceLabel(value) { return ({ limited: 'ограниченная', low: 'низкая' })[value] ?? value; }
function consistencyLabel(value) { return ({ good: 'хорошая', fair: 'умеренная', poor: 'низкая' })[value] ?? value; }

function readPairs() {
  const pairs = [];
  let valid = true;
  for (const row of pairsRoot.querySelectorAll('.pair-row')) {
    const diameterInput = row.querySelector('[name="referenceDiameter"]');
    const lengthInput = row.querySelector('[name="referenceLength"]');
    const error = row.querySelector('.field-error');
    const diameter = validatePositiveInput(diameterInput.value, { label: 'Диаметр', max: 10 });
    const length = validatePositiveInput(lengthInput.value, { label: 'Длина', max: 10000 });
    if (!diameter.ok || !length.ok) {
      valid = false;
      error.textContent = !diameter.ok ? diameter.error : length.error;
    } else {
      error.textContent = '';
      pairs.push({ diameterMm: diameter.value, lengthM: length.value });
    }
  }
  return valid ? pairs : null;
}

function resultCopy(estimate) {
  if (estimate.status === 'main-too-long') return { main: 'Бэкинг не нужен', range: 'По центральной оценке основная леска уже превышает расчётную вместимость шпули.', warning: 'Проверьте длину и диаметр основной лески. Если данные верны, наматывать её полностью рискованно: шпуля может быть переполнена.' };
  if (estimate.status === 'not-needed') return { main: 'Бэкинг, скорее всего, не нужен', range: 'Даже с учётом диапазона основная леска почти заполняет расчётный объём.', warning: 'Финальный уровень всё равно проверьте на шпуле: геометрическая модель не знает реальную плотность укладки.' };
  const min = formatMeters(estimate.range.min); const max = formatMeters(estimate.range.max); const center = formatMeters(estimate.center);
  if (estimate.status === 'uncertain-need') return { main: center > 0 ? `ориентир около ${center} м` : 'Бэкинг может не понадобиться', range: `Практический диапазон: от 0 до примерно ${max} м`, warning: 'Расчёт находится на границе: в реальной намотке бэкинг может оказаться не нужен. Лучше проверить обратной намоткой.' };
  return { main: `примерно ${center} м бэкинга`, range: `Ориентировочный диапазон: ${min}–${max} м`, warning: 'Это стартовая оценка, а не длина до сантиметра. Финальный объём определите по фактическому уровню намотки.' };
}

addPairButton.addEventListener('click', () => { createPairRow(); emitAnalyticsEvent('reference_pair_added', { tool: 'backing' }); });

form.addEventListener('submit', (event) => {
  event.preventDefault();
  emitAnalyticsEvent('calculator_started', { tool: 'backing' });
  const pairs = readPairs();
  const mainDiameter = validatePositiveInput(form.elements.mainDiameter.value, { label: 'Диаметр основной лески', max: 10 });
  const mainLength = validatePositiveInput(form.elements.mainLength.value, { label: 'Длина основной лески', max: 10000 });
  const backingDiameter = validatePositiveInput(form.elements.backingDiameter.value, { label: 'Диаметр бэкинга', max: 10 });
  document.querySelector('#main-error').textContent = !mainDiameter.ok ? mainDiameter.error : !mainLength.ok ? mainLength.error : '';
  document.querySelector('#backing-error').textContent = backingDiameter.ok ? '' : backingDiameter.error;
  if (!pairs || !mainDiameter.ok || !mainLength.ok || !backingDiameter.ok) { result.hidden = true; return; }

  const mainMaterial = form.elements.mainMaterial.value;
  const estimate = estimateBackingPlan({ referencePairs: pairs, mainLengthM: mainLength.value, mainDiameterMm: mainDiameter.value, backingDiameterMm: backingDiameter.value, mainMaterial });
  const copy = resultCopy(estimate);
  document.querySelector('#result-main').textContent = copy.main;
  document.querySelector('#result-range').textContent = copy.range;
  document.querySelector('#result-confidence').textContent = confidenceLabel(estimate.confidence);
  document.querySelector('#result-consistency').textContent = consistencyLabel(estimate.consistency);
  document.querySelector('#result-warning').textContent = mainMaterial === MATERIAL.BRAID_MM
    ? `${copy.warning} Для плетёного шнура заявленный диаметр может заметно отличаться от фактической толщины, поэтому диапазон специально расширен.`
    : copy.warning;

  result.hidden = false; result.focus();
  emitAnalyticsEvent('calculation_completed', { tool: 'backing', mainMaterial, referencePairCount: pairs.length, status: estimate.status, confidence: estimate.confidence });
});

createPairRow();

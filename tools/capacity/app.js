import { estimateSpoolCapacity } from '../../src/domain/capacity-estimate.js';
import { MATERIAL } from '../../src/domain/uncertainty.js';
import { validatePositiveInput } from '../../src/domain/validation.js';
import { emitAnalyticsEvent } from '../../src/analytics/events.js';

const form = document.querySelector('#capacity-form');
const pairsRoot = document.querySelector('#reference-pairs');
const addPairButton = document.querySelector('#add-pair');
const result = document.querySelector('#result');
let pairCount = 0;

function createPairRow() {
  pairCount += 1;
  const row = document.createElement('div');
  row.className = 'pair-row';
  row.dataset.pairId = String(pairCount);
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

function formatMeters(value) { return Math.round(value / 5) * 5; }
function materialFromForm() { return form.elements.material.value; }
function confidenceLabel(value) { return ({ medium: 'средняя', limited: 'ограниченная', low: 'низкая' })[value] ?? value; }
function consistencyLabel(value) { return ({ good: 'хорошая', fair: 'умеренная', poor: 'низкая' })[value] ?? value; }

function readPairs() {
  const rows = [...pairsRoot.querySelectorAll('.pair-row')];
  const pairs = [];
  let valid = true;
  for (const row of rows) {
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

addPairButton.addEventListener('click', () => {
  createPairRow();
  emitAnalyticsEvent('reference_pair_added', { tool: 'capacity' });
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  emitAnalyticsEvent('calculator_started', { tool: 'capacity' });
  const pairs = readPairs();
  const targetError = document.querySelector('#target-error');
  const target = validatePositiveInput(form.elements.targetDiameter.value, { label: 'Диаметр новой лески', max: 10 });
  targetError.textContent = target.ok ? '' : target.error;
  if (!pairs || !target.ok) { result.hidden = true; return; }

  const material = materialFromForm();
  const estimate = estimateSpoolCapacity({ referencePairs: pairs, targetDiameterMm: target.value, material });
  document.querySelector('#result-main').textContent = `примерно ${formatMeters(estimate.center)} м`;
  document.querySelector('#result-range').textContent = `Ориентировочный диапазон: ${formatMeters(estimate.range.min)}–${formatMeters(estimate.range.max)} м`;
  document.querySelector('#result-confidence').textContent = confidenceLabel(estimate.confidence);
  document.querySelector('#result-consistency').textContent = consistencyLabel(estimate.consistency);

  document.querySelector('#result-warning').textContent = material === MATERIAL.BRAID_MM
    ? 'Для плетёного шнура это грубая оценка: заявленный диаметр может заметно отличаться от фактической толщины и характера укладки. Практическая проверка обязательна.'
    : 'Расчёт ориентировочный: значения на шпуле округлены, а фактический диаметр и плотность намотки отличаются.';

  result.hidden = false;
  result.focus();
  emitAnalyticsEvent('calculation_completed', { tool: 'capacity', material, referencePairCount: pairs.length, confidence: estimate.confidence });
});

createPairRow();

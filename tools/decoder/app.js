import { decodeMarking } from '../../src/domain/marking-decoder.js';
import { emitAnalyticsEvent } from '../../src/analytics/events.js';

const form = document.querySelector('#decoder-form');
const result = document.querySelector('#result');
const input = document.querySelector('#marking');
const error = document.querySelector('#marking-error');

const labels = {
  'mm-m': 'Маркировка «мм / м»',
  'lb-yd': 'Маркировка «фунты / ярды (lb / yd)»',
  pe: 'Маркировка PE',
  no: 'Маркировка No.',
  unknown: 'Не удалось распознать',
};

function renderActions(decoded) {
  const root = document.querySelector('#result-actions');
  root.replaceChildren();

  if (decoded.kind === 'mm-m') {
    const link = document.createElement('a');
    link.className = 'button button-secondary';
    link.href = '../capacity/';
    link.textContent = 'Перейти к расчёту вместимости';
    root.append(link);
  }

  if (decoded.kind === 'unknown') {
    const hint = document.createElement('p');
    hint.className = 'form-help';
    hint.textContent = 'Проверьте, что в строке есть единицы: мм/м, фунты/ярды (lb/yd), PE или No.';
    root.append(hint);
  }
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const raw = input.value.trim();
  emitAnalyticsEvent('decoder_started', { tool: 'decoder' });

  if (!raw) {
    error.textContent = 'Введите маркировку.';
    result.hidden = true;
    return;
  }

  error.textContent = '';
  const decoded = decodeMarking(raw);
  document.querySelector('#result-kind').textContent = labels[decoded.kind] ?? labels.unknown;
  document.querySelector('#result-explanation').textContent = decoded.explanation;
  document.querySelector('#result-warning').textContent = decoded.warning;
  renderActions(decoded);
  result.hidden = false;
  result.focus();

  emitAnalyticsEvent('decoder_completed', { tool: 'decoder', kind: decoded.kind });
});

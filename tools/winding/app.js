import { buildWindingGuide } from '../../src/domain/winding-guide.js';
import { emitAnalyticsEvent } from '../../src/analytics/events.js';

const form = document.querySelector('#winding-form');
const result = document.querySelector('#result');
const stepsRoot = document.querySelector('#result-steps');
const checksRoot = document.querySelector('#result-checks');
const warningsRoot = document.querySelector('#result-warnings');

function fillList(root, items) {
  root.replaceChildren(...items.map((text) => {
    const li = document.createElement('li');
    li.textContent = text;
    return li;
  }));
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const material = form.elements.material.value;
  const hasBacking = form.elements.hasBacking.checked;
  emitAnalyticsEvent('winding_guide_started', { tool: 'winding', material, hasBacking });

  const guide = buildWindingGuide({ material, hasBacking });
  fillList(stepsRoot, guide.steps);
  fillList(checksRoot, guide.checks);
  fillList(warningsRoot, guide.warnings);
  result.hidden = false;
  result.focus();

  emitAnalyticsEvent('winding_guide_completed', {
    tool: 'winding',
    material,
    hasBacking,
    stepCount: guide.steps.length,
  });
});

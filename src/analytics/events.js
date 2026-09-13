const METRIKA_COUNTER_ID = 112552271;

function goalName(name, detail) {
  const tool = detail.tool ? `${detail.tool}_` : '';
  return `${tool}${name}`.replace(/[^a-z0-9_]+/gi, '_').toLowerCase();
}

export function emitAnalyticsEvent(name, detail = {}) {
  const eventDetail = { name, ...detail };
  window.dispatchEvent(new CustomEvent('spoolcalc:event', { detail: eventDetail }));

  if (typeof window.ym === 'function') {
    window.ym(METRIKA_COUNTER_ID, 'reachGoal', goalName(name, detail), eventDetail);
  }
}

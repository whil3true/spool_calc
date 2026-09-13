export function emitAnalyticsEvent(name, detail = {}) {
  window.dispatchEvent(new CustomEvent('spoolcalc:event', { detail: { name, ...detail } }));
}

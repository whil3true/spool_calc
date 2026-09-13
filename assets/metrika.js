const METRIKA_ID = 112552271;

(function (m, e, t, r, i, k, a) {
  m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments); };
  m[i].l = 1 * new Date();
  for (let j = 0; j < document.scripts.length; j += 1) {
    if (document.scripts[j].src === r) return;
  }
  k = e.createElement(t);
  a = e.getElementsByTagName(t)[0];
  k.async = true;
  k.src = r;
  a.parentNode.insertBefore(k, a);
})(window, document, 'script', `https://mc.yandex.ru/metrika/tag.js?id=${METRIKA_ID}`, 'ym');

window.ym(METRIKA_ID, 'init', {
  ssr: true,
  webvisor: true,
  clickmap: true,
  ecommerce: 'dataLayer',
  referrer: document.referrer,
  url: location.href,
  accurateTrackBounce: true,
  trackLinks: true,
});

window.addEventListener('spoolcalc:event', (event) => {
  const detail = event.detail ?? {};
  const { name, ...params } = detail;
  if (!name) return;
  window.ym(METRIKA_ID, 'reachGoal', name, params);
});

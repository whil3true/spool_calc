# Шпулометр

Статический русскоязычный помощник по заполнению шпули безынерционной катушки: лесоёмкость, бэкинг, маркировка и правильная намотка.

Рабочее имя репозитория остаётся `spool_calc`; пользовательский бренд — **Шпулометр**.

## Product boundary

Катушка + леска/шнур + заполнение шпули + бэкинг + правильная намотка.

Проект намеренно не обещает универсальную точность. Mono и fluorocarbon по фактическому диаметру считаются по объёмной модели; braid и backing выдаются только как оценки с диапазоном и практической проверкой.

## Architecture

- `index.html` — индексируемый shell без framework.
- `assets/` — локальные стили, favicon и bootstrap Яндекс Метрики.
- `src/domain/` — чистая предметная логика без DOM.
- `src/analytics/` — единый мост продуктовых событий к аналитике.
- `tests/` — unit/regression и structural tests на `node:test`.
- `.github/workflows/test.yml` — CI unit tests.

Runtime-зависимостей нет. Сайт публикуется через GitHub Pages на собственном домене `https://shpulometr.ru/`.

## Domain rules

- Mono capacity: `L2 = L1 × (d1 / d2)^2`.
- Несколько строк маркировки агрегируются через медиану `K = L × d²`; внутренний разброс сохраняется как сигнал качества входных данных.
- PE → denier: `denier = 200 × PE`.
- Нет точных PE ↔ mm, PE ↔ lb, lb ↔ mm преобразований.
- Backing: `Lback = (Q - Qmain) / dback²`, только как ориентир.
- Braid получает более широкий диапазон неопределённости и обязательную физическую проверку.
- Практические guide-страницы не заменяют инструкцию конкретной катушки или материала.

## SEO architecture

Бренд: **Шпулометр**.

Основной домен: `https://shpulometr.ru/`.

Canonical, sitemap.xml и robots.txt должны использовать только основной домен. `CNAME` содержит `shpulometr.ru`.

`/guides/underfill-overfill/` объединён с `/guides/spool-lip-gap/`. Старый URL остаётся `noindex` с canonical и HTML-переадресацией на объединённый материал. GitHub Pages не предоставляет произвольный серверный HTTP 301 для отдельного статического пути.

## Analytics

Яндекс Метрика: счётчик `112552271`.

`assets/metrika.js` загружает официальный tag.js с настройками Webvisor, clickmap, trackLinks и accurateTrackBounce. Все публичные HTML-страницы подключают этот bootstrap и noscript-pixel.

Инструменты уже отправляют предметные события через `src/analytics/events.js`; этот слой сохраняет внутренний `spoolcalc:event` и дополнительно отправляет соответствующую цель через `ym(..., 'reachGoal', ...)`.

## Development

```sh
npm test
```

Открытие сайта не требует build-step: достаточно статического HTTP-сервера или GitHub Pages.

## Current indexable URLs

### Tools

- `/tools/capacity/`
- `/tools/backing/`
- `/tools/decoder/`
- `/tools/winding/`

### Guides

- `/guides/`
- `/guides/spool-marking/`
- `/guides/spool-lip-gap/`
- `/guides/mono-winding/`
- `/guides/braid-winding/`
- `/guides/tie-line-to-spool/`
- `/guides/why-backing/`
- `/guides/reverse-winding/`
- `/guides/pe-not-mm/`
- `/guides/lb-not-diameter/`
- `/guides/line-lay-problems/`

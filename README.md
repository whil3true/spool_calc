# Spool Calc

Статический русскоязычный помощник по заполнению шпули безынерционной катушки.

## Product boundary

Катушка + леска/шнур + заполнение шпули + бэкинг + правильная намотка.

Проект намеренно не обещает универсальную точность. Mono и fluorocarbon по фактическому диаметру считаются по объёмной модели; braid и backing выдаются только как оценки с диапазоном и практической проверкой.

## Architecture

- `index.html` — индексируемый shell без framework.
- `assets/` — локальные стили и favicon.
- `src/domain/` — чистая предметная логика без DOM.
- `tests/` — unit/regression и structural tests на `node:test`.
- `.github/workflows/test.yml` — CI unit tests.

Runtime-зависимостей нет. Сайт должен работать как GitHub Pages project site из `/spool_calc/`, поэтому runtime-пути относительные.

## Domain rules

- Mono capacity: `L2 = L1 × (d1 / d2)^2`.
- Несколько паспортных пар агрегируются через медиану `K = L × d²`; внутренний разброс сохраняется как сигнал качества входных данных.
- PE → denier: `denier = 200 × PE`.
- Нет точных PE ↔ mm, PE ↔ lb, lb ↔ mm преобразований.
- Backing: `Lback = (Q - Qmain) / dback²`, только как ориентир.
- Braid получает более широкий диапазон неопределённости и обязательную физическую проверку.
- Практические guide-страницы не заменяют инструкцию конкретной катушки или материала.

## Development

```sh
npm test
```

Открытие сайта не требует build-step: достаточно статического HTTP-сервера или GitHub Pages.

## Current URLs

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
- `/guides/why-backing/`
- `/guides/reverse-winding/`
- `/guides/pe-not-mm/`
- `/guides/lb-not-diameter/`
- `/guides/underfill-overfill/`
- `/guides/line-lay-problems/`

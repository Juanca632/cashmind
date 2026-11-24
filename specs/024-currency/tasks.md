# Tasks: Currency

**Input**: [spec.md](./spec.md), [plan.md](./plan.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/ui.md](./contracts/ui.md), [quickstart.md](./quickstart.md)

Tests are written by the `test-writer` subagent from the spec (project rule), not by the implementation tasks.

## Phase 1: Foundational (blocks every story)

- [X] T001 src/shared/money.ts: `CURRENCIES`, `Currency`, `CURRENCY_NAMES`, `type Money`, `moneyFor(currency)` with the EUR / USD / COP objects as in plan.md (EUR exactly as the old helpers), `splitFraction(money, text)`; `MAX_CENTS = 90_000_000_000`, `AMOUNT_TOO_LARGE = 'This amount is too large.'`; remove `formatEuros`, `formatEurosCompact`, `parseEurosToCents`, `centsToInput`
- [X] T002 src/shared/hooks/use-money.ts: `MoneyContext` (default `moneyFor('EUR')`) and `useMoney()`
- [X] T003 src/features/settings/repository.ts: `getCurrency(db)` (key `currency`; missing → `'EUR'`; else `readOneOf(value, CURRENCIES, 'setting.currency')`) and `saveCurrency(db, currency)` upsert; eslint.config.js adds `saveCurrency` to `NO_WRITES_IN_HOOKS`
- [X] T004 src/features/settings/service.ts: `setCurrency(db, currency)` → `WriteResult`; rejects a value not in `CURRENCIES`
- [X] T005 src/features/settings/hooks/use-currency-setting.ts and src/features/settings/components/currency-provider.tsx: load once (error → EUR), blank `ThemedView` until loaded, provide `MoneyContext`, export `useSetCurrency()`; src/app/_layout.tsx wraps `AppLock` in `CurrencyProvider`

## Phase 2: User Story 1 — every amount in the chosen currency (P1) 🎯 MVP

**Independent test**: select each currency and check every screen.

- [X] T006 [US1] src/features/settings/screens/settings-screen.tsx: "Currency" section between Security and About: `radiogroup` "Currency" of three `Pill`s (`accessibilityRole="radio"`, `selected`, accent colors), caption "Amounts are not converted when you change the currency.", tap → `setCurrency` then `useSetCurrency()`; failure → `ErrorText`
- [X] T007 [P] [US1] entries components: entry-list.tsx, recurring-list.tsx, category-split.tsx, quick-add-row.tsx use `useMoney().format`
- [X] T008 [P] [US1] home: home-screen.tsx (tiles, repeat income, pace, `LeftToSpend` via `splitFraction`, daily text), plan-screen.tsx (incl. "Add this month's income to see the amount."), trends-screen.tsx, trend-category-screen.tsx, trend-bars.tsx, trend-category-list.tsx use `useMoney()`

## Phase 3: User Story 2 — typing amounts (P1)

**Independent test**: type and save amounts in each currency.

- [X] T009 [US2] src/features/entries/components/amount-field.tsx: symbol before (USD, COP) or after (EUR), `placeholder` and `keyboardType` from `useMoney()`
- [X] T010 [US2] src/features/entries/screens/entry-screen.tsx and recurring-screen.tsx: `money.parse` and `money.toInput` instead of the euro helpers
- [X] T011 [US2] src/features/entries/rules.ts: "The amount must be greater than 0." and `AMOUNT_TOO_LARGE`

## Phase 4: Polish

- [X] T012 [P] .specify/memory/constitution.md (header, principle IV, version 1.4.0, amended 2026-11-24) and AGENTS.md "Money" line
- [X] T013 [P] specs/001-expenses/spec.md FR-012 (amounts use the currency chosen in Settings, see 024) and Input line; specs/002-income-plan/spec.md FR-005 "goal in the selected currency"
- [X] T014 Tests by the `test-writer` subagent for 024-currency (unit: `moneyFor` per currency, `splitFraction`, limit; integration: Stories 1–2; move existing tests off the removed euro helpers)
- [X] T015 `npx expo lint`, `npx tsc --noEmit`, `npx jest --maxWorkers=2` pass; `code-reviewer` on 024-currency; fix BLOCKER/MAJOR

## Dependencies

T001 → T002 → T005; T003 → T004 → T005 → T006. T002 → T007, T008, T009. T001 → T010, T011. T012, T013 any time. T014 after T011. T015 last.

## Strategy

MVP = T001–T008: amounts show in the chosen currency. T009–T011 make typing match. T012–T015 finish.

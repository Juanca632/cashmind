# Implementation Plan: Currency

**Branch**: `feat/024-currency` | **Date**: 2026-11-24 | **Spec**: [spec.md](./spec.md)

## Summary

`src/shared/money.ts` turns its euro-only helpers into one `Money` object per currency, built by `moneyFor(currency)`. Each object formats, formats compact, parses, gives the edit text, and describes the amount field. A shared React context (`useMoney()`) gives the selected `Money` to every component, so changes re-render correctly under the React Compiler. The `settings` feature stores `currency` in the 023 `setting` table (no migration) and provides the context from the root layout. Settings gets a "Currency" section. The amount limit becomes one value for every currency.

## Technical Context

**Dependencies**: none new. Formatting uses `Intl.NumberFormat`, as today.

**Storage**: key `currency` (`'EUR' | 'USD' | 'COP'`) in the existing `setting` table. A missing value means EUR. No migration.

**Testing**:
- Unit tests of `moneyFor` for the three currencies: format, compact, parse, edit text, limit.
- Integration tests for spec Stories 1–2: pick each currency in Settings and check home, the forms, lists, My plan and Trends; that it is remembered after a restart; that nothing is converted.
- Existing tests that import `formatEuros` and `parseEurosToCents` are moved to the new API by the test-writer.
- No new Maestro flow. The six flows run in euros, the default, and that proves nothing changed for existing users.

## Constitution Check

| Principle | Result |
| --- | --- |
| I. Privacy First | Pass. Local only, with no exchange rates. |
| II. Keep It Simple | Pass. Three fixed currencies, one per app, no conversion, one limit. |
| IV. Money Is Integer Cents | **Amended**: "integer hundredths of the selected currency (EUR by default)". The developer approved the currency feature on 2026-11-24. Constitution version 1.4.0. |
| Architecture | Pass. Pure money helpers and the context live in `src/shared`. The provider and the stored setting live in `settings`. No feature imports another. |
| Styles rule | Pass. `Pill` with selected state, `ThemedText`, existing tokens. |
| Baseline specs | 001 gets FR-012 (currency); 002 FR-005 says "in the selected currency". |

## Design

### `src/shared/money.ts`

- **Currencies**: `CURRENCIES = ['EUR', 'USD', 'COP'] as const`, `type Currency`, and `CURRENCY_NAMES` (Euro, US dollar, Colombian peso).
- **`type Money`**:
  - `currency`;
  - `format(cents)`;
  - `formatCompact(cents)`;
  - `parse(text): number | null`;
  - `toInput(cents)`;
  - `decimalMark: ',' | '.'`;
  - `symbol: '€' | '$'`;
  - `symbolFirst`;
  - `placeholder`;
  - `keyboard: 'decimal-pad' | 'number-pad'`.
- **`moneyFor(currency)`** returns one of three constant objects:
  - **EUR**: `fr-FR`, exactly as today (the old `formatEuros`, `formatEurosCompact`, `parseEurosToCents` and `centsToInput` move here).
  - **USD**: `en-US`. Compact drops `.00` on whole amounts. Parsing is the same as EUR: one `,` or `.` as the decimal mark, at most 2 decimals. The edit text uses `.`.
  - **COP**: `es-CO`. Whole amounts use `maximumFractionDigits: 0`, and amounts with cents keep 2 decimals. Compact is the same as format.
    - **Parse**: strip spaces, `$` and `.`, then `^\d+(,\d{0,2})?$`.
    - **Edit text**: `"45000"` for whole amounts, `"12,50"` with cents.
- **`splitFraction(money, text)`** returns `[whole, fraction | null]`, splitting at the last `decimalMark`. It is used by home's big figure. COP whole amounts give no fraction.
- **Limit**: `MAX_CENTS = 90_000_000_000` (900 000 000 units). `AMOUNT_TOO_LARGE = 'This amount is too large.'`. `isValidCents` keeps its signature, so the services do not need the currency.
- `formatEuros`, `formatEurosCompact`, `parseEurosToCents` and `centsToInput` are removed, along with their callers.

### `src/shared/hooks/use-money.ts`

- `MoneyContext = createContext<Money>(moneyFor('EUR'))`. `useMoney()` returns it.

### `src/features/settings/`

- **repository**: `getCurrency(db)` returns `Currency`. A missing value is `'EUR'`; any other value throws `DataFormatError('setting.currency')`. `saveCurrency(db, currency)` upserts.
- **service**: `setCurrency(db, currency)` returns a `WriteResult` and rejects a value not in `CURRENCIES`.
- **`components/currency-provider.tsx`**: `CurrencyProvider({ children })`.
  - It loads `getCurrency` once through a hook (`hooks/use-currency-setting.ts`); an error counts as EUR.
  - It renders a blank themed view until loaded, so euros never flash before pesos.
  - It provides `MoneyContext` with `moneyFor(currency)`.
  - It exports `useSetCurrency()`, through its own context, for the Settings screen.
- **Settings screen**: a "Currency" section between Security and About.
  - A `radiogroup` row of three `Pill`s with `accessibilityRole="radio"`, `selected`, and accent `colors`.
  - The caption "Amounts are not converted when you change the currency.".
  - Tapping a pill calls `setCurrency`, then `useSetCurrency()(currency)`. A failure shows `ErrorText`.
- **`_layout.tsx`**: `<CurrencyProvider>` wraps `<AppLock>` inside `SQLiteProvider`.

### Call sites (all through `const money = useMoney()`)

- **entries**:
  - `entry-list`, `recurring-list`, `category-split` and `quick-add-row` use `money.format`;
  - `amount-field` uses the symbol on its side, the placeholder and the keyboard;
  - `entry-screen` and `recurring-screen` use `money.parse` and `money.toInput`.
- **entries/rules.ts**: the messages "The amount must be greater than 0." and `AMOUNT_TOO_LARGE`.
- **home**:
  - `home-screen` (tiles, repeat income, pace, the big figure through `splitFraction`, daily text);
  - `plan-screen`, with the copy "Add this month's income to see the amount.";
  - `trends-screen`, `trend-category-screen`, `trend-bars` and `trend-category-list`;
  - `averageSentence` and `paceSentence` already take a formatter, so they get `money.format`.

### Docs

- `.specify/memory/constitution.md`:
  - the header says currency is chosen in Settings (EUR by default);
  - principle IV is amended;
  - the version becomes 1.4.0, amended 2026-11-24.
- `AGENTS.md` "Money": "amounts are in the currency chosen in Settings (EUR, USD or COP; EUR by default); never use floating point; store integer hundredths."
- `specs/001-expenses` FR-012 and `specs/002-income-plan` FR-005.

## Complexity Tracking

None.

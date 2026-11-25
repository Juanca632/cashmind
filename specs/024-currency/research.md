# Research: Currency

## How the selected currency reaches the screens

- **Decision**: a React context in `src/shared/hooks/use-money.ts`, read with `useMoney()` in each component that shows amounts.
- **Rationale**: the app uses the React Compiler, which memoizes render results by their inputs. A module-level "current currency" would leave formatted strings cached in the old currency. A context value is a tracked input, so every consumer re-renders when it changes, and the navigation stack is kept.
- **Alternative rejected**: remounting the navigator on change with a `key`. It loses the stack and sends the user to home after picking a currency.

## Formats

- **Decision**:
  - EUR uses `fr-FR`, unchanged.
  - USD uses `en-US`: "$1,234.56".
  - COP uses `es-CO`: "$ 1.234.567". Whole amounts show no decimals, and amounts with cents show 2.
- **Rationale**: these are the usual formats in each country. They were checked with `Intl.NumberFormat`, which the app already relies on for euros on Hermes.

## Typing

- **Decision**:
  - EUR and USD accept either "," or "." as the decimal mark, because Android's decimal keyboard shows the phone's own mark.
  - COP uses the digits-only keyboard and accepts "." between thousands.
- **Rationale**: a French phone typing dollars shows ",". Reading "12,50" as 1250 dollars would be a silent error.

## Limit

- **Decision**: one limit of 900 000 000 in every currency, stored as 90 000 000 000 hundredths.
- **Rationale**: it is one rule, and the services stay currency-free. It fits peso amounts. It is far below `Number.MAX_SAFE_INTEGER` (about 9 × 10^15), even summed over thousands of entries.

## Storage

- **Decision**: key `currency` in the 023 `setting` table. A missing value means EUR. No migration.

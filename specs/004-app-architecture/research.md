# Research: App Architecture Foundation

## Where validation lives

- **Decision**: One service per feature, as plain async functions that receive the database.
- **Rationale**: Android's architecture guide puts reusable business logic between the UI and data layers and warns against layers that only forward calls. Writes have real logic; reads do not.
- **Alternatives considered**: A use case class per action (more code for no benefit here); routing reads through services too (pass-through only).

## Write results

- **Decision**: Services never throw. They return `{ ok: true }` or `{ ok: false, kind, message }`.
- **Rationale**: Every screen can treat failure identically, which is the requirement of FR-007.
- **Alternatives considered**: Typed exceptions (easy to forget a catch, which is the current bug on two screens).

## Read checks

- **Decision**: Small assertion helpers used by repository mappers. Row fields are typed `unknown`, so the compiler forces a check.
- **Rationale**: Few fields and few rules. A schema library would be a new dependency for about ten checks.
- **Alternatives considered**: Zod (new dependency); trusting storage constraints (SQLite accepts text in an INTEGER column).

## Damaged rows

- **Decision**: One damaged row fails the whole read and the screen shows a message.
- **Rationale**: Skipping the row would show totals that look right and are wrong.

## Boundaries

- **Decision**: ESLint `no-restricted-imports`, generated per zone in `eslint.config.js`.
- **Rationale**: Already installed and runs in CI. Flat config replaces rule options between matching blocks, so each zone lists its full set of patterns.

## Amount limit

- **Decision**: One limit of 900 000,00 € for every amount and income.
- **Rationale**: Without a limit, a huge value could be saved and then fail the read check, leaving the month unreadable. At this limit the largest product in the month calculation stays within exact integer arithmetic.

## Check and write are separate statements

- **Decision**: `editExpense` and `deleteExpense` check and then write without a transaction.
- **Rationale**: The app is single-user and single-process, so nothing can change between both statements.

## Dependencies between features

- **Decision**: Buckets, months, days and money move to `src/shared`, because both features use them. Bucket progress is shared because `BucketRows` is used by home and plan.
- **Rationale**: Keeps expenses and plan independent.

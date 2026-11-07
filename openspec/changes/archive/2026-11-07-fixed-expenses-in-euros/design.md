# Design

## Context

`income-plan` currently stores three whole percentages and computes all targets from the month's income. See proposal.md for why fixed expenses must become an amount. Data lives in SQLite (`plan` table, schema version 1).

## Goals / Non-Goals

**Goals:**
- Integer-cent math with no floating-point percentages stored.
- Month overrides share extra or missing money between leisure and savings proportionally.
- Migrate existing saved plans without losing them.

**Non-Goals:**
- Itemised fixed expenses or per-month fixed expenses.

## Decisions

### 1. Plan shape: `{ incomeCents, fixedCents, savingsPct }`
Leisure is never stored; it is always "what's left". Only savings is an input percentage, so the user never has to make three numbers add up, and fixed % (often not a whole number, e.g. 1000 / 2700 = 37,0 %) is only displayed.
*Alternative:* two editable percentages (leisure and savings) that must add up to 100 − fixed % — rejected because fixed % is usually not a whole number, so whole-number inputs could never add up exactly.

### 2. Target calculation
For the recurring income `I`, fixed `F`, savings `s`:
- plan savings `S = floor(I × s / 100)`, plan remainder `R = I − F`.

For a month with income `M`:
- remainder `r = M − F`. If `r < 0`: shortfall `−r`, leisure = savings = 0, fixed = `F`.
- If `R = 0`: savings = `r`, leisure = 0 (no proportion to keep; extra money is saved).
- Otherwise: savings = `floor(r × S / R)`, leisure = `r − savings`.

When `M = I` this gives exactly the plan's numbers, and leisure/savings keep the plan's proportion for any other income. Leisure absorbs the rounding cent.
Percentages shown are `target / M × 100`, formatted with up to one decimal.

### 3. SQLite migration to version 2
In `migrateDbIfNeeded`, from version 1:
```sql
ALTER TABLE plan ADD COLUMN fixed_cents INTEGER NOT NULL DEFAULT 0;
UPDATE plan SET fixed_cents = income_cents * fixed_pct / 100;
ALTER TABLE plan DROP COLUMN fixed_pct;
ALTER TABLE plan DROP COLUMN leisure_pct;
```
Run inside a transaction. SQLite integer division truncates, so leisure absorbs any cent difference. Fresh installs create the v2 table directly.

### 4. Screens
- Plan editor: income (€), fixed expenses (€, with "x % of income"), savings (%), then a read-only leisure line and the live preview. Errors: income ≤ 0, fixed > income, savings above what's left.
- Home and month income screens show each bucket's percentage of that month's income and the shortfall warning when needed.

## Risks / Trade-offs

- [Users may want to type the leisure % instead of savings] → savings first matches the goal of the app; can add a toggle later.
- [`DROP COLUMN` needs SQLite ≥ 3.35] → expo-sqlite bundles a recent SQLite; verified by running the migration on the phone with an existing v1 plan.

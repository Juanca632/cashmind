# Design

## Context

`plan_version` (schema v4) stores `income_cents`, `fixed_cents`, `savings_pct`; leisure is always the rest. `targetsFor(plan, monthIncome)` keeps fixed and shares the month's remainder between leisure and savings in the plan's proportion; this behaviour stays.

## Goals / Non-Goals

**Goals:**
- Persist what the user typed for fixed expenses and the kept bucket (unit and value) so they reopen exactly as saved.
- Keep `targetsFor` the single place that turns a plan into euro targets.

**Non-Goals:**
- Making fixed expenses automatic; decimal percentages.

## Decisions

### 1. Plan shape
```ts
type Amount = { unit: 'eur'; cents: number } | { unit: 'pct'; pct: number };
type IncomePlan = {
  incomeCents: number;
  fixed: Amount;
  kept: 'leisure' | 'savings';   // the one the user entered; the other is automatic
  keptAmount: Amount;
};
```
`resolve(amount, income)` = cents, or `floor(income × pct / 100)`. Plan targets on the recurring income: `fixed = resolve(fixed)`, `kept = resolve(keptAmount)`, `auto = income − fixed − kept`. `targetsFor` uses those plan targets for the proportion, so month overrides behave as today.
*Alternative:* store every bucket with a unit and a value — redundant, the automatic one is always derived.

### 2. Validation
Income > 0; amounts are non-negative integers (percent 0–100); `fixed ≤ income`; `fixed + kept ≤ income`, reporting the excess in euros.

### 3. Editor state
Form state per bucket: `{ unit, text, previous? }` plus `kept`. Editing leisure or savings sets `kept` to that bucket; the automatic field shows what's left (euros and percent in its hint) and typing in it makes it the kept bucket. Toggling a field's unit converts the value (€ → nearest whole %, % → €) and remembers the previous text, so toggling back without editing restores exactly what was typed. Without a valid value or income the text is kept as is. The automatic field's display unit is not persisted (it is derived). No new dependency: a small `AmountField` with a € / % switch.

### 4. Migration v4 → v5
Rebuild `plan_version` with columns `income_cents, fixed_unit, fixed_value, kept_bucket, kept_unit, kept_value` (value = cents or percent). Existing rows: `fixed_unit='eur', fixed_value=fixed_cents, kept_bucket='savings', kept_unit='pct', kept_value=savings_pct`. Done in the existing transaction with create-new / copy / drop / rename. `CHECK` constraints on units and bucket.

### 5. Home progress
`BucketRows` drops the "% of income" text and, when expenses are passed, shows `round(spent / target × 100) %` with "spent"/"saved" (or "—" when the target is 0). The month income screen keeps showing targets without percentages.

## Risks / Trade-offs

- [Percent of an odd income rounds down to the cent, so the automatic bucket absorbs a cent] → consistent with existing rounding rules; covered by a sum-to-income test.
- [Table rebuild migration] → single transaction, reviewed, and checked on the phone with existing data.

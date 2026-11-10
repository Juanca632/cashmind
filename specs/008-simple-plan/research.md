# Research: Simple Plan

## R1. Left to spend when savings exceed the goal

- **Decision**: left = income − expenses − max(goal, saved).
- **Rationale**: Money saved beyond the goal is no longer available; subtracting only the goal would show money that is not there. Below the goal, the missing part stays reserved.
- **Alternatives**: income − goal − expenses (wrong once saved > goal); income − expenses − saved (ignores the goal until it is saved).

## R2. Months without a saved plan

- **Decision**: they use 20 %. No setup screen.
- **Rationale**: One rule for every month; the user can record from the first launch. Past months stay unchanged when a plan is saved, because they had 20 % before and still do.
- **Alternatives**: keep "no plan" months (extra state and screens for no benefit).

## R3. Converting old data (step 4)

- **Decision**: `fixed` and `leisure` entries become `expense`; a plan version keeps its percentage when it was savings in %, otherwise 20 %; `fixed_item` is dropped.
- **Rationale**: Before v1.0.0 upgrade compatibility is not a priority (developer decision, 2026-11-09). Every recorded entry and amount is kept; only data whose feature is removed is dropped, on purpose and not to recover from a failure.
- **Alternatives**: deriving a percentage from euros or leisure plans (needs each month's income, adds code that is deleted at v1.0.0).

## R4. Where the month picker lives

- **Decision**: `expenses`, with `getFirstEntryMonth`.
- **Rationale**: With no plan months, the oldest data is the first entry. Features do not import each other.

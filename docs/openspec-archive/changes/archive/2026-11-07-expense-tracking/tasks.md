# Tasks

## 1. Domain logic

- [x] 1.1 Add expense types, `totalsByBucket`, `bucketProgress`, `isExpenseMonthEditable` (with day helpers: today key, previous month, add days) and `validateExpense`, and verify unit tests for the spec scenarios (12,50 € leisure, 600/900 savings, 450/400 over, 700/1000 left, 3 vs 6 December grace period, future date rejected)

## 2. Storage

- [x] 2.1 Add schema version 4 with the `expense` table (v3 → v4 and fresh install) and a repo with list-by-month, get, insert, update and delete, and verify on the phone that the existing plan still loads after the update

## 3. Screens

- [x] 3.1 Add `src/app/expense.tsx` (add/edit, amount, bucket toggle, note, bounded day stepper, delete, validation messages) and verify on the phone adding 12,50 € leisure "Cinema" and correcting it to 15,00 €
- [x] 3.2 Show progress per bucket on home (bar, left/over/goal reached) and the month's expense list, with "Add expense" and tap-to-edit only when the month is editable, and verify on the phone the over-limit warning and that a past month outside the grace period is read-only

## 4. Final check

- [x] 4.1 Run `npx expo lint`, `npx tsc --noEmit`, `npm test` and the `code-reviewer` subagent, and fix BLOCKER/MAJOR findings

## Workflow follow-up

- Archive the change with `/opsx:archive` after the developer approves it on the phone.

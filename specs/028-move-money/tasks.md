# Tasks: Move money

- [X] T001 Migration 11 (`move` table) in src/db/migrations.ts and its structure in src/test-support/released-schemas.ts
- [X] T002 Rules in src/features/entries/rules.ts: `Move`, `MoveInput`, `validateMove`, `moveTooMuch`, moves in `pocketBalances`, `movedIntoMain`, `ListItem`, `mergeByDate`, `moveTitle`; `monthSummary` with money moved in (src/features/home/month-summary.ts)
- [X] T003 Repository: `getMoves`, `getMove`, `insertMove`, `updateMove`, `deleteMove`, moves in `pocketInUse` (src/features/entries/repository.ts)
- [X] T004 Service: `addMove`, `editMove`, `deleteMove` with the balance limit; new in-use message (src/features/entries/service.ts)
- [X] T005 [US1] Hooks `useMoves`, `useMove`; route src/app/move.tsx and screen src/features/entries/screens/move-screen.tsx
- [X] T006 [US1] `EntryList` with move rows (src/features/entries/components/entry-list.tsx); `PocketChoices` `allowNew`
- [X] T007 [US1] [US2] Pocket space: "Move" action, balance and list with moves; spaces sheet balances (src/features/home)
- [X] T008 [US1] Home Main: summary, pace and list with moves into Main; Activity list (src/features/home/screens/home-screen.tsx, src/features/entries/screens/activity-screen.tsx)
- [X] T009 [US3] Pocket form in-use text; demo data move
- [X] T010 Baseline specs 001 FR-013 and 002 FR-004
- [X] T011 Tests by the `test-writer` subagent for 028-move-money
- [X] T012 lint, tsc, jest; `code-reviewer`; fix BLOCKER/MAJOR

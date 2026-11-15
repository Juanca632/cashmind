# Tasks: Spending Pace

**Input**: [spec.md](./spec.md), [plan.md](./plan.md)

- [X] T001 Install `react-native-svg` with `npx expo install react-native-svg`
- [X] T002 [US1] `spendingPace()` and `paceSentence()` in src/features/home/month-summary.ts (cents, `Math.floor`, flat line when start > end, a cumulative total per day, pace only in the current month)
- [X] T003 [US1] `Size.chart` token in src/shared/theme/theme.ts and `SpendingPaceChart` in src/features/home/components/spending-pace-chart.tsx (svg line through each day's total with a soft fill in `kindInk.expense`, dashed pace line in `textSecondary`, last-point dot, caption labels, one accessible description)
- [X] T004 [US1][US2] Home in src/features/home/screens/home-screen.tsx: "Overview" title above the tiles, "Spending pace" section with the chart and the sentence (current month only) between the tiles and Activity, both only with income
- [X] T005 Baseline spec: specs/002-income-plan/spec.md FR-004
- [X] T006 test-writer writes the tests from specs/019-spending-pace/spec.md
- [X] T007 Run lint, typecheck and tests (`--maxWorkers=2`)
- [X] T008 code-reviewer reviews 019-spending-pace

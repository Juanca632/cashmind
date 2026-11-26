# Implementation Plan: Whole pesos

**Branch**: `fix/032-whole-pesos` | **Date**: 2026-11-26 | **Spec**: [spec.md](./spec.md)

## Summary

`Money` gains `unitCents` (100 for pesos, 1 otherwise). The peso formatter cuts to whole pesos. `savingsGoal`, `monthSummary`/`monthFigures`, `savingsGoals` (Trends) and `shareOut` take `unitCents` (default 1) and round down to it; the screens pass `money.unitCents`. No storage change.

## Constitution Check

| Principle | Result |
| --- | --- |
| II. Simple | Pass. One rule for pesos, in `money.ts` and the goal. |
| IV. Money | Pass. Integer cents; rounding to a multiple of 100 for pesos. |

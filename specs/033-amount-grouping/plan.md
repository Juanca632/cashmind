# Implementation Plan: Amount grouping

**Branch**: `feat/033-amount-grouping` | **Date**: 2026-11-26 | **Spec**: [spec.md](./spec.md)

## Summary

`src/shared/money.ts` gets one reader per currency (`InputStyle`: decimal mark, alternate mark, thousands separator) used both to parse and to rewrite typed text (`Money.groupInput`); `toInput` returns grouped text. `AmountField` and Split's fields pass what is typed through `groupInput`, with `MAX_AMOUNT_TEXT` = 17. No storage change.

## Constitution Check

| Principle | Result |
| --- | --- |
| II. Simple | Pass. One reader for parsing and grouping; no library. |
| IV. Money | Pass. Integer cents; parsing unchanged in value. |

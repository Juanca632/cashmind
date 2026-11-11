# cashmind Constitution

cashmind is a personal budgeting app for Android (Expo / React Native, TypeScript). Currency is EUR; the user lives in France.

## Core Principles

### I. Privacy First

All financial data MUST stay on the device. The one exception is Android's own encrypted backup of the app's data to the user's Google account, which Android runs when the user has backup turned on. The app MUST NOT use bank credentials or open banking, and MUST NOT have a backend unless the developer explicitly decides otherwise. Financial data MUST NOT be logged, and the app itself MUST NOT send it over the network.

### II. Keep It Simple

Build only what the current feature needs. No speculative abstractions, layers or libraries "for later".

### III. Android First

Android is the only target. iOS is out of scope for now.

### IV. Money Is Integer Cents

Amounts are EUR and MUST be stored and computed as integer cents. Floating point MUST NOT be used for money.

### V. English in the Repository

All code, comments, docs, specs and commit messages MUST be in English.

## Technical Constraints

- Expo APIs change every SDK release: read the versioned docs for the installed SDK before using them.
- Navigation uses Expo Router; every file in `src/app/` is a route.
- Data lives in `expo-sqlite`. Migrations MUST be versioned and run in a transaction. From v1.0.0 they MUST preserve all existing user data. Before v1.0.0 a migration MAY drop the data of a removed feature when the feature's spec says so and the developer approved it; it MUST never drop data to recover from a failure.

## Development Workflow

- New feature specs MUST state what is out of scope and stay short.
- Tasks MUST be small enough that each can be verified on the phone or with a test.
- `specs/001-expenses`, `specs/002-income-plan` and `specs/003-month-browsing` are baseline specs describing current behavior. A feature that changes that behavior MUST update the affected baseline spec in the same change.
- Lint, typecheck and tests MUST pass before a feature is considered done.
- Domain logic changes MUST have unit tests covering the spec scenarios.
- User-facing changes MUST have integration tests: real routes, services and repositories on the test database, following whole journeys across screens.
- The main journeys MUST be run end to end (E2E) on the real app, on an Android emulator or phone, before any release or APK.
- The `code-reviewer` subagent MUST review a feature before it is committed.

## Governance

This constitution takes precedence over other practices. Amending it requires the developer's approval and a version bump. `AGENTS.md` holds runtime guidance for agents and MUST stay consistent with it.

**Version**: 1.3.0 | **Ratified**: 2026-11-08 | **Last Amended**: 2026-11-11

# Research: Database Foundation

## Showing the failure message

- **Decision**: An error boundary around `SQLiteProvider`, which only handles the two update errors and rethrows anything else.
- **Rationale**: `SQLiteProvider` calls `onError` during render, or throws when there is none. Setting state from `onError` would update a parent while rendering. A boundary is the React mechanism for errors thrown in render.
- **Alternatives considered**: `onError` with state; catching inside `onInit`, which would render the app without a usable database.

## Transactions

- **Decision**: One transaction per step, including `PRAGMA user_version`.
- **Rationale**: This is how Signal Android applies its migrations. A failure keeps all finished steps.

## Starting at version 1

- **Decision**: One step creates the final structure.
- **Rationale**: No APK exists, so no installed app depends on the five development versions. They remain in git history.

## Strict tables

- **Decision**: `STRICT` plus `CHECK` for formats and valid values, leaving the 900 000,00 € limit in the rules.
- **Rationale**: These rules require rebuilding a table if added later. Business limits may change, so they stay out of the database.

## Automatic copy

- **Decision**: Not included.
- **Rationale**: A copy needs a restore path, which belongs to the backup feature.

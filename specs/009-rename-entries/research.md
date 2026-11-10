# Research: Rename Entries

## R1. How to rename the table and column

- **Decision**: rebuild the table: create `entry`, copy every row, drop `expense`. Same pattern as steps 3 and 4.
- **Rationale**: the CHECK constraint names the column, and a rebuilt table gives exactly the same structure as a fresh install, which the upgrade tests compare.
- **Alternatives**: `ALTER TABLE … RENAME` and `RENAME COLUMN` (they depend on how SQLite rewrites the CHECK; harder to prove identical).

## R2. Old route

- **Decision**: no redirect from `/expense`.
- **Rationale**: nothing outside the app links to it.

# Contract: Migrations

`runMigrations(db, migrations)` in `src/db/migrate.ts`:

- `migrations` are `{ version, up }`, numbered 1, 2, 3 and so on with no gaps.
- Applies only steps above the stored version, each in a transaction with its version change.
- Throws `DatabaseNewerError` if the stored version is above the latest step, writing nothing.
- Throws `DatabaseMigrationError` if a step fails, keeping every earlier step.

`migrateDbIfNeeded(db)` in `src/db/database.ts` runs the real list.

Adding a change: add a step to `src/db/migrations.ts`, add its structure to `src/test-support/released-schemas.ts`, and add a test that upgrades sample data. A step already released is never edited.

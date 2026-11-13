# Research: Categories

Guidance: SQLite `ALTER TABLE ADD COLUMN` rules; existing migrations (steps 4 and 5); Feather glyph map in `node_modules/@react-native-vector-icons/feather`.

## R1. Migration

- **Decision**: step 6 is one `ALTER TABLE entry ADD COLUMN category TEXT NOT NULL DEFAULT 'other' CHECK ((kind = 'expense' AND category IN (...)) OR (kind = 'income' AND category IN (...)) OR (kind = 'savings' AND category IN (...)))`.
- **Rationale**: SQLite allows `NOT NULL` with a constant default and a `CHECK` that reads other columns of the row; existing rows get `'other'`, which is valid for every kind. Verified on Node's SQLite (the test double): existing rows read `other`, an income in `housing` is refused. No table rebuild, so ids, dates and `created_at` cannot change.
- **Alternatives**: rebuilding the table (as steps 4–5; more SQL, same result); a nullable column meaning Other (two ways to say Other); a categories table (user data that does not exist: lists are fixed).

## R2. Keys and lists

- **Decision**: string keys shared across kinds only for `other`: expense `housing, groceries, transport, eating_out, leisure, health, subscriptions, other`; income `salary, freelance, benefits, gifts, other`; savings `emergency_fund, investments, travel, goal, other`. Labels and Feather icons in `entries/categories.ts`.
- **Icons**: housing `home`, groceries `shopping-cart`, transport `navigation`, eating out `coffee`, leisure `film`, health `heart`, subscriptions `repeat`, salary `briefcase`, freelance `pen-tool`, benefits `shield`, gifts `gift`, emergency fund `umbrella`, investments `bar-chart-2`, travel `globe`, goal `target`. Other uses the kind's icon, so existing rows look as today.

## R3. Reading and validation

- **Decision**: the repository reads `category` with `readOneOf(ALL_CATEGORIES)` and throws `DataFormatError` when `isCategoryOf(kind, category)` is false. `validateEntry` adds `'category-invalid'` ("Pick a category for this kind.").

## R4. Split

- **Decision**: pure `categorySplit(entries, kind)` → `[{ category, cents, percent }]`, cents summed per category, sorted by cents descending then list order, `percent = Math.round(cents × 100 / total)`; empty when the kind has no entries.
- **UI**: a card above the list when a tile is selected, titled "By category"; no split card when it would be empty (the list's empty text already says so).

## R5. Form

- **Decision**: a wrapping row of category pills (icon + label, `accessibilityRole="radio"`) under the kind selector; Other is selected by default and after any kind change.

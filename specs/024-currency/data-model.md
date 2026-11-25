# Data Model: Currency

No new table and no migration. A new key goes in the `setting` table of 023:

| Key | Values | Missing means |
| --- | --- | --- |
| `currency` | `'EUR'`, `'USD'`, `'COP'` | `'EUR'` |

- **Reading**: any other value is a format error. The app then uses EUR, and never rewrites the value by itself.
- **Writing**: only `settings/service.ts` (`setCurrency`) writes.
- **Amounts**: every `amount_cents` column keeps its meaning of integer hundredths of the selected currency. Nothing is converted or rewritten when the currency changes.

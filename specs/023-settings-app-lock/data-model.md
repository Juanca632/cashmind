# Data Model: Settings and app lock

## `setting` (migration 8)

| Column | Type | Rules |
| --- | --- | --- |
| `key` | TEXT, primary key | the option's name |
| `value` | TEXT, not null | the option's value |

The table is `STRICT`. Migration 8 only creates it and changes no other table.

### Keys used by this feature

| Key | Values | Missing means |
| --- | --- | --- |
| `app_lock` | `'on'`, `'off'` | on |

- **Reading**: `'on'` reads as `true` and `'off'` as `false`. Any other value is a format error. The lock gate treats a format error as on, and never rewrites the value by itself.
- **Writing**: only `settings/service.ts` (`setAppLock`) writes, with an upsert.

## Not stored

- Whether the phone has a screen lock: it is asked from the phone each time.
- When the app left the foreground: it is kept in memory only.

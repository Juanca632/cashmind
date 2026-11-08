# Quickstart: Validating App Architecture Foundation

Prerequisites: `npm ci`, with Node 22 or newer.

| Check | Command | Expected |
| --- | --- | --- |
| All scenarios | `npm test` | Every test passes |
| Types | `npm run typecheck` | No errors |
| Boundaries | `npm run lint` | No errors |

To confirm a boundary works, import a repository from a screen and run `npm run lint`: it must fail. Revert afterwards.

On a phone, go through: create a plan, add, edit and delete an expense, change the month income, and browse a past month. Everything must work as before.

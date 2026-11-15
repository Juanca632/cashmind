# UI Contract: Recurring Entries

Exact texts and accessible names, so tests and flows can find them.

## Entry form (`/entry`)

- Switch: label "Repeat every month", role `switch`, accessible name "Repeat every month". Only in the current month.
- Route param `repeat=1` opens the form with the switch on.

## My plan (`/plan`)

- Section heading: "Every month".
- Row: accessible name `"<label>, <amount>, every month"`, e.g. "Rent, 900,00 €, every month", "Salary, +2 000,00 €, every month" (label = note, or the category name when there is no note).
- Total: "Fixed costs: 912,99 € a month" (expenses only; "Fixed costs: 0 € a month" is not shown when there are no repeating expenses).
- Empty: "Nothing repeats yet."
- Action: link button "Add" with accessible name "Add a monthly entry".

## Item screen (`/recurring?id=<id>`)

- Title: "Every month".
- Kind badge (not editable), "Amount", the kind's categories, "Note (optional)".
- Buttons: "Save changes", "Stop repeating" (destructive).
- Stop dialog: title "Stop repeating?", message "Past entries stay.", buttons "Cancel" and "Stop".
- Missing item: "This monthly entry no longer exists."

## Lists (home, Activity)

- A linked entry's row shows the repeat icon and its accessible name ends with ", repeats every month".

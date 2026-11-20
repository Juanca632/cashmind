# UI Contract: Quick add

## Entry form (adding)

- While the kind is Expense and there is at least one suggestion, a "Recent" title and up to 4 buttons show between the amount field and the kind choice.
- Each button shows the category icon and "<title> · <amount>" (for example "Café · 2,50 €"); its accessible name is "Fill with <title>, <category name>, <amount>" (for example "Fill with Café, Eating out, 2,50 €").
- `<title>` is the note, else the category name, else "Expense" for Other.
- Tapping one sets the amount field, the selected category and the note; the kind, the date and "Repeat every month" are unchanged; nothing is saved.
- Switching the kind to Income or Savings hides the title and buttons; switching back to Expense shows them again.

## Entry form (editing)

- No "Recent" title and no suggestions.

## Home and Activity

- Unchanged.

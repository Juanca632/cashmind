# UI Contract: Quick add

## Entry form (adding)

- While the kind is Expense and there is at least one suggestion, up to 4 buttons show in one sideways-scrolling row under the title "Often recorded", under the categories (022).
- Each button shows the category icon and "<title> · <amount>" (for example "Café · 2,50 €"); its accessible name is "Fill with <title>, <category name>, <amount>" (for example "Fill with Café, Eating out, 2,50 €").
- `<title>` is the note, else the category name, else "Expense" for Other.
- Tapping one sets the amount field, the selected category and the note; the kind, the date and "Repeat every month" are unchanged; nothing is saved.
- Switching the kind to Income or Savings hides the title and buttons; switching back to Expense shows them again.

## Entry form (editing)

- No suggestions.

## Home and Activity

- Unchanged.

# Contract: Categories in the UI

## Entry form

- Below the kind selector, a group of category options for the selected kind, in the list order of [data-model.md](../data-model.md), each with its icon and label.
- Each option: `accessibilityRole="radio"`, accessibility label = the category label (for example `Groceries`), `accessibilityState.selected` on the chosen one.
- New entry: `Other` selected. Changing the kind (new or existing entry): the new kind's options, `Other` selected.
- Editing: the entry's category selected. Changing only the category enables "Save changes" and leaving asks before discarding.
- A category not in the kind's list is refused with "Pick a category for this kind." (service validation).

## Home split

- Shown only when a tile (Income, Spent, Savings) is selected and that kind has entries this month; placed above the list.
- Title: `By category`.
- One line per used category, largest amount first (ties in list order): icon, label, amount (`650,00 €`), percentage (`54 %`, rounded to the nearest whole number, half up).
- Each line's accessibility label: `Housing: 650,00 €, 54 %`.

## List rows (home and Activity)

- Badge icon: the category's icon (for Other, the kind's icon as today) on the kind's tint.
- Title: note; else the category label; else (Other) the kind label (`Expense`, `Income`, `Savings`).

## Repeat income

- The entry recorded by "Repeat …" on home has category `other`.

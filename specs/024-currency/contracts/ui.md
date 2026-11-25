# UI Contract: Currency

## Settings

- A "Currency" section sits between "Security" and "About". It is a radio group named "Currency" with three options: "Euro", "US dollar" and "Colombian peso". Exactly one is selected, and Euro is the default.
- Under the options: "Amounts are not converted when you change the currency."
- Tapping another option opens the confirmation dialog: title "Change to <name>?", text "Your amounts keep their numbers and will show in <name>. Nothing is converted.", buttons "Cancel" (keeps the current one) and "Change" (accent, not red), which saves and applies it at once. It always asks.

## Every amount (examples for 123456 hundredths and 300000 hundredths)

| Currency | Format | Compact (home tiles, My plan) |
| --- | --- | --- |
| Euro | 1 234,56 € | 3 000 € |
| US dollar | $1,234.56 | $3,000 |
| Colombian peso | $ 1.234,56 (whole: $ 3.000) | $ 3.000 |

- In pesos, an amount with cents shows 2 decimals ("$ 12,50") and a whole amount none ("$ 45.000").

## Amount field

| Currency | Symbol | Placeholder | Keyboard | Edit text for 1250 / 4500000 |
| --- | --- | --- | --- | --- |
| Euro | € after | 0,00 | decimal | 12,50 / 45000,00 |
| US dollar | $ before | 0.00 | decimal | 12.50 / 45000.00 |
| Colombian peso | $ before | 0 | digits | 12,50 / 45000 |

## Messages

- "The amount must be greater than 0."
- "This amount is too large." (above 900 000 000)
- My plan with no income: "Add this month's income to see the amount."

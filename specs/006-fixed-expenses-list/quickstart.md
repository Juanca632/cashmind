# Quickstart: Fixed Expenses List

## Automatic checks

```bash
npx jest
npx tsc --noEmit
npx expo lint
```

Every acceptance scenario in [spec.md](./spec.md) has a test. The upgrade scenarios run against the saved structure of version 1.

## On the phone

Use invented data, or back up first if the phone holds real finances.

1. **Upgrade**: install over a version with a saved plan. The home screen shows the same fixed total, and Fixed lists one item called "Fixed expenses".
2. **Build the list**: Edit plan, replace that item with House 700, Transport 60, Phone 20 and Supermarket 250. The total reads 1030,00 €.
3. **What is left**: with an income of 2000, it reads 970,00 €. Set savings to 20 % and it shows 400,00 €, with wants at 28,5 % (570,00 €). Set wants to 30 % and savings becomes 18,5 %. Set savings back to 20 % and save.
4. **Home**: Fixed shows 1030,00 € with no amount left or over. Tapping it shows the four items.
5. **Income change**: raise the income to 2500 and save. Fixed stays 1030,00 €, savings becomes 500,00 € and wants 970,00 €.
6. **One month**: change this month's income to 3000. Fixed stays 1030,00 €.
7. **Add expense**: only Wants and Savings can be chosen.
8. **Too much**: make the list add up to more than the income. Save is disabled and the excess is shown.

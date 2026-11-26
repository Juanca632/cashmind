# Feature Specification: Currency

**Feature Branch**: `feat/024-currency`

**Created**: 2026-11-24

**Status**: Draft

**Input**: User description: "In Settings the user picks the app's currency: euro (EUR), US dollar (USD) or Colombian peso (COP), only these three. One currency for the whole app, euro by default. Changing it does not convert amounts: it only changes how they are shown and typed. Each currency is shown in its usual format; the peso has no decimals. Out of scope: multi-currency, conversion, exchange rates, any other currency."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Keep my budget in my own currency (Priority: P1)

Someone who earns and spends in pesos or dollars wants the app to show and take amounts in that currency instead of euros.

**Why this priority**: It is the whole feature.

**Independent Test**: In Settings pick each currency, then check home, an entry form, the lists, My plan and Trends.

**Acceptance Scenarios**:

1. *Default*: **Given** the app was just installed or updated, **When** the user opens Settings, **Then** a "Currency" section shows Euro, US dollar and Colombian peso with Euro selected, **And** every amount looks as before (for example "1 234,56 €")
2. *Asked first*: **When** the user selects US dollar, **Then** a dialog asks "Change to US dollar?" saying "Your amounts keep their numbers and will show in US dollar. Nothing is converted."; **If** they tap Cancel, Euro stays selected and nothing changes
3. *Pick dollars*: **When** the user selects US dollar and taps Change, **Then** every amount in the app shows in the US format, for example "$1,234.56", and the entry form shows "$" before the amount with "0.00" as placeholder
4. *Pick pesos*: **When** the user selects Colombian peso and taps Change, **Then** every amount shows in the Colombian format with no decimals, for example "$ 1.234.567", and the entry form shows "$" before the amount, "0" as placeholder and a keyboard with digits only
5. *No conversion*: **Given** an expense of 50,00 €, **When** the user selects Colombian peso, **Then** it shows "$ 50", **And** switching back to Euro shows 50,00 € again; no stored amount changed
6. *Explained*: **Then** under the choice Settings says "Amounts are not converted when you change the currency."
7. *Remembered*: **Given** the user picked a currency, **When** they reopen the app from scratch, **Then** it is still selected and used everywhere
8. *Right away*: **When** the user picks a currency, confirms and goes back, **Then** the screens they come back to already use it

---

### User Story 2 - Type amounts in that currency (Priority: P1)

**Why this priority**: Recording amounts is the main journey. The form must accept the way each currency is written.

**Independent Test**: With each currency selected, type amounts in the entry form and save.

**Acceptance Scenarios**:

1. *Euro and dollar decimals*: **Given** Euro or US dollar, **When** the user types "12,50" or "12.50", **Then** 12.50 is saved, as today
2. *Pesos*: **Given** Colombian peso, **When** the user types "45000", **Then** $ 45.000 is saved, **And** "45.000" (with a thousands dot) is also read as 45 000
3. *Editing*: **When** the user opens an existing entry, **Then** its amount is shown for editing in the currency's way: "12,50" (Euro), "12.50" (US dollar), "45000" (Colombian peso)
4. *Too large*: **When** the user types more than 900 000 000 in any currency, **Then** the form says "This amount is too large." and does not save

---

### Edge Cases

- **Amounts with cents shown in pesos**: an amount with cents (recorded in euros or dollars before a switch) shows its decimals in pesos too, for example "$ 12,50", so nothing looks rounded; whole amounts show none.
- **Unreadable setting**: if the stored currency cannot be read, the app uses Euro and changes nothing.
- **Messages**: texts that named the euro ("greater than 0 €", "to see it in euros") no longer name a currency.
- **Accessibility**: each currency option is a selectable button with its full name ("Euro", "US dollar", "Colombian peso") and its selected state.
- **Why always ask**: one predictable rule; the dialog is seen once per person, when they set their currency.
- **Width**: long peso amounts (for example "$ 12.500.000") fit the same places as euro amounts; the big figures already shrink to fit.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001** (Choice): Settings MUST show a "Currency" section, between Security and About, with three options: Euro, US dollar, Colombian peso. Exactly one is selected and Euro is the default. Choosing another first asks, with the app's confirmation dialog, "Change to <name>?" and "Your amounts keep their numbers and will show in <name>. Nothing is converted.", with Cancel and Change (not red: nothing is lost). Change applies it at once; Cancel keeps the current one. It always asks, whatever data there is.
- **FR-002** (One for the app): Every amount the app shows or accepts MUST use the selected currency. This covers home, the lists, Activity, the entry and monthly entry forms, My plan, Trends and the screen-reader texts.
- **FR-003** (Formats): Euro is shown as today, for example "1 234,56 €" and "3 000 €" for compact whole amounts. US dollar is shown as "$1,234.56", compact "$3,000". Colombian peso is shown as "$ 1.234.567", always in whole pesos: an amount with cents is cut towards zero when shown and keeps its cents when stored (see 032).
- **FR-004** (Typing): The amount field MUST show the currency's symbol on its usual side, a placeholder of "0,00", "0.00" or "0", and a keyboard with decimals for Euro and US dollar, digits only for Colombian peso. While typing, the field groups thousands as the currency shows them ("1 500 000,50", "1,500,000.50", "1.500.000"). Euro reads "," or "." as the decimal mark; US dollar reads "." as the decimal mark and "," only between thousands; Colombian peso accepts whole numbers (see 033).
- **FR-005** (No conversion): Changing the currency MUST NOT change any stored amount.
- **FR-006** (Limit): The largest amount is 900 000 000 in every currency, and the message is "This amount is too large.".
- **FR-007** (Stored): The currency MUST be stored on the device in the settings of 023. No migration is needed.
- **FR-008** (Baseline specs and rules): `specs/001-expenses` MUST say amounts use the currency chosen in Settings. The constitution (principle IV) and `AGENTS.md` ("amounts are EUR") MUST say the same.

### Key Entities

- **Setting `currency`**: `EUR`, `USD` or `COP`. When it is missing, the currency is EUR.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: After picking a currency, no screen shows an amount in another currency.
- **SC-002**: Picking a currency takes 2 taps from home (gear, the currency).
- **SC-003**: A user who never opens Settings sees exactly the same amounts and formats as before.
- **SC-004**: Switching currencies back and forth never changes a stored amount.

## Assumptions

- Amounts stay stored as whole hundredths of the currency, so no stored data changes. A peso amount is stored as hundredths too, for example $ 45.000 as 4 500 000.
- The single limit of 900 000 000 fits a large peso amount. Sums of many such amounts stay exact.
- The US dollar uses the US format and the peso the Colombian one. With one currency for the whole app, both being "$" is never ambiguous.
- App texts stay in English.

## Out of Scope

- Several currencies at once, or a currency per entry.
- Converting amounts and exchange rates.
- Any other currency, and the user's own number format.

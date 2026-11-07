import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet } from 'react-native';

import { AmountField } from '@/components/amount-field';
import { BUCKET_LABELS, ERROR_COLOR } from '@/components/bucket-rows';
import { Button } from '@/components/button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { savePlanFromMonth } from '@/data/income-plan-repo';
import {
  convertAmount,
  formatEuros,
  formatMonth,
  formatPercentOf,
  monthKey,
  otherFlexible,
  parseEurosToCents,
  parsePercent,
  planExcessCents,
  planForMonth,
  planTargets,
  resolveAmount,
  validatePlan,
  type Amount,
  type FlexibleBucket,
  type IncomePlan,
} from '@/domain/income-plan';
import { useIncomePlan } from '@/hooks/use-income-plan';

type Unit = Amount['unit'];
/** `previous` is the text in the other unit before the last toggle, restored when toggling back unedited. */
type FieldState = { unit: Unit; text: string; previous?: string };

export default function PlanScreen() {
  const state = useIncomePlan();
  if (state.status === 'loading') return <ThemedView style={styles.screen} />;
  const currentMonth = monthKey(new Date());
  return <PlanForm initialPlan={planForMonth(state.versions, currentMonth)} currentMonth={currentMonth} />;
}

/** Switches a field's unit. Toggling back without editing restores exactly what was typed. */
function toggleUnit(field: FieldState, unit: Unit, incomeCents: number | null): FieldState {
  if (unit === field.unit) return field;
  if (field.previous !== undefined) return { unit, text: field.previous, previous: field.text };
  const amount = parseField(field);
  // Without a valid value or income there is nothing to convert: keep the text as typed.
  const text = amount && incomeCents ? amountToText(convertAmount(amount, incomeCents)) : field.text;
  return { unit, text, previous: field.text };
}

function amountToText(amount: Amount): string {
  return amount.unit === 'eur' ? (amount.cents / 100).toFixed(2).replace('.', ',') : String(amount.pct);
}

function parseField(field: FieldState): Amount | null {
  if (field.unit === 'eur') {
    const cents = parseEurosToCents(field.text);
    return cents === null ? null : { unit: 'eur', cents };
  }
  const pct = parsePercent(field.text);
  return pct === null ? null : { unit: 'pct', pct };
}

/** Euro cents expressed in the given unit, for the automatic field. */
function centsIn(unit: Unit, cents: number, incomeCents: number): Amount {
  const amount: Amount = { unit: 'eur', cents };
  return unit === 'eur' ? amount : convertAmount(amount, incomeCents);
}

/** The value in the other unit, shown under a field. */
function otherUnitHint(amount: Amount | null, incomeCents: number | null): string | undefined {
  if (!amount || !incomeCents) return undefined;
  const cents = resolveAmount(amount, incomeCents);
  return amount.unit === 'eur' ? `${formatPercentOf(cents, incomeCents)} of your income` : `= ${formatEuros(cents)}`;
}

function PlanForm({ initialPlan, currentMonth }: { initialPlan: IncomePlan | null; currentMonth: string }) {
  const db = useSQLiteContext();
  const initialKept = initialPlan?.kept ?? 'savings';
  const [incomeText, setIncomeText] = useState(
    initialPlan ? amountToText({ unit: 'eur', cents: initialPlan.incomeCents }) : '',
  );
  const [fixed, setFixed] = useState<FieldState>(
    initialPlan ? { unit: initialPlan.fixed.unit, text: amountToText(initialPlan.fixed) } : { unit: 'eur', text: '' },
  );
  const [kept, setKept] = useState<FlexibleBucket>(initialKept);
  const [fields, setFields] = useState<Record<FlexibleBucket, FieldState>>(() => {
    const keptField: FieldState = initialPlan
      ? { unit: initialPlan.keptAmount.unit, text: amountToText(initialPlan.keptAmount) }
      : { unit: 'pct', text: '20' };
    const autoField: FieldState = { unit: 'eur', text: '' };
    return initialKept === 'savings' ? { savings: keptField, leisure: autoField } : { leisure: keptField, savings: autoField };
  });
  const [saving, setSaving] = useState(false);

  const incomeCents = parseEurosToCents(incomeText);
  const validIncome = incomeCents !== null && incomeCents > 0 ? incomeCents : null;
  const fixedAmount = parseField(fixed);
  const keptAmount = parseField(fields[kept]);
  const auto = otherFlexible(kept);

  const plan: IncomePlan = {
    incomeCents: incomeCents ?? 0,
    fixed: fixedAmount ?? { unit: 'eur', cents: Number.NaN },
    kept,
    keptAmount: keptAmount ?? { unit: 'eur', cents: Number.NaN },
  };
  const errors = validatePlan(plan);
  const targets = errors.length === 0 ? planTargets(plan) : null;

  // The automatic field always shows what is left, in the unit chosen for it.
  const autoUnit = fields[auto].unit;
  const autoText = targets ? amountToText(centsIn(autoUnit, targets[auto], plan.incomeCents)) : '';
  const autoHint = targets
    ? `What's left: ${formatEuros(targets[auto])} · ${formatPercentOf(targets[auto], plan.incomeCents)}`
    : "What's left after the other buckets";

  function editFlexible(bucket: FlexibleBucket, text: string) {
    // Typing in a field makes it the kept one; the other becomes automatic.
    setKept(bucket);
    setFields((current) => ({ ...current, [bucket]: { unit: current[bucket].unit, text } }));
  }

  function changeFlexibleUnit(bucket: FlexibleBucket, unit: Unit) {
    if (bucket !== kept) {
      // The automatic field only changes how it is displayed.
      setFields((current) => ({ ...current, [bucket]: { unit, text: '' } }));
      return;
    }
    setFields((current) => ({ ...current, [bucket]: toggleUnit(current[bucket], unit, validIncome) }));
  }

  function changeFixedUnit(unit: Unit) {
    setFixed(toggleUnit(fixed, unit, validIncome));
  }

  async function onSave() {
    setSaving(true);
    try {
      await savePlanFromMonth(db, plan, currentMonth);
      router.back();
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior="padding">
      <ThemedView style={styles.screen}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <ThemedText type="small" themeColor="textSecondary">
            Changes apply from {formatMonth(currentMonth)} onwards. Past months keep their plan. Of leisure and
            savings, the one you edit last is kept and the other gets what&apos;s left.
          </ThemedText>

          <TextField
            label="Monthly income"
            suffix="€"
            keyboardType="decimal-pad"
            placeholder="2000,00"
            value={incomeText}
            onChangeText={setIncomeText}
          />
          {incomeText.trim() !== '' && !validIncome ? <ErrorText>Income must be greater than 0 €.</ErrorText> : null}

          <AmountField
            label="Fixed expenses (rent, bills, subscriptions…)"
            unit={fixed.unit}
            value={fixed.text}
            onChangeText={(text) => setFixed({ unit: fixed.unit, text })}
            onChangeUnit={changeFixedUnit}
            hint={otherUnitHint(fixedAmount, validIncome)}
          />
          {validIncome && fixed.text.trim() !== '' && errors.includes('fixed-invalid') ? (
            <ErrorText>Fixed expenses must be a valid amount and cannot exceed your income.</ErrorText>
          ) : null}

          {(['savings', 'leisure'] as const).map((bucket) => {
            const isAuto = bucket === auto;
            return (
              <AmountField
                key={bucket}
                label={BUCKET_LABELS[bucket]}
                unit={fields[bucket].unit}
                value={isAuto ? autoText : fields[bucket].text}
                automatic={isAuto}
                onChangeText={(text) => editFlexible(bucket, text)}
                onChangeUnit={(unit) => changeFlexibleUnit(bucket, unit)}
                hint={isAuto ? autoHint : otherUnitHint(keptAmount, validIncome)}
              />
            );
          })}
          {fields[kept].text.trim() !== '' && errors.includes('kept-invalid') ? (
            <ErrorText>{BUCKET_LABELS[kept]} must be an amount in euros or a whole percentage from 0 to 100.</ErrorText>
          ) : null}
          {errors.includes('over-income') ? (
            <ErrorText>
              Fixed expenses and {BUCKET_LABELS[kept].toLowerCase()} are {formatEuros(planExcessCents(plan))} over your
              income.
            </ErrorText>
          ) : null}

          <Button label="Save plan" disabled={errors.length > 0 || saving} onPress={onSave} />
        </ScrollView>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

function ErrorText({ children }: { children: React.ReactNode }) {
  return (
    <ThemedText type="small" style={{ color: ERROR_COLOR }}>
      {children}
    </ThemedText>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    gap: Spacing.three,
    padding: Spacing.four,
  },
});

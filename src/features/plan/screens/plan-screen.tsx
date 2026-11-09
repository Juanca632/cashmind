import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet } from 'react-native';

import { AmountField } from '@/features/plan/components/amount-field';
import { useIncomePlan } from '@/features/plan/hooks/use-income-plan';
import {
  amountToText,
  centsIn,
  otherUnitHint,
  parseField,
  toggleUnit,
  type FieldState,
  type Unit,
} from '@/features/plan/plan-form';
import {
  incomeErrorMessage,
  isValidMonthIncome,
  planErrorMessage,
  planForMonth,
  planTargets,
  validatePlan,
  type IncomePlan,
} from '@/features/plan/rules';
import { savePlan } from '@/features/plan/service';
import {
  BUCKET_DESCRIPTIONS,
  BUCKET_LABELS,
  SUGGESTED_PERCENT,
  otherFlexible,
  type Bucket,
  type FlexibleBucket,
} from '@/shared/buckets';
import { useSubmit } from '@/shared/hooks/use-submit';
import { formatEuros, formatPercentOf, parseEurosToCents } from '@/shared/money';
import { formatMonth, monthKey } from '@/shared/months';
import { Spacing } from '@/shared/theme/theme';
import { Button } from '@/shared/ui/button';
import { DataError } from '@/shared/ui/data-error';
import { ErrorText } from '@/shared/ui/error-text';
import { PlanBar } from '@/shared/ui/plan-bar';
import { TextField } from '@/shared/ui/text-field';
import { ThemedText } from '@/shared/ui/themed-text';
import { ThemedView } from '@/shared/ui/themed-view';

export default function PlanScreen() {
  const state = useIncomePlan();
  if (state.status === 'error') return <DataError />;
  if (state.status === 'loading') return <ThemedView style={styles.screen} />;
  const currentMonth = monthKey(new Date());
  return <PlanForm initialPlan={planForMonth(state.data.versions, currentMonth)} currentMonth={currentMonth} />;
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
  const { submit, submitting } = useSubmit();

  const incomeCents = parseEurosToCents(incomeText);
  const validIncome = incomeCents !== null && isValidMonthIncome(incomeCents) ? incomeCents : null;
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

  function suggestion(bucket: Bucket) {
    if (!validIncome) return undefined;
    return `Suggested ${formatEuros(Math.round((validIncome * SUGGESTED_PERCENT[bucket]) / 100))}`;
  }

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

  return (
    <KeyboardAvoidingView style={styles.screen} behavior="padding">
      <ThemedView style={styles.screen}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <TextField
            label="Monthly income"
            suffix="€"
            keyboardType="decimal-pad"
            placeholder="2000,00"
            maxLength={12}
            value={incomeText}
            onChangeText={setIncomeText}
          />
          {incomeText.trim() !== '' && !validIncome ? <ErrorText>{incomeErrorMessage(incomeCents ?? 0)}</ErrorText> : null}

          {targets ? <PlanBar targets={targets} /> : null}

          <AmountField
            label={BUCKET_LABELS.fixed}
            bucket="fixed"
            suggestion={suggestion('fixed')}
            description={BUCKET_DESCRIPTIONS.fixed}
            unit={fixed.unit}
            value={fixed.text}
            onChangeText={(text) => setFixed({ unit: fixed.unit, text })}
            onChangeUnit={changeFixedUnit}
            hint={otherUnitHint(fixedAmount, validIncome)}
          />
          {validIncome && fixed.text.trim() !== '' && errors.includes('fixed-invalid') ? (
            <ErrorText>{planErrorMessage('fixed-invalid', plan)}</ErrorText>
          ) : null}

          {(['savings', 'leisure'] as const).map((bucket) => {
            const isAuto = bucket === auto;
            return (
              <AmountField
                key={bucket}
                label={BUCKET_LABELS[bucket]}
                bucket={bucket}
                suggestion={suggestion(bucket)}
                description={BUCKET_DESCRIPTIONS[bucket]}
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
            <ErrorText>{planErrorMessage('kept-invalid', plan)}</ErrorText>
          ) : null}
          {errors.includes('over-income') ? <ErrorText>{planErrorMessage('over-income', plan)}</ErrorText> : null}

          <ThemedText type="caption" themeColor="textSecondary">
            Applies from {formatMonth(currentMonth)} onwards
          </ThemedText>

          <Button
            label="Save plan"
            disabled={errors.length > 0 || submitting}
            onPress={() => submit(() => savePlan(db, plan, new Date()))}
          />
          {initialPlan ? (
            <Button
              label="Change this month's income"
              variant="secondary"
              onPress={() => router.replace('/month-income')}
            />
          ) : null}
        </ScrollView>
      </ThemedView>
    </KeyboardAvoidingView>
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

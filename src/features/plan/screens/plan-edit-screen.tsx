import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet } from 'react-native';

import { AmountField } from '@/features/plan/components/amount-field';
import { FixedItemsEditor } from '@/features/plan/components/fixed-items-editor';
import { useIncomePlan } from '@/features/plan/hooks/use-income-plan';
import { draftsToItems, itemDrafts, keptPercentText, parsePercentField, shareText } from '@/features/plan/plan-form';
import {
  fixedTotal,
  incomeErrorMessage,
  isValidMonthIncome,
  planErrorMessage,
  planForMonth,
  planTargets,
  suggestedSplit,
  validatePlan,
  type IncomePlan,
} from '@/features/plan/rules';
import { savePlan } from '@/features/plan/service';
import {
  BUCKET_LABELS,
  SUGGESTED_SAVINGS_PERCENT,
  otherFlexible,
  type FlexibleBucket,
} from '@/shared/buckets';
import { useDiscardGuard } from '@/shared/hooks/use-discard-guard';
import { useSubmit } from '@/shared/hooks/use-submit';
import { centsToInput, formatEuros, formatPercentOf, parseEurosToCents } from '@/shared/money';
import { formatMonth, monthKey } from '@/shared/months';
import { Spacing } from '@/shared/theme/theme';
import { Button } from '@/shared/ui/button';
import { DataError } from '@/shared/ui/data-error';
import { ErrorText } from '@/shared/ui/error-text';
import { PlanBar } from '@/shared/ui/plan-bar';
import { SectionCard } from '@/shared/ui/section-card';
import { TextField } from '@/shared/ui/text-field';
import { ThemedText } from '@/shared/ui/themed-text';
import { ThemedView } from '@/shared/ui/themed-view';

export default function PlanEditScreen() {
  const state = useIncomePlan();
  if (state.status === 'error') return <DataError />;
  if (state.status === 'loading') return <ThemedView style={styles.screen} />;
  const currentMonth = monthKey(new Date());
  return <PlanForm initialPlan={planForMonth(state.data.versions, currentMonth)} currentMonth={currentMonth} />;
}

function PlanForm({ initialPlan, currentMonth }: { initialPlan: IncomePlan | null; currentMonth: string }) {
  const db = useSQLiteContext();
  const [drafts, setDrafts] = useState(() => itemDrafts(initialPlan?.fixedItems ?? []));
  const [incomeText, setIncomeText] = useState(initialPlan ? centsToInput(initialPlan.incomeCents) : '');
  const [kept, setKept] = useState<FlexibleBucket>(initialPlan?.kept ?? 'savings');
  const [keptText, setKeptText] = useState(() =>
    initialPlan ? keptPercentText(initialPlan.keptAmount, initialPlan.incomeCents) : String(SUGGESTED_SAVINGS_PERCENT),
  );
  const form = JSON.stringify({ drafts: draftsToItems(drafts), incomeText, kept, keptText });
  const [savedForm] = useState(form);
  const { dialog, allowLeave } = useDiscardGuard(form !== savedForm);
  const { submit, submitting } = useSubmit(allowLeave);

  const incomeCents = parseEurosToCents(incomeText);
  const validIncome = incomeCents !== null && isValidMonthIncome(incomeCents) ? incomeCents : null;
  const auto = otherFlexible(kept);

  const plan: IncomePlan = {
    incomeCents: incomeCents ?? 0,
    fixedItems: draftsToItems(drafts),
    kept,
    keptAmount: parsePercentField(keptText),
  };
  const errors = validatePlan(plan);
  const targets = errors.length === 0 ? planTargets(plan) : null;
  const total = fixedTotal(plan.fixedItems);
  const suggested = validIncome ? suggestedSplit(validIncome, total) : null;

  return (
    <KeyboardAvoidingView style={styles.screen} behavior="padding">
      <ThemedView style={styles.screen}>
        {dialog}
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <SectionCard title="Fixed expenses" value={formatEuros(total)}>
            <FixedItemsEditor drafts={drafts} onChange={setDrafts} />
          </SectionCard>

          <SectionCard title="Monthly income">
            <TextField
              label="Income"
              hideLabel
              onCard
              suffix="€"
              keyboardType="decimal-pad"
              placeholder="2000,00"
              maxLength={12}
              value={incomeText}
              onChangeText={setIncomeText}
            />
            {incomeText.trim() !== '' && !validIncome ? <ErrorText>{incomeErrorMessage(incomeCents ?? 0)}</ErrorText> : null}
            {errors.includes('fixed-over-income') ? <ErrorText>{planErrorMessage('fixed-over-income', plan)}</ErrorText> : null}
          </SectionCard>

          <SectionCard title="Left to split" value={validIncome && total <= validIncome ? formatEuros(validIncome - total) : undefined}>
            {targets ? <PlanBar targets={targets} /> : null}
            {(['savings', 'leisure'] as const).map((bucket) => (
              <AmountField
                key={bucket}
                label={BUCKET_LABELS[bucket]}
                bucket={bucket}
                suggestion={suggested && validIncome ? `Suggested ${formatPercentOf(suggested[bucket], validIncome)}` : undefined}
                value={bucket === auto ? (targets ? shareText(targets[auto], plan.incomeCents) : '') : keptText}
                automatic={bucket === auto}
                onChangeText={(text) => {
                  // Typing in a field makes it the kept one; the other becomes automatic.
                  setKept(bucket);
                  setKeptText(text);
                }}
                hint={targets ? `= ${formatEuros(targets[bucket])}` : undefined}
              />
            ))}
            {keptText.trim() !== '' && errors.includes('kept-invalid') ? (
              <ErrorText>{planErrorMessage('kept-invalid', plan)}</ErrorText>
            ) : null}
            {errors.includes('over-income') ? <ErrorText>{planErrorMessage('over-income', plan)}</ErrorText> : null}
          </SectionCard>

          <ThemedText type="caption" themeColor="textSecondary" style={styles.centered}>
            Applies from {formatMonth(currentMonth)} onwards
          </ThemedText>

          <Button
            label="Save plan"
            disabled={errors.length > 0 || submitting}
            onPress={() => submit(() => savePlan(db, plan, new Date()))}
          />
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
    padding: Spacing.three,
    paddingBottom: Spacing.five,
  },
  centered: {
    textAlign: 'center',
  },
});

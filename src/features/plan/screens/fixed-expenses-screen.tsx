import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet } from 'react-native';

import { FixedItemsEditor } from '@/features/plan/components/fixed-items-editor';
import { useIncomePlan } from '@/features/plan/hooks/use-income-plan';
import { draftsToItems, itemDrafts } from '@/features/plan/plan-form';
import { ITEM_INVALID, fixedTotal, planForMonth, validatePlan, type IncomePlan } from '@/features/plan/rules';
import { savePlan } from '@/features/plan/service';
import { SUGGESTED_SAVINGS_PERCENT } from '@/shared/buckets';
import { useDiscardGuard } from '@/shared/hooks/use-discard-guard';
import { useSubmit } from '@/shared/hooks/use-submit';
import { monthKey } from '@/shared/months';
import { Spacing } from '@/shared/theme/theme';
import { Button } from '@/shared/ui/button';
import { DataError } from '@/shared/ui/data-error';
import { ErrorText } from '@/shared/ui/error-text';
import { ThemedView } from '@/shared/ui/themed-view';

/** What the user must pay every month. Part of the plan, edited on its own. */
export default function FixedExpensesScreen() {
  const state = useIncomePlan();
  if (state.status === 'error') return <DataError />;
  if (state.status === 'loading') return <ThemedView style={styles.screen} />;
  return <FixedExpensesForm currentPlan={planForMonth(state.data, monthKey(new Date()))} />;
}

function FixedExpensesForm({ currentPlan }: { currentPlan: IncomePlan | null }) {
  const db = useSQLiteContext();
  const [drafts, setDrafts] = useState(() => itemDrafts(currentPlan?.fixedItems ?? []));
  const form = JSON.stringify(draftsToItems(drafts));
  const [savedForm] = useState(form);
  const { dialog, allowLeave } = useDiscardGuard(form !== savedForm);
  // A new plan continues to choosing the split.
  const { submit, submitting } = useSubmit(allowLeave, currentPlan ? undefined : '/plan-edit');

  const items = draftsToItems(drafts);
  const plan: IncomePlan = {
    fixedItems: items,
    kept: currentPlan?.kept ?? 'savings',
    keptAmount: currentPlan?.keptAmount ?? { unit: 'pct', pct: SUGGESTED_SAVINGS_PERCENT },
  };
  const errors = validatePlan(plan);

  return (
    <KeyboardAvoidingView style={styles.screen} behavior="padding">
      <ThemedView style={styles.screen}>
        {dialog}
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <FixedItemsEditor drafts={drafts} total={fixedTotal(items)} onChange={setDrafts} />
          {errors.includes('item-invalid') ? (
            <ErrorText>{ITEM_INVALID}</ErrorText>
          ) : null}
          <Button
            label={currentPlan ? 'Save' : 'Next'}
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
    padding: Spacing.two + Spacing.one,
    paddingBottom: Spacing.five,
  },
});

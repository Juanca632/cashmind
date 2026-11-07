import { Redirect, router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { BucketRows } from '@/components/bucket-rows';
import { Button } from '@/components/button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { removeMonthOverride, setMonthOverride } from '@/data/income-plan-repo';
import {
  formatEuros,
  monthKey,
  parseEurosToCents,
  planForMonth,
  targetsFor,
  type IncomePlan,
} from '@/domain/income-plan';
import { useIncomePlan } from '@/hooks/use-income-plan';

export default function MonthIncomeScreen() {
  const state = useIncomePlan();
  if (state.status === 'loading') return <ThemedView style={styles.screen} />;
  const month = monthKey(new Date());
  const plan = planForMonth(state.versions, month);
  if (!plan) return <Redirect href="/plan" />;

  return <MonthIncomeForm plan={plan} month={month} overrideCents={state.overrides[month]} />;
}

function MonthIncomeForm({
  plan,
  month,
  overrideCents,
}: {
  plan: IncomePlan;
  month: string;
  overrideCents: number | undefined;
}) {
  const db = useSQLiteContext();
  const [incomeText, setIncomeText] = useState(
    overrideCents !== undefined ? (overrideCents / 100).toFixed(2).replace('.', ',') : '',
  );
  const [saving, setSaving] = useState(false);

  const incomeCents = parseEurosToCents(incomeText);
  const valid = incomeCents !== null && incomeCents > 0;

  async function run(action: () => Promise<void>) {
    setSaving(true);
    try {
      await action();
      router.back();
    } finally {
      setSaving(false);
    }
  }

  return (
    <ThemedView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <ThemedText themeColor="textSecondary">
          Your usual income is {formatEuros(plan.incomeCents)}. Set a different amount for this month only: fixed expenses stay the same and leisure and savings
          adjust in the same proportion. Next month goes back to the usual income.
        </ThemedText>

        <TextField
          label="Income this month"
          suffix="€"
          keyboardType="decimal-pad"
          placeholder={(plan.incomeCents / 100).toFixed(2).replace('.', ',')}
          value={incomeText}
          onChangeText={setIncomeText}
        />
        {incomeText.trim() !== '' && !valid ? (
          <ThemedText type="small" style={styles.error}>
            Income must be greater than 0 €.
          </ThemedText>
        ) : null}

        {valid ? <BucketRows targets={targetsFor(plan, incomeCents)} /> : null}

        <Button
          label="Save for this month"
          disabled={!valid || saving}
          onPress={() => run(() => setMonthOverride(db, month, incomeCents!))}
        />
        {overrideCents !== undefined ? (
          <Button
            label="Use my usual income"
            variant="secondary"
            disabled={saving}
            onPress={() => run(() => removeMonthOverride(db, month))}
          />
        ) : null}
      </ScrollView>
    </ThemedView>
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
  error: {
    color: '#D93025',
  },
});

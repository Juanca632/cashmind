import { Redirect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { BucketRows } from '@/shared/ui/bucket-rows';
import { useSubmit } from '@/shared/hooks/use-submit';
import { Button } from '@/shared/ui/button';
import { DataError } from '@/shared/ui/data-error';
import { ErrorText } from '@/shared/ui/error-text';
import { TextField } from '@/shared/ui/text-field';
import { ThemedText } from '@/shared/ui/themed-text';
import { ThemedView } from '@/shared/ui/themed-view';
import { Spacing } from '@/shared/theme/theme';
import { removeMonthIncome, setMonthIncome } from '@/features/plan/service';
import { incomeErrorMessage, isValidMonthIncome, planForMonth, targetsFor, type IncomePlan } from '@/features/plan/rules';
import { centsToInput, formatEuros, parseEurosToCents } from '@/shared/money';
import { monthKey } from '@/shared/months';
import { useIncomePlan } from '@/features/plan/hooks/use-income-plan';

export default function MonthIncomeScreen() {
  const state = useIncomePlan();
  if (state.status === 'error') return <DataError />;
  if (state.status === 'loading') return <ThemedView style={styles.screen} />;
  const month = monthKey(new Date());
  const plan = planForMonth(state.data.versions, month);
  if (!plan) return <Redirect href="/plan" />;

  return <MonthIncomeForm plan={plan} overrideCents={state.data.overrides[month]} />;
}

function MonthIncomeForm({
  plan,
  overrideCents,
}: {
  plan: IncomePlan;
  overrideCents: number | undefined;
}) {
  const db = useSQLiteContext();
  const [incomeText, setIncomeText] = useState(overrideCents !== undefined ? centsToInput(overrideCents) : '');
  const { submit, submitting } = useSubmit();

  const incomeCents = parseEurosToCents(incomeText);
  const valid = incomeCents !== null && isValidMonthIncome(incomeCents);

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
          placeholder={centsToInput(plan.incomeCents)}
          maxLength={12}
          value={incomeText}
          onChangeText={setIncomeText}
        />
        {incomeText.trim() !== '' && !valid ? <ErrorText>{incomeErrorMessage(incomeCents ?? 0)}</ErrorText> : null}

        {valid ? <BucketRows targets={targetsFor(plan, incomeCents)} /> : null}

        <Button
          label="Save for this month"
          disabled={!valid || submitting}
          onPress={() => submit(() => setMonthIncome(db, incomeCents ?? 0, new Date()))}
        />
        {overrideCents !== undefined ? (
          <Button
            label="Use my usual income"
            variant="secondary"
            disabled={submitting}
            onPress={() => submit(() => removeMonthIncome(db, new Date()))}
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
});

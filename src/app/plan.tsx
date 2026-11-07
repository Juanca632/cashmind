import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet } from 'react-native';

import { BucketRows, ERROR_COLOR } from '@/components/bucket-rows';
import { Button } from '@/components/button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { savePlanFromMonth } from '@/data/income-plan-repo';
import {
  formatPercentOf,
  maxSavingsPct,
  formatMonth,
  monthKey,
  parseEurosToCents,
  planForMonth,
  targetsFor,
  validatePlan,
  type IncomePlan,
} from '@/domain/income-plan';
import { useIncomePlan } from '@/hooks/use-income-plan';

export default function PlanScreen() {
  const state = useIncomePlan();
  if (state.status === 'loading') return <ThemedView style={styles.screen} />;
  const currentMonth = monthKey(new Date());
  return <PlanForm initialPlan={planForMonth(state.versions, currentMonth)} currentMonth={currentMonth} />;
}

function centsToInput(cents: number): string {
  return (cents / 100).toFixed(2).replace('.', ',');
}

function PlanForm({ initialPlan, currentMonth }: { initialPlan: IncomePlan | null; currentMonth: string }) {
  const db = useSQLiteContext();
  const [incomeText, setIncomeText] = useState(initialPlan ? centsToInput(initialPlan.incomeCents) : '');
  const [fixedText, setFixedText] = useState(initialPlan ? centsToInput(initialPlan.fixedCents) : '');
  const [savingsText, setSavingsText] = useState(initialPlan ? String(initialPlan.savingsPct) : '20');
  const [saving, setSaving] = useState(false);

  const incomeCents = parseEurosToCents(incomeText);
  const fixedCents = parseEurosToCents(fixedText);
  const plan: IncomePlan = {
    incomeCents: incomeCents ?? 0,
    fixedCents: fixedCents ?? -1,
    savingsPct: /^\d{1,3}$/.test(savingsText.trim()) ? Number(savingsText.trim()) : Number.NaN,
  };
  const errors = validatePlan(plan);
  const incomeValid = !errors.includes('income-not-positive');
  const fixedValid = incomeValid && !errors.includes('fixed-invalid');

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
            Changes apply from {formatMonth(currentMonth)} onwards. Past months keep their plan.
          </ThemedText>
          <TextField
            label="Monthly income"
            suffix="€"
            keyboardType="decimal-pad"
            placeholder="2000,00"
            value={incomeText}
            onChangeText={setIncomeText}
          />
          {incomeText.trim() !== '' && !incomeValid ? <ErrorText>Income must be greater than 0 €.</ErrorText> : null}

          <TextField
            label="Fixed expenses (rent, bills, subscriptions…)"
            suffix="€"
            keyboardType="decimal-pad"
            placeholder="1000,00"
            value={fixedText}
            onChangeText={setFixedText}
          />
          {incomeValid && fixedText.trim() !== '' ? (
            fixedValid ? (
              <ThemedText type="small" themeColor="textSecondary">
                {formatPercentOf(plan.fixedCents, plan.incomeCents)} of your income
              </ThemedText>
            ) : (
              <ErrorText>Fixed expenses must be a valid amount and cannot exceed your income.</ErrorText>
            )
          ) : null}

          <TextField
            label="Savings (% of income)"
            suffix="%"
            keyboardType="number-pad"
            maxLength={3}
            value={savingsText}
            onChangeText={setSavingsText}
          />
          {errors.includes('savings-invalid') ? <ErrorText>Savings must be a whole number.</ErrorText> : null}
          {errors.includes('savings-too-high') ? (
            <ErrorText>At most {maxSavingsPct(plan.incomeCents, plan.fixedCents)} % is left for savings.</ErrorText>
          ) : null}

          {errors.length === 0 ? (
            <>
              <ThemedText type="small" themeColor="textSecondary">
                Leisure gets the rest of your income.
              </ThemedText>
              <BucketRows targets={targetsFor(plan, plan.incomeCents)} incomeCents={plan.incomeCents} />
            </>
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

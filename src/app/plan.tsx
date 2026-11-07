import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet } from 'react-native';

import { BUCKET_LABELS, BucketRows } from '@/components/bucket-rows';
import { Button } from '@/components/button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { savePlan } from '@/data/income-plan-repo';
import {
  BUCKETS,
  parseEurosToCents,
  percentageTotal,
  targetsFor,
  validatePlan,
  type Bucket,
  type IncomePlan,
} from '@/domain/income-plan';
import { useIncomePlan } from '@/hooks/use-income-plan';

const DEFAULT_PERCENTAGES = { fixed: 50, leisure: 30, savings: 20 };

export default function PlanScreen() {
  const state = useIncomePlan();
  if (state.status === 'loading') return <ThemedView style={styles.screen} />;
  return <PlanForm initialPlan={state.plan} />;
}

function PlanForm({ initialPlan }: { initialPlan: IncomePlan | null }) {
  const db = useSQLiteContext();
  const [incomeText, setIncomeText] = useState(
    initialPlan ? (initialPlan.incomeCents / 100).toFixed(2).replace('.', ',') : '',
  );
  const [percentTexts, setPercentTexts] = useState<Record<Bucket, string>>(() => {
    const source = initialPlan?.percentages ?? DEFAULT_PERCENTAGES;
    return { fixed: String(source.fixed), leisure: String(source.leisure), savings: String(source.savings) };
  });
  const [saving, setSaving] = useState(false);

  const incomeCents = parseEurosToCents(incomeText);
  const percentages = {
    fixed: parsePercent(percentTexts.fixed),
    leisure: parsePercent(percentTexts.leisure),
    savings: parsePercent(percentTexts.savings),
  };
  const plan: IncomePlan = { incomeCents: incomeCents ?? 0, percentages };
  const errors = validatePlan(plan);
  const total = percentageTotal(percentages);
  const canPreview = incomeCents !== null && incomeCents > 0 && !errors.includes('percentage-out-of-range');

  async function onSave() {
    setSaving(true);
    try {
      await savePlan(db, plan);
      router.back();
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior="padding">
      <ThemedView style={styles.screen}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <TextField
            label="Monthly income"
            suffix="€"
            keyboardType="decimal-pad"
            placeholder="2500,00"
            value={incomeText}
            onChangeText={setIncomeText}
          />
          {errors.includes('income-not-positive') ? (
            <ThemedText type="small" style={styles.error}>
              Income must be greater than 0 €.
            </ThemedText>
          ) : null}

          {BUCKETS.map((bucket) => (
            <TextField
              key={bucket}
              label={BUCKET_LABELS[bucket]}
              suffix="%"
              keyboardType="number-pad"
              maxLength={3}
              value={percentTexts[bucket]}
              onChangeText={(text) => setPercentTexts((current) => ({ ...current, [bucket]: text }))}
            />
          ))}

          <ThemedText type="smallBold" style={errors.length ? styles.error : undefined}>
            {totalMessage(total, errors.includes('percentage-out-of-range'))}
          </ThemedText>

          {canPreview ? <BucketRows percentages={percentages} targets={targetsFor(incomeCents, percentages)} /> : null}

          <Button label="Save plan" disabled={errors.length > 0 || saving} onPress={onSave} />
        </ScrollView>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

/** Whole numbers 0–100 only; anything else becomes NaN so validation rejects it. */
function parsePercent(text: string): number {
  return /^\d{1,3}$/.test(text.trim()) ? Number(text.trim()) : Number.NaN;
}

function totalMessage(total: number, outOfRange: boolean): string {
  if (outOfRange) return 'Each percentage must be a whole number from 0 to 100.';
  if (total === 100) return 'Total: 100 %';
  if (total < 100) return `Total: ${total} % — ${100 - total} % left to assign`;
  return `Total: ${total} % — ${total - 100} % over`;
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

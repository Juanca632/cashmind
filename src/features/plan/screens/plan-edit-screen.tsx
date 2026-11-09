import { Redirect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { AmountField } from '@/features/plan/components/amount-field';
import { useIncomePlan } from '@/features/plan/hooks/use-income-plan';
import { keptPercentText, parsePercentField, shareText } from '@/features/plan/plan-form';
import {
  fixedTotal,
  planErrorMessage,
  planForMonth,
  targetsFor,
  trialShortfallMessage,
  validatePlan,
  type IncomePlan,
} from '@/features/plan/rules';
import { savePlan } from '@/features/plan/service';
import { BUCKET_LABELS, otherFlexible, type FlexibleBucket } from '@/shared/buckets';
import { useDiscardGuard } from '@/shared/hooks/use-discard-guard';
import { useSubmit } from '@/shared/hooks/use-submit';
import { centsToInput, formatEuros, formatPercentOf, isValidCents, parseEurosToCents } from '@/shared/money';
import { monthKey } from '@/shared/months';
import { BUCKET_COLORS, FontFamily, Radius, Spacing } from '@/shared/theme/theme';
import { useTheme } from '@/shared/theme/use-theme';
import { BucketBadge } from '@/shared/ui/bucket-badge';
import { Button } from '@/shared/ui/button';
import { DataError } from '@/shared/ui/data-error';
import { ErrorText } from '@/shared/ui/error-text';
import { PlanBar } from '@/shared/ui/plan-bar';
import { ThemedText } from '@/shared/ui/themed-text';
import { ThemedView } from '@/shared/ui/themed-view';

export default function PlanEditScreen() {
  const state = useIncomePlan();
  const params = useLocalSearchParams<{ income?: string }>();
  if (state.status === 'error') return <DataError />;
  if (state.status === 'loading') return <ThemedView style={styles.screen} />;
  const plan = planForMonth(state.data, monthKey(new Date()));
  if (!plan) return <Redirect href="/fixed-expenses" />;
  const startingIncome = Number(params.income ?? 0);
  return <PlanForm initialPlan={plan} startingIncome={Number.isSafeInteger(startingIncome) && startingIncome > 0 ? startingIncome : 0} />;
}

/** How the income is split. The income here is only a trial and is never saved. */
function PlanForm({ initialPlan, startingIncome }: { initialPlan: IncomePlan; startingIncome: number }) {
  const db = useSQLiteContext();
  const theme = useTheme();
  const [trialText, setTrialText] = useState(startingIncome > 0 ? centsToInput(startingIncome) : '');
  const [kept, setKept] = useState<FlexibleBucket>(initialPlan.kept);
  const [keptText, setKeptText] = useState(() => keptPercentText(initialPlan.keptAmount, startingIncome));
  const form = JSON.stringify({ kept, keptText });
  const [savedForm] = useState(form);
  const { dialog, allowLeave } = useDiscardGuard(form !== savedForm);
  const { submit, submitting } = useSubmit(allowLeave);

  const parsedTrial = parseEurosToCents(trialText);
  const trial = parsedTrial !== null && parsedTrial > 0 && isValidCents(parsedTrial) ? parsedTrial : null;
  const auto = otherFlexible(kept);

  const plan: IncomePlan = { fixedItems: initialPlan.fixedItems, kept, keptAmount: parsePercentField(keptText) };
  const errors = validatePlan(plan);
  const targets = trial && errors.length === 0 ? targetsFor(plan, trial) : null;
  const shortfall = trial && errors.length === 0 ? trialShortfallMessage(plan, trial) : null;

  return (
    <KeyboardAvoidingView style={styles.screen} behavior="padding">
      <ThemedView style={styles.screen}>
        {dialog}
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.intro}>
            <ThemedText type="heading">Split your income</ThemedText>
            <ThemedText themeColor="textSecondary">
              Try an income and set your percentages. Change one and the other adjusts.
            </ThemedText>
          </View>

          <View style={styles.section}>
            <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionTitle}>
              Try an income
            </ThemedText>
            <ThemedView type="backgroundElement" style={styles.incomeCard}>
              <View style={styles.incomeRow}>
                <TextInput
                  accessibilityLabel="Income"
                  keyboardType="decimal-pad"
                  maxLength={10}
                  placeholder="0"
                  placeholderTextColor={theme.textSecondary}
                  style={[styles.income, { color: theme.text }]}
                  value={trialText}
                  onChangeText={setTrialText}
                />
                <ThemedText type="heading" themeColor="textSecondary">
                  €
                </ThemedText>
              </View>
              <ThemedText type="caption" themeColor="textSecondary">
                Only to see the numbers. It is not saved.
              </ThemedText>
            </ThemedView>
            {shortfall ? <ErrorText>{shortfall}</ErrorText> : null}
          </View>

          <View style={styles.section}>
            <View style={styles.titleRow}>
              <ThemedText type="smallBold" themeColor="textSecondary">
                How it is split
              </ThemedText>
              <ThemedText type="caption" themeColor="textSecondary">
                % of your income
              </ThemedText>
            </View>
            <ThemedView type="backgroundElement" style={styles.card}>
              <View style={styles.fixedRow}>
                <BucketBadge bucket="fixed" />
                <View style={styles.flex}>
                  <ThemedText type="smallBold">{BUCKET_LABELS.fixed}</ThemedText>
                  <ThemedText type="caption" themeColor="textSecondary">
                    {formatEuros(fixedTotal(plan.fixedItems))}
                  </ThemedText>
                </View>
                {trial ? (
                  <ThemedText type="smallBold" style={[styles.fixedShare, { color: BUCKET_COLORS.fixed }]}>
                    {formatPercentOf(fixedTotal(plan.fixedItems), trial)}
                  </ThemedText>
                ) : null}
              </View>
              {(['savings', 'leisure'] as const).map((bucket) => (
                <AmountField
                  key={bucket}
                  label={BUCKET_LABELS[bucket]}
                  bucket={bucket}
                  value={bucket === auto ? (targets && trial ? shareText(targets[auto], trial) : '') : keptText}
                  automatic={bucket === auto}
                  onChangeText={(text) => {
                    // Typing in a field makes it the kept one; the other takes the rest.
                    setKept(bucket);
                    setKeptText(text);
                  }}
                  hint={targets ? formatEuros(targets[bucket]) : undefined}
                />
              ))}
              {targets ? (
                <View style={styles.bar}>
                  <PlanBar targets={targets} />
                </View>
              ) : null}
            </ThemedView>
          </View>
          {keptText.trim() !== '' && errors.includes('kept-invalid') ? (
            <ErrorText>{planErrorMessage('kept-invalid', plan)}</ErrorText>
          ) : null}
          {keptText.trim() === '' ? (
            <ThemedText type="small" themeColor="textSecondary" style={styles.centered}>
              Enter a percentage to save.
            </ThemedText>
          ) : null}

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
    gap: Spacing.four,
    padding: Spacing.two + Spacing.one,
    paddingBottom: Spacing.five,
  },
  intro: {
    gap: Spacing.one,
    paddingHorizontal: Spacing.one,
  },
  section: {
    gap: Spacing.two,
  },
  sectionTitle: {
    paddingHorizontal: Spacing.one,
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.one,
  },
  incomeCard: {
    alignItems: 'center',
    borderRadius: Radius.card,
    gap: Spacing.one,
    padding: Spacing.three,
  },
  incomeRow: {
    alignItems: 'baseline',
    flexDirection: 'row',
    gap: Spacing.one,
  },
  income: {
    fontFamily: FontFamily.bold,
    flexShrink: 1,
    fontSize: 40,
    fontVariant: ['tabular-nums'],
    letterSpacing: -1,
    minWidth: 72,
    padding: 0,
    textAlign: 'center',
  },
  card: {
    borderRadius: Radius.card,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  fixedRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.two + Spacing.one,
    minHeight: 68,
  },
  flex: {
    flex: 1,
  },
  fixedShare: {
    paddingRight: Spacing.two + Spacing.one,
    textAlign: 'right',
    width: 96,
  },
  bar: {
    paddingBottom: Spacing.two,
    paddingTop: Spacing.two,
  },
  centered: {
    textAlign: 'center',
  },
});

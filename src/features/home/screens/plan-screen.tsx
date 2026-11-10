import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { useMonthEntries } from '@/features/entries/hooks/use-month-entries';
import { totalsByKind } from '@/features/entries/rules';
import { usePlanVersions } from '@/features/plan/hooks/use-plan-versions';
import { PERCENT_INVALID, savingsGoal, savingsPercentFor } from '@/features/plan/rules';
import { savePlan } from '@/features/plan/service';
import { useDiscardGuard } from '@/shared/hooks/use-discard-guard';
import { useSubmit } from '@/shared/hooks/use-submit';
import { formatEurosCompact, parsePercent } from '@/shared/money';
import { monthKey } from '@/shared/months';
import { KIND_COLORS, FontFamily, Radius, Spacing } from '@/shared/theme/theme';
import { useTheme } from '@/shared/theme/use-theme';
import { Button } from '@/shared/ui/button';
import { DataError } from '@/shared/ui/data-error';
import { ErrorText } from '@/shared/ui/error-text';
import { ThemedText } from '@/shared/ui/themed-text';
import { ThemedView } from '@/shared/ui/themed-view';

/** The plan is one number: the share of every income to save. Changes apply from this month on. */
export default function PlanScreen() {
  const month = monthKey(new Date());
  const plan = usePlanVersions();
  const entries = useMonthEntries(month);
  if (plan.status === 'error' || entries.status === 'error') return <DataError />;
  if (plan.status === 'loading' || entries.status === 'loading') return <ThemedView style={styles.screen} />;

  return (
    <PlanForm
      initialPercent={savingsPercentFor(plan.data, month)}
      incomeCents={totalsByKind(entries.data).income}
    />
  );
}

function PlanForm({ initialPercent, incomeCents }: { initialPercent: number; incomeCents: number }) {
  const db = useSQLiteContext();
  const theme = useTheme();
  const [percentText, setPercentText] = useState(String(initialPercent));
  const { dialog, allowLeave } = useDiscardGuard(percentText !== String(initialPercent));
  const { submit, submitting } = useSubmit(allowLeave);
  const percent = parsePercent(percentText);

  return (
    <KeyboardAvoidingView style={styles.screen} behavior="padding">
      <ThemedView style={styles.screen}>
        {dialog}
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.intro}>
            <ThemedText type="heading">How much do you want to save?</ThemedText>
            <ThemedText themeColor="textSecondary">
              A share of every income you record. Whatever is left after your expenses and this goal is yours to spend.
            </ThemedText>
          </View>

          <ThemedView type="backgroundElement" style={styles.card}>
            <View style={styles.percentRow}>
              <TextInput
                accessibilityLabel="Savings percentage"
                keyboardType="number-pad"
                maxLength={3}
                placeholder="20"
                placeholderTextColor={theme.textSecondary}
                selectTextOnFocus
                style={[styles.percent, { color: theme.text }]}
                value={percentText}
                onChangeText={setPercentText}
              />
              <ThemedText type="heading" themeColor="textSecondary">
                %
              </ThemedText>
            </View>
            <ThemedText type="smallBold" style={[styles.centered, { color: KIND_COLORS.savings }]}>
              {percent === null
                ? ' '
                : incomeCents > 0
                  ? `${formatEurosCompact(savingsGoal(incomeCents, percent))} of this month's ${formatEurosCompact(incomeCents)}`
                  : 'Add this month\'s income to see it in euros.'}
            </ThemedText>
          </ThemedView>
          {percentText.trim() !== '' && percent === null ? <ErrorText>{PERCENT_INVALID}</ErrorText> : null}

          <ThemedText type="small" themeColor="textSecondary" style={styles.centered}>
            Applies from this month on. Past months keep their goal.
          </ThemedText>

          <Button
            label="Save plan"
            disabled={percent === null || submitting}
            onPress={() => submit(() => savePlan(db, percent as number, new Date()))}
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
  card: {
    alignItems: 'center',
    borderRadius: Radius.card,
    gap: Spacing.two,
    padding: Spacing.four,
  },
  percentRow: {
    alignItems: 'baseline',
    flexDirection: 'row',
    gap: Spacing.one,
  },
  percent: {
    fontFamily: FontFamily.bold,
    fontSize: 56,
    fontVariant: ['tabular-nums'],
    letterSpacing: -1,
    minWidth: 72,
    padding: 0,
    textAlign: 'center',
  },
  centered: {
    textAlign: 'center',
  },
});

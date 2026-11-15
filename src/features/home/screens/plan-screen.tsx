import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { KeyboardAvoidingView, StyleSheet, TextInput, View } from 'react-native';

import { RecurringList } from '@/features/entries/components/recurring-list';
import { useMonthEntries } from '@/features/entries/hooks/use-month-entries';
import { useRecurringItems } from '@/features/entries/hooks/use-recurring-items';
import { fixedCostsCents, totalsByKind, type RecurringItem } from '@/features/entries/rules';
import { usePlanVersions } from '@/features/plan/hooks/use-plan-versions';
import { PERCENT_INVALID, savingsGoal, savingsPercentFor } from '@/features/plan/rules';
import { savePlan } from '@/features/plan/service';
import { useDiscardGuard } from '@/shared/hooks/use-discard-guard';
import { useSubmit } from '@/shared/hooks/use-submit';
import { formatEuros, formatEurosCompact, parsePercent } from '@/shared/money';
import { monthKey } from '@/shared/months';
import { FontFamily, Layout, Size } from '@/shared/theme/theme';
import { useTheme } from '@/shared/theme/use-theme';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { DataError } from '@/shared/ui/data-error';
import { ErrorText } from '@/shared/ui/error-text';
import { LinkButton } from '@/shared/ui/link-button';
import { ScreenScroll } from '@/shared/ui/screen-scroll';
import { ThemedText } from '@/shared/ui/themed-text';
import { ThemedView } from '@/shared/ui/themed-view';

/**
 * How the month works: the share of every income to save, and what is recorded every month.
 * Both sections have the same shape: a title above, a card below.
 */
export default function PlanScreen() {
  const month = monthKey(new Date());
  const plan = usePlanVersions();
  const entries = useMonthEntries(month);
  const recurring = useRecurringItems();
  if (plan.status === 'error' || entries.status === 'error' || recurring.status === 'error') return <DataError />;
  if (plan.status === 'loading' || entries.status === 'loading' || recurring.status === 'loading') {
    return <ThemedView style={styles.screen} />;
  }

  return (
    <PlanForm
      initialPercent={savingsPercentFor(plan.data, month)}
      incomeCents={totalsByKind(entries.data).income}
      recurring={recurring.data}
    />
  );
}

type PlanFormProps = { initialPercent: number; incomeCents: number; recurring: RecurringItem[] };

function PlanForm({ initialPercent, incomeCents, recurring }: PlanFormProps) {
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
        <ScreenScroll spacing="loose">
          <View style={styles.section}>
            <View style={styles.intro}>
              <ThemedText type="heading">How much do you want to save?</ThemedText>
              <ThemedText themeColor="textSecondary">
                A share of every income you record. Whatever is left after your expenses and this goal is yours to spend.
              </ThemedText>
            </View>

            <Card size="large" style={styles.card}>
              <View style={styles.percentBlock}>
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
                <ThemedText type="smallBold" style={[styles.centered, { color: theme.kindInk.savings }]}>
                  {percent === null
                    ? ' '
                    : incomeCents > 0
                      ? `${formatEurosCompact(savingsGoal(incomeCents, percent))} of this month's ${formatEurosCompact(incomeCents)}`
                      : 'Add this month\'s income to see it in euros.'}
                </ThemedText>
                {percentText.trim() !== '' && percent === null ? <ErrorText>{PERCENT_INVALID}</ErrorText> : null}
              </View>

              <ThemedText type="small" themeColor="textSecondary" style={styles.centered}>
                Applies from this month on. Past months keep their goal.
              </ThemedText>

              <Button
                label="Save plan"
                disabled={percent === null || submitting}
                onPress={() => submit(() => savePlan(db, percent as number, new Date()))}
              />
            </Card>
          </View>

          <EveryMonth items={recurring} />
        </ScreenScroll>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

/** What is recorded on the 1st of every month, and what the monthly expenses add up to. */
function EveryMonth({ items }: { items: RecurringItem[] }) {
  const fixedCosts = fixedCostsCents(items);
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.intro}>
          <ThemedText type="heading">Every month</ThemedText>
          <ThemedText themeColor="textSecondary">Recorded on the 1st of each month.</ThemedText>
        </View>
        <LinkButton
          label="Add"
          accessibilityLabel="Add a monthly entry"
          onPress={() => router.push({ pathname: '/entry', params: { repeat: '1' } })}
        />
      </View>

      <Card size="large" style={styles.card}>
        <RecurringList items={items} onPress={(item) => router.push({ pathname: '/recurring', params: { id: item.id } })} />
        {fixedCosts > 0 ? (
          <ThemedText type="smallBold" themeColor="textSecondary">
            {`Fixed costs: ${formatEuros(fixedCosts)} a month`}
          </ThemedText>
        ) : null}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  /** A title above its card. */
  section: {
    gap: Layout.itemGap,
  },
  sectionHeader: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: Layout.itemGap,
    justifyContent: 'space-between',
  },
  intro: {
    flexShrink: 1,
    gap: Layout.tightGap,
  },
  card: {
    gap: Layout.sectionGap,
  },
  percentBlock: {
    alignItems: 'center',
    gap: Layout.tightGap,
  },
  percentRow: {
    alignItems: 'baseline',
    flexDirection: 'row',
    gap: Layout.tightGap,
  },
  percent: {
    fontFamily: FontFamily.bold,
    fontSize: 56,
    fontVariant: ['tabular-nums'],
    letterSpacing: -1,
    minWidth: Size.percentInput,
    padding: 0,
    textAlign: 'center',
  },
  centered: {
    textAlign: 'center',
  },
});

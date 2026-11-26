import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { KeyboardAvoidingView, StyleSheet, TextInput, View } from 'react-native';

import { useMonthEntries } from '@/features/entries/hooks/use-month-entries';
import { useMoves } from '@/features/entries/hooks/use-moves';
import { usePocketEntries } from '@/features/entries/hooks/use-pocket-entries';
import { MAX_AMOUNT_TEXT } from '@/features/entries/components/amount-field';
import { usePockets } from '@/features/entries/hooks/use-pockets';
import type { Entry, Pocket } from '@/features/entries/rules';
import { addSavings } from '@/features/entries/service';
import { SpaceDot } from '@/features/home/components/space-selector';
import { monthFigures } from '@/features/home/month-summary';
import { previousSplit, savedByPocket, shareOut, toSplit } from '@/features/home/split-savings';
import { usePlanVersions } from '@/features/plan/hooks/use-plan-versions';
import { savingsPercentFor } from '@/features/plan/rules';
import { useDiscardGuard } from '@/shared/hooks/use-discard-guard';
import { useMoney } from '@/shared/hooks/use-money';
import { useSubmit } from '@/shared/hooks/use-submit';
import { useToday } from '@/shared/hooks/use-today';
import { AMOUNT_TOO_LARGE, isValidCents } from '@/shared/money';
import { formatMonthName, monthKey } from '@/shared/months';
import { FontFamily, Layout, Radius, Size } from '@/shared/theme/theme';
import { useTheme } from '@/shared/theme/use-theme';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { useConfirm } from '@/shared/ui/confirm-dialog';
import { DataError } from '@/shared/ui/data-error';
import { ErrorText } from '@/shared/ui/error-text';
import { GoalBar } from '@/shared/ui/goal-bar';
import { Pill } from '@/shared/ui/pill';
import { ScreenScroll } from '@/shared/ui/screen-scroll';
import { ThemedText } from '@/shared/ui/themed-text';
import { ThemedView } from '@/shared/ui/themed-view';

/** Splits what is left of this month's savings goal into pockets (specs/030-split-savings). */
export default function SplitScreen() {
  const money = useMoney();
  const today = useToday();
  const month = monthKey(today);
  const plan = usePlanVersions();
  const entries = useMonthEntries(month, 0);
  const moves = useMoves();
  const pockets = usePockets();
  const pocketEntries = usePocketEntries();

  const all = [plan, entries, moves, pockets, pocketEntries];
  if (all.some((data) => data.status === 'error')) return <DataError />;
  if (plan.status !== 'ready' || entries.status !== 'ready' || moves.status !== 'ready' || pockets.status !== 'ready' || pocketEntries.status !== 'ready') {
    return <ThemedView style={styles.screen} />;
  }
  const summary = monthFigures(entries.data, moves.data, savingsPercentFor(plan.data, month), month, money.unitCents);
  return (
    <SplitForm
      month={month}
      today={today}
      toSplitCents={toSplit(summary.goal, summary.saved)}
      pockets={pockets.data}
      pocketEntries={pocketEntries.data}
    />
  );
}

type SplitFormProps = {
  month: string;
  today: Date;
  toSplitCents: number;
  pockets: readonly Pocket[];
  /** Every entry with a pocket, to know this month's and the last split's savings. */
  pocketEntries: readonly Entry[];
};

function SplitForm({ month, today, toSplitCents, pockets, pocketEntries }: SplitFormProps) {
  const db = useSQLiteContext();
  const money = useMoney();
  const theme = useTheme();
  const ink = theme.kindInk.savings;
  // Filled once, like last month's split; a pocket made later from here starts empty.
  const [initial] = useState<Record<number, string>>(() => {
    const shares = shareOut(toSplitCents, previousSplit(pocketEntries, month), pockets.map((pocket) => pocket.id), money.unitCents);
    return Object.fromEntries(pockets.map((pocket, at) => [pocket.id, shares[at] > 0 ? money.toInput(shares[at]) : '']));
  });
  const [texts, setTexts] = useState(initial);
  const textOf = (id: number) => texts[id] ?? '';
  const dirty = pockets.some((pocket) => textOf(pocket.id) !== (initial[pocket.id] ?? ''));
  const { dialog: discardDialog, allowLeave } = useDiscardGuard(dirty);
  const { dialog: confirmDialog, ask } = useConfirm();
  const { submit, submitting } = useSubmit(allowLeave);

  const thisMonth = savedByPocket(pocketEntries, month);
  const amounts = pockets.map((pocket) => {
    const text = textOf(pocket.id).trim();
    return text === '' ? 0 : money.parse(text);
  });
  const invalid = amounts.map((cents) => cents === null || !isValidCents(cents));
  const sum = amounts.reduce<number>((total, cents) => total + (cents ?? 0), 0);
  const valid = !invalid.some(Boolean) && sum > 0 && isValidCents(sum);

  function save() {
    const shares = pockets.map((pocket, at) => ({ pocketId: pocket.id, amountCents: amounts[at] ?? 0 }));
    submit(() => addSavings(db, shares, new Date()));
  }

  function onSave() {
    if (sum <= toSplitCents) {
      save();
      return;
    }
    const extra = money.format(sum - toSplitCents);
    ask({
      title: 'Save more than your plan?',
      message: `You save ${extra} more than your plan. Your left to spend drops by ${extra}.`,
      cancel: 'Cancel',
      confirm: 'Save',
      tone: 'primary',
      onConfirm: save,
    });
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior="padding">
      <ThemedView style={styles.screen}>
        {discardDialog}
        {confirmDialog}
        <ScreenScroll>
          {/* The one figure, alone in a card tinted like savings, as the entry form's amount. */}
          <Card size="large" style={[styles.summary, { backgroundColor: theme.kindTint.savings }]}>
            <ThemedText type="smallBold" style={{ color: ink }}>
              {`Savings for ${formatMonthName(month)}`}
            </ThemedText>
            <ThemedText type="heading" style={[styles.centered, { color: ink }]}>
              {`${money.format(toSplitCents)} to split`}
            </ThemedText>
            <View style={styles.bar}>
              <GoalBar progress={toSplitCents > 0 ? Math.min(sum / toSplitCents, 1) : 1} color={ink} testID="split-bar" />
            </View>
            <ThemedText type="small" style={[styles.centered, { color: ink }]}>
              {`Split ${money.format(sum)} of ${money.format(toSplitCents)}`}
            </ThemedText>
          </Card>

          <View style={styles.section}>
            <View style={styles.sectionTitle}>
              <ThemedText type="smallBold" themeColor="textSecondary">
                Pockets
              </ThemedText>
              <Pill label="New pocket" icon="plus" onPress={() => router.push('/pocket-edit')} />
            </View>
            <Card style={styles.rows}>
              {pockets.length === 0 ? (
                <ThemedText themeColor="textSecondary">Make a pocket to put your savings in.</ThemedText>
              ) : null}
              {pockets.map((pocket, at) => {
                const already = thisMonth.get(pocket.id) ?? 0;
                return (
                  <View key={pocket.id}>
                    {at > 0 ? <View style={[styles.divider, { backgroundColor: theme.background }]} /> : null}
                    <View style={styles.row}>
                      <SpaceDot pocket={pocket} />
                      <View style={styles.name}>
                        <ThemedText type="smallBold" numberOfLines={1}>
                          {pocket.name}
                        </ThemedText>
                        {already > 0 ? (
                          <ThemedText type="caption" themeColor="textSecondary">
                            {`${money.format(already)} this month`}
                          </ThemedText>
                        ) : null}
                      </View>
                      <View style={[styles.field, { backgroundColor: theme.background }]}>
                        {money.symbolFirst ? <ThemedText themeColor="textSecondary">{money.symbol}</ThemedText> : null}
                        <TextInput
                          accessibilityLabel={`${pocket.name} amount`}
                          keyboardType={money.keyboard}
                          placeholder={money.placeholder}
                          placeholderTextColor={theme.textSecondary}
                          maxLength={MAX_AMOUNT_TEXT}
                          selectTextOnFocus
                          value={textOf(pocket.id)}
                          onChangeText={(text) => setTexts((current) => ({ ...current, [pocket.id]: money.groupInput(text) }))}
                          style={[styles.input, { color: theme.text }]}
                        />
                        {money.symbolFirst ? null : <ThemedText themeColor="textSecondary">{money.symbol}</ThemedText>}
                      </View>
                    </View>
                    {invalid[at] ? (
                      <ErrorText>{amounts[at] === null ? 'Type an amount, like 25 or 12,50.' : AMOUNT_TOO_LARGE}</ErrorText>
                    ) : null}
                  </View>
                );
              })}
            </Card>
          </View>

          <Button label="Save" disabled={!valid || submitting} onPress={onSave} />
        </ScreenScroll>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  summary: {
    alignItems: 'center',
    gap: Layout.tightGap,
  },
  centered: {
    textAlign: 'center',
  },
  bar: {
    alignSelf: 'stretch',
  },
  section: {
    gap: Layout.itemGap,
  },
  sectionTitle: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    // As tall as the pill it holds, like home's section titles.
    minHeight: Size.pill,
  },
  rows: {
    gap: 0,
    paddingVertical: Layout.tightGap,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Layout.rowGap,
    minHeight: Size.row,
  },
  name: {
    flex: 1,
  },
  field: {
    alignItems: 'center',
    borderRadius: Radius.field,
    flexDirection: 'row',
    gap: Layout.tightGap,
    minHeight: Size.control,
    paddingHorizontal: Layout.pillPadding,
    width: Size.rowAmountInput,
  },
  input: {
    flex: 1,
    fontFamily: FontFamily.semiBold,
    fontVariant: ['tabular-nums'],
    padding: 0,
    textAlign: 'right',
  },
});

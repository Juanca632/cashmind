import { Feather } from '@react-native-vector-icons/feather';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { KeyboardAvoidingView, Pressable, StyleSheet, Switch, TextInput, View } from 'react-native';

import { DEFAULT_CATEGORY, type EntryCategory } from '@/features/entries/categories';
import { AmountField } from '@/features/entries/components/amount-field';
import { CategoryChoices } from '@/features/entries/components/category-choices';
import { SpaceChoices } from '@/features/entries/components/space-choices';
import { PocketChoices } from '@/features/entries/components/pocket-choices';
import { KindSegmented } from '@/features/entries/components/kind-segmented';
import { QuickAddRow } from '@/features/entries/components/quick-add-row';
import { useEntriesBetween } from '@/features/entries/hooks/use-entries-between';
import { useEntry } from '@/features/entries/hooks/use-entry';
import { usePockets } from '@/features/entries/hooks/use-pockets';
import { useRecurringItem } from '@/features/entries/hooks/use-recurring-item';
import {
  ENTRY_MISSING,
  defaultEntryDate,
  entryErrorMessage,
  lastDayOfMonth,
  quickAddRange,
  quickAddSuggestions,
  validateEntry,
  type Entry,
  type EntryInput,
  type QuickAddSuggestion,
} from '@/features/entries/rules';
import { addEntry, deleteEntry, editEntry } from '@/features/entries/service';
import { ADD_LABELS, NOTE_EXAMPLES, type EntryKind } from '@/shared/kinds';
import { dayKey, dayToDate, formatDay } from '@/shared/days';
import { monthKey } from '@/shared/months';
import { useDiscardGuard } from '@/shared/hooks/use-discard-guard';
import { useSubmit } from '@/shared/hooks/use-submit';
import { useConfirm } from '@/shared/ui/confirm-dialog';
import { useMoney } from '@/shared/hooks/use-money';
import { FontFamily, IconSize, Layout, Radius, Size } from '@/shared/theme/theme';
import { useTheme } from '@/shared/theme/use-theme';
import { Button } from '@/shared/ui/button';
import { ScreenScroll } from '@/shared/ui/screen-scroll';
import { ThemedView } from '@/shared/ui/themed-view';
import { Card } from '@/shared/ui/card';
import { hapticTick } from '@/shared/haptics';
import { DataError } from '@/shared/ui/data-error';
import { MessageScreen } from '@/shared/ui/message-screen';
import { ErrorText } from '@/shared/ui/error-text';
import { ThemedText } from '@/shared/ui/themed-text';

export default function EntryScreen() {
  const params = useLocalSearchParams<{ id?: string; month?: string; kind?: string; repeat?: string; pocket?: string }>();
  const id = params.id ? Number(params.id) : null;
  const loaded = useEntry(id);
  const item = useRecurringItem(loaded.status === 'ready' ? (loaded.data?.recurringId ?? null) : null);
  const today = new Date();
  const range = quickAddRange(today);
  const recent = useEntriesBetween(range.from, range.to);

  if (loaded.status === 'error' || item.status === 'error') return <DataError />;
  if (loaded.status === 'loading' || item.status === 'loading' || recent.status === 'loading') {
    return <ThemedView style={styles.screen} />;
  }
  const entry = loaded.data;
  if (id !== null && !entry) return <MessageScreen title={ENTRY_MISSING} />;
  // Suggestions only help when adding; if recent entries cannot be read the form works without them.
  const suggestions = entry === null && recent.status === 'ready' ? quickAddSuggestions(recent.data, today) : [];

  return (
    <EntryForm
      entry={entry}
      // Add from My plan is for what repeats: income and expenses, never savings (specs/030-split-savings).
      kinds={entry === null && params.repeat === '1' ? REPEAT_KINDS : FORM_KINDS}
      defaultKind={params.kind === 'income' || (params.kind === 'savings' && params.repeat !== '1') ? params.kind : 'expense'}
      defaultDate={defaultEntryDate(params.month, today)}
      // An entry repeats while its item is active; Add from My plan starts with repeat on.
      initialRepeat={entry ? item.data?.active === true : params.repeat === '1'}
      // "Spend from this pocket" opens the form already paid from that pocket.
      defaultPocketId={params.pocket && Number.isInteger(Number(params.pocket)) ? Number(params.pocket) : null}
      today={today}
      suggestions={suggestions}
    />
  );
}

function EntryForm({
  entry,
  kinds,
  defaultKind,
  defaultDate,
  initialRepeat,
  defaultPocketId,
  today,
  suggestions,
}: {
  entry: Entry | null;
  /** The kinds the form offers. */
  kinds: readonly EntryKind[];
  defaultKind: EntryKind;
  defaultDate: string;
  initialRepeat: boolean;
  defaultPocketId: number | null;
  today: Date;
  /** Expenses recorded often lately, offered while adding an expense. */
  suggestions: readonly QuickAddSuggestion[];
}) {
  const db = useSQLiteContext();
  const theme = useTheme();
  const money = useMoney();
  const [amountText, setAmountText] = useState(entry ? money.toInput(entry.amountCents) : '');
  const [kind, setKind] = useState<EntryKind>(entry?.kind ?? defaultKind);
  const [category, setCategory] = useState<EntryCategory>(entry?.category ?? DEFAULT_CATEGORY);
  const [pocketId, setPocketId] = useState<number | null>(entry ? entry.pocketId : defaultPocketId);
  const pockets = usePockets();
  const [note, setNote] = useState(entry?.note ?? '');
  const [date, setDate] = useState(entry?.date ?? defaultDate);
  const [repeat, setRepeat] = useState(initialRepeat);
  const form = JSON.stringify({ amountText, kind, category, pocketId, note, date, repeat });
  const [savedForm] = useState(form);
  const { dialog: discardDialog, allowLeave } = useDiscardGuard(form !== savedForm);
  const { dialog: confirmDialog, ask } = useConfirm();
  const { submit, submitting } = useSubmit(allowLeave);

  // An entry stays in its month; the calendar picks within it, up to today.
  const formMonth = (entry?.date ?? defaultDate).slice(0, 7);
  const firstDay = `${formMonth}-01`;
  const todayKey = dayKey(today);
  const lastDay = lastDayOfMonth(formMonth) < todayKey ? lastDayOfMonth(formMonth) : todayKey;
  // Only this month's income and expenses can repeat; past months never change, and savings are
  // split from home each month (specs/030-split-savings).
  const canRepeat = formMonth === monthKey(today) && kind !== 'savings';
  // Savings go into a pocket and keep no category of their own; the others never have a pocket.
  const input: EntryInput = {
    date,
    kind,
    amountCents: money.parse(amountText) ?? 0,
    note: note.trim(),
    category: kind === 'savings' ? DEFAULT_CATEGORY : category,
    // Savings go into a pocket; an expense may be paid from one; income never has one.
    pocketId: kind === 'income' ? null : pocketId,
  };
  const errors = validateEntry(input, today);
  const amountError = errors.find((error) => error === 'amount-not-positive' || error === 'amount-too-large');

  const submitLabel = entry ? 'Save changes' : ADD_LABELS[kind];

  /** Fills the form from a suggestion; the kind, the date and the repeat switch stay as they are. */
  function fillFrom(suggestion: QuickAddSuggestion) {
    hapticTick();
    setAmountText(money.toInput(suggestion.amountCents));
    setCategory(suggestion.category);
    setNote(suggestion.note);
  }

  function onSave() {
    const now = new Date();
    const choice = canRepeat ? { repeat } : {};
    submit(() => (entry ? editEntry(db, entry.id, input, now, choice) : addEntry(db, input, now, choice)));
  }

  /** Android's calendar, limited to the entry's month and to today. */
  function pickDate() {
    DateTimePickerAndroid.open({
      value: dayToDate(date),
      mode: 'date',
      minimumDate: dayToDate(firstDay),
      maximumDate: dayToDate(lastDay),
      onValueChange: (_event, picked) => {
        if (picked) setDate(dayKey(picked));
      },
    });
  }

  function onDelete() {
    if (!entry) return;
    ask({
      title: 'Delete this entry?',
      message: 'This cannot be undone.',
      cancel: 'Cancel',
      confirm: 'Delete',
      onConfirm: () => submit(() => deleteEntry(db, entry.id), 'delete'),
    });
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior="padding">
      <ThemedView style={styles.screen}>
        <Stack.Screen options={{ title: entry ? 'Edit entry' : ADD_LABELS[kind] }} />
        {discardDialog}
        {confirmDialog}
        <ScreenScroll>
          <KindSegmented
            kinds={kinds}
            value={kind}
            onChange={(option) => {
              setKind(option);
              // Categories belong to a kind: a new kind starts again from Other, and from no pocket.
              setCategory(DEFAULT_CATEGORY);
              setPocketId(null);
            }}
          />

          {/* The one big figure, alone in its card like My plan's percentage, tinted with the kind's color. */}
          <Card size="large" style={{ backgroundColor: theme.kindTint[kind] }}>
            <AmountField
              value={amountText}
              onChangeText={setAmountText}
              error={amountError ? entryErrorMessage(amountError) : null}
              size="large"
            />
          </Card>

          {kind === 'savings' ? (
            <View style={styles.section}>
              <ThemedText type="smallBold" themeColor="textSecondary">
                Pocket
              </ThemedText>
              <PocketChoices
                pockets={pockets.status === 'ready' ? pockets.data : []}
                value={pocketId}
                onChange={setPocketId}
              />
              {errors.includes('pocket-missing') ? (
                <ThemedText type="small" themeColor="textSecondary">
                  {entryErrorMessage('pocket-missing')}
                </ThemedText>
              ) : null}
            </View>
          ) : (
            <View style={styles.section}>
              <ThemedText type="smallBold" themeColor="textSecondary">
                Category
              </ThemedText>
              <CategoryChoices kind={kind} value={category} onChange={setCategory} layout="grid" />
            </View>
          )}

          {kind === 'expense' && pockets.status === 'ready' && pockets.data.length > 0 ? (
            <View style={styles.section}>
              <ThemedText type="smallBold" themeColor="textSecondary">
                Paid from
              </ThemedText>
              <SpaceChoices pockets={pockets.data} value={pocketId} onChange={setPocketId} />
            </View>
          ) : null}

          {kind === 'expense' ? <QuickAddRow suggestions={suggestions} onPick={fillFrom} /> : null}

          {/* The details, as rows of one card: a value on the right, like a settings list. */}
          <Card style={styles.details}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Date: ${formatDay(date)}. Pick a day`}
              onPress={pickDate}
              style={({ pressed }) => [styles.detailRow, pressed && { backgroundColor: theme.pressed }]}>
              <Feather name="calendar" size={IconSize.medium} color={theme.textSecondary} />
              <ThemedText style={styles.detailLabel}>Date</ThemedText>
              <ThemedText type="smallBold" themeColor="textSecondary">
                {date === todayKey ? 'Today' : formatDay(date)}
              </ThemedText>
              <Feather name="chevron-right" size={IconSize.medium} color={theme.textSecondary} />
            </Pressable>
            {errors.includes('date-invalid') ? <ErrorText>{entryErrorMessage('date-invalid')}</ErrorText> : null}

            {canRepeat ? (
              <>
                <View style={[styles.divider, { backgroundColor: theme.background }]} />
                <View style={styles.detailRow}>
                  <Feather name="repeat" size={IconSize.medium} color={theme.textSecondary} />
                  <ThemedText style={styles.detailLabel}>Repeat every month</ThemedText>
                  <Switch
                    accessibilityLabel="Repeat every month"
                    accessibilityRole="switch"
                    value={repeat}
                    onValueChange={(value) => {
                      hapticTick();
                      setRepeat(value);
                    }}
                    thumbColor={theme.background}
                    trackColor={{ false: theme.textSecondary, true: theme.accent }}
                  />
                </View>
              </>
            ) : null}

            <View style={[styles.divider, { backgroundColor: theme.background }]} />
            <View style={styles.detailRow}>
              <Feather name="edit-3" size={IconSize.medium} color={theme.textSecondary} />
              <TextInput
                accessibilityLabel="Note (optional)"
                placeholder={`Note, e.g. ${NOTE_EXAMPLES[kind]}`}
                placeholderTextColor={theme.textSecondary}
                value={note}
                onChangeText={setNote}
                maxLength={80}
                style={[styles.noteInput, { color: theme.text }]}
              />
            </View>
          </Card>
          <Button label={submitLabel} disabled={errors.length > 0 || submitting} onPress={onSave} />
          {entry ? <Button label="Delete" variant="destructive" disabled={submitting} onPress={onDelete} /> : null}
        </ScreenScroll>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

/** The kinds in the order the entry form offers them (ENTRY_KINDS has another order): expenses are the most common. */
const FORM_KINDS: readonly EntryKind[] = ['expense', 'income', 'savings'];
const REPEAT_KINDS: readonly EntryKind[] = ['expense', 'income'];

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  section: {
    gap: Layout.itemGap,
  },
  details: {
    gap: 0,
    paddingVertical: Layout.tightGap,
  },
  detailRow: {
    alignItems: 'center',
    borderRadius: Radius.field,
    flexDirection: 'row',
    gap: Layout.rowGap,
    minHeight: Size.control,
  },
  detailLabel: {
    flex: 1,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  noteInput: {
    flex: 1,
    fontFamily: FontFamily.medium,
    minHeight: Size.control,
    padding: 0,
  },
});

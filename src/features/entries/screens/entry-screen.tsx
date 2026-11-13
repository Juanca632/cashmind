import { Feather } from '@react-native-vector-icons/feather';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { KeyboardAvoidingView, StyleSheet, TextInput, View } from 'react-native';

import { CATEGORIES, CATEGORY_LABELS, DEFAULT_CATEGORY, type EntryCategory } from '@/features/entries/categories';
import { categoryIcon } from '@/features/entries/components/category-icons';
import { useEntry } from '@/features/entries/hooks/use-entry';
import {
  ENTRY_MISSING,
  defaultEntryDate,
  entryErrorMessage,
  lastDayOfMonth,
  validateEntry,
  type Entry,
  type EntryInput,
} from '@/features/entries/rules';
import { addEntry, deleteEntry, editEntry } from '@/features/entries/service';
import { ADD_LABELS, KIND_DESCRIPTIONS, KIND_LABELS, ENTRY_KINDS, type EntryKind } from '@/shared/kinds';
import { addDays, dayKey, formatDay } from '@/shared/days';
import { useDiscardGuard } from '@/shared/hooks/use-discard-guard';
import { useSubmit } from '@/shared/hooks/use-submit';
import { useConfirm } from '@/shared/ui/confirm-dialog';
import { centsToInput, parseEurosToCents } from '@/shared/money';
import { FontFamily, IconSize, Layout, Radius, Size } from '@/shared/theme/theme';
import { useTheme } from '@/shared/theme/use-theme';
import { KIND_ICONS } from '@/shared/ui/kind-badge';
import { Button } from '@/shared/ui/button';
import { IconButton } from '@/shared/ui/icon-button';
import { Pill } from '@/shared/ui/pill';
import { PressableScale } from '@/shared/ui/pressable-scale';
import { ScreenScroll } from '@/shared/ui/screen-scroll';
import { hapticTick } from '@/shared/haptics';
import { DataError } from '@/shared/ui/data-error';
import { MessageScreen } from '@/shared/ui/message-screen';
import { ErrorText } from '@/shared/ui/error-text';
import { TextField } from '@/shared/ui/text-field';
import { ThemedText } from '@/shared/ui/themed-text';
import { ThemedView } from '@/shared/ui/themed-view';

export default function EntryScreen() {
  const params = useLocalSearchParams<{ id?: string; month?: string; kind?: string }>();
  const id = params.id ? Number(params.id) : null;
  const loaded = useEntry(id);

  if (loaded.status === 'error') return <DataError />;
  if (loaded.status === 'loading') return <ThemedView style={styles.screen} />;
  const entry = loaded.data;
  if (id !== null && !entry) return <MessageScreen title={ENTRY_MISSING} />;

  const today = new Date();

  return (
    <EntryForm
      entry={entry}
      defaultKind={params.kind === 'savings' || params.kind === 'income' ? params.kind : 'expense'}
      defaultDate={defaultEntryDate(params.month, today)}
      today={today}
    />
  );
}

function EntryForm({
  entry,
  defaultKind,
  defaultDate,
  today,
}: {
  entry: Entry | null;
  defaultKind: EntryKind;
  defaultDate: string;
  today: Date;
}) {
  const db = useSQLiteContext();
  const theme = useTheme();
  const [amountText, setAmountText] = useState(entry ? centsToInput(entry.amountCents) : '');
  const [kind, setKind] = useState<EntryKind>(entry?.kind ?? defaultKind);
  const [category, setCategory] = useState<EntryCategory>(entry?.category ?? DEFAULT_CATEGORY);
  const [note, setNote] = useState(entry?.note ?? '');
  const [date, setDate] = useState(entry?.date ?? defaultDate);
  const form = JSON.stringify({ amountText, kind, category, note, date });
  const [savedForm] = useState(form);
  const { dialog: discardDialog, allowLeave } = useDiscardGuard(form !== savedForm);
  const { dialog: confirmDialog, ask } = useConfirm();
  const { submit, submitting } = useSubmit(allowLeave);

  // An entry stays in its month; the date moves within it, up to today.
  const formMonth = (entry?.date ?? defaultDate).slice(0, 7);
  const firstDay = `${formMonth}-01`;
  const todayKey = dayKey(today);
  const lastDay = lastDayOfMonth(formMonth) < todayKey ? lastDayOfMonth(formMonth) : todayKey;
  const input: EntryInput = { date, kind, amountCents: parseEurosToCents(amountText) ?? 0, note: note.trim(), category };
  const errors = validateEntry(input, today);
  const amountError = errors.find((error) => error === 'amount-not-positive' || error === 'amount-too-large');

  const submitLabel = entry ? 'Save changes' : ADD_LABELS[kind];

  function onSave() {
    const now = new Date();
    submit(() => (entry ? editEntry(db, entry.id, input, now) : addEntry(db, input, now)));
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
          <View style={styles.group}>
            <View style={styles.amount}>
              <TextInput
                accessibilityLabel="Amount"
                keyboardType="decimal-pad"
                placeholder="0,00"
                placeholderTextColor={theme.textSecondary}
                maxLength={10}
                autoFocus={!entry}
                value={amountText}
                onChangeText={setAmountText}
                style={[styles.amountInput, { color: theme.text }]}
              />
              <ThemedText type="heading" themeColor="textSecondary">
                €
              </ThemedText>
            </View>
            {amountText.trim() !== '' && amountError ? <ErrorText>{entryErrorMessage(amountError)}</ErrorText> : null}
          </View>

          <View style={styles.group}>
            <View style={styles.kindRow}>
              {ENTRY_KINDS.map((option) => {
                const selected = option === kind;
                return (
                  <PressableScale
                    key={option}
                    accessibilityRole="radio"
                    accessibilityLabel={KIND_LABELS[option]}
                    accessibilityState={{ selected }}
                    onPress={() => {
                      if (option === kind) return;
                      hapticTick();
                      setKind(option);
                      // Categories belong to a kind: a new kind starts again from Other.
                      setCategory(DEFAULT_CATEGORY);
                    }}
                    style={[styles.kind, { backgroundColor: selected ? theme.kindFill[option] : theme.backgroundElement }]}>
                    <Feather name={KIND_ICONS[option]} size={IconSize.medium} color={selected ? theme.onAccent : theme.kindInk[option]} />
                    <ThemedText type="smallBold" style={selected ? { color: theme.onAccent } : undefined}>
                      {KIND_LABELS[option]}
                    </ThemedText>
                  </PressableScale>
                );
              })}
            </View>
            <ThemedText type="caption" themeColor="textSecondary" style={styles.centered}>
              {KIND_DESCRIPTIONS[kind]}
            </ThemedText>
          </View>

          <View style={styles.categories} accessibilityRole="radiogroup" accessibilityLabel="Category">
            {CATEGORIES[kind].map((option) => (
              <Pill
                key={option}
                label={CATEGORY_LABELS[option]}
                icon={categoryIcon(kind, option)}
                accessibilityRole="radio"
                weight="regular"
                selected={option === category}
                colors={{ fill: theme.kindTint[kind], ink: theme.kindInk[kind] }}
                onPress={() => {
                  if (option === category) return;
                  hapticTick();
                  setCategory(option);
                }}
              />
            ))}
          </View>

          <TextField label="Note (optional)" placeholder="Cinema" value={note} onChangeText={setNote} maxLength={80} />

          <View style={[styles.dateRow, { backgroundColor: theme.backgroundElement }]}>
            <IconButton
              icon="chevron-left"
              accessibilityLabel="Previous day"
              disabled={date <= firstDay}
              onPress={() => setDate(addDays(date, -1))}
            />
            <ThemedText type="smallBold">{date === todayKey ? `Today · ${formatDay(date)}` : formatDay(date)}</ThemedText>
            <IconButton
              icon="chevron-right"
              accessibilityLabel="Next day"
              disabled={date >= lastDay}
              onPress={() => setDate(addDays(date, 1))}
            />
          </View>
          {errors.includes('date-invalid') ? <ErrorText>{entryErrorMessage('date-invalid')}</ErrorText> : null}

          <Button label={submitLabel} disabled={errors.length > 0 || submitting} onPress={onSave} />
          {entry ? <Button label="Delete" variant="destructive" disabled={submitting} onPress={onDelete} /> : null}
        </ScreenScroll>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  /** A field with its error, or the kind choices with their description. */
  group: {
    gap: Layout.sectionGap,
  },
  amount: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Layout.itemGap,
    justifyContent: 'center',
    paddingVertical: Layout.sectionGap,
  },
  amountInput: {
    fontFamily: FontFamily.bold,
    fontSize: 40,
    fontVariant: ['tabular-nums'],
    minWidth: Size.amountInput,
    padding: 0,
    textAlign: 'center',
  },
  centered: {
    textAlign: 'center',
  },
  kindRow: {
    flexDirection: 'row',
    gap: Layout.itemGap,
  },
  kind: {
    alignItems: 'center',
    borderRadius: Radius.card,
    flex: 1,
    gap: Layout.tightGap,
    justifyContent: 'center',
    minHeight: Size.choice,
  },
  categories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Layout.itemGap,
  },
  dateRow: {
    alignItems: 'center',
    borderRadius: Radius.field,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: Size.control,
  },
});

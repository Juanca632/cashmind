import { Feather } from '@react-native-vector-icons/feather';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { KeyboardAvoidingView, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AmountField } from '@/features/entries/components/amount-field';
import { SpaceChoices } from '@/features/entries/components/space-choices';
import { PocketChoices } from '@/features/entries/components/pocket-choices';
import { useMove, useMoves } from '@/features/entries/hooks/use-moves';
import { usePocketEntries } from '@/features/entries/hooks/use-pocket-entries';
import { usePockets } from '@/features/entries/hooks/use-pockets';
import {
  MOVE_MISSING,
  moveErrorMessage,
  moveTooMuch,
  pocketBalances,
  validateMove,
  type Entry,
  type Move,
  type MoveInput,
  type Pocket,
} from '@/features/entries/rules';
import { addMove, deleteMove, editMove } from '@/features/entries/service';
import { dayKey, dayToDate, formatDay } from '@/shared/days';
import { useDiscardGuard } from '@/shared/hooks/use-discard-guard';
import { useMoney } from '@/shared/hooks/use-money';
import { useSubmit } from '@/shared/hooks/use-submit';
import { FontFamily, IconSize, Layout, Radius, Size } from '@/shared/theme/theme';
import { useTheme } from '@/shared/theme/use-theme';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { useConfirm } from '@/shared/ui/confirm-dialog';
import { DataError } from '@/shared/ui/data-error';
import { ErrorText } from '@/shared/ui/error-text';
import { MessageScreen } from '@/shared/ui/message-screen';
import { ScreenScroll } from '@/shared/ui/screen-scroll';
import { ThemedText } from '@/shared/ui/themed-text';
import { ThemedView } from '@/shared/ui/themed-view';

/** Moves money from one pocket to another, or edits a move (specs/028-move-money, 031-pocket-moves-only). */
export default function MoveScreen() {
  const params = useLocalSearchParams<{ id?: string; from?: string }>();
  const id = params.id ? Number(params.id) : null;
  const loaded = useMove(id);
  const pockets = usePockets();
  const entries = usePocketEntries();
  const moves = useMoves();

  if ([loaded, pockets, entries, moves].some((data) => data.status === 'error')) return <DataError />;
  if (loaded.status !== 'ready' || pockets.status !== 'ready' || entries.status !== 'ready' || moves.status !== 'ready') {
    return <ThemedView style={styles.screen} />;
  }
  const move = loaded.data;
  if (id !== null && !move) return <MessageScreen title={MOVE_MISSING} />;
  const from = Number(params.from);
  const defaultFrom = pockets.data.find((pocket) => pocket.id === from)?.id ?? pockets.data[0]?.id;
  if (defaultFrom === undefined) return <MessageScreen title="Make a pocket first." />;

  return <MoveForm move={move} defaultFrom={defaultFrom} pockets={pockets.data} entries={entries.data} moves={moves.data} />;
}

type MoveFormProps = {
  move: Move | null;
  defaultFrom: number;
  pockets: readonly Pocket[];
  /** Every entry with a pocket and every move, to know what each pocket holds. */
  entries: readonly Entry[];
  moves: readonly Move[];
};

function MoveForm({ move, defaultFrom, pockets, entries, moves }: MoveFormProps) {
  const db = useSQLiteContext();
  const theme = useTheme();
  const money = useMoney();
  const today = new Date();
  const todayKey = dayKey(today);
  const [fromId, setFromId] = useState(move?.fromPocketId ?? defaultFrom);
  // Savings only move between pockets (specs/031-pocket-moves-only). A move an earlier version
  // stored into Main (null) can stay there while edited, and nothing else can be set to Main.
  const intoMain = move !== null && move.toPocketId === null;
  const firstOther = (pocketId: number) => pockets.find((pocket) => pocket.id !== pocketId)?.id ?? null;
  const [toId, setToId] = useState<number | null>(move ? move.toPocketId : firstOther(defaultFrom));
  const [amountText, setAmountText] = useState(move ? money.toInput(move.amountCents) : '');
  const [date, setDate] = useState(move?.date ?? todayKey);
  const [note, setNote] = useState(move?.note ?? '');
  const form = JSON.stringify({ fromId, toId, amountText, date, note });
  const [savedForm] = useState(form);
  const { dialog: discardDialog, allowLeave } = useDiscardGuard(form !== savedForm);
  const { dialog: confirmDialog, ask } = useConfirm();
  const { submit, submitting } = useSubmit(allowLeave);

  const input: MoveInput = { date, amountCents: money.parse(amountText) ?? 0, note: note.trim(), fromPocketId: fromId, toPocketId: toId };
  const errors = validateMove(input, today);
  const amountError = errors.find((error) => error === 'amount-not-positive' || error === 'amount-too-large');
  // What the From pocket holds, with this move's own amount still in it when editing.
  const others = move ? moves.filter((other) => other.id !== move.id) : moves;
  const fromPocket = pockets.find((pocket) => pocket.id === fromId);
  const toChoices = pockets.filter((pocket) => pocket.id !== fromId);
  const [balance] = fromPocket ? pocketBalances([fromPocket], entries, others) : [];
  const tooMuch = balance !== undefined && input.amountCents > 0 && moveTooMuch(input.amountCents, balance.cents);
  const valid = errors.length === 0 && !tooMuch && (toId !== null || intoMain);

  function changeFrom(pocketId: number) {
    setFromId(pocketId);
    // A pocket cannot move to itself: To goes to the first other pocket.
    if (pocketId === toId) setToId(firstOther(pocketId));
  }

  function onSave() {
    const now = new Date();
    submit(() => (move ? editMove(db, move.id, input, now) : addMove(db, input, now)));
  }

  function pickDate() {
    DateTimePickerAndroid.open({
      value: dayToDate(date),
      mode: 'date',
      maximumDate: dayToDate(todayKey),
      onValueChange: (_event, picked) => {
        if (picked) setDate(dayKey(picked));
      },
    });
  }

  function onDelete() {
    if (!move) return;
    ask({
      title: 'Delete this move?',
      message: 'The money goes back where it came from.',
      cancel: 'Cancel',
      confirm: 'Delete',
      onConfirm: () => submit(() => deleteMove(db, move.id), 'delete'),
    });
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior="padding">
      <ThemedView style={styles.screen}>
        <Stack.Screen options={{ title: move ? 'Edit move' : 'Move money' }} />
        {discardDialog}
        {confirmDialog}
        <ScreenScroll>
          <View style={styles.section}>
            <ThemedText type="smallBold" themeColor="textSecondary">
              From
            </ThemedText>
            <PocketChoices pockets={pockets} value={fromId} onChange={changeFrom} allowNew={false} label="From" />
          </View>

          <View style={styles.section}>
            <ThemedText type="smallBold" themeColor="textSecondary">
              To
            </ThemedText>
            {intoMain ? (
              <SpaceChoices pockets={toChoices} value={toId} onChange={setToId} label="To" />
            ) : (
              <PocketChoices pockets={toChoices} value={toId} onChange={setToId} label="To" />
            )}
          </View>

          <Card size="large" style={{ backgroundColor: theme.kindTint.savings }}>
            <AmountField
              value={amountText}
              onChangeText={setAmountText}
              error={amountError ? moveErrorMessage(amountError) : null}
              size="large"
            />
          </Card>
          {tooMuch && fromPocket && balance ? (
            <ErrorText>{`${fromPocket.name} holds only ${money.format(balance.cents)}.`}</ErrorText>
          ) : null}

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
            {errors.includes('date-invalid') ? <ErrorText>{moveErrorMessage('date-invalid')}</ErrorText> : null}
            <View style={[styles.divider, { backgroundColor: theme.background }]} />
            <View style={styles.detailRow}>
              <Feather name="edit-3" size={IconSize.medium} color={theme.textSecondary} />
              <TextInput
                accessibilityLabel="Note (optional)"
                placeholder="Note, e.g. Car repair"
                placeholderTextColor={theme.textSecondary}
                value={note}
                onChangeText={setNote}
                maxLength={80}
                style={[styles.noteInput, { color: theme.text }]}
              />
            </View>
          </Card>

          <Button label={move ? 'Save changes' : 'Move'} disabled={!valid || submitting} onPress={onSave} />
          {move ? <Button label="Delete move" variant="destructive" disabled={submitting} onPress={onDelete} /> : null}
        </ScreenScroll>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

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

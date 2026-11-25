import { useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { KeyboardAvoidingView, StyleSheet, View } from 'react-native';

import type { EntryCategory } from '@/features/entries/categories';
import { AmountField } from '@/features/entries/components/amount-field';
import { CategoryChoices } from '@/features/entries/components/category-choices';
import { PocketChoices } from '@/features/entries/components/pocket-choices';
import { usePockets } from '@/features/entries/hooks/use-pockets';
import { useRecurringItem } from '@/features/entries/hooks/use-recurring-item';
import { RECURRING_MISSING, entryErrorMessage, validateRecurring, type RecurringItem } from '@/features/entries/rules';
import { editRecurring, stopRecurring } from '@/features/entries/service';
import { KIND_LABELS, NOTE_EXAMPLES } from '@/shared/kinds';
import { useDiscardGuard } from '@/shared/hooks/use-discard-guard';
import { useSubmit } from '@/shared/hooks/use-submit';
import { useMoney } from '@/shared/hooks/use-money';
import { Layout } from '@/shared/theme/theme';
import { Button } from '@/shared/ui/button';
import { useConfirm } from '@/shared/ui/confirm-dialog';
import { DataError } from '@/shared/ui/data-error';
import { KindBadge } from '@/shared/ui/kind-badge';
import { MessageScreen } from '@/shared/ui/message-screen';
import { ScreenScroll } from '@/shared/ui/screen-scroll';
import { TextField } from '@/shared/ui/text-field';
import { ThemedText } from '@/shared/ui/themed-text';
import { ThemedView } from '@/shared/ui/themed-view';

/** One monthly item: change what next months record, or stop it. Its kind is fixed. */
export default function RecurringScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = params.id ? Number(params.id) : null;
  const loaded = useRecurringItem(id);

  if (loaded.status === 'error') return <DataError />;
  if (loaded.status === 'loading') return <ThemedView style={styles.screen} />;
  if (!loaded.data?.active) return <MessageScreen title={RECURRING_MISSING} />;
  return <RecurringForm item={loaded.data} />;
}

function RecurringForm({ item }: { item: RecurringItem }) {
  const db = useSQLiteContext();
  const money = useMoney();
  const [amountText, setAmountText] = useState(money.toInput(item.amountCents));
  const [category, setCategory] = useState<EntryCategory>(item.category);
  const [note, setNote] = useState(item.note);
  const [pocketId, setPocketId] = useState(item.pocketId);
  const pockets = usePockets();
  const form = JSON.stringify({ amountText, category, note, pocketId });
  const [savedForm] = useState(form);
  const { dialog: discardDialog, allowLeave } = useDiscardGuard(form !== savedForm);
  const { dialog: confirmDialog, ask } = useConfirm();
  const { submit, submitting } = useSubmit(allowLeave);

  const input = { category, amountCents: money.parse(amountText) ?? 0, note: note.trim(), pocketId };
  const errors = validateRecurring(item.kind, input);
  const amountError = errors.find((error) => error === 'amount-not-positive' || error === 'amount-too-large');

  function onStop() {
    ask({
      title: 'Stop repeating?',
      message: 'Past entries stay.',
      cancel: 'Cancel',
      confirm: 'Stop',
      onConfirm: () => submit(() => stopRecurring(db, item.id), 'delete'),
    });
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior="padding">
      <ThemedView style={styles.screen}>
        {discardDialog}
        {confirmDialog}
        <ScreenScroll>
          <View style={styles.kind}>
            <KindBadge kind={item.kind} />
            <ThemedText type="smallBold">{KIND_LABELS[item.kind]}</ThemedText>
          </View>

          <AmountField
            value={amountText}
            onChangeText={setAmountText}
            error={amountError ? entryErrorMessage(amountError) : null}
          />

          {item.kind === 'savings' ? (
            <PocketChoices pockets={pockets.status === 'ready' ? pockets.data : []} value={pocketId} onChange={setPocketId} />
          ) : (
            <CategoryChoices kind={item.kind} value={category} onChange={setCategory} />
          )}

          <TextField
            label="Note (optional)"
            placeholder={NOTE_EXAMPLES[item.kind]}
            value={note}
            onChangeText={setNote}
            maxLength={80}
          />

          <ThemedText type="small" themeColor="textSecondary">
            Recorded on the 1st of every month. Changes apply from next month.
          </ThemedText>

          <Button
            label="Save changes"
            disabled={errors.length > 0 || submitting}
            onPress={() => submit(() => editRecurring(db, item.id, input))}
          />
          <Button label="Stop repeating" variant="destructive" disabled={submitting} onPress={onStop} />
        </ScreenScroll>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  kind: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Layout.itemGap,
  },
});

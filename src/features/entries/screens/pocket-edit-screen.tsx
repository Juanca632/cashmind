import { Stack, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { KeyboardAvoidingView, StyleSheet } from 'react-native';

import { AmountField } from '@/features/entries/components/amount-field';
import { usePocket } from '@/features/entries/hooks/use-pocket';
import { POCKET_NAME_MAX, pocketErrorMessage, validatePocket, type Pocket } from '@/features/entries/rules';
import { addPocket, deletePocket, editPocket } from '@/features/entries/service';
import { useDiscardGuard } from '@/shared/hooks/use-discard-guard';
import { useMoney } from '@/shared/hooks/use-money';
import { useSubmit } from '@/shared/hooks/use-submit';
import { Button } from '@/shared/ui/button';
import { useConfirm } from '@/shared/ui/confirm-dialog';
import { DataError } from '@/shared/ui/data-error';
import { ErrorText } from '@/shared/ui/error-text';
import { MessageScreen } from '@/shared/ui/message-screen';
import { ScreenScroll } from '@/shared/ui/screen-scroll';
import { TextField } from '@/shared/ui/text-field';
import { ThemedText } from '@/shared/ui/themed-text';
import { ThemedView } from '@/shared/ui/themed-view';

/** Makes a pocket, or renames one and changes what it started with (specs/025-pockets). */
export default function PocketEditScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  if (params.id === undefined) return <PocketForm pocket={null} inUse={false} />;
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) return <MessageScreen title="This pocket no longer exists." />;
  return <PocketEditLoader id={id} />;
}

function PocketEditLoader({ id }: { id: number }) {
  const loaded = usePocket(id);
  if (loaded.status === 'error') return <DataError />;
  if (loaded.status === 'loading') return <ThemedView style={styles.screen} />;
  if (loaded.data === null) return <MessageScreen title="This pocket no longer exists." />;
  return <PocketForm pocket={loaded.data.pocket} inUse={loaded.data.inUse} />;
}

function PocketForm({ pocket, inUse }: { pocket: Pocket | null; inUse: boolean }) {
  const db = useSQLiteContext();
  const money = useMoney();
  const [name, setName] = useState(pocket?.name ?? '');
  const [startText, setStartText] = useState(pocket && pocket.startingCents > 0 ? money.toInput(pocket.startingCents) : '');
  const form = JSON.stringify({ name, startText });
  const [savedForm] = useState(form);
  const { dialog: discardDialog, allowLeave } = useDiscardGuard(form !== savedForm);
  const { dialog: confirmDialog, ask } = useConfirm();
  const { submit, submitting } = useSubmit(allowLeave);
  // Problems show once the user tries to save, or as soon as a typed name is too long.
  const [tried, setTried] = useState(false);

  // An empty starting amount is 0; anything typed must read as an amount.
  const startingCents = startText.trim() === '' ? 0 : money.parse(startText);
  const input = { name, startingCents: startingCents ?? 0 };
  const errors = startingCents === null ? [] : validatePocket(input);
  const nameError =
    errors.includes('pocket-name') && (tried || name.trim() !== '') ? pocketErrorMessage('pocket-name') : null;
  const startError =
    startingCents === null ? 'Type an amount, like 1500.' : errors.includes('amount-too-large') ? pocketErrorMessage('amount-too-large') : null;
  const valid = startingCents !== null && errors.length === 0;

  function onSave() {
    if (!valid) {
      setTried(true);
      return;
    }
    submit(() => (pocket ? editPocket(db, pocket.id, input) : addPocket(db, input)));
  }

  function onDelete() {
    if (!pocket) return;
    ask({
      title: `Delete ${pocket.name}?`,
      message: 'The pocket is empty, so nothing else is deleted.',
      cancel: 'Cancel',
      confirm: 'Delete',
      // The pocket's own screen would show a pocket that is gone, so go back to the list.
      onConfirm: () => submit(() => deletePocket(db, pocket.id), 'delete', '/pockets'),
    });
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior="padding">
      <ThemedView style={styles.screen}>
        <Stack.Screen options={{ title: pocket ? 'Edit pocket' : 'New pocket' }} />
        {discardDialog}
        {confirmDialog}
        <ScreenScroll>
          <TextField
            label="Name"
            placeholder="Japan trip"
            value={name}
            onChangeText={setName}
            maxLength={POCKET_NAME_MAX}
            autoFocus={pocket === null}
          />
          {nameError ? <ErrorText>{nameError}</ErrorText> : null}

          <ThemedText type="small" themeColor="textSecondary">
            Already saved for it before using the app (optional)
          </ThemedText>
          <AmountField value={startText} onChangeText={setStartText} error={startError} />
          <ThemedText type="small" themeColor="textSecondary">
            This starting amount is not counted as this month&apos;s savings.
          </ThemedText>

          <Button label={pocket ? 'Save changes' : 'Create pocket'} disabled={submitting} onPress={onSave} />
          {pocket === null ? null : inUse ? (
            <ThemedText type="small" themeColor="textSecondary">
              A pocket with savings can&apos;t be deleted. You can rename it.
            </ThemedText>
          ) : (
            <Button label="Delete pocket" variant="destructive" disabled={submitting} onPress={onDelete} />
          )}
        </ScreenScroll>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
});

import { Feather } from '@react-native-vector-icons/feather';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { isBlankDraft, type ItemDraft } from '@/features/plan/plan-form';
import { MAX_ITEM_NAME_LENGTH } from '@/features/plan/rules';
import { formatEuros } from '@/shared/money';
import { BUCKET_COLORS, BUCKET_TINTS, FontFamily, MIN_TOUCH, Radius, Spacing } from '@/shared/theme/theme';
import { useTheme } from '@/shared/theme/use-theme';
import { BucketBadge } from '@/shared/ui/bucket-badge';
import { Button } from '@/shared/ui/button';
import { useConfirm } from '@/shared/ui/confirm-dialog';
import { ThemedText } from '@/shared/ui/themed-text';
import { ThemedView } from '@/shared/ui/themed-view';

type FixedItemsEditorProps = {
  drafts: ItemDraft[];
  total: number;
  onChange: (drafts: ItemDraft[]) => void;
};

/** What the user pays every month, laid out like Activity: title and Add, the rows, then the total. */
export function FixedItemsEditor({ drafts, total, onChange }: FixedItemsEditorProps) {
  const theme = useTheme();
  const { dialog, ask } = useConfirm();
  const [addedKey, setAddedKey] = useState<number | null>(null);

  function update(key: number, change: Partial<ItemDraft>) {
    onChange(drafts.map((draft) => (draft.key === key ? { ...draft, ...change } : draft)));
  }

  function add() {
    const key = Math.max(0, ...drafts.map((draft) => draft.key)) + 1;
    setAddedKey(key);
    onChange([...drafts, { key, name: '', amountText: '' }]);
  }

  function remove(draft: ItemDraft) {
    const removeNow = () => onChange(drafts.filter((other) => other.key !== draft.key));
    if (isBlankDraft(draft)) {
      removeNow();
      return;
    }
    ask({
      title: 'Remove this expense?',
      message: draft.name.trim() === '' ? 'It will leave your list.' : `${draft.name.trim()} will leave your list.`,
      cancel: 'Cancel',
      confirm: 'Remove',
      onConfirm: removeNow,
    });
  }

  return (
    <View style={styles.container}>
      {dialog}
      <View style={styles.title}>
        <ThemedText type="smallBold" themeColor="textSecondary">
          Every month
        </ThemedText>
        <Button label="Add" icon="plus" accessibilityLabel="Add fixed expense" variant="pill" onPress={add} />
      </View>

      <ThemedView type="backgroundElement" style={styles.list}>
        {drafts.length === 0 ? (
          <ThemedText themeColor="textSecondary" style={styles.empty}>
            Nothing here yet.
          </ThemedText>
        ) : null}
        {drafts.map((draft, index) => {
          const position = index + 1;
          return (
            <View key={draft.key} style={styles.row}>
              <BucketBadge bucket="fixed" />
              <TextInput
                accessibilityLabel={`Item ${position} name`}
                autoFocus={draft.key === addedKey}
                maxLength={MAX_ITEM_NAME_LENGTH}
                placeholder="Name"
                placeholderTextColor={theme.textSecondary}
                style={[styles.input, styles.name, { color: theme.text }]}
                value={draft.name}
                onChangeText={(name) => update(draft.key, { name })}
              />
              <TextInput
                accessibilityLabel={`Item ${position} amount`}
                keyboardType="decimal-pad"
                maxLength={10}
                placeholder="0,00"
                placeholderTextColor={theme.textSecondary}
                style={[styles.input, styles.amount, { color: theme.text }]}
                value={draft.amountText}
                onChangeText={(amountText) => update(draft.key, { amountText })}
              />
              <ThemedText type="smallBold" themeColor="textSecondary">
                €
              </ThemedText>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Remove item ${position}`}
                onPress={() => remove(draft)}
                style={({ pressed }) => [styles.remove, pressed && styles.pressed]}>
                <Feather name="trash-2" size={20} color={theme.textSecondary} />
              </Pressable>
            </View>
          );
        })}
      </ThemedView>

      <View style={styles.total}>
        <ThemedText type="smallBold" style={{ color: BUCKET_COLORS.fixed }}>
          Total
        </ThemedText>
        <ThemedText type="heading" style={{ color: BUCKET_COLORS.fixed }}>
          {formatEuros(total)}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  title: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: MIN_TOUCH,
    paddingLeft: Spacing.one,
  },
  list: {
    borderRadius: Radius.card,
    paddingLeft: Spacing.three,
    paddingRight: Spacing.one,
    paddingVertical: Spacing.two,
  },
  empty: {
    paddingVertical: Spacing.two,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.two,
    minHeight: 62,
  },
  input: {
    fontSize: 15,
    minHeight: MIN_TOUCH,
    padding: 0,
  },
  name: {
    flex: 1,
    fontFamily: FontFamily.semiBold,
  },
  amount: {
    fontFamily: FontFamily.semiBold,
    fontVariant: ['tabular-nums'],
    flexShrink: 0,
    minWidth: 68,
    textAlign: 'right',
  },
  remove: {
    alignItems: 'center',
    height: MIN_TOUCH,
    justifyContent: 'center',
    width: MIN_TOUCH,
  },
  total: {
    alignItems: 'center',
    backgroundColor: BUCKET_TINTS.fixed,
    borderRadius: Radius.card,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 64,
    paddingHorizontal: Spacing.three,
  },
  pressed: {
    opacity: 0.6,
  },
});

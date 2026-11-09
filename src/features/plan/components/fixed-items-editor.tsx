import { Feather } from '@react-native-vector-icons/feather';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { isBlankDraft, type ItemDraft } from '@/features/plan/plan-form';
import { MAX_ITEM_NAME_LENGTH } from '@/features/plan/rules';
import { FontFamily, Accent, MIN_TOUCH, Spacing } from '@/shared/theme/theme';
import { useTheme } from '@/shared/theme/use-theme';
import { useConfirm } from '@/shared/ui/confirm-dialog';
import { ThemedText } from '@/shared/ui/themed-text';

type FixedItemsEditorProps = {
  drafts: ItemDraft[];
  onChange: (drafts: ItemDraft[]) => void;
};

/** The list of what the user pays every month: flat rows with a name, an amount and a remove button. */
export function FixedItemsEditor({ drafts, onChange }: FixedItemsEditorProps) {
  const theme = useTheme();
  const { dialog, ask } = useConfirm();

  function update(key: number, change: Partial<ItemDraft>) {
    onChange(drafts.map((draft) => (draft.key === key ? { ...draft, ...change } : draft)));
  }

  function add() {
    const key = Math.max(0, ...drafts.map((draft) => draft.key)) + 1;
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
    <View>
      {dialog}
      {drafts.map((draft, index) => {
        const position = index + 1;
        return (
          <View key={draft.key} style={[styles.item, { borderBottomColor: theme.backgroundSelected }]}>
            <View style={styles.row}>
              <TextInput
                accessibilityLabel={`Item ${position} name`}
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
                maxLength={12}
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
          </View>
        );
      })}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Add fixed expense"
        onPress={add}
        style={({ pressed }) => [styles.add, pressed && styles.pressed]}>
        <Feather name="plus" size={18} color={Accent.background} />
        <ThemedText type="smallBold" style={{ color: Accent.background }}>
          Add expense
        </ThemedText>
      </Pressable>
      <ThemedText type="caption" themeColor="textSecondary">
        Use your usual amount. Divide yearly bills by 12.
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: Spacing.one,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.one,
    minHeight: MIN_TOUCH,
  },
  input: {
    fontSize: 16,
    minHeight: MIN_TOUCH,
    padding: 0,
  },
  name: {
    flex: 1,
    fontFamily: FontFamily.medium,
  },
  amount: {
    fontFamily: FontFamily.semiBold,
    fontVariant: ['tabular-nums'],
    minWidth: 72,
    textAlign: 'right',
  },
  remove: {
    alignItems: 'center',
    height: MIN_TOUCH,
    justifyContent: 'center',
    width: MIN_TOUCH,
  },
  add: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.two,
    minHeight: MIN_TOUCH,
  },
  pressed: {
    opacity: 0.6,
  },
});

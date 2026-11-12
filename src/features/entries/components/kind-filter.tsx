import { StyleSheet, View } from 'react-native';

import { hapticTick } from '@/shared/haptics';
import { KIND_LABELS, type EntryKind } from '@/shared/kinds';
import { MIN_TOUCH, Radius, Spacing } from '@/shared/theme/theme';
import { useTheme } from '@/shared/theme/use-theme';
import { PressableScale } from '@/shared/ui/pressable-scale';
import { ThemedText } from '@/shared/ui/themed-text';

/** Filter labels; expenses read as what was spent, as on the home tile. */
const FILTER_LABELS: Record<EntryKind, string> = {
  income: KIND_LABELS.income,
  expense: 'Spent',
  savings: KIND_LABELS.savings,
};

const OPTIONS: readonly (EntryKind | null)[] = [null, 'income', 'expense', 'savings'];

type KindFilterProps = {
  /** The selected kind; null is All. */
  value: EntryKind | null;
  onChange: (kind: EntryKind | null) => void;
};

/** All / Income / Spent / Savings pills above a list of entries. */
export function KindFilter({ value, onChange }: KindFilterProps) {
  const theme = useTheme();
  return (
    <View style={styles.row}>
      {OPTIONS.map((option) => {
        const selected = option === value;
        const ink = option === null ? theme.accentInk : theme.kindInk[option];
        const tint = option === null ? theme.backgroundElement : theme.kindTint[option];
        return (
          <PressableScale
            key={option ?? 'all'}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => {
              if (selected) return;
              hapticTick();
              onChange(option);
            }}
            style={[
              styles.pill,
              { backgroundColor: selected ? tint : theme.backgroundElement, borderColor: selected ? ink : 'transparent' },
            ]}>
            <ThemedText type="smallBold" style={selected ? { color: ink } : undefined}>
              {option === null ? 'All' : FILTER_LABELS[option]}
            </ThemedText>
          </PressableScale>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  pill: {
    borderRadius: Radius.full,
    borderWidth: 1.5,
    justifyContent: 'center',
    minHeight: MIN_TOUCH,
    paddingHorizontal: Spacing.three,
  },
});

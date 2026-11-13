import { StyleSheet, View } from 'react-native';

import { hapticTick } from '@/shared/haptics';
import { KIND_LABELS, type EntryKind } from '@/shared/kinds';
import { Layout } from '@/shared/theme/theme';
import { useTheme } from '@/shared/theme/use-theme';
import { Pill } from '@/shared/ui/pill';

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
      {OPTIONS.map((option) => (
        <Pill
          key={option ?? 'all'}
          label={option === null ? 'All' : FILTER_LABELS[option]}
          selected={option === value}
          colors={
            option === null
              ? { fill: theme.backgroundElement, ink: theme.accentInk }
              : { fill: theme.kindTint[option], ink: theme.kindInk[option] }
          }
          onPress={() => {
            if (option === value) return;
            hapticTick();
            onChange(option);
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Layout.itemGap,
  },
});

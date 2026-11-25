import { StyleSheet, View } from 'react-native';

import type { Pocket } from '@/features/entries/rules';
import { hapticTick } from '@/shared/haptics';
import { Layout } from '@/shared/theme/theme';
import { useTheme } from '@/shared/theme/use-theme';
import { Pill } from '@/shared/ui/pill';

type PaidFromChoicesProps = {
  pockets: readonly Pocket[];
  /** null: paid from the month. */
  value: number | null;
  onChange: (pocketId: number | null) => void;
};

/** Where an expense is paid from: the month, or one of the pockets (specs/026-pocket-spending). */
export function PaidFromChoices({ pockets, value, onChange }: PaidFromChoicesProps) {
  const theme = useTheme();
  const options: { id: number | null; label: string }[] = [
    { id: null, label: 'This month' },
    ...pockets.map((pocket) => ({ id: pocket.id, label: pocket.name })),
  ];
  return (
    <View style={styles.pills} accessibilityRole="radiogroup" accessibilityLabel="Paid from">
      {options.map((option) => (
        <Pill
          key={option.id ?? 'month'}
          label={option.label}
          accessibilityRole="radio"
          weight="regular"
          selected={option.id === value}
          colors={
            option.id === null
              ? { fill: theme.kindTint.expense, ink: theme.kindInk.expense }
              : { fill: theme.kindTint.savings, ink: theme.kindInk.savings }
          }
          onPress={() => {
            if (option.id === value) return;
            hapticTick();
            onChange(option.id);
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Layout.itemGap,
  },
});

import { StyleSheet, View } from 'react-native';

import { MAIN_NAME, pocketLabel, type Pocket } from '@/features/entries/rules';
import { hapticTick } from '@/shared/haptics';
import { Hero, Layout, POCKET_COLORS } from '@/shared/theme/theme';
import { useTheme } from '@/shared/theme/use-theme';
import { Pill } from '@/shared/ui/pill';

type PaidFromChoicesProps = {
  pockets: readonly Pocket[];
  /** null: paid from the month. */
  value: number | null;
  onChange: (pocketId: number | null) => void;
  /** The radio group's name; the move form calls it "To". */
  label?: string;
};

/** Where an expense is paid from: the month, or one of the pockets (specs/026-pocket-spending). */
export function PaidFromChoices({ pockets, value, onChange, label = 'Paid from' }: PaidFromChoicesProps) {
  const theme = useTheme();
  const options: { id: number | null; label: string; name: string; fill: string; ink: string; ring: string }[] = [
    // "Main" is the month's money, named as on home's space selector (specs/027-spaces).
    { id: null, label: MAIN_NAME, name: MAIN_NAME, fill: theme.accent, ink: theme.onAccent, ring: Hero.ring },
    ...pockets.map((pocket) => ({
      id: pocket.id,
      label: pocketLabel(pocket),
      name: pocket.name,
      fill: POCKET_COLORS[pocket.color].base,
      ink: Hero.text,
      ring: POCKET_COLORS[pocket.color].light,
    })),
  ];
  return (
    <View style={styles.pills} accessibilityRole="radiogroup" accessibilityLabel={label}>
      {options.map((option) => (
        <Pill
          key={option.id ?? 'month'}
          label={option.label}
          accessibilityLabel={option.name}
          accessibilityRole="radio"
          weight="regular"
          selected={option.id === value}
          colors={{ fill: option.fill, ink: option.ink, ring: option.ring }}
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

import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { pocketLabel, type Pocket } from '@/features/entries/rules';
import { hapticTick } from '@/shared/haptics';
import { Hero, Layout, POCKET_COLORS } from '@/shared/theme/theme';
import { Pill } from '@/shared/ui/pill';

type PocketChoicesProps = {
  pockets: readonly Pocket[];
  value: number | null;
  onChange: (pocketId: number) => void;
  /** Offers "New pocket" after the pockets; the move form leaves it out. */
  allowNew?: boolean;
  /** The radio group's name. */
  label?: string;
};

/** Where a saving goes: one of the user's pockets, or a new one (specs/025-pockets). */
export function PocketChoices({ pockets, value, onChange, allowNew = true, label = 'Pocket' }: PocketChoicesProps) {
  return (
    <View style={styles.pills} accessibilityRole="radiogroup" accessibilityLabel={label}>
      {pockets.map((pocket) => (
        <Pill
          key={pocket.id}
          label={pocketLabel(pocket)}
          accessibilityLabel={pocket.name}
          accessibilityRole="radio"
          weight="regular"
          selected={pocket.id === value}
          colors={{ fill: POCKET_COLORS[pocket.color].base, ink: Hero.text, ring: POCKET_COLORS[pocket.color].light }}
          onPress={() => {
            if (pocket.id === value) return;
            hapticTick();
            onChange(pocket.id);
          }}
        />
      ))}
      {allowNew ? <Pill label="New pocket" icon="plus" onPress={() => router.push('/pocket-edit')} /> : null}
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

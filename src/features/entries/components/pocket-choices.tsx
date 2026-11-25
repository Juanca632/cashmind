import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import type { Pocket } from '@/features/entries/rules';
import { hapticTick } from '@/shared/haptics';
import { Layout } from '@/shared/theme/theme';
import { useTheme } from '@/shared/theme/use-theme';
import { Pill } from '@/shared/ui/pill';

type PocketChoicesProps = {
  pockets: readonly Pocket[];
  value: number | null;
  onChange: (pocketId: number) => void;
};

/** Where a saving goes: one of the user's pockets, or a new one (specs/025-pockets). */
export function PocketChoices({ pockets, value, onChange }: PocketChoicesProps) {
  const theme = useTheme();
  return (
    <View style={styles.pills} accessibilityRole="radiogroup" accessibilityLabel="Pocket">
      {pockets.map((pocket) => (
        <Pill
          key={pocket.id}
          label={pocket.name}
          accessibilityRole="radio"
          weight="regular"
          selected={pocket.id === value}
          colors={{ fill: theme.kindTint.savings, ink: theme.kindInk.savings }}
          onPress={() => {
            if (pocket.id === value) return;
            hapticTick();
            onChange(pocket.id);
          }}
        />
      ))}
      <Pill label="New pocket" icon="plus" onPress={() => router.push('/pocket-edit')} />
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

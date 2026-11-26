import { Feather } from '@react-native-vector-icons/feather';
import { StyleSheet, View } from 'react-native';

import { KIND_LABELS, type EntryKind } from '@/shared/kinds';
import { BORDER_WIDTH, elevation, IconSize, Layout, Radius } from '@/shared/theme/theme';
import { useTheme } from '@/shared/theme/use-theme';
import { KIND_ICONS } from '@/shared/ui/kind-badge';
import { PressableScale } from '@/shared/ui/pressable-scale';
import { ThemedText } from '@/shared/ui/themed-text';

type KindTileProps = {
  kind: EntryKind;
  title?: string;
  value: string;
  detail: string;
  selected: EntryKind | null;
  onSelect: (kind: EntryKind) => void;
};

/** One coloured tile per kind of entry below the hero card. Tapping it lists only those entries. */
export function KindTile({ kind, title = KIND_LABELS[kind], value, detail, selected, onSelect }: KindTileProps) {
  const theme = useTheme();
  const color = theme.kindInk[kind];
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityValue={{ text: `${value}, ${detail}` }}
      accessibilityState={{ selected: kind === selected }}
      onPress={() => onSelect(kind)}
      style={[
        styles.tile,
        // Tapped to filter the list, so they float like the other things you press.
        elevation(theme, 'raised'),
        { backgroundColor: theme.kindTint[kind], borderColor: kind === selected ? color : 'transparent' },
      ]}>
      <View style={styles.title}>
        <Feather name={KIND_ICONS[kind]} size={IconSize.small} color={color} />
        <ThemedText type="smallBold" numberOfLines={1} style={{ color }}>
          {title}
        </ThemedText>
      </View>
      <ThemedText type="tileValue" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} style={{ color }}>
        {value}
      </ThemedText>
      <ThemedText type="caption" numberOfLines={1} style={{ color }}>
        {detail}
      </ThemedText>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  tile: {
    borderRadius: Radius.card,
    borderWidth: BORDER_WIDTH,
    flex: 1,
    gap: Layout.tightGap,
    minWidth: 0,
    padding: Layout.tilePadding,
  },
  title: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Layout.tightGap,
  },
});

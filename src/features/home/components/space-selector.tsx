import { Feather } from '@react-native-vector-icons/feather';
import { router } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useMonthEntries } from '@/features/entries/hooks/use-month-entries';
import { useMoves } from '@/features/entries/hooks/use-moves';
import { usePocketEntries } from '@/features/entries/hooks/use-pocket-entries';
import { usePockets } from '@/features/entries/hooks/use-pockets';
import { MAIN_NAME, pocketBalances, pocketsTotal, type Pocket } from '@/features/entries/rules';
import { monthFigures } from '@/features/home/month-summary';
import { usePlanVersions } from '@/features/plan/hooks/use-plan-versions';
import { savingsPercentFor } from '@/features/plan/rules';
import { hapticTick } from '@/shared/haptics';
import { useMoney } from '@/shared/hooks/use-money';
import { monthKey } from '@/shared/months';
import { Hero, IconSize, Layout, POCKET_COLORS, Radius, SCRIM, Size } from '@/shared/theme/theme';
import { useTheme } from '@/shared/theme/use-theme';
import { KIND_ICONS } from '@/shared/ui/kind-badge';
import { Pill } from '@/shared/ui/pill';
import { ThemedText } from '@/shared/ui/themed-text';

type SpaceSelectorProps = {
  /** The pocket on screen; null for "Main", the month's money. */
  pocket: Pocket | null;
};


/**
 * The pill centred under home's hero card that names the space on screen ("Main" or a pocket) and
 * opens the sheet to switch spaces (specs/027-spaces), as Revolut switches accounts under the
 * balance. The month pill stays in the top row, so the two do not read alike.
 */
export function SpaceSelector({ pocket }: SpaceSelectorProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {/* The same pill as My plan; the mark holds the emoji, so the name goes alone. */}
      <View style={styles.centred}>
        <Pill
          label={pocket ? pocket.name : MAIN_NAME}
          mark={<SpaceDot pocket={pocket} size="small" />}
          trailingIcon="chevron-down"
          accessibilityLabel={`Space: ${pocket ? pocket.name : MAIN_NAME}, change`}
          onPress={() => setOpen(true)}
        />
      </View>
      {open ? <SpacesSheet current={pocket?.id ?? null} onClose={() => setOpen(false)} /> : null}
    </>
  );
}

/** A space's round mark: the month's green with a house, or the pocket's colour with its emoji. */
function SpaceDot({ pocket, size = 'large' }: { pocket: Pocket | null; size?: 'small' | 'large' }) {
  const base = pocket ? POCKET_COLORS[pocket.color].base : Hero.background;
  const small = size === 'small';
  return (
    <View style={[small ? styles.smallDot : styles.dot, { backgroundColor: base }]}>
      {pocket?.emoji ? (
        <ThemedText type="small" style={styles.emoji}>
          {pocket.emoji}
        </ThemedText>
      ) : (
        <Feather name={pocket ? KIND_ICONS.savings : 'home'} size={IconSize.small} color={Hero.text} />
      )}
    </View>
  );
}

/** Every space with its figure: pick one to show it on home, or make a new pocket. */
function SpacesSheet({ current, onClose }: { current: number | null; onClose: () => void }) {
  const theme = useTheme();
  const money = useMoney();
  const insets = useSafeAreaInsets();
  const month = monthKey(new Date());
  const pockets = usePockets();
  const pocketEntries = usePocketEntries();
  const moves = useMoves();
  const monthEntries = useMonthEntries(month);
  const plan = usePlanVersions();

  const balances =
    pockets.status === 'ready' && pocketEntries.status === 'ready' && moves.status === 'ready'
      ? pocketBalances(pockets.data, pocketEntries.data, moves.data)
      : [];
  const summary =
    monthEntries.status === 'ready' && plan.status === 'ready' && moves.status === 'ready'
      ? monthFigures(monthEntries.data, moves.data, savingsPercentFor(plan.data, month), month)
      : null;

  function pick(pocketId: number | null) {
    hapticTick();
    onClose();
    if (pocketId !== current) router.setParams({ space: pocketId === null ? '' : String(pocketId) });
  }

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent navigationBarTranslucent onRequestClose={onClose}>
      <View style={styles.bottom}>
        <Pressable accessible={false} testID="spaces-sheet-backdrop" onPress={onClose} style={[StyleSheet.absoluteFill, styles.scrim]} />
        <View
          testID="spaces-sheet"
          accessibilityViewIsModal
          style={[styles.sheet, { backgroundColor: theme.background, paddingBottom: insets.bottom + Layout.sectionGap }]}>
          <ThemedText type="heading" accessibilityRole="header">
            Spaces
          </ThemedText>
          <ScrollView contentContainerStyle={styles.rows} accessibilityRole="radiogroup">
            <SpaceRow
              pocket={null}
              name={MAIN_NAME}
              figure={summary && summary.income > 0 ? money.format(summary.left) : null}
              negative={summary !== null && summary.income > 0 && summary.left < 0}
              selected={current === null}
              onPress={() => pick(null)}
            />
            {balances.map(({ pocket, cents }) => (
              <SpaceRow
                key={pocket.id}
                pocket={pocket}
                name={pocket.name}
                figure={money.format(cents)}
                negative={cents < 0}
                selected={current === pocket.id}
                onPress={() => pick(pocket.id)}
              />
            ))}
          </ScrollView>
          {balances.length > 0 ? (
            <ThemedText type="small" themeColor="textSecondary">
              In pockets {money.format(pocketsTotal(balances))}
            </ThemedText>
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="New pocket"
            onPress={() => {
              onClose();
              router.push({ pathname: '/pocket-edit', params: { show: '1' } });
            }}
            style={({ pressed }) => [styles.row, pressed && { backgroundColor: theme.pressed }]}>
            <View style={[styles.dot, { backgroundColor: theme.backgroundElement }]}>
              <Feather name="plus" size={IconSize.small} color={theme.text} />
            </View>
            <ThemedText type="smallBold" style={styles.name}>
              New pocket
            </ThemedText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

type SpaceRowProps = {
  pocket: Pocket | null;
  name: string;
  figure: string | null;
  negative: boolean;
  selected: boolean;
  onPress: () => void;
};

function SpaceRow({ pocket, name, figure, negative, selected, onPress }: SpaceRowProps) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={figure ? `${pocket ? pocket.name : name}, ${figure}` : name}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        selected && { backgroundColor: theme.backgroundElement },
        pressed && { backgroundColor: theme.pressed },
      ]}>
      <SpaceDot pocket={pocket} />
      <ThemedText type="smallBold" numberOfLines={1} style={styles.name}>
        {name}
      </ThemedText>
      {figure ? (
        <ThemedText type="smallBold" style={negative ? { color: theme.error } : { color: theme.textSecondary }}>
          {figure}
        </ThemedText>
      ) : null}
      {selected ? <Feather name="check" size={IconSize.medium} color={theme.accentInk} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  name: {
    flexShrink: 1,
  },
  dot: {
    alignItems: 'center',
    borderRadius: Radius.full,
    height: Size.pill,
    justifyContent: 'center',
    width: Size.pill,
  },
  centred: {
    alignItems: 'center',
  },
  smallDot: {
    alignItems: 'center',
    borderRadius: Radius.full,
    height: Size.pillMark,
    justifyContent: 'center',
    width: Size.pillMark,
  },
  emoji: {
    textAlign: 'center',
  },
  bottom: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  scrim: {
    backgroundColor: SCRIM,
  },
  sheet: {
    borderTopLeftRadius: Radius.dialog,
    borderTopRightRadius: Radius.dialog,
    gap: Layout.itemGap,
    maxHeight: '80%',
    paddingHorizontal: Layout.screenPadding,
    paddingTop: Layout.dialogPadding,
  },
  rows: {
    gap: Layout.tightGap,
  },
  row: {
    alignItems: 'center',
    borderRadius: Radius.field,
    flexDirection: 'row',
    gap: Layout.rowGap,
    minHeight: Size.row,
    paddingHorizontal: Layout.itemGap,
  },
});

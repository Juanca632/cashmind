import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';

import { CategorySplit } from '@/features/entries/components/category-split';
import { EntryList } from '@/features/entries/components/entry-list';
import { useMoves } from '@/features/entries/hooks/use-moves';
import { usePocketEntries } from '@/features/entries/hooks/use-pocket-entries';
import { categorySplit, entriesOfKind, mergeByDate, pocketBalances, pocketMoveLines, type Pocket } from '@/features/entries/rules';
import { SpaceSelector } from '@/features/home/components/space-selector';
import { useMoney } from '@/shared/hooks/use-money';
import { useToday } from '@/shared/hooks/use-today';
import type { EntryKind } from '@/shared/kinds';
import { Layout, POCKET_COLORS, Size } from '@/shared/theme/theme';
import { Card } from '@/shared/ui/card';
import { DataError } from '@/shared/ui/data-error';
import { HeroCard } from '@/shared/ui/hero-card';
import { HeroFigure } from '@/shared/ui/hero-figure';
import { IconButton } from '@/shared/ui/icon-button';
import { KindTile } from '@/shared/ui/kind-tile';
import { RoundAction } from '@/shared/ui/round-action';
import { ScreenScroll } from '@/shared/ui/screen-scroll';
import { ThemedText } from '@/shared/ui/themed-text';
import { ThemedView } from '@/shared/ui/themed-view';

const EMPTY = 'Nothing saved in or spent from this pocket yet.';

/**
 * Home showing one pocket (specs/027-spaces): the same hero, tiles and activity card as the month,
 * in the pocket's colour, over every month's savings and expenses paid from it.
 */
export function PocketSpace({ pocket }: { pocket: Pocket }) {
  const money = useMoney();
  const today = useToday();
  const entries = usePocketEntries();
  const moves = useMoves();
  // Which kind the list shows; null shows both.
  const [selected, setSelected] = useState<EntryKind | null>(null);

  // Android back returns to "Main" (the month) instead of leaving the app; only while home is on screen,
  // so back still closes a form opened from here.
  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        router.setParams({ space: '' });
        return true;
      });
      return () => subscription.remove();
    }, []),
  );

  if (entries.status === 'error' || moves.status === 'error') return <DataError topInset />;
  if (entries.status === 'loading' || moves.status === 'loading') return <ThemedView style={styles.screen} />;

  const own = entries.data.filter((entry) => entry.pocketId === pocket.id);
  const ownMoves = pocketMoveLines(moves.data, pocket.id);
  const [{ cents, savedCents, spentCents }] = pocketBalances([pocket], own, moves.data);
  const overdrawn = cents < 0;
  const tone = POCKET_COLORS[pocket.color];
  const detail = overdrawn
    ? `This pocket is ${money.format(-cents)} short.`
    : pocket.startingCents > 0
      ? `Started with ${money.format(pocket.startingCents)}`
      : null;
  // Moves show in the whole list; the Saved and Spent tiles stay savings and expenses (specs/028-move-money).
  const listed = mergeByDate(entriesOfKind(own, selected), selected === null ? ownMoves : []);
  const split = selected === 'expense' ? categorySplit(own, 'expense') : [];
  const toggle = (kind: EntryKind) => setSelected((current) => (current === kind ? null : kind));

  return (
    <ThemedView style={styles.screen}>
      <ScreenScroll topInset>
        <View style={styles.topRow}>
          <View style={styles.topActions}>
            <IconButton
              icon="edit-2"
              accessibilityLabel={`Edit ${pocket.name}`}
              onPress={() => router.push({ pathname: '/pocket-edit', params: { id: String(pocket.id) } })}
            />
            <IconButton icon="settings" accessibilityLabel="Settings" onPress={() => router.push('/settings')} />
          </View>
        </View>

        <HeroCard overspent={overdrawn} tone={tone}>
          <HeroFigure label="Balance" cents={cents} countKey={`pocket:${pocket.id}`} detail={detail} />
        </HeroCard>
        <SpaceSelector pocket={pocket} />

        {/* Neutral round actions, as banking apps put them under a balance. */}
        <View style={styles.actions}>
          <RoundAction
            label="Save"
            accessibilityLabel="Save into"
            icon="plus"
            onPress={() => router.push({ pathname: '/entry', params: { kind: 'savings', pocket: String(pocket.id) } })}
          />
          <RoundAction
            label="Spend"
            accessibilityLabel="Spend from"
            icon="minus"
            onPress={() => router.push({ pathname: '/entry', params: { kind: 'expense', pocket: String(pocket.id) } })}
          />
          <RoundAction
            label="Move"
            icon="shuffle"
            onPress={() => router.push({ pathname: '/move', params: { from: String(pocket.id) } })}
          />
        </View>

        <View style={styles.section}>
          <ThemedText type="smallBold" themeColor="textSecondary">
            Overview
          </ThemedText>
          <View style={styles.tiles}>
            <KindTile kind="savings" title="Saved" value={money.formatCompact(savedCents)} detail="into it" selected={selected} onSelect={toggle} />
            <KindTile kind="expense" title="Spent" value={money.formatCompact(spentCents)} detail="from it" selected={selected} onSelect={toggle} />
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText type="smallBold" themeColor="textSecondary">
            {selected === 'savings' ? 'Saved' : selected === 'expense' ? 'Spent' : 'Activity'}
          </ThemedText>
          {split.length > 0 ? <CategorySplit kind="expense" shares={split} /> : null}
          <Card style={styles.activity}>
            <EntryList
              items={listed}
              today={today}
              emptyText={EMPTY}
              onPress={(entry) => router.push({ pathname: '/entry', params: { id: String(entry.id) } })}
              onPressMove={(line) => router.push({ pathname: '/move', params: { id: String(line.move.id) } })}
            />
          </Card>
        </View>
      </ScreenScroll>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Layout.itemGap,
    // A pocket has no month pill or plan: only its edit button and the gear, on the right.
    justifyContent: 'flex-end',
  },
  topActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Layout.tightGap,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
  section: {
    gap: Layout.itemGap,
    minHeight: Size.pill,
  },
  tiles: {
    flexDirection: 'row',
    gap: Layout.itemGap,
  },
  activity: {
    gap: 0,
    paddingVertical: Layout.itemGap,
  },
});

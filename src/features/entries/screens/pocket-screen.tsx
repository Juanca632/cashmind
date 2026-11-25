import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useCallback } from 'react';
import { FlatList, StyleSheet, View, type ListRenderItem } from 'react-native';

import { CategorySplit } from '@/features/entries/components/category-split';
import { EntryRow } from '@/features/entries/components/entry-list';
import { usePocket } from '@/features/entries/hooks/use-pocket';
import { usePocketEntries } from '@/features/entries/hooks/use-pocket-entries';
import { categorySplit, pocketBalances, type CategoryShare, type Entry, type Pocket } from '@/features/entries/rules';
import { useMoney } from '@/shared/hooks/use-money';
import { useToday } from '@/shared/hooks/use-today';
import { Layout } from '@/shared/theme/theme';
import { useTheme } from '@/shared/theme/use-theme';
import { Button } from '@/shared/ui/button';
import { DataError } from '@/shared/ui/data-error';
import { EdgeFades } from '@/shared/ui/edge-fades';
import { LinkButton } from '@/shared/ui/link-button';
import { MessageScreen } from '@/shared/ui/message-screen';
import { useScreenContent } from '@/shared/ui/screen-scroll';
import { ThemedText } from '@/shared/ui/themed-text';
import { ThemedView } from '@/shared/ui/themed-view';

const POCKET_GONE = 'This pocket no longer exists.';

/** One pocket: its balance, what it started with and its savings, newest first (specs/025-pockets). */
export default function PocketScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) return <MessageScreen title={POCKET_GONE} />;
  return <PocketLoader id={id} />;
}

function PocketLoader({ id }: { id: number }) {
  const loaded = usePocket(id);
  const savings = usePocketEntries();
  if (loaded.status === 'error' || savings.status === 'error') return <DataError />;
  if (loaded.status === 'loading' || savings.status === 'loading') return <ThemedView style={styles.screen} />;
  if (loaded.data === null) return <MessageScreen title={POCKET_GONE} />;
  return <PocketDetail pocket={loaded.data.pocket} savings={savings.data} />;
}

function PocketDetail({ pocket, savings }: { pocket: Pocket; savings: Entry[] }) {
  const content = useScreenContent();
  const today = useToday();

  const openEntry = useCallback((entry: Entry) => router.push({ pathname: '/entry', params: { id: String(entry.id) } }), []);
  const renderItem = useCallback<ListRenderItem<Entry>>(
    ({ item }) => <EntryRow entry={item} today={today} onPress={openEntry} />,
    [today, openEntry],
  );

  // Savings and expenses paid from this pocket, newest first (specs/026-pocket-spending).
  const entries = savings.filter((entry) => entry.pocketId === pocket.id);
  const [{ cents, savedCents, spentCents }] = pocketBalances([pocket], entries);
  const spentSplit = categorySplit(entries, 'expense');
  return (
    <ThemedView style={styles.screen}>
      <Stack.Screen options={{ title: pocket.name }} />
      <FlatList
        data={entries}
        keyExtractor={keyOf}
        renderItem={renderItem}
        ListHeaderComponent={
          <PocketHeader pocket={pocket} cents={cents} savedCents={savedCents} spentCents={spentCents} spentSplit={spentSplit} />
        }
        ListEmptyComponent={
          <ThemedText themeColor="textSecondary" style={styles.empty}>
            Nothing saved in this pocket yet.
          </ThemedText>
        }
        contentContainerStyle={[content, styles.list]}
      />
      <EdgeFades />
    </ThemedView>
  );
}

type PocketHeaderProps = {
  pocket: Pocket;
  cents: number;
  savedCents: number;
  spentCents: number;
  spentSplit: CategoryShare[];
};

/** The pocket's balance, what went in and out, how to spend from it, and its spending by category. */
function PocketHeader({ pocket, cents, savedCents, spentCents, spentSplit }: PocketHeaderProps) {
  const theme = useTheme();
  const money = useMoney();
  return (
    <View style={styles.top}>
      <View style={styles.header}>
        <View style={styles.balance}>
          <ThemedText themeColor="textSecondary">Balance</ThemedText>
          <ThemedText type="heading" style={cents < 0 ? { color: theme.error } : undefined}>
            {money.format(cents)}
          </ThemedText>
          {cents < 0 ? (
            <ThemedText type="small" style={{ color: theme.error }}>
              This pocket is {money.format(-cents)} short.
            </ThemedText>
          ) : null}
          {pocket.startingCents > 0 ? (
            <ThemedText type="small" themeColor="textSecondary">
              Started with {money.format(pocket.startingCents)}
            </ThemedText>
          ) : null}
          {spentCents > 0 ? (
            <ThemedText type="small" themeColor="textSecondary">
              Saved {money.format(savedCents)} · Spent {money.format(spentCents)}
            </ThemedText>
          ) : null}
        </View>
        <LinkButton
          label="Edit"
          accessibilityLabel={`Edit ${pocket.name}`}
          onPress={() => router.push({ pathname: '/pocket-edit', params: { id: String(pocket.id) } })}
        />
      </View>
      <Button
        label="Spend from this pocket"
        icon="shopping-bag"
        variant="secondary"
        onPress={() => router.push({ pathname: '/entry', params: { kind: 'expense', pocket: String(pocket.id) } })}
      />
      {spentSplit.length > 0 ? <CategorySplit kind="expense" shares={spentSplit} title="Spent by category" /> : null}
    </View>
  );
}

function keyOf(entry: Entry): string {
  return String(entry.id);
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  list: {
    paddingTop: Layout.itemGap,
  },
  top: {
    gap: Layout.sectionGap,
    marginBottom: Layout.sectionGap,
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: Layout.itemGap,
    justifyContent: 'space-between',
  },
  balance: {
    flexShrink: 1,
    gap: Layout.tightGap,
  },
  empty: {
    paddingVertical: Layout.itemGap,
  },
});

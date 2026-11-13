import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, StyleSheet, type ListRenderItem } from 'react-native';

import { EntryRow } from '@/features/entries/components/entry-list';
import { KindFilter } from '@/features/entries/components/kind-filter';
import { useMonthEntries } from '@/features/entries/hooks/use-month-entries';
import { EMPTY_KIND_TEXTS, entriesOfKind, isEntryKind, type Entry } from '@/features/entries/rules';
import { useToday } from '@/shared/hooks/use-today';
import type { EntryKind } from '@/shared/kinds';
import { formatMonth, isValidMonthKey, monthKey } from '@/shared/months';
import { Layout } from '@/shared/theme/theme';
import { EdgeFades } from '@/shared/ui/edge-fades';
import { useScreenContent } from '@/shared/ui/screen-scroll';
import { DataError } from '@/shared/ui/data-error';
import { ThemedText } from '@/shared/ui/themed-text';
import { ThemedView } from '@/shared/ui/themed-view';

/** The whole month's entries, with a filter by kind. */
export default function ActivityScreen() {
  const content = useScreenContent();
  const today = useToday();
  const params = useLocalSearchParams<{ month?: string; kind?: string }>();
  const currentMonth = monthKey(today);
  // Invalid or future months fall back to the current month, as on home.
  const month = isValidMonthKey(params.month) && params.month <= currentMonth ? params.month : currentMonth;
  const [kind, setKind] = useState<EntryKind | null>(isEntryKind(params.kind) ? params.kind : null);
  const entries = useMonthEntries(month);

  const openEntry = useCallback((entry: Entry) => router.push({ pathname: '/entry', params: { id: String(entry.id) } }), []);
  const renderItem = useCallback<ListRenderItem<Entry>>(
    ({ item }) => <EntryRow entry={item} today={today} onPress={openEntry} />,
    [today, openEntry],
  );

  const title = <Stack.Screen options={{ title: `Activity · ${formatMonth(month)}` }} />;
  if (entries.status === 'error') return <DataError />;
  if (entries.status === 'loading') return <ThemedView style={styles.screen}>{title}</ThemedView>;

  return (
    <ThemedView style={styles.screen}>
      {title}
      <FlatList
        data={entriesOfKind(entries.data, kind)}
        keyExtractor={keyOf}
        renderItem={renderItem}
        ListHeaderComponent={<KindFilter value={kind} onChange={setKind} />}
        ListHeaderComponentStyle={styles.header}
        ListEmptyComponent={
          <ThemedText themeColor="textSecondary" style={styles.empty}>
            {kind ? EMPTY_KIND_TEXTS[kind] : 'Nothing was recorded this month.'}
          </ThemedText>
        }
        contentContainerStyle={[content, styles.list]}
      />
      <EdgeFades />
    </ThemedView>
  );
}

function keyOf(entry: Entry): string {
  return String(entry.id);
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  /** The filters sit close under the header, so more of the list shows. */
  list: {
    paddingTop: Layout.itemGap,
  },
  header: {
    marginBottom: Layout.itemGap,
  },
  empty: {
    paddingVertical: Layout.itemGap,
  },
});

import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { usePockets } from '@/features/entries/hooks/use-pockets';
import { useSavingsEntries } from '@/features/entries/hooks/use-savings-entries';
import { pocketBalances, pocketsTotal } from '@/features/entries/rules';
import { useMoney } from '@/shared/hooks/use-money';
import { Layout, Radius, Size } from '@/shared/theme/theme';
import { useTheme } from '@/shared/theme/use-theme';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { DataError } from '@/shared/ui/data-error';
import { KindBadge } from '@/shared/ui/kind-badge';
import { ScreenScroll } from '@/shared/ui/screen-scroll';
import { ThemedText } from '@/shared/ui/themed-text';
import { ThemedView } from '@/shared/ui/themed-view';

/** Every pocket with what it holds: its starting amount plus its savings (specs/025-pockets). */
export default function PocketsScreen() {
  const theme = useTheme();
  const money = useMoney();
  const pockets = usePockets();
  const savings = useSavingsEntries();
  if (pockets.status === 'error' || savings.status === 'error') return <DataError />;
  if (pockets.status === 'loading' || savings.status === 'loading') return <ThemedView style={styles.screen} />;

  const balances = pocketBalances(pockets.data, savings.data);
  return (
    <ThemedView style={styles.screen}>
      <ScreenScroll spacing="loose">
        <View style={styles.total}>
          <ThemedText themeColor="textSecondary">Total saved</ThemedText>
          <ThemedText type="heading">{money.format(pocketsTotal(balances))}</ThemedText>
        </View>
        {balances.length === 0 ? (
          <ThemedText themeColor="textSecondary">No pockets yet. Make one for each thing you save for.</ThemedText>
        ) : (
          <Card>
            {balances.map(({ pocket, cents }) => {
              const balance = money.format(cents);
              return (
                <Pressable
                  key={pocket.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${pocket.name}, ${balance}`}
                  onPress={() => router.push({ pathname: '/pocket', params: { id: String(pocket.id) } })}
                  style={({ pressed }) => [styles.row, pressed && { backgroundColor: theme.pressed }]}>
                  <KindBadge kind="savings" />
                  <ThemedText type="smallBold" numberOfLines={1} style={styles.name}>
                    {pocket.name}
                  </ThemedText>
                  <ThemedText type="smallBold" style={{ color: theme.kindInk.savings }}>
                    {balance}
                  </ThemedText>
                </Pressable>
              );
            })}
          </Card>
        )}
        <Button label="New pocket" icon="plus" variant="secondary" onPress={() => router.push('/pocket-edit')} />
      </ScreenScroll>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  total: {
    gap: Layout.tightGap,
  },
  row: {
    alignItems: 'center',
    borderRadius: Radius.field,
    flexDirection: 'row',
    gap: Layout.rowGap,
    marginHorizontal: -Layout.itemGap,
    minHeight: Size.row,
    paddingHorizontal: Layout.itemGap,
  },
  name: {
    flex: 1,
  },
});

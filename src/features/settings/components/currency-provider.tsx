import { createContext, useContext, useState, type ReactNode } from 'react';
import { StyleSheet } from 'react-native';

import { useCurrencySetting } from '@/features/settings/hooks/use-currency-setting';
import { MoneyContext } from '@/shared/hooks/use-money';
import { moneyFor, type Currency } from '@/shared/money';
import { ThemedView } from '@/shared/ui/themed-view';

const SetCurrencyContext = createContext<(currency: Currency) => void>(() => {});

/** Lets the Settings screen apply a newly saved currency to the whole app at once. */
export function useSetCurrency(): (currency: Currency) => void {
  return useContext(SetCurrencyContext);
}

/**
 * Gives every screen the currency chosen in Settings (specs/024-currency). Nothing renders until it
 * is read, so amounts never flash in the wrong currency.
 */
export function CurrencyProvider({ children }: { children: ReactNode }) {
  const stored = useCurrencySetting();
  const [picked, setPicked] = useState<Currency | null>(null);
  const currency = picked ?? stored;
  if (currency === null) return <ThemedView style={styles.fill} />;
  return (
    <SetCurrencyContext.Provider value={setPicked}>
      <MoneyContext.Provider value={moneyFor(currency)}>{children}</MoneyContext.Provider>
    </SetCurrencyContext.Provider>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
});

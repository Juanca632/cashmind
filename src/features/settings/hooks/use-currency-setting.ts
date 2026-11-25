import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';

import { getCurrency } from '@/features/settings/repository';
import type { Currency } from '@/shared/money';

/** The stored currency, read once when the app starts; null while loading. Unreadable means euro. */
export function useCurrencySetting(): Currency | null {
  const db = useSQLiteContext();
  const [currency, setCurrency] = useState<Currency | null>(null);
  useEffect(() => {
    let active = true;
    getCurrency(db)
      .catch((): Currency => 'EUR')
      .then((value) => {
        if (active) setCurrency(value);
      });
    return () => {
      active = false;
    };
  }, [db]);
  return currency;
}

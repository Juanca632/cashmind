import { createContext, useContext } from 'react';

import { moneyFor, type Money } from '@/shared/money';

/** The currency chosen in Settings (euro until one is chosen), provided by the root layout. */
export const MoneyContext = createContext<Money>(moneyFor('EUR'));

export function useMoney(): Money {
  return useContext(MoneyContext);
}

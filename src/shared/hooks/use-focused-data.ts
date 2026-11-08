import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

export type Loadable<T> = { status: 'loading' } | { status: 'error' } | { status: 'ready'; data: T };

/**
 * Loads data every time the screen gets focus. `load` must be stable (useCallback).
 * While a new `key` loads, the previous key's data is not shown.
 */
export function useFocusedData<T>(key: string, load: () => Promise<T>): Loadable<T> {
  const [loaded, setLoaded] = useState<{ key: string; state: Loadable<T> } | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      load().then(
        (data) => {
          if (active) setLoaded({ key, state: { status: 'ready', data } });
        },
        () => {
          if (active) setLoaded({ key, state: { status: 'error' } });
        },
      );
      return () => {
        active = false;
      };
    }, [key, load]),
  );

  return loaded?.key === key ? loaded.state : { status: 'loading' };
}

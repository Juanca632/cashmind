import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

/** Today's date, refreshed when the app returns to the foreground so a new month is never missed. */
export function useToday(): Date {
  const [today, setToday] = useState(() => new Date());

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') setToday(new Date());
    });
    return () => subscription.remove();
  }, []);

  return today;
}

import { useColorScheme } from 'react-native';

import { DARK, LIGHT, type Theme } from '@/shared/theme/theme';

/** The colors of the phone's current theme, light or dark. Updates when the phone switches. */
export function useTheme(): Theme {
  return useColorScheme() === 'dark' ? DARK : LIGHT;
}

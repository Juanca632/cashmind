import { useColorScheme } from 'react-native';

import { DARK, LIGHT, type Theme } from '@/shared/theme/theme';

/** True when the phone uses its dark theme. Updates when the phone switches. */
export function useIsDark(): boolean {
  return useColorScheme() === 'dark';
}

/** The colors of the phone's current theme, light or dark. */
export function useTheme(): Theme {
  return useIsDark() ? DARK : LIGHT;
}

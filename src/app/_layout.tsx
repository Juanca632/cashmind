import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  useFonts,
} from '@expo-google-fonts/manrope';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SQLiteProvider } from 'expo-sqlite';
import { useEffect } from 'react';

import { DatabaseBoundary } from '@/db/database-boundary';
import { DATABASE_NAME, migrateDbIfNeeded } from '@/db/database';
import { AppLock } from '@/features/settings/components/app-lock';
import { CurrencyProvider } from '@/features/settings/components/currency-provider';
import { useIsDark, useTheme } from '@/shared/theme/use-theme';

// Keeps the splash up until the fonts settle, so text never flashes in another font.
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const theme = useTheme();
  const dark = useIsDark();
  const [fontsLoaded, fontError] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
  });
  const fontsSettled = fontsLoaded || fontError !== null;

  useEffect(() => {
    if (fontsSettled) SplashScreen.hideAsync().catch(() => {});
  }, [fontsSettled]);

  if (!fontsSettled) return null;

  return (
    <DatabaseBoundary>
      <SQLiteProvider databaseName={DATABASE_NAME} onInit={migrateDbIfNeeded}>
        <ThemeProvider value={dark ? DarkTheme : DefaultTheme}>
          <CurrencyProvider>
            <AppLock>
              <Stack
                screenOptions={{
                  contentStyle: { backgroundColor: theme.background },
                  headerShadowVisible: false,
                  headerStyle: { backgroundColor: theme.background },
                  statusBarStyle: dark ? 'light' : 'dark',
                }}>
                <Stack.Screen name="index" options={{ headerShown: false, title: 'CashMind' }} />
                <Stack.Screen name="plan" options={{ title: 'My plan' }} />
                <Stack.Screen name="month-picker" options={{ title: 'Pick a month' }} />
                <Stack.Screen name="entry" options={{ title: 'Entry' }} />
                <Stack.Screen name="activity" options={{ title: 'Activity' }} />
                <Stack.Screen name="recurring" options={{ title: 'Every month' }} />
                <Stack.Screen name="trends" options={{ title: 'Trends' }} />
                <Stack.Screen name="trend-category" options={{ title: 'Category' }} />
                <Stack.Screen name="settings" options={{ title: 'Settings' }} />
                <Stack.Screen name="pocket-edit" options={{ title: 'Pocket' }} />
                <Stack.Screen name="move" options={{ title: 'Move money' }} />
              </Stack>
            </AppLock>
          </CurrencyProvider>
        </ThemeProvider>
      </SQLiteProvider>
    </DatabaseBoundary>
  );
}

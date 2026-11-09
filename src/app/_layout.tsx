import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  useFonts,
} from '@expo-google-fonts/manrope';
import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SQLiteProvider } from 'expo-sqlite';
import { useEffect } from 'react';

import { DatabaseBoundary } from '@/db/database-boundary';
import { DATABASE_NAME, migrateDbIfNeeded } from '@/db/database';
import { Colors } from '@/shared/theme/theme';

// Keeps the splash up until the fonts settle, so text never flashes in another font.
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
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
        <ThemeProvider value={DefaultTheme}>
          <Stack
            screenOptions={{
              contentStyle: { backgroundColor: Colors.background },
              headerShadowVisible: false,
              headerStyle: { backgroundColor: Colors.background },
              statusBarStyle: 'dark',
            }}>
            <Stack.Screen name="index" options={{ headerShown: false, title: 'cashmind' }} />
            <Stack.Screen name="plan" options={{ title: 'Monthly plan' }} />
            <Stack.Screen name="month-income" options={{ title: "This month's income" }} />
            <Stack.Screen name="month-picker" options={{ title: 'Pick a month' }} />
            <Stack.Screen name="expense" options={{ title: 'Expense' }} />
          </Stack>
        </ThemeProvider>
      </SQLiteProvider>
    </DatabaseBoundary>
  );
}

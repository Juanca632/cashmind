import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { useColorScheme } from 'react-native';

import { DATABASE_NAME, migrateDbIfNeeded } from '@/data/database';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <SQLiteProvider databaseName={DATABASE_NAME} onInit={migrateDbIfNeeded}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="index" options={{ title: 'cashmind' }} />
          <Stack.Screen name="plan" options={{ title: 'Monthly plan' }} />
          <Stack.Screen name="month-income" options={{ title: "This month's income" }} />
        </Stack>
      </ThemeProvider>
    </SQLiteProvider>
  );
}

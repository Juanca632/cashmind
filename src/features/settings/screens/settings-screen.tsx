import Constants from 'expo-constants';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { authenticate } from '@/features/settings/device-auth';
import { useAppLockSetting, type AppLockSetting } from '@/features/settings/hooks/use-app-lock-setting';
import { setAppLock } from '@/features/settings/service';
import { Layout } from '@/shared/theme/theme';
import { DataError } from '@/shared/ui/data-error';
import { ErrorText } from '@/shared/ui/error-text';
import { ScreenScroll } from '@/shared/ui/screen-scroll';
import { SwitchRow } from '@/shared/ui/switch-row';
import { ThemedText } from '@/shared/ui/themed-text';
import { ThemedView } from '@/shared/ui/themed-view';

const NO_PHONE_LOCK = 'Set up a screen lock on your phone to use this.';

/** App options: the app lock and the installed version (specs/023-settings-app-lock). */
export default function SettingsScreen() {
  const setting = useAppLockSetting();
  if (setting.status === 'error') return <DataError />;
  if (setting.status === 'loading') return <ThemedView style={styles.screen} />;
  return <SettingsList initial={setting.data} />;
}

function SettingsList({ initial }: { initial: AppLockSetting }) {
  const db = useSQLiteContext();
  const [enabled, setEnabled] = useState(initial.enabled);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Changing the lock in either direction first asks the phone to confirm its owner.
  const change = async (next: boolean) => {
    setBusy(true);
    setError(null);
    if ((await authenticate()) === 'ok') {
      const result = await setAppLock(db, next);
      if (result.ok) setEnabled(next);
      else setError(result.message);
    }
    setBusy(false);
  };

  return (
    <ThemedView style={styles.screen}>
      <ScreenScroll spacing="loose">
        <View style={styles.section}>
          <ThemedText type="heading">Security</ThemedText>
          <SwitchRow
            label="Lock with fingerprint"
            value={initial.deviceLock && enabled}
            disabled={!initial.deviceLock || busy}
            onValueChange={(next) => void change(next)}
          />
          {initial.deviceLock ? null : (
            <ThemedText type="small" themeColor="textSecondary">
              {NO_PHONE_LOCK}
            </ThemedText>
          )}
          {error ? <ErrorText>{error}</ErrorText> : null}
        </View>

        <View style={styles.section}>
          <ThemedText type="heading">About</ThemedText>
          <ThemedText themeColor="textSecondary">Version {Constants.expoConfig?.version ?? ''}</ThemedText>
        </View>
      </ScreenScroll>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  section: {
    gap: Layout.itemGap,
  },
});

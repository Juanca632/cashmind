import Constants from 'expo-constants';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useSetCurrency } from '@/features/settings/components/currency-provider';
import { authenticate } from '@/features/settings/device-auth';
import { useAppLockSetting, type AppLockSetting } from '@/features/settings/hooks/use-app-lock-setting';
import { setAppLock, setCurrency } from '@/features/settings/service';
import { hapticTick } from '@/shared/haptics';
import { useMoney } from '@/shared/hooks/use-money';
import { CURRENCIES, CURRENCY_NAMES, type Currency } from '@/shared/money';
import { Hero, Layout, Radius, Size } from '@/shared/theme/theme';
import { useTheme } from '@/shared/theme/use-theme';
import { DataError } from '@/shared/ui/data-error';
import { useConfirm } from '@/shared/ui/confirm-dialog';
import { ErrorText } from '@/shared/ui/error-text';
import { Pill } from '@/shared/ui/pill';
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

        <CurrencySection />

        <AboutSection />
      </ScreenScroll>
    </ThemedView>
  );
}

/** The app and its installed version, in a row shaped like the Security switch. */
function AboutSection() {
  const theme = useTheme();
  return (
    <View style={styles.section}>
      <ThemedText type="heading">About</ThemedText>
      <View style={[styles.infoRow, { backgroundColor: theme.backgroundElement }]}>
        <ThemedText>CashMind</ThemedText>
        <ThemedText themeColor="textSecondary">Version {Constants.expoConfig?.version ?? ''}</ThemedText>
      </View>
    </View>
  );
}

/** The app's one currency (specs/024-currency). Picking one applies at once; nothing is converted. */
function CurrencySection() {
  const db = useSQLiteContext();
  const theme = useTheme();
  const { currency } = useMoney();
  const apply = useSetCurrency();
  const [error, setError] = useState<string | null>(null);
  const { dialog, ask } = useConfirm();

  const save = async (next: Currency) => {
    setError(null);
    const result = await setCurrency(db, next);
    if (result.ok) apply(next);
    else setError(result.message);
  };

  // Always asks first: every amount will show in the new currency with the same numbers.
  const pick = (next: Currency) => {
    if (next === currency) return;
    hapticTick();
    ask({
      title: `Change to ${CURRENCY_NAMES[next]}?`,
      message: `Your amounts keep their numbers and will show in ${CURRENCY_NAMES[next]}. Nothing is converted.`,
      cancel: 'Cancel',
      confirm: 'Change',
      tone: 'primary',
      onConfirm: () => void save(next),
    });
  };

  return (
    <View style={styles.section}>
      {dialog}
      <ThemedText type="heading">Currency</ThemedText>
      <View style={styles.pills} accessibilityRole="radiogroup" accessibilityLabel="Currency">
        {CURRENCIES.map((option) => (
          <Pill
            key={option}
            label={CURRENCY_NAMES[option]}
            accessibilityRole="radio"
            selected={option === currency}
            colors={{ fill: theme.accent, ink: theme.onAccent, ring: Hero.ring }}
            onPress={() => pick(option)}
          />
        ))}
      </View>
      <ThemedText type="small" themeColor="textSecondary">
        Amounts are not converted when you change the currency.
      </ThemedText>
      {error ? <ErrorText>{error}</ErrorText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  section: {
    gap: Layout.itemGap,
  },
  infoRow: {
    alignItems: 'center',
    borderRadius: Radius.field,
    flexDirection: 'row',
    gap: Layout.itemGap,
    justifyContent: 'space-between',
    minHeight: Size.control,
    paddingHorizontal: Layout.cardPadding,
  },
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Layout.itemGap,
  },
});

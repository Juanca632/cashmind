import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState, BackHandler, StyleSheet, View } from 'react-native';

import { authenticate, isPrompting } from '@/features/settings/device-auth';
import { useLockCheck } from '@/features/settings/hooks/use-lock-check';
import { shouldLockOnReturn } from '@/features/settings/rules';
import { Layout } from '@/shared/theme/theme';
import { Button } from '@/shared/ui/button';
import { ThemedText } from '@/shared/ui/themed-text';
import { ThemedView } from '@/shared/ui/themed-view';

const LOCKOUT = 'Too many attempts. Try again in a moment.';

type Phase = 'checking' | 'locked' | 'open';

/**
 * Covers the app until the phone confirms its owner (specs/023-settings-app-lock): on a cold start,
 * and on coming back after more than a minute away. The screens stay mounted underneath, so
 * unlocking returns to the same place with anything typed kept.
 */
export function AppLock({ children }: { children: ReactNode }) {
  const shouldLock = useLockCheck();
  const [phase, setPhase] = useState<Phase>('checking');
  const [lockedOut, setLockedOut] = useState(false);
  const leftAt = useRef<number | null>(null);

  const unlock = useCallback(async () => {
    if (isPrompting()) return;
    setLockedOut(false);
    const outcome = await authenticate();
    if (outcome === 'ok') setPhase('open');
    else if (outcome === 'lockout') setLockedOut(true);
  }, []);

  const lockIfNeeded = useCallback(() => {
    void shouldLock().then((lock) => {
      if (lock) {
        setPhase('locked');
        void unlock();
      } else {
        setPhase('open');
      }
    });
  }, [shouldLock, unlock]);

  useEffect(() => {
    lockIfNeeded();
  }, [lockIfNeeded]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'background') {
        leftAt.current = Date.now();
      } else if (state === 'active' && leftAt.current !== null) {
        const away = Date.now() - leftAt.current;
        leftAt.current = null;
        // Coming back from the prompt's own PIN screen is not a return to the app.
        if (isPrompting() || !shouldLockOnReturn(away)) return;
        // Cover the screen at once: the checks below are async, and no amount may show meanwhile.
        setPhase('checking');
        lockIfNeeded();
      }
    });
    return () => subscription.remove();
  }, [lockIfNeeded]);

  const open = phase === 'open';

  useEffect(() => {
    if (open) return;
    // Back must never reveal the screens behind the cover: it leaves the app instead.
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      BackHandler.exitApp();
      return true;
    });
    return () => subscription.remove();
  }, [open]);

  return (
    <View style={styles.fill}>
      <View style={styles.fill} importantForAccessibility={open ? 'auto' : 'no-hide-descendants'}>
        {children}
      </View>
      {open ? null : (
        <ThemedView style={[StyleSheet.absoluteFill, styles.cover]}>
          {phase === 'locked' ? (
            <>
              <ThemedText type="heading">CashMind</ThemedText>
              {lockedOut ? <ThemedText themeColor="textSecondary">{LOCKOUT}</ThemedText> : null}
              <Button label="Unlock" icon="lock" onPress={() => void unlock()} />
            </>
          ) : null}
        </ThemedView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  cover: {
    alignItems: 'center',
    gap: Layout.sectionGap,
    justifyContent: 'center',
    paddingHorizontal: Layout.screenPadding,
  },
});

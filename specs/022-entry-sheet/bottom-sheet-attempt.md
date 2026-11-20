# Bottom sheet attempt (dropped)

Feature 022 first presented the entry form as a bottom sheet. The developer dropped it on 2026-11-20 after trying it on the phone; the form is a normal page again, with the new layout. Kept here only as a record, in case a sheet is tried again.

## What went wrong

1. **Android's native form sheet** (`presentation: 'formSheet'`, react-native-screens 4.30.1): `SheetDelegate.kt` sets `isDraggable = true` with no option, so the sheet drags from anywhere; scrolling the form back up closed it, even with `nestedScrollEnabled`. Swipe-down also cannot be blocked (`preventNativeDismiss` and `gestureEnabled` are iOS-only), so unsaved changes were lost without asking. No grabber or header on Android.
2. **App-drawn sheet** (below: `transparentModal` route + `PanResponder` on the handle + Reanimated): scrolling was fixed, but the default spring bounced too much, the keyboard pushed the sheet off the top until its height followed the keyboard, and content scrolling under the handle needed a fade. Each fix brought a new rough edge.

## Lessons

- A sheet needs its own keyboard handling, scroll edge treatment and dismissal rules; a page gets all three from the stack.
- If tried again, consider a maintained library (e.g. `@gorhom/bottom-sheet`, needs `react-native-gesture-handler`), which the developer must approve.

## The app-drawn sheet (`src/shared/ui/bottom-sheet.tsx`, last version)

Route options used: `presentation: 'transparentModal'`, `animation: 'fade'`, `headerShown: false`, `contentStyle: { backgroundColor: 'transparent' }`. Tokens it used (removed): `Radius.sheet` 28, `Size.sheetHandleWidth` 32, `Size.sheetHandle` 4, `SHEET_CLOSE_DRAG` 96, `SHEET_CLOSE_VELOCITY` 1, theme color `scrim` (light `rgba(17, 19, 24, 0.4)`, dark `rgba(0, 0, 0, 0.6)`).

```tsx
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import Animated, { Easing, SlideInDown, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Layout, Opacity, Radius, SHEET_CLOSE_DRAG, SHEET_CLOSE_VELOCITY, Size } from '@/shared/theme/theme';
import { useTheme } from '@/shared/theme/use-theme';

/** How long the sheet takes to slide away after a drag that closes it, in ms. */
const CLOSE_DURATION = 180;
/** Opening and settling back: a quick ease out, no bounce. */
const SETTLE = { duration: 220, easing: Easing.out(Easing.cubic) };

type BottomSheetProps = {
  /** The scrolling content. */
  children: ReactNode;
  /** Fixed under the content, above the keyboard: the main button. */
  footer: ReactNode;
  /** Small actions at the right of the handle, such as Delete. */
  actions?: ReactNode;
  /**
   * Asked to close: by dragging the handle down, tapping it, or tapping the dimmed screen. The
   * screen goes back, so a form guarding unsaved changes still asks first. Keep it stable (not a
   * new arrow on every render).
   */
  onClose: () => void;
};

/**
 * A card that slides up from the bottom over the dimmed screen behind it, as tall as its content up
 * to most of the screen. Only the handle drags it: the content scrolls freely and never closes it.
 */
export function BottomSheet({ children, footer, actions, onClose }: BottomSheetProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const offset = useSharedValue(0);
  // With the keyboard up, the navigation bar is behind it: the footer needs no room for it.
  const [keyboardShown, setKeyboardShown] = useState(false);
  useEffect(() => {
    const shown = Keyboard.addListener('keyboardDidShow', () => setKeyboardShown(true));
    const hidden = Keyboard.addListener('keyboardDidHide', () => setKeyboardShown(false));
    return () => {
      shown.remove();
      hidden.remove();
    };
  }, []);
  // The sheet's color fully transparent (#RRGGBB00), for fades that never turn grey.
  const clear = `${theme.background}00`;
  // Made again only if onClose changes: pass a stable function, or a drag in progress is lost.
  const drag = useMemo(
    () =>
      PanResponder.create({
      onMoveShouldSetPanResponder: (_event, gesture) => Math.abs(gesture.dy) > Math.abs(gesture.dx),
      onPanResponderMove: (_event, gesture) => {
        offset.set(Math.max(0, gesture.dy));
      },
      onPanResponderRelease: (_event, gesture) => {
        if (gesture.dy > SHEET_CLOSE_DRAG || gesture.vy > SHEET_CLOSE_VELOCITY) {
          offset.set(withTiming(height, { duration: CLOSE_DURATION }));
          setTimeout(onClose, CLOSE_DURATION);
          // If the form asks to keep editing, the screen stays: bring the sheet back up.
          setTimeout(() => {
            offset.set(withTiming(0, SETTLE));
          }, CLOSE_DURATION * 2);
        } else {
          offset.set(withTiming(0, SETTLE));
        }
      },
      onPanResponderTerminate: () => {
        offset.set(withTiming(0, SETTLE));
      },
    }),
    [height, offset, onClose],
  );

  const moved = useAnimatedStyle(() => ({ transform: [{ translateY: offset.get() }] }));

  return (
    // The keyboard pads this screen from below, so the sheet always fits between the status bar and it.
    <KeyboardAvoidingView style={[styles.screen, { paddingTop: insets.top + Layout.sectionGap }]} behavior="padding">
      {/* Tapping the dimmed screen closes; screen readers use the handle's Close instead. */}
      <Pressable
        accessible={false}
        importantForAccessibility="no"
        onPress={onClose}
        style={[StyleSheet.absoluteFill, { backgroundColor: theme.scrim }]}
      />
      <Animated.View
        entering={SlideInDown.duration(SETTLE.duration).easing(SETTLE.easing)}
        style={[
          styles.sheet,
          { backgroundColor: theme.background },
          moved,
        ]}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
          style={styles.scroll}>
          {children}
        </ScrollView>
        {/*
          The handle floats over the content, which scrolls under it and fades out (as the app does
          under the status bar) instead of being cut on a hard line.
        */}
        <View
          {...drag.panHandlers}
          style={[
            styles.handleArea,
            { experimental_backgroundImage: `linear-gradient(to bottom, ${theme.background} 55%, ${clear})` },
          ]}>
          {/* Dragged, not tapped, as in Material; screen readers get it as a Close button. */}
          <View
            accessible
            accessibilityRole="button"
            accessibilityLabel="Close"
            accessibilityActions={[{ name: 'activate', label: 'Close' }]}
            onAccessibilityAction={onClose}
            style={styles.handleTouch}>
            <View style={[styles.handle, { backgroundColor: theme.textSecondary }]} />
          </View>
          {actions ? <View style={styles.actions}>{actions}</View> : null}
        </View>
        <View style={[styles.footer, { paddingBottom: Layout.sectionGap + (keyboardShown ? 0 : insets.bottom) }]}>
          <View
            pointerEvents="none"
            style={[styles.footerFade, { experimental_backgroundImage: `linear-gradient(to top, ${theme.background}, ${clear})` }]}
          />
          {footer}
        </View>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: Radius.sheet,
    borderTopRightRadius: Radius.sheet,
    // Never taller than the room left above the keyboard and below the status bar.
    maxHeight: '100%',
    overflow: 'hidden',
  },
  scroll: {
    flexGrow: 0,
    flexShrink: 1,
  },
  /** As tall as a touch target, as Material asks for a sheet's handle; it floats over the content's top. */
  handleArea: {
    alignItems: 'center',
    justifyContent: 'center',
    left: 0,
    minHeight: Size.control,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  handleTouch: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: Size.control,
    minWidth: Size.control,
  },
  handle: {
    borderRadius: Radius.full,
    height: Size.sheetHandle,
    opacity: Opacity.disabled,
    width: Size.sheetHandleWidth,
  },
  actions: {
    bottom: 0,
    flexDirection: 'row',
    position: 'absolute',
    right: Layout.tightGap,
    top: 0,
  },
  content: {
    gap: Layout.sectionGap,
    paddingBottom: Layout.sectionGap,
    paddingHorizontal: Layout.screenPadding,
    // Room for the handle floating above.
    paddingTop: Size.control,
  },
  footer: {
    paddingHorizontal: Layout.screenPadding,
    paddingTop: Layout.itemGap,
  },
  /** Content fades out just above the button instead of being cut. */
  footerFade: {
    bottom: '100%',
    height: Layout.sectionGap,
    left: 0,
    position: 'absolute',
    right: 0,
  },
});
```

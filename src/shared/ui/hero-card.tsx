import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';

import { elevation, Hero, Layout, Radius, Size } from '@/shared/theme/theme';
import { useTheme } from '@/shared/theme/use-theme';

type HeroCardProps = {
  /** Fades the card to red: the month is overspent, or a pocket is below zero. */
  overspent: boolean;
  /** The card's own colour; the month's green when left out (a pocket passes its colour). */
  tone?: { base: string; gradient: string };
  children: ReactNode;
};

/** The big card at the top of home, for the month and for each pocket (specs/027-spaces). */
export function HeroCard({ overspent, tone, children }: HeroCardProps) {
  const theme = useTheme();
  const reducedMotion = useReducedMotion();
  const background = tone ? { backgroundColor: tone.base, experimental_backgroundImage: tone.gradient } : null;
  return (
    // The shadow sits on its own view: the card clips its content to its rounded corners.
    <View style={[styles.shadow, elevation(theme, overspent ? 'heroOverspent' : 'hero')]}>
      <View style={[styles.card, background]}>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.overspent,
            { opacity: overspent ? 1 : 0, transitionProperty: 'opacity', transitionDuration: reducedMotion ? 0 : 250 },
          ]}
        />
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    borderRadius: Radius.hero,
  },
  card: {
    backgroundColor: Hero.background,
    overflow: 'hidden',
    borderRadius: Radius.hero,
    experimental_backgroundImage: Hero.gradient,
    gap: Layout.sectionGap,
    justifyContent: 'center',
    minHeight: Size.hero,
    padding: Layout.cardPadding,
  },
  overspent: {
    ...StyleSheet.absoluteFill,
    experimental_backgroundImage: Hero.overspentGradient,
  },
});

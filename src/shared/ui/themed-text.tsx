import { StyleSheet, Text, type TextProps } from 'react-native';

import { FontFamily, ThemeColor } from '@/shared/theme/theme';
import { useTheme } from '@/shared/theme/use-theme';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'heading' | 'caption' | 'small' | 'smallBold' | 'button' | 'subtitle' | 'heroLabel' | 'figure' | 'figureFraction' | 'tileValue';
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();

  return <Text style={[{ color: theme[themeColor ?? 'text'] }, styles[type], style]} {...rest} />;
}

const styles = StyleSheet.create({
  heading: {
    fontSize: 22,
    fontFamily: FontFamily.bold,
    letterSpacing: -0.3,
    lineHeight: 28,
  },
  caption: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    lineHeight: 18,
  },
  small: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: FontFamily.medium,
  },
  smallBold: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: FontFamily.bold,
  },
  /** The label of a full-width button. */
  button: {
    fontSize: 16,
    lineHeight: 20,
    fontFamily: FontFamily.bold,
  },
  /** The title of a full-screen message. */
  subtitle: {
    fontSize: 32,
    lineHeight: 44,
    fontFamily: FontFamily.semiBold,
  },
  default: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: FontFamily.medium,
  },
  /** The label above the hero card's big figure. */
  heroLabel: {
    fontFamily: FontFamily.semiBold,
    fontSize: 18,
    lineHeight: 24,
  },
  /** The hero card's big figure (whole part). */
  figure: {
    fontFamily: FontFamily.bold,
    fontSize: 64,
    fontVariant: ['tabular-nums'],
    letterSpacing: -1.5,
    lineHeight: 72,
  },
  /** The decimals beside the big figure. */
  figureFraction: {
    fontFamily: FontFamily.semiBold,
    fontSize: 28,
    lineHeight: 36,
  },
  /** The amount on a kind tile. */
  tileValue: {
    fontFamily: FontFamily.bold,
    fontSize: 18,
    lineHeight: 24,
  },
});

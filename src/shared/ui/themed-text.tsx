import { Platform, StyleSheet, Text, type TextProps } from 'react-native';

import { FontFamily, Fonts, ThemeColor } from '@/shared/theme/theme';
import { useTheme } from '@/shared/theme/use-theme';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'display' | 'heading' | 'caption' | 'title' | 'small' | 'smallBold' | 'subtitle' | 'link' | 'linkPrimary' | 'code';
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();

  return <Text style={[{ color: theme[themeColor ?? 'text'] }, styles[type], style]} {...rest} />;
}

const styles = StyleSheet.create({
  display: {
    fontSize: 48,
    fontVariant: ['tabular-nums'],
    fontFamily: FontFamily.bold,
    letterSpacing: -1,
    lineHeight: 56,
  },
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
  default: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: FontFamily.medium,
  },
  title: {
    fontSize: 48,
    fontFamily: FontFamily.semiBold,
    lineHeight: 52,
  },
  subtitle: {
    fontSize: 32,
    lineHeight: 44,
    fontFamily: FontFamily.semiBold,
  },
  link: {
    lineHeight: 30,
    fontSize: 14,
  },
  linkPrimary: {
    lineHeight: 30,
    fontSize: 14,
    color: '#3c87f7',
  },
  code: {
    fontFamily: Fonts.mono,
    fontWeight: Platform.select({ android: 700 }) ?? 500,
    fontSize: 12,
  },
});

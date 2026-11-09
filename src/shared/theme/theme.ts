/** Design tokens. The app is light mode only for now. */

import '@/global.css';

import { Platform } from 'react-native';

export const ERROR_COLOR = '#B3362A';

export const Colors = {
  text: '#0E1116',
  background: '#F2F3F7',
  backgroundElement: '#FFFFFF',
  backgroundSelected: '#E9ECF2',
  textSecondary: '#5B6472',
} as const;

export type ThemeColor = keyof typeof Colors;

/** The one vivid element on a screen: the plan card and the main action. */
export const Hero = {
  background: '#1E2E73',
  text: '#FFFFFF',
  label: '#E7EAFF',
} as const;

/** One color per part of the plan, the same on every screen. */
export const BUCKET_COLORS = {
  fixed: '#2F5BEA',
  leisure: '#C2410C',
  savings: '#0B6B5E',
} as const;

/** The same three hues, light enough to read on the Hero background. */
export const BUCKET_COLORS_ON_HERO = {
  fixed: '#8FA6FF',
  leisure: '#FFB066',
  savings: '#45D3A8',
} as const;

export const CARD_SHADOW = '0 2px 8px rgba(14, 17, 22, 0.06)';

export const Radius = {
  hero: 28,
  card: 20,
  field: 16,
  full: 999,
} as const;

/** Minimum size of anything tappable. */
export const MIN_TOUCH = 48;

/** Each Manrope weight is its own font family: use these instead of fontWeight. */
export const FontFamily = {
  regular: 'Manrope_400Regular',
  medium: 'Manrope_500Medium',
  semiBold: 'Manrope_600SemiBold',
  bold: 'Manrope_700Bold',
} as const;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const MaxContentWidth = 800;

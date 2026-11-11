/** Design tokens. Colors come in a light and a dark set; screens read the current one with useTheme(). */

import type { EntryKind } from '@/shared/kinds';

type KindColors = Record<EntryKind, string>;

export type Theme = {
  text: string;
  textSecondary: string;
  background: string;
  backgroundElement: string;
  /** The main action, filled; `onAccent` reads on top of it. */
  accent: string;
  onAccent: string;
  /** The app's green used as text or as a border. */
  accentInk: string;
  /** A kind of entry as a filled background with white text (a selected kind option). */
  kindFill: KindColors;
  /** A kind of entry as text or icon color. */
  kindInk: KindColors;
  /** The soft background of each kind; its kindInk reads on top of it. */
  kindTint: KindColors;
  /** The savings goal bar: the empty track behind the savings color. */
  savingsTrack: string;
  /** Error text. */
  error: string;
  /** A destructive button, with white text. */
  errorFill: string;
  cardShadow: string;
};

/** Fills that carry white text: the same in both themes. */
const KIND_FILL: KindColors = {
  expense: '#9A3412',
  savings: '#065F46',
  income: '#0F766E',
};

export const LIGHT: Theme = {
  text: '#111318',
  textSecondary: '#5F6673',
  background: '#F3F4F6',
  backgroundElement: '#FFFFFF',
  accent: '#065F52',
  onAccent: '#FFFFFF',
  accentInk: '#065F52',
  kindFill: KIND_FILL,
  kindInk: KIND_FILL,
  kindTint: {
    expense: '#FDEBDD',
    savings: '#D9F2E6',
    income: '#D5F2EE',
  },
  savingsTrack: 'rgba(6, 95, 70, 0.18)',
  error: '#C92A2A',
  errorFill: '#C92A2A',
  cardShadow: '0 2px 8px rgba(14, 17, 22, 0.06)',
};

export const DARK: Theme = {
  text: '#F1F3F5',
  textSecondary: '#9AA3AE',
  background: '#0E1113',
  backgroundElement: '#1A1F22',
  accent: '#065F52',
  onAccent: '#FFFFFF',
  accentInk: '#5FD4BC',
  kindFill: KIND_FILL,
  kindInk: {
    expense: '#FDBA8C',
    savings: '#6EE7B7',
    income: '#5EEAD4',
  },
  kindTint: {
    expense: '#3A2418',
    savings: '#11342A',
    income: '#0F3330',
  },
  savingsTrack: 'rgba(110, 231, 183, 0.2)',
  error: '#FF8A80',
  errorFill: '#C92A2A',
  cardShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
};

/** The plain colors a ThemedText or ThemedView can take by name. */
export type ThemeColor = 'text' | 'textSecondary' | 'background' | 'backgroundElement';

/** The month card at the top of Home. The same in both themes. */
export const Hero = {
  background: '#065F52',
  gradient: 'linear-gradient(145deg, #065F52 0%, #08705E 60%, #0A7A66 100%)',
  /** The card when the month is overspent (left to spend below zero). */
  overspentGradient: 'linear-gradient(145deg, #8F1D16 0%, #B42318 60%, #C4320A 100%)',
  text: '#FFFFFF',
  label: '#DFF7EF',
  control: 'rgba(255, 255, 255, 0.18)',
} as const;

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

export const Spacing = {
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
} as const;

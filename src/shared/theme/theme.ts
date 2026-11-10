/** Design tokens. The app is light mode only for now. */

export const ERROR_COLOR = '#C92A2A';

export const Colors = {
  text: '#111318',
  background: '#F3F4F6',
  backgroundElement: '#FFFFFF',
  textSecondary: '#5F6673',
} as const;

export type ThemeColor = keyof typeof Colors;

/** The main action on a screen. */
export const Accent = {
  background: '#065F52',
  text: '#FFFFFF',
} as const;

/** The month card at the top of Home. */
export const Hero = {
  background: '#065F52',
  gradient: 'linear-gradient(145deg, #065F52 0%, #0A7A66 60%, #0B8A6F 100%)',
  text: '#FFFFFF',
  label: '#DFF7EF',
  control: 'rgba(255, 255, 255, 0.18)',
} as const;

/** One color per kind of entry, the same on every screen. Readable with white text on top. */
export const KIND_COLORS = {
  expense: '#9A3412',
  savings: '#065F46',
  income: '#0F766E',
} as const;

/** The soft background of each kind; its KIND_COLORS value reads on top of it. */
export const KIND_TINTS = {
  expense: '#FDEBDD',
  savings: '#D9F2E6',
  income: '#D5F2EE',
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

export const Spacing = {
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
} as const;

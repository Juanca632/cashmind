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
  /** A full-width row while pressed. */
  pressed: string;
  /** Outline (no layout space) of filled accent shapes, so they stand out from a dark surface; transparent in light. */
  accentOutline: string;
  /** Error text, and the label of a destructive button such as Delete. */
  error: string;
  /** The filled confirm button of a destructive dialog, with white text. */
  errorFill: string;
  /** How high things sit. One place decides which surfaces float; see `elevation()`. */
  shadow: {
    /** Buttons and action pills: things you press. */
    raised: string;
    /** The month card. */
    hero: string;
    /** The month card while the month is overspent. */
    heroOverspent: string;
  };
};

/** The levels a surface can sit at: flat (cards, tiles, choices), raised (buttons, action pills), hero (the month card). */
export type ElevationLevel = 'flat' | 'raised' | 'hero' | 'heroOverspent';

/** The style for a level; `flat` adds nothing. */
export function elevation(theme: Theme, level: ElevationLevel): { boxShadow?: string } {
  return level === 'flat' ? {} : { boxShadow: theme.shadow[level] };
}

/** Fills that carry white text: the same in both themes. */
const KIND_FILL: KindColors = {
  expense: '#9A3412',
  savings: '#065F46',
  income: '#1D4ED8',
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
    income: '#DBE7FE',
  },
  savingsTrack: 'rgba(6, 95, 70, 0.3)',
  pressed: '#E4E7EB',
  accentOutline: 'transparent',
  error: '#C92A2A',
  errorFill: '#C92A2A',
  shadow: {
    raised: '0 2px 8px rgba(14, 17, 22, 0.08)',
    // Mostly around the card, a little more below it, so it glows and still floats.
    hero: '0 4px 28px rgba(6, 95, 82, 0.18)',
    heroOverspent: '0 4px 28px rgba(180, 35, 24, 0.18)',
  },
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
    income: '#93B4FD',
  },
  kindTint: {
    expense: '#3A2418',
    savings: '#11342A',
    income: '#15223F',
  },
  savingsTrack: 'rgba(110, 231, 183, 0.35)',
  pressed: '#2A3135',
  accentOutline: '#5FD4BC',
  error: '#FF8A80',
  errorFill: '#C92A2A',
  // Shadows barely show on a dark background; surfaces there stand apart by their color.
  shadow: {
    raised: '0 2px 8px rgba(0, 0, 0, 0.4)',
    hero: '0 4px 28px rgba(0, 0, 0, 0.5)',
    heroOverspent: '0 4px 28px rgba(0, 0, 0, 0.5)',
  },
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
  /** The month card. */
  hero: 28,
  /** Modal dialogs. */
  dialog: 28,
  /** Cards, tiles and choices. */
  card: 20,
  /** Text fields, the date row and list rows' press highlight. */
  field: 16,
  /** Pills and buttons. */
  full: 999,
} as const;

/** How faded a control is in each state. */
export const Opacity = {
  disabled: 0.4,
  /** Disabled on the month card's gradient, where 0.4 would almost vanish. */
  disabledOnHero: 0.6,
  pressed: 0.6,
} as const;

/** Icon sizes: inside pills, buttons and lines; on badges and choices; standalone icon buttons. */
export const IconSize = {
  small: 16,
  medium: 18,
  large: 24,
} as const;

/** Border width of a selected pill, tile or choice. */
export const BORDER_WIDTH = 1.5;

/** Sizes of the shared controls and blocks. Use these instead of numbers in screens. */
export const Size = {
  /** Fields, compact buttons and the minimum touch area of anything tappable. */
  control: 48,
  /** A full-width button. */
  button: 56,
  /** Visible height of a pill; its touch area is padded to `control`. */
  pill: 40,
  /** One entry in a list. */
  row: 62,
  /** A kind choice in the entry form. */
  choice: 72,
  /** The month card at the top of home. */
  hero: 168,
  /** The round icon badge of a list row. */
  badge: 40,
  /** The savings goal progress bar. */
  progress: 6,
  /** Widest a modal dialog gets. */
  dialog: 360,
  /** The big amount input of the entry form. */
  amountInput: 120,
  /** The big percentage input of My plan. */
  percentInput: 72,
  /** A right-aligned percentage column. */
  percentColumn: 44,
} as const;

/** Minimum size of anything tappable. */
export const MIN_TOUCH = Size.control;

/** Each Manrope weight is its own font family: use these instead of fontWeight. */
export const FontFamily = {
  regular: 'Manrope_400Regular',
  medium: 'Manrope_500Medium',
  semiBold: 'Manrope_600SemiBold',
  bold: 'Manrope_700Bold',
} as const;

/** The raw spacing scale. Only this file uses it: screens and components use Layout and Size. */
export const Spacing = {
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
} as const;

/**
 * Where each space goes. Screens and components use these, so the whole app keeps one rhythm and
 * a spacing changes in one place.
 */
export const Layout = {
  /** Side margin of every screen. */
  screenPadding: Spacing.three,
  /** Between blocks: the month card, the tiles, a section, a button. */
  sectionGap: Spacing.three,
  /** Inside a block: a title and its content, rows, pills in a row. */
  itemGap: Spacing.two,
  /** A label and its value. */
  tightGap: Spacing.one,
  /** Between blocks on calm screens with few blocks (My plan, the month picker). */
  looseGap: Spacing.four,
  /** Inside every card. */
  cardPadding: Spacing.three,
  /** Inside a large card that holds one big figure (My plan). */
  cardPaddingLarge: Spacing.four,
  /** Inside the three narrow kind tiles on home, so their text fits. */
  tilePadding: 12,
  /** Inside a modal dialog. */
  dialogPadding: Spacing.four,
  /** Side padding of a pill. */
  pillPadding: 12,
  /** Between a list row's icon, text and amount. */
  rowGap: 12,
  /** Below the last block of a scrolling screen, above the system bar. */
  screenBottom: Spacing.five,
  /** Side padding of a full-width button. */
  buttonPadding: Spacing.four,
} as const;

import { DARK, Hero, LIGHT, type Theme } from '@/shared/theme/theme';

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const KINDS = ['expense', 'savings', 'income'] as const;

function pairs(t: Theme): [string, string, string][] {
  const list: [string, string, string][] = [];
  for (const bg of ['background', 'backgroundElement'] as const) {
    list.push([`text on ${bg}`, t.text, t[bg]]);
    list.push([`textSecondary on ${bg}`, t.textSecondary, t[bg]]);
    list.push([`accentInk on ${bg}`, t.accentInk, t[bg]]);
    list.push([`error on ${bg}`, t.error, t[bg]]);
    for (const k of KINDS) list.push([`kindInk.${k} on ${bg}`, t.kindInk[k], t[bg]]);
  }
  list.push(['onAccent on accent', t.onAccent, t.accent]);
  list.push(['white on errorFill', '#FFFFFF', t.errorFill]);
  for (const k of KINDS) {
    list.push([`kindInk.${k} on kindTint.${k}`, t.kindInk[k], t.kindTint[k]]);
    list.push([`onAccent on kindFill.${k}`, t.onAccent, t.kindFill[k]]);
  }
  return list;
}

describe('The app follows the phone\'s theme', () => {
  describe.each([
    ['LIGHT', LIGHT],
    ['DARK', DARK],
  ])('Readable: every text pair in %s meets 4.5:1', (_name, theme) => {
    it.each(pairs(theme))('%s', (_label, fg, bg) => {
      expect(contrast(fg, bg)).toBeGreaterThanOrEqual(4.5);
    });
  });

  it('Readable: the month card text meets 4.5:1 on every color stop of both gradients', () => {
    for (const gradient of [Hero.gradient, Hero.overspentGradient]) {
      const stops = gradient.match(/#[0-9A-Fa-f]{6}/g) ?? [];
      expect(stops.length).toBeGreaterThanOrEqual(3);
      for (const stop of stops) {
        expect(contrast(Hero.text, stop)).toBeGreaterThanOrEqual(4.5);
        expect(contrast(Hero.label, stop)).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it('Dark phone: the dark set has dark backgrounds and light text', () => {
    expect(luminance(DARK.background)).toBeLessThan(0.05);
    expect(luminance(DARK.backgroundElement)).toBeLessThan(0.05);
    expect(luminance(DARK.text)).toBeGreaterThan(0.5);
  });

  it('Same meaning: each kind keeps its own distinct color in both themes', () => {
    for (const t of [LIGHT, DARK]) {
      expect(new Set(KINDS.map((k) => t.kindInk[k])).size).toBe(3);
      expect(new Set(KINDS.map((k) => t.kindFill[k])).size).toBe(3);
    }
  });

  it('Same meaning: income reads blue and savings green, clearly different in hue in both themes', () => {
    const hue = (hex: string) => {
      const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
      const max = Math.max(r, g, b);
      const d = max - Math.min(r, g, b);
      const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
      return (h * 60 + 360) % 360;
    };
    for (const t of [LIGHT, DARK]) {
      const diff = Math.abs(hue(t.kindInk.income) - hue(t.kindInk.savings));
      expect(Math.min(diff, 360 - diff)).toBeGreaterThanOrEqual(60);
      expect(hue(t.kindInk.income)).toBeGreaterThan(200);
      expect(hue(t.kindInk.income)).toBeLessThan(260);
    }
  });

  it('Light phone: the app looks as it does today (the colors used before this change)', () => {
    expect(LIGHT).toMatchObject({
      text: '#111318',
      background: '#F3F4F6',
      backgroundElement: '#FFFFFF',
      textSecondary: '#5F6673',
      accent: '#065F52',
      onAccent: '#FFFFFF',
      accentInk: '#065F52',
      kindFill: { expense: '#9A3412', savings: '#065F46', income: '#1D4ED8' },
      kindInk: { expense: '#9A3412', savings: '#065F46', income: '#1D4ED8' },
      kindTint: { expense: '#FDEBDD', savings: '#D9F2E6', income: '#DBE7FE' },
      savingsTrack: 'rgba(6, 95, 70, 0.3)',
      error: '#C92A2A',
      errorFill: '#C92A2A',
      cardShadow: '0 2px 8px rgba(14, 17, 22, 0.06)',
    });
  });

  it('Dark phone: accentOutline contrasts at least 3:1 with both backgrounds, and light has none', () => {
    expect(contrast(DARK.accentOutline, DARK.backgroundElement)).toBeGreaterThanOrEqual(3);
    expect(contrast(DARK.accentOutline, DARK.background)).toBeGreaterThanOrEqual(3);
    expect(LIGHT.accentOutline).toBe('transparent');
  });

  it('Pressed rows are visibly different from the card color in both themes', () => {
    expect(LIGHT.pressed).not.toBe(LIGHT.backgroundElement);
    expect(DARK.pressed).not.toBe(DARK.backgroundElement);
  });

  it('Same meaning: the month card is the same fixed set as before, except the darker green gradient', () => {
    expect(Hero).toMatchObject({
      background: '#065F52',
      gradient: 'linear-gradient(145deg, #065F52 0%, #08705E 60%, #0A7A66 100%)',
      overspentGradient: 'linear-gradient(145deg, #8F1D16 0%, #B42318 60%, #C4320A 100%)',
      text: '#FFFFFF',
      label: '#DFF7EF',
    });
  });
});

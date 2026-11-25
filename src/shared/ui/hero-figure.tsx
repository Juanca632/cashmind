import { StyleSheet, View } from 'react-native';

import { useCountUp } from '@/shared/hooks/use-count-up';
import { useMoney } from '@/shared/hooks/use-money';
import { splitFraction } from '@/shared/money';
import { Hero, Layout } from '@/shared/theme/theme';
import { ThemedText } from '@/shared/ui/themed-text';

type HeroFigureProps = {
  label: string;
  cents: number;
  /** The figure counts up again when this changes (a new month or pocket). */
  countKey: string;
  /** One line under the figure; none when null. */
  detail: string | null;
};

/** The hero card's big amount, counting up to its value, with its decimals smaller beside it. */
export function HeroFigure({ label, cents, countKey, detail }: HeroFigureProps) {
  const money = useMoney();
  const counted = useCountUp(cents, countKey);
  // A whole amount counts up in whole units, so pesos never flash decimals they do not have.
  const shown = cents % 100 === 0 ? Math.round(counted / 100) * 100 : counted;
  const [whole, fraction] = splitFraction(money, money.format(shown));
  return (
    <View style={styles.brief} accessible accessibilityLabel={`${label}: ${money.format(cents)}${detail ? `. ${detail}` : ''}`}>
      <ThemedText type="heroLabel" style={{ color: Hero.label }}>
        {label}
      </ThemedText>
      <View style={styles.figure}>
        <ThemedText type="figure" numberOfLines={1} adjustsFontSizeToFit style={[styles.whole, { color: Hero.text }]}>
          {whole}
        </ThemedText>
        {fraction ? (
          <ThemedText type="figureFraction" style={{ color: Hero.label }}>
            {fraction}
          </ThemedText>
        ) : null}
      </View>
      {detail ? (
        <ThemedText type="small" style={{ color: Hero.label }}>
          {detail}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  brief: {
    alignItems: 'center',
    gap: Layout.tightGap,
  },
  figure: {
    alignItems: 'baseline',
    flexDirection: 'row',
  },
  whole: {
    flexShrink: 1,
  },
});

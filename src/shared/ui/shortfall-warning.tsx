import { formatEuros } from '@/shared/money';
import { ERROR_COLOR } from '@/shared/theme/theme';
import { ThemedText } from '@/shared/ui/themed-text';

/** Says that a month's income does not cover the fixed expenses. */
export function ShortfallWarning({ shortfall }: { shortfall: number }) {
  if (shortfall <= 0) return null;
  return (
    <ThemedText type="smallBold" style={{ color: ERROR_COLOR }}>
      This income is {formatEuros(shortfall)} short of your fixed expenses. Leisure and savings are 0 € this month.
    </ThemedText>
  );
}

import { StyleSheet, View } from 'react-native';

import { CATEGORY_LABELS } from '@/features/entries/categories';
import { categoryIcon } from '@/features/entries/components/category-icons';
import { entryTitle, type QuickAddSuggestion } from '@/features/entries/rules';
import { formatEuros } from '@/shared/money';
import { Layout } from '@/shared/theme/theme';
import { useTheme } from '@/shared/theme/use-theme';
import { Pill } from '@/shared/ui/pill';
import { ThemedText } from '@/shared/ui/themed-text';

/** Longest title a suggestion shows before cutting it with an ellipsis, so each pill stays short. */
const TITLE_MAX = 20;

function shortTitle(title: string): string {
  return title.length > TITLE_MAX ? `${title.slice(0, TITLE_MAX - 1).trimEnd()}…` : title;
}

type QuickAddRowProps = {
  suggestions: readonly QuickAddSuggestion[];
  onPick: (suggestion: QuickAddSuggestion) => void;
};

/** "Recent": the expenses the user records most often, each filling the form when tapped. */
export function QuickAddRow({ suggestions, onPick }: QuickAddRowProps) {
  const theme = useTheme();
  if (suggestions.length === 0) return null;

  return (
    <View style={styles.container}>
      <ThemedText type="small" themeColor="textSecondary">
        Recent
      </ThemedText>
      <View style={styles.pills}>
        {suggestions.map((suggestion) => {
          const title = entryTitle({ kind: 'expense', ...suggestion });
          const amount = formatEuros(suggestion.amountCents);
          return (
            <Pill
              key={`${suggestion.category}:${suggestion.amountCents}:${suggestion.note}`}
              label={`${shortTitle(title)} · ${amount}`}
              accessibilityLabel={`Fill with ${title}, ${CATEGORY_LABELS[suggestion.category]}, ${amount}`}
              icon={categoryIcon('expense', suggestion.category)}
              colors={{ fill: theme.kindFill.expense, ink: theme.kindInk.expense }}
              onPress={() => onPick(suggestion)}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Layout.tightGap,
  },
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Layout.itemGap,
  },
});

import { ScrollView, StyleSheet, View } from 'react-native';

import { CATEGORY_LABELS } from '@/features/entries/categories';
import { categoryIcon } from '@/features/entries/components/category-icons';
import { entryTitle, type QuickAddSuggestion } from '@/features/entries/rules';
import { useMoney } from '@/shared/hooks/use-money';
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

/** "Often recorded": the expenses the user records most often, in one row that scrolls sideways; each fills the form when tapped. */
export function QuickAddRow({ suggestions, onPick }: QuickAddRowProps) {
  const theme = useTheme();
  const money = useMoney();
  if (suggestions.length === 0) return null;

  return (
    <View style={styles.section}>
      <ThemedText type="smallBold" themeColor="textSecondary">
        Often recorded
      </ThemedText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.row}>
        {suggestions.map((suggestion) => {
          const title = entryTitle({ kind: 'expense', ...suggestion });
          const amount = money.format(suggestion.amountCents);
          return (
            <Pill
              key={`${suggestion.category}:${suggestion.amountCents}:${suggestion.note}`}
              label={`${shortTitle(title)} · ${amount}`}
              accessibilityLabel={`Fill with ${title}, ${CATEGORY_LABELS[suggestion.category]}, ${amount}`}
              icon={categoryIcon('expense', suggestion.category)}
              // Flat and neutral like the other choices; only the icon carries the expense color.
              selected={false}
              colors={{ fill: theme.kindTint.expense, ink: theme.kindInk.expense }}
              onPress={() => onPick(suggestion)}
            />
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Layout.itemGap,
  },
  row: {
    gap: Layout.itemGap,
  },
});

/** The icon of each category. */
import type { Feather } from '@react-native-vector-icons/feather';
import type { ComponentProps } from 'react';

import type { EntryCategory } from '@/features/entries/categories';
import type { EntryKind } from '@/shared/kinds';
import { KIND_ICONS } from '@/shared/ui/kind-badge';

type IconName = ComponentProps<typeof Feather>['name'];

const CATEGORY_ICONS: Record<Exclude<EntryCategory, 'other'>, IconName> = {
  housing: 'home',
  groceries: 'shopping-cart',
  transport: 'navigation',
  eating_out: 'coffee',
  leisure: 'film',
  health: 'heart',
  subscriptions: 'repeat',
  salary: 'briefcase',
  freelance: 'pen-tool',
  benefits: 'shield',
  gifts: 'gift',
  emergency_fund: 'umbrella',
  investments: 'bar-chart-2',
  travel: 'globe',
  goal: 'target',
};

/** A category's icon; Other keeps the kind's icon, so entries from before categories look the same. */
export function categoryIcon(kind: EntryKind, category: EntryCategory): IconName {
  return category === 'other' ? KIND_ICONS[kind] : CATEGORY_ICONS[category];
}

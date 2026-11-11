import type { ReactNode } from 'react';

import { useTheme } from '@/shared/theme/use-theme';
import { ThemedText } from '@/shared/ui/themed-text';

export function ErrorText({ children }: { children: ReactNode }) {
  return (
    <ThemedText type="small" style={{ color: useTheme().error }}>
      {children}
    </ThemedText>
  );
}

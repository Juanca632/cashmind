import type { ReactNode } from 'react';

import { ERROR_COLOR } from '@/shared/theme/theme';
import { ThemedText } from '@/shared/ui/themed-text';

export function ErrorText({ children }: { children: ReactNode }) {
  return (
    <ThemedText type="small" style={{ color: ERROR_COLOR }}>
      {children}
    </ThemedText>
  );
}

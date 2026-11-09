import { router } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';

import type { WriteResult } from '@/shared/write-result';

const UNEXPECTED = 'The change could not be saved. Please try again.';

/**
 * Runs a write from a form: goes back on success, otherwise explains why and keeps the form open.
 * `beforeLeave` runs right before going back, so a form guarding unsaved changes lets it through.
 */
export function useSubmit(beforeLeave?: () => void) {
  const [submitting, setSubmitting] = useState(false);

  async function submit(write: () => Promise<WriteResult>) {
    setSubmitting(true);
    try {
      const result = await write();
      if (result.ok) {
        // The form stays disabled while it leaves, so a second tap cannot save twice.
        beforeLeave?.();
        if (router.canGoBack()) router.back();
        else router.replace('/');
        return;
      }
      Alert.alert('Something went wrong', result.message);
    } catch {
      Alert.alert('Something went wrong', UNEXPECTED);
    }
    setSubmitting(false);
  }

  return { submit, submitting };
}

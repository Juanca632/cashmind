import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert } from 'react-native';

import type { WriteResult } from '@/shared/write-result';

const UNEXPECTED = 'The change could not be saved. Please try again.';

/**
 * Runs a write from a form: goes back on success, otherwise explains why and keeps the form open.
 * `beforeLeave` runs right before going back, so a form guarding unsaved changes lets it through.
 */
export function useSubmit(beforeLeave?: () => void) {
  const [submitting, setSubmitting] = useState(false);
  // A ref, not state: two taps in the same frame must not write twice.
  const inProgress = useRef(false);

  async function submit(write: () => Promise<WriteResult>) {
    if (inProgress.current) return;
    inProgress.current = true;
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
    inProgress.current = false;
    setSubmitting(false);
  }

  return { submit, submitting };
}

import { router, type Href } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert } from 'react-native';

import { hapticDelete, hapticSuccess } from '@/shared/haptics';
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

  /**
   * `kind` picks the vibration given when the write works: a save or a delete. `leaveTo` goes back
   * to that screen instead of the previous one, when the previous one shows what was just deleted.
   */
  async function submit<R extends WriteResult>(
    write: () => Promise<R>,
    kind: 'save' | 'delete' = 'save',
    leaveTo?: Href | ((result: R) => Href),
  ) {
    if (inProgress.current) return;
    inProgress.current = true;
    setSubmitting(true);
    try {
      const result = await write();
      if (result.ok) {
        if (kind === 'delete') hapticDelete();
        else hapticSuccess();
        // The form stays disabled while it leaves, so a second tap cannot save twice.
        beforeLeave?.();
        if (leaveTo) router.dismissTo(typeof leaveTo === 'function' ? leaveTo(result) : leaveTo);
        else if (router.canGoBack()) router.back();
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

import { router } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';

import type { WriteResult } from '@/shared/write-result';

const UNEXPECTED = 'The change could not be saved. Please try again.';

/** Runs a write from a form: goes back on success, otherwise explains why and keeps the form open. */
export function useSubmit() {
  const [submitting, setSubmitting] = useState(false);

  async function submit(write: () => Promise<WriteResult>) {
    setSubmitting(true);
    try {
      const result = await write();
      if (result.ok) router.back();
      else Alert.alert('Something went wrong', result.message);
    } catch {
      Alert.alert('Something went wrong', UNEXPECTED);
    } finally {
      setSubmitting(false);
    }
  }

  return { submit, submitting };
}

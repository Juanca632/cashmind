import { usePreventRemove } from 'expo-router';
import { useState } from 'react';

import { useConfirm } from '@/shared/ui/confirm-dialog';

/**
 * Asks before leaving a form with unsaved changes, by any way out. Render `dialog` in the form and
 * call `allowLeave` right before leaving on purpose, such as after a successful save.
 */
export function useDiscardGuard(dirty: boolean) {
  const { dialog, ask } = useConfirm();
  const [leaving, setLeaving] = useState(false);

  const disablePrevention = usePreventRemove(dirty && !leaving, ({ repeat }) => {
    ask({
      title: 'Discard changes?',
      message: 'What you entered will be lost.',
      cancel: 'Keep editing',
      confirm: 'Discard',
      onConfirm: () => {
        setLeaving(true);
        repeat();
      },
    });
  });

  function allowLeave() {
    setLeaving(true);
    disablePrevention();
  }

  return { dialog, allowLeave };
}

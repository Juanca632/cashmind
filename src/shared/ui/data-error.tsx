import { MessageScreen } from '@/shared/ui/message-screen';

/** Shown instead of figures when stored data has the wrong format. */
export function DataError({ topInset = false }: { topInset?: boolean }) {
  return <MessageScreen title="Some of your data could not be read" text="Nothing was changed or deleted." topInset={topInset} />;
}

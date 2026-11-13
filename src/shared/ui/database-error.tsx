import { MessageScreen } from '@/shared/ui/message-screen';

/** Shown instead of the app when the database cannot be updated. It has no header above it. */
export function DatabaseError({ message }: { message: string }) {
  return <MessageScreen title={message} topInset centered />;
}

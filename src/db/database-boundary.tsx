import { Component, type ReactNode } from 'react';

import { DatabaseMigrationError, DatabaseNewerError } from '@/db/migrate';
import { DatabaseError } from '@/shared/ui/database-error';

const MESSAGES = {
  failed: 'The app could not update your data. Your data is safe. Please install the latest version.',
  newer: 'Your data was saved by a newer version. Please install the latest version.',
};

function messageFor(error: unknown): string | null {
  if (error instanceof DatabaseNewerError) return MESSAGES.newer;
  if (error instanceof DatabaseMigrationError) return MESSAGES.failed;
  return null;
}

type State = { error: unknown };

/** Replaces the app with a clear message when the database cannot be updated. Other errors pass through. */
export class DatabaseBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: unknown): State {
    return { error };
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    const message = messageFor(error);
    if (!message) throw error;
    return <DatabaseError message={message} />;
  }
}

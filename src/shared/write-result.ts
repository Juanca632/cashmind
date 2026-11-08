/** Outcome of an operation that writes data. Services return it and never throw. */
export type WriteResult = { ok: true } | { ok: false; kind: 'invalid' | 'failed'; message: string };

export const WRITE_OK: WriteResult = { ok: true };

/** The write was refused before touching the database. */
export function rejected(message: string): WriteResult {
  return { ok: false, kind: 'invalid', message };
}

/** Runs a write and turns any thrown error into a failed result. */
export async function attemptWrite(failureMessage: string, write: () => Promise<WriteResult>): Promise<WriteResult> {
  try {
    return await write();
  } catch {
    return { ok: false, kind: 'failed', message: failureMessage };
  }
}

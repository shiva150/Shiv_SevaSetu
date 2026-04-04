import { Timestamp } from 'firebase-admin/firestore';
import type { DocumentData } from 'firebase-admin/firestore';

export type { DocumentData };

/**
 * Converts a Firestore document snapshot into a typed model.
 * Recursively converts Timestamp fields to Date objects.
 */
export function docToModel<T>(id: string, data: DocumentData): T {
  const result: Record<string, unknown> = { id };
  for (const [key, rawVal] of Object.entries(data)) {
    // Cast to any so instanceof Timestamp works regardless of DocumentData's inferred type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const v: any = rawVal;
    result[key] = v instanceof Timestamp ? v.toDate() : v;
  }
  return result as T;
}

/**
 * Returns the current server timestamp as a Date (for created_at / updated_at).
 */
export function now(): Date {
  return new Date();
}

/**
 * Generates a new UUID for document IDs.
 */
export { randomUUID as newId } from 'crypto';

/**
 * PostgreSQL has been removed. This file is intentionally empty.
 * All data access now goes through Firestore — see config/firestore.ts.
 *
 * If a service still imports `transaction` or `query` from here during a
 * build, it will get a clear runtime error instead of a silent no-op.
 */
export function query(): never {
  throw new Error('PostgreSQL has been removed. Use Firestore repositories.');
}

export function transaction(): never {
  throw new Error('PostgreSQL has been removed. Use getDb().runTransaction() with Firestore.');
}

export function getClient(): never {
  throw new Error('PostgreSQL has been removed.');
}

export async function healthCheck(): Promise<boolean> {
  return false;
}

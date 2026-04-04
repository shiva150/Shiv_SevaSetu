/**
 * Firestore configuration.
 *
 * The project uses a NAMED database (not the "(default)" database).
 * We therefore instantiate Firestore directly via @google-cloud/firestore
 * with an explicit `databaseId` instead of relying on admin.firestore(),
 * which always connects to "(default)".
 *
 * Firebase Admin SDK is still initialized alongside so that other Admin
 * services (Auth, Storage, etc.) remain available via `admin`.
 */
import admin from 'firebase-admin';
import { Firestore } from '@google-cloud/firestore';
import { env } from './env.js';

// ── Firebase Admin SDK (Auth, etc.) ────────────────────────────────────────
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      // .env stores the private key with literal \n — expand to real newlines
      privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}

// ── Firestore — named database ──────────────────────────────────────────────
// We use @google-cloud/firestore directly so we can pass `databaseId`.
// The `credentials` block authenticates with the same service account.
const db = new Firestore({
  projectId: env.FIREBASE_PROJECT_ID,
  databaseId: env.FIRESTORE_DATABASE_ID,
  credentials: {
    client_email: env.FIREBASE_CLIENT_EMAIL,
    private_key: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  },
  ignoreUndefinedProperties: true,
});

/** Returns the shared Firestore instance pointing at the named database. */
export function getDb(): Firestore {
  return db;
}

/** Shallow connectivity check used by the /health endpoint. */
export async function firestoreHealthCheck(): Promise<boolean> {
  try {
    await db.collection('_health').doc('ping').get();
    return true;
  } catch {
    return false;
  }
}

/** Exposes the initialized Admin SDK app for services that need it (Auth, etc.). */
export { admin };

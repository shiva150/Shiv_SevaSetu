/**
 * PostgreSQL migrations have been removed.
 * The data layer now uses Firebase Firestore — no schema migrations needed.
 *
 * To deploy Firestore indexes, run:
 *   firebase deploy --only firestore:indexes
 *
 * To deploy security rules, run:
 *   firebase deploy --only firestore:rules
 */
import { logger } from '../utils/logger.js';

logger.info('Firestore requires no SQL migrations. Deploy indexes and rules via the Firebase CLI.');
process.exit(0);

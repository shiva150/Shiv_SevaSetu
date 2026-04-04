import type { Query, DocumentData } from 'firebase-admin/firestore';
import { getDb } from '../config/firestore.js';
import { Match } from '../models/index.js';
import { docToModel, now } from './_helpers.js';

const COL = 'matches';

/**
 * Match document ID is the composite key `${caregiver_id}_${request_id}`.
 * This enables idempotent upserts without a secondary index.
 */
function matchDocId(caregiverId: string, requestId: string): string {
  return `${caregiverId}_${requestId}`;
}

export const matchRepository = {
  async findById(id: string): Promise<Match | null> {
    const snap = await getDb().collection(COL).doc(id).get();
    if (!snap.exists) return null;
    return docToModel<Match>(snap.id, snap.data()!);
  },

  async createBatch(
    matches: Array<{
      caregiver_id: string;
      request_id: string;
      score: number;
      skill_score: number;
      rating_score: number;
      distance_score: number;
      language_score: number;
    }>
  ): Promise<Match[]> {
    if (matches.length === 0) return [];

    const db = getDb();
    const batch = db.batch();
    const ts = now();
    const created: Match[] = [];

    for (const m of matches) {
      const id = matchDocId(m.caregiver_id, m.request_id);
      const ref = db.collection(COL).doc(id);
      const doc = {
        caregiver_id: m.caregiver_id,
        request_id: m.request_id,
        score: m.score,
        skill_score: m.skill_score,
        rating_score: m.rating_score,
        distance_score: m.distance_score,
        language_score: m.language_score,
        status: 'pending',
        created_at: ts,
      };
      // merge: true = upsert semantics (existing docs are updated)
      batch.set(ref, doc, { merge: true });
      created.push(docToModel<Match>(id, doc));
    }

    await batch.commit();
    return created;
  },

  async updateStatus(id: string, status: string): Promise<Match | null> {
    await getDb().collection(COL).doc(id).update({ status });
    return this.findById(id);
  },

  async listByRequest(requestId: string): Promise<Match[]> {
    const snap = await getDb()
      .collection(COL)
      .where('request_id', '==', requestId)
      .orderBy('score', 'desc')
      .get();
    return snap.docs.map((d: any) => docToModel<Match>(d.id, d.data()));
  },

  async listByCaregiver(caregiverId: string, status?: string): Promise<Match[]> {
    let q: Query<DocumentData> = getDb().collection(COL).where('caregiver_id', '==', caregiverId);
    if (status) q = q.where('status', '==', status);
    const snap = await q.orderBy('created_at', 'desc').get();
    return snap.docs.map((d: any) => docToModel<Match>(d.id, d.data()));
  },

  async expirePendingForRequest(requestId: string, exceptMatchId: string): Promise<void> {
    const snap = await getDb()
      .collection(COL)
      .where('request_id', '==', requestId)
      .where('status', '==', 'pending')
      .get();

    const batch = getDb().batch();
    for (const doc of snap.docs) {
      if (doc.id !== exceptMatchId) {
        batch.update(doc.ref, { status: 'expired' });
      }
    }
    await batch.commit();
  },
};

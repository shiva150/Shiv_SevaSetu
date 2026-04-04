import { getDb } from '../config/firestore.js';
import { Rating } from '../models/index.js';
import { docToModel, newId, now } from './_helpers.js';

const COL = 'ratings';

export const ratingRepository = {
  async findBySessionId(sessionId: string): Promise<Rating | null> {
    const snap = await getDb().collection(COL).where('session_id', '==', sessionId).limit(1).get();
    if (snap.empty) return null;
    const doc = snap.docs[0];
    return docToModel<Rating>(doc.id, doc.data());
  },

  async create(data: {
    session_id: string;
    rater_id: string;
    caregiver_id: string;
    score: number;
    feedback?: string;
  }): Promise<Rating> {
    const id = newId();
    const ts = now();
    const doc = {
      session_id: data.session_id,
      rater_id: data.rater_id,
      caregiver_id: data.caregiver_id,
      score: data.score,
      feedback: data.feedback ?? null,
      created_at: ts,
    };
    await getDb().collection(COL).doc(id).set(doc);
    return docToModel<Rating>(id, doc);
  },

  async listByCaregiver(caregiverId: string): Promise<Rating[]> {
    const snap = await getDb()
      .collection(COL)
      .where('caregiver_id', '==', caregiverId)
      .orderBy('created_at', 'desc')
      .get();
    return snap.docs.map((d: any) => docToModel<Rating>(d.id, d.data()));
  },

  async averageForCaregiver(caregiverId: string): Promise<{ avg: number; count: number }> {
    const snap = await getDb().collection(COL).where('caregiver_id', '==', caregiverId).get();
    const count = snap.size;
    if (count === 0) return { avg: 0, count: 0 };
    const sum = snap.docs.reduce((acc: number, d: any) => acc + (d.data()['score'] ?? 0), 0);
    return { avg: sum / count, count };
  },
};

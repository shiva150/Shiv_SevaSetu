import type { Query, DocumentData } from 'firebase-admin/firestore';
import { getDb } from '../config/firestore.js';
import { Session } from '../models/index.js';
import { docToModel, newId, now } from './_helpers.js';

const COL = 'sessions';

export interface SessionWithDetails extends Session {
  caregiver_name?: string;
  seeker_name?: string;
  request_description?: string;
}

export const sessionRepository = {
  async findById(id: string): Promise<Session | null> {
    const snap = await getDb().collection(COL).doc(id).get();
    if (!snap.exists) return null;
    return docToModel<Session>(snap.id, snap.data()!);
  },

  async findByIdWithDetails(id: string): Promise<SessionWithDetails | null> {
    const db = getDb();
    const snap = await db.collection(COL).doc(id).get();
    if (!snap.exists) return null;

    const session = docToModel<Session & {
      caregiver_user_id?: string;
      careseeker_user_id?: string;
      caregiver_name?: string;
      seeker_name?: string;
      request_description?: string;
    }>(snap.id, snap.data()!);

    // If denormalized names are already stored, use them directly
    if (session.caregiver_name && session.seeker_name) {
      return session as SessionWithDetails;
    }

    // Fallback: fetch from related docs
    const [cgSnap, reqSnap] = await Promise.all([
      db.collection('caregivers').doc(session.caregiver_id).get(),
      db.collection('care_requests').doc(session.request_id).get(),
    ]);

    const cgData = cgSnap.data();
    const reqData = reqSnap.data();

    const [cgUserSnap, seekerUserSnap] = await Promise.all([
      cgData ? db.collection('users').doc(cgData['user_id']).get() : Promise.resolve(null),
      reqData ? db.collection('users').doc(reqData['user_id']).get() : Promise.resolve(null),
    ]);

    return {
      ...session,
      caregiver_name: cgUserSnap?.data()?.['name'],
      seeker_name: seekerUserSnap?.data()?.['name'],
      request_description: reqData?.['description'],
    };
  },

  /**
   * Create a session with denormalized user IDs and names for efficient querying.
   * Fetches caregiver and request docs internally to populate denormalized fields.
   */
  async create(data: {
    caregiver_id: string;
    request_id: string;
    match_id: string;
    notes?: string;
    // Optional denormalized fields (provided by service for efficiency)
    caregiver_user_id?: string;
    careseeker_user_id?: string;
    caregiver_name?: string;
    seeker_name?: string;
    request_description?: string;
  }): Promise<Session> {
    const db = getDb();
    const id = newId();
    const ts = now();

    // If denormalized fields not supplied, fetch them
    let caregiverUserId = data.caregiver_user_id;
    let careseekerUserId = data.careseeker_user_id;
    let caregiverName = data.caregiver_name;
    let seekerName = data.seeker_name;
    let requestDescription = data.request_description;

    if (!caregiverUserId || !careseekerUserId) {
      const [cgSnap, reqSnap] = await Promise.all([
        db.collection('caregivers').doc(data.caregiver_id).get(),
        db.collection('care_requests').doc(data.request_id).get(),
      ]);
      const cgData = cgSnap.data() ?? {};
      const reqData = reqSnap.data() ?? {};

      caregiverUserId = cgData['user_id'] ?? '';
      careseekerUserId = reqData['user_id'] ?? '';
      requestDescription = reqData['description'] ?? null;

      const [cgUserSnap, seekerSnap] = await Promise.all([
        caregiverUserId ? db.collection('users').doc(caregiverUserId).get() : Promise.resolve(null),
        careseekerUserId ? db.collection('users').doc(careseekerUserId).get() : Promise.resolve(null),
      ]);
      caregiverName = cgUserSnap?.data()?.['name'];
      seekerName = seekerSnap?.data()?.['name'];
    }

    const doc = {
      caregiver_id: data.caregiver_id,
      request_id: data.request_id,
      match_id: data.match_id,
      caregiver_user_id: caregiverUserId,
      careseeker_user_id: careseekerUserId,
      caregiver_name: caregiverName ?? null,
      seeker_name: seekerName ?? null,
      request_description: requestDescription ?? null,
      start_time: null,
      end_time: null,
      status: 'scheduled',
      payment_status: 'pending',
      notes: data.notes ?? null,
      created_at: ts,
      updated_at: ts,
    };
    await db.collection(COL).doc(id).set(doc);
    return docToModel<Session>(id, doc);
  },

  async startSession(id: string): Promise<Session | null> {
    const db = getDb();
    const ref = db.collection(COL).doc(id);
    const snap = await ref.get();
    if (!snap.exists || snap.data()!['status'] !== 'scheduled') return null;
    const ts = now();
    await ref.update({ status: 'active', start_time: ts, updated_at: ts });
    return this.findById(id);
  },

  async completeSession(id: string, notes?: string): Promise<Session | null> {
    const db = getDb();
    const ref = db.collection(COL).doc(id);
    const snap = await ref.get();
    if (!snap.exists || snap.data()!['status'] !== 'active') return null;
    const updates: Record<string, unknown> = {
      status: 'completed',
      end_time: now(),
      updated_at: now(),
    };
    if (notes) updates['notes'] = notes;
    await ref.update(updates);
    return this.findById(id);
  },

  async cancelSession(id: string): Promise<Session | null> {
    const db = getDb();
    const ref = db.collection(COL).doc(id);
    const snap = await ref.get();
    const status = snap.data()?.['status'];
    if (!snap.exists || !['scheduled', 'active'].includes(status)) return null;
    await ref.update({ status: 'cancelled', updated_at: now() });
    return this.findById(id);
  },

  async updatePaymentStatus(id: string, paymentStatus: string): Promise<Session | null> {
    await getDb().collection(COL).doc(id).update({ payment_status: paymentStatus, updated_at: now() });
    return this.findById(id);
  },

  async listByUser(
    userId: string,
    role: 'caregiver' | 'careseeker',
    filters: { status?: string; page?: number; limit?: number }
  ): Promise<{ data: SessionWithDetails[]; total: number }> {
    const db = getDb();
    const field = role === 'caregiver' ? 'caregiver_user_id' : 'careseeker_user_id';

    let q: Query<DocumentData> = db.collection(COL).where(field, '==', userId);
    if (filters.status) q = q.where('status', '==', filters.status);

    const countSnap = await q.count().get();
    const total = countSnap.data().count;

    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const offset = (page - 1) * limit;

    const snap = await q.orderBy('created_at', 'desc').limit(offset + limit).get();
    const data = snap.docs
      .slice(offset)
      .map((d: any) => docToModel<SessionWithDetails>(d.id, d.data()));

    return { data, total };
  },

  async countByStatus(): Promise<Record<string, number>> {
    const statuses = ['scheduled', 'active', 'completed', 'cancelled'];
    const counts = await Promise.all(
      statuses.map(async (s) => {
        const snap = await getDb().collection(COL).where('status', '==', s).count().get();
        return { [s]: snap.data().count };
      })
    );
    return Object.assign({}, ...counts);
  },
};

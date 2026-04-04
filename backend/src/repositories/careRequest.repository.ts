import type { Query, DocumentData } from 'firebase-admin/firestore';
import { getDb } from '../config/firestore.js';
import { CareRequest } from '../models/index.js';
import { docToModel, newId, now } from './_helpers.js';

const COL = 'care_requests';

export const careRequestRepository = {
  async findById(id: string): Promise<CareRequest | null> {
    const snap = await getDb().collection(COL).doc(id).get();
    if (!snap.exists) return null;
    return docToModel<CareRequest>(snap.id, snap.data()!);
  },

  async create(data: {
    user_id: string;
    skills_required: string[];
    urgency?: string;
    location_lat?: number;
    location_lng?: number;
    location_address?: string;
    preferred_language?: string;
    description?: string;
    hours_needed?: number;
    budget?: number;
  }): Promise<CareRequest> {
    const id = newId();
    const ts = now();
    const doc = {
      user_id: data.user_id,
      skills_required: data.skills_required,
      urgency: data.urgency ?? 'medium',
      location_lat: data.location_lat ?? null,
      location_lng: data.location_lng ?? null,
      location_address: data.location_address ?? null,
      preferred_language: data.preferred_language ?? null,
      description: data.description ?? null,
      hours_needed: data.hours_needed ?? null,
      budget: data.budget ?? null,
      status: 'open',
      created_at: ts,
      updated_at: ts,
    };
    await getDb().collection(COL).doc(id).set(doc);
    return docToModel<CareRequest>(id, doc);
  },

  async updateStatus(id: string, status: string): Promise<CareRequest | null> {
    await getDb().collection(COL).doc(id).update({ status, updated_at: now() });
    return this.findById(id);
  },

  async listByUser(
    userId: string,
    filters: { status?: string; page?: number; limit?: number }
  ): Promise<{ data: CareRequest[]; total: number }> {
    const db = getDb();
    let q: Query<DocumentData> = db.collection(COL).where('user_id', '==', userId);

    if (filters.status) {
      q = q.where('status', '==', filters.status);
    }

    const countSnap = await q.count().get();
    const total = countSnap.data().count;

    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const offset = (page - 1) * limit;

    const snap = await q.orderBy('created_at', 'desc').limit(offset + limit).get();
    const data = snap.docs.slice(offset).map((d: any) => docToModel<CareRequest>(d.id, d.data()));

    return { data, total };
  },

  async listOpen(): Promise<CareRequest[]> {
    const snap = await getDb()
      .collection(COL)
      .where('status', '==', 'open')
      .orderBy('created_at', 'desc')
      .get();
    return snap.docs.map((d: any) => docToModel<CareRequest>(d.id, d.data()));
  },

  async countByStatus(): Promise<Record<string, number>> {
    const statuses = ['open', 'matched', 'active', 'completed', 'cancelled'];
    const counts = await Promise.all(
      statuses.map(async (s) => {
        const snap = await getDb().collection(COL).where('status', '==', s).count().get();
        return { [s]: snap.data().count };
      })
    );
    return Object.assign({}, ...counts);
  },
};

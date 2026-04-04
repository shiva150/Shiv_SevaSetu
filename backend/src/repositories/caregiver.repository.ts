import type { Query, DocumentData } from 'firebase-admin/firestore';
import { getDb } from '../config/firestore.js';
import { Caregiver, CaregiverWithUser } from '../models/index.js';
import { docToModel, newId, now } from './_helpers.js';
import { env } from '../config/env.js';

const COL = 'caregivers';

async function enrichWithUser(cg: Caregiver): Promise<CaregiverWithUser> {
  const userSnap = await getDb().collection('users').doc(cg.user_id).get();
  const u = userSnap.data() ?? {};
  return {
    ...cg,
    user_name: u['name'] ?? '',
    user_phone: u['phone'] ?? '',
    user_email: u['email'] ?? null,
    user_language: u['language'] ?? 'hindi',
  };
}

export const caregiverRepository = {
  async findById(id: string): Promise<Caregiver | null> {
    const snap = await getDb().collection(COL).doc(id).get();
    if (!snap.exists) return null;
    return docToModel<Caregiver>(snap.id, snap.data()!);
  },

  async findByUserId(userId: string): Promise<Caregiver | null> {
    const snap = await getDb().collection(COL).where('user_id', '==', userId).limit(1).get();
    if (snap.empty) return null;
    const doc = snap.docs[0];
    return docToModel<Caregiver>(doc.id, doc.data());
  },

  async findByIdWithUser(id: string): Promise<CaregiverWithUser | null> {
    const cg = await this.findById(id);
    if (!cg) return null;
    return enrichWithUser(cg);
  },

  async create(data: {
    user_id: string;
    skills: string[];
    languages: string[];
    location_lat?: number;
    location_lng?: number;
    location_address?: string;
    id_proof_url?: string;
    photo_url?: string;
    hourly_rate?: number;
    bio?: string;
  }): Promise<Caregiver> {
    const id = newId();
    const ts = now();
    const autoApprove = env.AUTO_APPROVE_CAREGIVERS === 'true';
    const doc = {
      user_id: data.user_id,
      skills: data.skills,
      languages: data.languages,
      rating: 0,
      rating_count: 0,
      availability: true,
      location_lat: data.location_lat ?? null,
      location_lng: data.location_lng ?? null,
      location_address: data.location_address ?? null,
      verified: autoApprove,
      approval_status: autoApprove ? 'approved' : 'pending',
      id_proof_url: data.id_proof_url ?? null,
      photo_url: data.photo_url ?? null,
      hourly_rate: data.hourly_rate ?? null,
      bio: data.bio ?? null,
      created_at: ts,
      updated_at: ts,
    };
    await getDb().collection(COL).doc(id).set(doc);
    return docToModel<Caregiver>(id, doc);
  },

  async update(
    id: string,
    data: Partial<{
      skills: string[];
      languages: string[];
      availability: boolean;
      location_lat: number;
      location_lng: number;
      location_address: string;
      id_proof_url: string;
      photo_url: string;
      hourly_rate: number;
      bio: string;
      verified: boolean;
      approval_status: 'pending' | 'approved' | 'rejected';
      rating: number;
      rating_count: number;
    }>
  ): Promise<Caregiver | null> {
    const updates: Record<string, unknown> = { updated_at: now() };
    for (const [key, val] of Object.entries(data)) {
      if (val !== undefined) updates[key] = val;
    }
    await getDb().collection(COL).doc(id).update(updates);
    return this.findById(id);
  },

  async listAvailable(filters: {
    skills?: string[];
    verified?: boolean;
    available?: boolean;
    lat?: number;
    lng?: number;
    radiusKm?: number;
    page?: number;
    limit?: number;
  }): Promise<{ data: CaregiverWithUser[]; total: number }> {
    const db = getDb();
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const offset = (page - 1) * limit;

    const buildQuery = (approvedOnly: boolean): Query<DocumentData> => {
      let q: Query<DocumentData> = db.collection(COL);
      // Only show approved caregivers unless overridden
      if (approvedOnly) {
        q = q.where('approval_status', '==', 'approved');
      }
      if (filters.available !== undefined) {
        q = q.where('availability', '==', filters.available);
      }
      if (filters.verified !== undefined) {
        q = q.where('verified', '==', filters.verified);
      }
      if (filters.skills && filters.skills.length > 0) {
        q = q.where('skills', 'array-contains-any', filters.skills.slice(0, 10));
      }
      return q;
    };

    // First try approved-only
    let q = buildQuery(true);
    let countSnap = await q.count().get();
    let total = countSnap.data().count;

    // Fallback: if no approved caregivers exist (demo/fresh install), return all
    if (total === 0) {
      q = buildQuery(false);
      countSnap = await q.count().get();
      total = countSnap.data().count;
    }

    const pageSnap = await q.orderBy('rating', 'desc').limit(offset + limit).get();
    const docs = pageSnap.docs.slice(offset);
    const caregivers = docs.map((d: any) => docToModel<Caregiver>(d.id, d.data()));
    const data = await Promise.all(caregivers.map(enrichWithUser));
    return { data, total };
  },

  async countAll(): Promise<number> {
    const snap = await getDb().collection(COL).count().get();
    return snap.data().count;
  },

  async countVerified(): Promise<number> {
    const snap = await getDb().collection(COL).where('verified', '==', true).count().get();
    return snap.data().count;
  },

  async countPendingVerification(): Promise<number> {
    const snap = await getDb().collection(COL).where('verified', '==', false).count().get();
    return snap.data().count;
  },

  async listPendingVerification(page = 1, limit = 20): Promise<CaregiverWithUser[]> {
    const offset = (page - 1) * limit;
    const snap = await getDb()
      .collection(COL)
      .where('approval_status', '==', 'pending')
      .orderBy('created_at', 'asc')
      .limit(offset + limit)
      .get();

    const docs = snap.docs.slice(offset);
    const caregivers = docs.map((d: any) => docToModel<Caregiver>(d.id, d.data()));
    return Promise.all(caregivers.map(enrichWithUser));
  },
};

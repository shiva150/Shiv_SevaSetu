import type { Query, DocumentData } from 'firebase-admin/firestore';
import { getDb } from '../config/firestore.js';
import { User, UserPublic } from '../models/index.js';
import { docToModel, newId, now } from './_helpers.js';

const COL = 'users';

function toPublic(user: User): UserPublic {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password_hash, ...pub } = user;
  return pub;
}

export const userRepository = {
  async findById(id: string): Promise<User | null> {
    const snap = await getDb().collection(COL).doc(id).get();
    if (!snap.exists) return null;
    return docToModel<User>(snap.id, snap.data()!);
  },

  async findByIdPublic(id: string): Promise<UserPublic | null> {
    const user = await this.findById(id);
    return user ? toPublic(user) : null;
  },

  async findByPhone(phone: string): Promise<User | null> {
    const snap = await getDb().collection(COL).where('phone', '==', phone).limit(1).get();
    if (snap.empty) return null;
    const doc = snap.docs[0];
    return docToModel<User>(doc.id, doc.data());
  },

  async findByEmail(email: string): Promise<User | null> {
    const snap = await getDb().collection(COL).where('email', '==', email).limit(1).get();
    if (snap.empty) return null;
    const doc = snap.docs[0];
    return docToModel<User>(doc.id, doc.data());
  },

  async create(data: {
    phone: string;
    email?: string;
    name: string;
    password_hash: string;
    role: 'caregiver' | 'careseeker' | 'admin';
    language?: string;
  }): Promise<UserPublic> {
    const id = newId();
    const ts = now();
    const doc = {
      phone: data.phone,
      email: data.email ?? null,
      name: data.name,
      password_hash: data.password_hash,
      role: data.role,
      language: data.language ?? 'hindi',
      is_active: true,
      created_at: ts,
      updated_at: ts,
    };
    await getDb().collection(COL).doc(id).set(doc);
    return toPublic(docToModel<User>(id, doc));
  },

  async update(
    id: string,
    data: Partial<Pick<User, 'name' | 'email' | 'language' | 'is_active'>>
  ): Promise<UserPublic | null> {
    const updates: Record<string, unknown> = { updated_at: now() };
    for (const [key, val] of Object.entries(data)) {
      if (val !== undefined) updates[key] = val;
    }
    await getDb().collection(COL).doc(id).update(updates);
    return this.findByIdPublic(id);
  },

  async getOnboarding(id: string): Promise<{ step: User['onboarding_step']; completed: boolean } | null> {
    const snap = await getDb().collection(COL).doc(id).get();
    if (!snap.exists) return null;
    const data = snap.data()!;
    return {
      step: (data['onboarding_step'] ?? null) as User['onboarding_step'],
      completed: (data['onboarding_completed'] ?? false) as boolean,
    };
  },

  async updateOnboarding(
    id: string,
    step: User['onboarding_step'],
    completed = false
  ): Promise<void> {
    const updates: Record<string, unknown> = {
      onboarding_step: step,
      onboarding_completed: completed,
      updated_at: now(),
    };
    await getDb().collection(COL).doc(id).update(updates);
  },

  async countByRole(role?: string): Promise<number> {
    let q: Query<DocumentData> = getDb().collection(COL);
    if (role) q = q.where('role', '==', role);
    const snap = await q.count().get();
    return snap.data().count;
  },
};

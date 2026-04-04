import type { Query, DocumentData } from 'firebase-admin/firestore';
import { getDb } from '../config/firestore.js';
import { Booking } from '../models/index.js';
import { docToModel, newId, now } from './_helpers.js';

const COL = 'bookings';

export const bookingRepository = {
  async findById(id: string): Promise<Booking | null> {
    const snap = await getDb().collection(COL).doc(id).get();
    if (!snap.exists) return null;
    return docToModel<Booking>(snap.id, snap.data()!);
  },

  async create(data: {
    seeker_id: string;
    seeker_name: string;
    caregiver_id: string;
    caregiver_user_id: string;
    caregiver_name: string;
    description?: string;
    hours_needed?: number;
    amount?: number;
  }): Promise<Booking> {
    const id = newId();
    const ts = now();
    const doc = {
      seeker_id: data.seeker_id,
      seeker_name: data.seeker_name,
      caregiver_id: data.caregiver_id,
      caregiver_user_id: data.caregiver_user_id,
      caregiver_name: data.caregiver_name,
      status: 'pending' as const,
      description: data.description ?? null,
      hours_needed: data.hours_needed ?? null,
      amount: data.amount ?? null,
      created_at: ts,
      updated_at: ts,
    };
    await getDb().collection(COL).doc(id).set(doc);
    return docToModel<Booking>(id, doc);
  },

  async updateStatus(id: string, status: Booking['status']): Promise<Booking | null> {
    await getDb().collection(COL).doc(id).update({ status, updated_at: now() });
    return this.findById(id);
  },

  async findBySeekerId(seekerId: string): Promise<Booking[]> {
    const snap = await getDb()
      .collection(COL)
      .where('seeker_id', '==', seekerId)
      .orderBy('created_at', 'desc')
      .limit(50)
      .get();
    return snap.docs.map((d: any) => docToModel<Booking>(d.id, d.data()));
  },

  async findByCaregiverUserId(caregiverUserId: string, status?: Booking['status']): Promise<Booking[]> {
    let q: Query<DocumentData> = getDb()
      .collection(COL)
      .where('caregiver_user_id', '==', caregiverUserId);
    if (status) q = q.where('status', '==', status);
    const snap = await q.orderBy('created_at', 'desc').limit(50).get();
    return snap.docs.map((d: any) => docToModel<Booking>(d.id, d.data()));
  },
};

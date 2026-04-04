import { getDb } from '../config/firestore.js';
import { SosAlert } from '../models/index.js';
import { docToModel, newId, now } from './_helpers.js';

const COL = 'sos_alerts';

export interface SosAlertWithUser extends SosAlert {
  user_name: string;
  user_phone: string;
}

async function enrichWithUser(alert: SosAlert): Promise<SosAlertWithUser> {
  const userSnap = await getDb().collection('users').doc(alert.user_id).get();
  const u = userSnap.data() ?? {};
  return {
    ...alert,
    user_name: u['name'] ?? '',
    user_phone: u['phone'] ?? '',
  };
}

export const sosRepository = {
  async findById(id: string): Promise<SosAlert | null> {
    const snap = await getDb().collection(COL).doc(id).get();
    if (!snap.exists) return null;
    return docToModel<SosAlert>(snap.id, snap.data()!);
  },

  async create(data: {
    user_id: string;
    session_id?: string;
    location_lat: number;
    location_lng: number;
    address?: string;
  }): Promise<SosAlert> {
    const id = newId();
    const ts = now();
    const doc = {
      user_id: data.user_id,
      session_id: data.session_id ?? null,
      location_lat: data.location_lat,
      location_lng: data.location_lng,
      address: data.address ?? null,
      status: 'active',
      created_at: ts,
      resolved_at: null,
    };
    await getDb().collection(COL).doc(id).set(doc);
    return docToModel<SosAlert>(id, doc);
  },

  async updateStatus(id: string, status: 'acknowledged' | 'resolved'): Promise<SosAlert | null> {
    const updates: Record<string, unknown> = { status };
    if (status === 'resolved') updates['resolved_at'] = now();
    await getDb().collection(COL).doc(id).update(updates);
    return this.findById(id);
  },

  async listActive(): Promise<SosAlertWithUser[]> {
    const snap = await getDb()
      .collection(COL)
      .where('status', '==', 'active')
      .orderBy('created_at', 'desc')
      .get();
    const alerts = snap.docs.map((d: any) => docToModel<SosAlert>(d.id, d.data()));
    return Promise.all(alerts.map(enrichWithUser));
  },

  async listAll(page = 1, limit = 20): Promise<{ data: SosAlertWithUser[]; total: number }> {
    const db = getDb();
    const countSnap = await db.collection(COL).count().get();
    const total = countSnap.data().count;

    const offset = (page - 1) * limit;
    const snap = await db
      .collection(COL)
      .orderBy('created_at', 'desc')
      .limit(offset + limit)
      .get();

    const alerts = snap.docs.slice(offset).map((d: any) => docToModel<SosAlert>(d.id, d.data()));
    const data = await Promise.all(alerts.map(enrichWithUser));
    return { data, total };
  },

  async countActive(): Promise<number> {
    const snap = await getDb().collection(COL).where('status', '==', 'active').count().get();
    return snap.data().count;
  },
};

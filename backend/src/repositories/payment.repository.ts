import { getDb } from '../config/firestore.js';
import { Payment } from '../models/index.js';
import { docToModel, newId, now } from './_helpers.js';

const COL = 'payments';

export const paymentRepository = {
  async findById(id: string): Promise<Payment | null> {
    const snap = await getDb().collection(COL).doc(id).get();
    if (!snap.exists) return null;
    return docToModel<Payment>(snap.id, snap.data()!);
  },

  async findBySessionId(sessionId: string): Promise<Payment | null> {
    const snap = await getDb().collection(COL).where('session_id', '==', sessionId).limit(1).get();
    if (snap.empty) return null;
    const doc = snap.docs[0];
    return docToModel<Payment>(doc.id, doc.data());
  },

  async create(data: {
    session_id: string;
    payer_id: string;
    payee_id: string;
    amount: number;
  }): Promise<Payment> {
    const id = newId();
    const ts = now();
    const doc = {
      session_id: data.session_id,
      payer_id: data.payer_id,
      payee_id: data.payee_id,
      amount: data.amount,
      status: 'locked',
      locked_at: ts,
      released_at: null,
      created_at: ts,
      updated_at: ts,
    };
    await getDb().collection(COL).doc(id).set(doc);
    return docToModel<Payment>(id, doc);
  },

  async updateStatus(id: string, status: string): Promise<Payment | null> {
    const updates: Record<string, unknown> = { status, updated_at: now() };
    if (status === 'released') updates['released_at'] = now();
    await getDb().collection(COL).doc(id).update(updates);
    return this.findById(id);
  },

  async totalRevenue(): Promise<number> {
    // Firestore sum() aggregate
    const snap = await getDb()
      .collection(COL)
      .where('status', 'in', ['completed', 'released'])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .aggregate({ total: (getDb() as any).constructor.AggregateField?.sum('amount') ?? { sum: 'amount' } } as never)
      .get()
      .catch(() => null);

    if (snap) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (snap as any).data().total ?? 0;
    }

    // Fallback: fetch all and sum in memory (for SDKs without aggregate support)
    const allSnap = await getDb()
      .collection(COL)
      .where('status', 'in', ['completed', 'released'])
      .get();
    return allSnap.docs.reduce((sum: number, d: any) => sum + (d.data()['amount'] ?? 0), 0);
  },

  async listByUser(userId: string, page = 1, limit = 20): Promise<{ data: Payment[]; total: number }> {
    // Firestore can't do OR on different fields in one query — run two and merge
    const db = getDb();
    const [payerSnap, payeeSnap] = await Promise.all([
      db.collection(COL).where('payer_id', '==', userId).get(),
      db.collection(COL).where('payee_id', '==', userId).get(),
    ]);

    // Deduplicate (a payment should never match both, but be safe)
    const seen = new Set<string>();
    const all: Payment[] = [];
    for (const doc of [...payerSnap.docs, ...payeeSnap.docs]) {
      if (!seen.has(doc.id)) {
        seen.add(doc.id);
        all.push(docToModel<Payment>(doc.id, doc.data()));
      }
    }

    // Sort descending by created_at
    all.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const offset = (page - 1) * limit;
    return { data: all.slice(offset, offset + limit), total: all.length };
  },
};

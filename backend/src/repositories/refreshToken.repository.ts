import { getDb } from '../config/firestore.js';
import { RefreshToken } from '../models/index.js';
import { docToModel, now } from './_helpers.js';

const COL = 'refresh_tokens';

export const refreshTokenRepository = {
  async create(data: {
    user_id: string;
    token_hash: string;
    expires_at: Date;
  }): Promise<RefreshToken> {
    // Document ID = token_hash for O(1) lookup and deletion
    const ref = getDb().collection(COL).doc(data.token_hash);
    const ts = now();
    const doc = {
      user_id: data.user_id,
      token_hash: data.token_hash,
      expires_at: data.expires_at,
      created_at: ts,
    };
    await ref.set(doc);
    return docToModel<RefreshToken>(data.token_hash, doc);
  },

  async findByHash(tokenHash: string): Promise<RefreshToken | null> {
    const snap = await getDb().collection(COL).doc(tokenHash).get();
    if (!snap.exists) return null;
    const token = docToModel<RefreshToken>(snap.id, snap.data()!);
    // Check expiry in application layer (no Firestore TTL index for this)
    if (new Date(token.expires_at) <= new Date()) {
      await snap.ref.delete();
      return null;
    }
    return token;
  },

  async deleteByHash(tokenHash: string): Promise<void> {
    await getDb().collection(COL).doc(tokenHash).delete();
  },

  async deleteAllForUser(userId: string): Promise<void> {
    const snap = await getDb().collection(COL).where('user_id', '==', userId).get();
    const batch = getDb().batch();
    for (const doc of snap.docs) {
      batch.delete(doc.ref);
    }
    await batch.commit();
  },

  async deleteExpired(): Promise<number> {
    const snap = await getDb()
      .collection(COL)
      .where('expires_at', '<=', new Date())
      .get();
    const batch = getDb().batch();
    for (const doc of snap.docs) {
      batch.delete(doc.ref);
    }
    await batch.commit();
    return snap.size;
  },
};

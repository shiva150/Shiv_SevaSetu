import crypto from 'crypto';
import type { Transaction } from 'firebase-admin/firestore';
import { getDb } from '../config/firestore.js';
import { sessionRepository } from '../repositories/session.repository.js';
import { matchRepository } from '../repositories/match.repository.js';
import { careRequestRepository } from '../repositories/careRequest.repository.js';
import { caregiverRepository } from '../repositories/caregiver.repository.js';
import { paymentRepository } from '../repositories/payment.repository.js';
import { AppError } from '../middleware/error.middleware.js';
import { Session } from '../models/index.js';
import { SessionWithDetails } from '../repositories/session.repository.js';

export const sessionService = {
  /**
   * Start a session from an accepted match.
   * Creates session + locks escrow payment atomically via Firestore transaction.
   */
  async startSession(matchId: string, userId: string, notes?: string): Promise<Session> {
    const match = await matchRepository.findById(matchId);
    if (!match) throw new AppError(404, 'Match not found', 'NOT_FOUND');
    if (match.status !== 'accepted') {
      throw new AppError(400, 'Match must be accepted before starting a session', 'MATCH_NOT_ACCEPTED');
    }

    const request = await careRequestRepository.findById(match.request_id);
    if (!request) throw new AppError(404, 'Care request not found', 'NOT_FOUND');
    if (request.user_id !== userId) {
      throw new AppError(403, 'Only the care seeker can start a session', 'FORBIDDEN');
    }

    const caregiver = await caregiverRepository.findById(match.caregiver_id);
    if (!caregiver) throw new AppError(404, 'Caregiver not found', 'NOT_FOUND');

    // Pre-fetch user names for denormalization
    const db = getDb();
    const [cgUserSnap, seekerUserSnap] = await Promise.all([
      db.collection('users').doc(caregiver.user_id).get(),
      db.collection('users').doc(request.user_id).get(),
    ]);

    const hours = request.hours_needed ? Number(request.hours_needed) : 1;
    const rate = caregiver.hourly_rate ? Number(caregiver.hourly_rate) : 0;
    const amount = hours * rate;

    const sessionId = crypto.randomUUID();
    const paymentId = amount > 0 ? crypto.randomUUID() : null;
    const ts = new Date();

    const sessionDoc = {
      caregiver_id: match.caregiver_id,
      request_id: match.request_id,
      match_id: matchId,
      caregiver_user_id: caregiver.user_id,
      careseeker_user_id: request.user_id,
      caregiver_name: cgUserSnap.data()?.['name'] ?? null,
      seeker_name: seekerUserSnap.data()?.['name'] ?? null,
      request_description: request.description ?? null,
      start_time: ts,
      end_time: null,
      status: 'active',
      payment_status: amount > 0 ? 'locked' : 'pending',
      notes: notes ?? null,
      created_at: ts,
      updated_at: ts,
    };

    await db.runTransaction(async (t: Transaction) => {
      // Write session
      t.set(db.collection('sessions').doc(sessionId), sessionDoc);

      // Lock escrow
      if (amount > 0 && paymentId) {
        t.set(db.collection('payments').doc(paymentId), {
          session_id: sessionId,
          payer_id: request.user_id,
          payee_id: caregiver.user_id,
          amount,
          status: 'locked',
          locked_at: ts,
          released_at: null,
          created_at: ts,
          updated_at: ts,
        });
      }

      // Update care request status
      t.update(db.collection('care_requests').doc(match.request_id), {
        status: 'active',
        updated_at: ts,
      });
    });

    return { id: sessionId, ...sessionDoc } as unknown as Session;
  },

  async completeSession(sessionId: string, userId: string, notes?: string): Promise<Session> {
    const session = await sessionRepository.findByIdWithDetails(sessionId);
    if (!session) throw new AppError(404, 'Session not found', 'NOT_FOUND');
    if (session.status !== 'active') {
      throw new AppError(400, 'Session is not active', 'SESSION_NOT_ACTIVE');
    }

    const request = await careRequestRepository.findById(session.request_id);
    if (!request || request.user_id !== userId) {
      throw new AppError(403, 'Not authorized to complete this session', 'FORBIDDEN');
    }

    const payment = await paymentRepository.findBySessionId(sessionId);
    const ts = new Date();
    const db = getDb();

    const sessionUpdates: Record<string, unknown> = {
      status: 'completed',
      end_time: ts,
      updated_at: ts,
    };
    if (notes) sessionUpdates['notes'] = notes;
    if (payment?.status === 'locked') {
      sessionUpdates['payment_status'] = 'completed';
    }

    await db.runTransaction(async (t: Transaction) => {
      t.update(db.collection('sessions').doc(sessionId), sessionUpdates);

      if (payment?.status === 'locked') {
        t.update(db.collection('payments').doc(payment.id), {
          status: 'completed',
          updated_at: ts,
        });
      }

      t.update(db.collection('care_requests').doc(session.request_id), {
        status: 'completed',
        updated_at: ts,
      });
    });

    return { ...session, ...sessionUpdates } as unknown as Session;
  },

  async cancelSession(sessionId: string, userId: string): Promise<Session> {
    const session = await sessionRepository.findById(sessionId);
    if (!session) throw new AppError(404, 'Session not found', 'NOT_FOUND');

    const [request, caregiver] = await Promise.all([
      careRequestRepository.findById(session.request_id),
      caregiverRepository.findById(session.caregiver_id),
    ]);

    const isSeeker = request?.user_id === userId;
    const isCaregiverUser = caregiver?.user_id === userId;
    if (!isSeeker && !isCaregiverUser) {
      throw new AppError(403, 'Not authorized', 'FORBIDDEN');
    }
    if (!['scheduled', 'active'].includes(session.status)) {
      throw new AppError(400, 'Cannot cancel this session', 'CANCEL_FAILED');
    }

    const payment = await paymentRepository.findBySessionId(sessionId);
    const ts = new Date();
    const db = getDb();

    const sessionUpdates: Record<string, unknown> = { status: 'cancelled', updated_at: ts };
    if (payment?.status === 'locked') {
      sessionUpdates['payment_status'] = 'refunded';
    }

    await db.runTransaction(async (t: Transaction) => {
      t.update(db.collection('sessions').doc(sessionId), sessionUpdates);

      if (payment?.status === 'locked') {
        t.update(db.collection('payments').doc(payment.id), {
          status: 'refunded',
          released_at: ts,
          updated_at: ts,
        });
      }
    });

    return { ...session, ...sessionUpdates } as unknown as Session;
  },

  async getById(sessionId: string): Promise<SessionWithDetails> {
    const session = await sessionRepository.findByIdWithDetails(sessionId);
    if (!session) throw new AppError(404, 'Session not found', 'NOT_FOUND');
    return session;
  },

  async listByUser(
    userId: string,
    role: 'caregiver' | 'careseeker',
    filters: { status?: string; page?: number; limit?: number }
  ) {
    return sessionRepository.listByUser(userId, role, filters);
  },
};

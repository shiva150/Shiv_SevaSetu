import type { Transaction } from 'firebase-admin/firestore';
import { getDb } from '../config/firestore.js';
import { ratingRepository } from '../repositories/rating.repository.js';
import { caregiverRepository } from '../repositories/caregiver.repository.js';
import { sessionRepository } from '../repositories/session.repository.js';
import { careRequestRepository } from '../repositories/careRequest.repository.js';
import { AppError } from '../middleware/error.middleware.js';
import { Rating } from '../models/index.js';

/**
 * Trust system from PRD:
 *   T = 0.3 * new_rating + 0.7 * old_rating
 * Exponential smoothing — recent ratings have 30% influence.
 */
const ALPHA = 0.3;
const BETA = 0.7;

export const ratingService = {
  async createRating(
    userId: string,
    input: { session_id: string; score: number; feedback?: string }
  ): Promise<Rating> {
    const session = await sessionRepository.findById(input.session_id);
    if (!session) throw new AppError(404, 'Session not found', 'NOT_FOUND');
    if (session.status !== 'completed') {
      throw new AppError(400, 'Can only rate completed sessions', 'SESSION_NOT_COMPLETED');
    }

    const request = await careRequestRepository.findById(session.request_id);
    if (!request || request.user_id !== userId) {
      throw new AppError(403, 'Only the care seeker can rate', 'FORBIDDEN');
    }

    const existing = await ratingRepository.findBySessionId(input.session_id);
    if (existing) throw new AppError(409, 'Session already rated', 'ALREADY_RATED');

    const caregiver = await caregiverRepository.findById(session.caregiver_id);
    if (!caregiver) throw new AppError(404, 'Caregiver not found', 'NOT_FOUND');

    const oldRating = Number(caregiver.rating);
    const newRating =
      caregiver.rating_count === 0
        ? input.score
        : ALPHA * input.score + BETA * oldRating;
    const roundedRating = Math.round(newRating * 100) / 100;

    const ratingId = crypto.randomUUID();
    const ts = new Date();
    const db = getDb();

    await db.runTransaction(async (t: Transaction) => {
      // Insert rating document
      t.set(db.collection('ratings').doc(ratingId), {
        session_id: input.session_id,
        rater_id: userId,
        caregiver_id: caregiver.id,
        score: input.score,
        feedback: input.feedback ?? null,
        created_at: ts,
      });

      // Update caregiver rating with exponential smoothing
      t.update(db.collection('caregivers').doc(caregiver.id), {
        rating: roundedRating,
        rating_count: caregiver.rating_count + 1,
        updated_at: ts,
      });
    });

    return {
      id: ratingId,
      session_id: input.session_id,
      rater_id: userId,
      caregiver_id: caregiver.id,
      score: input.score,
      feedback: input.feedback ?? null,
      created_at: ts,
    };
  },

  async getSessionRating(sessionId: string): Promise<Rating | null> {
    return ratingRepository.findBySessionId(sessionId);
  },

  async getCaregiverRatings(caregiverId: string): Promise<Rating[]> {
    return ratingRepository.listByCaregiver(caregiverId);
  },
};

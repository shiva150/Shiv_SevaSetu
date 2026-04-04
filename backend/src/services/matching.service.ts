import { caregiverRepository } from '../repositories/caregiver.repository.js';
import { careRequestRepository } from '../repositories/careRequest.repository.js';
import { matchRepository } from '../repositories/match.repository.js';
import { distanceScore } from '../utils/haversine.js';
import { AppError } from '../middleware/error.middleware.js';
import { CaregiverWithUser, CareRequest, Match } from '../models/index.js';

/**
 * Matching Engine
 *
 * Score formula (from PRD):
 *   score = 0.4 * skill_match + 0.2 * rating + 0.2 * distance + 0.2 * language
 */

const WEIGHTS = {
  SKILL: 0.4,
  RATING: 0.2,
  DISTANCE: 0.2,
  LANGUAGE: 0.2,
};

function computeSkillScore(caregiverSkills: string[], requiredSkills: string[]): number {
  if (requiredSkills.length === 0) return 0.5;
  const normalizedRequired = requiredSkills.map(s => s.toLowerCase().trim());
  const normalizedCaregiver = caregiverSkills.map(s => s.toLowerCase().trim());

  let matched = 0;
  for (const req of normalizedRequired) {
    if (normalizedCaregiver.some(cs => cs.includes(req) || req.includes(cs))) {
      matched++;
    }
  }
  return matched / normalizedRequired.length;
}

function computeRatingScore(rating: number, ratingCount: number): number {
  // Bayesian average: guards against low-count inflated ratings
  const globalAvg = 3.5;
  const minReviews = 5;
  const adjusted = (ratingCount * rating + minReviews * globalAvg) / (ratingCount + minReviews);
  return adjusted / 5; // normalize to 0–1
}

function computeDistanceScoreValue(
  cgLat: number | null,
  cgLng: number | null,
  reqLat: number | null,
  reqLng: number | null
): number {
  if (cgLat == null || cgLng == null || reqLat == null || reqLng == null) return 0.5;
  return distanceScore(cgLat, cgLng, reqLat, reqLng, 100);
}

function computeLanguageScore(caregiverLangs: string[], preferredLang: string | null): number {
  if (!preferredLang) return 0.5;
  const normalized = preferredLang.toLowerCase().trim();
  return caregiverLangs.some(l => l.toLowerCase().trim() === normalized) ? 1.0 : 0.0;
}

export const matchingService = {
  /**
   * Runs the matching engine for a care request.
   * Finds all available, verified caregivers, scores them, and persists top N matches.
   */
  async matchRequest(requestId: string, limit: number = 10): Promise<Match[]> {
    const request = await careRequestRepository.findById(requestId);
    if (!request) {
      throw new AppError(404, 'Care request not found', 'NOT_FOUND');
    }
    if (request.status !== 'open') {
      throw new AppError(400, 'Request is not open for matching', 'REQUEST_NOT_OPEN');
    }

    // Fetch available, verified caregivers with DB filtering
    const { data: caregivers } = await caregiverRepository.listAvailable({
      available: true,
      verified: true,
      skills: request.skills_required as string[],
      lat: request.location_lat ? Number(request.location_lat) : undefined,
      lng: request.location_lng ? Number(request.location_lng) : undefined,
      radiusKm: 100,
      page: 1,
      limit: 200, // upper bound for scoring pool
    });

    if (caregivers.length === 0) {
      throw new AppError(404, 'No matching caregivers found', 'NO_MATCHES');
    }

    // Score each caregiver
    const scored = caregivers.map(cg => {
      const skillScore = computeSkillScore(
        cg.skills as string[],
        request.skills_required as string[]
      );
      const ratingScore = computeRatingScore(Number(cg.rating), cg.rating_count);
      const dScore = computeDistanceScoreValue(
        cg.location_lat ? Number(cg.location_lat) : null,
        cg.location_lng ? Number(cg.location_lng) : null,
        request.location_lat ? Number(request.location_lat) : null,
        request.location_lng ? Number(request.location_lng) : null
      );
      const langScore = computeLanguageScore(
        cg.languages as string[],
        request.preferred_language
      );

      const totalScore =
        WEIGHTS.SKILL * skillScore +
        WEIGHTS.RATING * ratingScore +
        WEIGHTS.DISTANCE * dScore +
        WEIGHTS.LANGUAGE * langScore;

      return {
        caregiver_id: cg.id,
        request_id: requestId,
        score: Math.round(totalScore * 10000) / 10000,
        skill_score: Math.round(skillScore * 10000) / 10000,
        rating_score: Math.round(ratingScore * 10000) / 10000,
        distance_score: Math.round(dScore * 10000) / 10000,
        language_score: Math.round(langScore * 10000) / 10000,
      };
    });

    // Sort by score descending, take top N
    scored.sort((a, b) => b.score - a.score);
    const topMatches = scored.slice(0, limit);

    // Persist to DB
    const matches = await matchRepository.createBatch(topMatches);

    // Update request status to 'matched'
    await careRequestRepository.updateStatus(requestId, 'matched');

    return matches;
  },

  async getMatchesForRequest(requestId: string): Promise<Match[]> {
    return matchRepository.listByRequest(requestId);
  },

  async getMatchesForCaregiver(caregiverId: string, status?: string): Promise<Match[]> {
    return matchRepository.listByCaregiver(caregiverId, status);
  },

  async respondToMatch(matchId: string, caregiverUserId: string, status: 'accepted' | 'rejected'): Promise<Match> {
    const match = await matchRepository.findById(matchId);
    if (!match) {
      throw new AppError(404, 'Match not found', 'NOT_FOUND');
    }

    // Verify the caregiver owns this match
    const caregiver = await caregiverRepository.findById(match.caregiver_id);
    if (!caregiver || caregiver.user_id !== caregiverUserId) {
      throw new AppError(403, 'Not authorized', 'FORBIDDEN');
    }

    if (match.status !== 'pending') {
      throw new AppError(400, `Match is already '${match.status}'`, 'INVALID_STATUS');
    }

    const updated = await matchRepository.updateStatus(matchId, status);
    if (!updated) {
      throw new AppError(500, 'Failed to update match', 'UPDATE_FAILED');
    }

    // If accepted, expire other pending matches for this request
    if (status === 'accepted') {
      await matchRepository.expirePendingForRequest(match.request_id, matchId);
      await careRequestRepository.updateStatus(match.request_id, 'active');
    }

    return updated;
  },
};

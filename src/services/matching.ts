import { CaregiverProfile, MatchResult, SeekerRequest } from '../types';

const WEIGHTS = {
  SKILL_MATCH: 0.35,
  DISTANCE: 0.20,
  RATING: 0.20,
  RELIABILITY: 0.25,
};

function computeSkillMatch(caregiverSkills: string[], requestedSkills: string[]): number {
  if (requestedSkills.length === 0) return 0.7;
  const normalizedRequest = requestedSkills.map(s => s.toLowerCase().trim());
  const normalizedCaregiver = caregiverSkills.map(s => s.toLowerCase().trim());

  let matched = 0;
  for (const req of normalizedRequest) {
    if (normalizedCaregiver.some(cs => cs.includes(req) || req.includes(cs))) {
      matched++;
    }
  }
  return matched / normalizedRequest.length;
}

function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function computeDistanceScore(
  caregiverLoc: { lat: number; lng: number },
  seekerLoc?: { lat: number; lng: number }
): number {
  if (!seekerLoc) return 0.7;
  const distance = haversineDistance(
    caregiverLoc.lat, caregiverLoc.lng,
    seekerLoc.lat, seekerLoc.lng
  );
  // 1.0 at 0km, decays to 0 at 100km
  return Math.max(0, 1 - distance / 100);
}

function computeRatingScore(rating: number, reviewCount: number): number {
  // Bayesian average — guards against low-review inflated ratings
  const globalAvg = 4.0;
  const minReviews = 10;
  const adjusted = (reviewCount * rating + minReviews * globalAvg) / (reviewCount + minReviews);
  return adjusted / 5;
}

function computeReliabilityScore(caregiver: CaregiverProfile): number {
  const completionRate = caregiver.completionRate ?? 0.85;
  const cancellationRate = caregiver.cancellationRate ?? 0.05;
  const responseTime = caregiver.responseTimeMinutes ?? 30;

  const completionScore = completionRate; // 0-1, higher is better
  const cancellationScore = 1 - Math.min(cancellationRate * 5, 1); // 20%+ cancellation → 0
  const responseScore = Math.max(0, 1 - responseTime / 120); // 2hrs+ → 0

  return completionScore * 0.4 + cancellationScore * 0.35 + responseScore * 0.25;
}

function generateExplanation(
  caregiver: CaregiverProfile,
  breakdown: MatchResult['breakdown'],
  request: SeekerRequest
): string {
  const reasons: string[] = [];

  if (breakdown.skillMatch >= 0.8) {
    const matched = request.skills.filter(s =>
      caregiver.skills.some(cs => cs.toLowerCase().includes(s.toLowerCase()))
    );
    if (matched.length > 0) {
      reasons.push(`Excellent skill match in ${matched.join(', ')}`);
    } else {
      reasons.push('Strong skill alignment with your needs');
    }
  } else if (breakdown.skillMatch >= 0.5) {
    reasons.push('Good skill coverage for your care requirements');
  }

  if (breakdown.distanceScore >= 0.8) {
    reasons.push('Located very close to your area');
  } else if (breakdown.distanceScore >= 0.5) {
    reasons.push('Within reasonable travel distance');
  }

  if (caregiver.rating >= 4.8 && caregiver.reviewCount > 20) {
    reasons.push(`Top-rated (${caregiver.rating.toFixed(1)}/5 from ${caregiver.reviewCount} reviews)`);
  } else if (caregiver.rating >= 4.5) {
    reasons.push(`Well-rated by families (${caregiver.rating.toFixed(1)}/5)`);
  }

  if (breakdown.reliabilityScore >= 0.85) {
    reasons.push('Excellent reliability record');
  } else if (breakdown.reliabilityScore >= 0.7) {
    reasons.push('Good reliability and response time');
  }

  if (caregiver.availability === 'available') {
    reasons.push('Available for immediate booking');
  }

  if (reasons.length === 0) {
    reasons.push('Verified caregiver with relevant experience');
  }

  return reasons.slice(0, 3).join('. ') + '.';
}

export function parseSearchQuery(query: string): SeekerRequest {
  const q = query.toLowerCase().trim();
  const skills: string[] = [];
  const skillKeywords = [
    'elderly care', 'patient care', 'childcare', 'infant care',
    'companionship', 'medical', 'first aid', 'cooking', 'cleaning',
    'physiotherapy', 'dementia', 'post-surgery', 'medication',
    'nutrition', 'mobility', 'bedridden',
  ];

  for (const skill of skillKeywords) {
    if (q.includes(skill)) {
      skills.push(skill.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));
    }
  }

  // Broader category matching
  if (q.includes('elder') && !skills.some(s => s.includes('Elder'))) skills.push('Elderly Care');
  if (q.includes('child') && !skills.some(s => s.includes('Child'))) skills.push('Childcare');
  if (q.includes('patient') && !skills.some(s => s.includes('Patient'))) skills.push('Patient Care');
  if (q.includes('companion')) skills.push('Companionship');
  if (q.includes('medical') && !skills.some(s => s.includes('Medical'))) skills.push('Medical Assist');

  // Known city coordinates for location-based matching
  const cityCoords: Record<string, { lat: number; lng: number }> = {
    'patna': { lat: 25.5941, lng: 85.1376 },
    'delhi': { lat: 28.7041, lng: 77.1025 },
    'mumbai': { lat: 19.0760, lng: 72.8777 },
    'bangalore': { lat: 12.9716, lng: 77.5946 },
    'ranchi': { lat: 23.3441, lng: 85.3096 },
    'lucknow': { lat: 26.8467, lng: 80.9462 },
    'kolkata': { lat: 22.5726, lng: 88.3639 },
    'chennai': { lat: 13.0827, lng: 80.2707 },
    'hyderabad': { lat: 17.3850, lng: 78.4867 },
    'gaya': { lat: 24.7914, lng: 85.0002 },
    'darbhanga': { lat: 26.1209, lng: 85.8962 },
    'nalanda': { lat: 25.0961, lng: 85.3131 },
    'indore': { lat: 22.7196, lng: 75.8577 },
  };

  let location: { lat: number; lng: number } | undefined;
  for (const [city, coords] of Object.entries(cityCoords)) {
    if (q.includes(city)) {
      location = coords;
      break;
    }
  }

  return { skills, location };
}

export function rankCaregivers(
  caregivers: CaregiverProfile[],
  request: SeekerRequest
): MatchResult[] {
  return caregivers
    .filter(c => c.availability !== 'offline')
    .map(caregiver => {
      const skillMatch = computeSkillMatch(caregiver.skills, request.skills);
      const distanceScore = computeDistanceScore(caregiver.location, request.location);
      const ratingScore = computeRatingScore(caregiver.rating, caregiver.reviewCount);
      const reliabilityScore = computeReliabilityScore(caregiver);

      const score =
        skillMatch * WEIGHTS.SKILL_MATCH +
        distanceScore * WEIGHTS.DISTANCE +
        ratingScore * WEIGHTS.RATING +
        reliabilityScore * WEIGHTS.RELIABILITY;

      const breakdown = { skillMatch, distanceScore, ratingScore, reliabilityScore };

      return {
        caregiver,
        score: Math.round(score * 100),
        breakdown,
        explanation: generateExplanation(caregiver, breakdown, request),
      };
    })
    .sort((a, b) => b.score - a.score);
}

export function getTopMatches(
  caregivers: CaregiverProfile[],
  request: SeekerRequest,
  limit = 20
): MatchResult[] {
  return rankCaregivers(caregivers, request).slice(0, limit);
}

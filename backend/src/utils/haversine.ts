const EARTH_RADIUS_KM = 6371;

export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Returns a score from 0 to 1.
 * 0 km → 1.0, 100 km → 0.0, beyond 100 km → 0.0
 */
export function distanceScore(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
  maxKm = 100
): number {
  const km = haversineDistance(lat1, lng1, lat2, lng2);
  return Math.max(0, 1 - km / maxKm);
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

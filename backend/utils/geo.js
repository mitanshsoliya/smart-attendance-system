/**
 * Geolocation & Distance Calculation Utility
 * Uses the Haversine formula to compute great-circle distance between two GPS coordinates in meters.
 */

function calculateDistanceInMeters(lat1, lon1, lat2, lon2) {
  if (
    lat1 === undefined || lat1 === null ||
    lon1 === undefined || lon1 === null ||
    lat2 === undefined || lat2 === null ||
    lon2 === undefined || lon2 === null
  ) {
    return null;
  }

  const nLat1 = Number(lat1);
  const nLon1 = Number(lon1);
  const nLat2 = Number(lat2);
  const nLon2 = Number(lon2);

  if (isNaN(nLat1) || isNaN(nLon1) || isNaN(nLat2) || isNaN(nLon2)) {
    return null;
  }

  const R = 6371e3; // Earth's radius in meters
  const toRad = (angle) => (angle * Math.PI) / 180;

  const φ1 = toRad(nLat1);
  const φ2 = toRad(nLat2);
  const Δφ = toRad(nLat2 - nLat1);
  const Δλ = toRad(nLon2 - nLon1);

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c); // Distance in meters
}

module.exports = {
  calculateDistanceInMeters,
};

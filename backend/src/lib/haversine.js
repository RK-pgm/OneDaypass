const EARTH_RADIUS_KM = 6371;

function distanceKm(lat1, lng1, lat2, lng2) {
  const radians = (degrees) => (degrees * Math.PI) / 180;
  const dLat = radians(lat2 - lat1);
  const dLng = radians(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(radians(lat1)) * Math.cos(radians(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function distanceM(lat1, lng1, lat2, lng2) {
  return distanceKm(lat1, lng1, lat2, lng2) * 1000;
}

module.exports = { distanceKm, distanceM };

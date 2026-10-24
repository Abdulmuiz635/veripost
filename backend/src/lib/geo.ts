// Great-circle distance in metres between two lat/lng points (Haversine).
export function haversineMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000; // earth radius, metres
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}

// NIPOST reverse-geocode grades confidence by distance. We mirror that for mock.
export function confidenceForDistance(distanceM: number): "high" | "medium" | "low" {
  if (distanceM <= 25) return "high";
  if (distanceM <= 100) return "medium";
  return "low";
}

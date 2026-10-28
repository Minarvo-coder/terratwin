/**
 * Validates that latitude and longitude are valid finite numbers within WGS84 bounds [-90, 90] and [-180, 180].
 * Prevents Leaflet and spatial tools from crashing on missing, NaN, or malformed coordinates.
 */
export function isValidCoordinate(latitude: unknown, longitude: unknown): latitude is number {
  if (typeof latitude !== "number" || typeof longitude !== "number") return false
  if (Number.isNaN(latitude) || Number.isNaN(longitude)) return false
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return false
  return latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180
}

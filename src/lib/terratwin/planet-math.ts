import type { PlanetaryBody, PlanetaryTarget } from "./types"

export interface PlanetaryTelemetry {
  body: PlanetaryBody
  displayName: string
  radiusKm: number
  surfaceGravity: string
  atmosphericPressure: string
  solarDistanceAU: number
  axialTiltDeg: number
  albedo: number
  atmosphereComposition: string
  rotationalPeriod: string
  textureUrl: string
  atmosphereColor?: string
}

export const PLANETARY_SPECS: Record<PlanetaryBody, PlanetaryTelemetry> = {
  mars: {
    body: "mars",
    displayName: "Mars (Sol-4)",
    radiusKm: 3389.5,
    surfaceGravity: "3.72 m/s² (0.38 g)",
    atmosphericPressure: "610 Pa (0.006 atm)",
    solarDistanceAU: 1.524,
    axialTiltDeg: 25.19,
    albedo: 0.15,
    atmosphereComposition: "95.3% CO₂, 2.6% N₂, 1.9% Ar",
    rotationalPeriod: "24h 39m 35s (1 Sol)",
    textureUrl: "/textures/planets/mars.jpg",
    atmosphereColor: "#ff7f50", // Subtle Martian Rayleigh limb glow
  },
  moon: {
    body: "moon",
    displayName: "The Moon (Luna)",
    radiusKm: 1737.4,
    surfaceGravity: "1.62 m/s² (0.166 g)",
    atmosphericPressure: "3 × 10⁻¹⁰ Pa (Vacuum)",
    solarDistanceAU: 1.0,
    axialTiltDeg: 1.54,
    albedo: 0.12,
    atmosphereComposition: "Ultra-high vacuum exosphere",
    rotationalPeriod: "27.32 days (Tidally locked)",
    textureUrl: "/textures/planets/moon.jpg",
    atmosphereColor: undefined, // Scientific honesty: no atmosphere on lunar surface
  },
}

/**
 * Standard spherical trigonometry mapping decimal degrees (lat, lon) to 3D Cartesian coordinates (x, y, z).
 * Perfectly matches Three.js SphereGeometry equirectangular UV mapping:
 * - u in [0, 1] wraps around Y axis from lon -180° to +180°
 * - v in [0, 1] spans from South Pole -90° (0) to North Pole +90° (1)
 */
export function latLonToVector3(
  lat: number,
  lon: number,
  radius: number,
): [number, number, number] {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lon + 180) * (Math.PI / 180)
  const x = -radius * Math.cos(theta) * Math.sin(phi)
  const y = radius * Math.cos(phi)
  const z = radius * Math.sin(theta) * Math.sin(phi)
  return [x, y, z]
}

/**
 * Resolves reliable coordinates for any planetary target, utilizing explicit
 * fields or vetted historical coordinates as fallback.
 */
export function resolveTargetCoordinates(target: PlanetaryTarget): {
  latitude: number
  longitude: number
} {
  if (
    typeof target.latitude === "number" &&
    typeof target.longitude === "number" &&
    !Number.isNaN(target.latitude) &&
    !Number.isNaN(target.longitude)
  ) {
    return { latitude: target.latitude, longitude: target.longitude }
  }

  // Fallback to verified catalog coordinates by target identifier or name
  const id = target.id.toLowerCase()
  const name = target.name.toLowerCase()

  if (id.includes("jezero") || name.includes("jezero")) {
    return { latitude: 18.38, longitude: 77.58 }
  }
  if (id.includes("gale") || name.includes("gale")) {
    return { latitude: -5.36, longitude: 137.86 }
  }
  if (id.includes("meridiani") || name.includes("meridiani")) {
    return { latitude: -1.94, longitude: -5.53 }
  }
  if (id.includes("shackleton") || id.includes("south-polar") || name.includes("shackleton") || name.includes("south polar")) {
    return { latitude: -89.9, longitude: 0.0 }
  }
  if (id.includes("tranquillitatis") || name.includes("tranquillitatis")) {
    return { latitude: 0.67, longitude: 23.47 }
  }

  // Default equatorial origin if no coordinate data exists
  return { latitude: 0, longitude: 0 }
}


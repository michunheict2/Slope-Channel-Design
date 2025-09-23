/**
 * Unit conversion utilities for hydrology calculations
 * All internal calculations use SI units (m, s, kg, etc.)
 */

/**
 * Convert rainfall intensity from mm/h to m/s
 */
export function mmPerHourToMetersPerSecond(mmPerHour: number): number {
  return (mmPerHour / 1000) / 3600; // mm to m, h to s
}

/**
 * Convert hectares to square meters
 */
export function hectaresToSquareMeters(hectares: number): number {
  return hectares * 10000;
}

/**
 * Convert square meters to hectares
 */
export function squareMetersToHectares(squareMeters: number): number {
  return squareMeters / 10000;
}

/**
 * Convert cubic meters per second to liters per second
 */
export function cubicMetersPerSecondToLitersPerSecond(m3PerS: number): number {
  return m3PerS * 1000;
}

/**
 * Convert liters per second to cubic meters per second
 */
export function litersPerSecondToCubicMetersPerSecond(lPerS: number): number {
  return lPerS / 1000;
}

/**
 * Convert meters per second to kilometers per hour
 */
export function metersPerSecondToKilometersPerHour(mPerS: number): number {
  return mPerS * 3.6;
}

/**
 * Convert kilometers per hour to meters per second
 */
export function kilometersPerHourToMetersPerSecond(kmPerH: number): number {
  return kmPerH / 3.6;
}

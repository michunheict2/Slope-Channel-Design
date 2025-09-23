/**
 * Rational Method calculations for peak flow estimation
 */

import { mmPerHourToMetersPerSecond } from "../utils/units";

export interface RationalMethodInputs {
  runoffCoefficient: number; // C (dimensionless)
  rainfallIntensity: number; // i in mm/h
  catchmentArea: number;     // A in m²
}

export interface RationalMethodResult {
  peakFlow: number; // Qp in m³/s
  inputs: RationalMethodInputs;
}

/**
 * Calculate peak flow using the Rational Method
 * Qp = C * i * A
 * where:
 * - Qp = peak flow (m³/s)
 * - C = runoff coefficient (dimensionless)
 * - i = rainfall intensity (m/s) - converted from mm/h
 * - A = catchment area (m²)
 */
export function rationalQ(inputs: RationalMethodInputs): RationalMethodResult {
  const { runoffCoefficient, rainfallIntensity, catchmentArea } = inputs;

  // Validate inputs
  if (runoffCoefficient < 0 || runoffCoefficient > 1) {
    throw new Error("Runoff coefficient must be between 0 and 1");
  }
  
  if (rainfallIntensity < 0) {
    throw new Error("Rainfall intensity must be non-negative");
  }
  
  if (catchmentArea <= 0) {
    throw new Error("Catchment area must be positive");
  }

  // Convert rainfall intensity from mm/h to m/s
  const intensityMS = mmPerHourToMetersPerSecond(rainfallIntensity);

  // Calculate peak flow: Qp = C * i * A
  const peakFlow = runoffCoefficient * intensityMS * catchmentArea;

  return {
    peakFlow,
    inputs,
  };
}

/**
 * Calculate weighted runoff coefficient for multiple surface types
 * C_weighted = Σ(Ci * Ai) / Σ(Ai)
 * where Ci and Ai are the runoff coefficient and area for each surface type
 */
export function calculateWeightedRunoffCoefficient(
  surfaceTypes: Array<{
    runoffCoefficient: number;
    area: number; // m²
  }>
): number {
  if (surfaceTypes.length === 0) {
    throw new Error("At least one surface type is required");
  }

  let totalWeightedCoefficient = 0;
  let totalArea = 0;

  for (const surface of surfaceTypes) {
    if (surface.runoffCoefficient < 0 || surface.runoffCoefficient > 1) {
      throw new Error("Runoff coefficient must be between 0 and 1");
    }
    
    if (surface.area < 0) {
      throw new Error("Area must be non-negative");
    }

    totalWeightedCoefficient += surface.runoffCoefficient * surface.area;
    totalArea += surface.area;
  }

  if (totalArea === 0) {
    throw new Error("Total area cannot be zero");
  }

  return totalWeightedCoefficient / totalArea;
}

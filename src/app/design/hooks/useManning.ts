/**
 * Manning's equation calculations for open channel flow
 */

import { calculateTrapezoidGeometry } from "../utils/geometry";
import { bisection, BisectionOptions } from "../utils/numeric";

export interface ManningInputs {
  bottomWidth: number;    // b in meters
  sideSlope: number;      // z (H:V ratio)
  longitudinalSlope: number; // S (m/m)
  manningN: number;       // Manning's roughness coefficient
  targetFlow: number;     // Q in m³/s
}

export interface ManningResult {
  normalDepth: number;    // y in meters
  area: number;          // A in m²
  perimeter: number;     // P in meters
  hydraulicRadius: number; // R in meters
  calculatedFlow: number; // Q in m³/s
  velocity: number;      // V in m/s
  inputs: ManningInputs;
}

/**
 * Calculate flow capacity using Manning's equation for trapezoidal channel
 * Q = (1/n) * A * R^(2/3) * S^(1/2)
 * where:
 * - Q = flow (m³/s)
 * - n = Manning's roughness coefficient
 * - A = cross-sectional area (m²)
 * - R = hydraulic radius (m)
 * - S = longitudinal slope (m/m)
 */
export function manningFlow(
  depth: number,
  bottomWidth: number,
  sideSlope: number,
  longitudinalSlope: number,
  manningN: number
): number {
  // Validate inputs
  if (depth < 0) {
    throw new Error("Depth must be non-negative");
  }
  
  if (bottomWidth < 0) {
    throw new Error("Bottom width must be non-negative");
  }
  
  if (sideSlope < 0) {
    throw new Error("Side slope must be non-negative");
  }
  
  if (longitudinalSlope < 0) {
    throw new Error("Longitudinal slope must be non-negative");
  }
  
  if (manningN <= 0) {
    throw new Error("Manning's n must be positive");
  }

  // Calculate geometric properties
  const geometry = calculateTrapezoidGeometry(depth, bottomWidth, sideSlope);
  
  // Manning's equation: Q = (1/n) * A * R^(2/3) * S^(1/2)
  const flow = (1 / manningN) * geometry.area * 
               Math.pow(geometry.hydraulicRadius, 2/3) * 
               Math.pow(longitudinalSlope, 1/2);

  return flow;
}

/**
 * Find normal depth for given flow using bisection method
 * Solves: Q(y) - Qtarget = 0
 */
export function normalDepthAndCapacity(
  inputs: ManningInputs,
  options: BisectionOptions = {}
): ManningResult {
  const {
    bottomWidth,
    sideSlope,
    longitudinalSlope,
    manningN,
    targetFlow,
  } = inputs;

  // Validate inputs
  if (targetFlow < 0) {
    throw new Error("Target flow must be non-negative");
  }

  // Set default bisection options
  const bisectionOptions: BisectionOptions = {
    maxIterations: 80,
    tolerance: 1e-4,
    minBound: 1e-4, // 0.1 mm minimum depth
    maxBound: 5.0,  // 5 m maximum depth
    ...options,
  };

  // Define function to solve: f(y) = Q(y) - Qtarget
  const flowDifference = (depth: number): number => {
    try {
      const calculatedFlow = manningFlow(
        depth,
        bottomWidth,
        sideSlope,
        longitudinalSlope,
        manningN
      );
      return calculatedFlow - targetFlow;
    } catch {
      // Return large error for invalid depths
      return 1e6;
    }
  };

  // Use bisection to find normal depth
  const result = bisection(
    flowDifference,
    bisectionOptions.minBound!,
    bisectionOptions.maxBound!,
    bisectionOptions
  );

  const normalDepth = result.root;

  // Calculate final geometric properties and flow
  const geometry = calculateTrapezoidGeometry(
    normalDepth,
    bottomWidth,
    sideSlope
  );

  const calculatedFlow = manningFlow(
    normalDepth,
    bottomWidth,
    sideSlope,
    longitudinalSlope,
    manningN
  );

  const velocity = calculatedFlow / geometry.area;

  return {
    normalDepth,
    area: geometry.area,
    perimeter: geometry.perimeter,
    hydraulicRadius: geometry.hydraulicRadius,
    calculatedFlow,
    velocity,
    inputs,
  };
}

/**
 * Calculate velocity for given flow and channel geometry
 */
export function calculateVelocity(
  flow: number,
  area: number
): number {
  if (flow < 0) {
    throw new Error("Flow must be non-negative");
  }
  
  if (area <= 0) {
    throw new Error("Area must be positive");
  }

  return flow / area;
}

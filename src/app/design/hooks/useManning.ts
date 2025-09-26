/**
 * Manning's equation calculations for open channel flow
 */

import { calculateTrapezoidGeometry, calculateUChannelGeometry } from "../utils/geometry";
// import { bisection, BisectionOptions } from "../utils/numeric";

export interface ManningInputs {
  shape: string;          // Channel shape: "trapezoid" or "u-shaped"
  bottomWidth: number;    // b in meters (for trapezoidal)
  sideSlope: number;      // z (H:V ratio) (for trapezoidal)
  channelDepth: number;   // y in meters (for trapezoidal, user-specified depth)
  topWidth: number;       // T in meters (for trapezoidal, auto-calculated)
  width: number;          // W in meters (for U-shaped)
  radius: number;         // R in meters (for U-shaped)
  flowDepth: number;      // y in meters (for U-shaped, user-specified)
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
 * Calculate flow capacity using Manning's equation for trapezoidal or U-shaped channel
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
  shape: string,
  bottomWidth: number,
  sideSlope: number,
  width: number,
  radius: number,
  flowDepth: number,
  longitudinalSlope: number,
  manningN: number
): number {
  // Validate inputs
  if (depth < 0) {
    throw new Error("Depth must be non-negative");
  }
  
  if (longitudinalSlope < 0) {
    throw new Error("Longitudinal slope must be non-negative");
  }
  
  if (manningN <= 0) {
    throw new Error("Manning's n must be positive");
  }

  let geometry;
  
  if (shape === "trapezoid") {
    if (bottomWidth < 0) {
      throw new Error("Bottom width must be non-negative");
    }
    if (sideSlope < 0) {
      throw new Error("Side slope must be non-negative");
    }
    geometry = calculateTrapezoidGeometry(depth, bottomWidth, sideSlope);
  } else if (shape === "u-shaped") {
    if (width < 0) {
      throw new Error("Width must be non-negative");
    }
    if (radius < 0) {
      throw new Error("Radius must be non-negative");
    }
    if (flowDepth < 0) {
      throw new Error("Flow depth must be non-negative");
    }
    // For U-shaped channels, use the user-specified flow depth
    geometry = calculateUChannelGeometry(flowDepth, width, radius);
  } else {
    throw new Error(`Unsupported channel shape: ${shape}`);
  }
  
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
  // options: BisectionOptions = {}
): ManningResult {
  const {
    shape,
    bottomWidth,
    sideSlope,
    channelDepth,
    // topWidth,
    width,
    radius,
    flowDepth,
    longitudinalSlope,
    manningN,
    targetFlow,
  } = inputs;

  // Validate inputs
  if (targetFlow < 0) {
    throw new Error("Target flow must be non-negative");
  }

  // Set default bisection options
  // const bisectionOptions: BisectionOptions = {
  //   maxIterations: 80,
  //   tolerance: 1e-4,
  //   minBound: 1e-4, // 0.1 mm minimum depth
  //   maxBound: 5.0,  // 5 m maximum depth
  //   ...options,
  // };

  let normalDepth: number;
  let geometry: { area: number; perimeter: number; hydraulicRadius: number };
  let calculatedFlow: number;

  if (shape === "trapezoid") {
    // For trapezoidal channels, use the user-specified channel depth
    normalDepth = channelDepth;
    geometry = calculateTrapezoidGeometry(channelDepth, bottomWidth, sideSlope);
    calculatedFlow = manningFlow(
      channelDepth,
      shape,
      bottomWidth,
      sideSlope,
      width,
      radius,
      flowDepth,
      longitudinalSlope,
      manningN
    );
  } else if (shape === "u-shaped") {
    // For U-shaped channels, use the user-specified flow depth
    normalDepth = flowDepth;
    geometry = calculateUChannelGeometry(flowDepth, width, radius);
    calculatedFlow = manningFlow(
      flowDepth,
      shape,
      bottomWidth,
      sideSlope,
      width,
      radius,
      flowDepth,
      longitudinalSlope,
      manningN
    );
  } else {
    throw new Error(`Unsupported channel shape: ${shape}`);
  }

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

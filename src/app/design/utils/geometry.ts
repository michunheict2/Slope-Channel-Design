/**
 * Geometric calculations for trapezoidal channels
 */

export interface TrapezoidGeometry {
  bottomWidth: number; // b in meters
  sideSlope: number;   // z (H:V ratio)
}

/**
 * Calculate cross-sectional area of trapezoidal channel
 * A(y) = y * (b + z*y)
 * where: y = depth, b = bottom width, z = side slope (H:V)
 */
export function trapezoidArea(
  depth: number,
  bottomWidth: number,
  sideSlope: number
): number {
  if (depth < 0) {
    throw new Error("Depth must be non-negative");
  }
  if (bottomWidth < 0) {
    throw new Error("Bottom width must be non-negative");
  }
  if (sideSlope < 0) {
    throw new Error("Side slope must be non-negative");
  }
  
  return depth * (bottomWidth + sideSlope * depth);
}

/**
 * Calculate wetted perimeter of trapezoidal channel
 * P(y) = b + 2*y*sqrt(1 + z²)
 * where: y = depth, b = bottom width, z = side slope (H:V)
 */
export function trapezoidPerimeter(
  depth: number,
  bottomWidth: number,
  sideSlope: number
): number {
  if (depth < 0) {
    throw new Error("Depth must be non-negative");
  }
  if (bottomWidth < 0) {
    throw new Error("Bottom width must be non-negative");
  }
  if (sideSlope < 0) {
    throw new Error("Side slope must be non-negative");
  }
  
  return bottomWidth + 2 * depth * Math.sqrt(1 + sideSlope * sideSlope);
}

/**
 * Calculate hydraulic radius
 * R = A / P
 * where: A = cross-sectional area, P = wetted perimeter
 */
export function hydraulicRadius(area: number, perimeter: number): number {
  if (area < 0) {
    throw new Error("Area must be non-negative");
  }
  if (perimeter <= 0) {
    throw new Error("Perimeter must be positive");
  }
  
  return area / perimeter;
}

/**
 * Calculate all geometric properties for a trapezoidal channel
 */
export function calculateTrapezoidGeometry(
  depth: number,
  bottomWidth: number,
  sideSlope: number
): {
  area: number;
  perimeter: number;
  hydraulicRadius: number;
} {
  const area = trapezoidArea(depth, bottomWidth, sideSlope);
  const perimeter = trapezoidPerimeter(depth, bottomWidth, sideSlope);
  const hydraulicRadiusValue = hydraulicRadius(area, perimeter);
  
  return {
    area,
    perimeter,
    hydraulicRadius: hydraulicRadiusValue,
  };
}

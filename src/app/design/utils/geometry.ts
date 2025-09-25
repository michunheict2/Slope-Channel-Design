/**
 * Geometric calculations for trapezoidal and U-shaped channels
 */

export interface TrapezoidGeometry {
  bottomWidth: number; // b in meters
  sideSlope: number;   // z (H:V ratio)
}

export interface UChannelGeometry {
  width: number;       // W in meters (total width)
  radius: number;      // R in meters (radius of the curved bottom)
}

/**
 * Calculate cross-sectional area of trapezoidal channel
 * A = 1/2 × (top_width + bottom_width) × height
 * where: top_width = b + 2*z*y, bottom_width = b, height = y
 *       y = depth, b = bottom width, z = side slope (H:V)
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
  
  const topWidth = bottomWidth + 2 * sideSlope * depth;
  return 0.5 * (topWidth + bottomWidth) * depth;
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

/**
 * Calculate cross-sectional area of U-shaped channel
 * Based on TGN 43 guidelines for U-shaped channels
 * A(y) = area of rectangle + area of semicircle (when y > radius)
 * A(y) = area of circular segment (when y <= radius)
 */
export function uChannelArea(
  depth: number,
  width: number,
  radius: number
): number {
  if (depth < 0) {
    throw new Error("Depth must be non-negative");
  }
  if (width < 0) {
    throw new Error("Width must be non-negative");
  }
  if (radius < 0) {
    throw new Error("Radius must be non-negative");
  }
  
  // For U-shaped channels, the radius should be half the width
  // This ensures the channel has vertical sides and a semicircular bottom
  const effectiveRadius = width / 2;
  
  if (depth <= effectiveRadius) {
    // Water level is within the semicircular bottom
    // Calculate area of circular segment
    const theta = 2 * Math.acos(1 - depth / effectiveRadius);
    const segmentArea = (effectiveRadius * effectiveRadius / 2) * (theta - Math.sin(theta));
    return segmentArea;
  } else {
    // Water level extends above the semicircular bottom
    // Area = semicircle + rectangle
    const semicircleArea = (Math.PI * effectiveRadius * effectiveRadius) / 2;
    const rectangleArea = (depth - effectiveRadius) * width;
    return semicircleArea + rectangleArea;
  }
}

/**
 * Calculate wetted perimeter of U-shaped channel
 * Based on TGN 43 guidelines
 */
export function uChannelPerimeter(
  depth: number,
  width: number,
  radius: number
): number {
  if (depth < 0) {
    throw new Error("Depth must be non-negative");
  }
  if (width < 0) {
    throw new Error("Width must be non-negative");
  }
  if (radius < 0) {
    throw new Error("Radius must be non-negative");
  }
  
  const effectiveRadius = width / 2;
  
  if (depth <= effectiveRadius) {
    // Water level is within the semicircular bottom
    const theta = 2 * Math.acos(1 - depth / effectiveRadius);
    return effectiveRadius * theta;
  } else {
    // Water level extends above the semicircular bottom
    // Perimeter = semicircle + 2 vertical sides
    const semicirclePerimeter = Math.PI * effectiveRadius;
    const verticalSides = 2 * (depth - effectiveRadius);
    return semicirclePerimeter + verticalSides;
  }
}

/**
 * Calculate all geometric properties for a U-shaped channel
 */
export function calculateUChannelGeometry(
  depth: number,
  width: number,
  radius: number
): {
  area: number;
  perimeter: number;
  hydraulicRadius: number;
} {
  const area = uChannelArea(depth, width, radius);
  const perimeter = uChannelPerimeter(depth, width, radius);
  const hydraulicRadiusValue = hydraulicRadius(area, perimeter);
  
  return {
    area,
    perimeter,
    hydraulicRadius: hydraulicRadiusValue,
  };
}

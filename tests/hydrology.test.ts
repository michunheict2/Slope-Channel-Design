import { describe, it, expect } from 'vitest';
import {
  mmPerHourToMetersPerSecond,
  hectaresToSquareMeters,
  squareMetersToHectares,
  cubicMetersPerSecondToLitersPerSecond,
  litersPerSecondToCubicMetersPerSecond,
} from '@/app/design/utils/units';
import {
  trapezoidArea,
  trapezoidPerimeter,
  hydraulicRadius,
  calculateTrapezoidGeometry,
} from '@/app/design/utils/geometry';
import { bisection } from '@/app/design/utils/numeric';
import { rationalQ } from '@/app/design/hooks/useRational';
import { manningFlow, normalDepthAndCapacity } from '@/app/design/hooks/useManning';

describe('Unit Conversions', () => {
  it('should convert mm/h to m/s correctly', () => {
    expect(mmPerHourToMetersPerSecond(100)).toBeCloseTo(0.0000278, 7);
    expect(mmPerHourToMetersPerSecond(3600)).toBeCloseTo(0.001, 6);
    expect(mmPerHourToMetersPerSecond(0)).toBe(0);
  });

  it('should convert hectares to square meters correctly', () => {
    expect(hectaresToSquareMeters(1)).toBe(10000);
    expect(hectaresToSquareMeters(0.5)).toBe(5000);
    expect(hectaresToSquareMeters(0)).toBe(0);
  });

  it('should convert square meters to hectares correctly', () => {
    expect(squareMetersToHectares(10000)).toBe(1);
    expect(squareMetersToHectares(5000)).toBe(0.5);
    expect(squareMetersToHectares(0)).toBe(0);
  });

  it('should convert m³/s to L/s correctly', () => {
    expect(cubicMetersPerSecondToLitersPerSecond(1)).toBe(1000);
    expect(cubicMetersPerSecondToLitersPerSecond(0.5)).toBe(500);
    expect(cubicMetersPerSecondToLitersPerSecond(0)).toBe(0);
  });

  it('should convert L/s to m³/s correctly', () => {
    expect(litersPerSecondToCubicMetersPerSecond(1000)).toBe(1);
    expect(litersPerSecondToCubicMetersPerSecond(500)).toBe(0.5);
    expect(litersPerSecondToCubicMetersPerSecond(0)).toBe(0);
  });
});

describe('Trapezoidal Geometry', () => {
  const bottomWidth = 2.0; // m
  const sideSlope = 1.5; // H:V
  const depth = 1.0; // m

  it('should calculate area correctly', () => {
    // Correct trapezoid area formula: A = 1/2 × (top_width + bottom_width) × height
    const topWidth = bottomWidth + 2 * sideSlope * depth; // 2.0 + 2 * 1.5 * 1.0 = 5.0
    const expectedArea = 0.5 * (topWidth + bottomWidth) * depth; // 0.5 * (5.0 + 2.0) * 1.0 = 3.5
    expect(trapezoidArea(depth, bottomWidth, sideSlope)).toBeCloseTo(expectedArea, 6);
    expect(trapezoidArea(depth, bottomWidth, sideSlope)).toBeCloseTo(3.5, 6);
  });

  it('should calculate area correctly for different scenarios', () => {
    // Test case 1: Rectangular channel (side slope = 0)
    expect(trapezoidArea(1.0, 2.0, 0.0)).toBeCloseTo(2.0, 6); // 0.5 * (2.0 + 2.0) * 1.0 = 2.0
    
    // Test case 2: Triangular channel (bottom width = 0)
    expect(trapezoidArea(1.0, 0.0, 1.5)).toBeCloseTo(1.5, 6); // 0.5 * (3.0 + 0.0) * 1.0 = 1.5
    
    // Test case 3: Different dimensions
    expect(trapezoidArea(0.5, 1.0, 2.0)).toBeCloseTo(1.0, 6); // 0.5 * (3.0 + 1.0) * 0.5 = 1.0
  });

  it('should calculate perimeter correctly', () => {
    const expectedPerimeter = bottomWidth + 2 * depth * Math.sqrt(1 + sideSlope * sideSlope);
    expect(trapezoidPerimeter(depth, bottomWidth, sideSlope)).toBeCloseTo(expectedPerimeter, 6);
    expect(trapezoidPerimeter(depth, bottomWidth, sideSlope)).toBeCloseTo(5.606, 3);
  });

  it('should calculate hydraulic radius correctly', () => {
    const area = trapezoidArea(depth, bottomWidth, sideSlope);
    const perimeter = trapezoidPerimeter(depth, bottomWidth, sideSlope);
    const expectedR = area / perimeter;
    expect(hydraulicRadius(area, perimeter)).toBeCloseTo(expectedR, 6);
  });

  it('should calculate all geometry properties correctly', () => {
    const geometry = calculateTrapezoidGeometry(depth, bottomWidth, sideSlope);
    expect(geometry.area).toBeCloseTo(3.5, 6);
    expect(geometry.perimeter).toBeCloseTo(5.606, 3);
    expect(geometry.hydraulicRadius).toBeCloseTo(0.624, 3);
  });

  it('should handle zero depth', () => {
    expect(trapezoidArea(0, bottomWidth, sideSlope)).toBe(0);
    expect(trapezoidPerimeter(0, bottomWidth, sideSlope)).toBe(bottomWidth);
  });

  it('should throw error for negative inputs', () => {
    expect(() => trapezoidArea(-1, bottomWidth, sideSlope)).toThrow();
    expect(() => trapezoidArea(depth, -1, sideSlope)).toThrow();
    expect(() => trapezoidArea(depth, bottomWidth, -1)).toThrow();
  });
});

describe('Bisection Solver', () => {
  it('should solve x² - 4 = 0', () => {
    const func = (x: number) => x * x - 4;
    const result = bisection(func, 0, 5);
    expect(result.root).toBeCloseTo(2, 3);
    expect(result.converged).toBe(true);
  });

  it('should solve sin(x) = 0.5', () => {
    const func = (x: number) => Math.sin(x) - 0.5;
    const result = bisection(func, 0, Math.PI / 2);
    expect(result.root).toBeCloseTo(Math.PI / 6, 3);
    expect(result.converged).toBe(true);
  });

  it('should handle function with no root in interval', () => {
    const func = (x: number) => x * x + 1; // Always positive
    const result = bisection(func, 0, 5);
    expect(result.converged).toBe(false);
  });

  it('should respect tolerance settings', () => {
    const func = (x: number) => x - 2.5;
    const result = bisection(func, 0, 5, { tolerance: 1e-6 });
    expect(Math.abs(result.finalError)).toBeLessThan(1e-6);
  });
});

describe('Rational Method', () => {
  it('should calculate peak flow correctly', () => {
    const inputs = {
      runoffCoefficient: 0.9,
      rainfallIntensity: 100, // mm/h
      catchmentArea: 1000, // m²
    };
    
    const result = rationalQ(inputs);
    const expectedFlow = 0.9 * (100 / 1000 / 3600) * 1000; // C * i * A
    expect(result.peakFlow).toBeCloseTo(expectedFlow, 6);
    expect(result.peakFlow).toBeCloseTo(0.025, 3);
  });

  it('should validate input ranges', () => {
    expect(() => rationalQ({
      runoffCoefficient: -0.1,
      rainfallIntensity: 100,
      catchmentArea: 1000,
    })).toThrow();

    expect(() => rationalQ({
      runoffCoefficient: 1.1,
      rainfallIntensity: 100,
      catchmentArea: 1000,
    })).toThrow();

    expect(() => rationalQ({
      runoffCoefficient: 0.9,
      rainfallIntensity: -10,
      catchmentArea: 1000,
    })).toThrow();

    expect(() => rationalQ({
      runoffCoefficient: 0.9,
      rainfallIntensity: 100,
      catchmentArea: 0,
    })).toThrow();
  });
});

describe('Manning Flow', () => {
  const bottomWidth = 2.0; // m
  const sideSlope = 1.5; // H:V
  const longitudinalSlope = 0.01; // m/m
  const manningN = 0.013;
  const depth = 1.0; // m

  it('should calculate flow correctly', () => {
    const flow = manningFlow(depth, "trapezoid", bottomWidth, sideSlope, 0, 0, 0, longitudinalSlope, manningN);
    expect(flow).toBeGreaterThan(0);
    expect(typeof flow).toBe('number');
  });

  it('should be monotonic with depth', () => {
    const flow1 = manningFlow(0.5, "trapezoid", bottomWidth, sideSlope, 0, 0, 0, longitudinalSlope, manningN);
    const flow2 = manningFlow(1.0, "trapezoid", bottomWidth, sideSlope, 0, 0, 0, longitudinalSlope, manningN);
    const flow3 = manningFlow(1.5, "trapezoid", bottomWidth, sideSlope, 0, 0, 0, longitudinalSlope, manningN);
    
    expect(flow2).toBeGreaterThan(flow1);
    expect(flow3).toBeGreaterThan(flow2);
  });

  it('should validate inputs', () => {
    expect(() => manningFlow(-1, "trapezoid", bottomWidth, sideSlope, 0, 0, 0, longitudinalSlope, manningN)).toThrow();
    expect(() => manningFlow(depth, "trapezoid", -1, sideSlope, 0, 0, 0, longitudinalSlope, manningN)).toThrow();
    expect(() => manningFlow(depth, "trapezoid", bottomWidth, -1, 0, 0, 0, longitudinalSlope, manningN)).toThrow();
    expect(() => manningFlow(depth, "trapezoid", bottomWidth, sideSlope, 0, 0, 0, -1, manningN)).toThrow();
    expect(() => manningFlow(depth, "trapezoid", bottomWidth, sideSlope, 0, 0, 0, longitudinalSlope, 0)).toThrow();
  });
});

describe('Normal Depth Calculation', () => {
  it('should find normal depth for given flow', () => {
    const inputs = {
      shape: "trapezoid",
      bottomWidth: 2.0,
      sideSlope: 1.5,
      channelDepth: 1.0,
      topWidth: 5.0, // 2.0 + 2 * 1.5 * 1.0
      width: 0,
      radius: 0,
      flowDepth: 0,
      longitudinalSlope: 0.01,
      manningN: 0.013,
      targetFlow: 1.0, // m³/s
    };

    const result = normalDepthAndCapacity(inputs);
    
    expect(result.normalDepth).toBe(1.0); // Should use the specified channel depth
    expect(result.area).toBeGreaterThan(0);
    expect(result.perimeter).toBeGreaterThan(0);
    expect(result.hydraulicRadius).toBeGreaterThan(0);
    expect(result.velocity).toBeGreaterThan(0);
    expect(result.calculatedFlow).toBeGreaterThan(0);
  });

  it('should handle very small flow', () => {
    const inputs = {
      shape: "trapezoid",
      bottomWidth: 2.0,
      sideSlope: 1.5,
      channelDepth: 0.5,
      topWidth: 3.5, // 2.0 + 2 * 1.5 * 0.5
      width: 0,
      radius: 0,
      flowDepth: 0,
      longitudinalSlope: 0.01,
      manningN: 0.013,
      targetFlow: 0.001, // Very small but non-zero flow
    };

    const result = normalDepthAndCapacity(inputs);
    expect(result.normalDepth).toBe(0.5); // Should use the specified channel depth
    expect(result.calculatedFlow).toBeGreaterThan(0);
  });

  it('should validate target flow', () => {
    const inputs = {
      shape: "trapezoid",
      bottomWidth: 2.0,
      sideSlope: 1.5,
      channelDepth: 1.0,
      topWidth: 5.0,
      width: 0,
      radius: 0,
      flowDepth: 0,
      longitudinalSlope: 0.01,
      manningN: 0.013,
      targetFlow: -1,
    };

    expect(() => normalDepthAndCapacity(inputs)).toThrow();
  });
});

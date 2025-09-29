/**
 * Terrain analysis utilities for slope and elevation calculations
 * 
 * This module contains functions for extracting terrain data, calculating slopes,
 * and performing elevation-based analysis on catchment areas and channel alignments.
 */

import { turf } from './mapConfig';

/**
 * Interface for elevation data points
 */
export interface ElevationPoint {
  coordinates: [number, number];
  elevation: number;
}

/**
 * Interface for slope calculation results
 */
export interface SlopeCalculationResult {
  averageSlope: number; // m per 100m
  elevationRange: number; // meters
  horizontalDistance: number; // meters
  highestPoint: ElevationPoint;
  lowestPoint: ElevationPoint;
}

/**
 * Interface for flow path calculation results
 */
export interface FlowPathResult {
  flowPathLength: number; // meters
  outletPoint: ElevationPoint;
  highestPoint: ElevationPoint;
}

/**
 * Interface for channel gradient calculation results
 */
export interface ChannelGradientResult {
  gradient: number; // m/m
  elevationDifference: number; // meters
  horizontalDistance: number; // meters
  startElevation: number;
  endElevation: number;
}

/**
 * Default values for terrain analysis
 */
export const TERRAIN_DEFAULTS = {
  MIN_SLOPE: 0.1, // m per 100m
  MAX_SLOPE: 50, // m per 100m
  DEFAULT_SLOPE: 5, // m per 100m
  MIN_GRADIENT: 0.001, // m/m
  MAX_GRADIENT: 0.1, // m/m
  DEFAULT_GRADIENT: 0.01, // m/m (1%)
  DEFAULT_FLOW_PATH_LENGTH: 200, // meters
  GRID_SAMPLE_SIZE: 5, // Sample every 5 points for performance
} as const;

/**
 * Get elevation data for multiple coordinate points
 * 
 * @param map - The Mapbox map instance
 * @param coordinates - Array of [lng, lat] coordinate pairs
 * @returns Promise resolving to array of elevation points
 */
export async function getElevationData(
  map: any, 
  coordinates: number[][]
): Promise<ElevationPoint[]> {
  if (!map || !coordinates.length) {
    return [];
  }

  const elevationData: ElevationPoint[] = [];
  
  for (const coord of coordinates) {
    try {
      const elevation = await map.queryTerrainElevation(coord);
      if (elevation !== null && elevation !== undefined && !isNaN(elevation)) {
        elevationData.push({
          coordinates: coord as [number, number],
          elevation
        });
      }
    } catch (error) {
      console.warn('Could not get elevation for point:', coord, error);
    }
  }
  
  return elevationData;
}

/**
 * Sample elevation points within a polygon using a grid pattern
 * 
 * @param map - The Mapbox map instance
 * @param polygonCoordinates - The polygon boundary coordinates
 * @param gridSize - Grid sampling size (default: 5)
 * @returns Promise resolving to array of elevation points
 */
export async function samplePolygonElevations(
  map: any,
  polygonCoordinates: number[][],
  gridSize: number = TERRAIN_DEFAULTS.GRID_SAMPLE_SIZE
): Promise<ElevationPoint[]> {
  if (!map || !polygonCoordinates.length) {
    return [];
  }

  const samplePoints: number[][] = [];
  
  // Sample boundary points
  samplePoints.push(...polygonCoordinates);
  
  // Sample interior points using a grid
  for (let i = 0; i < polygonCoordinates.length - 1; i += gridSize) {
    const point = polygonCoordinates[i];
    if (turf.booleanPointInPolygon(turf.point(point), turf.polygon([polygonCoordinates]))) {
      samplePoints.push(point);
    }
  }
  
  return getElevationData(map, samplePoints);
}

/**
 * Calculate slope from elevation data points
 * 
 * @param elevationData - Array of elevation points
 * @returns Slope calculation result
 */
export function calculateSlopeFromElevationData(
  elevationData: ElevationPoint[]
): SlopeCalculationResult {
  if (elevationData.length < 2) {
    console.warn('Insufficient elevation data, using default slope');
    return {
      averageSlope: TERRAIN_DEFAULTS.DEFAULT_SLOPE,
      elevationRange: 0,
      horizontalDistance: 0,
      highestPoint: { coordinates: [0, 0], elevation: 0 },
      lowestPoint: { coordinates: [0, 0], elevation: 0 }
    };
  }
  
  // Find highest and lowest elevation points
  const sortedByElevation = elevationData.sort((a, b) => a.elevation - b.elevation);
  const lowestPoint = sortedByElevation[0];
  const highestPoint = sortedByElevation[sortedByElevation.length - 1];
  
  // Calculate elevation range (rise)
  const elevationRange = highestPoint.elevation - lowestPoint.elevation;
  
  // Calculate horizontal distance between highest and lowest points (run)
  const horizontalDistance = turf.distance(
    turf.point(lowestPoint.coordinates), 
    turf.point(highestPoint.coordinates), 
    { units: 'meters' }
  );
  
  // Calculate slope (rise over run)
  const slope = horizontalDistance > 0 
    ? (elevationRange / horizontalDistance) * 100 // Convert to m per 100m
    : TERRAIN_DEFAULTS.DEFAULT_SLOPE;
  
  // Clamp to reasonable range
  const finalSlope = Math.max(
    TERRAIN_DEFAULTS.MIN_SLOPE, 
    Math.min(TERRAIN_DEFAULTS.MAX_SLOPE, slope)
  );
  
  console.log(`Slope calculation: elevation range ${elevationRange.toFixed(2)}m, horizontal distance ${horizontalDistance.toFixed(2)}m, slope ${finalSlope.toFixed(2)} m/100m`);
  console.log(`Highest point: ${highestPoint.elevation.toFixed(2)}m at [${highestPoint.coordinates[0].toFixed(6)}, ${highestPoint.coordinates[1].toFixed(6)}]`);
  console.log(`Lowest point: ${lowestPoint.elevation.toFixed(2)}m at [${lowestPoint.coordinates[0].toFixed(6)}, ${lowestPoint.coordinates[1].toFixed(6)}]`);
  
  return {
    averageSlope: finalSlope,
    elevationRange,
    horizontalDistance,
    highestPoint,
    lowestPoint
  };
}

/**
 * Extract slope from terrain data for a polygon
 * 
 * @param map - The Mapbox map instance
 * @param coordinates - Polygon boundary coordinates
 * @returns Promise resolving to slope value in m per 100m
 */
export async function extractSlopeFromTerrain(
  map: any, 
  coordinates: number[][]
): Promise<number> {
  if (!map) {
    return TERRAIN_DEFAULTS.DEFAULT_SLOPE;
  }

  try {
    const elevationData = await samplePolygonElevations(map, coordinates);
    const result = calculateSlopeFromElevationData(elevationData);
    return result.averageSlope;
  } catch (error) {
    console.error('Error extracting slope from terrain:', error);
    return TERRAIN_DEFAULTS.DEFAULT_SLOPE;
  }
}

/**
 * Calculate flow path length from highest point to lowest point (outlet)
 * 
 * @param map - The Mapbox map instance
 * @param coordinates - Polygon boundary coordinates
 * @returns Promise resolving to flow path result
 */
export async function calculateFlowPathLength(
  map: any, 
  coordinates: number[][]
): Promise<FlowPathResult> {
  if (!map || !coordinates.length) {
    return {
      flowPathLength: TERRAIN_DEFAULTS.DEFAULT_FLOW_PATH_LENGTH,
      outletPoint: { coordinates: [0, 0], elevation: 0 },
      highestPoint: { coordinates: [0, 0], elevation: 0 }
    };
  }

  try {
    const elevationData = await getElevationData(map, coordinates);
    
    if (elevationData.length < 2) {
      console.warn('Insufficient elevation data for flow path calculation, using default');
      return {
        flowPathLength: TERRAIN_DEFAULTS.DEFAULT_FLOW_PATH_LENGTH,
        outletPoint: { coordinates: [0, 0], elevation: 0 },
        highestPoint: { coordinates: [0, 0], elevation: 0 }
      };
    }
    
    // Find highest and lowest elevation points (outlet)
    const sortedByElevation = elevationData.sort((a, b) => a.elevation - b.elevation);
    const outletPoint = sortedByElevation[0]; // This is the outlet
    const highestPoint = sortedByElevation[sortedByElevation.length - 1];
    
    // Calculate actual distance from highest point to outlet (lowest point)
    const flowPathLength = turf.distance(
      turf.point(highestPoint.coordinates), 
      turf.point(outletPoint.coordinates), 
      { units: 'meters' }
    );
    
    const roundedFlowPathLength = Math.round(flowPathLength);
    
    console.log(`Flow path calculation: from highest point (${highestPoint.elevation.toFixed(2)}m) to outlet (${outletPoint.elevation.toFixed(2)}m)`);
    console.log(`Flow path length: ${roundedFlowPathLength}m`);
    console.log(`Outlet coordinates: [${outletPoint.coordinates[0].toFixed(6)}, ${outletPoint.coordinates[1].toFixed(6)}]`);
    
    return {
      flowPathLength: roundedFlowPathLength,
      outletPoint,
      highestPoint
    };
  } catch (error) {
    console.error('Error calculating flow path length:', error);
    return {
      flowPathLength: TERRAIN_DEFAULTS.DEFAULT_FLOW_PATH_LENGTH,
      outletPoint: { coordinates: [0, 0], elevation: 0 },
      highestPoint: { coordinates: [0, 0], elevation: 0 }
    };
  }
}

/**
 * Calculate channel gradient from elevation data
 * 
 * @param map - The Mapbox map instance
 * @param coordinates - Channel alignment coordinates
 * @returns Promise resolving to channel gradient result
 */
export async function calculateChannelGradient(
  map: any, 
  coordinates: number[][]
): Promise<ChannelGradientResult> {
  if (!map || coordinates.length < 2) {
    return {
      gradient: TERRAIN_DEFAULTS.DEFAULT_GRADIENT,
      elevationDifference: 0,
      horizontalDistance: 0,
      startElevation: 0,
      endElevation: 0
    };
  }

  try {
    // Get elevation at first and last points
    const startPoint = coordinates[0];
    const endPoint = coordinates[coordinates.length - 1];
    
    const startElevation = await map.queryTerrainElevation(startPoint);
    const endElevation = await map.queryTerrainElevation(endPoint);
    
    if (startElevation === null || endElevation === null || 
        isNaN(startElevation) || isNaN(endElevation)) {
      return {
        gradient: TERRAIN_DEFAULTS.DEFAULT_GRADIENT,
        elevationDifference: 0,
        horizontalDistance: 0,
        startElevation: 0,
        endElevation: 0
      };
    }
    
    // Calculate horizontal distance using Turf.js
    const startPointFeature = turf.point(startPoint);
    const endPointFeature = turf.point(endPoint);
    const horizontalDistance = turf.distance(startPointFeature, endPointFeature, { units: 'meters' });
    
    if (horizontalDistance === 0) {
      return {
        gradient: TERRAIN_DEFAULTS.DEFAULT_GRADIENT,
        elevationDifference: 0,
        horizontalDistance: 0,
        startElevation,
        endElevation
      };
    }
    
    // Calculate gradient: elevation difference / horizontal distance
    const elevationDifference = Math.abs(startElevation - endElevation);
    const gradient = elevationDifference / horizontalDistance;
    
    // Ensure reasonable gradient range
    const finalGradient = Math.max(
      TERRAIN_DEFAULTS.MIN_GRADIENT, 
      Math.min(TERRAIN_DEFAULTS.MAX_GRADIENT, gradient)
    );
    
    return {
      gradient: finalGradient,
      elevationDifference,
      horizontalDistance,
      startElevation,
      endElevation
    };
    
  } catch (error) {
    console.error('Error calculating channel gradient:', error);
    return {
      gradient: TERRAIN_DEFAULTS.DEFAULT_GRADIENT,
      elevationDifference: 0,
      horizontalDistance: 0,
      startElevation: 0,
      endElevation: 0
    };
  }
}

/**
 * Calculate measurements between two points for the measurement tool
 * 
 * @param map - The Mapbox map instance
 * @param point1 - First point coordinates [lng, lat]
 * @param point2 - Second point coordinates [lng, lat]
 * @returns Promise resolving to measurement results
 */
export async function calculatePointMeasurements(
  map: any,
  point1: [number, number],
  point2: [number, number]
): Promise<{
  horizontalDistance: number;
  elevationDiff: number;
  gradient: number;
  elevation1: number;
  elevation2: number;
}> {
  if (!map) {
    return {
      horizontalDistance: 0,
      elevationDiff: 0,
      gradient: 0,
      elevation1: 0,
      elevation2: 0
    };
  }

  try {
    // Get elevations
    const elevation1 = await map.queryTerrainElevation(point1);
    const elevation2 = await map.queryTerrainElevation(point2);
    
    // Calculate horizontal distance
    const horizontalDistance = turf.distance(
      turf.point(point1),
      turf.point(point2),
      { units: 'meters' }
    );
    
    // Calculate elevation difference
    const elevationDiff = elevation2 - elevation1;
    
    // Calculate gradient (slope)
    const gradient = horizontalDistance > 0 
      ? (elevationDiff / horizontalDistance) * 100 
      : 0;
    
    return {
      horizontalDistance,
      elevationDiff,
      gradient,
      elevation1: elevation1 || 0,
      elevation2: elevation2 || 0
    };
    
  } catch (error) {
    console.error('Error calculating point measurements:', error);
    return {
      horizontalDistance: 0,
      elevationDiff: 0,
      gradient: 0,
      elevation1: 0,
      elevation2: 0
    };
  }
}

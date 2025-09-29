/**
 * Visualization and measurement utilities
 * 
 * This module contains functions for creating visualization layers,
 * handling measurement tools, and managing map overlays.
 */

import { CatchmentData } from '../types';
import { turf } from './mapConfig';
import { 
  getElevationData, 
  calculateSlopeFromElevationData,
  calculatePointMeasurements 
} from './terrainAnalysis';
import { 
  addSourceIfNotExists, 
  addLayerIfNotExists, 
  removeLayerAndSource,
  LAYER_CONFIGS 
} from './mapConfig';

/**
 * Interface for measurement results
 */
export interface MeasurementResults {
  horizontalDistance: number;
  elevationDiff: number;
  gradient: number;
  elevation1: number;
  elevation2: number;
}

/**
 * Interface for visualization line features
 */
export interface VisualizationLineFeature {
  type: 'Feature';
  geometry: {
    type: 'LineString';
    coordinates: number[][];
  };
  properties: {
    type: 'slope' | 'flow-path' | 'measurement';
    catchmentId?: string;
    highestElevation?: number;
    lowestElevation?: number;
    distance?: number;
  };
}

/**
 * Create visualization line features for catchments
 * 
 * @param catchments - Array of catchment data
 * @param map - The Mapbox map instance
 * @returns Promise resolving to visualization features
 */
export async function createVisualizationFeatures(
  catchments: CatchmentData[],
  map: any
): Promise<{
  slopeLines: VisualizationLineFeature[];
  flowPathLines: VisualizationLineFeature[];
}> {
  const slopeLines: VisualizationLineFeature[] = [];
  const flowPathLines: VisualizationLineFeature[] = [];

  for (const catchment of catchments) {
    try {
      const coordinates = catchment.coordinates;
      
      // Get elevation data for all polygon boundary points
      const elevationData = await getElevationData(map, coordinates);

      if (elevationData.length < 2) continue;

      // Find highest and lowest elevation points
      const sortedByElevation = elevationData.sort((a, b) => a.elevation - b.elevation);
      const lowestPoint = sortedByElevation[0];
      const highestPoint = sortedByElevation[sortedByElevation.length - 1];

      const distance = turf.distance(
        turf.point(highestPoint.coordinates),
        turf.point(lowestPoint.coordinates),
        { units: 'meters' }
      );

      // Create slope line (highest to lowest)
      const slopeLine: VisualizationLineFeature = {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: [highestPoint.coordinates, lowestPoint.coordinates]
        },
        properties: {
          type: 'slope',
          catchmentId: catchment.id,
          highestElevation: highestPoint.elevation,
          lowestElevation: lowestPoint.elevation,
          distance
        }
      };

      // Create flow path line (same as slope line for this implementation)
      const flowPathLine: VisualizationLineFeature = {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: [highestPoint.coordinates, lowestPoint.coordinates]
        },
        properties: {
          type: 'flow-path',
          catchmentId: catchment.id,
          highestElevation: highestPoint.elevation,
          lowestElevation: lowestPoint.elevation,
          distance
        }
      };

      slopeLines.push(slopeLine);
      flowPathLines.push(flowPathLine);
    } catch (error) {
      console.error(`Error creating visualization for catchment ${catchment.id}:`, error);
    }
  }

  return { slopeLines, flowPathLines };
}

/**
 * Draw visualization lines on the map
 * 
 * @param map - The Mapbox map instance
 * @param catchments - Array of catchment data
 */
export async function drawVisualizationLines(
  map: any,
  catchments: CatchmentData[]
): Promise<void> {
  if (!map || !turf) return;

  try {
    // Remove existing visualization layers
    removeLayerAndSource(map, 'slope-line', 'slope-line');
    removeLayerAndSource(map, 'flow-path-line', 'flow-path-line');

    const { slopeLines, flowPathLines } = await createVisualizationFeatures(catchments, map);

    // Add slope line source and layer
    addSourceIfNotExists(map, 'slope-line', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: slopeLines
      }
    });

    addLayerIfNotExists(map, LAYER_CONFIGS.SLOPE_LINE);

    // Add flow path line source and layer
    addSourceIfNotExists(map, 'flow-path-line', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: flowPathLines
      }
    });

    addLayerIfNotExists(map, LAYER_CONFIGS.FLOW_PATH_LINE);

    console.log('Visualization lines drawn for all catchments');
  } catch (error) {
    console.error('Error drawing visualization lines:', error);
  }
}

/**
 * Clear visualization lines from the map
 * 
 * @param map - The Mapbox map instance
 */
export function clearVisualizationLines(map: any): void {
  if (!map) return;

  try {
    removeLayerAndSource(map, 'slope-line', 'slope-line');
    removeLayerAndSource(map, 'flow-path-line', 'flow-path-line');
    console.log('Visualization lines cleared');
  } catch (error) {
    console.error('Error clearing visualization lines:', error);
  }
}

/**
 * Draw measurement line on the map
 * 
 * @param map - The Mapbox map instance
 * @param points - Array of two coordinate points
 */
export function drawMeasurementLine(map: any, points: number[][]): void {
  if (!map || points.length !== 2) return;

  try {
    const lineFeature: VisualizationLineFeature = {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: points
      },
      properties: {
        type: 'measurement'
      }
    };

    // Add source if it doesn't exist
    addSourceIfNotExists(map, 'measurement-line', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      }
    });

    // Add layer if it doesn't exist
    addLayerIfNotExists(map, LAYER_CONFIGS.MEASUREMENT_LINE);

    // Update source
    map.getSource('measurement-line').setData({
      type: 'FeatureCollection',
      features: [lineFeature]
    });

  } catch (error) {
    console.error('Error drawing measurement line:', error);
  }
}

/**
 * Clear measurement line from the map
 * 
 * @param map - The Mapbox map instance
 */
export function clearMeasurementLine(map: any): void {
  if (!map) return;

  try {
    removeLayerAndSource(map, 'measurement-line', 'measurement-line');
  } catch (error) {
    console.error('Error clearing measurement line:', error);
  }
}

/**
 * Create catchment label features
 * 
 * @param catchments - Array of catchment data
 * @returns Array of label features
 */
export function createCatchmentLabelFeatures(catchments: CatchmentData[]): any[] {
  return catchments.map(catchment => ({
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: catchment.center
    },
    properties: {
      id: catchment.id,
      name: catchment.name,
      type: 'catchment-label'
    }
  }));
}

/**
 * Create channel label features
 * 
 * @param channels - Array of channel data
 * @returns Array of label features
 */
export function createChannelLabelFeatures(channels: any[]): any[] {
  return channels.map((channel: any) => {
    // Calculate midpoint along the line using Turf.js
    const coordinates = channel.coordinates;
    if (coordinates.length < 2) return null;
    
    // Create a line feature
    const lineFeature = {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: coordinates
      }
    };
    
    // Calculate the midpoint along the line
    const lineLength = turf.length(lineFeature, { units: 'meters' });
    const midPoint = turf.along(lineFeature, lineLength / 2, { units: 'meters' });
    
    return {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: midPoint.geometry.coordinates
      },
      properties: {
        id: channel.id,
        name: channel.name,
        type: 'channel-label'
      }
    };
  }).filter(Boolean); // Remove null values
}

/**
 * Update catchment labels on the map
 * 
 * @param map - The Mapbox map instance
 * @param catchments - Array of catchment data
 */
export function updateCatchmentLabels(map: any, catchments: CatchmentData[]): void {
  if (!map) return;

  try {
    const labelFeatures = createCatchmentLabelFeatures(catchments);

    // Update the source with all current labels
    if (map.getSource('catchment-labels')) {
      map.getSource('catchment-labels').setData({
        type: 'FeatureCollection',
        features: labelFeatures
      });
    }
  } catch (error) {
    console.error('Error updating catchment labels:', error);
  }
}

/**
 * Update channel labels on the map
 * 
 * @param map - The Mapbox map instance
 * @param channels - Array of channel data
 */
export function updateChannelLabels(map: any, channels: any[]): void {
  if (!map) return;

  try {
    const channelLabelFeatures = createChannelLabelFeatures(channels);

    // Update the source with all current channel labels
    if (map.getSource('channel-labels')) {
      map.getSource('channel-labels').setData({
        type: 'FeatureCollection',
        features: channelLabelFeatures
      });
    }
  } catch (error) {
    console.error('Error updating channel labels:', error);
  }
}

/**
 * Add catchment label to the map
 * 
 * @param map - The Mapbox map instance
 * @param catchment - The catchment data
 */
export function addCatchmentLabel(map: any, catchment: CatchmentData): void {
  if (!map) return;

  try {
    // Create a point at the centroid for the label
    const labelPoint = {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: catchment.center
      },
      properties: {
        id: catchment.id,
        name: catchment.name,
        type: 'catchment-label'
      }
    };

    // Add source if it doesn't exist
    addSourceIfNotExists(map, 'catchment-labels', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      }
    });

    // Add layer if it doesn't exist
    addLayerIfNotExists(map, LAYER_CONFIGS.CATCHMENT_LABELS);

    // Add channel labels source if it doesn't exist
    addSourceIfNotExists(map, 'channel-labels', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      }
    });

    // Add channel labels layer if it doesn't exist
    addLayerIfNotExists(map, LAYER_CONFIGS.CHANNEL_LABELS);

    // Update the source with new label
    const currentFeatures = map.getSource('catchment-labels')._data.features || [];
    map.getSource('catchment-labels').setData({
      type: 'FeatureCollection',
      features: [...currentFeatures, labelPoint]
    });

  } catch (error) {
    console.error('Error adding catchment label:', error);
  }
}

/**
 * Handle measurement click events
 * 
 * @param map - The Mapbox map instance
 * @param e - The click event
 * @param measurementPoints - Current measurement points
 * @param setMeasurementPoints - Function to update measurement points
 * @param setMeasurementResults - Function to update measurement results
 * @param clearMeasurementLine - Function to clear measurement line
 * @returns Updated measurement points
 */
export async function handleMeasurementClick(
  map: any,
  e: any,
  measurementPoints: number[][],
  setMeasurementPoints: (points: number[][]) => void,
  setMeasurementResults: (results: MeasurementResults | null) => void,
  clearMeasurementLine: () => void
): Promise<number[][]> {
  const newPoint = [e.lngLat.lng, e.lngLat.lat];
  const newPoints = [...measurementPoints, newPoint];
  setMeasurementPoints(newPoints);

  if (newPoints.length === 2) {
    // Calculate measurements
    const results = await calculatePointMeasurements(
      map,
      newPoints[0] as [number, number],
      newPoints[1] as [number, number]
    );
    setMeasurementResults(results);
    
    // Draw measurement line
    drawMeasurementLine(map, newPoints);
    
    console.log('Measurements:', {
      horizontalDistance: results.horizontalDistance.toFixed(2) + 'm',
      elevationDiff: results.elevationDiff.toFixed(2) + 'm',
      gradient: results.gradient.toFixed(2) + '%'
    });
  } else if (newPoints.length > 2) {
    // Reset for new measurement
    setMeasurementPoints([newPoint]);
    setMeasurementResults(null);
    clearMeasurementLine();
  }

  return newPoints;
}

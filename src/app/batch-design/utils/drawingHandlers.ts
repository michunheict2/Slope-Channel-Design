/**
 * Drawing event handlers and feature processing utilities
 * 
 * This module contains all the logic for handling Mapbox Draw events,
 * processing drawn features, and creating catchment and channel data.
 */

import { CatchmentData, ChannelAlignment } from '../types';
import { turf } from './mapConfig';
import { 
  extractSlopeFromTerrain, 
  calculateFlowPathLength, 
  calculateChannelGradient 
} from './terrainAnalysis';

/**
 * Interface for drawing event handlers
 */
export interface DrawingHandlers {
  onCatchmentAdded: (catchment: CatchmentData) => void;
  onChannelAdded: (channel: ChannelAlignment) => void;
  onCatchmentRemoved?: (catchmentId: string) => void;
  onChannelRemoved?: (channelId: string) => void;
}

/**
 * Interface for feature processing context
 */
export interface FeatureProcessingContext {
  catchments: CatchmentData[];
  channels: ChannelAlignment[];
  handlers: DrawingHandlers;
  addCatchmentLabel: (catchment: CatchmentData) => void;
}

/**
 * Generate a unique ID for features
 * 
 * @param prefix - The prefix for the ID
 * @returns A unique ID string
 */
export function generateFeatureId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Process a polygon feature and create catchment data
 * 
 * @param feature - The GeoJSON polygon feature
 * @param context - The processing context
 * @returns Promise resolving to the created catchment data
 */
export async function processPolygonFeature(
  feature: any,
  context: FeatureProcessingContext
): Promise<CatchmentData> {
  try {
    // Calculate area using Turf.js
    const area = turf.area(feature); // Returns area in square meters
    
    // Calculate centroid
    const centroid = turf.centroid(feature);
    const center: [number, number] = centroid.geometry.coordinates as [number, number];
    
    // Extract coordinates
    const coordinates = feature.geometry.coordinates[0]; // First ring of polygon
    
    // Generate unique ID
    const id = generateFeatureId('catchment');
    
    // Extract slope from terrain (async operation)
    const averageSlope = await extractSlopeFromTerrain(null, coordinates);
    
    // Calculate flow path length (async operation)
    const flowPathResult = await calculateFlowPathLength(null, coordinates);
    
    // Create catchment data with extracted values
    const catchment: CatchmentData = {
      id,
      name: `Catchment ${context.catchments.length + 1}`,
      coordinates,
      area: Math.round(area), // Round to nearest square meter
      center,
      
      // Extracted catchment properties
      averageSlope: Math.round(averageSlope * 10) / 10, // Round to 1 decimal place
      flowPathLength: flowPathResult.flowPathLength,
      surfaceType: "asphalt", // Default to asphalt/concrete
      runoffCoefficient: 0.9, // Default coefficient for asphalt
      
      // Default rainfall properties
      returnPeriod: 10, // years
      useIDF: true,
    };
    
    return catchment;
  } catch (error) {
    console.error("Error processing polygon feature:", error);
    throw new Error("Error processing the drawn polygon. Please try again.");
  }
}

/**
 * Process a line feature for channel alignment
 * 
 * @param feature - The GeoJSON line feature
 * @param context - The processing context
 * @returns Promise resolving to the created channel data
 */
export async function processLineFeature(
  feature: any,
  context: FeatureProcessingContext
): Promise<ChannelAlignment> {
  try {
    // Calculate line length using Turf.js
    const length = turf.length(feature, { units: 'meters' });
    
    // Get line coordinates
    const coordinates = feature.geometry.coordinates;
    
    // Generate unique ID
    const id = generateFeatureId('channel');
    
    // Calculate gradient from elevation data
    const gradientResult = await calculateChannelGradient(null, coordinates);
    
    // Create channel data
    const channel: ChannelAlignment = {
      id,
      name: `Channel ${context.channels.length + 1}`,
      coordinates,
      length: Math.round(length),
      type: 'channel_alignment',
      // Link to catchment (none by default)
      linkedCatchmentId: undefined,
      // Channel properties with calculated values
      channelShape: "trapezoidal" as const,
      channelGradient: gradientResult.gradient, // Auto-calculated gradient
      channelMaterial: "concrete", // default material
      manualGradientOverride: false, // Auto-calculated by default
      // Upstream channels (empty by default)
      upstreamChannels: []
    };
    
    return channel;
  } catch (error) {
    console.error("Error processing line feature:", error);
    throw new Error("Error processing the drawn line. Please try again.");
  }
}

/**
 * Handle feature creation events from Mapbox Draw
 * 
 * @param e - The draw create event
 * @param context - The processing context
 */
export async function handleDrawCreate(
  e: any,
  context: FeatureProcessingContext
): Promise<void> {
  const features = e.features;
  
  for (const feature of features) {
    try {
      if (feature.geometry.type === 'Polygon') {
        const catchment = await processPolygonFeature(feature, context);
        context.handlers.onCatchmentAdded(catchment);
        context.addCatchmentLabel(catchment);
      } else if (feature.geometry.type === 'LineString') {
        const channel = await processLineFeature(feature, context);
        context.handlers.onChannelAdded(channel);
      }
    } catch (error) {
      console.error('Error processing feature:', error);
      // Continue processing other features even if one fails
    }
  }
}

/**
 * Handle feature update events from Mapbox Draw
 * 
 * @param e - The draw update event
 * @param context - The processing context
 */
export async function handleDrawUpdate(
  e: any,
  context: FeatureProcessingContext
): Promise<void> {
  const features = e.features;
  
  for (const feature of features) {
    try {
      if (feature.geometry.type === 'Polygon') {
        const catchment = await processPolygonFeature(feature, context);
        context.handlers.onCatchmentAdded(catchment);
        context.addCatchmentLabel(catchment);
      } else if (feature.geometry.type === 'LineString') {
        const channel = await processLineFeature(feature, context);
        context.handlers.onChannelAdded(channel);
      }
    } catch (error) {
      console.error('Error processing updated feature:', error);
      // Continue processing other features even if one fails
    }
  }
}

/**
 * Handle feature deletion events from Mapbox Draw
 * 
 * @param e - The draw delete event
 * @param context - The processing context
 */
export function handleDrawDelete(
  e: any,
  context: FeatureProcessingContext
): void {
  const deletedFeatures = e.features;
  
  deletedFeatures.forEach((feature: any) => {
    try {
      if (feature.geometry.type === 'Polygon') {
        // Find and remove the corresponding catchment
        const catchment = context.catchments.find(c => 
          JSON.stringify(c.coordinates) === JSON.stringify(feature.geometry.coordinates[0])
        );
        if (catchment && context.handlers.onCatchmentRemoved) {
          context.handlers.onCatchmentRemoved(catchment.id);
        }
      } else if (feature.geometry.type === 'LineString') {
        // Find and remove the corresponding channel
        const channel = context.channels.find(c => 
          JSON.stringify(c.coordinates) === JSON.stringify(feature.geometry.coordinates)
        );
        if (channel && context.handlers.onChannelRemoved) {
          context.handlers.onChannelRemoved(channel.id);
        }
      }
    } catch (error) {
      console.error('Error handling feature deletion:', error);
    }
  });
}

/**
 * Find features that need to be removed from the map
 * (exist on map but not in the current catchments array)
 * 
 * @param currentFeatures - Current features on the map
 * @param catchments - Current catchments array
 * @returns Array of features to remove
 */
export function findFeaturesToRemove(
  currentFeatures: any[],
  catchments: CatchmentData[]
): any[] {
  return currentFeatures.filter((feature: any) => {
    if (feature.geometry.type === 'Polygon') {
      // Check if this polygon corresponds to a catchment that still exists
      const correspondingCatchment = catchments.find(c => 
        JSON.stringify(c.coordinates) === JSON.stringify(feature.geometry.coordinates[0])
      );
      return !correspondingCatchment; // Remove if no corresponding catchment found
    }
    return false; // Keep non-polygon features
  });
}

/**
 * Clear all features of a specific type from the map
 * 
 * @param draw - The MapboxDraw instance
 * @param featureType - The type of features to clear ('Polygon' or 'LineString')
 * @param context - The processing context
 */
export function clearFeaturesByType(
  draw: any,
  featureType: 'Polygon' | 'LineString',
  context: FeatureProcessingContext
): void {
  if (!draw) return;

  const features = draw.getAll();
  features.features.forEach((feature: any) => {
    if (feature.geometry.type === featureType) {
      draw.delete(feature.id);
    }
  });
  
  // Remove from parent component
  if (featureType === 'Polygon') {
    context.catchments.forEach(catchment => {
      if (context.handlers.onCatchmentRemoved) {
        context.handlers.onCatchmentRemoved(catchment.id);
      }
    });
  } else if (featureType === 'LineString') {
    context.channels.forEach(channel => {
      if (context.handlers.onChannelRemoved) {
        context.handlers.onChannelRemoved(channel.id);
      }
    });
  }
}

/**
 * Clear all features from the map
 * 
 * @param draw - The MapboxDraw instance
 * @param context - The processing context
 */
export function clearAllFeatures(
  draw: any,
  context: FeatureProcessingContext
): void {
  if (!draw) return;

  draw.deleteAll();
  
  // Remove all catchments from the parent component
  context.catchments.forEach(catchment => {
    if (context.handlers.onCatchmentRemoved) {
      context.handlers.onCatchmentRemoved(catchment.id);
    }
  });
  
  // Remove all channels from the parent component
  context.channels.forEach(channel => {
    if (context.handlers.onChannelRemoved) {
      context.handlers.onChannelRemoved(channel.id);
    }
  });
}

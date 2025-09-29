/**
 * Types for the batch design feature
 * 
 * This module contains all TypeScript interfaces and type definitions
 * used throughout the batch design application.
 */

/**
 * Represents a catchment drawn on the map
 */
export interface CatchmentData {
  /** Unique identifier for the catchment */
  id: string;
  /** Display name for the catchment */
  name: string;
  /** Array of [lng, lat] coordinates defining the catchment boundary */
  coordinates: number[][];
  /** Area in square meters */
  area: number;
  /** Center point [lng, lat] of the catchment */
  center: [number, number];
  
  // Catchment properties for calculations
  /** Average slope in m per 100m */
  averageSlope: number;
  /** Flow path length in meters */
  flowPathLength: number;
  /** Surface type ID (e.g., "asphalt", "grass") */
  surfaceType: string;
  /** Runoff coefficient calculated from surface type */
  runoffCoefficient: number;
  
  // Rainfall properties
  /** Return period in years */
  returnPeriod: number;
  /** Whether to use IDF curves for rainfall intensity */
  useIDF: boolean;
}

/**
 * Results from batch calculations for a single catchment
 */
export interface BatchCalculationResult {
  /** Unique identifier of the catchment */
  catchmentId: string;
  /** Display name of the catchment */
  catchmentName: string;
  
  // Calculation results
  /** Time of concentration in minutes */
  timeOfConcentration: number;
  /** Peak flow in m³/s */
  peakFlow: number;
  /** Required channel width in meters */
  requiredChannelWidth: number;
  /** Selected channel width in meters */
  selectedChannelWidth: number;
  /** Selected channel size label (e.g., "300mm") */
  selectedChannelSize: string;
  /** Calculated flow capacity in m³/s */
  calculatedFlow: number;
  /** Flow velocity in m/s */
  velocity: number;
  /** Design status */
  status: "OK" | "Not OK";
  /** Error message if design failed */
  error?: string;
  /** Warning message for velocity issues */
  velocityWarning?: string;
  
  // Intermediate calculations
  /** Catchment time of concentration in minutes */
  catchmentTC: number;
  /** Upstream time of concentration in minutes */
  upstreamTC: number;
  /** Effective time of concentration in minutes */
  effectiveTC: number;
  /** Rainfall intensity in mm/hr */
  rainfallIntensity: number;
  /** Runoff coefficient */
  runoffCoefficient: number;
  /** Return period in years */
  returnPeriod: number;
  
  // Processing status
  /** Whether the calculation was completed successfully */
  processed: boolean;
  /** Processing error message if calculation failed */
  processingError?: string;
  
  // Manning's equation details
  /** Manning's roughness coefficient */
  manningN?: number;
  /** Channel cross-sectional area in m² */
  channelArea?: number;
  /** Wetted perimeter in meters */
  wettedPerimeter?: number;
  /** Hydraulic radius in meters */
  hydraulicRadius?: number;
  /** Channel gradient (slope) in m/m */
  channelGradient?: number;
  /** Channel shape type */
  channelShape?: "trapezoidal" | "u-channel";
  /** Channel material */
  channelMaterial?: string;
}

/**
 * Mapbox draw event interface
 */
export interface MapboxDrawEvent {
  /** Event type */
  type: string;
  /** Array of features involved in the event */
  features: unknown[];
}

/**
 * Surface type configuration
 */
export interface SurfaceType {
  /** Unique identifier for the surface type */
  id: string;
  /** Display name for the surface type */
  name: string;
  /** Runoff coefficient for this surface type */
  coefficient: number;
}

/**
 * Channel material configuration
 */
export interface ChannelMaterial {
  /** Unique identifier for the material */
  id: string;
  /** Display name for the material */
  name: string;
  /** Manning's roughness coefficient */
  manningN: number;
}

/**
 * U-channel size configuration
 */
export interface UChannelSize {
  /** Channel size in millimeters */
  size: number;
  /** Display label for the size */
  label: string;
}

/**
 * Upstream channel reference
 */
export interface UpstreamChannel {
  /** ID of the upstream channel */
  channelId: string;
  /** Channel number/identifier */
  channelNo: string;
}

/**
 * Channel alignment data representing a drainage channel
 */
export interface ChannelAlignment {
  /** Unique identifier for the channel */
  id: string;
  /** Display name for the channel */
  name: string;
  /** Array of [lng, lat] coordinates defining the channel path */
  coordinates: number[][];
  /** Channel length in meters */
  length: number;
  /** Type identifier */
  type: 'channel_alignment';
  
  // Link to catchment
  /** ID of the catchment this channel serves (optional) */
  linkedCatchmentId?: string;
  
  // Channel properties
  /** Channel cross-section shape */
  channelShape: "trapezoidal" | "u-channel";
  /** Channel gradient in m/m */
  channelGradient: number;
  /** Channel material type */
  channelMaterial: string;
  /** Whether to use manual gradient input instead of calculated */
  manualGradientOverride: boolean;
  
  // Upstream channel information
  /** Array of upstream channels */
  upstreamChannels: UpstreamChannel[];
}

/**
 * Mapbox map instance type (using any for external library)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type MapboxMap = any;

/**
 * MapboxDraw instance type (using any for external library)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type MapboxDraw = any;

/**
 * Turf.js library type (using any for external library)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Turf = any;

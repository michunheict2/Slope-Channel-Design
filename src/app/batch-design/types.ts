// Types for the batch design feature

// Represents a catchment drawn on the map
export interface CatchmentData {
  id: string;
  name: string;
  coordinates: number[][]; // Array of [lng, lat] coordinates
  area: number; // Area in square meters
  center: [number, number]; // Center point [lng, lat]
  
  // Catchment properties for calculations
  averageSlope: number; // m per 100m
  flowPathLength: number; // m
  surfaceType: string; // surface type ID
  runoffCoefficient: number; // calculated from surface type
  
  // Rainfall properties
  returnPeriod: number; // years
  useIDF: boolean;
}

// Results from batch calculations
export interface BatchCalculationResult {
  catchmentId: string;
  catchmentName: string;
  
  // Calculation results
  timeOfConcentration: number; // minutes
  peakFlow: number; // m³/s
  requiredChannelWidth: number; // m
  selectedChannelWidth: number; // m
  selectedChannelSize: string; // label (e.g., "300mm")
  calculatedFlow: number; // m³/s
  velocity: number; // m/s
  status: "OK" | "Not OK";
  error?: string;
  velocityWarning?: string;
  
  // Intermediate calculations
  catchmentTC: number;
  upstreamTC: number;
  effectiveTC: number;
  rainfallIntensity: number;
  runoffCoefficient: number;
  returnPeriod: number;
  
  // Processing status
  processed: boolean;
  processingError?: string;
}

// Mapbox draw event types
export interface MapboxDrawEvent {
  type: string;
  features: any[];
}

// Surface type options (same as in existing code)
export interface SurfaceType {
  id: string;
  name: string;
  coefficient: number;
}

// Channel material options (same as in existing code)
export interface ChannelMaterial {
  id: string;
  name: string;
  manningN: number;
}

// U-channel size options
export interface UChannelSize {
  size: number; // in mm
  label: string;
}

// Channel alignment data
export interface ChannelAlignment {
  id: string;
  name: string;
  coordinates: number[][]; // Array of [lng, lat] coordinates
  length: number; // Length in meters
  type: 'channel_alignment';
  
  // Link to catchment
  linkedCatchmentId?: string; // ID of the catchment this channel serves
  
  // Channel properties
  channelShape: "trapezoidal" | "u-channel";
  channelGradient: number; // m/m
  channelMaterial: string; // material type
  manualGradientOverride: boolean; // whether to use manual gradient input
  
  // Upstream channel information
  upstreamChannels: Array<{
    channelId: string; // ID of the upstream channel
    channelNo: string;
  }>;
}

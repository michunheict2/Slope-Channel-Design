import { CatchmentData, BatchCalculationResult, ChannelAlignment } from "../types";
import { mmPerHourToMetersPerSecond } from "../../design/utils/units";
import { calculateTrapezoidGeometry, calculateUChannelGeometry } from "../../design/utils/geometry";

// Surface types (same as in existing code)
const SURFACE_TYPES = [
  { id: "undrain", name: "Undrained", coefficient: 1.0 },
  { id: "asphalt", name: "Asphalt/Concrete", coefficient: 0.90 },
  { id: "roof", name: "Roofs", coefficient: 0.85 },
  { id: "gravel", name: "Gravel", coefficient: 0.35 },
  { id: "lawn", name: "Lawn/Grass", coefficient: 0.20 },
  { id: "lawn_steep", name: "Lawn/Grass (Steep)", coefficient: 0.25 },
  { id: "forest", name: "Forest", coefficient: 0.10 },
  { id: "bare_soil", name: "Bare Soil", coefficient: 0.30 },
  { id: "cultivated", name: "Cultivated Land", coefficient: 0.35 },
  { id: "pasture", name: "Pasture/Range", coefficient: 0.20 },
  { id: "desert", name: "Desert/Barren", coefficient: 0.70 },
];

// Channel materials
const CHANNEL_MATERIALS = [
  { id: "concrete", name: "Concrete", manningN: 0.013 },
  { id: "asphalt", name: "Asphalt", manningN: 0.016 },
  { id: "brick", name: "Brick", manningN: 0.015 },
  { id: "stone", name: "Stone", manningN: 0.025 },
  { id: "earth", name: "Earth", manningN: 0.025 },
  { id: "grass", name: "Grass", manningN: 0.035 },
  { id: "gravel", name: "Gravel", manningN: 0.030 },
  { id: "riprap", name: "Riprap", manningN: 0.040 },
];

// Regular U-channel sizes
const U_CHANNEL_SIZES = [
  { size: 100, label: "100mm" },
  { size: 150, label: "150mm" },
  { size: 225, label: "225mm" },
  { size: 250, label: "250mm" },
  { size: 300, label: "300mm" },
  { size: 375, label: "375mm" },
  { size: 450, label: "450mm" },
  { size: 525, label: "525mm" },
  { size: 600, label: "600mm" },
];

// Calculate Time of Concentration for catchment area using DSD SDM method
function calculateCatchmentTC(area: number, slope: number, length: number): number {
  // Using DSD SDM method: t_o = (0.14465 * L) / (H^0.2 * A^0.1)
  const tc = (0.14465 * length) / (Math.pow(slope, 0.2) * Math.pow(area, 0.1));
  return Math.max(tc, 5); // Minimum 5 minutes
}


// Calculate peak flow using Rational Method
function calculatePeakFlow(
  catchmentArea: number,
  surfaceType: string,
  tc: number,
  returnPeriod: number,
  useIDF: boolean,
  idfConstants: unknown[],
  calculateIDF: (rp: number, tc: number, climateChange: boolean) => { intensity: number }
): { peakFlow: number; rainfallIntensity: number; runoffCoefficient: number } {
  const surfaceTypeData = SURFACE_TYPES.find(s => s.id === surfaceType);
  const runoffCoefficient = surfaceTypeData?.coefficient || 1.0;

  let rainfallIntensity: number;
  
  if (useIDF && idfConstants.length > 0) {
    try {
      const idfResult = calculateIDF(returnPeriod, tc, false);
      rainfallIntensity = idfResult.intensity; // mm/hr
    } catch (error) {
      console.error("IDF calculation error:", error);
      rainfallIntensity = 100; // fallback value
    }
  } else {
    rainfallIntensity = 100; // fallback value
  }

  // Convert to SI units and calculate peak flow
  const intensityMS = mmPerHourToMetersPerSecond(rainfallIntensity);
  const peakFlow = runoffCoefficient * intensityMS * catchmentArea;
  
  return { peakFlow, rainfallIntensity, runoffCoefficient };
}

// Calculate required channel width
function calculateRequiredWidth(
  peakFlow: number,
  channelShape: "trapezoidal" | "u-channel",
  channelGradient: number,
  channelMaterial: string
): { requiredWidth: number; selectedWidth: number; selectedSize: string } {
  const materialData = CHANNEL_MATERIALS.find(m => m.id === channelMaterial);
  const manningN = materialData?.manningN || 0.013;

  if (channelShape === "trapezoidal") {
    // For trapezoidal: fixed bottom width 0.5m, side slope 1:2, solve for depth
    const bottomWidth = 0.5; // m
    const sideSlope = 2.0; // H:V ratio
    
    // Use bisection method to find depth that gives required flow
    let minDepth = 0.01; // 1 cm
    let maxDepth = 2.0; // 2 m
    let bestDepth = minDepth;
    
    for (let i = 0; i < 50; i++) {
      const testDepth = (minDepth + maxDepth) / 2;
      const geometry = calculateTrapezoidGeometry(testDepth, bottomWidth, sideSlope);
      const flow = (1 / manningN) * geometry.area * 
                  Math.pow(geometry.hydraulicRadius, 2/3) * 
                  Math.pow(channelGradient, 1/2);
      
      if (Math.abs(flow - peakFlow) < 0.001) {
        bestDepth = testDepth;
        break;
      } else if (flow < peakFlow) {
        minDepth = testDepth;
      } else {
        maxDepth = testDepth;
      }
    }
    
    // Calculate top width for the required depth
    const topWidth = bottomWidth + 2 * sideSlope * bestDepth;
    
    // Round up to the nearest 0.5m for trapezoidal channels
    const roundedTopWidth = Math.ceil(topWidth * 2) / 2; // Round up to nearest 0.5m
    
    return { 
      requiredWidth: topWidth, 
      selectedWidth: roundedTopWidth, 
      selectedSize: `${roundedTopWidth.toFixed(1)}m` 
    };
    
  } else {
    // For U-channel: find the smallest regular size that can handle the flow
    let requiredWidth = 0.1; // Start with 100mm
    
    // First calculate the theoretical required width
    let minWidth = 0.1; // 10 cm
    let maxWidth = 2.0; // 2 m
    
    for (let i = 0; i < 50; i++) {
      const testWidth = (minWidth + maxWidth) / 2;
      const radius = testWidth / 2; // For U-channel, radius = width/2
      const flowDepth = testWidth; // Flow depth = channel width
      const geometry = calculateUChannelGeometry(flowDepth, testWidth, radius);
      const flow = (1 / manningN) * geometry.area * 
                  Math.pow(geometry.hydraulicRadius, 2/3) * 
                  Math.pow(channelGradient, 1/2);
      
      if (Math.abs(flow - peakFlow) < 0.001) {
        requiredWidth = testWidth;
        break;
      } else if (flow < peakFlow) {
        minWidth = testWidth;
      } else {
        maxWidth = testWidth;
      }
    }
    
    // Find the smallest regular U-channel size that can handle the flow
    let selectedChannel = U_CHANNEL_SIZES[U_CHANNEL_SIZES.length - 1]; // Default to largest
    
    for (const channel of U_CHANNEL_SIZES) {
      const channelWidth = channel.size / 1000; // Convert mm to m
      const radius = channelWidth / 2;
      const flowDepth = channelWidth; // Flow depth = channel width
      const geometry = calculateUChannelGeometry(flowDepth, channelWidth, radius);
      const flow = (1 / manningN) * geometry.area * 
                  Math.pow(geometry.hydraulicRadius, 2/3) * 
                  Math.pow(channelGradient, 1/2);
      
      if (flow >= peakFlow) {
        selectedChannel = channel;
        break;
      }
    }
    
    return { 
      requiredWidth: requiredWidth, 
      selectedWidth: selectedChannel.size / 1000, 
      selectedSize: selectedChannel.label 
    };
  }
}

// Process a single catchment
async function processSingleCatchment(
  catchment: CatchmentData,
  channelProperties: {
    channelShape: "trapezoidal" | "u-channel";
    channelGradient: number;
    channelMaterial: string;
    upstreamChannels: Array<{
      channelId: string;
      channelNo: string;
    }>;
  },
  idfConstants: unknown[],
  calculateIDF: (rp: number, tc: number, climateChange: boolean) => { intensity: number }
): Promise<BatchCalculationResult> {
  
  try {
    // Calculate time of concentration
    const catchmentTC = calculateCatchmentTC(catchment.area, catchment.averageSlope, catchment.flowPathLength);
    
    // Get upstream channel TCs (calculate automatically)
    const upstreamTCs = channelProperties.upstreamChannels
      .map(() => {
        // For now, use a default calculation based on channel length
        // In a real implementation, this would calculate based on channel properties
        // Using a simplified formula: TC = 0.02 * L^0.77 * S^-0.385
        // Where L is length in meters and S is slope
        const defaultLength = 100; // Default channel length in meters
        const defaultSlope = 0.01; // Default slope (1%)
        return 0.02 * Math.pow(defaultLength, 0.77) * Math.pow(defaultSlope, -0.385);
      });
    
    const upstreamTC = upstreamTCs.length > 0 ? Math.max(...upstreamTCs) : 0;
    const effectiveTC = Math.max(catchmentTC, upstreamTC);

    // Calculate peak flow
    const { peakFlow, rainfallIntensity, runoffCoefficient } = calculatePeakFlow(
      catchment.area,
      catchment.surfaceType,
      effectiveTC,
      catchment.returnPeriod,
      catchment.useIDF,
      idfConstants,
      calculateIDF
    );

    // Calculate required channel width
    const widthResult = calculateRequiredWidth(
      peakFlow,
      channelProperties.channelShape,
      channelProperties.channelGradient,
      channelProperties.channelMaterial
    );

    // Calculate actual flow and velocity for the selected width
    const materialData = CHANNEL_MATERIALS.find(m => m.id === channelProperties.channelMaterial);
    const manningN = materialData?.manningN || 0.013;
    
    let calculatedFlow: number;
    let velocity: number;
    
    if (channelProperties.channelShape === "trapezoidal") {
      const bottomWidth = 0.5;
      const sideSlope = 2.0;
      const depth = (widthResult.selectedWidth - bottomWidth) / (2 * sideSlope);
      const geometry = calculateTrapezoidGeometry(depth, bottomWidth, sideSlope);
      calculatedFlow = (1 / manningN) * geometry.area * 
                      Math.pow(geometry.hydraulicRadius, 2/3) * 
                      Math.pow(channelProperties.channelGradient, 1/2);
      velocity = calculatedFlow / geometry.area;
    } else {
      const radius = widthResult.selectedWidth / 2;
      const flowDepth = widthResult.selectedWidth;
      const geometry = calculateUChannelGeometry(flowDepth, widthResult.selectedWidth, radius);
      calculatedFlow = (1 / manningN) * geometry.area * 
                      Math.pow(geometry.hydraulicRadius, 2/3) * 
                      Math.pow(channelProperties.channelGradient, 1/2);
      velocity = calculatedFlow / geometry.area;
    }
    
    // Check design status
    let status: "OK" | "Not OK" = "OK";
    let error: string | undefined;
    let velocityWarning: string | undefined;
    
    const utilization = peakFlow / calculatedFlow;
    if (utilization > 1.0) {
      status = "Not OK";
      error = `Channel utilization (${(utilization * 100).toFixed(1)}%) exceeds 100%. Required flow (${peakFlow.toFixed(3)} m³/s) exceeds channel capacity (${calculatedFlow.toFixed(3)} m³/s)`;
    }
    
    // Check velocity limits
    if (velocity < 0.3) {
      status = "Not OK";
      error = `Velocity too low (${velocity.toFixed(2)} m/s). Minimum recommended: 0.3 m/s`;
    } else if (velocity > 4.0) {
      velocityWarning = `Velocity higher than 4.0 m/s (${velocity.toFixed(2)} m/s)`;
    }

    // Get geometry details for Manning's equation
    let geometry: { area: number; perimeter: number; hydraulicRadius: number };
    if (channelProperties.channelShape === "trapezoidal") {
      const bottomWidth = 0.5;
      const sideSlope = 2.0;
      const depth = (widthResult.selectedWidth - bottomWidth) / (2 * sideSlope);
      geometry = calculateTrapezoidGeometry(depth, bottomWidth, sideSlope);
    } else {
      const radius = widthResult.selectedWidth / 2;
      const flowDepth = widthResult.selectedWidth;
      geometry = calculateUChannelGeometry(flowDepth, widthResult.selectedWidth, radius);
    }

    return {
      catchmentId: catchment.id,
      catchmentName: catchment.name,
      
      // Results
      timeOfConcentration: effectiveTC,
      peakFlow,
      requiredChannelWidth: widthResult.requiredWidth,
      selectedChannelWidth: widthResult.selectedWidth,
      selectedChannelSize: widthResult.selectedSize,
      calculatedFlow,
      velocity,
      status,
      error,
      velocityWarning,
      
      // Intermediate calculations
      catchmentTC,
      upstreamTC,
      effectiveTC,
      rainfallIntensity,
      runoffCoefficient,
      returnPeriod: catchment.returnPeriod,
      
      // Manning's equation details
      manningN,
      channelArea: geometry.area,
      wettedPerimeter: geometry.perimeter,
      hydraulicRadius: geometry.hydraulicRadius,
      channelGradient: channelProperties.channelGradient,
      channelShape: channelProperties.channelShape,
      channelMaterial: channelProperties.channelMaterial,
      
      // Processing status
      processed: true,
    };

  } catch (err) {
    return {
      catchmentId: catchment.id,
      catchmentName: catchment.name,
      
      // Results (with error)
      timeOfConcentration: 0,
      peakFlow: 0,
      requiredChannelWidth: 0,
      selectedChannelWidth: 0,
      selectedChannelSize: "N/A",
      calculatedFlow: 0,
      velocity: 0,
      status: "Not OK",
      error: err instanceof Error ? err.message : "Unknown calculation error",
      
      // Intermediate calculations
      catchmentTC: 0,
      upstreamTC: 0,
      effectiveTC: 0,
      rainfallIntensity: 0,
      runoffCoefficient: 0,
      returnPeriod: 0,
      
      // Processing status
      processed: false,
      processingError: err instanceof Error ? err.message : "Unknown processing error",
    };
  }
}

// Main batch processing function
export async function processBatchCatchments(
  catchments: CatchmentData[],
  channels: ChannelAlignment[] = []
): Promise<BatchCalculationResult[]> {
  // Load IDF constants (we'll need to handle this differently since we can't use hooks in utils)
  // For now, we'll use a simplified approach with default values
  const idfConstants: unknown[] = []; // This would be loaded from the IDF hook
  const calculateIDF = (rp: number, tc: number, climateChange: boolean) => {
    // Simplified IDF calculation - in a real implementation, this would use the actual IDF constants
    const baseIntensity = 100; // mm/hr
    const climateChangeFactor = climateChange ? 1.281 : 1.0;
    return { intensity: baseIntensity * climateChangeFactor };
  };

  const results: BatchCalculationResult[] = [];

  // Process each catchment
  for (const catchment of catchments) {
    try {
      // Find the channel linked to this catchment
      const linkedChannel = channels.find(channel => channel.linkedCatchmentId === catchment.id);
      
      // Use channel properties if linked, otherwise use defaults
      const channelProperties = linkedChannel ? {
        channelShape: linkedChannel.channelShape,
        channelGradient: linkedChannel.channelGradient,
        channelMaterial: linkedChannel.channelMaterial,
        upstreamChannels: linkedChannel.upstreamChannels
      } : {
        channelShape: "trapezoidal" as const,
        channelGradient: 0.01,
        channelMaterial: "concrete",
        upstreamChannels: []
      };
      
      const result = await processSingleCatchment(catchment, channelProperties, idfConstants, calculateIDF);
      results.push(result);
    } catch (error) {
      console.error(`Error processing catchment ${catchment.id}:`, error);
      results.push({
        catchmentId: catchment.id,
        catchmentName: catchment.name,
        
        // Results (with error)
        timeOfConcentration: 0,
        peakFlow: 0,
        requiredChannelWidth: 0,
        selectedChannelWidth: 0,
        selectedChannelSize: "N/A",
        calculatedFlow: 0,
        velocity: 0,
        status: "Not OK",
        error: error instanceof Error ? error.message : "Unknown processing error",
        
        // Intermediate calculations
        catchmentTC: 0,
        upstreamTC: 0,
        effectiveTC: 0,
        rainfallIntensity: 0,
        runoffCoefficient: 0,
        returnPeriod: 0,
        
        // Processing status
        processed: false,
        processingError: error instanceof Error ? error.message : "Unknown processing error",
      });
    }
  }

  return results;
}

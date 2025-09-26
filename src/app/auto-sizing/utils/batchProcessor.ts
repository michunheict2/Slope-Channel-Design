import { ExcelChannelData } from './excelTemplate';
import { IDFConstants } from '../../design/hooks/useIDF';

// Interface for batch processing results
export interface BatchChannelResult {
  // Input data
  channelId: string;
  
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
  
  // Processing status
  processed: boolean;
  processingError?: string;
}

// Interface for batch processing summary
export interface BatchProcessingSummary {
  totalChannels: number;
  processedChannels: number;
  successfulChannels: number;
  failedChannels: number;
  results: BatchChannelResult[];
  errors: string[];
  processingTime: number; // milliseconds
}

// Import the calculation functions from the existing design modules
// import { rationalQ, manningFlow } from '../../design/hooks/useRational';
// import { useIDF } from '../../design/hooks/useIDF';
import { mmPerHourToMetersPerSecond } from '../../design/utils/units';
import { calculateTrapezoidGeometry, calculateUChannelGeometry } from '../../design/utils/geometry';

// Surface types and materials (same as in the main page)
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

// Calculate the larger Time of Concentration
// function getEffectiveTC(
//   catchmentArea: number, 
//   averageSlope: number, 
//   flowPathLength: number,
//   upstreamChannelTCs: number[]
// ): number {
//   const catchmentTCValue = calculateCatchmentTC(catchmentArea, averageSlope, flowPathLength);
//   const upstreamTCValue = upstreamChannelTCs.length > 0 ? Math.max(...upstreamChannelTCs) : 0;
//   return Math.max(catchmentTCValue, upstreamTCValue);
// }

// Calculate peak flow using Rational Method
function calculatePeakFlow(
  catchmentArea: number,
  surfaceType: string,
  tc: number,
  returnPeriod: number,
  useIDF: boolean,
  idfConstants: IDFConstants[],
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

// Process a single channel design
async function processSingleChannel(
  data: ExcelChannelData,
  idfConstants: IDFConstants[],
  calculateIDF: (rp: number, tc: number, climateChange: boolean) => { intensity: number }
): Promise<BatchChannelResult> {
  
  try {
    // For upstream channels, we'll need to look up their TCs from previously processed channels
    // For now, we'll assume upstream channels have a default TC or calculate from their parameters
    // This is a simplified approach - in a real system, you'd want to reference previously calculated TCs
    
    // Calculate time of concentration
    const catchmentTC = calculateCatchmentTC(data.catchmentArea, data.averageSlope, data.flowPathLength);
    
    // For upstream channels, we'll use a default TC of 15 minutes if IDs are provided
    // In a more sophisticated system, you'd look up the actual TCs from previous calculations
    const upstreamTC = data.upstreamChannelIds.trim() ? 15 : 0; // Default 15 minutes
    const effectiveTC = Math.max(catchmentTC, upstreamTC);

    // Calculate peak flow
    const { peakFlow, rainfallIntensity, runoffCoefficient } = calculatePeakFlow(
      data.catchmentArea,
      data.surfaceType,
      effectiveTC,
      data.returnPeriod,
      data.useIDF,
      idfConstants,
      calculateIDF
    );

    // Calculate required channel width
    const widthResult = calculateRequiredWidth(
      peakFlow,
      data.channelShape,
      data.channelGradient,
      data.channelMaterial
    );

    // Calculate actual flow and velocity for the selected width
    const materialData = CHANNEL_MATERIALS.find(m => m.id === data.channelMaterial);
    const manningN = materialData?.manningN || 0.013;
    
    let calculatedFlow: number;
    let velocity: number;
    
    if (data.channelShape === "trapezoidal") {
      const bottomWidth = 0.5;
      const sideSlope = 2.0;
      const depth = (widthResult.selectedWidth - bottomWidth) / (2 * sideSlope);
      const geometry = calculateTrapezoidGeometry(depth, bottomWidth, sideSlope);
      calculatedFlow = (1 / manningN) * geometry.area * 
                      Math.pow(geometry.hydraulicRadius, 2/3) * 
                      Math.pow(data.channelGradient, 1/2);
      velocity = calculatedFlow / geometry.area;
    } else {
      const radius = widthResult.selectedWidth / 2;
      const flowDepth = widthResult.selectedWidth;
      const geometry = calculateUChannelGeometry(flowDepth, widthResult.selectedWidth, radius);
      calculatedFlow = (1 / manningN) * geometry.area * 
                      Math.pow(geometry.hydraulicRadius, 2/3) * 
                      Math.pow(data.channelGradient, 1/2);
      velocity = calculatedFlow / geometry.area;
    }
    
    // Check design status
    let status: "OK" | "Not OK" = "OK";
    let error: string | undefined;
    let velocityWarning: string | undefined;
    
    const flowRatio = calculatedFlow / peakFlow;
    if (flowRatio < 0.95) {
      status = "Not OK";
      error = `Channel capacity (${calculatedFlow.toFixed(3)} m³/s) is less than required peak flow (${peakFlow.toFixed(3)} m³/s)`;
    }
    
    // Check velocity limits
    if (velocity < 0.3) {
      status = "Not OK";
      error = `Velocity too low (${velocity.toFixed(2)} m/s). Minimum recommended: 0.3 m/s`;
    } else if (velocity > 4.0) {
      velocityWarning = `Velocity higher than 4.0 m/s (${velocity.toFixed(2)} m/s)`;
    }

    // Velocity limits are handled by the standard design criteria (0.3-4.0 m/s)

    return {
      // Input data
      channelId: data.channelId,
      
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
      
      // Processing status
      processed: true,
    };

  } catch (err) {
    return {
      // Input data
      channelId: data.channelId,
      
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
      
      // Processing status
      processed: false,
      processingError: err instanceof Error ? err.message : "Unknown processing error",
    };
  }
}

// Main batch processing function
export async function processBatchChannels(
  channelData: ExcelChannelData[],
  idfConstants: IDFConstants[],
  calculateIDF: (rp: number, tc: number, climateChange: boolean) => { intensity: number },
  onProgress?: (processed: number, total: number) => void
): Promise<BatchProcessingSummary> {
  const startTime = Date.now();
  const results: BatchChannelResult[] = [];
  const errors: string[] = [];
  
  let processedCount = 0;
  let successfulCount = 0;
  let failedCount = 0;

  // Process each channel
  for (let i = 0; i < channelData.length; i++) {
    const data = channelData[i];
    
    try {
      const result = await processSingleChannel(data, idfConstants, calculateIDF);
      results.push(result);
      processedCount++;
      
      if (result.processed && result.status === "OK") {
        successfulCount++;
      } else {
        failedCount++;
        if (result.error) {
          errors.push(`Channel ${data.channelId}: ${result.error}`);
        }
        if (result.processingError) {
          errors.push(`Channel ${data.channelId}: Processing error - ${result.processingError}`);
        }
      }
      
      // Report progress
      if (onProgress) {
        onProgress(processedCount, channelData.length);
      }
      
    } catch (error) {
      failedCount++;
      const errorMessage = `Channel ${data.channelId}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      errors.push(errorMessage);
      
      results.push({
        // Input data
        channelId: data.channelId,
        
        // Results (with error)
        timeOfConcentration: 0,
        peakFlow: 0,
        requiredChannelWidth: 0,
        selectedChannelWidth: 0,
        selectedChannelSize: "N/A",
        calculatedFlow: 0,
        velocity: 0,
        status: "Not OK",
        error: errorMessage,
        
        // Intermediate calculations
        catchmentTC: 0,
        upstreamTC: 0,
        effectiveTC: 0,
        rainfallIntensity: 0,
        runoffCoefficient: 0,
        
        // Processing status
        processed: false,
        processingError: errorMessage,
      });
    }
  }

  const processingTime = Date.now() - startTime;

  return {
    totalChannels: channelData.length,
    processedChannels: processedCount,
    successfulChannels: successfulCount,
    failedChannels: failedCount,
    results,
    errors,
    processingTime,
  };
}

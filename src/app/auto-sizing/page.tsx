"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useIDF } from "../design/hooks/useIDF";
// import { rationalQ } from "../design/hooks/useRational";
// import { manningFlow } from "../design/hooks/useManning";
import { calculateTrapezoidGeometry, calculateUChannelGeometry } from "../design/utils/geometry";
import { mmPerHourToMetersPerSecond } from "../design/utils/units";
import DetailedCalculations from "./components/DetailedCalculations";
import PDFExport from "./components/PDFExport";
import BatchProcessor from "./components/BatchProcessor";

// Types for our automatic sizing data
export interface AutoSizingData {
  // Catchment inputs
  catchmentArea: number; // m²
  averageSlope: number; // m per 100m
  flowPathLength: number; // m
  surfaceType: string; // surface type ID
  
  // Upstream channel inputs
  upstreamChannels: Array<{
    channelNo: string;
    timeOfConcentration: number; // minutes
  }>;
  
  // Rainfall inputs
  returnPeriod: number; // years
  useIDF: boolean;
  
  // Channel inputs
  channelShape: "trapezoidal" | "u-channel";
  channelGradient: number; // m/m
  channelMaterial: string; // material type
}

// Manning's n values for different materials
// const MANNING_N_VALUES = {
//   "concrete": 0.013,
//   "asphalt": 0.016,
//   "brick": 0.015,
//   "stone": 0.025,
//   "earth": 0.025,
//   "grass": 0.035,
//   "gravel": 0.030,
//   "riprap": 0.040,
// };

// Surface type options
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

// Channel material options
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

// Regular U-channel sizes (same as design page)
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

// Results interface
export interface SizingResults {
  timeOfConcentration: number; // minutes
  peakFlow: number; // m³/s
  requiredChannelWidth: number; // m
  selectedChannelWidth: number; // m (for U-channel, the actual selected size)
  selectedChannelSize: string; // label (e.g., "300mm")
  calculatedFlow: number; // m³/s
  velocity: number; // m/s
  status: "OK" | "Not OK";
  error?: string;
  velocityWarning?: string; // warning for high velocity
}

export default function AutoSizingPage() {
  // State for form data
  const [data, setData] = useState<AutoSizingData>({
    catchmentArea: 1000, // m²
    averageSlope: 5, // m per 100m
    flowPathLength: 200, // m
    surfaceType: "undrain",
    upstreamChannels: [
      { channelNo: "", timeOfConcentration: 0 },
      { channelNo: "", timeOfConcentration: 0 },
      { channelNo: "", timeOfConcentration: 0 },
      { channelNo: "", timeOfConcentration: 0 },
    ],
    returnPeriod: 10, // years
    useIDF: true,
    channelShape: "trapezoidal",
    channelGradient: 0.01, // m/m
    channelMaterial: "concrete",
  });

  const [results, setResults] = useState<SizingResults | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  
  // Intermediate calculation values for detailed display
  const [catchmentTC, setCatchmentTC] = useState<number>(0);
  const [upstreamTC, setUpstreamTC] = useState<number>(0);
  const [effectiveTC, setEffectiveTC] = useState<number>(0);
  const [rainfallIntensity, setRainfallIntensity] = useState<number>(0);
  const [runoffCoefficient, setRunoffCoefficient] = useState<number>(1.0);
  const [peakFlow, setPeakFlow] = useState<number>(0);

  // Load IDF constants
  const { constants: idfConstants, loading: idfLoading, calculate: calculateIDF } = useIDF();

  // Calculate Time of Concentration for catchment area using DSD SDM method
  const calculateCatchmentTC = (area: number, slope: number, length: number): number => {
    // Using DSD SDM method: t_o = (0.14465 * L) / (H^0.2 * A^0.1)
    // Where: L = distance in m, H = average slope in m per 100m, A = catchment area in m²
    const tc = (0.14465 * length) / (Math.pow(slope, 0.2) * Math.pow(area, 0.1));
    return Math.max(tc, 5); // Minimum 5 minutes
  };

  // Calculate the larger Time of Concentration
  const getEffectiveTC = (): number => {
    const catchmentTCValue = calculateCatchmentTC(data.catchmentArea, data.averageSlope, data.flowPathLength);
    const upstreamTCValue = Math.max(...data.upstreamChannels.map(ch => ch.timeOfConcentration));
    const effectiveTCValue = Math.max(catchmentTCValue, upstreamTCValue);
    
    // Store intermediate values
    setCatchmentTC(catchmentTCValue);
    setUpstreamTC(upstreamTCValue);
    setEffectiveTC(effectiveTCValue);
    
    return effectiveTCValue;
  };

  // Calculate peak flow using Rational Method
  const calculatePeakFlow = (): number => {
    const tc = getEffectiveTC();
    const surfaceTypeData = SURFACE_TYPES.find(s => s.id === data.surfaceType);
    const runoffCoefficientValue = surfaceTypeData?.coefficient || 1.0;

    let rainfallIntensityValue: number;
    
    if (data.useIDF && idfConstants.length > 0) {
      try {
        const idfResult = calculateIDF(data.returnPeriod, tc, false);
        rainfallIntensityValue = idfResult.intensity; // mm/hr
      } catch (error) {
        console.error("IDF calculation error:", error);
        rainfallIntensityValue = 100; // fallback value
      }
    } else {
      rainfallIntensityValue = 100; // fallback value
    }

    // Store intermediate values
    setRunoffCoefficient(runoffCoefficientValue);
    setRainfallIntensity(rainfallIntensityValue);

    // Convert to SI units and calculate peak flow
    const intensityMS = mmPerHourToMetersPerSecond(rainfallIntensityValue);
    const peakFlowValue = runoffCoefficientValue * intensityMS * data.catchmentArea;
    
    setPeakFlow(peakFlowValue);
    return peakFlowValue;
  };

  // Calculate required channel width
  const calculateRequiredWidth = (peakFlow: number): { requiredWidth: number; selectedWidth: number; selectedSize: string } => {
    const materialData = CHANNEL_MATERIALS.find(m => m.id === data.channelMaterial);
    const manningN = materialData?.manningN || 0.013;

    if (data.channelShape === "trapezoidal") {
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
                    Math.pow(data.channelGradient, 1/2);
        
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
                    Math.pow(data.channelGradient, 1/2);
        
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
      // const requiredWidthMM = requiredWidth * 1000;
      let selectedChannel = U_CHANNEL_SIZES[U_CHANNEL_SIZES.length - 1]; // Default to largest
      
      for (const channel of U_CHANNEL_SIZES) {
        const channelWidth = channel.size / 1000; // Convert mm to m
        const radius = channelWidth / 2;
        const flowDepth = channelWidth; // Flow depth = channel width
        const geometry = calculateUChannelGeometry(flowDepth, channelWidth, radius);
        const flow = (1 / manningN) * geometry.area * 
                    Math.pow(geometry.hydraulicRadius, 2/3) * 
                    Math.pow(data.channelGradient, 1/2);
        
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
  };

  // Main calculation function
  const handleCalculate = async () => {
    setIsCalculating(true);
    
    try {
      const tc = getEffectiveTC();
      const peakFlow = calculatePeakFlow();
      const widthResult = calculateRequiredWidth(peakFlow);
      
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
      
      setResults({
        timeOfConcentration: tc,
        peakFlow,
        requiredChannelWidth: widthResult.requiredWidth,
        selectedChannelWidth: widthResult.selectedWidth,
        selectedChannelSize: widthResult.selectedSize,
        calculatedFlow,
        velocity,
        status,
        error,
        velocityWarning,
      });
      
    } catch (err) {
      console.error("Calculation error:", err);
      setResults({
        timeOfConcentration: 0,
        peakFlow: 0,
        requiredChannelWidth: 0,
        selectedChannelWidth: 0,
        selectedChannelSize: "N/A",
        calculatedFlow: 0,
        velocity: 0,
        status: "Not OK",
        error: err instanceof Error ? err.message : "Unknown calculation error",
        velocityWarning: undefined,
      });
    } finally {
      setIsCalculating(false);
    }
  };

  // Check if all required fields are filled
  const canCalculate = 
    data.catchmentArea > 0 &&
    data.averageSlope > 0 &&
    data.flowPathLength > 0 &&
    data.channelGradient > 0 &&
    !idfLoading;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header with Back Button */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <Link href="/">
            <Button variant="outline" className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Home
            </Button>
          </Link>
        </div>
        <h1 className="text-3xl font-bold mb-2">Automatic Channel Sizing</h1>
        <p className="text-muted-foreground">
          Automatically determine optimal channel size based on catchment characteristics and flow requirements.
        </p>
      </div>

      {/* Batch Processor Section */}
      <div className="mb-8">
        <BatchProcessor />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Forms */}
        <div className="lg:col-span-2 space-y-6">
          {/* Catchment Information */}
          <Card>
            <CardHeader>
              <CardTitle>Catchment Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="catchmentArea">Catchment Area (A)</Label>
                  <Input
                    id="catchmentArea"
                    type="number"
                    value={data.catchmentArea}
                    onChange={(e) => setData(prev => ({ ...prev, catchmentArea: parseFloat(e.target.value) || 0 }))}
                    placeholder="1000"
                  />
                  <p className="text-sm text-muted-foreground">m²</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="averageSlope">Average Slope (H)</Label>
                  <Input
                    id="averageSlope"
                    type="number"
                    value={data.averageSlope}
                    onChange={(e) => setData(prev => ({ ...prev, averageSlope: parseFloat(e.target.value) || 0 }))}
                    placeholder="5"
                  />
                  <p className="text-sm text-muted-foreground">m per 100 m</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="flowPathLength">Flow Path Length (L)</Label>
                  <Input
                    id="flowPathLength"
                    type="number"
                    value={data.flowPathLength}
                    onChange={(e) => setData(prev => ({ ...prev, flowPathLength: parseFloat(e.target.value) || 0 }))}
                    placeholder="200"
                  />
                  <p className="text-sm text-muted-foreground">m</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="surfaceType">Surface Type</Label>
                  <Select value={data.surfaceType} onValueChange={(value) => setData(prev => ({ ...prev, surfaceType: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select surface type" />
                    </SelectTrigger>
                    <SelectContent>
                      {SURFACE_TYPES.map((surface) => (
                        <SelectItem key={surface.id} value={surface.id}>
                          {surface.name} (C = {surface.coefficient})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upstream Channels */}
          <Card>
            <CardHeader>
              <CardTitle>Upstream Channel Table</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Enter upstream channel information. Leave blank if not applicable.
              </p>
              <div className="space-y-3">
                {data.upstreamChannels.map((channel, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`channelNo-${index}`}>Channel No. {index + 1}</Label>
                      <Input
                        id={`channelNo-${index}`}
                        type="text"
                        value={channel.channelNo}
                        onChange={(e) => {
                          const newChannels = [...data.upstreamChannels];
                          newChannels[index].channelNo = e.target.value;
                          setData(prev => ({ ...prev, upstreamChannels: newChannels }));
                        }}
                        placeholder="CH-001"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`tc-${index}`}>Time of Concentration</Label>
                      <Input
                        id={`tc-${index}`}
                        type="number"
                        value={channel.timeOfConcentration}
                        onChange={(e) => {
                          const newChannels = [...data.upstreamChannels];
                          newChannels[index].timeOfConcentration = parseFloat(e.target.value) || 0;
                          setData(prev => ({ ...prev, upstreamChannels: newChannels }));
                        }}
                        placeholder="0"
                      />
                      <p className="text-sm text-muted-foreground">minutes</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Rainfall Information */}
          <Card>
            <CardHeader>
              <CardTitle>Rainfall Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="returnPeriod">Return Period</Label>
                <Select value={data.returnPeriod.toString()} onValueChange={(value) => setData(prev => ({ ...prev, returnPeriod: parseInt(value) }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select return period" />
                  </SelectTrigger>
                  <SelectContent>
                    {idfConstants.map((constant) => (
                      <SelectItem key={constant.RP} value={constant.RP.toString()}>
                        {constant.RP} years
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Using Hong Kong IDF curves with climate change adjustment (+28.1%)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Channel Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Channel Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="channelShape">Channel Shape</Label>
                  <Select value={data.channelShape} onValueChange={(value: "trapezoidal" | "u-channel") => setData(prev => ({ ...prev, channelShape: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select channel shape" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="trapezoidal">Trapezoidal (1:2 side slope, 0.5m bottom width)</SelectItem>
                      <SelectItem value="u-channel">U-Channel (flow depth = channel width)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="channelGradient">Channel Gradient</Label>
                  <Input
                    id="channelGradient"
                    type="number"
                    step="0.001"
                    value={data.channelGradient}
                    onChange={(e) => setData(prev => ({ ...prev, channelGradient: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.01"
                  />
                  <p className="text-sm text-muted-foreground">m/m</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="channelMaterial">Channel Material</Label>
                  <Select value={data.channelMaterial} onValueChange={(value) => setData(prev => ({ ...prev, channelMaterial: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select material" />
                    </SelectTrigger>
                    <SelectContent>
                      {CHANNEL_MATERIALS.map((material) => (
                        <SelectItem key={material.id} value={material.id}>
                          {material.name} (n = {material.manningN})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Calculate Button */}
          <Card>
            <CardContent className="pt-6">
              <Button 
                onClick={handleCalculate} 
                disabled={!canCalculate || isCalculating}
                className="w-full"
                size="lg"
              >
                {isCalculating ? "Calculating..." : "Calculate Channel Size"}
              </Button>
              {!canCalculate && (
                <div className="mt-3 p-3 bg-yellow-50 rounded-md">
                  <p className="text-sm text-yellow-800">
                    Please fill in all required fields to enable calculation.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Calculation Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {results ? (
                <>
                  {/* Time of Concentration */}
                  <div className="p-3 bg-blue-50 rounded-md">
                    <h4 className="font-medium text-blue-900 mb-2">Time of Concentration</h4>
                    <p className="text-lg font-bold text-blue-800">
                      {results.timeOfConcentration.toFixed(1)} minutes
                    </p>
                    <p className="text-xs text-blue-600">
                      Using the larger of catchment TC and upstream channel TC
                    </p>
                  </div>

                  {/* Peak Flow */}
                  <div className="p-3 bg-green-50 rounded-md">
                    <h4 className="font-medium text-green-900 mb-2">Peak Flow (Rational Method)</h4>
                    <p className="text-lg font-bold text-green-800">
                      {results.peakFlow.toFixed(3)} m³/s
                    </p>
                    <p className="text-xs text-green-600">
                      {(results.peakFlow * 1000).toFixed(1)} L/s
                    </p>
                  </div>

                  {/* Required Channel Width */}
                  <div className="p-3 bg-purple-50 rounded-md">
                    <h4 className="font-medium text-purple-900 mb-2">
                      {data.channelShape === "u-channel" ? "Selected Channel Size" : "Selected Channel Width"}
                    </h4>
                    <p className="text-2xl font-bold text-purple-800">
                      {data.channelShape === "u-channel" ? results.selectedChannelSize : results.selectedChannelSize}
                    </p>
                    <p className="text-sm text-purple-600">
                      {results.selectedChannelWidth.toFixed(3)} m
                    </p>
                    {(data.channelShape === "u-channel" || data.channelShape === "trapezoidal") && results.requiredChannelWidth !== results.selectedChannelWidth && (
                      <p className="text-xs text-purple-500 mt-1">
                        Theoretical: {data.channelShape === "u-channel" ? `${(results.requiredChannelWidth * 1000).toFixed(0)}mm` : `${results.requiredChannelWidth.toFixed(3)}m`}
                      </p>
                    )}
                  </div>

                  {/* Design Status */}
                  <div className={`p-3 rounded-md ${
                    results.status === "OK" 
                      ? "text-green-600 bg-green-50" 
                      : "text-red-600 bg-red-50"
                  }`}>
                    <h4 className="font-medium mb-2">Design Status</h4>
                    <p className="text-lg font-bold flex items-center gap-2">
                      <span>{results.status === "OK" ? "✓" : "✗"}</span>
                      {results.status}
                      {results.velocityWarning && (
                        <span className="text-orange-600 text-sm font-normal ml-2">
                          ⚠️ {results.velocityWarning}
                        </span>
                      )}
                    </p>
                    {results.error && (
                      <p className="text-xs mt-1">{results.error}</p>
                    )}
                  </div>

                  {/* Additional Results */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-gray-50 rounded-md">
                      <p className="text-sm text-gray-600">Velocity</p>
                      <p className="text-lg font-bold text-gray-800">{results.velocity.toFixed(2)} m/s</p>
                    </div>
                    
                    <div className="text-center p-3 bg-gray-50 rounded-md">
                      <p className="text-sm text-gray-600">Channel Capacity</p>
                      <p className="text-lg font-bold text-gray-800">{results.calculatedFlow.toFixed(3)} m³/s</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    Enter your catchment and channel parameters, then click &quot;Calculate Channel Size&quot; to see results.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Detailed Calculations */}
      {results && (
        <div className="mt-8">
          <DetailedCalculations
            data={data}
            results={results}
            catchmentTC={catchmentTC}
            upstreamTC={upstreamTC}
            effectiveTC={effectiveTC}
            rainfallIntensity={rainfallIntensity}
            runoffCoefficient={runoffCoefficient}
            peakFlow={peakFlow}
          />
        </div>
      )}

      {/* PDF Export */}
      {results && (
        <div className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <PDFExport
                data={data}
                results={results}
                catchmentTC={catchmentTC}
                upstreamTC={upstreamTC}
                effectiveTC={effectiveTC}
                rainfallIntensity={rainfallIntensity}
                runoffCoefficient={runoffCoefficient}
                peakFlow={peakFlow}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

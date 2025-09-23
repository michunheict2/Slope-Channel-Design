"use client";

import { useState } from "react";
import CatchmentForm, { CatchmentData } from "./components/CatchmentForm";
import RainfallForm, { RainfallData } from "./components/RainfallForm";
import ChannelForm, { ChannelData } from "./components/ChannelForm";
import ResultsPanel, { CalculationResults } from "./components/ResultsPanel";
import DetailedCalculations from "./components/DetailedCalculations";
import { rationalQ } from "./hooks/useRational";
import { normalDepthAndCapacity } from "./hooks/useManning";

// Default values for example calculations
const DEFAULT_CATCHMENT: CatchmentData = {
  area: 1000, // m²
  surfaceType: "asphalt",
  runoffCoefficient: 0.9,
  weightedRunoffCoefficient: 0.9,
};

const DEFAULT_RAINFALL: RainfallData = {
  intensity: 100, // mm/h
  intensityMS: 0.0000278, // m/s (converted)
};

const DEFAULT_CHANNEL: ChannelData = {
  shape: "trapezoid",
  bottomWidth: 0.5, // m
  sideSlope: 1.5, // H:V
  width: 0.3, // m (for U-shaped, 300mm standard size)
  radius: 0.15, // m (for U-shaped, automatically width/2)
  flowDepth: 0.1, // m (for U-shaped, user-specified depth)
  longitudinalSlope: 0.01, // m/m
  manningN: 0.013,
};

export default function DesignPage() {
  const [catchmentData, setCatchmentData] = useState<CatchmentData>(DEFAULT_CATCHMENT);
  const [rainfallData, setRainfallData] = useState<RainfallData>(DEFAULT_RAINFALL);
  const [channelData, setChannelData] = useState<ChannelData>(DEFAULT_CHANNEL);
  const [results, setResults] = useState<CalculationResults | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const handleCalculate = async () => {
    setIsCalculating(true);
    
    try {
      // Calculate peak flow using Rational Method
      const rationalInputs = {
        runoffCoefficient: catchmentData.weightedRunoffCoefficient,
        rainfallIntensity: rainfallData.intensity,
        catchmentArea: catchmentData.area,
      };
      
      const rationalResult = rationalQ(rationalInputs);
      const peakFlow = rationalResult.peakFlow;

      // Calculate channel capacity using Manning&apos;s equation
      const manningInputs = {
        shape: channelData.shape,
        bottomWidth: channelData.bottomWidth,
        sideSlope: channelData.sideSlope,
        width: channelData.width,
        radius: channelData.radius,
        flowDepth: channelData.flowDepth,
        longitudinalSlope: channelData.longitudinalSlope,
        manningN: channelData.manningN,
        targetFlow: peakFlow,
      };

      const manningResult = normalDepthAndCapacity(manningInputs);

      // Determine design status
      let status: "OK" | "Not OK" = "OK";
      let error: string | undefined;

      // Check if channel can handle the peak flow
      const flowRatio = manningResult.calculatedFlow / peakFlow;
      if (flowRatio < 0.95) {
        status = "Not OK";
        error = `Channel capacity (${manningResult.calculatedFlow.toFixed(3)} m³/s) is less than required peak flow (${peakFlow.toFixed(3)} m³/s)`;
      }

      // Check velocity limits based on channel type
      if (channelData.shape === "u-shaped") {
        // TGN 43: Maximum permissible velocity of 4 m/s for U-shaped channels
        if (manningResult.velocity < 0.3) {
          status = "Not OK";
          error = `Velocity too low (${manningResult.velocity.toFixed(2)} m/s). Minimum recommended: 0.3 m/s`;
        } else if (manningResult.velocity > 4.0) {
          status = "Not OK";
          error = `Velocity too high (${manningResult.velocity.toFixed(2)} m/s). Maximum permissible for U-shaped channels: 4.0 m/s (TGN 43)`;
        }
        
        // TGN 43: U-shaped channels should be ≤ 600mm
        if (channelData.width > 0.6) {
          status = "Not OK";
          error = `U-shaped channel width (${(channelData.width * 1000).toFixed(0)}mm) exceeds TGN 43 limit of 600mm`;
        }
      } else {
        // Trapezoidal channels: typical range 0.3 - 3.0 m/s
        if (manningResult.velocity < 0.3) {
          status = "Not OK";
          error = `Velocity too low (${manningResult.velocity.toFixed(2)} m/s). Minimum recommended: 0.3 m/s`;
        } else if (manningResult.velocity > 3.0) {
          status = "Not OK";
          error = `Velocity too high (${manningResult.velocity.toFixed(2)} m/s). Maximum recommended: 3.0 m/s`;
        }
      }

      const calculationResults: CalculationResults = {
        peakFlow,
        normalDepth: manningResult.normalDepth,
        area: manningResult.area,
        perimeter: manningResult.perimeter,
        hydraulicRadius: manningResult.hydraulicRadius,
        calculatedFlow: manningResult.calculatedFlow,
        velocity: manningResult.velocity,
        status,
        error,
      };

      setResults(calculationResults);
    } catch (err) {
      console.error("Calculation error:", err);
      setResults({
        peakFlow: 0,
        normalDepth: 0,
        area: 0,
        perimeter: 0,
        hydraulicRadius: 0,
        calculatedFlow: 0,
        velocity: 0,
        status: "Not OK",
        error: err instanceof Error ? err.message : "Unknown calculation error",
      });
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Slope Drainage Design</h1>
        <p className="text-muted-foreground">
          Design trapezoidal channels for slope drainage using the Rational Method and Manning&apos;s equation.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Forms */}
        <div className="lg:col-span-2 space-y-6">
          <CatchmentForm
            data={catchmentData}
            onChange={setCatchmentData}
          />
          
          <RainfallForm
            data={rainfallData}
            onChange={setRainfallData}
          />
          
          <ChannelForm
            data={channelData}
            onChange={setChannelData}
          />
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-1">
          <ResultsPanel
            catchmentData={catchmentData}
            rainfallData={rainfallData}
            channelData={channelData}
            results={results}
            onCalculate={handleCalculate}
            isCalculating={isCalculating}
          />
        </div>
      </div>

      {/* Detailed Calculations */}
      <DetailedCalculations
        catchmentData={catchmentData}
        rainfallData={rainfallData}
        channelData={channelData}
        results={results}
      />

    </div>
  );
}

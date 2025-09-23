"use client";

import { useState } from "react";
import CatchmentForm, { CatchmentData } from "./components/CatchmentForm";
import RainfallForm, { RainfallData } from "./components/RainfallForm";
import ChannelForm, { ChannelData } from "./components/ChannelForm";
import ResultsPanel, { CalculationResults } from "./components/ResultsPanel";
import { rationalQ } from "./hooks/useRational";
import { normalDepthAndCapacity } from "./hooks/useManning";

// Default values for Week 1 example
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
        bottomWidth: channelData.bottomWidth,
        sideSlope: channelData.sideSlope,
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

      // Check velocity limits (typical range: 0.3 - 3.0 m/s)
      if (manningResult.velocity < 0.3) {
        status = "Not OK";
        error = `Velocity too low (${manningResult.velocity.toFixed(2)} m/s). Minimum recommended: 0.3 m/s`;
      } else if (manningResult.velocity > 3.0) {
        status = "Not OK";
        error = `Velocity too high (${manningResult.velocity.toFixed(2)} m/s). Maximum recommended: 3.0 m/s`;
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

      {/* Week 1 Information */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">Week 1 Implementation</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Trapezoidal channel geometry calculations</li>
          <li>• Rational Method for peak flow estimation</li>
          <li>• Manning&apos;s equation with bisection solver</li>
          <li>• Basic design validation (flow capacity, velocity limits)</li>
          <li>• Single surface type runoff coefficient</li>
        </ul>
        <p className="text-sm text-blue-700 mt-2">
          <strong>Next Week:</strong> IDF curves, multiple surface types, additional channel shapes, and advanced design features.
        </p>
      </div>
    </div>
  );
}

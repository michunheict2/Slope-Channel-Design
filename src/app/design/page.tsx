"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import CatchmentForm, { CatchmentData } from "./components/CatchmentForm";
import RainfallForm, { RainfallData } from "./components/RainfallForm";
import ChannelForm, { ChannelData } from "./components/ChannelForm";
import ResultsPanel, { CalculationResults } from "./components/ResultsPanel";
import DetailedCalculations from "./components/DetailedCalculations";
import PDFExport from "./components/PDFExport";
import { rationalQ } from "./hooks/useRational";
import { normalDepthAndCapacity } from "./hooks/useManning";

// Default values for example calculations
const DEFAULT_CATCHMENT: CatchmentData = {
  area: 1000, // m²
  surfaceType: "asphalt",
  runoffCoefficient: 0.9,
  weightedRunoffCoefficient: 0.9,
  averageSlope: 5, // m per 100m
  flowPathLength: 200, // meters
  timeOfConcentration: 0, // Will be calculated
};

const DEFAULT_RAINFALL: RainfallData = {
  intensity: 100, // mm/h
  intensityMS: 0.0000278, // m/s (converted)
  upstreamChannels: Array(4).fill({ channelNo: "", timeOfConcentration: 0 }),
};

const DEFAULT_CHANNEL: ChannelData = {
  shape: "trapezoid",
  bottomWidth: 0.5, // m
  sideSlope: 1.5, // H:V
  channelDepth: 0.1, // m (for trapezoidal, user-specified depth)
  topWidth: 0.8, // m (for trapezoidal, auto-calculated)
  width: 0.3, // m (for U-shaped, 300mm standard size)
  radius: 0.15, // m (for U-shaped, automatically width/2)
  flowDepth: 0.1, // m (for U-shaped, user-specified depth)
  longitudinalSlope: 0.01, // m/m
  manningN: 0.013,
};

export default function DesignPage() {
  const [channelNo, setChannelNo] = useState<string>("");
  const [catchmentData, setCatchmentData] = useState<CatchmentData>(DEFAULT_CATCHMENT);
  const [rainfallData, setRainfallData] = useState<RainfallData>(DEFAULT_RAINFALL);
  const [channelData, setChannelData] = useState<ChannelData>(DEFAULT_CHANNEL);
  const [results, setResults] = useState<CalculationResults | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Check if all required fields are filled for calculation
  const canCalculate = 
    catchmentData.area > 0 &&
    catchmentData.runoffCoefficient > 0 &&
    rainfallData.intensity > 0 &&
    channelData.longitudinalSlope > 0 &&
    channelData.manningN > 0 &&
    ((channelData.shape === "trapezoid" && channelData.bottomWidth > 0 && channelData.sideSlope >= 0) ||
     (channelData.shape === "u-shaped" && channelData.width > 0 && channelData.radius > 0 && channelData.flowDepth > 0));

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
        channelDepth: channelData.channelDepth,
        topWidth: channelData.topWidth,
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
        // Trapezoidal channels: typical range 0.3 - 4.0 m/s
        if (manningResult.velocity < 0.3) {
          status = "Not OK";
          error = `Velocity too low (${manningResult.velocity.toFixed(2)} m/s). Minimum recommended: 0.3 m/s`;
        } else if (manningResult.velocity > 4.0) {
          status = "Not OK";
          error = `Velocity too high (${manningResult.velocity.toFixed(2)} m/s). Maximum recommended: 4.0 m/s`;
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
        <h1 className="text-3xl font-bold mb-2">Slope Drainage Design</h1>
        <p className="text-muted-foreground">
          Design trapezoidal channels for slope drainage using the Rational Method and Manning&apos;s equation.
        </p>
      </div>

      {/* Channel Number Input Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Project Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="channelNo">Channel Number</Label>
            <Input
              id="channelNo"
              type="text"
              value={channelNo}
              onChange={(e) => setChannelNo(e.target.value)}
              placeholder="Enter channel number (e.g., CH-001)"
              className="max-w-md"
            />
            <p className="text-sm text-muted-foreground">
              Enter a unique identifier for this channel design
            </p>
          </div>
        </CardContent>
      </Card>

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

          {/* Additional Calculate Button */}
          <Card>
            <CardContent className="pt-6">
              <Button 
                onClick={handleCalculate} 
                disabled={!canCalculate || isCalculating}
                className="w-full"
                size="lg"
              >
                {isCalculating ? "Calculating..." : "Calculate Design"}
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

          {/* Result Summary */}
          {results && (
            <Card>
              <CardHeader>
                <CardTitle>Design Results Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Peak Flow (Rational Method)</h4>
                    <div className="p-3 bg-blue-50 rounded-md">
                      <p className="text-lg font-bold text-blue-800">
                        {results.peakFlow?.toFixed(3) || "—"} m³/s
                      </p>
                      <p className="text-xs text-blue-600">
                        {results.peakFlow ? (results.peakFlow * 1000).toFixed(1) : "—"} L/s
                      </p>
                      <p className="text-xs text-blue-600">
                        {results.peakFlow ? (results.peakFlow * 60000).toFixed(1) : "—"} L/min
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Design Status</h4>
                    <div className={`p-3 rounded-md ${
                      results.status === "OK" 
                        ? "text-green-600 bg-green-50" 
                        : results.status === "Not OK"
                        ? "text-red-600 bg-red-50"
                        : "text-gray-600 bg-gray-50"
                    }`}>
                      <p className="text-lg font-bold flex items-center gap-2">
                        <span>{results.status === "OK" ? "✓" : results.status === "Not OK" ? "✗" : "?"}</span>
                        {results.status}
                      </p>
                      {results.error && (
                        <p className="text-xs mt-1">{results.error}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-md">
                    <p className="text-sm text-gray-600">Velocity</p>
                    <p className="text-lg font-bold text-gray-800">{results.velocity?.toFixed(2) || "—"} m/s</p>
                  </div>
                  
                  <div className="text-center p-3 bg-gray-50 rounded-md">
                    <p className="text-sm text-gray-600">Normal Depth</p>
                    <p className="text-lg font-bold text-gray-800">{results.normalDepth?.toFixed(3) || "—"} m</p>
                  </div>
                  
                  <div className="text-center p-3 bg-gray-50 rounded-md">
                    <p className="text-sm text-gray-600">Channel Capacity</p>
                    <p className="text-lg font-bold text-gray-800">{results.calculatedFlow?.toFixed(3) || "—"} m³/s</p>
                  </div>
                  
                  <div className="text-center p-3 bg-gray-50 rounded-md">
                    <p className="text-sm text-gray-600">Flow Ratio</p>
                    <p className="text-lg font-bold text-gray-800">
                      {results.peakFlow && results.calculatedFlow 
                        ? (results.calculatedFlow / results.peakFlow).toFixed(3) 
                        : "—"}
                    </p>
                  </div>
                </div>

                {rainfallData.useIDFCurve && rainfallData.idfResult && (
                  <div className="p-3 bg-green-50 rounded-md">
                    <h4 className="font-medium text-green-900 mb-2">IDF Curve Details</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="font-medium text-green-800">Return Period</p>
                        <p className="text-green-700">{rainfallData.idfResult.returnPeriod} years</p>
                      </div>
                      <div>
                        <p className="font-medium text-green-800">Duration</p>
                        <p className="text-green-700">{rainfallData.idfResult.duration} min</p>
                      </div>
                      <div>
                        <p className="font-medium text-green-800">Raw Intensity</p>
                        <p className="text-green-700">{rainfallData.idfResult.rawIntensity.toFixed(2)} mm/hr</p>
                      </div>
                      <div>
                        <p className="font-medium text-green-800">Final Intensity</p>
                        <p className="text-green-700 font-bold">{rainfallData.idfResult.intensity.toFixed(2)} mm/hr</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
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

      {/* PDF Export */}
      {results && (
        <div className="mt-6">
          <PDFExport
            channelNo={channelNo}
            catchmentData={catchmentData}
            rainfallData={rainfallData}
            channelData={channelData}
            results={results}
          />
        </div>
      )}

    </div>
  );
}

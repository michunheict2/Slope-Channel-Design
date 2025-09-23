"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
// import { rationalQ, RationalMethodInputs } from "../hooks/useRational";
// import { normalDepthAndCapacity, ManningInputs } from "../hooks/useManning";
import { CatchmentData } from "./CatchmentForm";
import { RainfallData } from "./RainfallForm";
import { ChannelData } from "./ChannelForm";

export interface CalculationResults {
  peakFlow: number; // Qp in m³/s
  normalDepth: number; // y in meters
  area: number; // A in m²
  perimeter: number; // P in meters
  hydraulicRadius: number; // R in meters
  calculatedFlow: number; // Q in m³/s
  velocity: number; // V in m/s
  status: "OK" | "Not OK" | "Not Calculated";
  error?: string;
}

interface ResultsPanelProps {
  catchmentData: CatchmentData;
  rainfallData: RainfallData;
  channelData: ChannelData;
  results: CalculationResults | null;
  onCalculate: () => void;
  isCalculating: boolean;
}

export default function ResultsPanel({
  catchmentData,
  rainfallData,
  channelData,
  results,
  onCalculate,
  isCalculating,
}: ResultsPanelProps) {
  const canCalculate = 
    catchmentData.area > 0 &&
    catchmentData.runoffCoefficient > 0 &&
    rainfallData.intensity > 0 &&
    channelData.bottomWidth > 0 &&
    channelData.sideSlope >= 0 &&
    channelData.longitudinalSlope > 0 &&
    channelData.manningN > 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OK":
        return "text-green-600 bg-green-50";
      case "Not OK":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "OK":
        return "✓";
      case "Not OK":
        return "✗";
      default:
        return "?";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Design Results</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={onCalculate} 
            disabled={!canCalculate || isCalculating}
            className="flex-1"
          >
            {isCalculating ? "Calculating..." : "Calculate Design"}
          </Button>
        </div>

        {!canCalculate && (
          <div className="p-3 bg-yellow-50 rounded-md">
            <p className="text-sm text-yellow-800">
              Please fill in all required fields to enable calculation.
            </p>
          </div>
        )}

        {results && (
          <>
            <Separator />
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Peak Flow (Rational Method)</h4>
                  <div className="p-3 bg-blue-50 rounded-md">
                    <p className="text-lg font-bold text-blue-800">
                      {results.peakFlow.toFixed(3)} m³/s
                    </p>
                    <p className="text-xs text-blue-600">
                      {(results.peakFlow * 1000).toFixed(1)} L/s
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Design Status</h4>
                  <div className={`p-3 rounded-md ${getStatusColor(results.status)}`}>
                    <p className="text-lg font-bold flex items-center gap-2">
                      <span>{getStatusIcon(results.status)}</span>
                      {results.status}
                    </p>
                    {results.error && (
                      <p className="text-xs mt-1">{results.error}</p>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="font-medium text-sm">Channel Hydraulics (Manning&apos;s Equation)</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Normal Depth</p>
                    <p className="text-lg font-bold">{results.normalDepth.toFixed(3)} m</p>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Velocity</p>
                    <p className="text-lg font-bold">{results.velocity.toFixed(2)} m/s</p>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Cross-sectional Area</p>
                    <p className="text-lg font-bold">{results.area.toFixed(2)} m²</p>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Wetted Perimeter</p>
                    <p className="text-lg font-bold">{results.perimeter.toFixed(2)} m</p>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Hydraulic Radius</p>
                    <p className="text-lg font-bold">{results.hydraulicRadius.toFixed(3)} m</p>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Channel Capacity</p>
                    <p className="text-lg font-bold">{results.calculatedFlow.toFixed(3)} m³/s</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="p-3 bg-blue-50 rounded-md">
                <p className="text-sm text-blue-800">
                  <strong>Week 1 Note:</strong> This is a simplified calculation using fixed example values.
                  In Week 2, we&apos;ll implement proper IDF curve calculations and more sophisticated
                  channel design methods.
                </p>
              </div>
            </div>
          </>
        )}

        {!results && canCalculate && (
          <div className="p-3 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-600">
              Click &quot;Calculate Design&quot; to compute the channel design parameters.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

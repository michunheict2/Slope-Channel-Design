"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown, ChevronRight } from "lucide-react";
import { BatchProcessingSummary, BatchChannelResult } from "../../utils/batchProcessor";

interface BatchDetailedCalculationsProps {
  summary: BatchProcessingSummary;
  channelData: Record<string, unknown>[];
}

export default function BatchDetailedCalculations({ summary, channelData }: BatchDetailedCalculationsProps) {
  const [selectedChannelId, setSelectedChannelId] = useState<string>("");
  const [expandedChannels, setExpandedChannels] = useState<Set<string>>(new Set());

  const selectedResult = summary.results.find(r => r.channelId === selectedChannelId);
  const selectedInputData = channelData.find(d => d.channelId === selectedChannelId);

  const toggleChannelExpansion = (channelId: string) => {
    const newExpanded = new Set(expandedChannels);
    if (newExpanded.has(channelId)) {
      newExpanded.delete(channelId);
    } else {
      newExpanded.add(channelId);
    }
    setExpandedChannels(newExpanded);
  };

  const renderDetailedCalculation = (result: BatchChannelResult, inputData: Record<string, unknown>) => {
    if (!inputData) return null;

    const materialData = [
      { id: "concrete", name: "Concrete", manningN: 0.013 },
      { id: "asphalt", name: "Asphalt", manningN: 0.016 },
      { id: "brick", name: "Brick", manningN: 0.015 },
      { id: "stone", name: "Stone", manningN: 0.025 },
      { id: "earth", name: "Earth", manningN: 0.025 },
      { id: "grass", name: "Grass", manningN: 0.035 },
      { id: "gravel", name: "Gravel", manningN: 0.030 },
      { id: "riprap", name: "Riprap", manningN: 0.040 },
    ].find(m => m.id === inputData.channelMaterial);

    const surfaceTypeData = [
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
    ].find(s => s.id === inputData.surfaceType);

    return (
      <div className="space-y-6 mt-4">
        {/* Time of Concentration Calculations */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Step 1: Time of Concentration Calculation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Catchment TC */}
              <div className="p-3 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Catchment Time of Concentration</h4>
                <div className="space-y-1 text-sm">
                  <p><strong>Formula (DSD SDM):</strong> t_o = (0.14465 × L) / (H^0.2 × A^0.1)</p>
                  <p>• L = {inputData.flowPathLength as number} m</p>
                  <p>• H = {inputData.averageSlope as number} m per 100 m</p>
                  <p>• A = {inputData.catchmentArea as number} m²</p>
                  <p className="text-blue-700 font-semibold">Catchment TC = {result.catchmentTC.toFixed(1)} minutes</p>
                </div>
              </div>

              {/* Upstream TC */}
              <div className="p-3 bg-green-50 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-2">Upstream Channel TC</h4>
                <div className="space-y-1 text-sm">
                  <p>• Upstream Channels: {(inputData.upstreamChannelIds as string) || "None"}</p>
                  <p className="text-green-700 font-semibold">Upstream TC = {result.upstreamTC.toFixed(1)} minutes</p>
                </div>
              </div>
            </div>

            <div className="p-3 bg-purple-50 rounded-lg">
              <h4 className="font-semibold text-purple-900 mb-2">Effective Time of Concentration</h4>
              <p className="text-sm">
                max({result.catchmentTC.toFixed(1)}, {result.upstreamTC.toFixed(1)}) = {result.effectiveTC.toFixed(1)} minutes
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Peak Flow Calculation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Step 2: Peak Flow Calculation (Rational Method)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Input Parameters</h4>
                <div className="space-y-1 text-sm">
                  <p><strong>Area:</strong> {inputData.catchmentArea as number} m²</p>
                  <p><strong>Surface:</strong> {surfaceTypeData?.name}</p>
                  <p><strong>Runoff Coeff:</strong> {result.runoffCoefficient.toFixed(3)}</p>
                  <p><strong>TC:</strong> {result.effectiveTC.toFixed(1)} min</p>
                  <p><strong>Return Period:</strong> {inputData.returnPeriod as number} years</p>
                </div>
              </div>

              <div className="p-3 bg-yellow-50 rounded-lg">
                <h4 className="font-semibold text-yellow-900 mb-2">Rainfall Intensity</h4>
                <div className="space-y-1 text-sm">
                  <p>• Return Period: {inputData.returnPeriod as number} years</p>
                  <p>• Duration: {result.effectiveTC.toFixed(1)} minutes</p>
                  <p>• Climate Change: +28.1%</p>
                  <p className="text-yellow-700 font-semibold">Intensity = {result.rainfallIntensity.toFixed(1)} mm/hr</p>
                </div>
              </div>
            </div>

            <div className="p-3 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Rational Method Formula</h4>
              <div className="space-y-1 text-sm">
                <p><strong>Qp = C × i × A</strong></p>
                <p>Qp = {result.runoffCoefficient.toFixed(3)} × {(result.rainfallIntensity / 3600 / 1000).toExponential(3)} × {inputData.catchmentArea as number}</p>
                <p className="text-blue-700 font-semibold">Peak Flow = {result.peakFlow.toFixed(3)} m³/s</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Channel Sizing Calculation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Step 3: Channel Sizing Calculation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Channel Parameters</h4>
                <div className="space-y-1 text-sm">
                  <p><strong>Shape:</strong> {(inputData.channelShape as string) === "trapezoidal" ? "Trapezoidal" : "U-Channel"}</p>
                  <p><strong>Gradient:</strong> {(inputData.channelGradient as number).toFixed(4)} m/m</p>
                  <p><strong>Material:</strong> {materialData?.name}</p>
                  <p><strong>Manning&apos;s n:</strong> {materialData?.manningN.toFixed(3)}</p>
                </div>
              </div>

              <div className="p-3 bg-green-50 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-2">Manning&apos;s Equation</h4>
                <div className="space-y-1 text-sm">
                  <p><strong>Q = (1/n) × A × R^(2/3) × S^(1/2)</strong></p>
                  <p>• Target Flow: {result.peakFlow.toFixed(3)} m³/s</p>
                  <p>• n = {materialData?.manningN.toFixed(3)}</p>
                  <p>• S = {(inputData.channelGradient as number).toFixed(4)} m/m</p>
                </div>
              </div>
            </div>

            <div className="p-3 bg-purple-50 rounded-lg">
              <h4 className="font-semibold text-purple-900 mb-2">Channel Sizing Result</h4>
              <div className="space-y-1 text-sm">
                <p><strong>Required Width:</strong> {result.requiredChannelWidth.toFixed(3)} m</p>
                <p><strong>Selected Size:</strong> {result.selectedChannelSize}</p>
                <p><strong>Selected Width:</strong> {result.selectedChannelWidth.toFixed(3)} m</p>
                <p><strong>Channel Capacity:</strong> {result.calculatedFlow.toFixed(3)} m³/s</p>
                <p><strong>Velocity:</strong> {result.velocity.toFixed(2)} m/s</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Design Validation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Step 4: Design Validation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Flow Capacity</h4>
                <div className="space-y-1 text-sm">
                  <p><strong>Required:</strong> {result.peakFlow.toFixed(3)} m³/s</p>
                  <p><strong>Provided:</strong> {result.calculatedFlow.toFixed(3)} m³/s</p>
                  <p><strong>Ratio:</strong> {(result.calculatedFlow/result.peakFlow).toFixed(3)}</p>
                  <p className={`font-semibold ${(result.calculatedFlow/result.peakFlow) >= 0.95 ? "text-green-600" : "text-red-600"}`}>
                    {(result.calculatedFlow/result.peakFlow) >= 0.95 ? "✓ Adequate" : "✗ Insufficient"}
                  </p>
                </div>
              </div>

              <div className="p-3 bg-green-50 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-2">Velocity Check</h4>
                <div className="space-y-1 text-sm">
                  <p><strong>Velocity:</strong> {result.velocity.toFixed(2)} m/s</p>
                  <p><strong>Min Required:</strong> 0.3 m/s</p>
                  <p><strong>Max Recommended:</strong> 4.0 m/s</p>
                  {result.velocity < 0.3 && (
                    <p className="text-red-600 font-semibold">✗ Too Low</p>
                  )}
                  {result.velocityWarning && (
                    <p className="text-orange-600 font-semibold">⚠️ High Velocity</p>
                  )}
                </div>
              </div>

              <div className="p-3 bg-purple-50 rounded-lg">
                <h4 className="font-semibold text-purple-900 mb-2">Overall Status</h4>
                <div className="space-y-1 text-sm">
                  <p className={`text-lg font-bold ${result.status === "OK" ? "text-green-600" : "text-red-600"}`}>
                    {result.status === "OK" ? "✓ DESIGN OK" : "✗ DESIGN NOT OK"}
                  </p>
                  {result.error && (
                    <p className="text-xs text-red-600 mt-2">{result.error}</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Detailed Calculations</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Channel Selection */}
        <div>
          <label className="block text-sm font-medium mb-2">Select Channel to View Detailed Calculations:</label>
          <Select value={selectedChannelId} onValueChange={setSelectedChannelId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose a channel..." />
            </SelectTrigger>
            <SelectContent>
              {summary.results.map((result) => (
                <SelectItem key={result.channelId} value={result.channelId}>
                  {result.channelId} - {result.selectedChannelSize} - {result.status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Selected Channel Detailed Calculation */}
        {selectedResult && selectedInputData && (
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">
              Detailed Calculations for Channel {selectedResult.channelId}
            </h3>
            {renderDetailedCalculation(selectedResult, selectedInputData)}
          </div>
        )}

        {/* All Channels Summary */}
        <div className="space-y-2">
          <h4 className="font-semibold">All Channels Summary</h4>
          {summary.results.map((result) => (
            <div key={result.channelId} className="border rounded-lg">
              <Button
                variant="ghost"
                className="w-full justify-between p-4 h-auto"
                onClick={() => toggleChannelExpansion(result.channelId)}
              >
                <div className="flex items-center gap-4">
                  <span className="font-mono font-medium">{result.channelId}</span>
                  <span className="text-sm text-muted-foreground">
                    Peak: {result.peakFlow.toFixed(3)} m³/s | 
                    Size: {result.selectedChannelSize} | 
                    Velocity: {result.velocity.toFixed(2)} m/s
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    result.status === "OK" 
                      ? "bg-green-100 text-green-800" 
                      : "bg-red-100 text-red-800"
                  }`}>
                    {result.status}
                  </span>
                </div>
                {expandedChannels.has(result.channelId) ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
              
              {expandedChannels.has(result.channelId) && (
                <div className="px-4 pb-4">
                  {(() => {
                    const channelDataItem = channelData.find(d => d.channelId === result.channelId);
                    return channelDataItem ? renderDetailedCalculation(result, channelDataItem) : null;
                  })()}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

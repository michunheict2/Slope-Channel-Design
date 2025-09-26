"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AutoSizingData, SizingResults } from "../page";

interface DetailedCalculationsProps {
  data: AutoSizingData;
  results: SizingResults | null;
  catchmentTC: number;
  upstreamTC: number;
  effectiveTC: number;
  rainfallIntensity: number;
  runoffCoefficient: number;
  peakFlow: number;
}

export default function DetailedCalculations({
  data,
  results,
  catchmentTC,
  upstreamTC,
  effectiveTC,
  rainfallIntensity,
  runoffCoefficient,
  peakFlow,
}: DetailedCalculationsProps) {
  if (!results) {
    return null;
  }

  const materialData = [
    { id: "concrete", name: "Concrete", manningN: 0.013 },
    { id: "asphalt", name: "Asphalt", manningN: 0.016 },
    { id: "brick", name: "Brick", manningN: 0.015 },
    { id: "stone", name: "Stone", manningN: 0.025 },
    { id: "earth", name: "Earth", manningN: 0.025 },
    { id: "grass", name: "Grass", manningN: 0.035 },
    { id: "gravel", name: "Gravel", manningN: 0.030 },
    { id: "riprap", name: "Riprap", manningN: 0.040 },
  ].find(m => m.id === data.channelMaterial);

  const manningN = materialData?.manningN || 0.013;

  return (
    <div className="space-y-6">
      {/* Time of Concentration Calculations */}
      <Card>
        <CardHeader>
          <CardTitle>Step 1: Time of Concentration Calculation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Catchment TC */}
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-3">Catchment Time of Concentration</h4>
              <div className="space-y-2 text-sm">
                <p><strong>Formula (DSD SDM Method):</strong> t_o = (0.14465 × L) / (H^0.2 × A^0.1)</p>
                <p><strong>Where:</strong></p>
                <p>• L = Distance (on plan) = {data.flowPathLength} m</p>
                <p>• H = Average slope = {data.averageSlope} m per 100 m</p>
                <p>• A = Catchment area = {data.catchmentArea} m²</p>
                <p><strong>Calculation:</strong></p>
                <p>t_o = (0.14465 × {data.flowPathLength}) / ({data.averageSlope}^0.2 × {data.catchmentArea}^0.1)</p>
                <p>t_o = {(0.14465 * data.flowPathLength).toFixed(2)} / ({Math.pow(data.averageSlope, 0.2).toFixed(2)} × {Math.pow(data.catchmentArea, 0.1).toFixed(2)})</p>
                <p>t_o = {(0.14465 * data.flowPathLength).toFixed(2)} / {(Math.pow(data.averageSlope, 0.2) * Math.pow(data.catchmentArea, 0.1)).toFixed(2)}</p>
                <p>t_o = {((0.14465 * data.flowPathLength) / (Math.pow(data.averageSlope, 0.2) * Math.pow(data.catchmentArea, 0.1))).toFixed(3)} minutes (raw calculation)</p>
                <p>t_o = max({((0.14465 * data.flowPathLength) / (Math.pow(data.averageSlope, 0.2) * Math.pow(data.catchmentArea, 0.1))).toFixed(3)}, 5) = {catchmentTC.toFixed(1)} minutes (minimum 5 minutes applied)</p>
                <p className="text-blue-700 font-semibold">Catchment TC = {catchmentTC.toFixed(1)} minutes</p>
              </div>
            </div>

            {/* Upstream TC */}
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-semibold text-green-900 mb-3">Upstream Channel Time of Concentration</h4>
              <div className="space-y-2 text-sm">
                <p><strong>Upstream Channels:</strong></p>
                {data.upstreamChannels.map((channel, index) => (
                  <p key={index}>
                    Channel {index + 1}: {channel.channelNo || "Not specified"} = {channel.timeOfConcentration} min
                  </p>
                ))}
                <p className="text-green-700 font-semibold">Maximum Upstream TC = {upstreamTC.toFixed(1)} minutes</p>
              </div>
            </div>
          </div>

          {/* Effective TC */}
          <div className="p-4 bg-purple-50 rounded-lg">
            <h4 className="font-semibold text-purple-900 mb-2">Effective Time of Concentration</h4>
            <p className="text-sm">
              <strong>Using the larger value:</strong> max({catchmentTC.toFixed(1)}, {upstreamTC.toFixed(1)}) = {effectiveTC.toFixed(1)} minutes
            </p>
            <p className="text-purple-700 font-semibold">Effective TC = {effectiveTC.toFixed(1)} minutes</p>
          </div>
        </CardContent>
      </Card>

      {/* Peak Flow Calculation */}
      <Card>
        <CardHeader>
          <CardTitle>Step 2: Peak Flow Calculation (Rational Method)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Input Parameters */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-3">Input Parameters</h4>
              <div className="space-y-2 text-sm">
                <p><strong>Catchment Area (A):</strong> {data.catchmentArea} m²</p>
                <p><strong>Surface Type:</strong> {data.surfaceType}</p>
                <p><strong>Runoff Coefficient (C):</strong> {runoffCoefficient.toFixed(3)}</p>
                <p><strong>Time of Concentration:</strong> {effectiveTC.toFixed(1)} minutes</p>
                <p><strong>Return Period:</strong> {data.returnPeriod} years</p>
              </div>
            </div>

            {/* Rainfall Intensity */}
            <div className="p-4 bg-yellow-50 rounded-lg">
              <h4 className="font-semibold text-yellow-900 mb-3">Rainfall Intensity (IDF)</h4>
              <div className="space-y-2 text-sm">
                <p><strong>Using Hong Kong IDF Curves:</strong></p>
                <p>• Return Period: {data.returnPeriod} years</p>
                <p>• Duration: {effectiveTC.toFixed(1)} minutes</p>
                <p>• Climate Change Adjustment: +28.1%</p>
                <p className="text-yellow-700 font-semibold">Rainfall Intensity = {rainfallIntensity.toFixed(1)} mm/hr</p>
              </div>
            </div>
          </div>

          {/* Rational Method Formula */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-3">Rational Method Formula</h4>
            <div className="space-y-2 text-sm">
              <p><strong>Formula:</strong> Qp = C × i × A</p>
              <p><strong>Where:</strong></p>
              <p>• Qp = Peak flow (m³/s)</p>
              <p>• C = Runoff coefficient = {runoffCoefficient.toFixed(3)}</p>
              <p>• i = Rainfall intensity = {rainfallIntensity.toFixed(1)} mm/hr = {(rainfallIntensity / 3600 / 1000).toExponential(3)} m/s</p>
              <p>• A = Catchment area = {data.catchmentArea} m²</p>
              <p><strong>Calculation:</strong></p>
              <p>Qp = {runoffCoefficient.toFixed(3)} × {(rainfallIntensity / 3600 / 1000).toExponential(3)} × {data.catchmentArea}</p>
              <p>Qp = {peakFlow.toFixed(6)} m³/s</p>
              <p className="text-blue-700 font-semibold">Peak Flow = {peakFlow.toFixed(3)} m³/s ({(peakFlow * 1000).toFixed(1)} L/s)</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Channel Sizing Calculation */}
      <Card>
        <CardHeader>
          <CardTitle>Step 3: Channel Sizing Calculation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Channel Parameters */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-3">Channel Parameters</h4>
              <div className="space-y-2 text-sm">
                <p><strong>Channel Shape:</strong> {data.channelShape === "trapezoidal" ? "Trapezoidal" : "U-Channel"}</p>
                <p><strong>Channel Gradient:</strong> {data.channelGradient.toFixed(4)} m/m</p>
                <p><strong>Channel Material:</strong> {materialData?.name}</p>
                <p><strong>Manning&apos;s n:</strong> {manningN.toFixed(3)}</p>
                {data.channelShape === "trapezoidal" && (
                  <>
                    <p><strong>Bottom Width:</strong> 0.5 m (fixed)</p>
                    <p><strong>Side Slope:</strong> 1:2 (fixed)</p>
                  </>
                )}
                {data.channelShape === "u-channel" && (
                  <p><strong>Flow Depth = Channel Width</strong> (fixed relationship)</p>
                )}
              </div>
            </div>

            {/* Manning's Equation */}
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-semibold text-green-900 mb-3">Manning&apos;s Equation</h4>
              <div className="space-y-2 text-sm">
                <p><strong>Formula:</strong> Q = (1/n) × A × R^(2/3) × S^(1/2)</p>
                <p><strong>Where:</strong></p>
                <p>• Q = Flow (m³/s)</p>
                <p>• n = Manning&apos;s roughness = {manningN.toFixed(3)}</p>
                <p>• A = Cross-sectional area (m²)</p>
                <p>• R = Hydraulic radius (m)</p>
                <p>• S = Longitudinal slope = {data.channelGradient.toFixed(4)} m/m</p>
                <p><strong>Target Flow:</strong> {peakFlow.toFixed(3)} m³/s</p>
              </div>
            </div>
          </div>

          {/* Sizing Process */}
          <div className="p-4 bg-purple-50 rounded-lg">
            <h4 className="font-semibold text-purple-900 mb-3">Automatic Sizing Process</h4>
            <div className="space-y-2 text-sm">
              {data.channelShape === "trapezoidal" ? (
                <>
                  <p><strong>For Trapezoidal Channel:</strong></p>
                  <p>1. Fixed parameters: Bottom width = 0.5m, Side slope = 1:2</p>
                  <p>2. Use bisection method to find depth that gives required flow</p>
                  <p>3. Calculate top width: T = b + 2zy = 0.5 + 2 × 2 × depth</p>
                  <p>4. Calculate geometry: Area, Perimeter, Hydraulic Radius</p>
                  <p>5. Apply Manning&apos;s equation to verify flow capacity</p>
                </>
              ) : (
                <>
                  <p><strong>For U-Channel:</strong></p>
                  <p>1. Fixed relationship: Flow depth = Channel width</p>
                  <p>2. Use bisection method to find width that gives required flow</p>
                  <p>3. Calculate geometry: Area, Perimeter, Hydraulic Radius</p>
                  <p>4. Apply Manning&apos;s equation to verify flow capacity</p>
                </>
              )}
              <p className="text-purple-700 font-semibold">Required Channel Width = {results.requiredChannelWidth.toFixed(3)} m ({(results.requiredChannelWidth * 1000).toFixed(0)} mm)</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Design Validation */}
      <Card>
        <CardHeader>
          <CardTitle>Step 4: Design Validation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Flow Capacity Check */}
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Flow Capacity Check</h4>
              <div className="space-y-1 text-sm">
                <p><strong>Required:</strong> {peakFlow.toFixed(3)} m³/s</p>
                <p><strong>Provided:</strong> {results.calculatedFlow.toFixed(3)} m³/s</p>
                <p><strong>Ratio:</strong> {(results.calculatedFlow/peakFlow).toFixed(3)}</p>
                <p className={`font-semibold ${(results.calculatedFlow/peakFlow) >= 0.95 ? "text-green-600" : "text-red-600"}`}>
                  {(results.calculatedFlow/peakFlow) >= 0.95 ? "✓ Adequate" : "✗ Insufficient"}
                </p>
              </div>
            </div>

            {/* Velocity Check */}
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-semibold text-green-900 mb-2">Velocity Check</h4>
              <div className="space-y-1 text-sm">
                <p><strong>Calculated:</strong> {results.velocity.toFixed(2)} m/s</p>
                <p><strong>Min. Required:</strong> 0.3 m/s</p>
                <p><strong>Recommended Max:</strong> 4.0 m/s</p>
                {results.velocity < 0.3 && (
                  <p className="text-red-600 font-semibold">
                    ✗ Too Low
                  </p>
                )}
                {results.velocityWarning && (
                  <p className="text-orange-600 font-semibold">
                    ⚠️ {results.velocityWarning}
                  </p>
                )}
              </div>
            </div>

            {/* Overall Status */}
            <div className="p-4 bg-purple-50 rounded-lg">
              <h4 className="font-semibold text-purple-900 mb-2">Overall Design Status</h4>
              <div className="space-y-1 text-sm">
                <p className={`text-lg font-bold ${results.status === "OK" ? "text-green-600" : "text-red-600"}`}>
                  {results.status === "OK" ? "✓ DESIGN OK" : "✗ DESIGN NOT OK"}
                </p>
                {results.error && (
                  <p className="text-xs text-red-600 mt-2">{results.error}</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Channel Sizing Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Step 5: Channel Sizing Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Input Summary */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-3">Design Inputs</h4>
              <div className="space-y-2 text-sm">
                <p><strong>Catchment Area:</strong> {data.catchmentArea.toFixed(0)} m²</p>
                <p><strong>Surface Type:</strong> {data.surfaceType}</p>
                <p><strong>Runoff Coefficient:</strong> {runoffCoefficient.toFixed(3)}</p>
                <p><strong>Time of Concentration:</strong> {effectiveTC.toFixed(1)} minutes</p>
                <p><strong>Peak Flow:</strong> {peakFlow.toFixed(3)} m³/s</p>
                <p><strong>Channel Shape:</strong> {data.channelShape === "trapezoidal" ? "Trapezoidal" : "U-Channel"}</p>
                <p><strong>Channel Material:</strong> {data.channelMaterial}</p>
                <p><strong>Channel Gradient:</strong> {data.channelGradient.toFixed(4)} m/m</p>
              </div>
            </div>

            {/* Results Summary */}
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-3">Auto-Generated Results</h4>
              <div className="space-y-2 text-sm">
                {data.channelShape === "u-channel" ? (
                  <>
                    <p><strong>Selected Channel Size:</strong> {results.selectedChannelSize}</p>
                    <p><strong>Channel Width:</strong> {results.selectedChannelWidth.toFixed(3)} m</p>
                    {results.requiredChannelWidth !== results.selectedChannelWidth && (
                      <p><strong>Theoretical Width:</strong> {(results.requiredChannelWidth * 1000).toFixed(0)} mm</p>
                    )}
                  </>
                ) : (
                  <>
                    <p><strong>Selected Top Width:</strong> {results.selectedChannelSize}</p>
                    <p><strong>Top Width:</strong> {results.selectedChannelWidth.toFixed(3)} m</p>
                    <p><strong>Channel Depth:</strong> {((results.selectedChannelWidth - 0.5) / (2 * 2)).toFixed(3)} m</p>
                    {results.requiredChannelWidth !== results.selectedChannelWidth && (
                      <p><strong>Theoretical Width:</strong> {results.requiredChannelWidth.toFixed(3)} m</p>
                    )}
                    <p><strong>Bottom Width:</strong> 0.5 m (fixed)</p>
                    <p><strong>Side Slope:</strong> 1:2 (fixed)</p>
                  </>
                )}
                <p><strong>Channel Capacity:</strong> {results.calculatedFlow.toFixed(3)} m³/s</p>
                <p><strong>Flow Velocity:</strong> {results.velocity.toFixed(2)} m/s</p>
                <p><strong>Design Status:</strong> 
                  <span className={`ml-2 font-semibold ${results.status === "OK" ? "text-green-600" : "text-red-600"}`}>
                    {results.status}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Design Recommendations */}
          <div className="p-4 bg-green-50 rounded-lg">
            <h4 className="font-semibold text-green-900 mb-3">Design Recommendations</h4>
            <div className="space-y-2 text-sm">
              {data.channelShape === "u-channel" ? (
                <div>
                  <p><strong>U-Channel Selection:</strong></p>
                  <p>• Selected {results.selectedChannelSize} U-channel from standard sizes</p>
                  <p>• TGN 43 compliant (≤ 600mm)</p>
                  <p>• Flow depth = channel width relationship maintained</p>
                  {results.requiredChannelWidth !== results.selectedChannelWidth && (
                    <p>• Next smaller size would be insufficient for required flow</p>
                  )}
                </div>
              ) : (
                <div>
                  <p><strong>Trapezoidal Channel Design:</strong></p>
                  <p>• Bottom width: 0.5m (fixed)</p>
                  <p>• Side slope: 1:2 (fixed)</p>
                  <p>• Top width: {results.selectedChannelSize} (calculated and rounded)</p>
                  <p>• Channel depth: {((results.selectedChannelWidth - 0.5) / (2 * 2)).toFixed(3)}m (calculated from top width)</p>
                  <p>• Rounded up to nearest 0.5m for practical construction</p>
                  <p>• Standard trapezoidal geometry for easy construction</p>
                </div>
              )}
              
              <div className="mt-3">
                <p><strong>Velocity Check:</strong></p>
                <p>• Current velocity: {results.velocity.toFixed(2)} m/s</p>
                <p>• Minimum required: 0.3 m/s</p>
                <p>• Recommended maximum: 4.0 m/s</p>
                {results.velocity < 0.3 && <p className="text-red-600">⚠️ Velocity too low - consider steeper gradient</p>}
                {results.velocityWarning && <p className="text-orange-600">⚠️ {results.velocityWarning} - consider gentler gradient or erosion protection</p>}
              </div>

              <div className="mt-3">
                <p><strong>Flow Capacity:</strong></p>
                <p>• Required: {peakFlow.toFixed(3)} m³/s</p>
                <p>• Provided: {results.calculatedFlow.toFixed(3)} m³/s</p>
                <p>• Safety factor: {(results.calculatedFlow/peakFlow).toFixed(2)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

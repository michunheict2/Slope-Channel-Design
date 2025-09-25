"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CatchmentData } from "./CatchmentForm";
import { RainfallData } from "./RainfallForm";
import { ChannelData } from "./ChannelForm";
import { CalculationResults } from "./ResultsPanel";

interface DetailedCalculationsProps {
  catchmentData: CatchmentData;
  rainfallData: RainfallData;
  channelData: ChannelData;
  results: CalculationResults | null;
}

export default function DetailedCalculations({
  catchmentData,
  rainfallData,
  channelData,
  results,
}: DetailedCalculationsProps) {
  if (!results) {
    return null;
  }

  // Calculate intermediate values for display
  const rationalFlow = results.peakFlow;
  const intensityMS = rainfallData.intensity / 3600 / 1000; // Convert mm/h to m/s
  const areaM2 = catchmentData.area;
  const runoffCoeff = catchmentData.weightedRunoffCoefficient;

  // Manning's equation components
  const manningN = channelData.manningN;
  const slope = channelData.longitudinalSlope;
  const area = results.area;
  const hydraulicRadius = results.hydraulicRadius;
  const calculatedFlow = results.calculatedFlow;

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>Detailed Step-by-Step Calculations</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Rational Method Calculations */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-blue-800">Step 1: Rational Method - Peak Flow Calculation</h3>
          
          <div className="bg-blue-50 p-4 rounded-lg space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-blue-900 mb-2">Input Parameters:</h4>
                <ul className="text-sm space-y-1 text-blue-800">
                  <li>• Catchment Area (A) = {areaM2.toFixed(0)} m²</li>
                  <li>• Runoff Coefficient (C) = {runoffCoeff.toFixed(3)}</li>
                  <li>• Rainfall Intensity (i) = {rainfallData.intensity.toFixed(1)} mm/h</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-blue-900 mb-2">Unit Conversion:</h4>
                <ul className="text-sm space-y-1 text-blue-800">
                  <li>• i = {rainfallData.intensity.toFixed(1)} mm/h</li>
                  <li>• i = {intensityMS.toExponential(3)} m/s</li>
                  <li>• A = {areaM2.toFixed(0)} m²</li>
                </ul>
              </div>
            </div>
            
            <Separator className="bg-blue-200" />
            
            <div>
              <h4 className="font-medium text-blue-900 mb-2">Rational Method Formula:</h4>
              <div className="bg-white p-3 rounded border-l-4 border-blue-500">
                <p className="text-sm font-mono text-blue-800">
                  Qp = C × i × A
                </p>
                <p className="text-sm font-mono text-blue-800 mt-2">
                  Qp = {runoffCoeff.toFixed(3)} × {intensityMS.toExponential(3)} × {areaM2.toFixed(0)}
                </p>
                <p className="text-sm font-mono text-blue-800 mt-2">
                  Qp = {rationalFlow.toFixed(6)} m³/s
                </p>
                <p className="text-sm font-mono text-blue-800 mt-2">
                  Qp = {rationalFlow.toFixed(3)} m³/s
                </p>
                <p className="text-sm font-mono text-blue-800 mt-1">
                  Qp = {(rationalFlow * 60000).toFixed(1)} L/min
                </p>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Channel Geometry Calculations */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-orange-800">Step 2: Channel Geometry Calculations</h3>
          
          <div className="bg-orange-50 p-4 rounded-lg space-y-3">
            {channelData.shape === "trapezoid" ? (
              <>
                <div>
                  <h4 className="font-medium text-orange-900 mb-2">Trapezoidal Channel Geometry:</h4>
                  <div className="bg-white p-3 rounded border-l-4 border-orange-500 space-y-2">
                    <div>
                      <p className="text-sm font-mono text-orange-800">
                        <strong>Cross-sectional Area:</strong> A = ½ × (T + b) × y
                      </p>
                      <p className="text-sm font-mono text-orange-800 ml-4">
                        <strong>Top Width:</strong> T = b + 2zy = {channelData.bottomWidth.toFixed(2)} + 2 × {channelData.sideSlope.toFixed(2)} × {results.normalDepth.toFixed(3)}
                      </p>
                      <p className="text-sm font-mono text-orange-800 ml-4">
                        T = {channelData.bottomWidth.toFixed(2)} + {(2 * channelData.sideSlope * results.normalDepth).toFixed(3)} = {(channelData.bottomWidth + 2 * channelData.sideSlope * results.normalDepth).toFixed(3)} m
                      </p>
                      <p className="text-sm font-mono text-orange-800 ml-4">
                        <strong>Area:</strong> A = ½ × ({(channelData.bottomWidth + 2 * channelData.sideSlope * results.normalDepth).toFixed(3)} + {channelData.bottomWidth.toFixed(2)}) × {results.normalDepth.toFixed(3)}
                      </p>
                      <p className="text-sm font-mono text-orange-800 ml-4">
                        A = ½ × {(channelData.bottomWidth + 2 * channelData.sideSlope * results.normalDepth + channelData.bottomWidth).toFixed(3)} × {results.normalDepth.toFixed(3)}
                      </p>
                      <p className="text-sm font-mono text-orange-800 ml-4 font-bold">
                        A = {results.area.toFixed(3)} m²
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-mono text-orange-800">
                        <strong>Wetted Perimeter:</strong> P = b + 2×y×√(1 + z²)
                      </p>
                      <p className="text-sm font-mono text-orange-800 ml-4">
                        P = {channelData.bottomWidth.toFixed(2)} + 2 × {results.normalDepth.toFixed(3)} × √(1 + {channelData.sideSlope.toFixed(2)}²)
                      </p>
                      <p className="text-sm font-mono text-orange-800 ml-4">
                        P = {channelData.bottomWidth.toFixed(2)} + 2 × {results.normalDepth.toFixed(3)} × √(1 + {Math.pow(channelData.sideSlope, 2).toFixed(3)})
                      </p>
                      <p className="text-sm font-mono text-orange-800 ml-4">
                        P = {channelData.bottomWidth.toFixed(2)} + 2 × {results.normalDepth.toFixed(3)} × {Math.sqrt(1 + Math.pow(channelData.sideSlope, 2)).toFixed(3)}
                      </p>
                      <p className="text-sm font-mono text-orange-800 ml-4">
                        P = {channelData.bottomWidth.toFixed(2)} + {(2 * results.normalDepth * Math.sqrt(1 + Math.pow(channelData.sideSlope, 2))).toFixed(3)}
                      </p>
                      <p className="text-sm font-mono text-orange-800 ml-4 font-bold">
                        P = {results.perimeter.toFixed(3)} m
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-mono text-orange-800">
                        <strong>Hydraulic Radius:</strong> R = A / P
                      </p>
                      <p className="text-sm font-mono text-orange-800 ml-4">
                        R = {results.area.toFixed(3)} / {results.perimeter.toFixed(3)}
                      </p>
                      <p className="text-sm font-mono text-orange-800 ml-4 font-bold">
                        R = {results.hydraulicRadius.toFixed(4)} m
                      </p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <h4 className="font-medium text-orange-900 mb-2">U-shaped Channel Geometry:</h4>
                  <div className="bg-white p-3 rounded border-l-4 border-orange-500 space-y-2">
                    <div>
                      <p className="text-sm font-mono text-orange-800">
                        <strong>Channel Parameters:</strong>
                      </p>
                      <p className="text-sm font-mono text-orange-800 ml-4">
                        • Width (W) = {channelData.width.toFixed(3)} m
                      </p>
                      <p className="text-sm font-mono text-orange-800 ml-4">
                        • Radius (R) = W/2 = {channelData.radius.toFixed(3)} m
                      </p>
                      <p className="text-sm font-mono text-orange-800 ml-4">
                        • Flow Depth (y) = {channelData.flowDepth.toFixed(3)} m
                      </p>
                    </div>
                    
                    {channelData.flowDepth <= channelData.radius ? (
                      <>
                        <div>
                          <p className="text-sm font-mono text-orange-800">
                            <strong>Case: y ≤ R (Water within semicircular bottom)</strong>
                          </p>
                          <p className="text-sm font-mono text-orange-800 ml-4">
                            θ = 2 × cos⁻¹(1 - y/R)
                          </p>
                          <p className="text-sm font-mono text-orange-800 ml-4">
                            θ = 2 × cos⁻¹(1 - {channelData.flowDepth.toFixed(3)}/{channelData.radius.toFixed(3)})
                          </p>
                          <p className="text-sm font-mono text-orange-800 ml-4">
                            θ = 2 × cos⁻¹({(1 - channelData.flowDepth / channelData.radius).toFixed(3)})
                          </p>
                          <p className="text-sm font-mono text-orange-800 ml-4">
                            θ = {(2 * Math.acos(1 - channelData.flowDepth / channelData.radius)).toFixed(3)} radians
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-sm font-mono text-orange-800">
                            <strong>Cross-sectional Area:</strong> A = (R²/2) × (θ - sin(θ))
                          </p>
                          <p className="text-sm font-mono text-orange-800 ml-4">
                            A = ({channelData.radius.toFixed(3)}²/2) × ({(2 * Math.acos(1 - channelData.flowDepth / channelData.radius)).toFixed(3)} - sin({(2 * Math.acos(1 - channelData.flowDepth / channelData.radius)).toFixed(3)}))
                          </p>
                          <p className="text-sm font-mono text-orange-800 ml-4">
                            A = {(Math.pow(channelData.radius, 2) / 2).toFixed(4)} × ({(2 * Math.acos(1 - channelData.flowDepth / channelData.radius)).toFixed(3)} - {Math.sin(2 * Math.acos(1 - channelData.flowDepth / channelData.radius)).toFixed(3)})
                          </p>
                          <p className="text-sm font-mono text-orange-800 ml-4 font-bold">
                            A = {results.area.toFixed(3)} m²
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-sm font-mono text-orange-800">
                            <strong>Wetted Perimeter:</strong> P = R × θ
                          </p>
                          <p className="text-sm font-mono text-orange-800 ml-4">
                            P = {channelData.radius.toFixed(3)} × {(2 * Math.acos(1 - channelData.flowDepth / channelData.radius)).toFixed(3)}
                          </p>
                          <p className="text-sm font-mono text-orange-800 ml-4 font-bold">
                            P = {results.perimeter.toFixed(3)} m
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <p className="text-sm font-mono text-orange-800">
                            <strong>Case: y &gt; R (Water extends above semicircular bottom)</strong>
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-sm font-mono text-orange-800">
                            <strong>Cross-sectional Area:</strong> A = (π×R²/2) + (y-R)×W
                          </p>
                          <p className="text-sm font-mono text-orange-800 ml-4">
                            A = (π×{channelData.radius.toFixed(3)}²/2) + ({channelData.flowDepth.toFixed(3)}-{channelData.radius.toFixed(3)})×{channelData.width.toFixed(3)}
                          </p>
                          <p className="text-sm font-mono text-orange-800 ml-4">
                            A = {(Math.PI * Math.pow(channelData.radius, 2) / 2).toFixed(3)} + {(channelData.flowDepth - channelData.radius).toFixed(3)}×{channelData.width.toFixed(3)}
                          </p>
                          <p className="text-sm font-mono text-orange-800 ml-4">
                            A = {(Math.PI * Math.pow(channelData.radius, 2) / 2).toFixed(3)} + {((channelData.flowDepth - channelData.radius) * channelData.width).toFixed(3)}
                          </p>
                          <p className="text-sm font-mono text-orange-800 ml-4 font-bold">
                            A = {results.area.toFixed(3)} m²
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-sm font-mono text-orange-800">
                            <strong>Wetted Perimeter:</strong> P = π×R + 2×(y-R)
                          </p>
                          <p className="text-sm font-mono text-orange-800 ml-4">
                            P = π×{channelData.radius.toFixed(3)} + 2×({channelData.flowDepth.toFixed(3)}-{channelData.radius.toFixed(3)})
                          </p>
                          <p className="text-sm font-mono text-orange-800 ml-4">
                            P = {(Math.PI * channelData.radius).toFixed(3)} + 2×{(channelData.flowDepth - channelData.radius).toFixed(3)}
                          </p>
                          <p className="text-sm font-mono text-orange-800 ml-4">
                            P = {(Math.PI * channelData.radius).toFixed(3)} + {(2 * (channelData.flowDepth - channelData.radius)).toFixed(3)}
                          </p>
                          <p className="text-sm font-mono text-orange-800 ml-4 font-bold">
                            P = {results.perimeter.toFixed(3)} m
                          </p>
                        </div>
                      </>
                    )}
                    
                    <div>
                      <p className="text-sm font-mono text-orange-800">
                        <strong>Hydraulic Radius:</strong> R = A / P
                      </p>
                      <p className="text-sm font-mono text-orange-800 ml-4">
                        R = {results.area.toFixed(3)} / {results.perimeter.toFixed(3)}
                      </p>
                      <p className="text-sm font-mono text-orange-800 ml-4 font-bold">
                        R = {results.hydraulicRadius.toFixed(4)} m
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <Separator />

        {/* Manning's Equation Calculations */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-green-800">Step 3: Manning&apos;s Equation - Channel Capacity</h3>
          
          <div className="bg-green-50 p-4 rounded-lg space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-green-900 mb-2">Channel Parameters:</h4>
                <ul className="text-sm space-y-1 text-green-800">
                  <li>• Shape: {channelData.shape === "trapezoid" ? "Trapezoidal" : "U-shaped"}</li>
                  {channelData.shape === "trapezoid" ? (
                    <>
                      <li>• Bottom Width (b) = {channelData.bottomWidth.toFixed(2)} m</li>
                      <li>• Side Slope (z) = {channelData.sideSlope.toFixed(2)} H:V</li>
                    </>
                  ) : (
                    <>
                      <li>• Channel Width (W) = {channelData.width.toFixed(2)} m</li>
                      <li>• Bottom Radius (R) = {channelData.radius.toFixed(2)} m</li>
                      <li>• Flow Depth (y) = {channelData.flowDepth.toFixed(3)} m</li>
                    </>
                  )}
                  <li>• Longitudinal Slope (S) = {slope.toFixed(4)} m/m</li>
                  <li>• Manning&apos;s n = {manningN.toFixed(3)}</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-green-900 mb-2">Calculated Geometry:</h4>
                <ul className="text-sm space-y-1 text-green-800">
                  <li>• Normal Depth (y) = {results.normalDepth.toFixed(3)} m</li>
                  <li>• Cross-sectional Area (A) = {area.toFixed(3)} m²</li>
                  <li>• Wetted Perimeter (P) = {results.perimeter.toFixed(3)} m</li>
                  <li>• Hydraulic Radius (R) = {hydraulicRadius.toFixed(4)} m</li>
                </ul>
              </div>
            </div>
            
            <Separator className="bg-green-200" />
            
            <div>
              <h4 className="font-medium text-green-900 mb-2">Manning&apos;s Equation Formula:</h4>
              <div className="bg-white p-3 rounded border-l-4 border-green-500">
                <p className="text-sm font-mono text-green-800">
                  Q = (1/n) × A × R^(2/3) × S^(1/2)
                </p>
                <p className="text-sm font-mono text-green-800 mt-2">
                  Q = (1/{manningN.toFixed(3)}) × {area.toFixed(3)} × {hydraulicRadius.toFixed(4)}^(2/3) × {slope.toFixed(4)}^(1/2)
                </p>
                <p className="text-sm font-mono text-green-800 mt-2">
                  Q = {(1/manningN).toFixed(2)} × {area.toFixed(3)} × {Math.pow(hydraulicRadius, 2/3).toFixed(4)} × {Math.pow(slope, 1/2).toFixed(4)}
                </p>
                <p className="text-sm font-mono text-green-800 mt-2">
                  Q = {calculatedFlow.toFixed(6)} m³/s
                </p>
                <p className="text-sm font-mono text-green-800 mt-2">
                  Q = {calculatedFlow.toFixed(3)} m³/s
                </p>
                <p className="text-sm font-mono text-green-800 mt-1">
                  Q = {(calculatedFlow * 60000).toFixed(1)} L/min
                </p>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Design Validation */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-purple-800">Step 4: Design Validation</h3>
          
          <div className="bg-purple-50 p-4 rounded-lg space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-purple-900 mb-2">Flow Capacity Check:</h4>
                <ul className="text-sm space-y-1 text-purple-800">
                  <li>• Required Peak Flow = {rationalFlow.toFixed(3)} m³/s ({(rationalFlow * 60000).toFixed(1)} L/min)</li>
                  <li>• Channel Capacity = {calculatedFlow.toFixed(3)} m³/s ({(calculatedFlow * 60000).toFixed(1)} L/min)</li>
                  <li>• Flow Ratio = {(calculatedFlow/rationalFlow).toFixed(3)}</li>
                  <li>• Status: {(calculatedFlow/rationalFlow) >= 0.95 ? "✓ Adequate" : "✗ Insufficient"}</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-purple-900 mb-2">Velocity Check:</h4>
                <ul className="text-sm space-y-1 text-purple-800">
                  <li>• Calculated Velocity = {results.velocity.toFixed(2)} m/s</li>
                  {channelData.shape === "u-shaped" ? (
                    <>
                      <li>• Min. Recommended = 0.3 m/s</li>
                      <li>• Max. Permissible = 4.0 m/s (TGN 43)</li>
                    </>
                  ) : (
                    <>
                      <li>• Min. Recommended = 0.3 m/s</li>
                      <li>• Max. Recommended = 3.0 m/s</li>
                    </>
                  )}
                  <li>• Status: {
                    results.velocity >= 0.3 && 
                    (channelData.shape === "u-shaped" ? results.velocity <= 4.0 : results.velocity <= 3.0)
                      ? "✓ Acceptable" : "✗ Outside Range"
                  }</li>
                </ul>
              </div>
            </div>
            
            {channelData.shape === "u-shaped" && (
              <div>
                <h4 className="font-medium text-purple-900 mb-2">TGN 43 Compliance Check:</h4>
                <ul className="text-sm space-y-1 text-purple-800">
                  <li>• Channel Width = {(channelData.width * 1000).toFixed(0)} mm</li>
                  <li>• TGN 43 Limit = 600 mm</li>
                  <li>• Status: {channelData.width <= 0.6 ? "✓ Compliant" : "✗ Exceeds Limit"}</li>
                </ul>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Final Results Summary */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">Final Design Summary</h3>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">Peak Flow</p>
                <p className="text-xl font-bold text-gray-800">{rationalFlow.toFixed(3)} m³/s</p>
                <p className="text-sm text-gray-500">{(rationalFlow * 60000).toFixed(1)} L/min</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Channel Capacity</p>
                <p className="text-xl font-bold text-gray-800">{calculatedFlow.toFixed(3)} m³/s</p>
                <p className="text-sm text-gray-500">{(calculatedFlow * 60000).toFixed(1)} L/min</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Design Status</p>
                <p className={`text-xl font-bold ${results.status === "OK" ? "text-green-600" : "text-red-600"}`}>
                  {results.status}
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

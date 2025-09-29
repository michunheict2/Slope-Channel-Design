"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BatchCalculationResult, ChannelAlignment } from "../types";
import BatchPDFExport from "./BatchPDFExport";
import { 
  Calculator, 
  ChevronDown, 
  ChevronRight, 
  Info,
  CheckCircle,
  XCircle,
  AlertTriangle
} from "lucide-react";

interface BatchDetailedCalculationsProps {
  results: BatchCalculationResult[];
  channels?: ChannelAlignment[];
}

export default function BatchDetailedCalculations({ results, channels = [] }: BatchDetailedCalculationsProps) {
  const [expandedCatchments, setExpandedCatchments] = useState<Set<string>>(new Set());

  const toggleCatchment = (catchmentId: string) => {
    const newExpanded = new Set(expandedCatchments);
    if (newExpanded.has(catchmentId)) {
      newExpanded.delete(catchmentId);
    } else {
      newExpanded.add(catchmentId);
    }
    setExpandedCatchments(newExpanded);
  };

  const expandAll = () => {
    setExpandedCatchments(new Set(results.map(r => r.catchmentId)));
  };

  const collapseAll = () => {
    setExpandedCatchments(new Set());
  };

  const formatNumber = (num: number, decimals: number = 3) => {
    return num.toFixed(decimals);
  };

  // const formatArea = (area: number) => {
  //   if (area >= 10000) {
  //     return `${(area / 10000).toFixed(2)} ha`;
  //   } else {
  //     return `${area.toFixed(0)} m²`;
  //   }
  // };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Detailed Calculations
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={expandAll}>
              Expand All
            </Button>
            <Button variant="outline" size="sm" onClick={collapseAll}>
              Collapse All
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {results.map((result) => {
          const isExpanded = expandedCatchments.has(result.catchmentId);
          
          return (
            <Card key={result.catchmentId} className="border-l-4 border-l-blue-400">
              <CardHeader 
                className="cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleCatchment(result.catchmentId)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-gray-500" />
                    )}
                    <div>
                      <h3 className="font-semibold">{result.catchmentName}</h3>
                      <p className="text-sm text-muted-foreground">ID: {result.catchmentId}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {result.status === "OK" ? (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">OK</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-red-600">
                        <XCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">Not OK</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="pt-0">
                  <div className="space-y-6">
                    {/* Error/Warning Display */}
                    {result.error && (
                      <Alert variant="destructive">
                        <XCircle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Design Error:</strong> {result.error}
                        </AlertDescription>
                      </Alert>
                    )}

                    {result.velocityWarning && !result.error && (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Velocity Warning:</strong> {result.velocityWarning}
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Step 1: Time of Concentration Calculation */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-lg flex items-center gap-2">
                        <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</span>
                        Time of Concentration Calculation
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <h5 className="font-medium text-blue-900 mb-2">Catchment Time of Concentration</h5>
                          <p className="text-2xl font-bold text-blue-800">{formatNumber(result.catchmentTC, 1)} min</p>
                          <p className="text-xs text-blue-600 mt-1">
                            Using DSD SDM method: t_o = (0.14465 × L) / (H^0.2 × A^0.1)
                          </p>
                        </div>
                        
                        <div className="bg-green-50 p-3 rounded-lg">
                          <h5 className="font-medium text-green-900 mb-2">Upstream Channel TC</h5>
                          <p className="text-2xl font-bold text-green-800">{formatNumber(result.upstreamTC, 1)} min</p>
                          <p className="text-xs text-green-600 mt-1">
                            Maximum of upstream channel times
                          </p>
                        </div>
                        
                        <div className="bg-purple-50 p-3 rounded-lg">
                          <h5 className="font-medium text-purple-900 mb-2">Effective Time of Concentration</h5>
                          <p className="text-2xl font-bold text-purple-800">{formatNumber(result.effectiveTC, 1)} min</p>
                          <p className="text-xs text-purple-600 mt-1">
                            Maximum of catchment and upstream TCs
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Step 2: Rainfall Intensity Calculation */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-lg flex items-center gap-2">
                        <span className="bg-green-100 text-green-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</span>
                        Rainfall Intensity Calculation
                      </h4>
                      
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h5 className="font-medium text-green-900 mb-2">Hong Kong IDF Curve</h5>
                            <p className="text-3xl font-bold text-green-800">{formatNumber(result.rainfallIntensity, 1)} mm/hr</p>
                            <p className="text-sm text-green-600 mt-1">
                              Return Period: {result.returnPeriod || 'N/A'} years<br/>
                              Duration: {formatNumber(result.effectiveTC, 1)} minutes<br/>
                              Climate Change: +28.1% (permanent design)
                            </p>
                          </div>
                          <div>
                            <h5 className="font-medium text-green-900 mb-2">Formula</h5>
                            <div className="bg-white p-3 rounded border text-sm font-mono">
                              i = a / (t + b)^c
                            </div>
                            <p className="text-xs text-green-600 mt-2">
                              Where: t = {formatNumber(result.effectiveTC, 1)} min
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Step 3: Runoff Coefficient */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-lg flex items-center gap-2">
                        <span className="bg-orange-100 text-orange-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</span>
                        Runoff Coefficient
                      </h4>
                      
                      <div className="bg-orange-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="font-medium text-orange-900 mb-2">Surface Type Coefficient</h5>
                            <p className="text-3xl font-bold text-orange-800">C = {formatNumber(result.runoffCoefficient, 2)}</p>
                            <p className="text-sm text-orange-600 mt-1">
                              Based on surface type characteristics
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="bg-white p-3 rounded border">
                              <p className="text-sm font-medium">Rational Method</p>
                              <p className="text-xs text-gray-600">Q = C × i × A</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Step 4: Peak Flow Calculation */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-lg flex items-center gap-2">
                        <span className="bg-red-100 text-red-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">4</span>
                        Peak Flow Calculation (Rational Method)
                      </h4>
                      
                      <div className="bg-red-50 p-4 rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h5 className="font-medium text-red-900 mb-2">Peak Flow</h5>
                            <p className="text-3xl font-bold text-red-800">{formatNumber(result.peakFlow, 3)} m³/s</p>
                            <p className="text-sm text-red-600 mt-1">
                              {(result.peakFlow * 1000).toFixed(1)} L/s<br/>
                              {(result.peakFlow * 60000).toFixed(1)} L/min
                            </p>
                          </div>
                          <div>
                            <h5 className="font-medium text-red-900 mb-2">Calculation</h5>
                            <div className="bg-white p-3 rounded border text-sm">
                              <p>Q = C × i × A</p>
                              <p>Q = {formatNumber(result.runoffCoefficient, 2)} × {formatNumber(result.rainfallIntensity, 1)} × A</p>
                              <p>Q = {formatNumber(result.runoffCoefficient * result.rainfallIntensity / 3600000, 6)} × A</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Step 5: Channel Design */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-lg flex items-center gap-2">
                        <span className="bg-purple-100 text-purple-800 rounded-full w-6 h-6 flex items-center text-sm font-bold">5</span>
                        Channel Design (Manning&apos;s Equation)
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-purple-50 p-4 rounded-lg">
                          <h5 className="font-medium text-purple-900 mb-2">Required Channel Width</h5>
                          <p className="text-2xl font-bold text-purple-800">{formatNumber(result.requiredChannelWidth, 3)} m</p>
                          <p className="text-sm text-purple-600 mt-1">
                            Theoretical minimum width
                          </p>
                        </div>
                        
                        <div className="bg-indigo-50 p-4 rounded-lg">
                          <h5 className="font-medium text-indigo-900 mb-2">Selected Channel Size</h5>
                          <p className="text-2xl font-bold text-indigo-800">{result.selectedChannelSize}</p>
                          <p className="text-sm text-indigo-600 mt-1">
                            Actual width: {formatNumber(result.selectedChannelWidth, 3)} m
                          </p>
                        </div>
                      </div>

                      {/* Detailed Channel Dimensions (for trapezoidal channels) */}
                      {result.channelShape === "trapezoidal" && result.channelTopWidth && result.channelBottomWidth && result.channelDepth && (
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <h5 className="font-medium text-blue-900 mb-3">📐 Channel Dimensions</h5>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-white p-3 rounded border">
                              <h6 className="font-medium text-sm text-gray-700 mb-1">Top Width</h6>
                              <p className="text-lg font-bold text-blue-800">{formatNumber(result.channelTopWidth, 3)} m</p>
                            </div>
                            <div className="bg-white p-3 rounded border">
                              <h6 className="font-medium text-sm text-gray-700 mb-1">Bottom Width</h6>
                              <p className="text-lg font-bold text-blue-800">{formatNumber(result.channelBottomWidth, 3)} m</p>
                            </div>
                            <div className="bg-white p-3 rounded border">
                              <h6 className="font-medium text-sm text-gray-700 mb-1">Channel Depth</h6>
                              <p className="text-lg font-bold text-blue-800">{formatNumber(result.channelDepth, 3)} m</p>
                            </div>
                            <div className="bg-white p-3 rounded border">
                              <h6 className="font-medium text-sm text-gray-700 mb-1">Side Slope</h6>
                              <p className="text-lg font-bold text-blue-800">1:{result.channelSideSlope}</p>
                            </div>
                          </div>
                          <div className="mt-3 text-xs text-blue-600">
                            <p>• Side slope: {result.channelSideSlope}:1 (Horizontal:Vertical)</p>
                            <p>• Top width = Bottom width + 2 × Side slope × Depth</p>
                          </div>
                        </div>
                      )}

                      {/* Manning's Equation Details */}
                      {result.manningN && result.channelArea && result.hydraulicRadius && result.channelGradient && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h5 className="font-medium text-gray-900 mb-1">Manning&apos;s Equation Details</h5>
                          <p className="text-sm text-gray-600 mb-3">
                            Flow calculation checking for {result.selectedChannelSize} channel
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-white p-3 rounded border">
                              <h6 className="font-medium text-sm text-gray-700 mb-1">Manning&apos;s n</h6>
                              <p className="text-lg font-bold text-gray-800">{formatNumber(result.manningN, 3)}</p>
                              <p className="text-xs text-gray-500">{result.channelMaterial}</p>
                            </div>
                            <div className="bg-white p-3 rounded border">
                              <h6 className="font-medium text-sm text-gray-700 mb-1">Cross-sectional Area</h6>
                              <p className="text-lg font-bold text-gray-800">{formatNumber(result.channelArea, 3)} m²</p>
                              <p className="text-xs text-gray-500">A</p>
                            </div>
                            <div className="bg-white p-3 rounded border">
                              <h6 className="font-medium text-sm text-gray-700 mb-1">Hydraulic Radius</h6>
                              <p className="text-lg font-bold text-gray-800">{formatNumber(result.hydraulicRadius, 3)} m</p>
                              <p className="text-xs text-gray-500">R = A/P</p>
                            </div>
                            <div className="bg-white p-3 rounded border">
                              <h6 className="font-medium text-sm text-gray-700 mb-1">Channel Gradient</h6>
                              <p className="text-lg font-bold text-gray-800">{formatNumber(result.channelGradient, 4)} m/m</p>
                              <p className="text-xs text-gray-500">S</p>
                            </div>
                          </div>
                          <div className="mt-3 bg-white p-3 rounded border">
                            <h6 className="font-medium text-sm text-gray-700 mb-2">Manning&apos;s Equation</h6>
                            <div className="text-sm font-mono bg-gray-100 p-2 rounded">
                              Q = (1/n) × A × R^(2/3) × S^(1/2)
                            </div>
                            <div className="text-sm font-mono bg-gray-100 p-2 rounded mt-1">
                              Q = (1/{formatNumber(result.manningN, 3)}) × {formatNumber(result.channelArea, 3)} × {formatNumber(result.hydraulicRadius, 3)}^(2/3) × {formatNumber(result.channelGradient, 4)}^(1/2)
                            </div>
                            <div className="text-sm font-mono bg-gray-100 p-2 rounded mt-1">
                              Q = {formatNumber(1/result.manningN, 2)} × {formatNumber(result.channelArea, 3)} × {formatNumber(Math.pow(result.hydraulicRadius, 2/3), 3)} × {formatNumber(Math.pow(result.channelGradient, 1/2), 4)}
                            </div>
                            <div className="text-sm font-mono bg-blue-100 p-2 rounded mt-1 font-bold">
                              Q = {formatNumber(result.calculatedFlow, 3)} m³/s
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Step 6: Flow Verification */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-lg flex items-center gap-2">
                        <span className="bg-teal-100 text-teal-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">6</span>
                        Flow Verification
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-teal-50 p-4 rounded-lg">
                          <h5 className="font-medium text-teal-900 mb-2">Channel Capacity</h5>
                          <p className="text-2xl font-bold text-teal-800">{formatNumber(result.calculatedFlow, 3)} m³/s</p>
                          <p className="text-sm text-teal-600 mt-1">
                            Manning&apos;s equation result
                          </p>
                        </div>
                        
                        <div className="bg-cyan-50 p-4 rounded-lg">
                          <h5 className="font-medium text-cyan-900 mb-2">Flow Velocity</h5>
                          <p className="text-2xl font-bold text-cyan-800">{formatNumber(result.velocity, 2)} m/s</p>
                          <p className="text-sm text-cyan-600 mt-1">
                            V = Q / A
                          </p>
                        </div>
                        
                        <div className="bg-yellow-50 p-4 rounded-lg">
                          <h5 className="font-medium text-yellow-900 mb-2">Channel Utilization</h5>
                          <p className="text-2xl font-bold text-yellow-800">
                            {((result.peakFlow / result.calculatedFlow) * 100).toFixed(1)}%
                          </p>
                          <p className="text-sm text-yellow-600 mt-1">
                            Required / Allowed
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Step 7: Design Status */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-lg flex items-center gap-2">
                        <span className="bg-gray-100 text-gray-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">7</span>
                        Design Status
                      </h4>
                      
                      <div className={`p-4 rounded-lg ${
                        result.status === "OK" 
                          ? "bg-green-50 border border-green-200" 
                          : "bg-red-50 border border-red-200"
                      }`}>
                        <div className="flex items-center gap-3">
                          {result.status === "OK" ? (
                            <CheckCircle className="h-8 w-8 text-green-600" />
                          ) : (
                            <XCircle className="h-8 w-8 text-red-600" />
                          )}
                          <div>
                            <h5 className={`font-semibold text-lg ${
                              result.status === "OK" ? "text-green-900" : "text-red-900"
                            }`}>
                              Design {result.status}
                            </h5>
                            <p className={`text-sm ${
                              result.status === "OK" ? "text-green-700" : "text-red-700"
                            }`}>
                              {result.status === "OK" 
                                ? "Channel utilization is within acceptable limits (≤100%)"
                                : "Channel utilization exceeds 100% or design criteria not met"
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Design Criteria Check */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-lg flex items-center gap-2">
                        <Info className="h-5 w-5" />
                        Design Criteria Check
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <h5 className="font-medium">Channel Utilization</h5>
                          <div className={`p-3 rounded border ${
                            (result.peakFlow / result.calculatedFlow) <= 1.0 
                              ? "bg-green-50 border-green-200" 
                              : "bg-red-50 border-red-200"
                          }`}>
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Utilization</span>
                              <span className={`font-bold ${
                                (result.peakFlow / result.calculatedFlow) <= 1.0 
                                  ? "text-green-700" 
                                  : "text-red-700"
                              }`}>
                                {((result.peakFlow / result.calculatedFlow) * 100).toFixed(1)}%
                              </span>
                            </div>
                            <p className="text-xs mt-1">
                              Flow Required / Flow Allowed
                            </p>
                            <p className="text-xs mt-1">
                              Maximum allowed: 100%
                            </p>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <h5 className="font-medium">Velocity Check</h5>
                          <div className={`p-3 rounded border ${
                            result.velocity >= 0.3 && result.velocity <= 4.0 
                              ? "bg-green-50 border-green-200" 
                              : "bg-red-50 border-red-200"
                          }`}>
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Velocity</span>
                              <span className={`font-bold ${
                                result.velocity >= 0.3 && result.velocity <= 4.0 
                                  ? "text-green-700" 
                                  : "text-red-700"
                              }`}>
                                {formatNumber(result.velocity, 2)} m/s
                              </span>
                            </div>
                            <p className="text-xs mt-1">
                              Range: 0.3 - 4.0 m/s
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </CardContent>
      
      {/* PDF Export Button */}
      <CardContent className="pt-4">
        <BatchPDFExport results={results} channels={channels} />
      </CardContent>
    </Card>
  );
}

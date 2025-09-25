"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mmPerHourToMetersPerSecond } from "../utils/units";
import { useIDF, type IDFResult } from "../hooks/useIDF";

export interface RainfallData {
  intensity: number; // mm/h
  intensityMS: number; // m/s
  // IDF curve data
  returnPeriod?: number;
  duration?: number; // minutes
  temporaryDesign?: boolean;
  idfResult?: IDFResult;
  useIDFCurve?: boolean;
}

interface RainfallFormProps {
  data: RainfallData;
  onChange: (data: RainfallData) => void;
}

export default function RainfallForm({ data, onChange }: RainfallFormProps) {
  const [intensity, setIntensity] = useState(data.intensity.toString());
  const [returnPeriod, setReturnPeriod] = useState(data.returnPeriod?.toString() || "");
  const [duration, setDuration] = useState(data.duration?.toString() || "");
  const [temporaryDesign, setTemporaryDesign] = useState(data.temporaryDesign || false);
  const [useIDFCurve, setUseIDFCurve] = useState(data.useIDFCurve || false);

  const { constants, loading, error, calculate, getReturnPeriods, getConstantsForRP } = useIDF();

  // Update data when IDF parameters change
  useEffect(() => {
    if (useIDFCurve && returnPeriod && duration) {
      try {
        const rp = parseInt(returnPeriod);
        const dur = parseFloat(duration);
        const idfResult = calculate(rp, dur, temporaryDesign);
        
        const newData = {
          ...data,
          intensity: idfResult.intensity,
          intensityMS: idfResult.intensitySI,
          returnPeriod: rp,
          duration: dur,
          temporaryDesign,
          idfResult,
          useIDFCurve
        };
        onChange(newData);
      } catch (err) {
        console.error('IDF calculation error:', err);
      }
    }
  }, [returnPeriod, duration, temporaryDesign, useIDFCurve, constants]);

  const handleIntensityChange = (value: string) => {
    setIntensity(value);
    setUseIDFCurve(false); // Switch to manual mode
    
    const numValue = parseFloat(value) || 0;
    const intensityMS = mmPerHourToMetersPerSecond(numValue);
    
    const newData = {
      ...data,
      intensity: numValue,
      intensityMS,
      useIDFCurve: false
    };
    onChange(newData);
  };

  const handleReturnPeriodChange = (value: string) => {
    setReturnPeriod(value);
    setUseIDFCurve(true);
  };

  const handleDurationChange = (value: string) => {
    setDuration(value);
    setUseIDFCurve(true);
  };

  const handleTemporaryDesignChange = (checked: boolean) => {
    setTemporaryDesign(checked);
  };

  const currentConstants = returnPeriod ? getConstantsForRP(parseInt(returnPeriod)) : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rainfall Properties</CardTitle>
        <p className="text-sm text-muted-foreground">
          Based on Hong Kong IDF curves (GEO TGN 30, 2023)
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* IDF Curve Section */}
        <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="useIDF"
              checked={useIDFCurve}
              onChange={(e) => setUseIDFCurve(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="useIDF" className="font-medium">
              Use Hong Kong IDF Curve (TGN 30)
            </Label>
          </div>

          {useIDFCurve && (
            <>
              {loading && <p className="text-sm text-muted-foreground">Loading IDF constants...</p>}
              {error && <p className="text-sm text-red-600">Error: {error}</p>}
              
              {!loading && !error && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="returnPeriod">Design Return Period (years)</Label>
                      <Select value={returnPeriod} onValueChange={handleReturnPeriodChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select return period" />
                        </SelectTrigger>
                        <SelectContent>
                          {getReturnPeriods.map((rp) => (
                            <SelectItem key={rp} value={rp.toString()}>
                              {rp} years
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="duration">Duration / Time of Concentration (minutes)</Label>
                      <Input
                        id="duration"
                        type="number"
                        value={duration}
                        onChange={(e) => handleDurationChange(e.target.value)}
                        placeholder="60"
                        min="1"
                        step="1"
                      />
                    </div>
                  </div>

                  {/* Constants Display */}
                  {currentConstants && (
                    <div className="p-3 bg-background border rounded-md">
                      <p className="text-sm font-medium mb-2">IDF Curve Constants (RP = {currentConstants.RP} years):</p>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>a = {currentConstants.a}</div>
                        <div>b = {currentConstants.b}</div>
                        <div>c = {currentConstants.c}</div>
                      </div>
                    </div>
                  )}

                  {/* Climate Change Toggle */}
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="temporaryDesign"
                      checked={temporaryDesign}
                      onChange={(e) => handleTemporaryDesignChange(e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor="temporaryDesign">
                      Temporary drainage design (exclude climate change adjustment)
                    </Label>
                  </div>

                  {/* IDF Results */}
                  {data.idfResult && (
                    <div className="p-3 bg-background border rounded-md space-y-2">
                      <p className="text-sm font-medium">IDF Calculation Results:</p>
                      <div className="text-sm space-y-1">
                        <div>Formula: {data.idfResult.formula}</div>
                        <div>Raw Intensity: {data.idfResult.rawIntensity.toFixed(2)} mm/hr</div>
                        {data.idfResult.climateChangeApplied && (
                          <div>Climate Change Adjustment: +28.1%</div>
                        )}
                        <div className="font-medium">
                          Final Intensity: {data.idfResult.intensity.toFixed(2)} mm/hr
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>

        {/* Manual Input Section */}
        {!useIDFCurve && (
          <div className="space-y-2">
            <Label htmlFor="intensity">Rainfall Intensity (mm/h)</Label>
            <Input
              id="intensity"
              type="number"
              value={intensity}
              onChange={(e) => handleIntensityChange(e.target.value)}
              placeholder="100"
              min="0"
              step="0.1"
            />
            <p className="text-sm text-muted-foreground">
              Manual rainfall intensity input
            </p>
          </div>
        )}

        <div className="p-3 bg-muted rounded-md">
          <p className="text-sm font-medium">
            Intensity (SI): {data.intensityMS.toExponential(6)} m/s
          </p>
          <p className="text-xs text-muted-foreground">
            Converted for calculations
          </p>
        </div>

        {/* Reference Link */}
        <div className="text-xs text-muted-foreground">
          <p>Reference: <a 
            href="https://www.cedd.gov.hk/eng/publications/geo/geo-publications/geo-technical-guidance-notes.html" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            GEO Technical Guidance Note No. 30 (2023)
          </a></p>
        </div>

      </CardContent>
    </Card>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mmPerHourToMetersPerSecond } from "../utils/units";
import { useIDF, type IDFResult } from "../hooks/useIDF";

export interface UpstreamChannel {
  channelNo: string;
  timeOfConcentration: number; // minutes
}

export interface RainfallData {
  intensity: number; // mm/h
  intensityMS: number; // m/s
  // IDF curve data
  returnPeriod?: number;
  duration?: number; // minutes
  temporaryDesign?: boolean;
  idfResult?: IDFResult;
  useIDFCurve?: boolean;
  // Upstream channels
  upstreamChannels: UpstreamChannel[];
}

interface RainfallFormProps {
  data: RainfallData;
  onChange: (data: RainfallData) => void;
}



// Main component that combines both sections
export default function RainfallForm({ data, onChange }: RainfallFormProps) {
  const [intensity, setIntensity] = useState(data.intensity.toString());
  const [returnPeriod, setReturnPeriod] = useState(data.returnPeriod?.toString() || "");
  const [duration, setDuration] = useState(data.duration?.toString() || "");
  const [temporaryDesign, setTemporaryDesign] = useState(data.temporaryDesign || false);
  const [useIDFCurve, setUseIDFCurve] = useState(data.useIDFCurve || false);
  const [upstreamChannels, setUpstreamChannels] = useState<UpstreamChannel[]>(
    data.upstreamChannels || Array(4).fill({ channelNo: "", timeOfConcentration: 0 })
  );
  const [inputValues, setInputValues] = useState<string[]>(
    Array(4).fill("")
  );

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

  const handleUpstreamChannelChange = (index: number, field: keyof UpstreamChannel, value: string | number) => {
    const newChannels = [...upstreamChannels];
    if (field === 'timeOfConcentration') {
      const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
      newChannels[index] = { ...newChannels[index], [field]: numValue };
      
      // Update input values to preserve the string format
      const newInputValues = [...inputValues];
      newInputValues[index] = value.toString();
      setInputValues(newInputValues);
    } else {
      newChannels[index] = { ...newChannels[index], [field]: value };
    }
    setUpstreamChannels(newChannels);
    
    const newData = {
      ...data,
      upstreamChannels: newChannels
    };
    onChange(newData);
  };

  const maxTimeOfConcentration = upstreamChannels.reduce((max, channel) => {
    return Math.max(max, channel.timeOfConcentration || 0);
  }, 0);

  const currentConstants = returnPeriod ? getConstantsForRP(parseInt(returnPeriod)) : null;

  return (
    <div className="space-y-6">
      {/* Upstream Channels Section */}
      <Card>
        <CardHeader>
          <CardTitle>Upstream Channels</CardTitle>
          <p className="text-sm text-muted-foreground">
            Input upstream channel information and time of concentration
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Upstream Channels Table */}
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-muted">
                    <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium">Channel No.</th>
                    <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium">Time of Concentration (minutes)</th>
                  </tr>
                </thead>
                <tbody>
                  {upstreamChannels.map((channel, index) => (
                    <tr key={index}>
                      <td className="border border-gray-300 px-3 py-2">
                        <Input
                          type="text"
                          value={channel.channelNo}
                          onChange={(e) => handleUpstreamChannelChange(index, 'channelNo', e.target.value)}
                          placeholder={`Channel ${index + 1}`}
                          className="border-0 p-0 h-auto focus:ring-0"
                        />
                      </td>
                      <td className="border border-gray-300 px-3 py-2">
                        <Input
                          type="number"
                          value={inputValues[index]}
                          onChange={(e) => handleUpstreamChannelChange(index, 'timeOfConcentration', e.target.value)}
                          placeholder="0"
                          min="0"
                          step="0.01"
                          className="border-0 p-0 h-auto focus:ring-0"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-muted/50">
                    <td className="border border-gray-300 px-3 py-2 text-sm font-medium">Max</td>
                    <td className="border border-gray-300 px-3 py-2 text-sm font-medium">
                      {maxTimeOfConcentration.toFixed(2)} minutes
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rainfall Properties Section */}
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
    </div>
  );
}

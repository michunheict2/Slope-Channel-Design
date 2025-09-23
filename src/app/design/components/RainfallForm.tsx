"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { mmPerHourToMetersPerSecond } from "../utils/units";

export interface RainfallData {
  intensity: number; // mm/h
  intensityMS: number; // m/s
}

interface RainfallFormProps {
  data: RainfallData;
  onChange: (data: RainfallData) => void;
}

export default function RainfallForm({ data, onChange }: RainfallFormProps) {
  const [intensity, setIntensity] = useState(data.intensity.toString());

  const handleIntensityChange = (value: string) => {
    setIntensity(value);
    const numValue = parseFloat(value) || 0;
    const intensityMS = mmPerHourToMetersPerSecond(numValue);
    
    const newData = {
      intensity: numValue,
      intensityMS,
    };
    onChange(newData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rainfall Properties</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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
            Design rainfall intensity for the specified return period
          </p>
        </div>

        <div className="p-3 bg-muted rounded-md">
          <p className="text-sm font-medium">
            Intensity (SI): {data.intensityMS.toExponential(6)} m/s
          </p>
          <p className="text-xs text-muted-foreground">
            Converted for calculations
          </p>
        </div>

      </CardContent>
    </Card>
  );
}

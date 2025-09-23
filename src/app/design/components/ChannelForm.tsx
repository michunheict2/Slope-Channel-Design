"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface ChannelData {
  shape: string;
  bottomWidth: number; // b in meters
  sideSlope: number; // z (H:V ratio)
  longitudinalSlope: number; // S (m/m)
  manningN: number; // Manning's roughness coefficient
}

interface ChannelFormProps {
  data: ChannelData;
  onChange: (data: ChannelData) => void;
}

const CHANNEL_SHAPES = [
  { id: "trapezoid", name: "Trapezoidal" },
  // Additional shapes will be added in future weeks
];

const MANNING_COEFFICIENTS = [
  { material: "Concrete", value: 0.013, description: "Smooth concrete" },
  { material: "Concrete (rough)", value: 0.017, description: "Rough concrete" },
  { material: "Brick", value: 0.015, description: "Brick masonry" },
  { material: "Rubble masonry", value: 0.025, description: "Rubble masonry" },
  { material: "Earth (smooth)", value: 0.022, description: "Smooth earth" },
  { material: "Earth (rough)", value: 0.035, description: "Rough earth" },
  { material: "Gravel", value: 0.025, description: "Gravel bed" },
  { material: "Natural channel", value: 0.035, description: "Natural channel" },
];

export default function ChannelForm({ data, onChange }: ChannelFormProps) {
  const [bottomWidth, setBottomWidth] = useState(data.bottomWidth.toString());
  const [sideSlope, setSideSlope] = useState(data.sideSlope.toString());
  const [longitudinalSlope, setLongitudinalSlope] = useState(data.longitudinalSlope.toString());
  const [manningN, setManningN] = useState(data.manningN.toString());

  const handleBottomWidthChange = (value: string) => {
    setBottomWidth(value);
    const numValue = parseFloat(value) || 0;
    const newData = { ...data, bottomWidth: numValue };
    onChange(newData);
  };

  const handleSideSlopeChange = (value: string) => {
    setSideSlope(value);
    const numValue = parseFloat(value) || 0;
    const newData = { ...data, sideSlope: numValue };
    onChange(newData);
  };

  const handleLongitudinalSlopeChange = (value: string) => {
    setLongitudinalSlope(value);
    const numValue = parseFloat(value) || 0;
    const newData = { ...data, longitudinalSlope: numValue };
    onChange(newData);
  };

  const handleManningNChange = (value: string) => {
    setManningN(value);
    const numValue = parseFloat(value) || 0.013;
    const newData = { ...data, manningN: numValue };
    onChange(newData);
  };

  const handleManningNSelect = (value: string) => {
    const selected = MANNING_COEFFICIENTS.find(coeff => coeff.value.toString() === value);
    if (selected) {
      setManningN(selected.value.toString());
      const newData = { ...data, manningN: selected.value };
      onChange(newData);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Channel Properties</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="shape">Channel Shape</Label>
          <Select value={data.shape} onValueChange={(value) => onChange({ ...data, shape: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select channel shape" />
            </SelectTrigger>
            <SelectContent>
              {CHANNEL_SHAPES.map((shape) => (
                <SelectItem key={shape.id} value={shape.id}>
                  {shape.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            Channel cross-sectional shape
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bottom-width">Bottom Width (m)</Label>
          <Input
            id="bottom-width"
            type="number"
            value={bottomWidth}
            onChange={(e) => handleBottomWidthChange(e.target.value)}
            placeholder="0.5"
            min="0"
            step="0.1"
          />
          <p className="text-sm text-muted-foreground">
            Width of the channel bottom
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="side-slope">Side Slope (H:V)</Label>
          <Input
            id="side-slope"
            type="number"
            value={sideSlope}
            onChange={(e) => handleSideSlopeChange(e.target.value)}
            placeholder="1.5"
            min="0"
            step="0.1"
          />
          <p className="text-sm text-muted-foreground">
            Horizontal to vertical ratio (e.g., 1.5 means 1.5H:1V)
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="longitudinal-slope">Longitudinal Slope (m/m)</Label>
          <Input
            id="longitudinal-slope"
            type="number"
            value={longitudinalSlope}
            onChange={(e) => handleLongitudinalSlopeChange(e.target.value)}
            placeholder="0.01"
            min="0"
            step="0.001"
          />
          <p className="text-sm text-muted-foreground">
            Channel slope in the flow direction (e.g., 0.01 = 1%)
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="manning-n">Manning&apos;s Roughness Coefficient (n)</Label>
          <div className="flex gap-2">
            <Input
              id="manning-n"
              type="number"
              value={manningN}
              onChange={(e) => handleManningNChange(e.target.value)}
              placeholder="0.013"
              min="0.005"
              max="0.1"
              step="0.001"
              className="flex-1"
            />
            <Select value={manningN} onValueChange={handleManningNSelect}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select material" />
              </SelectTrigger>
              <SelectContent>
                {MANNING_COEFFICIENTS.map((coeff) => (
                  <SelectItem key={coeff.material} value={coeff.value.toString()}>
                    {coeff.material} ({coeff.value})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-sm text-muted-foreground">
            Surface roughness coefficient
          </p>
        </div>

        <div className="p-3 bg-blue-50 rounded-md">
          <p className="text-sm text-blue-800">
            <strong>Week 1:</strong> Only trapezoidal channels are supported.
            Additional shapes (rectangular, triangular, circular) will be added in future weeks.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

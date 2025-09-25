"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface CatchmentData {
  area: number; // m²
  surfaceType: string;
  runoffCoefficient: number;
  weightedRunoffCoefficient: number;
}

interface CatchmentFormProps {
  data: CatchmentData;
  onChange: (data: CatchmentData) => void;
}

const SURFACE_TYPES = [
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
  { id: "undrain", name: "Undrain", coefficient: 1.00 },
];

export default function CatchmentForm({ data, onChange }: CatchmentFormProps) {
  const [area, setArea] = useState(data.area.toString());
  const [surfaceType, setSurfaceType] = useState(data.surfaceType);
  const [runoffCoefficient, setRunoffCoefficient] = useState(data.runoffCoefficient.toString());

  const handleAreaChange = (value: string) => {
    setArea(value);
    const numValue = parseFloat(value) || 0;
    const newData = { ...data, area: numValue };
    onChange(newData);
  };

  const handleSurfaceTypeChange = (value: string) => {
    setSurfaceType(value);
    const selectedType = SURFACE_TYPES.find(type => type.id === value);
    const coefficient = selectedType?.coefficient || 0.5;
    setRunoffCoefficient(coefficient.toString());
    
    const newData = {
      ...data,
      surfaceType: value,
      runoffCoefficient: coefficient,
      weightedRunoffCoefficient: coefficient, // For Week 1, just use the single coefficient
    };
    onChange(newData);
  };

  const handleRunoffCoefficientChange = (value: string) => {
    setRunoffCoefficient(value);
    const numValue = parseFloat(value) || 0;
    const newData = {
      ...data,
      runoffCoefficient: numValue,
      weightedRunoffCoefficient: numValue, // For Week 1, just use the single coefficient
    };
    onChange(newData);
  };

  const selectedSurfaceType = SURFACE_TYPES.find(type => type.id === surfaceType);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Catchment Properties</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="area">Catchment Area (m²)</Label>
          <Input
            id="area"
            type="number"
            value={area}
            onChange={(e) => handleAreaChange(e.target.value)}
            placeholder="1000"
            min="0"
            step="0.1"
          />
          <p className="text-sm text-muted-foreground">
            Total drainage area in square meters
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="surface-type">Surface Type</Label>
          <Select value={surfaceType} onValueChange={handleSurfaceTypeChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select surface type" />
            </SelectTrigger>
            <SelectContent>
              {SURFACE_TYPES.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  {type.name} (C = {type.coefficient})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            Select the predominant surface type
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="runoff-coefficient">Runoff Coefficient (C)</Label>
          <Input
            id="runoff-coefficient"
            type="number"
            value={runoffCoefficient}
            onChange={(e) => handleRunoffCoefficientChange(e.target.value)}
            placeholder="0.9"
            min="0"
            max="1"
            step="0.01"
          />
          <p className="text-sm text-muted-foreground">
            Typical range: 0.05 (forest) to 0.95 (paved surfaces)
            {selectedSurfaceType && (
              <span className="block mt-1 text-blue-600">
                Selected: {selectedSurfaceType.name} (C = {selectedSurfaceType.coefficient})
              </span>
            )}
          </p>
        </div>

        <div className="p-3 bg-muted rounded-md">
          <p className="text-sm font-medium">Weighted Runoff Coefficient: {data.weightedRunoffCoefficient.toFixed(3)}</p>
          <p className="text-xs text-muted-foreground">
            For Week 1: Using single surface type coefficient
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

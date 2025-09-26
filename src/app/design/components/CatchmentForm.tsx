"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface CatchmentData {
  area: number; // m²
  surfaceType: string;
  runoffCoefficient: number;
  weightedRunoffCoefficient: number;
  averageSlope: number; // H, in m per 100m
  flowPathLength: number; // L, in meters
  timeOfConcentration: number; // t_o, in minutes
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
  const [averageSlope, setAverageSlope] = useState(data.averageSlope.toString());
  const [flowPathLength, setFlowPathLength] = useState(data.flowPathLength.toString());

  // Calculate time of concentration when inputs change
  useEffect(() => {
    const A = parseFloat(area) || 0;
    const H = parseFloat(averageSlope) || 0;
    const L = parseFloat(flowPathLength) || 0;

    let timeOfConcentration = 0;
    
    // Only calculate if all inputs are valid and positive
    if (A > 0 && H > 0 && L > 0) {
      // Formula: t_o = 0.14465 * L / (H^0.2 * A^0.1)
      timeOfConcentration = (0.14465 * L) / (Math.pow(H, 0.2) * Math.pow(A, 0.1));
    }

    const newData = {
      ...data,
      area: A,
      averageSlope: H,
      flowPathLength: L,
      timeOfConcentration
    };
    onChange(newData);
  }, [area, averageSlope, flowPathLength, data, onChange]);

  const handleAreaChange = (value: string) => {
    setArea(value);
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

  const handleAverageSlopeChange = (value: string) => {
    setAverageSlope(value);
  };

  const handleFlowPathLengthChange = (value: string) => {
    setFlowPathLength(value);
  };

  const selectedSurfaceType = SURFACE_TYPES.find(type => type.id === surfaceType);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Catchment Properties</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="area">Catchment Area (A) - m²</Label>
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

        {/* Time of Concentration Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="average-slope">Average Slope (H) - m per 100m</Label>
            <Input
              id="average-slope"
              type="number"
              value={averageSlope}
              onChange={(e) => handleAverageSlopeChange(e.target.value)}
              placeholder="5"
              min="0"
              step="0.1"
            />
            <p className="text-sm text-muted-foreground">
              Average slope of the catchment
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="flow-path-length">Flow Path Length (L) - meters</Label>
            <Input
              id="flow-path-length"
              type="number"
              value={flowPathLength}
              onChange={(e) => handleFlowPathLengthChange(e.target.value)}
              placeholder="200"
              min="0"
              step="0.1"
            />
            <p className="text-sm text-muted-foreground">
              Longest flow path to outlet
            </p>
          </div>
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

        {/* Time of Concentration Calculation */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-blue-900">
              Time of Concentration Calculation
            </h4>
            <div className="text-sm text-blue-800">
              <p className="mb-2">
                <strong>Formula:</strong> t<sub>o</sub> = 0.14465 × L / (H<sup>0.2</sup> × A<sup>0.1</sup>)
              </p>
              <div className="bg-white p-3 rounded border">
                <p className="text-lg font-bold text-blue-900">
                  Time of Concentration: {data.timeOfConcentration > 0 ? data.timeOfConcentration.toFixed(2) : "—"} minutes
                </p>
                {data.timeOfConcentration > 0 && (
                  <p className="text-sm text-blue-700 mt-1">
                    ({data.timeOfConcentration.toFixed(2)} min = {(data.timeOfConcentration / 60).toFixed(2)} hours)
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CatchmentData } from "../types";
import { 
  MapPin, 
  Trash2, 
  Edit3, 
  Calculator,
  AlertTriangle,
  CheckCircle
} from "lucide-react";

interface CatchmentManagerProps {
  catchments: CatchmentData[];
  onCatchmentUpdated: (index: number, catchment: CatchmentData) => void;
  onCatchmentRemoved: (index: number) => void;
  onBatchCalculate: () => void;
  isCalculating: boolean;
}

export default function CatchmentManager({
  catchments,
  onCatchmentUpdated,
  onCatchmentRemoved,
  onBatchCalculate,
  isCalculating
}: CatchmentManagerProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [allowManualEdit, setAllowManualEdit] = useState(false);

  // Surface type options
  const SURFACE_TYPES = [
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
  ];


  // Handle updating catchment properties
  const handleCatchmentUpdate = (index: number, field: keyof CatchmentData, value: any) => {
    const updatedCatchment = { ...catchments[index] };
    
    // Update the field
    (updatedCatchment as any)[field] = value;
    
    // If surface type changed, update runoff coefficient
    if (field === 'surfaceType') {
      const surfaceType = SURFACE_TYPES.find(s => s.id === value);
      updatedCatchment.runoffCoefficient = surfaceType?.coefficient || 0.9;
    }
    
    onCatchmentUpdated(index, updatedCatchment);
  };


  // Format area for display
  const formatArea = (area: number) => {
    if (area >= 10000) {
      return `${(area / 10000).toFixed(2)} ha`;
    } else {
      return `${area.toFixed(0)} m²`;
    }
  };

  // Check if catchment is ready for calculation
  const isCatchmentReady = (catchment: CatchmentData) => {
    return (
      catchment.area > 0 &&
      catchment.averageSlope > 0 &&
      catchment.flowPathLength > 0
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Catchment Manager
        </CardTitle>
      </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground mb-4">
            {catchments.length} catchment{catchments.length !== 1 ? 's' : ''} drawn
          </div>
          
          {catchments.length === 0 ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Draw catchments on the map to get started. Use the polygon tool to create catchment areas.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {/* Batch Calculate Button */}
              <Button 
                onClick={onBatchCalculate}
                disabled={isCalculating || catchments.length === 0}
                className="w-full"
                size="lg"
              >
                <Calculator className="h-4 w-4 mr-2" />
                {isCalculating ? "Calculating..." : "Run Batch Design"}
              </Button>
              
              {catchments.some(c => !isCatchmentReady(c)) && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Some catchments need additional parameters before calculation.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Catchment List */}
      {catchments.map((catchment, index) => (
        <Card key={catchment.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                {editingIndex === index ? (
                  <Input
                    value={catchment.name}
                    onChange={(e) => handleCatchmentUpdate(index, 'name', e.target.value)}
                    className="text-lg font-semibold"
                  />
                ) : (
                  <span>{catchment.name}</span>
                )}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingIndex(editingIndex === index ? null : index)}
                >
                  <Edit3 className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onCatchmentRemoved(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-xs text-muted-foreground">Area</Label>
                <p className="font-medium">{formatArea(catchment.area)}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Status</Label>
                <div className="flex items-center gap-1">
                  {isCatchmentReady(catchment) ? (
                    <>
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      <span className="text-green-600 text-xs">Ready</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-3 w-3 text-yellow-600" />
                      <span className="text-yellow-600 text-xs">Incomplete</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Editable Properties */}
            {editingIndex === index && (
              <div className="space-y-4 pt-4 border-t">
                {/* Catchment Properties */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Catchment Properties</h4>
                  
                  {/* Manual Edit Toggle */}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`manual-edit-${index}`}
                      checked={allowManualEdit}
                      onChange={(e) => setAllowManualEdit(e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor={`manual-edit-${index}`} className="text-xs">
                      Allow manual editing of slope and flow path length
                    </Label>
                  </div>
                  {!allowManualEdit && (
                    <p className="text-xs text-muted-foreground">
                      Values are automatically calculated from terrain data. Check the box to enable manual editing.
                    </p>
                  )}
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor={`slope-${index}`} className="text-xs">
                        Average Slope {!allowManualEdit && <span className="text-green-600">(Auto-calculated)</span>}
                      </Label>
                      <Input
                        id={`slope-${index}`}
                        type="number"
                        value={catchment.averageSlope}
                        onChange={(e) => handleCatchmentUpdate(index, 'averageSlope', parseFloat(e.target.value) || 0)}
                        className="h-8"
                        disabled={!allowManualEdit}
                        style={{ 
                          backgroundColor: !allowManualEdit ? '#f3f4f6' : 'white',
                          cursor: !allowManualEdit ? 'not-allowed' : 'text'
                        }}
                      />
                      <p className="text-xs text-muted-foreground">m per 100m</p>
                    </div>
                    
                    <div className="space-y-1">
                      <Label htmlFor={`length-${index}`} className="text-xs">
                        Flow Path Length {!allowManualEdit && <span className="text-green-600">(Auto-calculated)</span>}
                      </Label>
                      <Input
                        id={`length-${index}`}
                        type="number"
                        value={catchment.flowPathLength}
                        onChange={(e) => handleCatchmentUpdate(index, 'flowPathLength', parseFloat(e.target.value) || 0)}
                        className="h-8"
                        disabled={!allowManualEdit}
                        style={{ 
                          backgroundColor: !allowManualEdit ? '#f3f4f6' : 'white',
                          cursor: !allowManualEdit ? 'not-allowed' : 'text'
                        }}
                      />
                      <p className="text-xs text-muted-foreground">m</p>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <Label htmlFor={`surface-${index}`} className="text-xs">Surface Type</Label>
                    <Select 
                      value={catchment.surfaceType} 
                      onValueChange={(value) => handleCatchmentUpdate(index, 'surfaceType', value)}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SURFACE_TYPES.map((surface) => (
                          <SelectItem key={surface.id} value={surface.id}>
                            {surface.name} (C = {surface.coefficient})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Rainfall Properties */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Rainfall Properties</h4>
                  
                  <div className="space-y-1">
                    <Label htmlFor={`returnPeriod-${index}`} className="text-xs">Return Period</Label>
                    <Select 
                      value={catchment.returnPeriod.toString()} 
                      onValueChange={(value) => handleCatchmentUpdate(index, 'returnPeriod', parseInt(value))}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2">2 years</SelectItem>
                        <SelectItem value="5">5 years</SelectItem>
                        <SelectItem value="10">10 years</SelectItem>
                        <SelectItem value="20">20 years</SelectItem>
                        <SelectItem value="50">50 years</SelectItem>
                        <SelectItem value="100">100 years</SelectItem>
                        <SelectItem value="200">200 years</SelectItem>
                        <SelectItem value="500">500 years</SelectItem>
                        <SelectItem value="1000">1000 years</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

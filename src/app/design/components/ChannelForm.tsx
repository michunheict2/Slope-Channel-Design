"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface ChannelData {
  shape: string;
  bottomWidth: number; // b in meters (for trapezoidal)
  sideSlope: number; // z (H:V ratio) (for trapezoidal)
  channelDepth: number; // y in meters (for trapezoidal, user-specified depth)
  topWidth: number; // T in meters (for trapezoidal, auto-calculated)
  width: number; // W in meters (for U-shaped)
  radius: number; // R in meters (for U-shaped)
  flowDepth: number; // y in meters (for U-shaped, user-specified depth)
  longitudinalSlope: number; // S (m/m)
  manningN: number; // Manning's roughness coefficient
}

interface ChannelFormProps {
  data: ChannelData;
  onChange: (data: ChannelData) => void;
}

const CHANNEL_SHAPES = [
  { id: "trapezoid", name: "Trapezoidal" },
  { id: "u-shaped", name: "U-shaped" },
];

const U_CHANNEL_SIZES = [
  { size: 100, label: "100mm" },
  { size: 150, label: "150mm" },
  { size: 225, label: "225mm" },
  { size: 250, label: "250mm" },
  { size: 300, label: "300mm" },
  { size: 375, label: "375mm" },
  { size: 450, label: "450mm" },
  { size: 525, label: "525mm" },
  { size: 600, label: "600mm" },
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
  const [channelDepth, setChannelDepth] = useState(data.channelDepth?.toString() || "0.5");
  const [topWidth, setTopWidth] = useState(data.topWidth?.toString() || "0");
  const [width, setWidth] = useState(data.width?.toString() || "0.3");
  const [radius, setRadius] = useState(data.radius?.toString() || "0.15");
  const [flowDepth] = useState(data.flowDepth?.toString() || "0.1");
  const [flowDepthMM, setFlowDepthMM] = useState(((data.flowDepth || 0.1) * 1000).toString());
  const [longitudinalSlope, setLongitudinalSlope] = useState(data.longitudinalSlope.toString());
  const [gradientInputType, setGradientInputType] = useState<'ratio' | 'oneInX'>('ratio');
  const [gradientOneInX, setGradientOneInX] = useState((1 / data.longitudinalSlope).toString());
  const [manningN, setManningN] = useState(data.manningN.toString());

  // Calculate top width for trapezoidal channel: T = b + 2zy
  const calculateTopWidth = (bottomWidth: number, sideSlope: number, depth: number): number => {
    return bottomWidth + 2 * sideSlope * depth;
  };

  const handleBottomWidthChange = (value: string) => {
    setBottomWidth(value);
    const numValue = parseFloat(value) || 0;
    const currentDepth = parseFloat(channelDepth) || 0;
    const currentSideSlope = parseFloat(sideSlope) || 0;
    const calculatedTopWidth = calculateTopWidth(numValue, currentSideSlope, currentDepth);
    setTopWidth(calculatedTopWidth.toString());
    
    const newData = { 
      ...data, 
      bottomWidth: numValue,
      topWidth: calculatedTopWidth
    };
    onChange(newData);
  };

  const handleSideSlopeChange = (value: string) => {
    setSideSlope(value);
    const numValue = parseFloat(value) || 0;
    const currentBottomWidth = parseFloat(bottomWidth) || 0;
    const currentDepth = parseFloat(channelDepth) || 0;
    const calculatedTopWidth = calculateTopWidth(currentBottomWidth, numValue, currentDepth);
    setTopWidth(calculatedTopWidth.toString());
    
    const newData = { 
      ...data, 
      sideSlope: numValue,
      topWidth: calculatedTopWidth
    };
    onChange(newData);
  };

  const handleChannelDepthChange = (value: string) => {
    setChannelDepth(value);
    const numValue = parseFloat(value) || 0;
    const currentBottomWidth = parseFloat(bottomWidth) || 0;
    const currentSideSlope = parseFloat(sideSlope) || 0;
    const calculatedTopWidth = calculateTopWidth(currentBottomWidth, currentSideSlope, numValue);
    setTopWidth(calculatedTopWidth.toString());
    
    const newData = { 
      ...data, 
      channelDepth: numValue,
      topWidth: calculatedTopWidth
    };
    onChange(newData);
  };

  const handleLongitudinalSlopeChange = (value: string) => {
    setLongitudinalSlope(value);
    const numValue = parseFloat(value) || 0;
    const newData = { ...data, longitudinalSlope: numValue };
    onChange(newData);
  };

  const handleGradientOneInXChange = (value: string) => {
    setGradientOneInX(value);
    const numValue = parseFloat(value) || 0;
    const slopeValue = numValue > 0 ? 1 / numValue : 0;
    setLongitudinalSlope(slopeValue.toString());
    const newData = { ...data, longitudinalSlope: slopeValue };
    onChange(newData);
  };

  const handleGradientInputTypeChange = (type: 'ratio' | 'oneInX') => {
    setGradientInputType(type);
    if (type === 'oneInX') {
      const currentSlope = parseFloat(longitudinalSlope) || 0;
      const oneInXValue = currentSlope > 0 ? 1 / currentSlope : 0;
      setGradientOneInX(oneInXValue.toString());
    }
  };

  const handleManningNChange = (value: string) => {
    setManningN(value);
    const numValue = parseFloat(value) || 0.013;
    const newData = { ...data, manningN: numValue };
    onChange(newData);
  };


  const handleRadiusChange = (value: string) => {
    setRadius(value);
    const numValue = parseFloat(value) || 0;
    const newData = { ...data, radius: numValue };
    onChange(newData);
  };

  const handleUChannelSizeSelect = (value: string) => {
    const sizeMM = parseInt(value);
    const sizeM = sizeMM / 1000; // Convert mm to m
    setWidth(sizeM.toString());
    const radiusValue = sizeM / 2;
    setRadius(radiusValue.toString());
    const newData = { ...data, width: sizeM, radius: radiusValue };
    onChange(newData);
  };

  const handleFlowDepthChange = (value: string) => {
    setFlowDepthMM(value);
    const numValue = parseFloat(value) || 0;
    const flowDepthM = numValue / 1000; // Convert mm to m
    setFlowDepth(flowDepthM.toString());
    const newData = { ...data, flowDepth: flowDepthM };
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
          <Select value={data.shape} onValueChange={(value) => {
            const newData = { ...data, shape: value };
            // If switching to U-shaped, automatically set radius to half width
            if (value === "u-shaped") {
              newData.radius = newData.width / 2;
              setRadius(newData.radius.toString());
            }
            onChange(newData);
          }}>
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

        {/* Trapezoidal Channel Parameters */}
        {data.shape === "trapezoid" && (
          <>
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
              <Label htmlFor="channel-depth">Channel Depth (m)</Label>
              <Input
                id="channel-depth"
                type="number"
                value={channelDepth}
                onChange={(e) => handleChannelDepthChange(e.target.value)}
                placeholder="0.5"
                min="0"
                step="0.1"
              />
              <p className="text-sm text-muted-foreground">
                Total depth of the channel
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="top-width">Top Width (m)</Label>
              <Input
                id="top-width"
                type="number"
                value={topWidth}
                readOnly
                className="bg-gray-50"
              />
              <p className="text-sm text-muted-foreground">
                Automatically calculated: T = b + 2zy
              </p>
              <p className="text-xs text-blue-600">
                Formula: Top Width = Bottom Width + (2 × Side Slope × Depth)
              </p>
            </div>
          </>
        )}

        {/* U-shaped Channel Parameters */}
        {data.shape === "u-shaped" && (
          <>
            <div className="space-y-2">
              <Label htmlFor="u-channel-size">U-Channel Size</Label>
              <Select 
                value={(parseFloat(width) * 1000).toString()} 
                onValueChange={handleUChannelSizeSelect}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select U-channel size" />
                </SelectTrigger>
                <SelectContent>
                  {U_CHANNEL_SIZES.map((size) => (
                    <SelectItem key={size.size} value={size.size.toString()}>
                      {size.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Standard U-channel sizes (TGN 43 compliant: ≤ 600mm)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="radius">Bottom Radius (m)</Label>
              <Input
                id="radius"
                type="number"
                value={radius}
                onChange={(e) => handleRadiusChange(e.target.value)}
                placeholder="0.3"
                min="0"
                step="0.01"
                readOnly
                className="bg-gray-50"
              />
              <p className="text-sm text-muted-foreground">
                Automatically set to half the width (R = W/2)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="flow-depth">Flow Depth (mm)</Label>
              <Input
                id="flow-depth"
                type="number"
                value={flowDepthMM}
                onChange={(e) => handleFlowDepthChange(e.target.value)}
                placeholder="100"
                min="0"
                max="1000"
                step="1"
              />
              <p className="text-sm text-muted-foreground">
                Water depth in the channel (user-specified)
              </p>
            </div>
          </>
        )}

        <div className="space-y-2">
          <Label htmlFor="longitudinal-slope">Channel Gradient</Label>
          
          {/* Input Type Toggle */}
          <div className="flex gap-4 mb-2">
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="gradientType"
                value="ratio"
                checked={gradientInputType === 'ratio'}
                onChange={() => handleGradientInputTypeChange('ratio')}
                className="rounded"
              />
              <span className="text-sm">Ratio (m/m)</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="gradientType"
                value="oneInX"
                checked={gradientInputType === 'oneInX'}
                onChange={() => handleGradientInputTypeChange('oneInX')}
                className="rounded"
              />
              <span className="text-sm">1 in X</span>
            </label>
          </div>

          {/* Input Field */}
          {gradientInputType === 'ratio' ? (
            <Input
              id="longitudinal-slope"
              type="number"
              value={longitudinalSlope}
              onChange={(e) => handleLongitudinalSlopeChange(e.target.value)}
              placeholder="0.01"
              min="0"
              step="0.001"
            />
          ) : (
            <div className="flex items-center space-x-2">
              <span className="text-sm">1 in</span>
              <Input
                type="number"
                value={gradientOneInX}
                onChange={(e) => handleGradientOneInXChange(e.target.value)}
                placeholder="100"
                min="0"
                step="0.1"
                className="w-24"
              />
            </div>
          )}
          
          <p className="text-sm text-muted-foreground">
            {gradientInputType === 'ratio' 
              ? 'Channel slope in the flow direction (e.g., 0.01 = 1%)'
              : 'Channel gradient as 1 in X (e.g., 1 in 100 = 1% gradient)'
            }
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

      </CardContent>
    </Card>
  );
}

"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ChannelAlignment, CatchmentData } from "../types";
import { 
  Trash2, 
  Edit3, 
  Ruler
} from "lucide-react";

interface ChannelManagerProps {
  channels: ChannelAlignment[];
  catchments: CatchmentData[];
  onChannelUpdated: (index: number, channel: ChannelAlignment) => void;
  onChannelRemoved: (index: number) => void;
}

export default function ChannelManager({
  channels,
  catchments,
  onChannelUpdated,
  onChannelRemoved
}: ChannelManagerProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Channel material options
  const CHANNEL_MATERIALS = [
    { id: "concrete", name: "Concrete", manningN: 0.013 },
    { id: "asphalt", name: "Asphalt", manningN: 0.016 },
    { id: "brick", name: "Brick", manningN: 0.015 },
    { id: "stone", name: "Stone", manningN: 0.025 },
    { id: "earth", name: "Earth", manningN: 0.025 },
    { id: "grass", name: "Grass", manningN: 0.035 },
    { id: "gravel", name: "Gravel", manningN: 0.030 },
    { id: "riprap", name: "Riprap", manningN: 0.040 },
  ];

  // Handle updating channel properties
  const handleChannelUpdate = (index: number, field: keyof ChannelAlignment, value: unknown) => {
    const updatedChannel = { ...channels[index] };
    (updatedChannel as Record<string, unknown>)[field] = value;
    onChannelUpdated(index, updatedChannel);
  };


  // Format length for display
  const formatLength = (length: number) => {
    if (length >= 1000) {
      return `${(length / 1000).toFixed(2)} km`;
    } else {
      return `${length.toFixed(0)} m`;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ruler className="h-5 w-5" />
            Channel Alignments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground mb-4">
            {channels.length} channel alignment{channels.length !== 1 ? 's' : ''} drawn
          </div>
          
          {channels.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              <Ruler className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No channel alignments drawn yet.</p>
              <p className="text-xs">Use the &quot;Draw Channel&quot; tool on the map to create channel alignments.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {channels.map((channel, index) => (
                <Card key={channel.id} className="border-l-4 border-l-orange-400">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      {editingIndex === index ? (
                        <Input
                          value={channel.name}
                          onChange={(e) => handleChannelUpdate(index, 'name', e.target.value)}
                          className="text-sm font-semibold"
                        />
                      ) : (
                        <h4 className="font-semibold text-sm">{channel.name}</h4>
                      )}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingIndex(editingIndex === index ? null : index)}
                        >
                          <Edit3 className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onChannelRemoved(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <Label className="text-xs text-muted-foreground">Length</Label>
                        <p className="font-medium">{formatLength(channel.length)}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Linked Catchment</Label>
                        <p className="font-medium">
                          {channel.linkedCatchmentId 
                            ? catchments.find(c => c.id === channel.linkedCatchmentId)?.name || "Unknown"
                            : "Not linked"
                          }
                        </p>
                      </div>
                    </div>
                    
                    {editingIndex === index && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor={`linked-catchment-${index}`} className="text-xs">Linked Catchment</Label>
                            <Select 
                              value={channel.linkedCatchmentId || "none"} 
                              onValueChange={(value) => handleChannelUpdate(index, 'linkedCatchmentId', value === "none" ? undefined : value)}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue placeholder="Select a catchment..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">No catchment linked</SelectItem>
                                {catchments.map((catchment) => (
                                  <SelectItem key={catchment.id} value={catchment.id}>
                                    {catchment.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                              Select which catchment this channel serves for drainage calculations
                            </p>
                          </div>

                          <div>
                            <Label htmlFor={`channel-name-${index}`} className="text-xs">Channel Name</Label>
                            <Input
                              id={`channel-name-${index}`}
                              value={channel.name}
                              onChange={(e) => handleChannelUpdate(index, 'name', e.target.value)}
                              className="h-8"
                            />
                          </div>

                          {/* Channel Properties */}
                          <div className="space-y-3">
                            <h4 className="font-medium text-sm">Channel Properties</h4>
                            
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <Label htmlFor={`shape-${index}`} className="text-xs">Channel Shape</Label>
                                <Select 
                                  value={channel.channelShape} 
                                  onValueChange={(value: "trapezoidal" | "u-channel") => handleChannelUpdate(index, 'channelShape', value)}
                                >
                                  <SelectTrigger className="h-8">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="trapezoidal">Trapezoidal</SelectItem>
                                    <SelectItem value="u-channel">U-Channel</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <div className="space-y-1">
                                <Label htmlFor={`gradient-${index}`} className="text-xs">Channel Gradient</Label>
                                <Input
                                  id={`gradient-${index}`}
                                  type="number"
                                  step="0.001"
                                  value={channel.channelGradient}
                                  onChange={(e) => handleChannelUpdate(index, 'channelGradient', parseFloat(e.target.value) || 0)}
                                  className="h-8"
                                  disabled={!channel.manualGradientOverride}
                                />
                                <p className="text-xs text-muted-foreground">
                                  {channel.manualGradientOverride ? "m/m (manual)" : "m/m (auto-calculated)"}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`manual-gradient-${index}`}
                                checked={channel.manualGradientOverride}
                                onCheckedChange={(checked) => handleChannelUpdate(index, 'manualGradientOverride', checked)}
                              />
                              <Label htmlFor={`manual-gradient-${index}`} className="text-xs">
                                Manual gradient input
                              </Label>
                            </div>
                            
                            <div className="space-y-1">
                              <Label htmlFor={`material-${index}`} className="text-xs">Channel Material</Label>
                              <Select 
                                value={channel.channelMaterial} 
                                onValueChange={(value) => handleChannelUpdate(index, 'channelMaterial', value)}
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {CHANNEL_MATERIALS.map((material) => (
                                    <SelectItem key={material.id} value={material.id}>
                                      {material.name} (n = {material.manningN})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          {/* Upstream Channels */}
                          <div className="space-y-3">
                            <h4 className="font-medium text-sm">Upstream Channels</h4>
                            <p className="text-xs text-muted-foreground">
                              Select upstream channels. Time of concentration will be calculated automatically.
                            </p>
                            
                            {/* Available channels for selection */}
                            <div className="space-y-2">
                              <Label className="text-xs font-medium">Select Upstream Channels:</Label>
                              {channels
                                .filter(c => c.id !== channel.id) // Exclude current channel
                                .map((availableChannel) => {
                                  const isSelected = channel.upstreamChannels.some(uc => uc.channelId === availableChannel.id);
                                  
                                  return (
                                    <div key={availableChannel.id} className="flex items-center space-x-2">
                                      <Checkbox
                                        id={`upstream-${index}-${availableChannel.id}`}
                                        checked={isSelected}
                                        onCheckedChange={(checked) => {
                                          if (checked) {
                                            // Add upstream channel
                                            const newUpstreamChannel = {
                                              channelId: availableChannel.id,
                                              channelNo: availableChannel.name
                                            };
                                            const updatedChannel = {
                                              ...channel,
                                              upstreamChannels: [...channel.upstreamChannels, newUpstreamChannel]
                                            };
                                            onChannelUpdated(index, updatedChannel);
                                          } else {
                                            // Remove upstream channel
                                            const updatedChannel = {
                                              ...channel,
                                              upstreamChannels: channel.upstreamChannels.filter(uc => uc.channelId !== availableChannel.id)
                                            };
                                            onChannelUpdated(index, updatedChannel);
                                          }
                                        }}
                                      />
                                      <Label htmlFor={`upstream-${index}-${availableChannel.id}`} className="text-xs">
                                        {availableChannel.name}
                                      </Label>
                                    </div>
                                  );
                                })}
                              
                              {channels.filter(c => c.id !== channel.id).length === 0 && (
                                <p className="text-xs text-muted-foreground italic">
                                  No other channels available for selection.
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

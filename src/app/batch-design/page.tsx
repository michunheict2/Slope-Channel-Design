"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import MapboxCatchmentDrawer from "./components/MapboxCatchmentDrawer";
import CatchmentManager from "./components/CatchmentManager";
import ChannelManager from "./components/ChannelManager";
import BatchResults from "./components/BatchResults";
import ExampleUsage from "./components/ExampleUsage";
import { CatchmentData, BatchCalculationResult, ChannelAlignment } from "./types";

export default function BatchDesignPage() {
  // State for managing catchments drawn on the map
  const [catchments, setCatchments] = useState<CatchmentData[]>([]);
  const [channels, setChannels] = useState<ChannelAlignment[]>([]);
  const [batchResults, setBatchResults] = useState<BatchCalculationResult[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);

  // Handle adding a new catchment from the map
  const handleCatchmentAdded = (catchment: CatchmentData) => {
    setCatchments(prev => [...prev, catchment]);
  };

  // Handle adding a new channel from the map
  const handleChannelAdded = (channel: ChannelAlignment) => {
    setChannels(prev => [...prev, channel]);
  };

  // Handle updating an existing catchment
  const handleCatchmentUpdated = (index: number, updatedCatchment: CatchmentData) => {
    setCatchments(prev => prev.map((catchment, i) => 
      i === index ? updatedCatchment : catchment
    ));
  };

  // Handle removing a catchment
  const handleCatchmentRemoved = (index: number) => {
    setCatchments(prev => prev.filter((_, i) => i !== index));
  };

  // Handle updating an existing channel
  const handleChannelUpdated = (index: number, updatedChannel: ChannelAlignment) => {
    setChannels(prev => prev.map((channel, i) => 
      i === index ? updatedChannel : channel
    ));
  };

  // Handle removing a channel
  const handleChannelRemoved = (index: number) => {
    setChannels(prev => prev.filter((_, i) => i !== index));
  };

  // Handle batch calculation
  const handleBatchCalculate = async () => {
    if (catchments.length === 0) {
      alert("Please draw at least one catchment on the map first.");
      return;
    }

    setIsCalculating(true);
    try {
      // Import the batch processing function
      const { processBatchCatchments } = await import("./utils/batchProcessor");
      const results = await processBatchCatchments(catchments, channels);
      setBatchResults(results);
    } catch (error) {
      console.error("Batch calculation error:", error);
      alert("Error processing batch calculations. Please try again.");
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <Link href="/">
            <Button variant="outline" className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Home
            </Button>
          </Link>
        </div>
        <h1 className="text-3xl font-bold mb-2">Batch Catchment Design</h1>
        <p className="text-muted-foreground">
          Draw catchments on the 3D map and process multiple drainage designs in batch.
        </p>
      </div>

      {/* Example Usage Instructions */}
      <div className="mb-6">
        <ExampleUsage />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Section - Takes up 2/3 of the width */}
        <div className="lg:col-span-2">
          <Card className="h-[600px]">
            <CardHeader>
              <CardTitle>Interactive 3D Map</CardTitle>
            </CardHeader>
            <CardContent className="p-0 h-[calc(100%-4rem)]">
              <MapboxCatchmentDrawer
                onCatchmentAdded={handleCatchmentAdded}
                onChannelAdded={handleChannelAdded}
                catchments={catchments}
                channels={channels}
                showVisualization={true}
                onCatchmentUpdated={(catchment) => {
                  // Find the index of the updated catchment and call the handler
                  const index = catchments.findIndex(c => c.id === catchment.id);
                  if (index !== -1) {
                    handleCatchmentUpdated(index, catchment);
                  }
                }}
                onCatchmentRemoved={(catchmentId) => {
                  // Find the index of the catchment to remove
                  const index = catchments.findIndex(c => c.id === catchmentId);
                  if (index !== -1) {
                    handleCatchmentRemoved(index);
                  }
                }}
                onChannelRemoved={(channelId) => {
                  // Find the index of the channel to remove
                  const index = channels.findIndex(c => c.id === channelId);
                  if (index !== -1) {
                    handleChannelRemoved(index);
                  }
                }}
              />
            </CardContent>
          </Card>
          
          {/* Drawing Instructions */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-lg">Drawing Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-sm mb-3">How to Draw:</h4>
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600">🖱️</span>
                      <span><strong>Select/Move:</strong> Click to select and move features</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600">📐</span>
                      <span><strong>Draw Catchment:</strong> Click to create vertices, double-click to finish</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-600">📏</span>
                      <span><strong>Draw Channel:</strong> Click to create line points, double-click to finish</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-600">📐</span>
                      <span><strong>Measure Line:</strong> Click two points to measure distance, elevation difference, and gradient</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600">⚡</span>
                      <span><strong>Auto-calculated:</strong> Slope and flow path length from highest to lowest elevation points</span>
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold text-sm mb-3">Visualization Lines:</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-1 bg-red-500 rounded" style={{background: 'repeating-linear-gradient(to right, #ff6b6b 0px, #ff6b6b 4px, transparent 4px, transparent 8px)'}}></div>
                      <span className="text-sm">Slope Line (Highest → Lowest)</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-1 bg-teal-500 rounded" style={{background: 'repeating-linear-gradient(to right, #4ecdc4 0px, #4ecdc4 2px, transparent 2px, transparent 4px)'}}></div>
                      <span className="text-sm">Flow Path Line</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>💡 Tip:</strong> Use the Tools button (🛠️) in the top-left corner to access drawing tools, clear options, and visualization controls.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Catchment Manager - Takes up 1/3 of the width */}
        <div className="lg:col-span-1 space-y-4">
          <CatchmentManager
            catchments={catchments}
            onCatchmentUpdated={handleCatchmentUpdated}
            onCatchmentRemoved={handleCatchmentRemoved}
            onBatchCalculate={handleBatchCalculate}
            isCalculating={isCalculating}
          />
          
          <ChannelManager
            channels={channels}
            catchments={catchments}
            onChannelUpdated={handleChannelUpdated}
            onChannelRemoved={handleChannelRemoved}
          />
        </div>
      </div>

      {/* Batch Results Section */}
      {batchResults.length > 0 && (
        <div className="mt-8">
          <BatchResults results={batchResults} channels={channels} />
        </div>
      )}
    </div>
  );
}

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle } from "lucide-react";
import { BatchProcessingSummary } from "../../utils/batchProcessor";

interface BatchResultsSummaryProps {
  summary: BatchProcessingSummary;
}

export default function BatchResultsSummary({ summary }: BatchResultsSummaryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Channel Design Results Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3 font-medium">Channel ID</th>
                <th className="text-left p-3 font-medium">Peak Flow</th>
                <th className="text-left p-3 font-medium">Channel Size</th>
                <th className="text-left p-3 font-medium">Velocity</th>
                <th className="text-left p-3 font-medium">Design Status</th>
                <th className="text-left p-3 font-medium">Time of Concentration</th>
                <th className="text-left p-3 font-medium">Channel Capacity</th>
              </tr>
            </thead>
            <tbody>
              {summary.results.map((result, index) => (
                <tr key={index} className="border-t hover:bg-gray-50">
                  <td className="p-3 font-mono font-medium">{result.channelId}</td>
                  <td className="p-3">
                    <div className="font-medium">{result.peakFlow.toFixed(3)} m³/s</div>
                    <div className="text-xs text-muted-foreground">
                      {(result.peakFlow * 1000).toFixed(1)} L/s
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="font-medium">{result.selectedChannelSize}</div>
                    <div className="text-xs text-muted-foreground">
                      {result.selectedChannelWidth.toFixed(3)} m
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="font-medium">{result.velocity.toFixed(2)} m/s</div>
                    {result.velocityWarning && (
                      <div className="text-xs text-orange-600 mt-1">
                        ⚠️ High velocity
                      </div>
                    )}
                  </td>
                  <td className="p-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      result.status === "OK" 
                        ? "bg-green-100 text-green-800" 
                        : "bg-red-100 text-red-800"
                    }`}>
                      {result.status === "OK" ? (
                        <CheckCircle className="h-3 w-3" />
                      ) : (
                        <XCircle className="h-3 w-3" />
                      )}
                      {result.status}
                    </span>
                    {result.error && (
                      <div className="text-xs text-red-600 mt-1 max-w-xs">
                        {result.error}
                      </div>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="font-medium">{result.timeOfConcentration.toFixed(1)} min</div>
                    <div className="text-xs text-muted-foreground">
                      Effective TC
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="font-medium">{result.calculatedFlow.toFixed(3)} m³/s</div>
                    <div className="text-xs text-muted-foreground">
                      {((result.calculatedFlow / result.peakFlow) * 100).toFixed(1)}% of required
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary Statistics */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Flow Analysis</h4>
            <div className="space-y-1 text-sm">
              <p>Average Peak Flow: {(summary.results.reduce((sum, r) => sum + r.peakFlow, 0) / summary.results.length).toFixed(3)} m³/s</p>
              <p>Max Peak Flow: {Math.max(...summary.results.map(r => r.peakFlow)).toFixed(3)} m³/s</p>
              <p>Min Peak Flow: {Math.min(...summary.results.map(r => r.peakFlow)).toFixed(3)} m³/s</p>
            </div>
          </div>

          <div className="p-4 bg-green-50 rounded-lg">
            <h4 className="font-semibold text-green-900 mb-2">Velocity Analysis</h4>
            <div className="space-y-1 text-sm">
              <p>Average Velocity: {(summary.results.reduce((sum, r) => sum + r.velocity, 0) / summary.results.length).toFixed(2)} m/s</p>
              <p>Max Velocity: {Math.max(...summary.results.map(r => r.velocity)).toFixed(2)} m/s</p>
              <p>Min Velocity: {Math.min(...summary.results.map(r => r.velocity)).toFixed(2)} m/s</p>
            </div>
          </div>

          <div className="p-4 bg-purple-50 rounded-lg">
            <h4 className="font-semibold text-purple-900 mb-2">Design Status</h4>
            <div className="space-y-1 text-sm">
              <p>Successful Designs: {summary.successfulChannels}</p>
              <p>Failed Designs: {summary.failedChannels}</p>
              <p>Success Rate: {((summary.successfulChannels / summary.totalChannels) * 100).toFixed(1)}%</p>
            </div>
          </div>
        </div>

        {/* Channel Size Distribution */}
        <div className="mt-6">
          <h4 className="font-semibold mb-3">Channel Size Distribution</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {Object.entries(
              summary.results.reduce((acc, result) => {
                acc[result.selectedChannelSize] = (acc[result.selectedChannelSize] || 0) + 1;
                return acc;
              }, {} as Record<string, number>)
            )
              .sort(([,a], [,b]) => b - a)
              .map(([size, count]) => (
                <div key={size} className="p-3 bg-gray-50 rounded-lg text-center">
                  <div className="font-medium">{size}</div>
                  <div className="text-sm text-muted-foreground">{count} channels</div>
                </div>
              ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

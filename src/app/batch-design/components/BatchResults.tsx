"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BatchCalculationResult, ChannelAlignment } from "../types";
import BatchDetailedCalculations from "./BatchDetailedCalculations";
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  FileSpreadsheet,
  BarChart3,
  Calculator
} from "lucide-react";

interface BatchResultsProps {
  results: BatchCalculationResult[];
  channels?: ChannelAlignment[];
}

export default function BatchResults({ results, channels = [] }: BatchResultsProps) {
  const [exportFormat, setExportFormat] = useState<'csv' | 'excel'>('csv');
  const [showDetailedCalculations, setShowDetailedCalculations] = useState(false);

  // Calculate summary statistics
  const summary = {
    total: results.length,
    successful: results.filter(r => r.status === "OK").length,
    failed: results.filter(r => r.status === "Not OK").length,
    successRate: results.length > 0 ? (results.filter(r => r.status === "OK").length / results.length) * 100 : 0
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = [
      'Catchment ID',
      'Catchment Name',
      'Time of Concentration (min)',
      'Peak Flow (m³/s)',
      'Peak Flow (L/s)',
      'Required Width (m)',
      'Selected Width (m)',
      'Selected Size',
      'Calculated Flow (m³/s)',
      'Velocity (m/s)',
      'Design Status',
      'Error/Warning',
      'Catchment TC (min)',
      'Upstream TC (min)',
      'Effective TC (min)',
      'Rainfall Intensity (mm/hr)',
      'Runoff Coefficient'
    ];

    const csvContent = [
      headers.join(','),
      ...results.map(result => [
        result.catchmentId,
        `"${result.catchmentName}"`,
        result.timeOfConcentration.toFixed(1),
        result.peakFlow.toFixed(3),
        (result.peakFlow * 1000).toFixed(1),
        result.requiredChannelWidth.toFixed(3),
        result.selectedChannelWidth.toFixed(3),
        `"${result.selectedChannelSize}"`,
        result.calculatedFlow.toFixed(3),
        result.velocity.toFixed(2),
        result.status,
        `"${result.error || result.velocityWarning || ''}"`,
        result.catchmentTC.toFixed(1),
        result.upstreamTC.toFixed(1),
        result.effectiveTC.toFixed(1),
        result.rainfallIntensity.toFixed(1),
        result.runoffCoefficient.toFixed(2)
      ].join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `batch_design_results_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to Excel (using existing utility)
  const exportToExcel = async () => {
    try {
      const { exportBatchResultsToExcel } = await import("../../auto-sizing/utils/excelExport");
      
      // Convert our results to the format expected by the Excel export function
      const excelResults = results.map(result => {
        // Find the linked channel to get the actual channel name
        const linkedChannel = channels.find(channel => channel.linkedCatchmentId === result.catchmentId);
        const channelName = linkedChannel ? linkedChannel.name : (result.channelShape ? `${result.channelShape} channel` : 'Channel');
        
        return {
          channelId: result.catchmentId,
          catchmentName: result.catchmentName,
          channelName: channelName,
          timeOfConcentration: result.timeOfConcentration,
          peakFlow: result.peakFlow,
          requiredChannelWidth: result.requiredChannelWidth,
          selectedChannelWidth: result.selectedChannelWidth,
          selectedChannelSize: result.selectedChannelSize,
          calculatedFlow: result.calculatedFlow,
          velocity: result.velocity,
          status: result.status,
          error: result.error,
          velocityWarning: result.velocityWarning,
          catchmentTC: result.catchmentTC,
          upstreamTC: result.upstreamTC,
          effectiveTC: result.effectiveTC,
          rainfallIntensity: result.rainfallIntensity,
          runoffCoefficient: result.runoffCoefficient,
          processed: result.processed,
          processingError: result.processingError
        };
      });

      const summary = {
        totalChannels: results.length,
        processedChannels: results.length,
        successfulChannels: results.filter(r => r.status === "OK").length,
        failedChannels: results.filter(r => r.status === "Not OK").length,
        results: excelResults,
        errors: results.filter(r => r.error).map(r => r.error!),
        processingTime: 0
      };

      exportBatchResultsToExcel(summary, `batch_catchment_design_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      alert("Error exporting to Excel. Please try CSV export instead.");
    }
  };

  const handleExport = () => {
    if (exportFormat === 'csv') {
      exportToCSV();
    } else {
      exportToExcel();
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Batch Design Results Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-800">{summary.total}</p>
              <p className="text-sm text-blue-600">Total Catchments</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-800">{summary.successful}</p>
              <p className="text-sm text-green-600">Successful Designs</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-2xl font-bold text-red-800">{summary.failed}</p>
              <p className="text-sm text-red-600">Failed Designs</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-800">{summary.successRate.toFixed(1)}%</p>
              <p className="text-sm text-purple-600">Success Rate</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            {/* Detailed Calculations Toggle */}
            <Button 
              onClick={() => setShowDetailedCalculations(!showDetailedCalculations)}
              variant={showDetailedCalculations ? "default" : "outline"}
              className="flex items-center gap-2"
            >
              <Calculator className="h-4 w-4" />
              {showDetailedCalculations ? "Hide" : "Show"} Detailed Calculations
            </Button>
            
            {/* Export Options */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Export:</span>
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  id="csv-export"
                  name="export-format"
                  value="csv"
                  checked={exportFormat === 'csv'}
                  onChange={(e) => setExportFormat(e.target.value as 'csv')}
                />
                <label htmlFor="csv-export" className="text-sm">CSV</label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  id="excel-export"
                  name="export-format"
                  value="excel"
                  checked={exportFormat === 'excel'}
                  onChange={(e) => setExportFormat(e.target.value as 'excel')}
                />
                <label htmlFor="excel-export" className="text-sm">Excel</label>
              </div>
              <Button onClick={handleExport} size="sm" className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4" />
                Export {exportFormat.toUpperCase()}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Catchment</th>
                  <th className="text-left p-2">Peak Flow</th>
                  <th className="text-left p-2">Channel Size</th>
                  <th className="text-left p-2">Velocity</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Issues</th>
                </tr>
              </thead>
              <tbody>
                {results.map((result) => (
                  <tr key={result.catchmentId} className="border-b hover:bg-gray-50">
                    <td className="p-2">
                      <div>
                        <p className="font-medium">{result.catchmentName}</p>
                        <p className="text-xs text-muted-foreground">{result.catchmentId}</p>
                      </div>
                    </td>
                    <td className="p-2">
                      <div>
                        <p className="font-medium">{result.peakFlow.toFixed(3)} m³/s</p>
                        <p className="text-xs text-muted-foreground">{(result.peakFlow * 1000).toFixed(1)} L/s</p>
                      </div>
                    </td>
                    <td className="p-2">
                      <div>
                        <p className="font-medium">{result.selectedChannelSize}</p>
                        <p className="text-xs text-muted-foreground">{result.selectedChannelWidth.toFixed(3)} m</p>
                      </div>
                    </td>
                    <td className="p-2">
                      <div>
                        <p className="font-medium">{result.velocity.toFixed(2)} m/s</p>
                        {result.velocityWarning && (
                          <p className="text-xs text-orange-600">⚠️ High velocity</p>
                        )}
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="flex items-center gap-1">
                        {result.status === "OK" ? (
                          <>
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-green-600 text-sm">OK</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-4 w-4 text-red-600" />
                            <span className="text-red-600 text-sm">Not OK</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="p-2">
                      {result.error && (
                        <p className="text-xs text-red-600">{result.error}</p>
                      )}
                      {result.velocityWarning && !result.error && (
                        <p className="text-xs text-orange-600">{result.velocityWarning}</p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Warnings and Errors */}
      {results.some(r => r.status === "Not OK") && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-medium mb-2">Design Issues Found:</div>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {results
                .filter(r => r.status === "Not OK")
                .map((result, index) => (
                  <li key={index}>
                    <strong>{result.catchmentName}:</strong> {result.error}
                  </li>
                ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {results.some(r => r.velocityWarning) && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-medium mb-2">Velocity Warnings:</div>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {results
                .filter(r => r.velocityWarning)
                .map((result, index) => (
                  <li key={index}>
                    <strong>{result.catchmentName}:</strong> {result.velocityWarning}
                  </li>
                ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Detailed Calculations */}
      {showDetailedCalculations && (
        <div className="mt-6">
          <BatchDetailedCalculations results={results} channels={channels} />
        </div>
      )}
    </div>
  );
}

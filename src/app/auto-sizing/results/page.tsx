"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  AlertTriangle,
  ArrowLeft
} from "lucide-react";
import { Download } from "lucide-react";
import { BatchProcessingSummary } from "../utils/batchProcessor";
import BatchResultsSummary from "./components/BatchResultsSummary";
import BatchDetailedCalculations from "./components/BatchDetailedCalculations";
import BatchPDFExport from "./components/BatchPDFExport";

export default function BatchResultsPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<BatchProcessingSummary | null>(null);
  const [channelData, setChannelData] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get the batch processing results from sessionStorage
    const resultsData = sessionStorage.getItem('batchProcessingResults');
    const inputData = sessionStorage.getItem('batchChannelData');
    
    if (resultsData && inputData) {
      try {
        const parsedResults = JSON.parse(resultsData);
        const parsedInputData = JSON.parse(inputData);
        setSummary(parsedResults);
        setChannelData(parsedInputData);
      } catch {
        setError("Error loading batch processing results. Please try processing again.");
      }
    } else {
      setError("No batch processing results found. Please go back and process your channels.");
    }
    
    setLoading(false);
  }, []);

  const handleGoBack = () => {
    router.push('/auto-sizing');
  };

  const handleExportResults = () => {
    if (!summary) return;

    try {
      // Import the export function dynamically
      import('../utils/excelExport').then(({ exportBatchResultsWithInputs }) => {
        exportBatchResultsWithInputs(summary, channelData);
      });
    } catch (error) {
      console.error("Error exporting results:", error);
      alert("Error exporting results. Please try again.");
    }
  };

  const handleExportSummary = () => {
    if (!summary) return;

    try {
      // Import the export function dynamically
      import('../utils/excelExport').then(({ exportBatchResultsToExcel }) => {
        exportBatchResultsToExcel(summary);
      });
    } catch (error) {
      console.error("Error exporting summary:", error);
      alert("Error exporting summary. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading batch processing results...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <Link href="/auto-sizing">
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Auto Sizing
            </Button>
          </Link>
        </div>
        
        <Card>
          <CardContent className="pt-6">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {error || "No batch processing results found. Please go back and process your channels."}
              </AlertDescription>
            </Alert>
            
            <div className="mt-4 flex gap-4">
              <Button onClick={handleGoBack} className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Go Back to Auto Sizing
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <Button 
            onClick={handleGoBack} 
            variant="outline" 
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Auto Sizing
          </Button>
        </div>
        <h1 className="text-3xl font-bold mb-2">Batch Channel Design Results</h1>
        <p className="text-muted-foreground">
          Review the results of your batch channel design processing.
        </p>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-800">{summary.totalChannels}</div>
            <div className="text-sm text-blue-600">Total Channels</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-800">{summary.successfulChannels}</div>
            <div className="text-sm text-green-600">Successful</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-800">{summary.failedChannels}</div>
            <div className="text-sm text-red-600">Failed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-800">
              {summary.totalChannels > 0 ? Math.round((summary.successfulChannels / summary.totalChannels) * 100) : 0}%
            </div>
            <div className="text-sm text-gray-600">Success Rate</div>
          </CardContent>
        </Card>
      </div>

      {/* Processing Time */}
      <Card className="mb-6">
        <CardContent className="p-4 text-center">
          <div className="text-sm text-muted-foreground">Processing Time</div>
          <div className="text-lg font-medium">
            {(summary.processingTime / 1000).toFixed(2)} seconds
          </div>
        </CardContent>
      </Card>

      {/* Export Actions */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Export Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button onClick={handleExportResults} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export Complete Results to Excel
            </Button>
            <Button onClick={handleExportSummary} variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export Summary Only
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary Table */}
      <BatchResultsSummary summary={summary} />

      {/* Detailed Calculations */}
      {summary.results.length > 0 && (
        <div className="mt-8">
          <BatchDetailedCalculations 
            summary={summary} 
            channelData={channelData}
          />
        </div>
      )}

      {/* PDF Export */}
      {summary.results.length > 0 && (
        <div className="mt-8">
          <BatchPDFExport 
            summary={summary} 
            channelData={channelData}
          />
        </div>
      )}

      {/* Errors Display */}
      {summary.errors.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-red-600">Processing Errors</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-medium mb-2">The following errors occurred during processing:</div>
                <ul className="list-disc list-inside space-y-1">
                  {summary.errors.map((error, index) => (
                    <li key={index} className="text-sm">{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

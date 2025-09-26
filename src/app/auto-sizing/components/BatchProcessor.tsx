"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  generateExcelTemplate, 
  parseExcelFile, 
  validateChannelData, 
  ExcelChannelData 
} from "../utils/excelTemplate";
import { 
  processBatchChannels, 
  BatchProcessingSummary
} from "../utils/batchProcessor";
import { useIDF } from "../../design/hooks/useIDF";
import { 
  CheckCircle, 
  Upload, 
  FileSpreadsheet, 
  AlertTriangle,
  Clock,
  Play
} from "lucide-react";
import { Download } from "lucide-react";

interface BatchProcessorProps {
  className?: string;
}

export default function BatchProcessor({ className }: BatchProcessorProps) {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [summary, setSummary] = useState<BatchProcessingSummary | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [channelData, setChannelData] = useState<ExcelChannelData[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load IDF constants
  const { constants: idfConstants, loading: idfLoading, calculate: calculateIDF } = useIDF();

  // Handle template download
  const handleDownloadTemplate = () => {
    try {
      generateExcelTemplate();
    } catch (error) {
      console.error("Error generating template:", error);
      alert("Error generating template. Please try again.");
    }
  };

  // Handle file selection
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setSummary(null);
    setValidationErrors([]);
    setChannelData([]);

    try {
      // Parse the Excel file
      const data = await parseExcelFile(file);
      setChannelData(data);

      // Validate the data
      const validation = validateChannelData(data);
      if (!validation.valid) {
        setValidationErrors(validation.errors);
      } else {
        setValidationErrors([]);
      }
    } catch (error) {
      console.error("Error parsing file:", error);
      setValidationErrors([`Error parsing file: ${error instanceof Error ? error.message : 'Unknown error'}`]);
    }
  };

  // Handle batch processing
  const handleBatchProcess = async () => {
    if (channelData.length === 0 || validationErrors.length > 0) {
      alert("Please upload a valid Excel file first.");
      return;
    }

    if (idfLoading) {
      alert("IDF constants are still loading. Please wait and try again.");
      return;
    }

    setIsProcessing(true);
    setProcessingProgress(0);
    setSummary(null);

    try {
      const result = await processBatchChannels(
        channelData,
        idfConstants,
        calculateIDF,
        (processed, total) => {
          setProcessingProgress((processed / total) * 100);
        }
      );

      setSummary(result);
      
      // Store results in sessionStorage and redirect to results page
      sessionStorage.setItem('batchProcessingResults', JSON.stringify(result));
      sessionStorage.setItem('batchChannelData', JSON.stringify(channelData));
      
      // Redirect to results page
      router.push('/auto-sizing/results');
      
    } catch (error) {
      console.error("Error processing batch:", error);
      alert(`Error processing batch: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
    }
  };


  const canProcess = channelData.length > 0 && validationErrors.length === 0 && !idfLoading;

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Batch Channel Design
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Template Download Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Step 1: Download Template</h3>
                <p className="text-sm text-muted-foreground">
                  Download the Excel template with sample data and instructions.
                </p>
              </div>
              <Button onClick={handleDownloadTemplate} variant="outline" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Download Template
              </Button>
            </div>
          </div>

          {/* File Upload Section */}
          <div className="space-y-4">
            <div>
              <h3 className="font-medium">Step 2: Upload Excel File</h3>
              <p className="text-sm text-muted-foreground">
                Upload your Excel file with channel design data.
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button 
                onClick={() => fileInputRef.current?.click()} 
                variant="outline" 
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Choose File
              </Button>
              
              {selectedFile && (
                <div className="text-sm text-muted-foreground">
                  Selected: {selectedFile.name}
                </div>
              )}
            </div>

            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium mb-2">Validation Errors:</div>
                  <ul className="list-disc list-inside space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index} className="text-sm">{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Data Preview */}
            {channelData.length > 0 && validationErrors.length === 0 && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium mb-1">File loaded successfully!</div>
                  <div className="text-sm">
                    Found {channelData.length} channel(s) ready for processing.
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Processing Section */}
          <div className="space-y-4">
            <div>
              <h3 className="font-medium">Step 3: Process Channels</h3>
              <p className="text-sm text-muted-foreground">
                Process all channels in your Excel file automatically.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <Button 
                onClick={handleBatchProcess}
                disabled={!canProcess || isProcessing}
                className="flex items-center gap-2"
              >
                {isProcessing ? (
                  <Clock className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                {isProcessing ? "Processing..." : "Process Channels"}
              </Button>

              {idfLoading && (
                <div className="text-sm text-muted-foreground">
                  Loading IDF constants...
                </div>
              )}
            </div>

            {/* Processing Progress */}
            {isProcessing && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Processing channels...</span>
                  <span>{Math.round(processingProgress)}%</span>
                </div>
                <Progress value={processingProgress} className="w-full" />
              </div>
            )}
          </div>

          {/* Processing Complete Message */}
          {summary && (
            <div className="space-y-4">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium mb-1">Processing Complete!</div>
                  <div className="text-sm">
                    Successfully processed {summary.totalChannels} channels. 
                    Redirecting to results page...
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Printer } from "lucide-react";
import { BatchProcessingSummary } from "../../utils/batchProcessor";

interface BatchPDFExportProps {
  summary: BatchProcessingSummary;
  channelData: Record<string, unknown>[];
}

export default function BatchPDFExport({ summary, channelData }: BatchPDFExportProps) {
  const handleExportPDF = async () => {
    try {
      // Import jsPDF dynamically
      const { jsPDF } = await import('jspdf');
      
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPosition = 20;

      // Helper function to add text with word wrap
      const addText = (text: string, fontSize: number = 10, isBold: boolean = false, color: string = '#000000') => {
        doc.setFontSize(fontSize);
        doc.setFont('helvetica', isBold ? 'bold' : 'normal');
        doc.setTextColor(color);
        
        const lines = doc.splitTextToSize(text, pageWidth - 40) as string[];
        doc.text(lines, 20, yPosition);
        yPosition += lines.length * fontSize * 0.4 + 5;
        
        // Check if we need a new page
        if (yPosition > pageHeight - 20) {
          doc.addPage();
          yPosition = 20;
        }
      };

      // Helper function to add a section header
      const addSectionHeader = (title: string) => {
        addText(title, 14, true, '#1e40af');
        yPosition += 5;
      };

      // Helper function to add a subsection
      // const addSubsection = (title: string) => {
      //   addText(title, 12, true, '#374151');
      //   yPosition += 3;
      // };

      // Title Page
      addText('BATCH CHANNEL DESIGN CALCULATIONS', 16, true, '#1e40af');
      addText(`Generated on: ${new Date().toLocaleString()}`, 10, false, '#6b7280');
      yPosition += 15;

      // Table of Contents
      addSectionHeader('TABLE OF CONTENTS');
      addText('1. Processing Summary', 10, true);
      addText('2. Channel Design Summary', 10, true);
      addText('3. Flow Analysis Summary', 10, true);
      addText('4. Velocity Analysis Summary', 10, true);
      addText('5. Channel Size Distribution', 10, true);
      addText('6. Detailed Calculations:', 10, true);
      summary.results.forEach((result, index) => {
        addText(`   6.${index + 1} Channel ${result.channelId} - ${result.selectedChannelSize}`, 9);
      });
      yPosition += 10;

      // Summary Statistics
      addSectionHeader('PROCESSING SUMMARY');
      addText(`Total Channels: ${summary.totalChannels}`);
      addText(`Successful Designs: ${summary.successfulChannels}`);
      addText(`Failed Designs: ${summary.failedChannels}`);
      addText(`Success Rate: ${((summary.successfulChannels / summary.totalChannels) * 100).toFixed(1)}%`);
      addText(`Processing Time: ${(summary.processingTime / 1000).toFixed(2)} seconds`);
      yPosition += 10;

      // Summary Table
      addSectionHeader('CHANNEL DESIGN SUMMARY');
      addText('Channel ID | Peak Flow (m³/s) | Channel Size | Velocity (m/s) | Status', 10, true);
      yPosition += 5;
      
      summary.results.forEach((result) => {
        const status = result.status === "OK" ? "✓ OK" : "✗ Not OK";
        addText(`${result.channelId} | ${result.peakFlow.toFixed(3)} | ${result.selectedChannelSize} | ${result.velocity.toFixed(2)} | ${status}`, 9);
      });
      yPosition += 10;

      // Flow Analysis Summary
      addSectionHeader('FLOW ANALYSIS SUMMARY');
      const avgFlow = summary.results.reduce((sum, r) => sum + r.peakFlow, 0) / summary.results.length;
      const maxFlow = Math.max(...summary.results.map(r => r.peakFlow));
      const minFlow = Math.min(...summary.results.map(r => r.peakFlow));
      addText(`Average Peak Flow: ${avgFlow.toFixed(3)} m³/s`);
      addText(`Maximum Peak Flow: ${maxFlow.toFixed(3)} m³/s`);
      addText(`Minimum Peak Flow: ${minFlow.toFixed(3)} m³/s`);
      yPosition += 5;

      // Velocity Analysis Summary
      addSectionHeader('VELOCITY ANALYSIS SUMMARY');
      const avgVelocity = summary.results.reduce((sum, r) => sum + r.velocity, 0) / summary.results.length;
      const maxVelocity = Math.max(...summary.results.map(r => r.velocity));
      const minVelocity = Math.min(...summary.results.map(r => r.velocity));
      addText(`Average Velocity: ${avgVelocity.toFixed(2)} m/s`);
      addText(`Maximum Velocity: ${maxVelocity.toFixed(2)} m/s`);
      addText(`Minimum Velocity: ${minVelocity.toFixed(2)} m/s`);
      yPosition += 5;

      // Channel Size Distribution
      addSectionHeader('CHANNEL SIZE DISTRIBUTION');
      const sizeDistribution = summary.results.reduce((acc, result) => {
        acc[result.selectedChannelSize] = (acc[result.selectedChannelSize] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      Object.entries(sizeDistribution)
        .sort(([,a], [,b]) => b - a)
        .forEach(([size, count]) => {
          addText(`${size}: ${count} channels`);
        });
      
      // End of summary page - add new page for detailed calculations
      doc.addPage();
      yPosition = 20;

      // Individual Channel Calculations
      addSectionHeader('DETAILED CALCULATIONS');
      
      summary.results.forEach((result, index) => {
        const inputData = channelData.find(d => d.channelId === result.channelId);
        if (!inputData) return;

        // Start each channel on a new page (except the first one)
        if (index > 0) {
          doc.addPage();
          yPosition = 20;
        }

        // Channel Header
        addSectionHeader(`CHANNEL ${result.channelId} - ${result.selectedChannelSize} - ${result.status}`);
        yPosition += 5;

        // Input Parameters
        addText('INPUT PARAMETERS:', 10, true);
        addText(`• Catchment Area: ${inputData.catchmentArea} m²`);
        addText(`• Average Slope: ${inputData.averageSlope} m per 100 m`);
        addText(`• Flow Path Length: ${inputData.flowPathLength} m`);
        addText(`• Surface Type: ${inputData.surfaceType}`);
        addText(`• Return Period: ${inputData.returnPeriod} years`);
        addText(`• Channel Shape: ${inputData.channelShape}`);
        addText(`• Channel Gradient: ${(inputData.channelGradient as number).toFixed(4)} m/m`);
        addText(`• Channel Material: ${inputData.channelMaterial}`);
        yPosition += 5;

        // Time of Concentration Calculation
        addText('TIME OF CONCENTRATION CALCULATION:', 10, true);
        
        addText('CATCHMENT TIME OF CONCENTRATION (DSD SDM Method):', 10, true);
        addText('Formula: t_o = (0.14465 × L) / (H^0.2 × A^0.1)');
        addText('Where:');
        addText(`• L = Distance (on plan) = ${inputData.flowPathLength} m`);
        addText(`• H = Average slope = ${inputData.averageSlope} m per 100 m`);
        addText(`• A = Catchment area = ${inputData.catchmentArea} m²`);
        addText(`• Calculation: t_o = (0.14465 × ${inputData.flowPathLength}) / (${inputData.averageSlope}^0.2 × ${inputData.catchmentArea}^0.1)`);
        addText(`• Catchment TC = ${result.catchmentTC.toFixed(1)} minutes (minimum 5 minutes applied)`);
        yPosition += 3;
        
        addText('UPSTREAM CHANNEL TIME OF CONCENTRATION:', 10, true);
        addText(`• Upstream Channels: ${inputData.upstreamChannelIds || "None"}`);
        addText(`• Upstream TC = ${result.upstreamTC.toFixed(1)} minutes`);
        yPosition += 3;
        
        addText('EFFECTIVE TIME OF CONCENTRATION:', 10, true);
        addText(`• Using the larger value: max(${result.catchmentTC.toFixed(1)}, ${result.upstreamTC.toFixed(1)}) = ${result.effectiveTC.toFixed(1)} minutes`);
        addText(`• Effective TC = ${result.effectiveTC.toFixed(1)} minutes`);
        yPosition += 5;

        // Peak Flow Calculation
        addText('PEAK FLOW CALCULATION (Rational Method):', 10, true);
        
        // Get surface type data
        const surfaceTypeData = [
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
        ].find(s => s.id === inputData.surfaceType);
        
        addText('INPUT PARAMETERS:', 10, true);
        addText(`• Catchment Area (A): ${inputData.catchmentArea} m²`);
        addText(`• Surface Type: ${surfaceTypeData?.name}`);
        addText(`• Runoff Coefficient (C): ${result.runoffCoefficient.toFixed(3)}`);
        addText(`• Time of Concentration: ${result.effectiveTC.toFixed(1)} minutes`);
        addText(`• Return Period: ${inputData.returnPeriod} years`);
        yPosition += 3;
        
        addText('RAINFALL INTENSITY (IDF):', 10, true);
        addText('Using Hong Kong IDF Curves:');
        addText(`• Return Period: ${inputData.returnPeriod} years`);
        addText(`• Duration: ${result.effectiveTC.toFixed(1)} minutes`);
        addText('• Climate Change Adjustment: +28.1%');
        addText(`• Rainfall Intensity = ${result.rainfallIntensity.toFixed(1)} mm/hr`);
        yPosition += 3;
        
        addText('RATIONAL METHOD FORMULA:', 10, true);
        addText('Formula: Qp = C × i × A');
        addText('Where:');
        addText('• Qp = Peak flow (m³/s)');
        addText(`• C = Runoff coefficient = ${result.runoffCoefficient.toFixed(3)}`);
        addText(`• i = Rainfall intensity = ${result.rainfallIntensity.toFixed(1)} mm/hr = ${(result.rainfallIntensity / 3600 / 1000).toExponential(3)} m/s`);
        addText(`• A = Catchment area = ${inputData.catchmentArea} m²`);
        addText(`• Calculation: Qp = ${result.runoffCoefficient.toFixed(3)} × ${(result.rainfallIntensity / 3600 / 1000).toExponential(3)} × ${inputData.catchmentArea}`);
        addText(`• Peak Flow = ${result.peakFlow.toFixed(3)} m³/s (${(result.peakFlow * 1000).toFixed(1)} L/s)`);
        yPosition += 5;

        // Channel Sizing Calculation
        addText('CHANNEL SIZING CALCULATION:', 10, true);
        
        // Get material data
        const materialData = [
          { id: "concrete", name: "Concrete", manningN: 0.013 },
          { id: "asphalt", name: "Asphalt", manningN: 0.016 },
          { id: "brick", name: "Brick", manningN: 0.015 },
          { id: "stone", name: "Stone", manningN: 0.025 },
          { id: "earth", name: "Earth", manningN: 0.025 },
          { id: "grass", name: "Grass", manningN: 0.035 },
          { id: "gravel", name: "Gravel", manningN: 0.030 },
          { id: "riprap", name: "Riprap", manningN: 0.040 },
        ].find(m => m.id === inputData.channelMaterial);
        
        addText('CHANNEL PARAMETERS:', 10, true);
        addText(`• Channel Shape: ${inputData.channelShape === "trapezoidal" ? "Trapezoidal" : "U-Channel"}`);
        addText(`• Channel Gradient: ${(inputData.channelGradient as number).toFixed(4)} m/m`);
        addText(`• Channel Material: ${materialData?.name}`);
        addText(`• Manning's n: ${materialData?.manningN.toFixed(3)}`);
        
        if (inputData.channelShape === "trapezoidal") {
          addText(`• Bottom Width: 0.5 m (fixed)`);
          addText(`• Side Slope: 1:2 (fixed)`);
        } else {
          addText(`• Flow Depth = Channel Width (fixed relationship)`);
        }
        yPosition += 3;
        
        addText('MANNING\'S EQUATION:', 10, true);
        addText('Formula: Q = (1/n) × A × R^(2/3) × S^(1/2)');
        addText('Where:');
        addText('• Q = Flow (m³/s)');
        addText(`• n = Manning's roughness = ${materialData?.manningN.toFixed(3)}`);
        addText('• A = Cross-sectional area (m²)');
        addText('• R = Hydraulic radius (m)');
        addText(`• S = Longitudinal slope = ${(inputData.channelGradient as number).toFixed(4)} m/m`);
        addText(`• Target Flow: ${result.peakFlow.toFixed(3)} m³/s`);
        yPosition += 3;
        
        addText('AUTOMATIC SIZING PROCESS:', 10, true);
        if (inputData.channelShape === "trapezoidal") {
          addText('For Trapezoidal Channel:');
          addText('1. Fixed parameters: Bottom width = 0.5m, Side slope = 1:2');
          addText('2. Use bisection method to find depth that gives required flow');
          addText('3. Calculate top width: T = b + 2zy = 0.5 + 2 × 2 × depth');
          addText('4. Calculate geometry: Area, Perimeter, Hydraulic Radius');
          addText('5. Apply Manning\'s equation to verify flow capacity');
        } else {
          addText('For U-Channel:');
          addText('1. Fixed relationship: Flow depth = Channel width');
          addText('2. Use bisection method to find width that gives required flow');
          addText('3. Calculate geometry: Area, Perimeter, Hydraulic Radius');
          addText('4. Apply Manning\'s equation to verify flow capacity');
        }
        yPosition += 3;
        
        addText('CHANNEL SIZING RESULT:', 10, true);
        addText(`• Required Width: ${result.requiredChannelWidth.toFixed(3)} m`);
        addText(`• Selected Size: ${result.selectedChannelSize}`);
        addText(`• Selected Width: ${result.selectedChannelWidth.toFixed(3)} m`);
        addText(`• Channel Capacity: ${result.calculatedFlow.toFixed(3)} m³/s`);
        addText(`• Velocity: ${result.velocity.toFixed(2)} m/s`);
        
        if (inputData.channelShape === "trapezoidal") {
          const depth = (result.selectedChannelWidth - 0.5) / (2 * 2);
          addText(`• Channel Depth: ${depth.toFixed(3)} m`);
        }
        yPosition += 5;

        // Design Validation
        addText('DESIGN VALIDATION:', 10, true);
        
        addText('FLOW CAPACITY CHECK:', 10, true);
        addText(`• Required Flow: ${result.peakFlow.toFixed(3)} m³/s`);
        addText(`• Provided Flow: ${result.calculatedFlow.toFixed(3)} m³/s`);
        addText(`• Flow Ratio: ${(result.calculatedFlow / result.peakFlow).toFixed(3)}`);
        addText(`• Flow Adequate: ${(result.calculatedFlow / result.peakFlow) >= 0.95 ? 'Yes (≥95%)' : 'No (<95%)'}`);
        yPosition += 3;
        
        addText('VELOCITY CHECK:', 10, true);
        addText(`• Calculated Velocity: ${result.velocity.toFixed(2)} m/s`);
        addText('• Minimum Required: 0.3 m/s');
        addText('• Recommended Maximum: 4.0 m/s');
        addText(`• Velocity Check: ${result.velocity >= 0.3 ? 'Pass (≥0.3 m/s)' : 'Fail (<0.3 m/s)'}`);
        if (result.velocity > 4.0) {
          addText('• Warning: Velocity exceeds recommended maximum of 4.0 m/s');
        }
        yPosition += 3;
        
        addText('OVERALL DESIGN STATUS:', 10, true);
        addText(`• Design Status: ${result.status}`);
        if (result.status === "OK") {
          addText('• All design criteria satisfied');
        } else {
          addText('• Design criteria not satisfied - review required');
        }
        
        if (result.error) {
          addText(`• Error: ${result.error}`, 10, false, '#dc2626');
        }
        if (result.velocityWarning) {
          addText(`• Warning: ${result.velocityWarning}`, 10, false, '#ea580c');
        }
        
        yPosition += 5;
      });

      // Add a final summary page
      doc.addPage();
      yPosition = 20;
      
      addSectionHeader('DESIGN RECOMMENDATIONS & SUMMARY');
      addText('The following recommendations are based on the batch processing results:', 10, true);
      yPosition += 5;
      
      // Design recommendations
      addText('DESIGN RECOMMENDATIONS:', 10, true);
      if (summary.successfulChannels === summary.totalChannels) {
        addText('✓ All channel designs meet the required criteria');
        addText('✓ No design modifications required');
      } else {
        addText(`⚠ ${summary.failedChannels} channels require design review`);
        addText('• Review failed channel designs and consider:');
        addText('  - Increasing channel size');
        addText('  - Adjusting channel gradient');
        addText('  - Changing channel material');
        addText('  - Modifying catchment parameters');
      }
      yPosition += 5;
      
      // Velocity recommendations
      const highVelocityChannels = summary.results.filter(r => r.velocity > 4.0).length;
      const lowVelocityChannels = summary.results.filter(r => r.velocity < 0.3).length;
      
      if (highVelocityChannels > 0) {
        addText(`⚠ ${highVelocityChannels} channels have high velocity (>4.0 m/s)`);
        addText('• Consider gentler gradient or erosion protection');
      }
      
      if (lowVelocityChannels > 0) {
        addText(`⚠ ${lowVelocityChannels} channels have low velocity (<0.3 m/s)`);
        addText('• Consider steeper gradient for better flow');
      }
      
      if (highVelocityChannels === 0 && lowVelocityChannels === 0) {
        addText('✓ All channels have acceptable velocity ranges');
      }
      yPosition += 5;
      
      // Channel size recommendations
      addText('CHANNEL SIZE OPTIMIZATION:', 10, true);
      const sizeDistributionOptimization = summary.results.reduce((acc, result) => {
        acc[result.selectedChannelSize] = (acc[result.selectedChannelSize] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const mostCommonSize = Object.entries(sizeDistributionOptimization).sort(([,a], [,b]) => b - a)[0];
      addText(`• Most common channel size: ${mostCommonSize[0]} (${mostCommonSize[1]} channels)`);
      addText('• Consider standardizing channel sizes for cost efficiency');
      yPosition += 5;
      
      addText('FINAL NOTES:', 10, true);
      addText('• All calculations follow Hong Kong DSD SDM guidelines');
      addText('• Climate change adjustment (+28.1%) applied to rainfall intensity');
      addText('• Manning\'s equation used for open channel flow calculations');
      addText('• Minimum velocity requirement: 0.3 m/s');
      addText('• Recommended maximum velocity: 4.0 m/s');

      // Footer
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor('#6b7280');
        doc.text(`Page ${i} of ${totalPages}`, pageWidth - 30, pageHeight - 10);
        doc.text('Generated by Slope Drainage Design Tool', 20, pageHeight - 10);
      }

      // Save the PDF
      const fileName = `batch_channel_design_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Printer className="h-5 w-5" />
          Export Detailed Calculations to PDF
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Export all channel design calculations including step-by-step calculations, 
            input parameters, and design validation for all {summary.totalChannels} channels.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">PDF Contents:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Processing summary and statistics</li>
                <li>• Individual channel calculations</li>
                <li>• Input parameters for each channel</li>
                <li>• Step-by-step calculation details</li>
                <li>• Design validation results</li>
                <li>• Error messages and warnings</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Channels to Export:</h4>
              <div className="space-y-1 text-muted-foreground">
                <p>• Total: {summary.totalChannels} channels</p>
                <p>• Successful: {summary.successfulChannels} channels</p>
                <p>• Failed: {summary.failedChannels} channels</p>
                {summary.errors.length > 0 && (
                  <p>• Errors: {summary.errors.length} issues</p>
                )}
              </div>
            </div>
          </div>

          <Button 
            onClick={handleExportPDF}
            className="w-full flex items-center gap-2"
            size="lg"
          >
            <Printer className="h-4 w-4" />
            Export All Calculations to PDF
          </Button>
          
          <p className="text-xs text-muted-foreground text-center">
            The PDF will contain detailed calculations for all {summary.totalChannels} channels.
            File size may be large depending on the number of channels.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

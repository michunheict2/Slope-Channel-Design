"use client";

import { Button } from "@/components/ui/button";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { AutoSizingData, SizingResults } from "../page";

interface PDFExportProps {
  data: AutoSizingData;
  results: SizingResults;
  catchmentTC: number;
  upstreamTC: number;
  effectiveTC: number;
  rainfallIntensity: number;
  runoffCoefficient: number;
  peakFlow: number;
}

export default function PDFExport({
  data,
  results,
  catchmentTC,
  upstreamTC,
  effectiveTC,
  rainfallIntensity,
  runoffCoefficient,
  peakFlow,
}: PDFExportProps) {
  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;

    // Helper function to add text with automatic line breaks
    const addText = (text: string, x: number, y: number, options: any = {}) => {
      const lines = doc.splitTextToSize(text, pageWidth - x - 20);
      doc.text(lines, x, y);
      return y + (lines.length * (options.lineHeight || 7));
    };

    // Helper function to add a section header
    const addSectionHeader = (title: string, y: number) => {
      doc.setFontSize(14);
      doc.setFont("arial", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text(title, 20, y);
      doc.setLineWidth(0.5);
      doc.line(20, y + 2, pageWidth - 20, y + 2);
      return y + 10;
    };

    // Helper function to add a subsection
    const addSubsection = (title: string, y: number) => {
      doc.setFontSize(12);
      doc.setFont("arial", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text(title, 20, y);
      return y + 7;
    };

    // Helper function to add regular text
    const addRegularText = (text: string, y: number) => {
      doc.setFontSize(10);
      doc.setFont("arial", "normal");
      doc.setTextColor(0, 0, 0);
      return addText(text, 20, y);
    };

    // Helper function to add calculation text
    const addCalculationText = (text: string, y: number) => {
      doc.setFontSize(9);
      doc.setFont("arial", "normal");
      doc.setTextColor(0, 0, 0);
      return addText(text, 25, y);
    };

    // Title and Project Information
    doc.setFontSize(18);
    doc.setFont("arial", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("Automatic Channel Sizing Report", pageWidth / 2, yPosition, { align: "center" });
    yPosition += 15;

    doc.setFontSize(12);
    doc.setFont("arial", "normal");
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, yPosition);
    yPosition += 8;
    doc.text(`Time: ${new Date().toLocaleTimeString()}`, 20, yPosition);
    yPosition += 15;

    // Check if we need a new page
    if (yPosition > pageHeight - 50) {
      doc.addPage();
      yPosition = 20;
    }

    // Project Input Parameters
    yPosition = addSectionHeader("1. Project Input Parameters", yPosition);

    // Catchment Data
    yPosition = addSubsection("1.1 Catchment Properties", yPosition);
    yPosition = addRegularText(`• Catchment Area: ${data.catchmentArea.toFixed(0)} m²`, yPosition);
    yPosition = addRegularText(`• Average Slope: ${data.averageSlope.toFixed(1)} m per 100m`, yPosition);
    yPosition = addRegularText(`• Flow Path Length: ${data.flowPathLength.toFixed(0)} m`, yPosition);
    yPosition = addRegularText(`• Surface Type: ${data.surfaceType}`, yPosition);
    yPosition = addRegularText(`• Runoff Coefficient: ${runoffCoefficient.toFixed(3)}`, yPosition);
    yPosition += 5;

    // Upstream Channels
    yPosition = addSubsection("1.2 Upstream Channels", yPosition);
    data.upstreamChannels.forEach((channel, index) => {
      if (channel.channelNo || channel.timeOfConcentration > 0) {
        yPosition = addRegularText(`• Channel ${index + 1}: ${channel.channelNo || "Not specified"} - TC: ${channel.timeOfConcentration} min`, yPosition);
      }
    });
    yPosition += 5;

    // Rainfall Data
    yPosition = addSubsection("1.3 Rainfall Properties", yPosition);
    yPosition = addRegularText(`• Return Period: ${data.returnPeriod} years`, yPosition);
    yPosition = addRegularText(`• IDF Curve Used: Yes (Hong Kong)`, yPosition);
    yPosition = addRegularText(`• Climate Change Adjustment: +28.1%`, yPosition);
    yPosition = addRegularText(`• Rainfall Intensity: ${rainfallIntensity.toFixed(1)} mm/hr`, yPosition);
    yPosition += 5;

    // Channel Data
    yPosition = addSubsection("1.4 Channel Properties", yPosition);
    yPosition = addRegularText(`• Channel Shape: ${data.channelShape === "trapezoidal" ? "Trapezoidal" : "U-Channel"}`, yPosition);
    yPosition = addRegularText(`• Channel Gradient: ${data.channelGradient.toFixed(4)} m/m`, yPosition);
    yPosition = addRegularText(`• Channel Material: ${data.channelMaterial}`, yPosition);
    
    if (data.channelShape === "trapezoidal") {
      yPosition = addRegularText(`• Bottom Width: 0.5 m (fixed)`, yPosition);
      yPosition = addRegularText(`• Side Slope: 1:2 (fixed)`, yPosition);
    } else {
      yPosition = addRegularText(`• Flow Depth = Channel Width (fixed relationship)`, yPosition);
    }
    yPosition += 10;

    // Check if we need a new page
    if (yPosition > pageHeight - 100) {
      doc.addPage();
      yPosition = 20;
    }

    // Time of Concentration Calculations
    yPosition = addSectionHeader("2. Time of Concentration Calculation", yPosition);
    
    yPosition = addSubsection("2.1 Catchment Time of Concentration (DSD SDM Method)", yPosition);
    yPosition = addCalculationText(`Formula: t_o = (0.14465 × L) / (H^0.2 × A^0.1)`, yPosition);
    yPosition = addCalculationText(`Where: L = ${data.flowPathLength} m, H = ${data.averageSlope} m per 100m, A = ${data.catchmentArea} m²`, yPosition);
    yPosition = addCalculationText(`t_o = (0.14465 × ${data.flowPathLength}) / (${data.averageSlope}^0.2 × ${data.catchmentArea}^0.1)`, yPosition);
    yPosition = addCalculationText(`t_o = ${(0.14465 * data.flowPathLength).toFixed(2)} / (${Math.pow(data.averageSlope, 0.2).toFixed(2)} × ${Math.pow(data.catchmentArea, 0.1).toFixed(2)})`, yPosition);
    yPosition = addCalculationText(`t_o = ${(0.14465 * data.flowPathLength).toFixed(2)} / ${(Math.pow(data.averageSlope, 0.2) * Math.pow(data.catchmentArea, 0.1)).toFixed(2)}`, yPosition);
    yPosition = addCalculationText(`t_o = ${((0.14465 * data.flowPathLength) / (Math.pow(data.averageSlope, 0.2) * Math.pow(data.catchmentArea, 0.1))).toFixed(3)} minutes (raw calculation)`, yPosition);
    yPosition = addCalculationText(`t_o = max(${((0.14465 * data.flowPathLength) / (Math.pow(data.averageSlope, 0.2) * Math.pow(data.catchmentArea, 0.1))).toFixed(3)}, 5) = ${catchmentTC.toFixed(1)} minutes`, yPosition);
    yPosition = addCalculationText(`Catchment TC = ${catchmentTC.toFixed(1)} minutes (minimum 5 minutes applied)`, yPosition);
    yPosition += 5;

    yPosition = addSubsection("2.2 Upstream Channel Time of Concentration", yPosition);
    yPosition = addCalculationText(`Maximum upstream TC = ${upstreamTC.toFixed(1)} minutes`, yPosition);
    yPosition += 5;

    yPosition = addSubsection("2.3 Effective Time of Concentration", yPosition);
    yPosition = addCalculationText(`Effective TC = max(${catchmentTC.toFixed(1)}, ${upstreamTC.toFixed(1)}) = ${effectiveTC.toFixed(1)} minutes`, yPosition);
    yPosition += 10;

    // Check if we need a new page
    if (yPosition > pageHeight - 100) {
      doc.addPage();
      yPosition = 20;
    }

    // Peak Flow Calculation
    yPosition = addSectionHeader("3. Peak Flow Calculation (Rational Method)", yPosition);
    
    yPosition = addSubsection("3.1 Input Parameters", yPosition);
    yPosition = addCalculationText(`Catchment Area (A) = ${data.catchmentArea} m²`, yPosition);
    yPosition = addCalculationText(`Runoff Coefficient (C) = ${runoffCoefficient.toFixed(3)}`, yPosition);
    yPosition = addCalculationText(`Rainfall Intensity (i) = ${rainfallIntensity.toFixed(1)} mm/hr`, yPosition);
    yPosition = addCalculationText(`Time of Concentration = ${effectiveTC.toFixed(1)} minutes`, yPosition);
    yPosition += 5;

    yPosition = addSubsection("3.2 Unit Conversion", yPosition);
    yPosition = addCalculationText(`i = ${rainfallIntensity.toFixed(1)} mm/hr`, yPosition);
    yPosition = addCalculationText(`i = ${(rainfallIntensity / 3600 / 1000).toExponential(3)} m/s`, yPosition);
    yPosition += 5;

    yPosition = addSubsection("3.3 Rational Method Formula", yPosition);
    yPosition = addCalculationText(`Qp = C × i × A`, yPosition);
    yPosition = addCalculationText(`Qp = ${runoffCoefficient.toFixed(3)} × ${(rainfallIntensity / 3600 / 1000).toExponential(3)} × ${data.catchmentArea}`, yPosition);
    yPosition = addCalculationText(`Qp = ${peakFlow.toFixed(6)} m³/s`, yPosition);
    yPosition = addCalculationText(`Peak Flow = ${peakFlow.toFixed(3)} m³/s (${(peakFlow * 1000).toFixed(1)} L/s)`, yPosition);
    yPosition += 10;

    // Check if we need a new page
    if (yPosition > pageHeight - 100) {
      doc.addPage();
      yPosition = 20;
    }

    // Channel Sizing Calculation
    yPosition = addSectionHeader("4. Channel Sizing Calculation", yPosition);
    
    yPosition = addSubsection("4.1 Channel Parameters", yPosition);
    yPosition = addCalculationText(`Channel Shape: ${data.channelShape === "trapezoidal" ? "Trapezoidal" : "U-Channel"}`, yPosition);
    yPosition = addCalculationText(`Channel Gradient: ${data.channelGradient.toFixed(4)} m/m`, yPosition);
    yPosition = addCalculationText(`Channel Material: ${data.channelMaterial}`, yPosition);
    yPosition = addCalculationText(`Manning's n: ${data.channelMaterial === "concrete" ? 0.013 : data.channelMaterial === "asphalt" ? 0.016 : 0.025}`, yPosition);
    yPosition += 5;

    yPosition = addSubsection("4.2 Manning's Equation", yPosition);
    yPosition = addCalculationText(`Formula: Q = (1/n) × A × R^(2/3) × S^(1/2)`, yPosition);
    yPosition = addCalculationText(`Target Flow: ${peakFlow.toFixed(3)} m³/s`, yPosition);
    yPosition += 5;

    yPosition = addSubsection("4.3 Automatic Sizing Process", yPosition);
    if (data.channelShape === "trapezoidal") {
      yPosition = addCalculationText(`For Trapezoidal Channel:`, yPosition);
      yPosition = addCalculationText(`1. Fixed parameters: Bottom width = 0.5m, Side slope = 1:2`, yPosition);
      yPosition = addCalculationText(`2. Use bisection method to find depth that gives required flow`, yPosition);
      yPosition = addCalculationText(`3. Calculate top width: T = b + 2zy = 0.5 + 2 × 2 × depth`, yPosition);
      yPosition = addCalculationText(`4. Round up to nearest 0.5m for practical construction`, yPosition);
      yPosition = addCalculationText(`5. Calculate channel depth: depth = (top_width - bottom_width) / (2 × side_slope)`, yPosition);
      yPosition = addCalculationText(`Theoretical Width = ${results.requiredChannelWidth.toFixed(3)} m`, yPosition);
      yPosition = addCalculationText(`Selected Width = ${results.selectedChannelSize} (${results.selectedChannelWidth.toFixed(3)} m)`, yPosition);
      yPosition = addCalculationText(`Channel Depth = ${((results.selectedChannelWidth - 0.5) / (2 * 2)).toFixed(3)} m`, yPosition);
    } else {
      yPosition = addCalculationText(`For U-Channel:`, yPosition);
      yPosition = addCalculationText(`1. Fixed relationship: Flow depth = Channel width`, yPosition);
      yPosition = addCalculationText(`2. Calculate theoretical required width using bisection method`, yPosition);
      yPosition = addCalculationText(`3. Select smallest standard U-channel size that meets flow requirements`, yPosition);
      yPosition = addCalculationText(`Theoretical Width = ${results.requiredChannelWidth.toFixed(3)} m (${(results.requiredChannelWidth * 1000).toFixed(0)} mm)`, yPosition);
      yPosition = addCalculationText(`Selected Channel Size = ${results.selectedChannelSize} (${results.selectedChannelWidth.toFixed(3)} m)`, yPosition);
    }
    yPosition += 10;

    // Check if we need a new page
    if (yPosition > pageHeight - 100) {
      doc.addPage();
      yPosition = 20;
    }

    // Design Validation
    yPosition = addSectionHeader("5. Design Validation", yPosition);
    
    yPosition = addSubsection("5.1 Flow Capacity Check", yPosition);
    yPosition = addCalculationText(`Required Peak Flow = ${peakFlow.toFixed(3)} m³/s`, yPosition);
    yPosition = addCalculationText(`Channel Capacity = ${results.calculatedFlow.toFixed(3)} m³/s`, yPosition);
    yPosition = addCalculationText(`Flow Ratio = ${(results.calculatedFlow/peakFlow).toFixed(3)}`, yPosition);
    yPosition = addCalculationText(`Status: ${(results.calculatedFlow/peakFlow) >= 0.95 ? "✓ Adequate" : "✗ Insufficient"}`, yPosition);
    yPosition += 5;

    yPosition = addSubsection("5.2 Velocity Check", yPosition);
    yPosition = addCalculationText(`Calculated Velocity = ${results.velocity.toFixed(2)} m/s`, yPosition);
    yPosition = addCalculationText(`Min. Required = 0.3 m/s`, yPosition);
    yPosition = addCalculationText(`Recommended Max = 4.0 m/s`, yPosition);
    if (results.velocity < 0.3) {
      yPosition = addCalculationText(`Status: ✗ Too Low`, yPosition);
    }
    if (results.velocityWarning) {
      yPosition = addCalculationText(`Warning: ${results.velocityWarning}`, yPosition);
    }
    yPosition += 5;

    yPosition = addSubsection("5.3 Overall Design Status", yPosition);
    yPosition = addCalculationText(`Design Status: ${results.status}`, yPosition);
    if (results.velocityWarning) {
      yPosition = addCalculationText(`Velocity Warning: ${results.velocityWarning}`, yPosition);
    }
    if (results.error) {
      yPosition = addCalculationText(`Error: ${results.error}`, yPosition);
    }
    yPosition += 10;

    // Final Results Summary
    yPosition = addSectionHeader("6. Final Design Summary", yPosition);
    
    // Create a summary table
    const summaryData = [
      ["Parameter", "Value", "Unit"],
      ["Time of Concentration", effectiveTC.toFixed(1), "minutes"],
      ["Peak Flow", peakFlow.toFixed(3), "m³/s"],
      ["Peak Flow", (peakFlow * 1000).toFixed(1), "L/s"],
    ];

    if (data.channelShape === "u-channel") {
      summaryData.push(
        ["Selected Channel Size", results.selectedChannelSize, ""],
        ["Channel Width", results.selectedChannelWidth.toFixed(3), "m"],
        ["Theoretical Width", results.requiredChannelWidth.toFixed(3), "m"],
        ["Theoretical Width", (results.requiredChannelWidth * 1000).toFixed(0), "mm"]
      );
    } else {
      summaryData.push(
        ["Selected Channel Width", results.selectedChannelSize, ""],
        ["Selected Width", results.selectedChannelWidth.toFixed(3), "m"],
        ["Channel Depth", ((results.selectedChannelWidth - 0.5) / (2 * 2)).toFixed(3), "m"],
        ["Theoretical Width", results.requiredChannelWidth.toFixed(3), "m"]
      );
    }

    summaryData.push(
      ["Channel Capacity", results.calculatedFlow.toFixed(3), "m³/s"],
      ["Velocity", results.velocity.toFixed(2), "m/s"],
      ["Design Status", results.status, ""]
    );

    autoTable(doc, {
      head: [summaryData[0]],
      body: summaryData.slice(1),
      startY: yPosition,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [66, 139, 202] },
    });

    // Footer
    const finalY = (doc as any).lastAutoTable.finalY + 20;
    doc.setFontSize(8);
    doc.setFont("arial", "italic");
    doc.setTextColor(128, 128, 128);
    doc.text("Generated by Automatic Channel Sizing Tool", pageWidth / 2, finalY, { align: "center" });
    doc.text("Based on Rational Method and Manning's Equation", pageWidth / 2, finalY + 5, { align: "center" });

    // Save the PDF
    const fileName = `Auto_Channel_Sizing_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  return (
    <Button 
      onClick={generatePDF}
      className="w-full"
      variant="outline"
    >
      📄 Export Detailed Calculations to PDF
    </Button>
  );
}

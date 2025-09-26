"use client";

import { Button } from "@/components/ui/button";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { CatchmentData } from "./CatchmentForm";
import { RainfallData } from "./RainfallForm";
import { ChannelData } from "./ChannelForm";
import { CalculationResults } from "./ResultsPanel";

interface PDFExportProps {
  channelNo: string;
  catchmentData: CatchmentData;
  rainfallData: RainfallData;
  channelData: ChannelData;
  results: CalculationResults | null;
}

export default function PDFExport({
  channelNo,
  catchmentData,
  rainfallData,
  channelData,
  results,
}: PDFExportProps) {
  const generatePDF = () => {
    if (!results) {
      alert("Please calculate the design first before exporting to PDF.");
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;

    // Helper function to add text with automatic line breaks
    const addText = (text: string, x: number, y: number, options: Record<string, unknown> = {}) => {
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
    doc.text("Slope Drainage Channel Design Report", pageWidth / 2, yPosition, { align: "center" });
    yPosition += 15;

    doc.setFontSize(12);
    doc.setFont("arial", "normal");
    doc.text(`Channel Number: ${channelNo || "Not specified"}`, 20, yPosition);
    yPosition += 8;
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
    yPosition = addRegularText(`• Catchment Area: ${catchmentData.area.toFixed(0)} m²`, yPosition);
    yPosition = addRegularText(`• Surface Type: ${catchmentData.surfaceType}`, yPosition);
    yPosition = addRegularText(`• Runoff Coefficient: ${catchmentData.runoffCoefficient.toFixed(3)}`, yPosition);
    yPosition = addRegularText(`• Weighted Runoff Coefficient: ${catchmentData.weightedRunoffCoefficient.toFixed(3)}`, yPosition);
    yPosition = addRegularText(`• Average Slope: ${catchmentData.averageSlope.toFixed(1)} m per 100m`, yPosition);
    yPosition = addRegularText(`• Flow Path Length: ${catchmentData.flowPathLength.toFixed(0)} m`, yPosition);
    yPosition = addRegularText(`• Time of Concentration: ${catchmentData.timeOfConcentration.toFixed(2)} minutes`, yPosition);
    yPosition += 5;

    // Rainfall Data
    yPosition = addSubsection("1.2 Rainfall Properties", yPosition);
    yPosition = addRegularText(`• Rainfall Intensity: ${rainfallData.intensity.toFixed(1)} mm/h`, yPosition);
    yPosition = addRegularText(`• Intensity (SI): ${rainfallData.intensityMS.toExponential(6)} m/s`, yPosition);
    
    if (rainfallData.useIDFCurve && rainfallData.idfResult) {
      yPosition = addRegularText(`• IDF Curve Used: Yes`, yPosition);
      yPosition = addRegularText(`• Return Period: ${rainfallData.idfResult.returnPeriod} years`, yPosition);
      yPosition = addRegularText(`• Duration: ${rainfallData.idfResult.duration} minutes`, yPosition);
      yPosition = addRegularText(`• Raw Intensity: ${rainfallData.idfResult.rawIntensity.toFixed(2)} mm/hr`, yPosition);
      yPosition = addRegularText(`• Climate Change Applied: ${rainfallData.idfResult.climateChangeApplied ? "Yes (+28.1%)" : "No"}`, yPosition);
      yPosition = addRegularText(`• IDF Constants (a, b, c): ${rainfallData.idfResult.constants.a}, ${rainfallData.idfResult.constants.b}, ${rainfallData.idfResult.constants.c}`, yPosition);
    } else {
      yPosition = addRegularText(`• IDF Curve Used: No (Manual input)`, yPosition);
    }
    yPosition += 5;

    // Channel Data
    yPosition = addSubsection("1.3 Channel Properties", yPosition);
    yPosition = addRegularText(`• Channel Shape: ${channelData.shape === "trapezoid" ? "Trapezoidal" : "U-shaped"}`, yPosition);
    
    if (channelData.shape === "trapezoid") {
      yPosition = addRegularText(`• Bottom Width: ${channelData.bottomWidth.toFixed(2)} m`, yPosition);
      yPosition = addRegularText(`• Side Slope: ${channelData.sideSlope.toFixed(2)} H:V`, yPosition);
      yPosition = addRegularText(`• Channel Depth: ${channelData.channelDepth.toFixed(2)} m`, yPosition);
      yPosition = addRegularText(`• Top Width: ${channelData.topWidth.toFixed(2)} m`, yPosition);
    } else {
      yPosition = addRegularText(`• Channel Width: ${channelData.width.toFixed(3)} m (${(channelData.width * 1000).toFixed(0)} mm)`, yPosition);
      yPosition = addRegularText(`• Bottom Radius: ${channelData.radius.toFixed(3)} m`, yPosition);
      yPosition = addRegularText(`• Flow Depth: ${channelData.flowDepth.toFixed(3)} m (${(channelData.flowDepth * 1000).toFixed(0)} mm)`, yPosition);
    }
    
    yPosition = addRegularText(`• Longitudinal Slope: ${channelData.longitudinalSlope.toFixed(4)} m/m`, yPosition);
    yPosition = addRegularText(`• Manning's Roughness Coefficient: ${channelData.manningN.toFixed(3)}`, yPosition);
    yPosition += 10;

    // Check if we need a new page
    if (yPosition > pageHeight - 100) {
      doc.addPage();
      yPosition = 20;
    }

    // Rational Method Calculations
    yPosition = addSectionHeader("2. Rational Method - Peak Flow Calculation", yPosition);
    
    const intensityMS = rainfallData.intensity / 3600 / 1000;
    yPosition = addSubsection("2.1 Input Parameters", yPosition);
    yPosition = addRegularText(`• Catchment Area (A) = ${catchmentData.area.toFixed(0)} m²`, yPosition);
    yPosition = addRegularText(`• Runoff Coefficient (C) = ${catchmentData.weightedRunoffCoefficient.toFixed(3)}`, yPosition);
    yPosition = addRegularText(`• Rainfall Intensity (i) = ${rainfallData.intensity.toFixed(1)} mm/h`, yPosition);
    yPosition += 5;

    yPosition = addSubsection("2.2 Unit Conversion", yPosition);
    yPosition = addCalculationText(`i = ${rainfallData.intensity.toFixed(1)} mm/h`, yPosition);
    yPosition = addCalculationText(`i = ${intensityMS.toExponential(3)} m/s`, yPosition);
    yPosition = addCalculationText(`A = ${catchmentData.area.toFixed(0)} m²`, yPosition);
    yPosition += 5;

    yPosition = addSubsection("2.3 Rational Method Formula", yPosition);
    yPosition = addCalculationText(`Qp = C × i × A`, yPosition);
    yPosition = addCalculationText(`Qp = ${catchmentData.weightedRunoffCoefficient.toFixed(3)} × ${intensityMS.toExponential(3)} × ${catchmentData.area.toFixed(0)}`, yPosition);
    yPosition = addCalculationText(`Qp = ${results.peakFlow.toFixed(6)} m³/s`, yPosition);
    yPosition = addCalculationText(`Qp = ${results.peakFlow.toFixed(3)} m³/s`, yPosition);
    yPosition = addCalculationText(`Qp = ${(results.peakFlow * 60000).toFixed(1)} L/min`, yPosition);
    yPosition += 10;

    // Check if we need a new page
    if (yPosition > pageHeight - 100) {
      doc.addPage();
      yPosition = 20;
    }

    // Channel Geometry Calculations
    yPosition = addSectionHeader("3. Channel Geometry Calculations", yPosition);
    
    if (channelData.shape === "trapezoid") {
      yPosition = addSubsection("3.1 Trapezoidal Channel Geometry", yPosition);
      yPosition = addCalculationText(`Cross-sectional Area: A = ½ × (T + b) × y`, yPosition);
      yPosition = addCalculationText(`Top Width: T = b + 2zy = ${channelData.bottomWidth.toFixed(2)} + 2 × ${channelData.sideSlope.toFixed(2)} × ${results.normalDepth.toFixed(3)}`, yPosition);
      yPosition = addCalculationText(`T = ${channelData.bottomWidth.toFixed(2)} + ${(2 * channelData.sideSlope * results.normalDepth).toFixed(3)} = ${(channelData.bottomWidth + 2 * channelData.sideSlope * results.normalDepth).toFixed(3)} m`, yPosition);
      yPosition = addCalculationText(`Area: A = ½ × (${(channelData.bottomWidth + 2 * channelData.sideSlope * results.normalDepth).toFixed(3)} + ${channelData.bottomWidth.toFixed(2)}) × ${results.normalDepth.toFixed(3)}`, yPosition);
      yPosition = addCalculationText(`A = ½ × ${(channelData.bottomWidth + 2 * channelData.sideSlope * results.normalDepth + channelData.bottomWidth).toFixed(3)} × ${results.normalDepth.toFixed(3)}`, yPosition);
      yPosition = addCalculationText(`A = ${results.area.toFixed(3)} m²`, yPosition);
      yPosition += 5;

      yPosition = addCalculationText(`Wetted Perimeter: P = b + 2×y×√(1 + z²)`, yPosition);
      yPosition = addCalculationText(`P = ${channelData.bottomWidth.toFixed(2)} + 2 × ${results.normalDepth.toFixed(3)} × √(1 + ${channelData.sideSlope.toFixed(2)}²)`, yPosition);
      yPosition = addCalculationText(`P = ${channelData.bottomWidth.toFixed(2)} + 2 × ${results.normalDepth.toFixed(3)} × √(1 + ${Math.pow(channelData.sideSlope, 2).toFixed(3)})`, yPosition);
      yPosition = addCalculationText(`P = ${channelData.bottomWidth.toFixed(2)} + 2 × ${results.normalDepth.toFixed(3)} × ${Math.sqrt(1 + Math.pow(channelData.sideSlope, 2)).toFixed(3)}`, yPosition);
      yPosition = addCalculationText(`P = ${channelData.bottomWidth.toFixed(2)} + ${(2 * results.normalDepth * Math.sqrt(1 + Math.pow(channelData.sideSlope, 2))).toFixed(3)}`, yPosition);
      yPosition = addCalculationText(`P = ${results.perimeter.toFixed(3)} m`, yPosition);
      yPosition += 5;

      yPosition = addCalculationText(`Hydraulic Radius: R = A / P`, yPosition);
      yPosition = addCalculationText(`R = ${results.area.toFixed(3)} / ${results.perimeter.toFixed(3)}`, yPosition);
      yPosition = addCalculationText(`R = ${results.hydraulicRadius.toFixed(4)} m`, yPosition);
    } else {
      yPosition = addSubsection("3.1 U-shaped Channel Geometry", yPosition);
      yPosition = addCalculationText(`Channel Parameters:`, yPosition);
      yPosition = addCalculationText(`• Width (W) = ${channelData.width.toFixed(3)} m`, yPosition);
      yPosition = addCalculationText(`• Radius (R) = W/2 = ${channelData.radius.toFixed(3)} m`, yPosition);
      yPosition = addCalculationText(`• Flow Depth (y) = ${channelData.flowDepth.toFixed(3)} m`, yPosition);
      yPosition += 5;

      if (channelData.flowDepth <= channelData.radius) {
        yPosition = addCalculationText(`Case: y ≤ R (Water within semicircular bottom)`, yPosition);
        yPosition = addCalculationText(`θ = 2 × cos⁻¹(1 - y/R)`, yPosition);
        yPosition = addCalculationText(`θ = 2 × cos⁻¹(1 - ${channelData.flowDepth.toFixed(3)}/${channelData.radius.toFixed(3)})`, yPosition);
        yPosition = addCalculationText(`θ = 2 × cos⁻¹(${(1 - channelData.flowDepth / channelData.radius).toFixed(3)})`, yPosition);
        yPosition = addCalculationText(`θ = ${(2 * Math.acos(1 - channelData.flowDepth / channelData.radius)).toFixed(3)} radians`, yPosition);
        yPosition += 5;

        yPosition = addCalculationText(`Cross-sectional Area: A = (R²/2) × (θ - sin(θ))`, yPosition);
        yPosition = addCalculationText(`A = (${channelData.radius.toFixed(3)}²/2) × (${(2 * Math.acos(1 - channelData.flowDepth / channelData.radius)).toFixed(3)} - sin(${(2 * Math.acos(1 - channelData.flowDepth / channelData.radius)).toFixed(3)}))`, yPosition);
        yPosition = addCalculationText(`A = ${(Math.pow(channelData.radius, 2) / 2).toFixed(4)} × (${(2 * Math.acos(1 - channelData.flowDepth / channelData.radius)).toFixed(3)} - ${Math.sin(2 * Math.acos(1 - channelData.flowDepth / channelData.radius)).toFixed(3)})`, yPosition);
        yPosition = addCalculationText(`A = ${results.area.toFixed(3)} m²`, yPosition);
        yPosition += 5;

        yPosition = addCalculationText(`Wetted Perimeter: P = R × θ`, yPosition);
        yPosition = addCalculationText(`P = ${channelData.radius.toFixed(3)} × ${(2 * Math.acos(1 - channelData.flowDepth / channelData.radius)).toFixed(3)}`, yPosition);
        yPosition = addCalculationText(`P = ${results.perimeter.toFixed(3)} m`, yPosition);
      } else {
        yPosition = addCalculationText(`Case: y > R (Water extends above semicircular bottom)`, yPosition);
        yPosition = addCalculationText(`Cross-sectional Area: A = (π×R²/2) + (y-R)×W`, yPosition);
        yPosition = addCalculationText(`A = (π×${channelData.radius.toFixed(3)}²/2) + (${channelData.flowDepth.toFixed(3)}-${channelData.radius.toFixed(3)})×${channelData.width.toFixed(3)}`, yPosition);
        yPosition = addCalculationText(`A = ${(Math.PI * Math.pow(channelData.radius, 2) / 2).toFixed(3)} + ${(channelData.flowDepth - channelData.radius).toFixed(3)}×${channelData.width.toFixed(3)}`, yPosition);
        yPosition = addCalculationText(`A = ${(Math.PI * Math.pow(channelData.radius, 2) / 2).toFixed(3)} + ${((channelData.flowDepth - channelData.radius) * channelData.width).toFixed(3)}`, yPosition);
        yPosition = addCalculationText(`A = ${results.area.toFixed(3)} m²`, yPosition);
        yPosition += 5;

        yPosition = addCalculationText(`Wetted Perimeter: P = π×R + 2×(y-R)`, yPosition);
        yPosition = addCalculationText(`P = π×${channelData.radius.toFixed(3)} + 2×(${channelData.flowDepth.toFixed(3)}-${channelData.radius.toFixed(3)})`, yPosition);
        yPosition = addCalculationText(`P = ${(Math.PI * channelData.radius).toFixed(3)} + 2×${(channelData.flowDepth - channelData.radius).toFixed(3)}`, yPosition);
        yPosition = addCalculationText(`P = ${(Math.PI * channelData.radius).toFixed(3)} + ${(2 * (channelData.flowDepth - channelData.radius)).toFixed(3)}`, yPosition);
        yPosition = addCalculationText(`P = ${results.perimeter.toFixed(3)} m`, yPosition);
      }
      yPosition += 5;

      yPosition = addCalculationText(`Hydraulic Radius: R = A / P`, yPosition);
      yPosition = addCalculationText(`R = ${results.area.toFixed(3)} / ${results.perimeter.toFixed(3)}`, yPosition);
      yPosition = addCalculationText(`R = ${results.hydraulicRadius.toFixed(4)} m`, yPosition);
    }
    yPosition += 10;

    // Check if we need a new page
    if (yPosition > pageHeight - 100) {
      doc.addPage();
      yPosition = 20;
    }

    // Manning's Equation Calculations
    yPosition = addSectionHeader("4. Manning's Equation - Channel Capacity", yPosition);
    
    yPosition = addSubsection("4.1 Channel Parameters", yPosition);
    yPosition = addRegularText(`• Shape: ${channelData.shape === "trapezoid" ? "Trapezoidal" : "U-shaped"}`, yPosition);
    if (channelData.shape === "trapezoid") {
      yPosition = addRegularText(`• Bottom Width (b) = ${channelData.bottomWidth.toFixed(2)} m`, yPosition);
      yPosition = addRegularText(`• Side Slope (z) = ${channelData.sideSlope.toFixed(2)} H:V`, yPosition);
    } else {
      yPosition = addRegularText(`• Channel Width (W) = ${channelData.width.toFixed(2)} m`, yPosition);
      yPosition = addRegularText(`• Bottom Radius (R) = ${channelData.radius.toFixed(2)} m`, yPosition);
      yPosition = addRegularText(`• Flow Depth (y) = ${channelData.flowDepth.toFixed(3)} m`, yPosition);
    }
    yPosition = addRegularText(`• Longitudinal Slope (S) = ${channelData.longitudinalSlope.toFixed(4)} m/m`, yPosition);
    yPosition = addRegularText(`• Manning's n = ${channelData.manningN.toFixed(3)}`, yPosition);
    yPosition += 5;

    yPosition = addSubsection("4.2 Calculated Geometry", yPosition);
    yPosition = addRegularText(`• Normal Depth (y) = ${results.normalDepth.toFixed(3)} m`, yPosition);
    yPosition = addRegularText(`• Cross-sectional Area (A) = ${results.area.toFixed(3)} m²`, yPosition);
    yPosition = addRegularText(`• Wetted Perimeter (P) = ${results.perimeter.toFixed(3)} m`, yPosition);
    yPosition = addRegularText(`• Hydraulic Radius (R) = ${results.hydraulicRadius.toFixed(4)} m`, yPosition);
    yPosition += 5;

    yPosition = addSubsection("4.3 Manning's Equation Formula", yPosition);
    yPosition = addCalculationText(`Q = (1/n) × A × R^(2/3) × S^(1/2)`, yPosition);
    yPosition = addCalculationText(`Q = (1/${channelData.manningN.toFixed(3)}) × ${results.area.toFixed(3)} × ${results.hydraulicRadius.toFixed(4)}^(2/3) × ${channelData.longitudinalSlope.toFixed(4)}^(1/2)`, yPosition);
    yPosition = addCalculationText(`Q = ${(1/channelData.manningN).toFixed(2)} × ${results.area.toFixed(3)} × ${Math.pow(results.hydraulicRadius, 2/3).toFixed(4)} × ${Math.pow(channelData.longitudinalSlope, 1/2).toFixed(4)}`, yPosition);
    yPosition = addCalculationText(`Q = ${results.calculatedFlow.toFixed(6)} m³/s`, yPosition);
    yPosition = addCalculationText(`Q = ${results.calculatedFlow.toFixed(3)} m³/s`, yPosition);
    yPosition = addCalculationText(`Q = ${(results.calculatedFlow * 60000).toFixed(1)} L/min`, yPosition);
    yPosition += 10;

    // Check if we need a new page
    if (yPosition > pageHeight - 100) {
      doc.addPage();
      yPosition = 20;
    }

    // Design Validation
    yPosition = addSectionHeader("5. Design Validation", yPosition);
    
    yPosition = addSubsection("5.1 Flow Capacity Check", yPosition);
    yPosition = addRegularText(`• Required Peak Flow = ${results.peakFlow.toFixed(3)} m³/s (${(results.peakFlow * 60000).toFixed(1)} L/min)`, yPosition);
    yPosition = addRegularText(`• Channel Capacity = ${results.calculatedFlow.toFixed(3)} m³/s (${(results.calculatedFlow * 60000).toFixed(1)} L/min)`, yPosition);
    yPosition = addRegularText(`• Flow Ratio = ${(results.calculatedFlow/results.peakFlow).toFixed(3)}`, yPosition);
    yPosition = addRegularText(`• Status: ${(results.calculatedFlow/results.peakFlow) >= 0.95 ? "✓ Adequate" : "✗ Insufficient"}`, yPosition);
    yPosition += 5;

    yPosition = addSubsection("5.2 Velocity Check", yPosition);
    yPosition = addRegularText(`• Calculated Velocity = ${results.velocity.toFixed(2)} m/s`, yPosition);
    if (channelData.shape === "u-shaped") {
      yPosition = addRegularText(`• Min. Recommended = 0.3 m/s`, yPosition);
      yPosition = addRegularText(`• Max. Permissible = 4.0 m/s (TGN 43)`, yPosition);
    } else {
      yPosition = addRegularText(`• Min. Recommended = 0.3 m/s`, yPosition);
      yPosition = addRegularText(`• Max. Recommended = 4.0 m/s`, yPosition);
    }
    yPosition = addRegularText(`• Status: ${results.velocity >= 0.3 && (channelData.shape === "u-shaped" ? results.velocity <= 4.0 : results.velocity <= 4.0) ? "✓ Acceptable" : "✗ Outside Range"}`, yPosition);
    yPosition += 5;

    if (channelData.shape === "u-shaped") {
      yPosition = addSubsection("5.3 TGN 43 Compliance Check", yPosition);
      yPosition = addRegularText(`• Channel Width = ${(channelData.width * 1000).toFixed(0)} mm`, yPosition);
      yPosition = addRegularText(`• TGN 43 Limit = 600 mm`, yPosition);
      yPosition = addRegularText(`• Status: ${channelData.width <= 0.6 ? "✓ Compliant" : "✗ Exceeds Limit"}`, yPosition);
      yPosition += 5;
    }

    // Final Results Summary
    yPosition = addSectionHeader("6. Final Design Summary", yPosition);
    
    // Create a summary table
    const summaryData = [
      ["Parameter", "Value", "Unit"],
      ["Peak Flow", results.peakFlow.toFixed(3), "m³/s"],
      ["Peak Flow", (results.peakFlow * 60000).toFixed(1), "L/min"],
      ["Channel Capacity", results.calculatedFlow.toFixed(3), "m³/s"],
      ["Channel Capacity", (results.calculatedFlow * 60000).toFixed(1), "L/min"],
      ["Velocity", results.velocity.toFixed(2), "m/s"],
      ["Normal Depth", results.normalDepth.toFixed(3), "m"],
      ["Cross-sectional Area", results.area.toFixed(3), "m²"],
      ["Wetted Perimeter", results.perimeter.toFixed(3), "m"],
      ["Hydraulic Radius", results.hydraulicRadius.toFixed(4), "m"],
      ["Design Status", results.status, ""],
    ];

    autoTable(doc, {
      head: [summaryData[0]],
      body: summaryData.slice(1),
      startY: yPosition,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [66, 139, 202] },
    });

    // Footer
    const finalY = (doc as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 20;
    doc.setFontSize(8);
    doc.setFont("arial", "italic");
    doc.setTextColor(128, 128, 128);
    doc.text("Generated by Slope Drainage Design Tool", pageWidth / 2, finalY, { align: "center" });
    doc.text("Based on Rational Method and Manning's Equation", pageWidth / 2, finalY + 5, { align: "center" });

    // Save the PDF
    const fileName = `Channel_Design_${channelNo || "Unknown"}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  return (
    <Button 
      onClick={generatePDF}
      disabled={!results}
      className="w-full"
      variant="outline"
    >
      📄 Export Detailed Calculations to PDF
    </Button>
  );
}

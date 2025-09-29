"use client";

import { Button } from "@/components/ui/button";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { BatchCalculationResult, ChannelAlignment } from "../types";

interface BatchPDFExportProps {
  results: BatchCalculationResult[];
  channels: ChannelAlignment[];
}

export default function BatchPDFExport({ results, channels }: BatchPDFExportProps) {
  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;

    // Helper function to add text with automatic line breaks
    const addText = (text: string, x: number, y: number, options: { lineHeight?: number } = {}) => {
      const lines = doc.splitTextToSize(text, pageWidth - x - 20) as string[];
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

    // Helper function to check if we need a new page
    const checkNewPage = (y: number, requiredSpace: number = 50) => {
      if (y > pageHeight - requiredSpace) {
        doc.addPage();
        return 20;
      }
      return y;
    };

    // Title and Project Information
    doc.setFontSize(18);
    doc.setFont("arial", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("Batch Channel Design Report", pageWidth / 2, yPosition, { align: "center" });
    yPosition += 15;

    doc.setFontSize(12);
    doc.setFont("arial", "normal");
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, yPosition);
    yPosition += 8;
    doc.text(`Time: ${new Date().toLocaleTimeString()}`, 20, yPosition);
    yPosition += 8;
    doc.text(`Total Catchments: ${results.length}`, 20, yPosition);
    yPosition += 8;
    doc.text(`Successful Designs: ${results.filter(r => r.status === "OK").length}`, 20, yPosition);
    yPosition += 8;
    doc.text(`Failed Designs: ${results.filter(r => r.status === "Not OK").length}`, 20, yPosition);
    yPosition += 15;

    // Check if we need a new page
    yPosition = checkNewPage(yPosition);

    // Summary Table
    yPosition = addSectionHeader("1. Batch Design Summary", yPosition);
    
    const summaryData = [
      ["Catchment Name", "Channel Name", "Peak Flow (m³/s)", "Channel Size", "Velocity (m/s)", "Status"],
      ...results.map(result => {
        const linkedChannel = channels.find(channel => channel.linkedCatchmentId === result.catchmentId);
        const channelName = linkedChannel ? linkedChannel.name : (result.channelShape ? `${result.channelShape} channel` : 'Channel');
        
        return [
          result.catchmentName,
          channelName,
          result.peakFlow.toFixed(3),
          result.selectedChannelSize,
          result.velocity.toFixed(2),
          result.status
        ];
      })
    ];

    autoTable(doc, {
      head: [summaryData[0]],
      body: summaryData.slice(1),
      startY: yPosition,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 139, 202] },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 25 },
        2: { cellWidth: 20 },
        3: { cellWidth: 20 },
        4: { cellWidth: 15 },
        5: { cellWidth: 15 }
      }
    });

    yPosition = (doc as typeof doc & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 20;

    // Process each catchment individually
    results.forEach((result, index) => {
      // Find the linked channel
      const linkedChannel = channels.find(channel => channel.linkedCatchmentId === result.catchmentId);
      const channelName = linkedChannel ? linkedChannel.name : (result.channelShape ? `${result.channelShape} channel` : 'Channel');

      // Catchment Header - always check for new page before major sections
      yPosition = checkNewPage(yPosition, 150);
      yPosition = addSectionHeader(`${index + 2}. ${result.catchmentName} - ${channelName}`, yPosition);

      // Input Parameters
      yPosition = checkNewPage(yPosition, 80);
      yPosition = addSubsection(`${index + 2}.1 Input Parameters`, yPosition);
      yPosition = addRegularText(`• Catchment Name: ${result.catchmentName}`, yPosition);
      yPosition = addRegularText(`• Channel Name: ${channelName}`, yPosition);
      yPosition = addRegularText(`• Catchment Area: ${result.catchmentTC > 0 ? 'Calculated from terrain' : 'Not available'} m²`, yPosition);
      yPosition = addRegularText(`• Surface Type: ${result.runoffCoefficient > 0 ? 'Calculated from surface' : 'Not specified'}`, yPosition);
      yPosition = addRegularText(`• Runoff Coefficient: ${result.runoffCoefficient.toFixed(3)}`, yPosition);
      yPosition = addRegularText(`• Return Period: ${result.returnPeriod} years`, yPosition);
      yPosition = addRegularText(`• Channel Shape: ${result.channelShape === "trapezoidal" ? "Trapezoidal" : "U-Channel"}`, yPosition);
      yPosition = addRegularText(`• Channel Material: ${result.channelMaterial || 'Not specified'}`, yPosition);
      yPosition = addRegularText(`• Channel Gradient: ${result.channelGradient?.toFixed(4) || 'Not calculated'} m/m`, yPosition);
      yPosition += 5;

      // Time of Concentration Calculation
      yPosition = checkNewPage(yPosition, 50);
      yPosition = addSubsection(`${index + 2}.2 Time of Concentration Calculation`, yPosition);
      yPosition = addCalculationText(`Catchment TC: ${result.catchmentTC.toFixed(1)} minutes`, yPosition);
      yPosition = addCalculationText(`Upstream TC: ${result.upstreamTC.toFixed(1)} minutes`, yPosition);
      yPosition = addCalculationText(`Effective TC: ${result.effectiveTC.toFixed(1)} minutes`, yPosition);
      yPosition += 5;

      // Peak Flow Calculation
      yPosition = checkNewPage(yPosition, 50);
      yPosition = addSubsection(`${index + 2}.3 Peak Flow Calculation (Rational Method)`, yPosition);
      yPosition = addCalculationText(`Formula: Qp = C × i × A`, yPosition);
      yPosition = addCalculationText(`Runoff Coefficient (C): ${result.runoffCoefficient.toFixed(3)}`, yPosition);
      yPosition = addCalculationText(`Rainfall Intensity (i): ${result.rainfallIntensity.toFixed(1)} mm/hr`, yPosition);
      yPosition = addCalculationText(`Peak Flow: ${result.peakFlow.toFixed(3)} m³/s (${(result.peakFlow * 1000).toFixed(1)} L/s)`, yPosition);
      yPosition += 5;

      // Channel Design
      yPosition = checkNewPage(yPosition, 50);
      yPosition = addSubsection(`${index + 2}.4 Channel Design`, yPosition);
      yPosition = addCalculationText(`Required Width: ${result.requiredChannelWidth.toFixed(3)} m`, yPosition);
      yPosition = addCalculationText(`Selected Width: ${result.selectedChannelWidth.toFixed(3)} m`, yPosition);
      yPosition = addCalculationText(`Selected Size: ${result.selectedChannelSize}`, yPosition);
      yPosition += 5;

      // Manning's Equation Details
      if (result.manningN && result.channelArea && result.hydraulicRadius && result.channelGradient) {
        yPosition = checkNewPage(yPosition, 100);
        yPosition = addSubsection(`${index + 2}.5 Manning's Equation Details`, yPosition);
        yPosition = addCalculationText(`Flow calculation checking for ${result.selectedChannelSize} channel`, yPosition);
        yPosition = addCalculationText(`Manning's n: ${result.manningN.toFixed(3)} (${result.channelMaterial})`, yPosition);
        yPosition = addCalculationText(`Cross-sectional Area: ${result.channelArea.toFixed(3)} m²`, yPosition);
        yPosition = addCalculationText(`Wetted Perimeter: ${result.wettedPerimeter?.toFixed(3) || 'N/A'} m`, yPosition);
        yPosition = addCalculationText(`Hydraulic Radius: ${result.hydraulicRadius.toFixed(4)} m`, yPosition);
        yPosition = addCalculationText(`Channel Gradient: ${result.channelGradient.toFixed(4)} m/m`, yPosition);
        yPosition += 5;

        yPosition = addCalculationText(`Manning's Equation: Q = (1/n) × A × R^(2/3) × S^(1/2)`, yPosition);
        yPosition = addCalculationText(`Q = (1/${result.manningN.toFixed(3)}) × ${result.channelArea.toFixed(3)} × ${result.hydraulicRadius.toFixed(4)}^(2/3) × ${result.channelGradient.toFixed(4)}^(1/2)`, yPosition);
        yPosition = addCalculationText(`Q = ${(1/result.manningN).toFixed(2)} × ${result.channelArea.toFixed(3)} × ${Math.pow(result.hydraulicRadius, 2/3).toFixed(4)} × ${Math.pow(result.channelGradient, 1/2).toFixed(4)}`, yPosition);
        yPosition = addCalculationText(`Q = ${result.calculatedFlow.toFixed(3)} m³/s`, yPosition);
        yPosition += 5;
      }

      // Design Validation
      yPosition = checkNewPage(yPosition, 80);
      yPosition = addSubsection(`${index + 2}.6 Design Validation`, yPosition);
      
      // Channel Utilization Check
      const utilization = result.peakFlow / result.calculatedFlow;
      yPosition = addCalculationText(`Channel Utilization: ${(utilization * 100).toFixed(1)}%`, yPosition);
      yPosition = addCalculationText(`Flow Required: ${result.peakFlow.toFixed(3)} m³/s`, yPosition);
      yPosition = addCalculationText(`Flow Allowed: ${result.calculatedFlow.toFixed(3)} m³/s`, yPosition);
      yPosition = addCalculationText(`Status: ${utilization <= 1.0 ? "✓ Acceptable (≤100%)" : "✗ Exceeds 100%"}`, yPosition);
      yPosition += 5;

      // Velocity Check
      yPosition = addCalculationText(`Velocity: ${result.velocity.toFixed(2)} m/s`, yPosition);
      yPosition = addCalculationText(`Min. Required: 0.3 m/s`, yPosition);
      yPosition = addCalculationText(`Max. Recommended: 4.0 m/s`, yPosition);
      if (result.velocityWarning) {
        yPosition = addCalculationText(`Warning: ${result.velocityWarning}`, yPosition);
      }
      yPosition += 5;

      // Overall Status
      yPosition = addCalculationText(`Overall Design Status: ${result.status}`, yPosition);
      if (result.error) {
        yPosition = addCalculationText(`Error: ${result.error}`, yPosition);
      }
      yPosition += 15; // Extra space between catchments
    });

    // Footer
    yPosition = checkNewPage(yPosition, 30);
    doc.setFontSize(8);
    doc.setFont("arial", "italic");
    doc.setTextColor(128, 128, 128);
    doc.text("Generated by Batch Channel Design Tool", pageWidth / 2, yPosition, { align: "center" });
    doc.text("Based on Rational Method and Manning's Equation", pageWidth / 2, yPosition + 5, { align: "center" });

    // Save the PDF
    const fileName = `Batch_Channel_Design_${new Date().toISOString().split('T')[0]}.pdf`;
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

import * as XLSX from 'xlsx';
import { BatchChannelResult, BatchProcessingSummary } from './batchProcessor';

// Export batch results to Excel
export function exportBatchResultsToExcel(
  summary: BatchProcessingSummary,
  filename?: string
): void {
  const workbook = XLSX.utils.book_new();

  // Create main results sheet
  const resultsData = summary.results.map(result => ({
    'Catchment ID': result.channelId,
    'Catchment Name': (result as any).catchmentName || '',
    'Channel Name': (result as any).channelName || '',
    'Time of Concentration (min)': result.timeOfConcentration.toFixed(1),
    'Peak Flow (m³/s)': result.peakFlow.toFixed(3),
    'Peak Flow (L/s)': (result.peakFlow * 1000).toFixed(1),
    'Required Width (m)': result.requiredChannelWidth.toFixed(3),
    'Selected Width (m)': result.selectedChannelWidth.toFixed(3),
    'Selected Size': result.selectedChannelSize,
    'Calculated Flow (m³/s)': result.calculatedFlow.toFixed(3),
    'Velocity (m/s)': result.velocity.toFixed(2),
    'Design Status': result.status,
    'Error/Warning': result.error || result.velocityWarning || '',
    'Catchment TC (min)': result.catchmentTC.toFixed(1),
    'Upstream TC (min)': result.upstreamTC.toFixed(1),
    'Effective TC (min)': result.effectiveTC.toFixed(1),
    'Rainfall Intensity (mm/hr)': result.rainfallIntensity.toFixed(1),
    'Runoff Coefficient': result.runoffCoefficient.toFixed(2),
    'Processed': result.processed ? 'Yes' : 'No',
    'Processing Error': result.processingError || '',
  }));

  const resultsSheet = XLSX.utils.json_to_sheet(resultsData);
  
  // Set column widths
  resultsSheet['!cols'] = [
    { wch: 12 }, // Catchment ID
    { wch: 20 }, // Catchment Name
    { wch: 20 }, // Channel Name
    { wch: 15 }, // Time of Concentration
    { wch: 15 }, // Peak Flow m³/s
    { wch: 15 }, // Peak Flow L/s
    { wch: 15 }, // Required Width
    { wch: 15 }, // Selected Width
    { wch: 15 }, // Selected Size
    { wch: 15 }, // Calculated Flow
    { wch: 12 }, // Velocity
    { wch: 12 }, // Design Status
    { wch: 30 }, // Error/Warning
    { wch: 15 }, // Catchment TC
    { wch: 15 }, // Upstream TC
    { wch: 15 }, // Effective TC
    { wch: 18 }, // Rainfall Intensity
    { wch: 15 }, // Runoff Coefficient
    { wch: 10 }, // Processed
    { wch: 30 }, // Processing Error
  ];

  XLSX.utils.book_append_sheet(workbook, resultsSheet, 'Channel Design Results');

  // Create summary sheet
  const summaryData = [
    { Metric: 'Total Channels', Value: summary.totalChannels },
    { Metric: 'Processed Channels', Value: summary.processedChannels },
    { Metric: 'Successful Designs', Value: summary.successfulChannels },
    { Metric: 'Failed Designs', Value: summary.failedChannels },
    { Metric: 'Success Rate (%)', Value: summary.totalChannels > 0 ? ((summary.successfulChannels / summary.totalChannels) * 100).toFixed(1) : '0' },
    { Metric: 'Processing Time (ms)', Value: summary.processingTime },
    { Metric: 'Processing Time (s)', Value: (summary.processingTime / 1000).toFixed(2) },
    { Metric: 'Average Time per Channel (ms)', Value: summary.totalChannels > 0 ? (summary.processingTime / summary.totalChannels).toFixed(0) : '0' },
  ];

  const summarySheet = XLSX.utils.json_to_sheet(summaryData);
  summarySheet['!cols'] = [{ wch: 25 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Processing Summary');

  // Create errors sheet if there are errors
  if (summary.errors.length > 0) {
    const errorsData = summary.errors.map((error, index) => ({
      'Error #': index + 1,
      'Error Message': error,
    }));

    const errorsSheet = XLSX.utils.json_to_sheet(errorsData);
    errorsSheet['!cols'] = [{ wch: 10 }, { wch: 80 }];
    XLSX.utils.book_append_sheet(workbook, errorsSheet, 'Errors');
  }

  // Create detailed calculations sheet
  const detailedData = summary.results.map(result => ({
    'Catchment ID': result.channelId,
    'Catchment Name': (result as any).catchmentName || '',
    'Channel Name': (result as any).channelName || '',
    'Catchment Area (m²)': '', // This would need to be passed from input data
    'Average Slope (m/100m)': '',
    'Flow Path Length (m)': '',
    'Surface Type': '',
    'Upstream Channel TCs (min)': result.upstreamTC > 0 ? result.upstreamTC.toFixed(1) : '',
    'Return Period (years)': '',
    'Use IDF': '',
    'Channel Shape': '',
    'Channel Gradient (m/m)': '',
    'Channel Material': '',
    'Catchment TC (min)': result.catchmentTC.toFixed(1),
    'Upstream TC (min)': result.upstreamTC.toFixed(1),
    'Effective TC (min)': result.effectiveTC.toFixed(1),
    'Rainfall Intensity (mm/hr)': result.rainfallIntensity.toFixed(1),
    'Runoff Coefficient': result.runoffCoefficient.toFixed(2),
    'Peak Flow (m³/s)': result.peakFlow.toFixed(3),
    'Required Width (m)': result.requiredChannelWidth.toFixed(3),
    'Selected Width (m)': result.selectedChannelWidth.toFixed(3),
    'Calculated Flow (m³/s)': result.calculatedFlow.toFixed(3),
    'Velocity (m/s)': result.velocity.toFixed(2),
    'Design Status': result.status,
  }));

  const detailedSheet = XLSX.utils.json_to_sheet(detailedData);
  detailedSheet['!cols'] = [
    { wch: 12 }, { wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 15 },
    { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 10 }, { wch: 15 },
    { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
    { wch: 15 }, { wch: 18 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
    { wch: 15 }, { wch: 12 }, { wch: 12 }
  ];
  XLSX.utils.book_append_sheet(workbook, detailedSheet, 'Detailed Calculations');

  // Save the file
  const defaultFilename = `Channel_Design_Results_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(workbook, filename || defaultFilename);
}

// Export batch results with input data included
export function exportBatchResultsWithInputs(
  summary: BatchProcessingSummary,
  inputData: Record<string, unknown>[], // Original Excel input data
  filename?: string
): void {
  const workbook = XLSX.utils.book_new();

  // Create combined results sheet with both input and output data
  const combinedData = summary.results.map((result, index) => {
    const input = inputData[index] || {};
    return {
      // Input data
      'Catchment ID': result.channelId,
      'Catchment Name': (result as any).catchmentName || '',
      'Channel Name': (result as any).channelName || '',
      'Catchment Area (m²)': input.catchmentArea || '',
      'Average Slope (m/100m)': input.averageSlope || '',
      'Flow Path Length (m)': input.flowPathLength || '',
      'Surface Type': input.surfaceType || '',
      'Upstream Channel IDs': input.upstreamChannelIds || '',
      'Return Period (years)': input.returnPeriod || '',
      'Use IDF': input.useIDF || '',
      'Channel Shape': input.channelShape || '',
      'Channel Gradient (m/m)': input.channelGradient || '',
      'Channel Material': input.channelMaterial || '',
      
      // Calculation results
      'Time of Concentration (min)': result.timeOfConcentration.toFixed(1),
      'Peak Flow (m³/s)': result.peakFlow.toFixed(3),
      'Peak Flow (L/s)': (result.peakFlow * 1000).toFixed(1),
      'Required Width (m)': result.requiredChannelWidth.toFixed(3),
      'Selected Width (m)': result.selectedChannelWidth.toFixed(3),
      'Selected Size': result.selectedChannelSize,
      'Calculated Flow (m³/s)': result.calculatedFlow.toFixed(3),
      'Velocity (m/s)': result.velocity.toFixed(2),
      'Design Status': result.status,
      'Error/Warning': result.error || result.velocityWarning || '',
      
      // Detailed calculations
      'Catchment TC (min)': result.catchmentTC.toFixed(1),
      'Upstream TC (min)': result.upstreamTC.toFixed(1),
      'Effective TC (min)': result.effectiveTC.toFixed(1),
      'Rainfall Intensity (mm/hr)': result.rainfallIntensity.toFixed(1),
      'Runoff Coefficient': result.runoffCoefficient.toFixed(2),
    };
  });

  const combinedSheet = XLSX.utils.json_to_sheet(combinedData);
  
  // Set column widths
  combinedSheet['!cols'] = [
    { wch: 12 }, { wch: 20 }, { wch: 20 }, { wch: 18 }, { wch: 18 },
    { wch: 18 }, { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 10 }, { wch: 15 }, { wch: 18 }, { wch: 15 },
    { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
    { wch: 15 }, { wch: 12 }, { wch: 30 }, { wch: 15 }, { wch: 15 },
    { wch: 15 }, { wch: 18 }, { wch: 15 }
  ];

  XLSX.utils.book_append_sheet(workbook, combinedSheet, 'Complete Results');

  // Add summary sheet
  const summaryData = [
    { Metric: 'Total Channels', Value: summary.totalChannels },
    { Metric: 'Processed Channels', Value: summary.processedChannels },
    { Metric: 'Successful Designs', Value: summary.successfulChannels },
    { Metric: 'Failed Designs', Value: summary.failedChannels },
    { Metric: 'Success Rate (%)', Value: summary.totalChannels > 0 ? ((summary.successfulChannels / summary.totalChannels) * 100).toFixed(1) : '0' },
    { Metric: 'Processing Time (s)', Value: (summary.processingTime / 1000).toFixed(2) },
  ];

  const summarySheet = XLSX.utils.json_to_sheet(summaryData);
  summarySheet['!cols'] = [{ wch: 25 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Processing Summary');

  // Add errors sheet if there are errors
  if (summary.errors.length > 0) {
    const errorsData = summary.errors.map((error, index) => ({
      'Error #': index + 1,
      'Error Message': error,
    }));

    const errorsSheet = XLSX.utils.json_to_sheet(errorsData);
    errorsSheet['!cols'] = [{ wch: 10 }, { wch: 80 }];
    XLSX.utils.book_append_sheet(workbook, errorsSheet, 'Errors');
  }

  // Save the file
  const defaultFilename = `Channel_Design_Complete_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(workbook, filename || defaultFilename);
}

// Export individual channel result to Excel (for single channel design)
export function exportSingleChannelResult(
  result: BatchChannelResult,
  inputData?: Record<string, unknown>,
  filename?: string
): void {
  const workbook = XLSX.utils.book_new();

  // Create results sheet
  const resultData = [
    { Parameter: 'Channel ID', Value: result.channelId },
    // { Parameter: 'Channel Name', Value: result.channelName }, // Removed - not in simplified interface
    // { Parameter: 'Description', Value: result.description || '' }, // Removed - not in simplified interface
    { Parameter: '', Value: '' },
    { Parameter: 'DESIGN RESULTS', Value: '' },
    { Parameter: 'Time of Concentration (min)', Value: result.timeOfConcentration.toFixed(1) },
    { Parameter: 'Peak Flow (m³/s)', Value: result.peakFlow.toFixed(3) },
    { Parameter: 'Peak Flow (L/s)', Value: (result.peakFlow * 1000).toFixed(1) },
    { Parameter: 'Required Width (m)', Value: result.requiredChannelWidth.toFixed(3) },
    { Parameter: 'Selected Width (m)', Value: result.selectedChannelWidth.toFixed(3) },
    { Parameter: 'Selected Size', Value: result.selectedChannelSize },
    { Parameter: 'Calculated Flow (m³/s)', Value: result.calculatedFlow.toFixed(3) },
    { Parameter: 'Velocity (m/s)', Value: result.velocity.toFixed(2) },
    { Parameter: 'Design Status', Value: result.status },
    { Parameter: 'Error/Warning', Value: result.error || result.velocityWarning || '' },
    { Parameter: '', Value: '' },
    { Parameter: 'DETAILED CALCULATIONS', Value: '' },
    { Parameter: 'Catchment TC (min)', Value: result.catchmentTC.toFixed(1) },
    { Parameter: 'Upstream TC (min)', Value: result.upstreamTC.toFixed(1) },
    { Parameter: 'Effective TC (min)', Value: result.effectiveTC.toFixed(1) },
    { Parameter: 'Rainfall Intensity (mm/hr)', Value: result.rainfallIntensity.toFixed(1) },
    { Parameter: 'Runoff Coefficient', Value: result.runoffCoefficient.toFixed(2) },
  ];

  const resultSheet = XLSX.utils.json_to_sheet(resultData);
  resultSheet['!cols'] = [{ wch: 25 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(workbook, resultSheet, 'Channel Design Result');

  // Add input data sheet if provided
  if (inputData) {
    const inputDataArray = Object.entries(inputData).map(([key, value]) => ({
      Parameter: key,
      Value: value,
    }));

    const inputSheet = XLSX.utils.json_to_sheet(inputDataArray);
    inputSheet['!cols'] = [{ wch: 25 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(workbook, inputSheet, 'Input Parameters');
  }

  // Save the file
  const defaultFilename = `Channel_${result.channelId}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(workbook, filename || defaultFilename);
}

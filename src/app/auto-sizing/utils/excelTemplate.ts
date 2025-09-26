import * as XLSX from 'xlsx';

// Define the structure for Excel template data
export interface ExcelChannelData {
  // Basic Information
  channelId: string;
  
  // Catchment Information
  catchmentArea: number; // m²
  averageSlope: number; // m per 100m
  flowPathLength: number; // m
  surfaceType: string; // surface type ID
  
  // Upstream Channels (comma-separated channel IDs only - TCs will be calculated automatically)
  upstreamChannelIds: string; // e.g., "CH-001,CH-002"
  
  // Rainfall Information
  returnPeriod: number; // years
  useIDF: boolean;
  
  // Channel Configuration
  channelShape: "trapezoidal" | "u-channel";
  channelGradient: number; // m/m
  channelMaterial: string; // material type
}

// Surface types for reference
export const SURFACE_TYPES = [
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
];

// Channel materials for reference
export const CHANNEL_MATERIALS = [
  { id: "concrete", name: "Concrete", manningN: 0.013 },
  { id: "asphalt", name: "Asphalt", manningN: 0.016 },
  { id: "brick", name: "Brick", manningN: 0.015 },
  { id: "stone", name: "Stone", manningN: 0.025 },
  { id: "earth", name: "Earth", manningN: 0.025 },
  { id: "grass", name: "Grass", manningN: 0.035 },
  { id: "gravel", name: "Gravel", manningN: 0.030 },
  { id: "riprap", name: "Riprap", manningN: 0.040 },
];

// Generate Excel template
export function generateExcelTemplate(): void {
  // Create sample data for template
  const sampleData: ExcelChannelData[] = [
    {
      channelId: "CH-001",
      catchmentArea: 1000,
      averageSlope: 5,
      flowPathLength: 200,
      surfaceType: "asphalt",
      upstreamChannelIds: "",
      returnPeriod: 10,
      useIDF: true,
      channelShape: "trapezoidal",
      channelGradient: 0.01,
      channelMaterial: "concrete",
    },
    {
      channelId: "CH-002",
      catchmentArea: 500,
      averageSlope: 3,
      flowPathLength: 150,
      surfaceType: "lawn",
      upstreamChannelIds: "",
      returnPeriod: 10,
      useIDF: true,
      channelShape: "u-channel",
      channelGradient: 0.008,
      channelMaterial: "concrete",
    },
    {
      channelId: "CH-003",
      catchmentArea: 800,
      averageSlope: 4,
      flowPathLength: 180,
      surfaceType: "gravel",
      upstreamChannelIds: "CH-001,CH-002",
      returnPeriod: 25,
      useIDF: true,
      channelShape: "trapezoidal",
      channelGradient: 0.012,
      channelMaterial: "concrete",
    },
  ];

  // Create workbook
  const workbook = XLSX.utils.book_new();

  // Create main data sheet
  const worksheet = XLSX.utils.json_to_sheet(sampleData, {
    header: [
      "channelId", "catchmentArea", "averageSlope",
      "flowPathLength", "surfaceType", "upstreamChannelIds",
      "returnPeriod", "useIDF", "channelShape", "channelGradient", "channelMaterial"
    ]
  });

  // Add headers with descriptions
  const headers = [
    "Channel ID", "Catchment Area (m²)", "Average Slope (m/100m)",
    "Flow Path Length (m)", "Surface Type", "Upstream Channel IDs",
    "Return Period (years)", "Use IDF", "Channel Shape", "Channel Gradient (m/m)", "Channel Material"
  ];

  // Replace header row
  XLSX.utils.sheet_add_aoa(worksheet, [headers], { origin: "A1" });

  // Add data starting from row 2
  const dataRows = sampleData.map(row => [
    row.channelId, row.catchmentArea, row.averageSlope,
    row.flowPathLength, row.surfaceType, row.upstreamChannelIds,
    row.returnPeriod, row.useIDF, row.channelShape, row.channelGradient, row.channelMaterial
  ]);
  
  XLSX.utils.sheet_add_aoa(worksheet, dataRows, { origin: "A2" });

  // Set column widths
  const colWidths = [
    { wch: 12 }, { wch: 18 }, { wch: 18 },
    { wch: 18 }, { wch: 15 }, { wch: 20 },
    { wch: 15 }, { wch: 10 }, { wch: 15 }, { wch: 18 }, { wch: 15 }
  ];
  worksheet['!cols'] = colWidths;

  // Add the worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, "Channel Design Data");

  // Create reference sheet with valid values
  const referenceData = [
    { Category: "Surface Types", Valid_Values: SURFACE_TYPES.map(s => `${s.id} - ${s.name} (C=${s.coefficient})`).join("; ") },
    { Category: "Channel Materials", Valid_Values: CHANNEL_MATERIALS.map(m => `${m.id} - ${m.name} (n=${m.manningN})`).join("; ") },
    { Category: "Channel Shapes", Valid_Values: "trapezoidal; u-channel" },
    { Category: "Use IDF", Valid_Values: "true; false" },
    { Category: "Return Periods", Valid_Values: "2; 5; 10; 25; 50; 100; 200 years" },
    { Category: "U-Channel Sizes", Valid_Values: "100mm; 150mm; 225mm; 250mm; 300mm; 375mm; 450mm; 525mm; 600mm" }
  ];

  const referenceSheet = XLSX.utils.json_to_sheet(referenceData);
  referenceSheet['!cols'] = [{ wch: 20 }, { wch: 100 }];
  XLSX.utils.book_append_sheet(workbook, referenceSheet, "Reference Values");

  // Create instructions sheet
  const instructions = [
    { Instruction: "Data Entry Instructions", Details: "" },
    { Instruction: "", Details: "1. Fill in the Channel Design Data sheet with your channel information" },
    { Instruction: "", Details: "2. Use the Reference Values sheet to see valid options for dropdown fields" },
    { Instruction: "", Details: "3. Channel ID must be unique for each row" },
    { Instruction: "", Details: "4. Catchment Area, Average Slope, Flow Path Length, and Channel Gradient must be positive numbers" },
    { Instruction: "", Details: "5. For upstream channels, enter comma-separated channel IDs (e.g., 'CH-001,CH-002'). Time of concentration will be calculated automatically." },
    { Instruction: "", Details: "6. Surface Type and Channel Material must match values from Reference Values sheet" },
    { Instruction: "", Details: "7. Channel Shape must be either 'trapezoidal' or 'u-channel'" },
    { Instruction: "", Details: "8. Use IDF should be 'true' or 'false'" },
    { Instruction: "", Details: "9. Velocity limits and preferred channel sizes are handled automatically by the design code" },
    { Instruction: "", Details: "10. Save the file and upload it to process multiple channel designs" }
  ];

  const instructionsSheet = XLSX.utils.json_to_sheet(instructions);
  instructionsSheet['!cols'] = [{ wch: 30 }, { wch: 80 }];
  XLSX.utils.book_append_sheet(workbook, instructionsSheet, "Instructions");

  // Save the file
  XLSX.writeFile(workbook, "Channel_Design_Template.xlsx");
}

// Parse Excel file and convert to channel data
export function parseExcelFile(file: File): Promise<ExcelChannelData[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get the first sheet (Channel Design Data)
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        // Skip header row and convert to ExcelChannelData
        const rows = jsonData.slice(1) as unknown[][];
        const channelData: ExcelChannelData[] = [];
        
        rows.forEach((row, index) => {
          // Skip empty rows
          if (!row[0]) return;
          
          try {
            const data: ExcelChannelData = {
              channelId: String(row[0] || ""),
              catchmentArea: parseFloat(String(row[1])) || 0,
              averageSlope: parseFloat(String(row[2])) || 0,
              flowPathLength: parseFloat(String(row[3])) || 0,
              surfaceType: String(row[4] || ""),
              upstreamChannelIds: String(row[5] || ""),
              returnPeriod: parseInt(String(row[6])) || 10,
              useIDF: String(row[7]).toLowerCase() === 'true',
              channelShape: String(row[8] || "trapezoidal") as "trapezoidal" | "u-channel",
              channelGradient: parseFloat(String(row[9])) || 0,
              channelMaterial: String(row[10] || ""),
            };
            
            channelData.push(data);
          } catch (error) {
            console.warn(`Error parsing row ${index + 2}:`, error);
          }
        });
        
        resolve(channelData);
      } catch (error) {
        reject(new Error(`Failed to parse Excel file: ${error}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsArrayBuffer(file);
  });
}

// Validate channel data
export function validateChannelData(data: ExcelChannelData[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  data.forEach((row, index) => {
    const rowNum = index + 2; // Excel row number (accounting for header)
    
    // Required fields validation
    if (!row.channelId.trim()) {
      errors.push(`Row ${rowNum}: Channel ID is required`);
    }
    
    if (row.catchmentArea <= 0) {
      errors.push(`Row ${rowNum}: Catchment Area must be greater than 0`);
    }
    
    if (row.averageSlope <= 0) {
      errors.push(`Row ${rowNum}: Average Slope must be greater than 0`);
    }
    
    if (row.flowPathLength <= 0) {
      errors.push(`Row ${rowNum}: Flow Path Length must be greater than 0`);
    }
    
    if (!row.surfaceType.trim()) {
      errors.push(`Row ${rowNum}: Surface Type is required`);
    } else if (!SURFACE_TYPES.some(s => s.id === row.surfaceType)) {
      errors.push(`Row ${rowNum}: Invalid Surface Type '${row.surfaceType}'`);
    }
    
    if (row.channelGradient <= 0) {
      errors.push(`Row ${rowNum}: Channel Gradient must be greater than 0`);
    }
    
    if (!row.channelMaterial.trim()) {
      errors.push(`Row ${rowNum}: Channel Material is required`);
    } else if (!CHANNEL_MATERIALS.some(m => m.id === row.channelMaterial)) {
      errors.push(`Row ${rowNum}: Invalid Channel Material '${row.channelMaterial}'`);
    }
    
    if (!["trapezoidal", "u-channel"].includes(row.channelShape)) {
      errors.push(`Row ${rowNum}: Channel Shape must be 'trapezoidal' or 'u-channel'`);
    }
    
    // Validate upstream channel data format
    if (row.upstreamChannelIds.trim()) {
      const ids = row.upstreamChannelIds.split(',').map(id => id.trim());
      // Only validate that IDs are not empty strings
      ids.forEach((id, idIndex) => {
        if (!id) {
          errors.push(`Row ${rowNum}: Empty upstream channel ID at position ${idIndex + 1}`);
        }
      });
    }
  });
  
  // Check for duplicate channel IDs
  const channelIds = data.map(row => row.channelId.trim()).filter(id => id);
  const uniqueIds = new Set(channelIds);
  if (channelIds.length !== uniqueIds.size) {
    errors.push("Duplicate Channel IDs found. Each channel must have a unique ID.");
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

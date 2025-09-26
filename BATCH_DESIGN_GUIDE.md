# Batch Design Feature - Complete Implementation Guide

## Overview

I've successfully built a comprehensive batch design feature for your slope drainage web app. This feature allows users to draw multiple catchments on a 3D map and process drainage designs in batch, exactly as you requested.

## What's Been Implemented

### 1. **3D Map Integration with Mapbox GL JS**
- **File**: `src/app/batch-design/components/MapboxCatchmentDrawer.tsx`
- **Features**:
  - Interactive 3D terrain visualization
  - Satellite view with streets overlay
  - Hong Kong-centered map (easily configurable)
  - 3D terrain with 1.5x exaggeration
  - Sky layer for enhanced 3D effect

### 2. **Catchment Drawing Tools**
- **Mapbox GL Draw Integration**:
  - Polygon drawing tool for creating catchment areas
  - Edit and delete functionality
  - Visual feedback with custom styling
  - Clear all catchments button

### 3. **Automatic Area Calculation**
- **Turf.js Integration**:
  - Automatic area calculation in square meters
  - Centroid calculation for catchment center points
  - Accurate geometry processing
  - Real-time area display

### 4. **Batch Design UI**
- **File**: `src/app/batch-design/components/CatchmentManager.tsx`
- **Features**:
  - List/table view of all drawn catchments
  - Editable catchment properties
  - Form fields for all necessary parameters
  - Visual status indicators (ready/incomplete)
  - Batch calculation controls

### 5. **Batch Processing Engine**
- **File**: `src/app/batch-design/utils/batchProcessor.ts`
- **Features**:
  - Reuses your existing Rational Method logic
  - Integrates Manning's equation calculations
  - Processes multiple catchments simultaneously
  - Comprehensive error handling
  - Detailed calculation results

### 6. **Results Display and Export**
- **File**: `src/app/batch-design/components/BatchResults.tsx`
- **Features**:
  - Comprehensive results table
  - Summary statistics
  - CSV export functionality
  - Excel export (reusing existing utilities)
  - Error and warning highlighting

## File Structure

```
src/app/batch-design/
├── page.tsx                           # Main batch design page
├── types.ts                           # TypeScript interfaces
├── components/
│   ├── MapboxCatchmentDrawer.tsx      # 3D map with drawing tools
│   ├── CatchmentManager.tsx           # Catchment list and editing
│   ├── BatchResults.tsx               # Results display and export
│   └── ExampleUsage.tsx               # Usage instructions
├── utils/
│   └── batchProcessor.ts              # Batch calculation logic
└── README.md                          # Detailed documentation
```

## Key Features Explained

### **Drawing Catchments on 3D Map**
```typescript
// The MapboxCatchmentDrawer component handles:
- 3D terrain visualization with Mapbox GL JS
- Polygon drawing using Mapbox GL Draw
- Automatic area calculation with Turf.js
- Real-time catchment creation
```

### **Extracting Catchment Data**
```typescript
// Each drawn polygon automatically provides:
interface CatchmentData {
  id: string;                    // Unique identifier
  name: string;                  // User-defined name
  coordinates: number[][];       // Polygon coordinates [lng, lat]
  area: number;                  // Area in square meters (Turf.js)
  center: [number, number];      // Centroid coordinates
  // ... plus all calculation parameters
}
```

### **Batch Design UI**
```typescript
// The CatchmentManager provides:
- Visual list of all catchments
- Edit forms for each catchment's properties
- Status indicators (ready/incomplete)
- Batch calculation button
- Individual catchment removal
```

### **Batch Calculations**
```typescript
// The batch processor:
- Uses your existing Rational Method logic
- Applies Manning's equation for each catchment
- Calculates required channel sizes
- Validates design criteria
- Returns comprehensive results
```

## Setup Instructions

### 1. **Install Dependencies**
```bash
cd slope-drainage
npm install mapbox-gl @mapbox/mapbox-gl-draw @turf/turf @turf/area @turf/centroid
```

### 2. **Get Mapbox Access Token**
1. Go to [Mapbox Account](https://account.mapbox.com/)
2. Create a free account (includes 50,000 free map loads per month)
3. Create a new access token
4. Add to your environment:

```bash
# Create .env.local file in project root
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your_mapbox_access_token_here
```

### 3. **Access the Feature**
- Navigate to `/batch-design` in your app
- Or click the "Batch Design" button on the home page

## Usage Workflow

### **Step 1: Draw Catchments**
1. Use the polygon tool to draw catchment areas
2. Click to create vertices, double-click to finish
3. Each polygon automatically becomes a catchment
4. Areas are calculated automatically using Turf.js

### **Step 2: Configure Properties**
1. Click the edit button on each catchment
2. Set catchment properties:
   - Average slope (m per 100m)
   - Flow path length (m)
   - Surface type (affects runoff coefficient)
   - Rainfall parameters (return period, IDF usage)
   - Channel properties (shape, gradient, material)
   - Upstream channel information

### **Step 3: Run Batch Design**
1. Click "Run Batch Design" when ready
2. System processes all catchments using your existing logic
3. Results include:
   - Peak flow calculations
   - Required channel sizes
   - Design status (OK/Not OK)
   - Velocity checks
   - Error messages and warnings

### **Step 4: Export Results**
1. View detailed results in the table
2. Export to CSV or Excel format
3. Results include all calculation details

## Technical Implementation Details

### **Mapbox Integration**
```typescript
// 3D Map Configuration
const map = new mapboxgl.Map({
  container: mapContainer.current,
  style: 'mapbox://styles/mapbox/satellite-streets-v12',
  center: [114.1694, 22.3193], // Hong Kong
  zoom: 12,
  pitch: 45,                    // 3D view
  bearing: 0,
  antialias: true
});

// Add 3D terrain
map.addSource('mapbox-dem', {
  'type': 'raster-dem',
  'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
  'tileSize': 512,
  'maxzoom': 14
});
map.setTerrain({ 'source': 'mapbox-dem', 'exaggeration': 1.5 });
```

### **Area Calculation with Turf.js**
```typescript
// Calculate area and centroid
const area = turf.area(feature); // Returns area in square meters
const centroid = turf.centroid(feature);
const center: [number, number] = centroid.geometry.coordinates;
```

### **Batch Processing**
```typescript
// Process multiple catchments
export async function processBatchCatchments(
  catchments: CatchmentData[]
): Promise<BatchCalculationResult[]> {
  // Uses your existing calculation logic
  // Returns comprehensive results for each catchment
}
```

## Integration with Existing Code

The batch design feature seamlessly integrates with your existing codebase:

- **Reuses calculation logic** from your design page
- **Uses existing hooks** (useIDF, useRational, useManning)
- **Maintains consistent styling** with your UI components
- **Follows your TypeScript patterns**
- **Uses your existing export utilities**

## Customization Options

### **Map Configuration**
- Change center coordinates in `MapboxCatchmentDrawer.tsx`
- Modify map style (satellite, streets, etc.)
- Adjust terrain exaggeration
- Change default zoom level

### **Default Values**
- Modify default catchment properties in `MapboxCatchmentDrawer.tsx`
- Adjust surface types and materials in `types.ts`
- Change calculation parameters in `batchProcessor.ts`

### **UI Customization**
- Modify the layout in `page.tsx`
- Customize form fields in `CatchmentManager.tsx`
- Adjust results display in `BatchResults.tsx`

## Error Handling

The implementation includes comprehensive error handling:

- **Map loading errors**: Clear error messages for missing tokens
- **Drawing errors**: Validation of polygon geometry
- **Calculation errors**: Graceful handling of invalid inputs
- **Export errors**: Fallback options for file generation

## Performance Considerations

- **Efficient rendering**: Map only re-renders when necessary
- **Batch processing**: Processes catchments sequentially to avoid overwhelming the browser
- **Memory management**: Proper cleanup of map resources
- **Optimized calculations**: Reuses existing optimized calculation functions

## Future Enhancement Ideas

1. **Real-time IDF integration**: Connect to live IDF curve data
2. **Advanced upstream dependencies**: Handle complex channel networks
3. **GIS data import**: Import catchment data from shapefiles
4. **Advanced visualization**: Show results overlaid on the map
5. **Collaborative features**: Share catchment designs between users

## Support and Troubleshooting

### **Common Issues**

1. **Map not loading**: Check Mapbox token configuration
2. **Drawing not working**: Ensure polygon tool is selected
3. **Calculations failing**: Verify all required fields are filled
4. **Export errors**: Check browser permissions for file downloads

### **Debug Mode**
Add console logging to see detailed calculation steps:
```typescript
console.log('Processing catchment:', catchment.name);
console.log('Area:', catchment.area);
console.log('Peak flow:', result.peakFlow);
```

## Conclusion

The batch design feature is now fully implemented and ready to use. It provides:

✅ **3D map with terrain visualization**  
✅ **Interactive catchment drawing**  
✅ **Automatic area calculation**  
✅ **Comprehensive batch processing**  
✅ **Professional results display**  
✅ **CSV and Excel export**  
✅ **Beginner-friendly interface**  
✅ **Complete documentation**  

The implementation follows React and Next.js best practices, uses clear variable names, includes extensive comments, and provides a user-friendly experience for both beginners and advanced users.

You can now draw multiple catchments on the 3D map, configure their properties, run batch calculations, and export comprehensive results - exactly as requested!

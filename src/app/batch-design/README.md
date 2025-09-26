# Batch Design Feature

This feature allows users to draw multiple catchments on a 3D map and process drainage designs in batch.

## Features

1. **Interactive 3D Map**: Uses Mapbox GL JS with 3D terrain visualization
2. **Catchment Drawing**: Draw polygons directly on the map using Mapbox GL Draw
3. **Automatic Calculations**: Areas, lengths, slopes, and flow path lengths calculated from terrain data
4. **Terrain-Based Slope Extraction**: Automatically extracts average slope from 3D terrain for each catchment
5. **Smart Flow Path Calculation**: Calculates flow path length based on catchment geometry
6. **Batch Processing**: Process multiple catchments using existing calculation logic
7. **Results Export**: Export results to CSV or Excel format

## Setup

### 1. Mapbox Access Token

You need a Mapbox access token to use the 3D map feature:

1. Go to [Mapbox Account](https://account.mapbox.com/)
2. Create a free account or sign in
3. Create a new access token
4. Add the token to your environment variables:

```bash
# Create .env.local file in the project root
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your_mapbox_access_token_here
```

### 2. Dependencies

The following packages are required and should already be installed:

```bash
npm install mapbox-gl @mapbox/mapbox-gl-draw @turf/turf @turf/area @turf/centroid
```

## Usage

1. **Navigate to Batch Design**: Click "Batch Design" on the home page
2. **Draw Catchments**: 
   - Click the Tools button (🛠️) in the top-left corner to open the drawing tools panel
   - Use the polygon tool to draw catchment areas on the map
   - Click to create vertices, double-click to finish
   - Each polygon becomes a catchment with automatically calculated slope and flow path length
   - Catchment names are displayed in the center of each polygon for easy identification
3. **Configure Properties**: 
   - Click the edit button on each catchment
   - By default, slope and flow path length are locked (auto-calculated from terrain)
   - Check "Allow manual editing" to enable manual input of slope and flow path length
   - Set surface type and other catchment properties
   - Configure rainfall and channel properties
4. **Measure Lines**: Use the "Measure Line" tool to measure distance, elevation difference, and gradient between any two points
5. **Visualize Calculations**: In the Tools panel, click "Show Slope & Flow Path Lines" to see the calculation lines on the map
6. **Run Batch Design**: Click "Run Batch Design" to process all catchments
7. **Export Results**: Export results to CSV or Excel format

## Components

### MapboxCatchmentDrawer
- Renders the 3D Mapbox map with terrain
- Provides popup tools panel for drawing and editing
- Displays catchment names as labels on the map
- Calculates areas and centroids using Turf.js
- Extracts slope from terrain elevation data
- Calculates flow path length from catchment geometry
- Includes line measuring tool for distance, elevation, and gradient
- Visualizes slope and flow path lines on the map
- Synchronizes map operations with catchment/channel management
- Manages map interactions and controls

### CatchmentManager
- Displays list of drawn catchments
- Allows editing of catchment properties
- Provides manual edit toggle for slope and flow path length
- Shows readiness status for each catchment
- Provides batch calculation controls

### BatchResults
- Displays calculation results in a table
- Shows summary statistics
- Provides export functionality (CSV/Excel)
- Highlights design issues and warnings

## Technical Details

### Map Configuration
- **Style**: Satellite view with streets (`mapbox://styles/mapbox/satellite-streets-v12`)
- **Center**: Hong Kong coordinates (114.1694, 22.3193)
- **3D Features**: Terrain with 1.5x exaggeration, sky layer
- **Drawing Tools**: Polygon creation, editing, and deletion

### Automatic Calculations
- **Area Calculation**: Uses Turf.js `area()` function for accurate area calculation
- **Slope Extraction**: Samples terrain elevation data and calculates slope using actual horizontal distance between highest and lowest elevation points
- **Flow Path Length**: Calculates actual distance from highest elevation point to lowest elevation point (outlet)
- **Centroid Calculation**: Determines catchment center point for reference
- **Visualization**: Draws lines on the map showing slope and flow path calculations

### Batch Processing
- Reuses existing calculation logic from the main design page
- Processes catchments sequentially
- Handles errors gracefully with detailed error reporting
- Provides progress feedback during processing

## File Structure

```
src/app/batch-design/
├── page.tsx                    # Main batch design page
├── types.ts                    # TypeScript interfaces
├── components/
│   ├── MapboxCatchmentDrawer.tsx  # 3D map with drawing tools
│   ├── CatchmentManager.tsx       # Catchment list and editing
│   └── BatchResults.tsx           # Results display and export
├── utils/
│   └── batchProcessor.ts          # Batch calculation logic
└── README.md                      # This file
```

## Troubleshooting

### Map Not Loading
- Check that your Mapbox access token is correctly set
- Ensure the token has the necessary scopes (styles:read, fonts:read, etc.)
- Check browser console for any error messages

### Drawing Issues
- Make sure you're using the polygon tool (not other drawing modes)
- Click to create vertices, double-click to finish the polygon
- Use the trash tool to delete unwanted features

### Calculation Errors
- Ensure all required catchment properties are filled
- Check that values are within reasonable ranges
- Review error messages in the results table

## Future Enhancements

- [ ] Real-time IDF curve integration
- [ ] Advanced upstream channel dependency handling
- [ ] Map layer toggles (satellite, terrain, etc.)
- [ ] Catchment import/export functionality
- [ ] Advanced visualization of results on map
- [ ] Integration with GIS data sources

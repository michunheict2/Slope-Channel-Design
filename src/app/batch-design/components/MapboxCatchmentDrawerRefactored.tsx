/**
 * MapboxCatchmentDrawer - Refactored Component
 * 
 * This component provides an interactive map interface for drawing catchments and channels
 * with automatic terrain analysis and visualization capabilities. The component has been
 * refactored to improve maintainability, organization, and code reusability.
 * 
 * Key improvements:
 * - Separated concerns into utility modules
 * - Custom hooks for state management
 * - Comprehensive TypeScript types
 * - JSDoc documentation
 * - Better error handling
 * - Modular architecture
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { CatchmentData, ChannelAlignment } from '../types';
import { useMapboxMap } from '../hooks/useMapboxMap';
import { useMeasurement } from '../hooks/useMeasurement';
import { 
  handleDrawCreate, 
  handleDrawUpdate, 
  handleDrawDelete,
  findFeaturesToRemove,
  clearFeaturesByType,
  clearAllFeatures as clearAllFeaturesUtil,
  type DrawingHandlers,
  type FeatureProcessingContext
} from '../utils/drawingHandlers';
import { 
  updateCatchmentLabels, 
  updateChannelLabels,
  addCatchmentLabel,
  drawVisualizationLines,
  clearVisualizationLines
} from '../utils/visualizationUtils';

/**
 * Props interface for the MapboxCatchmentDrawer component
 */
interface MapboxCatchmentDrawerProps {
  /** Callback when a catchment is added */
  onCatchmentAdded: (catchment: CatchmentData) => void;
  /** Callback when a channel is added */
  onChannelAdded: (channel: ChannelAlignment) => void;
  /** Array of current catchments */
  catchments: CatchmentData[];
  /** Array of current channels */
  channels: ChannelAlignment[];
  /** Whether to show visualization features */
  showVisualization?: boolean;
  /** Callback when a catchment is updated */
  onCatchmentUpdated?: (catchment: CatchmentData) => void;
  /** Callback when a catchment is removed */
  onCatchmentRemoved?: (catchmentId: string) => void;
  /** Callback when a channel is removed */
  onChannelRemoved?: (channelId: string) => void;
}

/**
 * MapboxCatchmentDrawer Component
 * 
 * A comprehensive map interface for drawing and managing catchments and channels
 * with integrated terrain analysis and visualization tools.
 * 
 * @param props - Component props
 * @returns JSX element
 */
export default function MapboxCatchmentDrawer(props: MapboxCatchmentDrawerProps) {
  const { 
    onCatchmentAdded, 
    onChannelAdded,
    catchments,
    channels,
    onCatchmentRemoved,
    onChannelRemoved
  } = props;

  // UI state
  const [showToolsPopup, setShowToolsPopup] = useState(false);

  // Create drawing handlers object
  const drawingHandlers: DrawingHandlers = {
    onCatchmentAdded,
    onChannelAdded,
    onCatchmentRemoved,
    onChannelRemoved
  };

  // Create feature processing context
  const createProcessingContext = useCallback((): FeatureProcessingContext => ({
    catchments,
    channels,
    handlers: drawingHandlers,
    addCatchmentLabel: (catchment: CatchmentData) => addCatchmentLabel(map.current, catchment)
  }), [catchments, channels, drawingHandlers]);

  // Initialize map with custom hook
  const {
    mapContainer,
    map,
    draw,
    mapState,
    mapControls,
    setMapState
  } = useMapboxMap(
    // onMapReady callback
    (mapInstance, drawInstance) => {
      console.log('Map initialized successfully');
    },
    // onDrawCreate callback
    async (e) => {
      const context = createProcessingContext();
      await handleDrawCreate(e, context);
    },
    // onDrawUpdate callback
    async (e) => {
      const context = createProcessingContext();
      await handleDrawUpdate(e, context);
    },
    // onDrawDelete callback
    (e) => {
      const context = createProcessingContext();
      handleDrawDelete(e, context);
    }
  );

  // Initialize measurement functionality
  const { measurementState, measurementControls } = useMeasurement(
    map.current,
    mapControls.setDrawingMode
  );

  // Update catchment labels when catchments change
  useEffect(() => {
    if (!map.current || !mapState.isMapLoaded) return;
    updateCatchmentLabels(map.current, catchments);
  }, [catchments, mapState.isMapLoaded]);

  // Update channel labels when channels change
  useEffect(() => {
    if (!map.current || !mapState.isMapLoaded) return;
    updateChannelLabels(map.current, channels);
  }, [channels, mapState.isMapLoaded]);

  // Sync map features with catchments array changes
  useEffect(() => {
    if (!map.current || !mapState.isMapLoaded || !draw.current) return;

    try {
      // Get all current features from the map
      const currentFeatures = draw.current.getAll();
      
      // Find features that need to be removed
      const featuresToRemove = findFeaturesToRemove(currentFeatures.features, catchments);

      // Remove features that no longer have corresponding catchments
      featuresToRemove.forEach((feature: any) => {
        draw.current.delete(feature.id);
      });
    } catch (error) {
      console.error('Error syncing map features with catchments:', error);
    }
  }, [catchments, mapState.isMapLoaded]);

  // Enhanced toolbar functions
  const setDrawingMode = useCallback((mode: string) => {
    mapControls.setDrawingMode(mode);
  }, [mapControls]);

  const clearAllFeatures = useCallback(() => {
    const context = createProcessingContext();
    clearAllFeaturesUtil(draw.current, context);
  }, [draw, createProcessingContext]);

  const clearCatchments = useCallback(() => {
    const context = createProcessingContext();
    clearFeaturesByType(draw.current, 'Polygon', context);
  }, [draw, createProcessingContext]);

  const clearChannels = useCallback(() => {
    const context = createProcessingContext();
    clearFeaturesByType(draw.current, 'LineString', context);
  }, [draw, createProcessingContext]);

  const toggleVisualization = useCallback(async () => {
    if (!map.current) return;
    
    try {
      if (showToolsPopup) {
        await drawVisualizationLines(map.current, catchments);
      } else {
        clearVisualizationLines(map.current);
      }
    } catch (error) {
      console.error('Error toggling visualization:', error);
    }
  }, [map, catchments, showToolsPopup]);

  return (
    <div className="relative w-full h-full">
      {/* Map container */}
      <div ref={mapContainer} className="w-full h-full" />
      
      {/* Error state */}
      {mapState.mapError && (
        <div className="absolute inset-0 bg-red-50 flex items-center justify-center">
          <div className="text-center p-6 max-w-md">
            <div className="text-red-600 text-4xl mb-4">{'⚠️'}</div>
            <h3 className="font-semibold text-red-800 mb-2">Map Loading Error</h3>
            <p className="text-red-600 text-sm mb-4">{mapState.mapError}</p>
            <div className="space-y-2 text-xs text-red-500">
              <p><strong>Common solutions:</strong></p>
              <ul className="list-disc list-inside space-y-1">
                <li>Check your internet connection</li>
                <li>Verify your Mapbox access token</li>
                <li>Try refreshing the page</li>
                <li>Check browser console for more details</li>
              </ul>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Refresh Page
            </button>
          </div>
        </div>
      )}
      
      {/* Loading state */}
      {mapState.isLoading && !mapState.mapError && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading 3D Map...</p>
            <p className="text-xs text-gray-500 mt-2">This may take a few moments</p>
          </div>
        </div>
      )}
      
      {/* Tools Toggle Button */}
      {mapState.isMapLoaded && !mapState.mapError && (
        <div className="absolute top-4 left-4 z-10">
          <button
            onClick={() => setShowToolsPopup(!showToolsPopup)}
            className="bg-white rounded-lg shadow-lg p-3 hover:bg-gray-50 transition-colors"
            title="Drawing Tools"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{'🛠️'}</span>
              <span className="text-sm font-medium">Tools</span>
              <span className={`text-xs transition-transform ${showToolsPopup ? 'rotate-180' : ''}`}>{'▼'}</span>
            </div>
          </button>
        </div>
      )}

      {/* Tools Popup Side Panel */}
      {mapState.isMapLoaded && !mapState.mapError && showToolsPopup && (
        <div className="absolute top-4 left-20 z-10 bg-white rounded-lg shadow-lg p-4 w-64">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm text-gray-700">Drawing Tools</h3>
            <button
              onClick={() => setShowToolsPopup(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              {'✕'}
            </button>
          </div>
          
          {/* Tool Selection */}
          <div className="space-y-2 mb-4">
            <button
              onClick={() => setDrawingMode('simple_select')}
              className={`w-full text-left px-3 py-2 rounded text-sm font-medium transition-colors ${
                mapState.currentMode === 'simple_select' 
                  ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <span className="mr-2">{'🖱️'}</span>
              Select/Move
            </button>
            
            <button
              onClick={() => setDrawingMode('draw_polygon')}
              className={`w-full text-left px-3 py-2 rounded text-sm font-medium transition-colors ${
                mapState.currentMode === 'draw_polygon' 
                  ? 'bg-green-100 text-green-700 border border-green-300' 
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <span className="mr-2">{'📐'}</span>
              Draw Catchment
            </button>
            
            <button
              onClick={() => setDrawingMode('draw_line_string')}
              className={`w-full text-left px-3 py-2 rounded text-sm font-medium transition-colors ${
                mapState.currentMode === 'draw_line_string' 
                  ? 'bg-orange-100 text-orange-700 border border-orange-300' 
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <span className="mr-2">{'📏'}</span>
              Draw Channel
            </button>
            
            <button
              onClick={measurementState.isMeasuring ? measurementControls.stopMeasuring : measurementControls.startMeasuring}
              className={`w-full text-left px-3 py-2 rounded text-sm font-medium transition-colors ${
                measurementState.isMeasuring 
                  ? 'bg-red-100 text-red-700 border border-red-300' 
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <span className="mr-2">{'📐'}</span>
              {measurementState.isMeasuring ? 'Stop Measuring' : 'Measure Line'}
            </button>
          </div>
          
          {/* Clear Controls */}
          <div className="mb-4 pt-3 border-t border-gray-200">
            <h4 className="font-medium text-xs text-gray-600 mb-2">Clear Options</h4>
            <div className="space-y-1">
              <button
                onClick={clearCatchments}
                className="w-full text-left px-2 py-1 rounded text-xs hover:bg-orange-50 text-orange-600"
              >
                {'🗑️'} Clear Catchments
              </button>
              <button
                onClick={clearChannels}
                className="w-full text-left px-2 py-1 rounded text-xs hover:bg-orange-50 text-orange-600"
              >
                {'🗑️'} Clear Channels
              </button>
              <button
                onClick={clearAllFeatures}
                className="w-full text-left px-2 py-1 rounded text-xs hover:bg-red-50 text-red-600"
              >
                {'🗑️'} Clear All
              </button>
            </div>
          </div>

          {/* Visualization Controls */}
          <div className="mb-4 pt-3 border-t border-gray-200">
            <h4 className="font-medium text-xs text-gray-600 mb-2">Visualization</h4>
            <div className="space-y-1">
              <button
                onClick={toggleVisualization}
                className="w-full text-left px-2 py-1 rounded text-xs hover:bg-blue-50 text-blue-600"
                disabled={catchments.length === 0}
              >
                {'📏'} Show Slope & Flow Path Lines
              </button>
              <button
                onClick={() => clearVisualizationLines(map.current)}
                className="w-full text-left px-2 py-1 rounded text-xs hover:bg-gray-50 text-gray-600"
              >
                {'🚫'} Hide Lines
              </button>
            </div>
          </div>
          
          {/* Measurement Results */}
          {measurementState.measurementResults && (
            <div className="mb-4 pt-3 border-t border-gray-200">
              <h4 className="font-medium text-xs text-gray-600 mb-2">Measurement Results</h4>
              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span>Distance:</span>
                  <span className="font-medium">{measurementState.measurementResults.horizontalDistance.toFixed(2)}m</span>
                </div>
                <div className="flex justify-between">
                  <span>Elevation Diff:</span>
                  <span className="font-medium">{measurementState.measurementResults.elevationDiff.toFixed(2)}m</span>
                </div>
                <div className="flex justify-between">
                  <span>Gradient:</span>
                  <span className="font-medium">{measurementState.measurementResults.gradient.toFixed(2)}%</span>
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  <div>Point 1: {measurementState.measurementResults.elevation1.toFixed(2)}m</div>
                  <div>Point 2: {measurementState.measurementResults.elevation2.toFixed(2)}m</div>
                </div>
              </div>
            </div>
          )}

          {/* Statistics */}
          <div className="pt-3 border-t border-gray-200">
            <h4 className="font-medium text-xs text-gray-600 mb-2">Statistics</h4>
            <div className="text-xs text-gray-500 space-y-1">
              <div>Catchments: {catchments.length}</div>
              <div>Channels: {channels.length}</div>
              {mapState.isExtractingSlope && (
                <div className="flex items-center gap-2 text-blue-600">
                  <div className="animate-spin h-3 w-3 border border-blue-600 border-t-transparent rounded-full"></div>
                  <span>Extracting slope...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

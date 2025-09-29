/**
 * Custom hook for managing Mapbox map state and initialization
 * 
 * This hook encapsulates all map-related state management, initialization,
 * and cleanup logic to keep the main component clean and focused.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { 
  initializeMapboxLibraries,
  createMapInstance,
  setupTerrainLayers,
  createDrawInstance,
  getMapboxAccessToken
} from '../utils/mapConfig';

/**
 * Interface for map state
 */
export interface MapState {
  isMapLoaded: boolean;
  mapError: string | null;
  isLoading: boolean;
  currentMode: string;
  isExtractingSlope: boolean;
}

/**
 * Interface for map controls
 */
export interface MapControls {
  setDrawingMode: (mode: string) => void;
  clearAllFeatures: () => void;
  clearCatchments: () => void;
  clearChannels: () => void;
}

/**
 * Interface for map hook return value
 */
export interface UseMapboxMapReturn {
  mapContainer: React.RefObject<HTMLDivElement | null>;
  map: React.RefObject<any>;
  draw: React.RefObject<any>;
  mapState: MapState;
  mapControls: MapControls;
  setMapState: React.Dispatch<React.SetStateAction<MapState>>;
}

/**
 * Custom hook for managing Mapbox map
 * 
 * @param onMapReady - Callback when map is ready
 * @param onDrawCreate - Callback for draw create events
 * @param onDrawUpdate - Callback for draw update events
 * @param onDrawDelete - Callback for draw delete events
 * @returns Map state and controls
 */
export function useMapboxMap(
  onMapReady?: (map: any, draw: any) => void,
  onDrawCreate?: (e: any) => void,
  onDrawUpdate?: (e: any) => void,
  onDrawDelete?: (e: any) => void
): UseMapboxMapReturn {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const draw = useRef<any>(null);
  
  const [mapState, setMapState] = useState<MapState>({
    isMapLoaded: false,
    mapError: null,
    isLoading: true,
    currentMode: 'simple_select',
    isExtractingSlope: false
  });

  /**
   * Initialize the map and all its components
   */
  const initializeMap = useCallback(async () => {
    if (!mapContainer.current || map.current) return;

    try {
      setMapState(prev => ({ ...prev, isLoading: true, mapError: null }));

      // Initialize Mapbox libraries
      await initializeMapboxLibraries();

      // Check for access token
      getMapboxAccessToken();

      // Create map instance
      map.current = createMapInstance(mapContainer.current);

      // Set up map event handlers
      map.current.on('load', () => {
        if (!map.current) return;

        try {
          // Set up 3D terrain
          setupTerrainLayers(map.current);

          // Initialize Mapbox Draw
          draw.current = createDrawInstance();

          // Add draw control to map
          map.current.addControl(draw.current);

          // Handle draw events
          if (onDrawCreate) {
            map.current.on('draw.create', onDrawCreate);
          }
          if (onDrawUpdate) {
            map.current.on('draw.update', onDrawUpdate);
          }
          if (onDrawDelete) {
            map.current.on('draw.delete', onDrawDelete);
          }

          setMapState(prev => ({ 
            ...prev, 
            isMapLoaded: true, 
            isLoading: false 
          }));

          // Notify parent that map is ready
          if (onMapReady) {
            onMapReady(map.current, draw.current);
          }
        } catch (error) {
          console.error('Error setting up map layers:', error);
          setMapState(prev => ({ 
            ...prev, 
            mapError: 'Error setting up map layers. Please try refreshing the page.',
            isLoading: false 
          }));
        }
      });

      // Handle map errors
      map.current.on('error', (e: any) => {
        console.error('Map error:', e);
        setMapState(prev => ({ 
          ...prev, 
          mapError: 'Map failed to load. Please check your internet connection and try again.',
          isLoading: false 
        }));
      });

    } catch (error) {
      console.error('Error initializing map:', error);
      setMapState(prev => ({ 
        ...prev, 
        mapError: error instanceof Error ? error.message : 'Failed to initialize map',
        isLoading: false 
      }));
    }
  }, [onMapReady, onDrawCreate, onDrawUpdate, onDrawDelete]);

  /**
   * Set drawing mode
   */
  const setDrawingMode = useCallback((mode: string) => {
    if (draw.current) {
      draw.current.changeMode(mode);
      setMapState(prev => ({ ...prev, currentMode: mode }));
    }
  }, []);

  /**
   * Clear all features from the map
   */
  const clearAllFeatures = useCallback(() => {
    if (draw.current) {
      draw.current.deleteAll();
    }
  }, []);

  /**
   * Clear only catchment features
   */
  const clearCatchments = useCallback(() => {
    if (draw.current) {
      const features = draw.current.getAll();
      features.features.forEach((feature: any) => {
        if (feature.geometry.type === 'Polygon') {
          draw.current.delete(feature.id);
        }
      });
    }
  }, []);

  /**
   * Clear only channel features
   */
  const clearChannels = useCallback(() => {
    if (draw.current) {
      const features = draw.current.getAll();
      features.features.forEach((feature: any) => {
        if (feature.geometry.type === 'LineString') {
          draw.current.delete(feature.id);
        }
      });
    }
  }, []);

  // Initialize map on mount
  useEffect(() => {
    initializeMap();

    // Cleanup on unmount
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [initializeMap]);

  const mapControls: MapControls = {
    setDrawingMode,
    clearAllFeatures,
    clearCatchments,
    clearChannels
  };

  return {
    mapContainer,
    map,
    draw,
    mapState,
    mapControls,
    setMapState
  };
}

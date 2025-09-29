/**
 * Mapbox configuration and initialization utilities
 * 
 * This module contains all map-related configuration, styling, and initialization logic
 * to keep the main component focused on UI and state management.
 */

// Dynamic imports to avoid SSR issues - using any for external libraries
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export let mapboxgl: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export let MapboxDraw: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export let turf: any = null;

/**
 * Map configuration constants
 */
export const MAP_CONFIG = {
  DEFAULT_CENTER: [114.1694, 22.3193] as [number, number], // Hong Kong coordinates
  DEFAULT_ZOOM: 12,
  DEFAULT_PITCH: 45, // Enable 3D view
  DEFAULT_BEARING: 0,
  STYLE: 'mapbox://styles/mapbox/satellite-streets-v12', // Satellite view with streets
  TERRAIN_EXAGGERATION: 1.5,
  TERRAIN_TILE_SIZE: 512,
  TERRAIN_MAX_ZOOM: 14,
} as const;

/**
 * Mapbox Draw configuration and styles
 */
export const DRAW_CONFIG = {
  displayControlsDefault: false,
  controls: {
    polygon: true,
    line_string: true,
    point: false,
    circle: false,
    rectangle: false,
    trash: true
  },
  defaultMode: 'simple_select',
  styles: [
    // Polygon fill (inactive)
    {
      'id': 'gl-draw-polygon-fill-inactive',
      'type': 'fill',
      'filter': ['all', ['==', 'active', 'false'], ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
      'paint': {
        'fill-color': '#3fb1ce',
        'fill-outline-color': '#3fb1ce',
        'fill-opacity': 0.1
      }
    },
    // Polygon fill (active)
    {
      'id': 'gl-draw-polygon-fill-active',
      'type': 'fill',
      'filter': ['all', ['==', 'active', 'true'], ['==', '$type', 'Polygon']],
      'paint': {
        'fill-color': '#fbb03b',
        'fill-outline-color': '#fbb03b',
        'fill-opacity': 0.1
      }
    },
    // Polygon outline (inactive)
    {
      'id': 'gl-draw-polygon-stroke-inactive',
      'type': 'line',
      'filter': ['all', ['==', 'active', 'false'], ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
      'layout': {
        'line-cap': 'round',
        'line-join': 'round'
      },
      'paint': {
        'line-color': '#3fb1ce',
        'line-width': 2
      }
    },
    // Polygon outline (active)
    {
      'id': 'gl-draw-polygon-stroke-active',
      'type': 'line',
      'filter': ['all', ['==', 'active', 'true'], ['==', '$type', 'Polygon']],
      'layout': {
        'line-cap': 'round',
        'line-join': 'round'
      },
      'paint': {
        'line-color': '#fbb03b',
        'line-width': 2
      }
    },
    // Vertex points
    {
      'id': 'gl-draw-polygon-and-line-vertex-stroke-inactive',
      'type': 'circle',
      'filter': ['all', ['==', 'meta', 'vertex'], ['==', '$type', 'Point'], ['!=', 'mode', 'static']],
      'paint': {
        'circle-radius': 5,
        'circle-color': '#fbb03b'
      }
    },
    {
      'id': 'gl-draw-polygon-and-line-vertex-inactive',
      'type': 'circle',
      'filter': ['all', ['==', 'meta', 'vertex'], ['==', '$type', 'Point'], ['!=', 'mode', 'static']],
      'paint': {
        'circle-radius': 3,
        'circle-color': '#fbb03b'
      }
    },
    // Line styles for channel alignment (inactive)
    {
      'id': 'gl-draw-line-inactive',
      'type': 'line',
      'filter': ['all', ['==', 'active', 'false'], ['==', '$type', 'LineString'], ['!=', 'mode', 'static']],
      'layout': {
        'line-cap': 'round',
        'line-join': 'round'
      },
      'paint': {
        'line-color': '#3fb1ce',
        'line-width': 3
      }
    },
    // Line styles for channel alignment (active)
    {
      'id': 'gl-draw-line-active',
      'type': 'line',
      'filter': ['all', ['==', 'active', 'true'], ['==', '$type', 'LineString']],
      'layout': {
        'line-cap': 'round',
        'line-join': 'round'
      },
      'paint': {
        'line-color': '#fbb03b',
        'line-width': 3
      }
    }
  ]
} as const;

/**
 * Layer configurations for labels and visualization
 */
export const LAYER_CONFIGS = {
  CATCHMENT_LABELS: {
    id: 'catchment-labels',
    type: 'symbol',
    source: 'catchment-labels',
    layout: {
      'text-field': ['get', 'name'],
      'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
      'text-size': 14,
      'text-anchor': 'center',
      'text-offset': [0, 0]
    },
    paint: {
      'text-color': '#ffffff',
      'text-halo-color': '#000000',
      'text-halo-width': 2
    }
  },
  CHANNEL_LABELS: {
    id: 'channel-labels',
    type: 'symbol',
    source: 'channel-labels',
    layout: {
      'text-field': ['get', 'name'],
      'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
      'text-size': 12,
      'text-anchor': 'center',
      'text-offset': [0, 0]
    },
    paint: {
      'text-color': '#ff6b35',
      'text-halo-color': '#ffffff',
      'text-halo-width': 2
    }
  },
  SLOPE_LINE: {
    id: 'slope-line',
    type: 'line',
    source: 'slope-line',
    paint: {
      'line-color': '#ff6b6b',
      'line-width': 3,
      'line-dasharray': [2, 2]
    }
  },
  FLOW_PATH_LINE: {
    id: 'flow-path-line',
    type: 'line',
    source: 'flow-path-line',
    paint: {
      'line-color': '#4ecdc4',
      'line-width': 3,
      'line-dasharray': [1, 1]
    }
  },
  MEASUREMENT_LINE: {
    id: 'measurement-line',
    type: 'line',
    source: 'measurement-line',
    paint: {
      'line-color': '#ff0000',
      'line-width': 3,
      'line-dasharray': [1, 1]
    }
  }
} as const;

/**
 * Initialize Mapbox libraries dynamically to avoid SSR issues
 * 
 * @returns Promise that resolves when all libraries are loaded
 */
export async function initializeMapboxLibraries(): Promise<void> {
  try {
    // Dynamic imports to avoid SSR issues
    const [mapboxModule, drawModule, turfModule] = await Promise.all([
      import('mapbox-gl'),
      import('@mapbox/mapbox-gl-draw'),
      import('@turf/turf')
    ]);
    
    mapboxgl = mapboxModule.default;
    MapboxDraw = drawModule.default;
    turf = turfModule;
  } catch (error) {
    console.error('Error loading Mapbox libraries:', error);
    throw new Error('Failed to load Mapbox libraries');
  }
}

/**
 * Get Mapbox access token from environment variables
 * 
 * @returns The access token or throws an error if not found
 */
export function getMapboxAccessToken(): string {
  const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || 
                process.env.NEXT_PUBLIC_MAPBOXACCESSTOKEN;
  
  if (!token) {
    throw new Error('Mapbox access token not found. Please set NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN in your environment variables.');
  }
  
  return token;
}

/**
 * Create a new Mapbox map instance with 3D terrain
 * 
 * @param container - The HTML element to contain the map
 * @returns The initialized map instance
 */
export function createMapInstance(container: HTMLElement): any {
  if (!mapboxgl) {
    throw new Error('Mapbox GL not initialized. Call initializeMapboxLibraries() first.');
  }

  const accessToken = getMapboxAccessToken();
  mapboxgl.accessToken = accessToken;

  const map = new mapboxgl.Map({
    container,
    style: MAP_CONFIG.STYLE,
    center: MAP_CONFIG.DEFAULT_CENTER,
    zoom: MAP_CONFIG.DEFAULT_ZOOM,
    pitch: MAP_CONFIG.DEFAULT_PITCH,
    bearing: MAP_CONFIG.DEFAULT_BEARING,
    antialias: true
  });

  return map;
}

/**
 * Set up 3D terrain and sky layers on the map
 * 
 * @param map - The Mapbox map instance
 */
export function setupTerrainLayers(map: any): void {
  if (!map) return;

  try {
    // Add terrain source
    map.addSource('mapbox-dem', {
      'type': 'raster-dem',
      'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
      'tileSize': MAP_CONFIG.TERRAIN_TILE_SIZE,
      'maxzoom': MAP_CONFIG.TERRAIN_MAX_ZOOM
    });

    // Set terrain
    map.setTerrain({ 
      'source': 'mapbox-dem', 
      'exaggeration': MAP_CONFIG.TERRAIN_EXAGGERATION 
    });

    // Add sky layer for better 3D effect
    map.addLayer({
      'id': 'sky',
      'type': 'sky',
      'paint': {
        'sky-type': 'atmosphere',
        'sky-atmosphere-sun': [0.0, 0.0],
        'sky-atmosphere-sun-intensity': 15
      }
    });
  } catch (error) {
    console.error('Error setting up terrain layers:', error);
    throw error;
  }
}

/**
 * Create a MapboxDraw instance with configured styles
 * 
 * @returns The initialized MapboxDraw instance
 */
export function createDrawInstance(): any {
  if (!MapboxDraw) {
    throw new Error('MapboxDraw not initialized. Call initializeMapboxLibraries() first.');
  }

  return new MapboxDraw(DRAW_CONFIG);
}

/**
 * Add a source to the map if it doesn't exist
 * 
 * @param map - The Mapbox map instance
 * @param sourceId - The source ID
 * @param sourceData - The source data
 */
export function addSourceIfNotExists(map: any, sourceId: string, sourceData: any): void {
  if (!map.getSource(sourceId)) {
    map.addSource(sourceId, sourceData);
  }
}

/**
 * Add a layer to the map if it doesn't exist
 * 
 * @param map - The Mapbox map instance
 * @param layerConfig - The layer configuration
 */
export function addLayerIfNotExists(map: any, layerConfig: any): void {
  if (!map.getLayer(layerConfig.id)) {
    map.addLayer(layerConfig);
  }
}

/**
 * Remove a layer and its source from the map
 * 
 * @param map - The Mapbox map instance
 * @param layerId - The layer ID to remove
 * @param sourceId - The source ID to remove (optional)
 */
export function removeLayerAndSource(map: any, layerId: string, sourceId?: string): void {
  try {
    if (map.getLayer(layerId)) {
      map.removeLayer(layerId);
    }
    if (sourceId && map.getSource(sourceId)) {
      map.removeSource(sourceId);
    }
  } catch (error) {
    console.error(`Error removing layer ${layerId}:`, error);
  }
}

"use client";

import { useEffect, useRef, useState } from "react";
import { CatchmentData } from "../types";

// Dynamic imports to avoid SSR issues
let mapboxgl: unknown = null;
let MapboxDraw: unknown = null;
let turf: unknown = null;

interface MapboxCatchmentDrawerProps {
  onCatchmentAdded: (catchment: CatchmentData) => void;
  onChannelAdded: (channel: unknown) => void;
  catchments: CatchmentData[];
  channels: unknown[];
  showVisualization?: boolean;
  onCatchmentUpdated?: (catchment: CatchmentData) => void;
  onCatchmentRemoved?: (catchmentId: string) => void;
  onChannelRemoved?: (channelId: string) => void;
}

export default function MapboxCatchmentDrawer({ 
  onCatchmentAdded, 
  onChannelAdded,
  catchments,
  channels,
  showVisualization = false,
  onCatchmentUpdated,
  onCatchmentRemoved,
  onChannelRemoved
}: MapboxCatchmentDrawerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<unknown>(null);
  const draw = useRef<unknown>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentMode, setCurrentMode] = useState<string>('simple_select');
  // const [isExtractingSlope, setIsExtractingSlope] = useState(false);
  const [showToolsPopup, setShowToolsPopup] = useState(false);
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [measurementPoints, setMeasurementPoints] = useState<number[][]>([]);
  const [measurementResults, setMeasurementResults] = useState<unknown>(null);

  // Surface type options (same as in existing code)
  // const SURFACE_TYPES = [
  //   { id: "undrain", name: "Undrained", coefficient: 1.0 },
  //   { id: "asphalt", name: "Asphalt/Concrete", coefficient: 0.90 },
  //   { id: "roof", name: "Roofs", coefficient: 0.85 },
  //   { id: "gravel", name: "Gravel", coefficient: 0.35 },
  //   { id: "lawn", name: "Lawn/Grass", coefficient: 0.20 },
  //   { id: "lawn_steep", name: "Lawn/Grass (Steep)", coefficient: 0.25 },
  //   { id: "forest", name: "Forest", coefficient: 0.10 },
  //   { id: "bare_soil", name: "Bare Soil", coefficient: 0.30 },
  //   { id: "cultivated", name: "Cultivated Land", coefficient: 0.35 },
  //   { id: "pasture", name: "Pasture/Range", coefficient: 0.20 },
  //   { id: "desert", name: "Desert/Barren", coefficient: 0.70 },
  // ];

  // Initialize Mapbox map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const initializeMap = async () => {
      try {
        setIsLoading(true);
        setMapError(null);

        // Dynamic imports to avoid SSR issues
        const mapboxModule = await import('mapbox-gl');
        const drawModule = await import('@mapbox/mapbox-gl-draw');
        const turfModule = await import('@turf/turf');
        
        mapboxgl = mapboxModule.default;
        MapboxDraw = drawModule.default;
        turf = turfModule;

        // Check for access token
        const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
        
        console.log('Environment check:', {
          hasToken: !!MAPBOX_ACCESS_TOKEN,
          tokenLength: MAPBOX_ACCESS_TOKEN?.length || 0,
          tokenStart: MAPBOX_ACCESS_TOKEN?.substring(0, 10) || 'none'
        });
        
        if (!MAPBOX_ACCESS_TOKEN) {
          throw new Error('Mapbox access token not found. Please set NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN in your environment variables.');
        }

        // Set Mapbox access token
        mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

        // Initialize map with 3D terrain
        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/satellite-streets-v12', // Satellite view with streets
          center: [114.1694, 22.3193], // Hong Kong coordinates
          zoom: 12,
          pitch: 45, // Enable 3D view
          bearing: 0,
          antialias: true
        });

        // Add 3D terrain
        map.current.on('load', () => {
          if (!map.current) return;

          try {
            // Add terrain source
            map.current.addSource('mapbox-dem', {
              'type': 'raster-dem',
              'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
              'tileSize': 512,
              'maxzoom': 14
            });

            // Set terrain
            map.current.setTerrain({ 'source': 'mapbox-dem', 'exaggeration': 1.5 });

            // Add sky layer for better 3D effect
            map.current.addLayer({
              'id': 'sky',
              'type': 'sky',
              'paint': {
                'sky-type': 'atmosphere',
                'sky-atmosphere-sun': [0.0, 0.0],
                'sky-atmosphere-sun-intensity': 15
              }
            });

            // Initialize Mapbox Draw
            draw.current = new MapboxDraw({
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
                // Polygon fill
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
                // Polygon outline
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
                // Line styles for channel alignment
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
            });

            // Add draw control to map
            map.current.addControl(draw.current);

            // Handle draw events
            map.current.on('draw.create', handleDrawCreate);
            map.current.on('draw.update', handleDrawUpdate);
            map.current.on('draw.delete', handleDrawDelete);

            setIsMapLoaded(true);
            setIsLoading(false);
          } catch (error) {
            console.error('Error setting up map layers:', error);
            setMapError('Error setting up map layers. Please try refreshing the page.');
            setIsLoading(false);
          }
        });

        // Handle map errors
        map.current.on('error', (e: unknown) => {
          console.error('Map error:', e);
          setMapError('Map failed to load. Please check your internet connection and try again.');
          setIsLoading(false);
        });

      } catch (error) {
        console.error('Error initializing map:', error);
        setMapError(error instanceof Error ? error.message : 'Failed to initialize map');
        setIsLoading(false);
      }
    };

    initializeMap();

    // Cleanup
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Update catchment labels when catchments change
  useEffect(() => {
    if (!map.current || !isMapLoaded) return;

    try {
      // Update all catchment labels
      const labelFeatures = catchments.map(catchment => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: catchment.center
        },
        properties: {
          id: catchment.id,
          name: catchment.name,
          type: 'catchment-label'
        }
      }));

      // Update the source with all current labels
      if (map.current.getSource('catchment-labels')) {
        map.current.getSource('catchment-labels').setData({
          type: 'FeatureCollection',
          features: labelFeatures
        });
      }
    } catch (error) {
      console.error('Error updating catchment labels:', error);
    }
  }, [catchments, isMapLoaded]);

  // Update channel labels when channels change
  useEffect(() => {
    if (!map.current || !isMapLoaded) return;

    try {
      // Update all channel labels
      const channelLabelFeatures = channels.map(channel => {
        // Calculate midpoint along the line using Turf.js
        const coordinates = channel.coordinates;
        if (coordinates.length < 2) return null;
        
        // Create a line feature
        const lineFeature = {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: coordinates
          }
        };
        
        // Calculate the midpoint along the line
        const lineLength = turf.length(lineFeature, { units: 'meters' });
        const midPoint = turf.along(lineFeature, lineLength / 2, { units: 'meters' });
        
        return {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: midPoint.geometry.coordinates
          },
          properties: {
            id: channel.id,
            name: channel.name,
            type: 'channel-label'
          }
        };
      }).filter(Boolean); // Remove null values

      // Update the source with all current channel labels
      if (map.current.getSource('channel-labels')) {
        map.current.getSource('channel-labels').setData({
          type: 'FeatureCollection',
          features: channelLabelFeatures
        });
      }
    } catch (error) {
      console.error('Error updating channel labels:', error);
    }
  }, [channels, isMapLoaded]);

  // Sync map features with catchments array changes
  useEffect(() => {
    if (!map.current || !isMapLoaded || !draw.current) return;

    try {
      // Get all current features from the map
      const currentFeatures = draw.current.getAll();
      
      // Find features that need to be removed (exist on map but not in catchments)
      const featuresToRemove = currentFeatures.features.filter((feature: unknown) => {
        if (feature.geometry.type === 'Polygon') {
          // Check if this polygon corresponds to a catchment that still exists
          const correspondingCatchment = catchments.find(c => 
            JSON.stringify(c.coordinates) === JSON.stringify(feature.geometry.coordinates[0])
          );
          return !correspondingCatchment; // Remove if no corresponding catchment found
        }
        return false; // Keep non-polygon features
      });

      // Remove features that no longer have corresponding catchments
      featuresToRemove.forEach((feature: unknown) => {
        draw.current.delete(feature.id);
      });

    } catch (error) {
      console.error('Error syncing map features with catchments:', error);
    }
  }, [catchments, isMapLoaded]);

  // Handle feature creation
  const handleDrawCreate = async (e: unknown) => {
    const features = e.features;
    for (const feature of features) {
      if (feature.geometry.type === 'Polygon') {
        await processPolygonFeature(feature);
      } else if (feature.geometry.type === 'LineString') {
        processLineFeature(feature);
      }
    }
  };

  // Handle feature updates
  const handleDrawUpdate = async (e: unknown) => {
    const features = e.features;
    for (const feature of features) {
      if (feature.geometry.type === 'Polygon') {
        await processPolygonFeature(feature);
      } else if (feature.geometry.type === 'LineString') {
        processLineFeature(feature);
      }
    }
  };

  // Handle feature deletion
  const handleDrawDelete = (e: unknown) => {
    const deletedFeatures = e.features;
    
    deletedFeatures.forEach((feature: unknown) => {
      if (feature.geometry.type === 'Polygon') {
        // Find and remove the corresponding catchment
        const catchment = catchments.find(c => 
          JSON.stringify(c.coordinates) === JSON.stringify(feature.geometry.coordinates[0])
        );
        if (catchment && onCatchmentRemoved) {
          onCatchmentRemoved(catchment.id);
        }
      } else if (feature.geometry.type === 'LineString') {
        // Find and remove the corresponding channel
        const channel = channels.find(c => 
          JSON.stringify(c.coordinates) === JSON.stringify(feature.geometry.coordinates)
        );
        if (channel && onChannelRemoved) {
          onChannelRemoved(channel.id);
        }
      }
    });
  };

  // Calculate channel gradient from elevation data
  const calculateChannelGradient = async (coordinates: number[][]) => {
    if (!map.current || coordinates.length < 2) return 0.01; // Default 1% gradient

    try {
      // Get elevation at first and last points
      const startPoint = coordinates[0];
      const endPoint = coordinates[coordinates.length - 1];
      
      const startElevation = await map.current.queryTerrainElevation(startPoint);
      const endElevation = await map.current.queryTerrainElevation(endPoint);
      
      if (startElevation === null || endElevation === null || 
          isNaN(startElevation) || isNaN(endElevation)) {
        return 0.01; // Default fallback
      }
      
      // Calculate horizontal distance using Turf.js
      const startPointFeature = turf.point(startPoint);
      const endPointFeature = turf.point(endPoint);
      const distance = turf.distance(startPointFeature, endPointFeature, { units: 'meters' });
      
      if (distance === 0) return 0.01; // Avoid division by zero
      
      // Calculate gradient: elevation difference / horizontal distance
      const elevationDifference = Math.abs(startElevation - endElevation);
      const gradient = elevationDifference / distance;
      
      // Ensure reasonable gradient range (0.001 to 0.1 = 0.1% to 10%)
      return Math.max(0.001, Math.min(0.1, gradient));
      
    } catch (error) {
      console.error('Error calculating channel gradient:', error);
      return 0.01; // Default fallback
    }
  };

  // Extract slope from terrain data
  const extractSlopeFromTerrain = async (coordinates: number[][]) => {
    if (!map.current) return 5; // Default fallback

    try {
      // Sample points along the polygon boundary and interior
      const samplePoints = [];
      
      // Sample boundary points
      for (let i = 0; i < coordinates.length; i++) {
        samplePoints.push(coordinates[i]);
      }
      
      // Sample interior points using a grid
      // const bbox = turf.bbox(turf.polygon([coordinates]));
      const gridSize = 5; // Sample every 5 points for performance
      
      for (let i = 0; i < coordinates.length - 1; i += gridSize) {
        const point = coordinates[i];
        if (turf.booleanPointInPolygon(turf.point(point), turf.polygon([coordinates]))) {
          samplePoints.push(point);
        }
      }
      
      // Get elevation data for sample points with coordinates
      const elevationData = [];
      for (const point of samplePoints) {
        try {
          // Query terrain elevation at each point
          const elevation = await map.current.queryTerrainElevation(point);
          if (elevation !== null && elevation !== undefined && !isNaN(elevation)) {
            elevationData.push({
              coordinates: point,
              elevation: elevation
            });
          }
        } catch (error) {
          console.warn('Could not get elevation for point:', point, error);
        }
      }
      
      if (elevationData.length < 2) {
        console.warn('Insufficient elevation data, using default slope');
        return 5; // Default fallback
      }
      
      // Find highest and lowest elevation points
      const sortedByElevation = elevationData.sort((a, b) => a.elevation - b.elevation);
      const lowestPoint = sortedByElevation[0];
      const highestPoint = sortedByElevation[sortedByElevation.length - 1];
      
      // Calculate elevation range (rise)
      const elevationRange = highestPoint.elevation - lowestPoint.elevation;
      
      // Calculate horizontal distance between highest and lowest points (run)
      const horizontalDistance = turf.distance(
        turf.point(lowestPoint.coordinates), 
        turf.point(highestPoint.coordinates), 
        { units: 'meters' }
      );
      
      // Calculate slope (rise over run)
      const slope = (elevationRange / horizontalDistance) * 100; // Convert to m per 100m
      
      // Clamp to reasonable range (0.1 to 50 m per 100m)
      const finalSlope = Math.max(0.1, Math.min(50, slope));
      
      console.log(`Slope extraction: elevation range ${elevationRange.toFixed(2)}m, horizontal distance ${horizontalDistance.toFixed(2)}m, slope ${finalSlope.toFixed(2)} m/100m`);
      console.log(`Highest point: ${highestPoint.elevation.toFixed(2)}m at [${highestPoint.coordinates[0].toFixed(6)}, ${highestPoint.coordinates[1].toFixed(6)}]`);
      console.log(`Lowest point: ${lowestPoint.elevation.toFixed(2)}m at [${lowestPoint.coordinates[0].toFixed(6)}, ${lowestPoint.coordinates[1].toFixed(6)}]`);
      
      return finalSlope;
      
    } catch (error) {
      console.error('Error extracting slope from terrain:', error);
      return 5; // Default fallback
    }
  };

  // Calculate flow path length from highest point to lowest point (outlet)
  const calculateFlowPathLength = async (coordinates: number[][]) => {
    try {
      // Get elevation data for all polygon boundary points
      const elevationData = [];
      for (const coord of coordinates) {
        try {
          const elevation = await map.current.queryTerrainElevation(coord);
          if (elevation !== null && elevation !== undefined && !isNaN(elevation)) {
            elevationData.push({
              coordinates: coord,
              elevation: elevation
            });
          }
        } catch (error) {
          console.warn('Could not get elevation for point:', coord, error);
        }
      }
      
      if (elevationData.length < 2) {
        console.warn('Insufficient elevation data for flow path calculation, using default');
        return 200; // Default fallback
      }
      
      // Find highest and lowest elevation points (outlet)
      const sortedByElevation = elevationData.sort((a, b) => a.elevation - b.elevation);
      const lowestPoint = sortedByElevation[0]; // This is the outlet
      const highestPoint = sortedByElevation[sortedByElevation.length - 1];
      
      // Calculate actual distance from highest point to outlet (lowest point)
      const flowPathLength = turf.distance(
        turf.point(highestPoint.coordinates), 
        turf.point(lowestPoint.coordinates), 
        { units: 'meters' }
      );
      
      const roundedFlowPathLength = Math.round(flowPathLength);
      
      console.log(`Flow path calculation: from highest point (${highestPoint.elevation.toFixed(2)}m) to outlet (${lowestPoint.elevation.toFixed(2)}m)`);
      console.log(`Flow path length: ${roundedFlowPathLength}m`);
      console.log(`Outlet coordinates: [${lowestPoint.coordinates[0].toFixed(6)}, ${lowestPoint.coordinates[1].toFixed(6)}]`);
      
      return roundedFlowPathLength;
    } catch (error) {
      console.error('Error calculating flow path length:', error);
      return 200; // Default fallback
    }
  };

  // Process a polygon feature and create catchment data
  const processPolygonFeature = async (feature: unknown) => {
    try {
      setIsExtractingSlope(true);
      
      // Calculate area using Turf.js
      const area = turf.area(feature); // Returns area in square meters
      
      // Calculate centroid
      const centroid = turf.centroid(feature);
      const center: [number, number] = centroid.geometry.coordinates as [number, number];
      
      // Extract coordinates
      const coordinates = feature.geometry.coordinates[0]; // First ring of polygon
      
      // Generate unique ID
      const id = `catchment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Extract slope from terrain (async operation)
      const averageSlope = await extractSlopeFromTerrain(coordinates);
      
      // Calculate flow path length (async operation)
      const flowPathLength = await calculateFlowPathLength(coordinates);
      
      // Create catchment data with extracted values
      const catchment: CatchmentData = {
        id,
        name: `Catchment ${catchments.length + 1}`,
        coordinates,
        area: Math.round(area), // Round to nearest square meter
        center,
        
        // Extracted catchment properties
        averageSlope: Math.round(averageSlope * 10) / 10, // Round to 1 decimal place
        flowPathLength: flowPathLength,
        surfaceType: "asphalt", // Default to asphalt/concrete
        runoffCoefficient: 0.9, // Default coefficient for asphalt
        
        // Default rainfall properties
        returnPeriod: 10, // years
        useIDF: true,
      };
      
      // Call the callback to add the catchment
      onCatchmentAdded(catchment);
      
      // Add catchment name label to the map
      addCatchmentLabel(catchment);
      
    } catch (error) {
      console.error("Error processing polygon feature:", error);
      alert("Error processing the drawn polygon. Please try again.");
    } finally {
      setIsExtractingSlope(false);
    }
  };

  // Add catchment name label to the map
  const addCatchmentLabel = (catchment: CatchmentData) => {
    if (!map.current) return;

    try {
      // Create a point at the centroid for the label
      const labelPoint = {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: catchment.center
        },
        properties: {
          id: catchment.id,
          name: catchment.name,
          type: 'catchment-label'
        }
      };

      // Add source if it doesn't exist
      if (!map.current.getSource('catchment-labels')) {
        map.current.addSource('catchment-labels', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: []
          }
        });
      }

      // Add layer if it doesn't exist
      if (!map.current.getLayer('catchment-labels')) {
        map.current.addLayer({
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
        });
      }

      // Add channel labels source if it doesn't exist
      if (!map.current.getSource('channel-labels')) {
        map.current.addSource('channel-labels', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: []
          }
        });
      }

      // Add channel labels layer if it doesn't exist
      if (!map.current.getLayer('channel-labels')) {
        map.current.addLayer({
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
        });
      }

      // Update the source with new label
      const currentFeatures = map.current.getSource('catchment-labels')._data.features || [];
      map.current.getSource('catchment-labels').setData({
        type: 'FeatureCollection',
        features: [...currentFeatures, labelPoint]
      });

    } catch (error) {
      console.error('Error adding catchment label:', error);
    }
  };

  // Remove catchment label from the map
  // const removeCatchmentLabel = (catchmentId: string) => {
  //   if (!map.current || !map.current.getSource('catchment-labels')) return;

  //   try {
  //     const currentFeatures = map.current.getSource('catchment-labels')._data.features || [];
  //     const filteredFeatures = currentFeatures.filter((feature: unknown) => feature.properties.id !== catchmentId);
      
  //     map.current.getSource('catchment-labels').setData({
  //       type: 'FeatureCollection',
  //       features: filteredFeatures
  //     });
  //   } catch (error) {
  //     console.error('Error removing catchment label:', error);
  //   }
  // };

  // Process a line feature for channel alignment
  const processLineFeature = async (feature: unknown) => {
    try {
      // Calculate line length using Turf.js
      const length = turf.length(feature, { units: 'meters' });
      
      // Get line coordinates
      const coordinates = feature.geometry.coordinates;
      
      // Generate unique ID
      const id = `channel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Calculate gradient from elevation data
      const calculatedGradient = await calculateChannelGradient(coordinates);
      
      // Create channel data
      const channel = {
        id,
        name: `Channel ${channels.length + 1}`,
        coordinates,
        length: Math.round(length),
        type: 'channel_alignment',
        // Link to catchment (none by default)
        linkedCatchmentId: undefined,
        // Channel properties with calculated values
        channelShape: "trapezoidal" as const,
        channelGradient: calculatedGradient, // Auto-calculated gradient
        channelMaterial: "concrete", // default material
        manualGradientOverride: false, // Auto-calculated by default
        // Upstream channels (empty by default)
        upstreamChannels: []
      };
      
      // Add to channels state
      // Call the callback to add the channel
      onChannelAdded(channel);
      
      console.log('Channel alignment created:', channel);
      
    } catch (error) {
      console.error("Error processing line feature:", error);
      alert("Error processing the drawn line. Please try again.");
    }
  };

  // Toolbar functions
  const setDrawingMode = (mode: string) => {
    if (draw.current) {
      draw.current.changeMode(mode);
      setCurrentMode(mode);
    }
  };

  const clearAllFeatures = () => {
    if (draw.current) {
      draw.current.deleteAll();
    }
    
    // Remove all catchments from the parent component
    catchments.forEach(catchment => {
      if (onCatchmentRemoved) {
        onCatchmentRemoved(catchment.id);
      }
    });
    
    // Remove all channels from the parent component
    channels.forEach(channel => {
      if (onChannelRemoved) {
        onChannelRemoved(channel.id);
      }
    });
  };

  // Draw visualization lines for slope and flow path calculations
  const drawVisualizationLines = async () => {
    if (!map.current || !turf) return;

    try {
      // Remove existing visualization layers
      if (map.current.getLayer('slope-line')) {
        map.current.removeLayer('slope-line');
      }
      if (map.current.getSource('slope-line')) {
        map.current.removeSource('slope-line');
      }
      if (map.current.getLayer('flow-path-line')) {
        map.current.removeLayer('flow-path-line');
      }
      if (map.current.getSource('flow-path-line')) {
        map.current.removeSource('flow-path-line');
      }

      // Process each catchment
      for (const catchment of catchments) {
        const coordinates = catchment.coordinates;
        
        // Get elevation data for all polygon boundary points
        const elevationData = [];
        for (const coord of coordinates) {
          try {
            const elevation = await map.current.queryTerrainElevation(coord);
            if (elevation !== null && elevation !== undefined && !isNaN(elevation)) {
              elevationData.push({
                coordinates: coord,
                elevation: elevation
              });
            }
          } catch (error) {
            console.warn('Could not get elevation for visualization:', coord, error);
          }
        }

        if (elevationData.length < 2) continue;

        // Find highest and lowest elevation points
        const sortedByElevation = elevationData.sort((a, b) => a.elevation - b.elevation);
        const lowestPoint = sortedByElevation[0];
        const highestPoint = sortedByElevation[sortedByElevation.length - 1];

        // Create slope line (highest to lowest)
        const slopeLine = {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [highestPoint.coordinates, lowestPoint.coordinates]
          },
          properties: {
            type: 'slope',
            catchmentId: catchment.id,
            highestElevation: highestPoint.elevation,
            lowestElevation: lowestPoint.elevation,
            distance: turf.distance(
              turf.point(highestPoint.coordinates),
              turf.point(lowestPoint.coordinates),
              { units: 'meters' }
            )
          }
        };

        // Create flow path line (same as slope line for this implementation)
        const flowPathLine = {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [highestPoint.coordinates, lowestPoint.coordinates]
          },
          properties: {
            type: 'flow-path',
            catchmentId: catchment.id,
            highestElevation: highestPoint.elevation,
            lowestElevation: lowestPoint.elevation,
            distance: turf.distance(
              turf.point(highestPoint.coordinates),
              turf.point(lowestPoint.coordinates),
              { units: 'meters' }
            )
          }
        };

        // Add slope line source and layer
        if (!map.current.getSource('slope-line')) {
          map.current.addSource('slope-line', {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: []
            }
          });
        }

        if (!map.current.getLayer('slope-line')) {
          map.current.addLayer({
            id: 'slope-line',
            type: 'line',
            source: 'slope-line',
            paint: {
              'line-color': '#ff6b6b',
              'line-width': 3,
              'line-dasharray': [2, 2]
            }
          });
        }

        // Add flow path line source and layer
        if (!map.current.getSource('flow-path-line')) {
          map.current.addSource('flow-path-line', {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: []
            }
          });
        }

        if (!map.current.getLayer('flow-path-line')) {
          map.current.addLayer({
            id: 'flow-path-line',
            type: 'line',
            source: 'flow-path-line',
            paint: {
              'line-color': '#4ecdc4',
              'line-width': 3,
              'line-dasharray': [1, 1]
            }
          });
        }

        // Update sources with new features
        const currentSlopeFeatures = map.current.getSource('slope-line')._data.features || [];
        const currentFlowPathFeatures = map.current.getSource('flow-path-line')._data.features || [];

        map.current.getSource('slope-line').setData({
          type: 'FeatureCollection',
          features: [...currentSlopeFeatures, slopeLine]
        });

        map.current.getSource('flow-path-line').setData({
          type: 'FeatureCollection',
          features: [...currentFlowPathFeatures, flowPathLine]
        });
      }

      console.log('Visualization lines drawn for all catchments');
    } catch (error) {
      console.error('Error drawing visualization lines:', error);
    }
  };

  // Clear visualization lines
  const clearVisualizationLines = () => {
    if (!map.current) return;

    try {
      if (map.current.getLayer('slope-line')) {
        map.current.removeLayer('slope-line');
      }
      if (map.current.getSource('slope-line')) {
        map.current.removeSource('slope-line');
      }
      if (map.current.getLayer('flow-path-line')) {
        map.current.removeLayer('flow-path-line');
      }
      if (map.current.getSource('flow-path-line')) {
        map.current.removeSource('flow-path-line');
      }
      console.log('Visualization lines cleared');
    } catch (error) {
      console.error('Error clearing visualization lines:', error);
    }
  };

  // Start line measuring mode
  const startLineMeasuring = () => {
    setIsMeasuring(true);
    setMeasurementPoints([]);
    setMeasurementResults(null);
    setCurrentMode('measure_line');
    
    // Add click event listener for measuring
    if (map.current) {
      map.current.on('click', handleMeasureClick);
      map.current.getCanvas().style.cursor = 'crosshair';
    }
  };

  // Stop line measuring mode
  const stopLineMeasuring = () => {
    setIsMeasuring(false);
    setCurrentMode('simple_select');
    
    if (map.current) {
      map.current.off('click', handleMeasureClick);
      map.current.getCanvas().style.cursor = '';
    }
    
    // Clear measurement line
    clearMeasurementLine();
  };

  // Handle click for measuring
  const handleMeasureClick = async (e: unknown) => {
    if (!isMeasuring || !map.current) return;

    const newPoint = [e.lngLat.lng, e.lngLat.lat];
    const newPoints = [...measurementPoints, newPoint];
    setMeasurementPoints(newPoints);

    if (newPoints.length === 2) {
      // Calculate measurements
      await calculateMeasurements(newPoints);
      // Draw measurement line
      drawMeasurementLine(newPoints);
    } else if (newPoints.length > 2) {
      // Reset for new measurement
      setMeasurementPoints([newPoint]);
      setMeasurementResults(null);
      clearMeasurementLine();
    }
  };

  // Calculate measurements between two points
  const calculateMeasurements = async (points: number[][]) => {
    if (!map.current || points.length !== 2) return;

    try {
      const [point1, point2] = points;
      
      // Get elevations
      const elevation1 = await map.current.queryTerrainElevation(point1);
      const elevation2 = await map.current.queryTerrainElevation(point2);
      
      // Calculate horizontal distance
      const horizontalDistance = turf.distance(
        turf.point(point1),
        turf.point(point2),
        { units: 'meters' }
      );
      
      // Calculate elevation difference
      const elevationDiff = elevation2 - elevation1;
      
      // Calculate gradient (slope)
      const gradient = horizontalDistance > 0 ? (elevationDiff / horizontalDistance) * 100 : 0;
      
      setMeasurementResults({
        horizontalDistance: horizontalDistance,
        elevationDiff: elevationDiff,
        gradient: gradient,
        elevation1: elevation1,
        elevation2: elevation2
      });
      
      console.log('Measurements:', {
        horizontalDistance: horizontalDistance.toFixed(2) + 'm',
        elevationDiff: elevationDiff.toFixed(2) + 'm',
        gradient: gradient.toFixed(2) + '%'
      });
      
    } catch (error) {
      console.error('Error calculating measurements:', error);
    }
  };

  // Draw measurement line
  const drawMeasurementLine = (points: number[][]) => {
    if (!map.current || points.length !== 2) return;

    try {
      const lineFeature = {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: points
        },
        properties: {
          type: 'measurement'
        }
      };

      // Add source if it doesn't exist
      if (!map.current.getSource('measurement-line')) {
        map.current.addSource('measurement-line', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: []
          }
        });
      }

      // Add layer if it doesn't exist
      if (!map.current.getLayer('measurement-line')) {
        map.current.addLayer({
          id: 'measurement-line',
          type: 'line',
          source: 'measurement-line',
          paint: {
            'line-color': '#ff0000',
            'line-width': 3,
            'line-dasharray': [1, 1]
          }
        });
      }

      // Update source
      map.current.getSource('measurement-line').setData({
        type: 'FeatureCollection',
        features: [lineFeature]
      });

    } catch (error) {
      console.error('Error drawing measurement line:', error);
    }
  };

  // Clear measurement line
  const clearMeasurementLine = () => {
    if (!map.current) return;

    try {
      if (map.current.getLayer('measurement-line')) {
        map.current.removeLayer('measurement-line');
      }
      if (map.current.getSource('measurement-line')) {
        map.current.removeSource('measurement-line');
      }
    } catch (error) {
      console.error('Error clearing measurement line:', error);
    }
  };

  const clearCatchments = () => {
    if (draw.current) {
      const features = draw.current.getAll();
      features.features.forEach((feature: unknown) => {
        if (feature.geometry.type === 'Polygon') {
          draw.current.delete(feature.id);
        }
      });
    }
    
    // Remove all catchments from the parent component
    catchments.forEach(catchment => {
      if (onCatchmentRemoved) {
        onCatchmentRemoved(catchment.id);
      }
    });
  };

  const clearChannels = () => {
    if (draw.current) {
      const features = draw.current.getAll();
      features.features.forEach((feature: unknown) => {
        if (feature.geometry.type === 'LineString') {
          draw.current.delete(feature.id);
        }
      });
    }
    
    // Remove all channels from the parent component
    channels.forEach(channel => {
      if (onChannelRemoved) {
        onChannelRemoved(channel.id);
      }
    });
  };

  return (
    <div className="relative w-full h-full">
      {/* Map container */}
      <div ref={mapContainer} className="w-full h-full" />
      
      {/* Error state */}
      {mapError && (
        <div className="absolute inset-0 bg-red-50 flex items-center justify-center">
          <div className="text-center p-6 max-w-md">
            <div className="text-red-600 text-4xl mb-4">⚠️</div>
            <h3 className="font-semibold text-red-800 mb-2">Map Loading Error</h3>
            <p className="text-red-600 text-sm mb-4">{mapError}</p>
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
      {isLoading && !mapError && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading 3D Map...</p>
            <p className="text-xs text-gray-500 mt-2">This may take a few moments</p>
          </div>
        </div>
      )}
      
      {/* Tools Toggle Button */}
      {isMapLoaded && !mapError && (
        <div className="absolute top-4 left-4 z-10">
          <button
            onClick={() => setShowToolsPopup(!showToolsPopup)}
            className="bg-white rounded-lg shadow-lg p-3 hover:bg-gray-50 transition-colors"
            title="Drawing Tools"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">🛠️</span>
              <span className="text-sm font-medium">Tools</span>
              <span className={`text-xs transition-transform ${showToolsPopup ? 'rotate-180' : ''}`}>▼</span>
            </div>
          </button>
        </div>
      )}

      {/* Tools Popup Side Panel */}
      {isMapLoaded && !mapError && showToolsPopup && (
        <div className="absolute top-4 left-20 z-10 bg-white rounded-lg shadow-lg p-4 w-64">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm text-gray-700">Drawing Tools</h3>
            <button
              onClick={() => setShowToolsPopup(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          
          {/* Tool Selection */}
          <div className="space-y-2 mb-4">
            <button
              onClick={() => setDrawingMode('simple_select')}
              className={`w-full text-left px-3 py-2 rounded text-sm font-medium transition-colors ${
                currentMode === 'simple_select' 
                  ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <span className="mr-2">🖱️</span>
              Select/Move
            </button>
            
            <button
              onClick={() => setDrawingMode('draw_polygon')}
              className={`w-full text-left px-3 py-2 rounded text-sm font-medium transition-colors ${
                currentMode === 'draw_polygon' 
                  ? 'bg-green-100 text-green-700 border border-green-300' 
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <span className="mr-2">📐</span>
              Draw Catchment
            </button>
            
            <button
              onClick={() => setDrawingMode('draw_line_string')}
              className={`w-full text-left px-3 py-2 rounded text-sm font-medium transition-colors ${
                currentMode === 'draw_line_string' 
                  ? 'bg-orange-100 text-orange-700 border border-orange-300' 
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <span className="mr-2">📏</span>
              Draw Channel
            </button>
            
            <button
              onClick={isMeasuring ? stopLineMeasuring : startLineMeasuring}
              className={`w-full text-left px-3 py-2 rounded text-sm font-medium transition-colors ${
                isMeasuring 
                  ? 'bg-red-100 text-red-700 border border-red-300' 
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <span className="mr-2">📐</span>
              {isMeasuring ? 'Stop Measuring' : 'Measure Line'}
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
                🗑️ Clear Catchments
              </button>
              <button
                onClick={clearChannels}
                className="w-full text-left px-2 py-1 rounded text-xs hover:bg-orange-50 text-orange-600"
              >
                🗑️ Clear Channels
              </button>
              <button
                onClick={clearAllFeatures}
                className="w-full text-left px-2 py-1 rounded text-xs hover:bg-red-50 text-red-600"
              >
                🗑️ Clear All
              </button>
            </div>
          </div>

          {/* Visualization Controls */}
          <div className="mb-4 pt-3 border-t border-gray-200">
            <h4 className="font-medium text-xs text-gray-600 mb-2">Visualization</h4>
            <div className="space-y-1">
              <button
                onClick={drawVisualizationLines}
                className="w-full text-left px-2 py-1 rounded text-xs hover:bg-blue-50 text-blue-600"
                disabled={catchments.length === 0}
              >
                📏 Show Slope & Flow Path Lines
              </button>
              <button
                onClick={clearVisualizationLines}
                className="w-full text-left px-2 py-1 rounded text-xs hover:bg-gray-50 text-gray-600"
              >
                🚫 Hide Lines
              </button>
            </div>
          </div>
          
          {/* Measurement Results */}
          {measurementResults && (
            <div className="mb-4 pt-3 border-t border-gray-200">
              <h4 className="font-medium text-xs text-gray-600 mb-2">Measurement Results</h4>
              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span>Distance:</span>
                  <span className="font-medium">{measurementResults.horizontalDistance.toFixed(2)}m</span>
                </div>
                <div className="flex justify-between">
                  <span>Elevation Diff:</span>
                  <span className="font-medium">{measurementResults.elevationDiff.toFixed(2)}m</span>
                </div>
                <div className="flex justify-between">
                  <span>Gradient:</span>
                  <span className="font-medium">{measurementResults.gradient.toFixed(2)}%</span>
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  <div>Point 1: {measurementResults.elevation1.toFixed(2)}m</div>
                  <div>Point 2: {measurementResults.elevation2.toFixed(2)}m</div>
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
              {isExtractingSlope && (
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

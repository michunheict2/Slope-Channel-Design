/**
 * Custom hook for managing measurement functionality
 * 
 * This hook encapsulates all measurement-related state and logic,
 * including point collection, calculation, and visualization.
 */

import { useState, useCallback } from 'react';
import { MeasurementResults } from '../utils/visualizationUtils';
import { 
  clearMeasurementLine,
  handleMeasurementClick 
} from '../utils/visualizationUtils';

/**
 * Interface for measurement state
 */
export interface MeasurementState {
  isMeasuring: boolean;
  measurementPoints: number[][];
  measurementResults: MeasurementResults | null;
}

/**
 * Interface for measurement controls
 */
export interface MeasurementControls {
  startMeasuring: () => void;
  stopMeasuring: () => void;
  handleClick: (e: any) => Promise<void>;
  clearResults: () => void;
}

/**
 * Interface for measurement hook return value
 */
export interface UseMeasurementReturn {
  measurementState: MeasurementState;
  measurementControls: MeasurementControls;
  setMeasurementState: React.Dispatch<React.SetStateAction<MeasurementState>>;
}

/**
 * Custom hook for managing measurement functionality
 * 
 * @param map - The Mapbox map instance
 * @param onModeChange - Callback when measurement mode changes
 * @returns Measurement state and controls
 */
export function useMeasurement(
  map: any,
  onModeChange?: (mode: string) => void
): UseMeasurementReturn {
  const [measurementState, setMeasurementState] = useState<MeasurementState>({
    isMeasuring: false,
    measurementPoints: [],
    measurementResults: null
  });

  /**
   * Start measurement mode
   */
  const startMeasuring = useCallback(() => {
    setMeasurementState(prev => ({
      ...prev,
      isMeasuring: true,
      measurementPoints: [],
      measurementResults: null
    }));
    
    if (onModeChange) {
      onModeChange('measure_line');
    }
    
    // Add click event listener for measuring
    if (map) {
      const handleClick = async (e: any) => {
        await handleMeasurementClick(
          map,
          e,
          measurementState.measurementPoints,
          (points) => setMeasurementState(prev => ({ ...prev, measurementPoints: points })),
          (results) => setMeasurementState(prev => ({ ...prev, measurementResults: results })),
          () => clearMeasurementLine(map)
        );
      };
      
      map.on('click', handleClick);
      map.getCanvas().style.cursor = 'crosshair';
    }
  }, [map, onModeChange, measurementState.measurementPoints]);

  /**
   * Stop measurement mode
   */
  const stopMeasuring = useCallback(() => {
    setMeasurementState(prev => ({
      ...prev,
      isMeasuring: false
    }));
    
    if (onModeChange) {
      onModeChange('simple_select');
    }
    
    if (map) {
      map.off('click');
      map.getCanvas().style.cursor = '';
    }
    
    // Clear measurement line
    clearMeasurementLine(map);
  }, [map, onModeChange]);

  /**
   * Handle click events during measurement
   */
  const handleClick = useCallback(async (e: any) => {
    if (!measurementState.isMeasuring || !map) return;

    await handleMeasurementClick(
      map,
      e,
      measurementState.measurementPoints,
      (points) => setMeasurementState(prev => ({ ...prev, measurementPoints: points })),
      (results) => setMeasurementState(prev => ({ ...prev, measurementResults: results })),
      () => clearMeasurementLine(map)
    );
  }, [map, measurementState.isMeasuring, measurementState.measurementPoints]);

  /**
   * Clear measurement results
   */
  const clearResults = useCallback(() => {
    setMeasurementState(prev => ({
      ...prev,
      measurementPoints: [],
      measurementResults: null
    }));
    clearMeasurementLine(map);
  }, [map]);

  const measurementControls: MeasurementControls = {
    startMeasuring,
    stopMeasuring,
    handleClick,
    clearResults
  };

  return {
    measurementState,
    measurementControls,
    setMeasurementState
  };
}

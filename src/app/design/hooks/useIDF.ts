import { useState, useEffect, useMemo } from 'react';

// Types for IDF constants
export interface IDFConstants {
  RP: number;
  a: number;
  b: number;
  c: number;
}

// Types for IDF calculation result
export interface IDFResult {
  intensity: number; // mm/hr
  intensitySI: number; // m/s
  rawIntensity: number; // mm/hr (before climate change adjustment)
  constants: IDFConstants;
  duration: number; // minutes
  returnPeriod: number;
  climateChangeApplied: boolean;
  temporaryDesign: boolean;
  formula: string;
}

// Cache for IDF constants
let idfConstantsCache: IDFConstants[] | null = null;

/**
 * Load IDF constants from the JSON file
 * Caches the result for subsequent calls
 */
export const loadIDFConstants = async (): Promise<IDFConstants[]> => {
  if (idfConstantsCache) {
    return idfConstantsCache;
  }

  try {
    const response = await fetch('/data/idf_constants_hk.json');
    if (!response.ok) {
      throw new Error(`Failed to load IDF constants: ${response.statusText}`);
    }
    const data = await response.json();
    idfConstantsCache = data.idf_constants;
    return idfConstantsCache;
  } catch (error) {
    console.error('Error loading IDF constants:', error);
    throw error;
  }
};

/**
 * Calculate rainfall intensity using Hong Kong IDF curve formula
 * Based on GEO Technical Guidance Note No. 30 (2023)
 * 
 * Formula: i = a / (t + b)^c
 * Where:
 * - i = rainfall intensity (mm/hr)
 * - t = duration in minutes (time of concentration)
 * - a, b, c = constants for specific return period
 * 
 * Climate change adjustment: +28.1% (multiply by 1.281) unless temporary design
 */
export const calculateIDF = (
  returnPeriod: number,
  duration: number,
  temporaryDesign: boolean = false
): IDFResult => {
  // Find constants for the specified return period
  const constants = idfConstantsCache?.find(c => c.RP === returnPeriod);
  
  if (!constants) {
    throw new Error(`No IDF constants found for return period ${returnPeriod} years`);
  }

  // Calculate raw intensity using the formula: i = a / (t + b)^c
  const rawIntensity = constants.a / Math.pow(duration + constants.b, constants.c);
  
  // Apply climate change adjustment (+28.1%) unless it's a temporary design
  const climateChangeApplied = !temporaryDesign;
  const intensity = climateChangeApplied ? rawIntensity * 1.281 : rawIntensity;
  
  // Convert to SI units (mm/hr to m/s): 1 mm/hr = 1e-6 m/s
  const intensitySI = intensity * 1e-6;
  
  // Create formula string for display
  const formula = `i = ${constants.a} / (${duration} + ${constants.b})^${constants.c}`;
  
  return {
    intensity,
    intensitySI,
    rawIntensity,
    constants,
    duration,
    returnPeriod,
    climateChangeApplied,
    temporaryDesign,
    formula
  };
};

/**
 * Hook for IDF calculations with loading state
 */
export const useIDF = () => {
  const [constants, setConstants] = useState<IDFConstants[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadConstants = async () => {
      try {
        setLoading(true);
        setError(null);
        const loadedConstants = await loadIDFConstants();
        setConstants(loadedConstants);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load IDF constants');
      } finally {
        setLoading(false);
      }
    };

    loadConstants();
  }, []);

  /**
   * Calculate IDF with current constants
   */
  const calculate = useMemo(() => {
    return (returnPeriod: number, duration: number, temporaryDesign: boolean = false): IDFResult => {
      if (constants.length === 0) {
        throw new Error('IDF constants not loaded');
      }
      return calculateIDF(returnPeriod, duration, temporaryDesign);
    };
  }, [constants]);

  /**
   * Get available return periods
   */
  const getReturnPeriods = useMemo(() => {
    return constants.map(c => c.RP).sort((a, b) => a - b);
  }, [constants]);

  /**
   * Get constants for a specific return period
   */
  const getConstantsForRP = useMemo(() => {
    return (returnPeriod: number): IDFConstants | undefined => {
      return constants.find(c => c.RP === returnPeriod);
    };
  }, [constants]);

  return {
    constants,
    loading,
    error,
    calculate,
    getReturnPeriods,
    getConstantsForRP
  };
};

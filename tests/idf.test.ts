import { describe, it, expect, beforeAll } from 'vitest';
import { calculateIDF, loadIDFConstants, type IDFConstants } from '../src/app/design/hooks/useIDF';

// Mock fetch for testing
global.fetch = async (url: string) => {
  if (url.includes('idf_constants_hk.json')) {
    return {
      ok: true,
      json: async () => ({
        idf_constants: [
          { "RP": 2, "a": 570, "b": 5, "c": 0.44 },
          { "RP": 5, "a": 660, "b": 5, "c": 0.44 },
          { "RP": 10, "a": 720, "b": 5, "c": 0.44 },
          { "RP": 20, "a": 780, "b": 5, "c": 0.44 },
          { "RP": 50, "a": 890, "b": 5, "c": 0.44 },
          { "RP": 100, "a": 960, "b": 5, "c": 0.44 },
          { "RP": 200, "a": 1050, "b": 5, "c": 0.44 },
          { "RP": 500, "a": 1170, "b": 5, "c": 0.44 },
          { "RP": 1000, "a": 1260, "b": 5, "c": 0.44 }
        ]
      })
    } as Response;
  }
  throw new Error('Unknown URL');
};

describe('IDF Curve Calculations', () => {
  beforeAll(async () => {
    // Load constants before running tests
    await loadIDFConstants();
  });

  describe('IDF Formula Validation', () => {
    it('should calculate correct intensity for 10-year return period, 60-minute duration', () => {
      const result = calculateIDF(10, 60, false);
      
      // Calculate expected values
      const expected = 720 / Math.pow(60 + 5, 0.44);
      const expectedWithClimate = expected * 1.281;
      
      expect(result.rawIntensity).toBeCloseTo(expected, 2);
      expect(result.intensity).toBeCloseTo(expectedWithClimate, 2);
      expect(result.returnPeriod).toBe(10);
      expect(result.duration).toBe(60);
      expect(result.climateChangeApplied).toBe(true);
      expect(result.temporaryDesign).toBe(false);
    });

    it('should apply climate change adjustment for permanent design', () => {
      const result = calculateIDF(100, 30, false);
      
      // Raw intensity without climate change
      const rawExpected = 960 / Math.pow(30 + 5, 0.44);
      expect(result.rawIntensity).toBeCloseTo(rawExpected, 2);
      
      // Final intensity with 28.1% climate change adjustment
      expect(result.intensity).toBeCloseTo(rawExpected * 1.281, 2);
      expect(result.climateChangeApplied).toBe(true);
    });

    it('should not apply climate change adjustment for temporary design', () => {
      const result = calculateIDF(100, 30, true);
      
      // Raw intensity should equal final intensity
      const expected = 960 / Math.pow(30 + 5, 0.44);
      expect(result.rawIntensity).toBeCloseTo(expected, 2);
      expect(result.intensity).toBeCloseTo(expected, 2);
      expect(result.climateChangeApplied).toBe(false);
      expect(result.temporaryDesign).toBe(true);
    });

    it('should convert intensity to SI units correctly', () => {
      const result = calculateIDF(50, 45, false);
      
      // SI conversion: 1 mm/hr = 1e-6 m/s
      const expectedSI = result.intensity * 1e-6;
      expect(result.intensitySI).toBeCloseTo(expectedSI, 8);
    });

    it('should generate correct formula string', () => {
      const result = calculateIDF(20, 90, false);
      
      expect(result.formula).toBe('i = 780 / (90 + 5)^0.44');
      expect(result.constants.a).toBe(780);
      expect(result.constants.b).toBe(5);
      expect(result.constants.c).toBe(0.44);
    });
  });

  describe('Return Period Coverage', () => {
    const testCases = [
      { RP: 2, a: 570 },
      { RP: 5, a: 660 },
      { RP: 10, a: 720 },
      { RP: 20, a: 780 },
      { RP: 50, a: 890 },
      { RP: 100, a: 960 },
      { RP: 200, a: 1050 },
      { RP: 500, a: 1170 },
      { RP: 1000, a: 1260 }
    ];

    testCases.forEach(({ RP, a }) => {
      it(`should handle ${RP}-year return period correctly`, () => {
        const result = calculateIDF(RP, 60, false);
        
        expect(result.returnPeriod).toBe(RP);
        expect(result.constants.a).toBe(a);
        expect(result.constants.b).toBe(5);
        expect(result.constants.c).toBe(0.44);
        
        // Verify the calculation is reasonable
        expect(result.rawIntensity).toBeGreaterThan(0);
        expect(result.intensity).toBeGreaterThan(result.rawIntensity);
      });
    });
  });

  describe('Duration Variations', () => {
    it('should handle short duration (5 minutes)', () => {
      const result = calculateIDF(10, 5, false);
      
      expect(result.duration).toBe(5);
      expect(result.rawIntensity).toBeGreaterThan(100); // Should be high for short duration
      expect(result.formula).toBe('i = 720 / (5 + 5)^0.44');
    });

    it('should handle long duration (240 minutes)', () => {
      const result = calculateIDF(10, 240, false);
      
      expect(result.duration).toBe(240);
      expect(result.rawIntensity).toBeLessThan(100); // Should be low for long duration
      expect(result.formula).toBe('i = 720 / (240 + 5)^0.44');
    });

    it('should handle typical design duration (60 minutes)', () => {
      const result = calculateIDF(50, 60, false);
      
      expect(result.duration).toBe(60);
      expect(result.rawIntensity).toBeGreaterThan(50);
      expect(result.rawIntensity).toBeLessThan(200);
    });
  });

  describe('Edge Cases', () => {
    it('should throw error for invalid return period', () => {
      expect(() => calculateIDF(999, 60, false)).toThrow('No IDF constants found for return period 999 years');
    });

    it('should handle very short duration (1 minute)', () => {
      const result = calculateIDF(100, 1, false);
      
      expect(result.duration).toBe(1);
      expect(result.rawIntensity).toBeGreaterThan(0);
      expect(result.intensity).toBeGreaterThan(result.rawIntensity);
    });

    it('should maintain precision for small durations', () => {
      const result = calculateIDF(20, 2, false);
      
      expect(result.rawIntensity).toBeCloseTo(780 / Math.pow(2 + 5, 0.44), 3);
      expect(result.intensity).toBeCloseTo(result.rawIntensity * 1.281, 3);
    });
  });

  describe('Climate Change Logic', () => {
    it('should correctly identify when climate change is applied', () => {
      const permanent = calculateIDF(10, 60, false);
      const temporary = calculateIDF(10, 60, true);
      
      expect(permanent.climateChangeApplied).toBe(true);
      expect(temporary.climateChangeApplied).toBe(false);
      
      expect(permanent.intensity).toBeGreaterThan(temporary.intensity);
      expect(permanent.rawIntensity).toBeCloseTo(temporary.rawIntensity, 5);
    });

    it('should apply exactly 28.1% increase for permanent designs', () => {
      const result = calculateIDF(50, 45, false);
      
      const expectedIncrease = result.rawIntensity * 0.281;
      const actualIncrease = result.intensity - result.rawIntensity;
      
      expect(actualIncrease).toBeCloseTo(expectedIncrease, 2);
    });
  });
});

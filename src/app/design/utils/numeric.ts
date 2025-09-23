/**
 * Numerical methods for solving equations
 */

export interface BisectionOptions {
  maxIterations?: number;
  tolerance?: number;
  minBound?: number;
  maxBound?: number;
}

export interface BisectionResult {
  root: number;
  iterations: number;
  converged: boolean;
  finalError: number;
}

/**
 * Generic bisection method for finding roots of f(x) = 0
 * 
 * @param func Function to find root of (should be continuous)
 * @param lowerBound Lower bound of search interval
 * @param upperBound Upper bound of search interval
 * @param options Configuration options
 * @returns Root approximation and convergence info
 */
export function bisection(
  func: (x: number) => number,
  lowerBound: number,
  upperBound: number,
  options: BisectionOptions = {}
): BisectionResult {
  const {
    maxIterations = 80,
    tolerance = 1e-4,
    minBound = lowerBound,
    maxBound = upperBound,
  } = options;

  // Validate bounds
  if (lowerBound >= upperBound) {
    throw new Error("Lower bound must be less than upper bound");
  }

  if (minBound >= maxBound) {
    throw new Error("Min bound must be less than max bound");
  }

  // Clamp bounds to allowed range
  const a = Math.max(lowerBound, minBound);
  const b = Math.min(upperBound, maxBound);

  if (a >= b) {
    throw new Error("Search interval is empty after clamping to bounds");
  }

  // Check if function values have opposite signs at bounds
  const fa = func(a);
  const fb = func(b);

  if (fa * fb > 0) {
    // Try to find a valid interval by expanding bounds
    let expandedA = a;
    let expandedB = b;
    let expandedFa = fa;
    let expandedFb = fb;
    
    // Expand interval up to max iterations
    for (let i = 0; i < maxIterations && expandedFa * expandedFb > 0; i++) {
      const mid = (expandedA + expandedB) / 2;
      const fmid = func(mid);
      
      if (expandedFa * fmid < 0) {
        expandedB = mid;
        expandedFb = fmid;
        break;
      } else if (fmid * expandedFb < 0) {
        expandedA = mid;
        expandedFa = fmid;
        break;
      } else {
        // Expand interval
        const range = expandedB - expandedA;
        expandedA = Math.max(expandedA - range, minBound);
        expandedB = Math.min(expandedB + range, maxBound);
        
        if (expandedA >= expandedB) break;
        
        expandedFa = func(expandedA);
        expandedFb = func(expandedB);
      }
    }
    
    if (expandedFa * expandedFb > 0) {
      // Return midpoint as best guess
      const bestGuess = (a + b) / 2;
      return {
        root: bestGuess,
        iterations: 0,
        converged: false,
        finalError: Math.abs(func(bestGuess)),
      };
    }
    
    // Use expanded bounds
    return bisectionIteration(func, expandedA, expandedB, maxIterations, tolerance);
  }

  return bisectionIteration(func, a, b, maxIterations, tolerance);
}

/**
 * Internal bisection iteration
 */
function bisectionIteration(
  func: (x: number) => number,
  a: number,
  b: number,
  maxIterations: number,
  tolerance: number
): BisectionResult {
  let left = a;
  let right = b;
  let iterations = 0;

  for (let i = 0; i < maxIterations; i++) {
    iterations = i + 1;
    const mid = (left + right) / 2;
    const fmid = func(mid);

    // Check convergence
    if (Math.abs(fmid) < tolerance) {
      return {
        root: mid,
        iterations,
        converged: true,
        finalError: Math.abs(fmid),
      };
    }

    // Check interval size
    if (Math.abs(right - left) < tolerance) {
      return {
        root: mid,
        iterations,
        converged: true,
        finalError: Math.abs(fmid),
      };
    }

    // Update bounds
    const fleft = func(left);
    if (fleft * fmid < 0) {
      right = mid;
    } else {
      left = mid;
    }
  }

  // Max iterations reached
  const finalRoot = (left + right) / 2;
  return {
    root: finalRoot,
    iterations,
    converged: false,
    finalError: Math.abs(func(finalRoot)),
  };
}

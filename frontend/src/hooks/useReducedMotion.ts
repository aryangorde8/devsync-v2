'use client';

import { useState, useEffect } from 'react';

/**
 * Hook to detect user's prefers-reduced-motion setting
 * Returns true if user prefers reduced motion
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check if window is available (client-side)
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    // Set initial value
    setPrefersReducedMotion(mediaQuery.matches);

    // Listen for changes
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

  return prefersReducedMotion;
}

/**
 * Returns animation duration based on reduced motion preference
 * @param normalDuration - Duration in seconds when motion is allowed
 * @param reducedDuration - Duration in seconds when motion is reduced (default: 0)
 */
export function useAnimationDuration(normalDuration: number, reducedDuration: number = 0): number {
  const prefersReducedMotion = useReducedMotion();
  return prefersReducedMotion ? reducedDuration : normalDuration;
}

/**
 * Returns Framer Motion transition props respecting reduced motion
 */
export function useMotionTransition(duration: number = 0.5) {
  const prefersReducedMotion = useReducedMotion();
  
  if (prefersReducedMotion) {
    return { duration: 0 };
  }
  
  return { duration, ease: [0.25, 0.1, 0.25, 1] };
}

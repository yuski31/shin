'use client';

import { useEffect } from 'react';

/**
 * HydrationFix component that removes browser extension attributes
 * that cause hydration mismatches in Next.js
 */
export function HydrationFix() {
  useEffect(() => {
    // Remove common browser extension attributes that cause hydration issues
    const cleanAttributes = () => {
      const elements = document.querySelectorAll('[bis_skin_checked], [__processed_58764826-ddbd-4757-ac40-07b2b02d0c1b__], [bis_register]');

      elements.forEach((element) => {
        // Remove the problematic attributes
        element.removeAttribute('bis_skin_checked');
        element.removeAttribute('__processed_58764826-ddbd-4757-ac40-07b2b02d0c1b__');
        element.removeAttribute('bis_register');
      });
    };

    // Clean immediately
    cleanAttributes();

    // Also clean after a short delay to catch any late additions
    const timeoutId = setTimeout(cleanAttributes, 100);

    return () => clearTimeout(timeoutId);
  }, []);

  return null; // This component doesn't render anything
}
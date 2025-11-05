/**
 * USE MOBILE HOOK
 * 
 * A custom React hook to detect if the current viewport is mobile or desktop.
 * Uses the matchMedia API to listen for changes in viewport size.
 * 
 * Mobile breakpoint: < 768px (md breakpoint in Tailwind)
 * 
 * @module hooks/use-mobile
 */

"use client";

import * as React from "react";

/**
 * Mobile breakpoint constant (matches Tailwind's `md` breakpoint)
 */
const MOBILE_BREAKPOINT = 768;

/**
 * Hook to detect if the viewport is mobile-sized
 * 
 * @returns boolean - true if viewport width is less than 768px
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const isMobile = useIsMobile();
 *   
 *   return (
 *     <div>
 *       {isMobile ? <MobileNav /> : <DesktopNav />}
 *     </div>
 *   );
 * }
 * ```
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(
    undefined
  );

  React.useEffect(() => {
    // Create media query
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    
    // Set initial value
    setIsMobile(mql.matches);
    
    // Handler for media query changes
    const onChange = () => {
      setIsMobile(mql.matches);
    };
    
    // Listen for changes
    mql.addEventListener("change", onChange);
    
    // Cleanup
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}

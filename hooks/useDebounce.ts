/**
 * USE DEBOUNCE HOOK
 * 
 * Debounces a value to reduce the frequency of expensive operations.
 * Useful for search inputs to avoid excessive API calls or re-renders.
 * 
 * @module hooks/useDebounce
 */

import { useEffect, useState } from "react";

/**
 * Debounce a value
 * 
 * Returns a debounced version of the value that only updates after the
 * specified delay has passed without the value changing.
 * 
 * @param value - The value to debounce
 * @param delay - The delay in milliseconds (default: 500ms)
 * @returns The debounced value
 * 
 * @example
 * ```tsx
 * const [searchQuery, setSearchQuery] = useState("");
 * const debouncedQuery = useDebounce(searchQuery, 500);
 * 
 * // Use debouncedQuery in your API call or expensive operation
 * useEffect(() => {
 *   if (debouncedQuery) {
 *     fetchResults(debouncedQuery);
 *   }
 * }, [debouncedQuery]);
 * ```
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set up the timeout to update the debounced value
    const timeoutId = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clean up the timeout if value changes before delay expires
    return () => {
      clearTimeout(timeoutId);
    };
  }, [value, delay]);

  return debouncedValue;
}

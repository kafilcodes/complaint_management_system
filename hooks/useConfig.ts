/**
 * Configuration Data Hooks
 * 
 * Hooks for fetching app configuration from Firestore with aggressive caching.
 * These hooks provide offline-first, high-performance access to config data.
 * 
 * Strategy:
 * - Use getDoc (one-time fetch) instead of onSnapshot (no real-time needed)
 * - Cache for 24 hours (config rarely changes)
 * - Fallback to local hardcoded config if Firestore fails
 * 
 * @module hooks/useConfig
 */

import { useQuery } from "@tanstack/react-query";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase/client";
import { BRANDS } from "@/lib/configuration";

// ==============================================================================
// QUERY KEYS
// ==============================================================================

const configKeys = {
  all: ["config"] as const,
  brands: () => [...configKeys.all, "brands"] as const,
  categories: () => [...configKeys.all, "categories"] as const,
};

// ==============================================================================
// TYPES
// ==============================================================================

export interface BrandConfig {
  value: string;
  label: string;
}

// ==============================================================================
// HOOKS
// ==============================================================================

/**
 * Fetch brand list from Firestore with 24-hour cache
 * 
 * This hook provides the production-level caching strategy:
 * 1. First load: Fetches from Firestore
 * 2. Subsequent loads: Returns cached data (no network call)
 * 3. After 24 hours: Refetches in background
 * 4. On error: Falls back to hardcoded BRANDS config
 * 
 * @returns TanStack Query result with brand array
 * 
 * @example
 * const { data: brands, isLoading } = useBrandList();
 * // brands = [{ value: "kfc", label: "KFC" }, ...]
 */
export function useBrandList() {
  return useQuery<BrandConfig[]>({
    queryKey: configKeys.brands(),
    queryFn: async () => {
      try {
        // Fetch from Firestore config collection
        const brandsDocRef = doc(db, "config", "brands");
        const brandsSnapshot = await getDoc(brandsDocRef);

        if (!brandsSnapshot.exists()) {
          console.warn(
            "[useBrandList] No brands document in Firestore, using local config"
          );
          return BRANDS as unknown as BrandConfig[];
        }

        const data = brandsSnapshot.data();
        const brandList = data.brandList as BrandConfig[];

        if (!brandList || !Array.isArray(brandList)) {
          console.warn(
            "[useBrandList] Invalid brandList format, using local config"
          );
          return BRANDS as unknown as BrandConfig[];
        }

        return brandList;
      } catch (error) {
        console.error("[useBrandList] Firestore error, using local config:", error);
        // Fallback to hardcoded config on error
        return BRANDS as unknown as BrandConfig[];
      }
    },
    staleTime: 1000 * 60 * 60 * 24, // 24 hours (data is fresh for a day)
    gcTime: 1000 * 60 * 60 * 24, // Keep in cache for 24 hours
    refetchOnMount: false, // Don't refetch on component mount
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnReconnect: false, // Don't refetch on reconnect
    retry: 1, // Only retry once (then use fallback)
  });
}

/**
 * Get a specific brand by value
 * 
 * @param brandValue - The brand value to look up (e.g., "kfc")
 * @returns Brand config object or undefined
 * 
 * @example
 * const kfc = useBrandByValue("kfc");
 * // kfc = { value: "kfc", label: "KFC" }
 */
export function useBrandByValue(brandValue: string | undefined) {
  const { data: brands = [] } = useBrandList();
  
  if (!brandValue) return undefined;
  
  return brands.find((brand) => brand.value === brandValue);
}

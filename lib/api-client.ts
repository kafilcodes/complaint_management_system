/**
 * API CLIENT UTILITIES
 * 
 * Helper functions for making authenticated API requests.
 * Automatically includes Firebase Auth token in requests.
 * 
 * @module lib/api-client
 */

import { useStore } from "@/lib/store";

/**
 * Get the current auth token from the store
 * This is more reliable than calling auth.currentUser.getIdToken()
 * because it's already fetched and stored by AuthProvider
 */
export function getAuthToken(): string | null {
  const token = useStore.getState().authToken;
  
  if (!token) {
    console.warn("[getAuthToken] ❌ No auth token in store");
    return null;
  }
  
  console.log("[getAuthToken] ✅ Got token from store, length:", token.length);
  return token;
}

/**
 * Make an authenticated API request
 * Automatically includes Firebase Auth token in Authorization header
 */
export function fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Response | Promise<Response> {
  const token = getAuthToken();

  if (!token) {
    console.warn("[fetchWithAuth] No token available for request to:", url);
    // Return a mock 401 response instead of throwing immediately
    // This allows React Query to handle the error gracefully
    return new Response(
      JSON.stringify({ error: "Not authenticated", code: "AUTH_REQUIRED" }),
      { 
        status: 401,
        headers: { "Content-Type": "application/json" }
      }
    );
  }

  console.log("[fetchWithAuth] Making authenticated request to:", url);

  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${token}`);

  return fetch(url, {
    ...options,
    headers,
  });
}

/**
 * Make an authenticated GET request and return JSON
 */
export async function apiGet<T = any>(url: string): Promise<T> {
  const response = await fetchWithAuth(url);

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Make an authenticated POST request and return JSON
 */
export async function apiPost<T = any>(
  url: string,
  data?: any
): Promise<T> {
  const response = await fetchWithAuth(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Make an authenticated PUT request and return JSON
 */
export async function apiPut<T = any>(
  url: string,
  data?: any
): Promise<T> {
  const response = await fetchWithAuth(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Make an authenticated DELETE request and return JSON
 */
export async function apiDelete<T = any>(url: string): Promise<T> {
  const response = await fetchWithAuth(url, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

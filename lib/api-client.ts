/**
 * API CLIENT UTILITIES
 * 
 * Helper functions for making public API requests.
 * NO AUTHENTICATION - This is an internal-only app with public Firebase rules.
 * 
 * @module lib/api-client
 * @updated 2025-11-12 - Removed all auth token logic (internal app only)
 */

/**
 * Fetch wrapper for public API routes
 * Note: This is for Next.js API routes only, not for direct Firestore/Storage access
 * All routes are public - this is an internal-only application
 */
export function simpleFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  return fetch(url, {
    ...options,
    headers,
  });
}

/**
 * Make an authenticated GET request and return JSON
 */
export async function apiGet<T>(url: string): Promise<T> {
  const response = await simpleFetch(url);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Make an authenticated POST request and return JSON
 */
export async function apiPost<T>(url: string, data: unknown): Promise<T> {
  const response = await simpleFetch(url, {
    method: "POST",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Make an authenticated PUT request and return JSON
 */
export async function apiPut<T>(url: string, data?: unknown): Promise<T> {
  const response = await simpleFetch(url, {
    method: "PUT",
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
export async function apiDelete<T>(url: string): Promise<T> {
  const response = await simpleFetch(url, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

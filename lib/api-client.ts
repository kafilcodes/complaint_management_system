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
 * Simple fetch wrapper without authentication
 * Auth is handled by Firebase Firestore Rules for this internal-only app
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

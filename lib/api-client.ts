/**
 * API CLIENT UTILITIES
 * 
 * Helper functions for making authenticated API requests.
 * Automatically includes Firebase Auth token in requests.
 * 
 * @module lib/api-client
 */

import { auth } from "@/firebase/client";

/**
 * Get the current user's ID token for API requests
 */
export async function getAuthToken(): Promise<string | null> {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.warn("No user logged in, cannot get auth token");
      return null;
    }
    
    return await user.getIdToken();
  } catch (error) {
    console.error("Error getting auth token:", error);
    return null;
  }
}

/**
 * Make an authenticated API request
 * Automatically includes Firebase Auth token in Authorization header
 */
export async function fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getAuthToken();

  if (!token) {
    throw new Error("Not authenticated");
  }

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

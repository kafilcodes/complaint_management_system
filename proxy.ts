/**
 * NEXT.JS PROXY (Next.js 16+)
 * 
 * This proxy replaces the deprecated middleware pattern.
 * It protects all routes except the login page by checking Firebase authentication.
 * 
 * HOW IT WORKS:
 * 1. Check if the user is accessing a protected route
 * 2. Look for the Firebase auth session cookie
 * 3. If no cookie and accessing protected route → redirect to /login
 * 4. If has cookie and accessing /login → redirect to /dashboard
 * 5. Otherwise, allow the request to proceed
 * 
 * IMPORTANT:
 * - This proxy does NOT check user roles
 * - Role-based authorization happens in:
 *   a) Client-side (hiding UI elements)
 *   b) Server-side (API route token verification)
 * 
 * @module proxy
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Routes that don't require authentication
 */
const PUBLIC_ROUTES = ["/login"];

/**
 * Routes that redirect to dashboard if already authenticated
 */
const AUTH_ROUTES = ["/login"];

/**
 * Proxy function
 * 
 * Runs before every request to check authentication status
 */
export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get the Firebase session cookie
  // Firebase Auth sets this cookie automatically when using Firebase Auth
  const sessionCookie = request.cookies.get("__session")?.value;

  // Alternative: Check for the Firebase Auth token in other cookies
  // Different Firebase versions may use different cookie names
  const hasAuthCookie =
    sessionCookie ||
    request.cookies.has("__session") ||
    // Check for Firebase ID token (client-side persistence)
    request.cookies.has("firebase-token");

  // Check if route is public
  const isPublicRoute = PUBLIC_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  // Check if route is an auth route (login, etc.)
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  // Allow access to public routes
  if (isPublicRoute) {
    // If user has auth cookie and is on login page, redirect to dashboard
    if (isAuthRoute && hasAuthCookie) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // Allow static files and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/static") ||
    pathname.includes("/favicon.ico") ||
    pathname.includes("/manifest.json") ||
    pathname.includes("/service-worker") ||
    pathname.includes("/icons/")
  ) {
    return NextResponse.next();
  }

  // Protect all other routes
  if (!hasAuthCookie) {
    // Redirect to login with return URL
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // User is authenticated, allow access
  return NextResponse.next();
}

/**
 * Proxy configuration
 * 
 * Specify which routes this proxy should run on.
 * Using matcher to exclude static files and improve performance.
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};

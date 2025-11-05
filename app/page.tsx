/**
 * HOME PAGE
 * 
 * Root page that redirects users to the appropriate location:
 * - Authenticated users → /dashboard
 * - Unauthenticated users → /login
 * 
 * This is a server component that immediately redirects.
 * 
 * @module app/page
 */

import { redirect } from "next/navigation";

/**
 * Home Page Component
 * 
 * Redirects to dashboard by default.
 * The middleware will catch unauthenticated users and redirect to /login.
 */
export default function Home() {
  redirect("/dashboard");
}

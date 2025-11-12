"use client";

import { WifiOff, RefreshCw } from "lucide-react";

/**
 * Offline Fallback Page
 * 
 * Displayed when the user is offline and tries to navigate to a page
 * that hasn't been cached by the service worker.
 */
export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-md">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="rounded-full bg-muted p-6">
            <WifiOff className="h-16 w-16 text-muted-foreground" />
          </div>
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">You're Offline</h1>
          <p className="text-muted-foreground">
            It looks like you've lost your internet connection. Please check your network settings and try again.
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </button>

        {/* Help Text */}
        <div className="text-sm text-muted-foreground space-y-2">
          <p>Some features may still be available:</p>
          <ul className="list-disc list-inside space-y-1 text-left">
            <li>View previously loaded pages</li>
            <li>Access cached data</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

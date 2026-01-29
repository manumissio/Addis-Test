"use client";

import { useEffect } from "react";

/**
 * Error boundary for the root app directory
 * This catches errors in the main app layout and pages
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console (in production, send to error tracking service)
    console.error("App error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full space-y-4 text-center">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Something went wrong</h1>
          <p className="text-muted-foreground">
            We encountered an unexpected error. Please try again.
          </p>
        </div>

        {process.env.NODE_ENV === "development" && (
          <details className="text-left bg-muted p-4 rounded-lg">
            <summary className="cursor-pointer font-medium text-foreground mb-2">
              Error details
            </summary>
            <pre className="text-xs text-destructive overflow-auto whitespace-pre-wrap">
              {error.message}
              {"\n"}
              {error.stack}
            </pre>
          </details>
        )}

        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Try again
          </button>
          <button
            onClick={() => (window.location.href = "/")}
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors"
          >
            Go home
          </button>
        </div>
      </div>
    </div>
  );
}

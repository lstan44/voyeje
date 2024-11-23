import * as Sentry from "@sentry/react";

const ErrorBoundary = ({ children }: { children: React.ReactNode }) => {
  return (
    <Sentry.ErrorBoundary
      fallback={({ error }) => (
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h1>
            <p className="text-gray-600 mb-4">We've been notified and are working to fix it.</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Refresh Page
            </button>
          </div>
        </div>
      )}
      onError={(error) => {
        Sentry.captureException(error, {
          tags: {
            location: window.location.href,
            component: 'ErrorBoundary'
          }
        });
      }}
    >
      {children}
    </Sentry.ErrorBoundary>
  );
};

export default ErrorBoundary;

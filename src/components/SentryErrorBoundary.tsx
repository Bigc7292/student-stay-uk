import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import * as Sentry from '@sentry/browser';
import { AlertTriangle, Bug, Home, RefreshCw } from 'lucide-react';
import React from 'react';

interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
  eventId?: string;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetError, eventId }) => {
  const handleReportFeedback = () => {
    if (eventId) {
      Sentry.showReportDialog({ eventId });
    }
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl text-gray-900">
            Oops! Something went wrong
          </CardTitle>
          <p className="text-gray-600 mt-2">
            We're sorry, but something unexpected happened. Our team has been notified.
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Error Details */}
          <div className="bg-gray-100 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Error Details:</h3>
            <p className="text-sm text-gray-700 font-mono break-all">
              {error.message}
            </p>
            {eventId && (
              <p className="text-xs text-gray-500 mt-2">
                Error ID: {eventId}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={resetError}
              className="flex items-center space-x-2 flex-1"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Try Again</span>
            </Button>
            
            <Button 
              onClick={handleGoHome}
              variant="outline"
              className="flex items-center space-x-2 flex-1"
            >
              <Home className="w-4 h-4" />
              <span>Go Home</span>
            </Button>
            
            {eventId && (
              <Button 
                onClick={handleReportFeedback}
                variant="outline"
                className="flex items-center space-x-2 flex-1"
              >
                <Bug className="w-4 h-4" />
                <span>Report Issue</span>
              </Button>
            )}
          </div>

          {/* Help Text */}
          <div className="text-center text-sm text-gray-600">
            <p>
              If this problem persists, please try refreshing the page or contact support.
            </p>
            <p className="mt-1">
              You can also try going back to the{' '}
              <button
                type="button"
                onClick={handleGoHome}
                className="text-blue-600 hover:text-blue-800 underline"
              >
                homepage
              </button>
              {' '}and starting over.
            </p>
          </div>

          {/* Development Info */}
          {import.meta.env.MODE === 'development' && (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                Development Details
              </summary>
              <div className="mt-2 p-3 bg-red-50 rounded text-xs">
                <pre className="whitespace-pre-wrap text-red-800">
                  {error.stack}
                </pre>
              </div>
            </details>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Create React Error Boundary with Sentry integration
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  eventId?: string;
}

class SentryErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Send to Sentry if available
    try {
      const eventId = Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack
          }
        },
        tags: {
          errorBoundary: true
        }
      });
      this.setState({ eventId });
    } catch (sentryError) {
      console.error('Failed to send error to Sentry:', sentryError);
    }

    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <ErrorFallback
          error={this.state.error}
          eventId={this.state.eventId}
          resetError={() => this.setState({ hasError: false, error: undefined, eventId: undefined })}
        />
      );
    }

    return this.props.children;
  }
}

export default SentryErrorBoundary;

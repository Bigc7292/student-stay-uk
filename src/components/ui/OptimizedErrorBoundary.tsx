// Optimized Error Boundary Components
// Clean, user-friendly error handling with recovery options

import React from 'react';
import { cn } from '@/lib/utils';
import { AlertTriangle, RefreshCw, Home, Bug, ChevronDown, ChevronUp } from 'lucide-react';
import { OptimizedButton } from './OptimizedButton';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  errorId: string;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
}

interface ErrorFallbackProps {
  error: Error;
  errorInfo: React.ErrorInfo;
  resetError: () => void;
  errorId: string;
}

export class OptimizedErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: number | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return {
      hasError: true,
      error,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    
    // Call custom error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Error Boundary Caught Error');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.groupEnd();
    }

    // Report to error tracking service
    this.reportError(error, errorInfo);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetKeys, resetOnPropsChange } = this.props;
    const { hasError } = this.state;

    if (hasError && prevProps.resetKeys !== resetKeys) {
      if (resetKeys?.some((key, idx) => prevProps.resetKeys?.[idx] !== key)) {
        this.resetError();
      }
    }

    if (hasError && resetOnPropsChange && prevProps.children !== this.props.children) {
      this.resetError();
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  private reportError = async (error: Error, errorInfo: React.ErrorInfo) => {
    try {
      // Report to Sentry or other error tracking service
      if (window.Sentry) {
        window.Sentry.withScope((scope) => {
          scope.setTag('errorBoundary', true);
          scope.setContext('errorInfo', errorInfo);
          scope.setLevel('error');
          window.Sentry!.captureException(error);
        });
      }

      // Report to analytics
      if (window.gtag) {
        window.gtag('event', 'exception', {
          description: error.message,
          fatal: true,
          error_id: this.state.errorId
        });
      }
    } catch (reportingError) {
      console.warn('Failed to report error:', reportingError);
    }
  };

  private resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    });
  };

  private scheduleReset = (delay: number = 5000) => {
    this.resetTimeoutId = window.setTimeout(() => {
      this.resetError();
    }, delay);
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return (
        <FallbackComponent
          error={this.state.error!}
          errorInfo={this.state.errorInfo!}
          resetError={this.resetError}
          errorId={this.state.errorId}
        />
      );
    }

    return this.props.children;
  }
}

// Default error fallback component
const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  errorInfo,
  resetError,
  errorId
}) => {
  const [showDetails, setShowDetails] = React.useState(false);
  const [isReporting, setIsReporting] = React.useState(false);

  const handleReportError = async () => {
    setIsReporting(true);
    try {
      // Simulate error reporting
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Error reported:', errorId);
    } catch (err) {
      console.error('Failed to report error:', err);
    } finally {
      setIsReporting(false);
    }
  };

  return (
    <div className="min-h-[400px] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="space-y-4">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Something went wrong</h2>
            <p className="text-gray-600 mt-2">
              We're sorry, but something unexpected happened. Please try refreshing the page.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <OptimizedButton
            onClick={resetError}
            icon={RefreshCw}
            className="w-full"
          >
            Try Again
          </OptimizedButton>

          <OptimizedButton
            onClick={() => window.location.href = '/'}
            variant="outline"
            icon={Home}
            className="w-full"
          >
            Go to Homepage
          </OptimizedButton>

          <OptimizedButton
            onClick={handleReportError}
            variant="ghost"
            icon={Bug}
            loading={isReporting}
            loadingText="Reporting..."
            className="w-full text-sm"
          >
            Report this issue
          </OptimizedButton>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <div className="text-left">
            <OptimizedButton
              onClick={() => setShowDetails(!showDetails)}
              variant="ghost"
              icon={showDetails ? ChevronUp : ChevronDown}
              size="sm"
              className="text-xs"
            >
              {showDetails ? 'Hide' : 'Show'} Error Details
            </OptimizedButton>

            {showDetails && (
              <div className="mt-3 p-3 bg-gray-100 rounded text-xs text-left overflow-auto max-h-40">
                <div className="font-mono">
                  <div className="font-semibold text-red-600">Error:</div>
                  <div className="mb-2">{error.message}</div>
                  
                  <div className="font-semibold text-red-600">Stack:</div>
                  <div className="whitespace-pre-wrap">{error.stack}</div>
                  
                  {errorInfo.componentStack && (
                    <>
                      <div className="font-semibold text-red-600 mt-2">Component Stack:</div>
                      <div className="whitespace-pre-wrap">{errorInfo.componentStack}</div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="text-xs text-gray-500">
          Error ID: {errorId}
        </div>
      </div>
    </div>
  );
};

// Specialized error fallbacks
export const PropertySearchErrorFallback: React.FC<ErrorFallbackProps> = ({
  resetError
}) => {
  return (
    <div className="text-center py-12 space-y-4">
      <AlertTriangle className="h-12 w-12 text-orange-500 mx-auto" />
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Search Error</h3>
        <p className="text-gray-600">
          We couldn't complete your property search. Please try again.
        </p>
      </div>
      <OptimizedButton onClick={resetError} icon={RefreshCw}>
        Retry Search
      </OptimizedButton>
    </div>
  );
};

export const MapErrorFallback: React.FC<ErrorFallbackProps> = ({
  resetError
}) => {
  return (
    <div className="h-64 flex items-center justify-center bg-gray-100 rounded-lg">
      <div className="text-center space-y-4">
        <AlertTriangle className="h-8 w-8 text-orange-500 mx-auto" />
        <div>
          <h3 className="font-semibold text-gray-900">Map Loading Error</h3>
          <p className="text-sm text-gray-600">Unable to load the interactive map</p>
        </div>
        <OptimizedButton onClick={resetError} size="sm" icon={RefreshCw}>
          Reload Map
        </OptimizedButton>
      </div>
    </div>
  );
};

// Error boundary wrapper with specific fallbacks
interface SpecializedErrorBoundaryProps {
  children: React.ReactNode;
  type: 'search' | 'map' | 'default';
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export const SpecializedErrorBoundary: React.FC<SpecializedErrorBoundaryProps> = ({
  children,
  type,
  onError
}) => {
  const fallbackComponents = {
    search: PropertySearchErrorFallback,
    map: MapErrorFallback,
    default: DefaultErrorFallback
  };

  return (
    <OptimizedErrorBoundary
      fallback={fallbackComponents[type]}
      onError={onError}
    >
      {children}
    </OptimizedErrorBoundary>
  );
};

// Hook for error handling in functional components
export const useErrorHandler = () => {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const handleError = React.useCallback((error: Error) => {
    setError(error);
    
    // Report error
    if (window.Sentry) {
      window.Sentry.captureException(error);
    }
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { handleError, resetError, error };
};

// Error boundary for async operations
export const AsyncErrorBoundary: React.FC<{
  children: React.ReactNode;
  fallback?: React.ComponentType<any>;
}> = ({ children, fallback }) => {
  return (
    <OptimizedErrorBoundary fallback={fallback}>
      <React.Suspense fallback={<div>Loading...</div>}>
        {children}
      </React.Suspense>
    </OptimizedErrorBoundary>
  );
};

export default OptimizedErrorBoundary;

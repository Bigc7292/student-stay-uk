// Sentry Error Tracking and Performance Monitoring Service
import * as Sentry from "@sentry/browser";

interface SentryConfig {
  dsn: string;
  environment: string;
  enabled: boolean;
  debug?: boolean;
  sampleRate?: number;
  tracesSampleRate?: number;
}

class SentryService {
  private isInitialized = false;
  private config: SentryConfig;

  constructor() {
    this.config = {
      dsn: import.meta.env.VITE_SENTRY_DSN || '',
      environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || 'development',
      enabled: import.meta.env.VITE_SENTRY_ENABLED === 'true',
      debug: import.meta.env.MODE === 'development',
      sampleRate: 1.0, // Capture 100% of errors
      tracesSampleRate: import.meta.env.MODE === 'development' ? 1.0 : 0.1 // 100% in dev, 10% in prod
    };

    if (this.config.enabled && this.config.dsn && this.config.dsn !== 'https://your-sentry-dsn@sentry.io/project-id') {
      this.initializeSentry();
    } else {
      console.log('🐛 Sentry not configured or disabled');
    }
  }

  // Initialize Sentry with configuration
  private initializeSentry(): void {
    try {
      Sentry.init({
        dsn: this.config.dsn,
        environment: this.config.environment,
        debug: this.config.debug,
        
        // Performance Monitoring
        tracesSampleRate: this.config.tracesSampleRate,
        
        // Error Sampling
        sampleRate: this.config.sampleRate,
        
        // Send default PII data (IP addresses, user agent, etc.)
        sendDefaultPii: true,
        
        // Capture unhandled promise rejections
        captureUnhandledRejections: true,
        
        // Capture console errors
        captureUnhandledRejections: true,
        
        // Release tracking
        release: `studenthome@${import.meta.env.VITE_APP_VERSION || '1.0.0'}`,
        
        // Integration configuration (browser-compatible)
        integrations: [
          // Replay integration for session recording (optional)
          Sentry.replayIntegration({
            maskAllText: false,
            blockAllMedia: false,
          }),
        ],
        
        // Filter out common non-critical errors
        beforeSend(event, hint) {
          // Filter out network errors that are not actionable
          if (event.exception) {
            const error = hint.originalException;
            if (error instanceof Error) {
              // Skip common browser extension errors
              if (error.message?.includes('Extension context invalidated') ||
                  error.message?.includes('chrome-extension://') ||
                  error.message?.includes('moz-extension://')) {
                return null;
              }
              
              // Skip common network errors
              if (error.message?.includes('Failed to fetch') ||
                  error.message?.includes('NetworkError') ||
                  error.message?.includes('ERR_NETWORK')) {
                // Only send if it's a critical API
                const url = event.request?.url || '';
                if (!url.includes('/api/') && !url.includes('googleapis.com')) {
                  return null;
                }
              }
            }
          }
          
          return event;
        },
        
        // Add tags for better organization
        initialScope: {
          tags: {
            component: 'studenthome-frontend',
            platform: 'web'
          }
        }
      });

      this.isInitialized = true;
      console.log('🐛 Sentry initialized successfully');
      
      // Set user context if available
      this.updateUserContext();
      
    } catch (error) {
      console.error('🐛 Failed to initialize Sentry:', error);
    }
  }

  // Check if Sentry is available and initialized
  isAvailable(): boolean {
    return this.isInitialized && this.config.enabled;
  }

  // Capture an error manually
  captureError(error: Error, context?: Record<string, any>): void {
    if (!this.isAvailable()) {
      console.error('Error (Sentry disabled):', error);
      return;
    }

    Sentry.withScope((scope) => {
      if (context) {
        Object.keys(context).forEach(key => {
          scope.setContext(key, context[key]);
        });
      }
      Sentry.captureException(error);
    });
  }

  // Capture a message
  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: Record<string, any>): void {
    if (!this.isAvailable()) {
      console.log(`Message (Sentry disabled) [${level}]:`, message);
      return;
    }

    Sentry.withScope((scope) => {
      scope.setLevel(level);
      if (context) {
        Object.keys(context).forEach(key => {
          scope.setContext(key, context[key]);
        });
      }
      Sentry.captureMessage(message);
    });
  }

  // Set user context
  setUser(user: { id?: string; email?: string; username?: string; [key: string]: any }): void {
    if (!this.isAvailable()) return;
    
    Sentry.setUser(user);
  }

  // Update user context from localStorage or other sources
  private updateUserContext(): void {
    try {
      // Try to get user info from localStorage or other sources
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        this.setUser({
          id: user.id,
          email: user.email,
          username: user.username || user.name
        });
      }
    } catch (error) {
      // Ignore errors in user context update
    }
  }

  // Add breadcrumb for debugging
  addBreadcrumb(message: string, category: string = 'custom', level: 'info' | 'warning' | 'error' = 'info', data?: Record<string, any>): void {
    if (!this.isAvailable()) return;

    Sentry.addBreadcrumb({
      message,
      category,
      level,
      data,
      timestamp: Date.now() / 1000
    });
  }

  // Set tag for filtering
  setTag(key: string, value: string): void {
    if (!this.isAvailable()) return;
    Sentry.setTag(key, value);
  }

  // Set context for additional information
  setContext(key: string, context: Record<string, any>): void {
    if (!this.isAvailable()) return;
    Sentry.setContext(key, context);
  }

  // Start a transaction for performance monitoring
  startTransaction(name: string, op: string = 'navigation'): any {
    if (!this.isAvailable()) return null;
    return Sentry.startTransaction({ name, op });
  }

  // Capture API performance
  captureAPICall(url: string, method: string, duration: number, status: number): void {
    if (!this.isAvailable()) return;

    this.addBreadcrumb(
      `API ${method} ${url}`,
      'http',
      status >= 400 ? 'error' : 'info',
      {
        url,
        method,
        duration,
        status
      }
    );

    // If it's an error, capture it
    if (status >= 400) {
      this.captureMessage(
        `API Error: ${method} ${url} returned ${status}`,
        'error',
        { api: { url, method, duration, status } }
      );
    }
  }

  // Capture component error (for error boundaries)
  captureComponentError(error: Error, errorInfo: { componentStack: string }): void {
    if (!this.isAvailable()) {
      console.error('Component Error (Sentry disabled):', error, errorInfo);
      return;
    }

    Sentry.withScope((scope) => {
      scope.setContext('react', errorInfo);
      scope.setTag('errorBoundary', true);
      Sentry.captureException(error);
    });
  }

  // Test Sentry integration
  testSentry(): void {
    if (!this.isAvailable()) {
      console.log('🐛 Sentry test skipped - not available');
      return;
    }

    console.log('🐛 Testing Sentry integration...');
    
    // Test breadcrumb
    this.addBreadcrumb('Sentry test initiated', 'test', 'info');
    
    // Test message
    this.captureMessage('Sentry test message', 'info', { test: true });
    
    // Test error (commented out to avoid spam)
    // this.captureError(new Error('Sentry test error'), { test: true });
    
    console.log('🐛 Sentry test completed - check your Sentry dashboard');
  }

  // Get configuration status
  getStatus(): {
    initialized: boolean;
    enabled: boolean;
    dsn: string;
    environment: string;
  } {
    return {
      initialized: this.isInitialized,
      enabled: this.config.enabled,
      dsn: this.config.dsn ? `${this.config.dsn.substring(0, 20)}...` : 'Not configured',
      environment: this.config.environment
    };
  }

  // Get setup instructions
  getSetupInstructions(): string {
    return `Sentry Error Tracking Setup:
✅ DSN: ${this.config.dsn ? 'Configured' : 'Missing'}
✅ Environment: ${this.config.environment}
✅ Status: ${this.isInitialized ? 'Initialized' : 'Not initialized'}

Features enabled:
• Real-time error tracking
• Performance monitoring  
• User session recording
• Component error boundaries
• API call monitoring
• Custom breadcrumbs and context

Your Sentry project: studenthome-frontend
Dashboard: https://sentry.io/organizations/[your-org]/projects/`;
  }
}

// Export singleton instance
export const sentryService = new SentryService();

// Export Sentry for direct use in components
export { Sentry };


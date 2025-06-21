// Sentry Node.js Backend Integration
const Sentry = require("@sentry/node");

// Try to import profiling integration, but don't fail if not available
let nodeProfilingIntegration = null;
try {
  const profilingModule = require("@sentry/profiling-node");
  nodeProfilingIntegration = profilingModule.nodeProfilingIntegration;
} catch (error) {
  console.log('📊 Profiling integration not available in sentry.js');
}

// Load environment variables
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

class BackendSentryService {
  constructor() {
    this.isInitialized = false;
    this.config = {
      dsn: process.env.SENTRY_DSN_BACKEND || '',
      environment: process.env.SENTRY_ENVIRONMENT_BACKEND || 'development',
      enabled: process.env.SENTRY_ENABLED_BACKEND === 'true',
      debug: process.env.NODE_ENV === 'development',
      sampleRate: 1.0, // Capture 100% of errors
      tracesSampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.1,
      profilesSampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.1
    };

    if (this.config.enabled && this.config.dsn) {
      this.initializeSentry();
    } else {
      console.log('🐛 Backend Sentry not configured or disabled');
    }
  }

  initializeSentry() {
    try {
      Sentry.init({
        dsn: this.config.dsn,
        environment: this.config.environment,
        debug: this.config.debug,
        
        // Performance Monitoring
        tracesSampleRate: this.config.tracesSampleRate,
        profilesSampleRate: this.config.profilesSampleRate,
        
        // Error Sampling
        sampleRate: this.config.sampleRate,
        
        // Send default PII data (IP addresses, user agent, etc.)
        sendDefaultPii: true,
        
        // Release tracking
        release: `studenthome-backend@${process.env.npm_package_version || '1.0.0'}`,
        
        // Integrations (only include available ones)
        integrations: [
          // Node.js profiling (if available)
          ...(nodeProfilingIntegration ? [nodeProfilingIntegration()] : []),

          // HTTP integration for Express (if available)
          ...(Sentry.httpIntegration ? [Sentry.httpIntegration()] : []),

          // Console integration (if available)
          ...(Sentry.consoleIntegration ? [Sentry.consoleIntegration()] : []),

          // Local variables integration (if available)
          ...(Sentry.localVariablesIntegration ? [Sentry.localVariablesIntegration()] : []),
        ],
        
        // Filter out non-critical errors
        beforeSend(event, hint) {
          // Filter out common Node.js errors that aren't actionable
          if (event.exception) {
            const error = hint.originalException;
            if (error instanceof Error) {
              // Skip common network timeouts for external APIs
              if (error.message?.includes('ECONNRESET') ||
                  error.message?.includes('ETIMEDOUT') ||
                  error.message?.includes('ENOTFOUND')) {
                // Only send if it's a critical internal API
                const url = event.request?.url || '';
                if (!url.includes('/api/internal/')) {
                  return null;
                }
              }
              
              // Skip rate limiting errors (expected behavior)
              if (error.message?.includes('429') || 
                  error.message?.includes('Rate limit')) {
                return null;
              }
            }
          }
          
          return event;
        },
        
        // Add tags for better organization
        initialScope: {
          tags: {
            component: 'studenthome-backend',
            platform: 'node'
          }
        }
      });

      this.isInitialized = true;
      console.log('🐛 Backend Sentry initialized successfully');
      
    } catch (error) {
      console.error('🐛 Failed to initialize Backend Sentry:', error);
    }
  }

  // Check if Sentry is available
  isAvailable() {
    return this.isInitialized && this.config.enabled;
  }

  // Capture error with context
  captureError(error, context = {}) {
    if (!this.isAvailable()) {
      console.error('Backend Error (Sentry disabled):', error);
      return;
    }

    Sentry.withScope((scope) => {
      Object.keys(context).forEach(key => {
        scope.setContext(key, context[key]);
      });
      Sentry.captureException(error);
    });
  }

  // Capture message
  captureMessage(message, level = 'info', context = {}) {
    if (!this.isAvailable()) {
      console.log(`Backend Message (Sentry disabled) [${level}]:`, message);
      return;
    }

    Sentry.withScope((scope) => {
      scope.setLevel(level);
      Object.keys(context).forEach(key => {
        scope.setContext(key, context[key]);
      });
      Sentry.captureMessage(message);
    });
  }

  // Set user context
  setUser(user) {
    if (!this.isAvailable()) return;
    Sentry.setUser(user);
  }

  // Add breadcrumb
  addBreadcrumb(message, category = 'custom', level = 'info', data = {}) {
    if (!this.isAvailable()) return;

    Sentry.addBreadcrumb({
      message,
      category,
      level,
      data,
      timestamp: Date.now() / 1000
    });
  }

  // Monitor API calls
  monitorAPICall(url, method, startTime, statusCode, error = null) {
    const duration = Date.now() - startTime;
    
    this.addBreadcrumb(
      `API ${method} ${url}`,
      'http',
      statusCode >= 400 ? 'error' : 'info',
      {
        url,
        method,
        duration,
        statusCode
      }
    );

    // Capture errors for failed API calls
    if (error || statusCode >= 400) {
      this.captureMessage(
        `API Error: ${method} ${url} - ${statusCode}${error ? ` - ${error.message}` : ''}`,
        'error',
        {
          api: { url, method, duration, statusCode },
          error: error ? error.message : null
        }
      );
    }
  }

  // Express middleware for automatic error capture
  expressErrorHandler() {
    if (Sentry.expressErrorHandler) {
      return Sentry.expressErrorHandler({
        shouldHandleError(error) {
          // Only handle 4xx and 5xx errors
          return error.status >= 400;
        }
      });
    } else if (Sentry.Handlers && Sentry.Handlers.errorHandler) {
      return Sentry.Handlers.errorHandler();
    } else {
      return (error, req, res, next) => {
        console.log('🐛 Sentry error handler not available, logging error:', error.message);
        next(error);
      };
    }
  }

  // Express middleware for request tracing
  expressRequestHandler() {
    if (Sentry.expressRequestHandler) {
      return Sentry.expressRequestHandler();
    } else if (Sentry.Handlers && Sentry.Handlers.requestHandler) {
      return Sentry.Handlers.requestHandler();
    } else {
      return (req, res, next) => {
        console.log('🐛 Sentry request handler not available, continuing...');
        next();
      };
    }
  }

  // Test backend Sentry
  testSentry() {
    if (!this.isAvailable()) {
      console.log('🐛 Backend Sentry test skipped - not available');
      return;
    }

    console.log('🐛 Testing Backend Sentry integration...');
    
    // Test breadcrumb
    this.addBreadcrumb('Backend Sentry test initiated', 'test', 'info');
    
    // Test message
    this.captureMessage('Backend Sentry test message', 'info', { test: true });
    
    console.log('🐛 Backend Sentry test completed - check your Sentry dashboard');
  }

  // Get status
  getStatus() {
    return {
      initialized: this.isInitialized,
      enabled: this.config.enabled,
      dsn: this.config.dsn ? `${this.config.dsn.substring(0, 20)}...` : 'Not configured',
      environment: this.config.environment
    };
  }
}

// Create singleton instance
const backendSentryService = new BackendSentryService();

// Export both the service and Sentry for direct use
module.exports = {
  backendSentryService,
  Sentry
};

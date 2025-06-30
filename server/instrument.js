// IMPORTANT: This file must be imported before any other modules
// Sentry Node.js Instrumentation for StudentHome Backend

const Sentry = require("@sentry/node");

// Try to import profiling integration, but don't fail if not available
let nodeProfilingIntegration = null;
try {
  const profilingModule = require("@sentry/profiling-node");
  nodeProfilingIntegration = profilingModule.nodeProfilingIntegration;
} catch (error) {
  console.log('📊 Profiling integration not available, continuing without it');
}

// Load environment variables
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

// Initialize Sentry with your DSN
Sentry.init({
  dsn: "https://8a9202ba60215ae504b57415c46e4ee5@o4509537497841664.ingest.us.sentry.io/4509537578778624",
  
  // Environment configuration
  environment: process.env.SENTRY_ENVIRONMENT_BACKEND || 'development',
  
  // Setting this option to true will send default PII data to Sentry.
  // For example, automatic IP address collection on events
  sendDefaultPii: true,
  
  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.1, // 100% in dev, 10% in prod
  profilesSampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.1, // 100% in dev, 10% in prod
  
  // Error sampling
  sampleRate: 1.0, // Capture 100% of errors
  
  // Debug mode for development
  debug: process.env.NODE_ENV === 'development',
  
  // Release tracking
  release: `studenthome-backend@${process.env.npm_package_version || '1.0.0'}`,
  
  // Integrations
  integrations: [
    // Node.js profiling integration (if available)
    ...(nodeProfilingIntegration ? [nodeProfilingIntegration()] : []),

    // HTTP integration for Express (if available)
    ...(Sentry.httpIntegration ? [Sentry.httpIntegration({
      tracing: true,
    })] : []),

    // Console integration to capture console.error calls (if available)
    ...(Sentry.consoleIntegration ? [Sentry.consoleIntegration({
      levels: ['error', 'warn']
    })] : []),

    // Local variables integration for better debugging (if available)
    ...(Sentry.localVariablesIntegration ? [Sentry.localVariablesIntegration({
      captureAllExceptions: false,
      maxExceptionsPerSecond: 5,
    })] : []),

    // Context lines integration for source code context (if available)
    ...(Sentry.contextLinesIntegration ? [Sentry.contextLinesIntegration()] : []),

    // Modules integration to track loaded modules (if available)
    ...(Sentry.modulesIntegration ? [Sentry.modulesIntegration()] : []),
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
            error.message?.includes('ENOTFOUND') ||
            error.message?.includes('ECONNREFUSED')) {
          // Only send if it's a critical internal API
          const url = event.request?.url || '';
          if (!url.includes('/api/internal/') && !url.includes('localhost')) {
            console.log(`Filtered network error: ${error.message}`);
            return null;
          }
        }
        
        // Skip rate limiting errors (expected behavior)
        if (error.message?.includes('429') || 
            error.message?.includes('Rate limit') ||
            error.message?.includes('Too Many Requests')) {
          console.log(`Filtered rate limit error: ${error.message}`);
          return null;
        }
        
        // Skip common Express/HTTP errors that are user-related
        if (error.message?.includes('400') ||
            error.message?.includes('Bad Request') ||
            error.message?.includes('Validation')) {
          // Only log validation errors, don't send to Sentry
          console.log(`Filtered validation error: ${error.message}`);
          return null;
        }
      }
    }
    
    // Add additional context to all events
    if (event.request) {
      event.tags = {
        ...event.tags,
        component: 'studenthome-backend',
        platform: 'node',
        method: event.request.method,
      };
    }
    
    return event;
  },
  
  // Add global tags for better organization
  initialScope: {
    tags: {
      component: 'studenthome-backend',
      platform: 'node',
      service: 'api'
    },
    contexts: {
      app: {
        name: 'StudentHome Backend',
        version: process.env.npm_package_version || '1.0.0'
      },
      runtime: {
        name: 'node',
        version: process.version
      }
    }
  },
  
  // Transport options
  transport: Sentry.makeNodeTransport,
  
  // Stacktrace options
  stackParser: Sentry.defaultStackParser,
  
  // Enable automatic session tracking
  autoSessionTracking: true,
  
  // Session tracking options
  sessionTrackingOptions: {
    sessionSampleRate: 1.0,
  },
  
  // Spotlight integration for local development
  spotlight: process.env.NODE_ENV === 'development',
});

// Set global error handlers
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  Sentry.captureException(error);
  // Don't exit in development for better debugging
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  Sentry.captureException(reason);
  // Don't exit in development for better debugging
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

// Log successful initialization
console.log('🐛 Sentry instrumentation initialized');
console.log(`📊 Environment: ${process.env.SENTRY_ENVIRONMENT_BACKEND || 'development'}`);
console.log(`🔍 Debug mode: ${process.env.NODE_ENV === 'development'}`);
console.log(`📈 Traces sample rate: ${process.env.NODE_ENV === 'development' ? '100%' : '10%'}`);

// Export Sentry for use in other modules
module.exports = Sentry;

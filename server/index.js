// IMPORTANT: Import instrument.js FIRST before any other modules
require("./instrument.js");

// StudentHome Backend Server with Sentry Integration
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const Sentry = require('@sentry/node');

// Import our custom Sentry service (after instrument.js)
const { backendSentryService } = require('./sentry');

const app = express();
const PORT = process.env.PORT || 3001;

// Sentry request handler MUST be the first middleware (if available)
if (Sentry.expressRequestHandler) {
  app.use(Sentry.expressRequestHandler());
} else if (Sentry.Handlers && Sentry.Handlers.requestHandler) {
  app.use(Sentry.Handlers.requestHandler());
} else {
  console.log('🐛 Sentry request handler not available, continuing without it');
}

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for development
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-domain.com'] 
    : ['http://localhost:8080', 'http://localhost:3000'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'studenthome-backend',
    sentry: backendSentryService.getStatus()
  });
});

// API Routes
app.use('/api/properties', require('./routes/properties'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/sentry', require('./routes/sentry'));

// Test Sentry endpoint
app.get('/api/test-sentry', (req, res) => {
  try {
    backendSentryService.testSentry();
    res.json({ 
      message: 'Sentry test completed', 
      status: backendSentryService.getStatus() 
    });
  } catch (error) {
    backendSentryService.captureError(error, { endpoint: '/api/test-sentry' });
    res.status(500).json({ error: 'Sentry test failed' });
  }
});

// Test error endpoint (for testing Sentry error capture)
app.get('/api/test-error', (req, res) => {
  // Intentionally throw an error for testing
  throw new Error('Test error from backend - this is intentional for testing Sentry');
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  });
});

// Sentry error handler MUST be before any other error middleware (if available)
if (Sentry.expressErrorHandler) {
  app.use(Sentry.expressErrorHandler());
} else if (Sentry.Handlers && Sentry.Handlers.errorHandler) {
  app.use(Sentry.Handlers.errorHandler());
} else {
  console.log('🐛 Sentry error handler not available, continuing without it');
}

// Global error handler
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  
  // Capture error in Sentry with context
  Sentry.withScope((scope) => {
    scope.setContext('request', {
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: req.body
    });
    Sentry.captureException(error);
  });

  res.status(error.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : error.message,
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 StudentHome Backend Server running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🐛 Sentry Status:`, backendSentryService.getStatus());
  
  // Log server start to Sentry
  Sentry.addBreadcrumb({
    message: `StudentHome Backend Server started on port ${PORT}`,
    category: 'server',
    level: 'info',
    data: {
      port: PORT,
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString()
    }
  });

  Sentry.captureMessage(
    `StudentHome Backend Server started on port ${PORT}`,
    'info'
  );
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  Sentry.captureMessage('Server shutting down via SIGTERM', 'info');
  Sentry.close(2000).then(() => {
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  Sentry.captureMessage('Server shutting down via SIGINT', 'info');
  Sentry.close(2000).then(() => {
    process.exit(0);
  });
});

module.exports = app;

// Sentry Management API Routes
const express = require('express');
const router = express.Router();
const { backendSentryService } = require('../sentry');

// Get Sentry status
router.get('/status', (req, res) => {
  try {
    const status = backendSentryService.getStatus();
    
    res.json({
      success: true,
      data: {
        ...status,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get Sentry status',
      timestamp: new Date().toISOString()
    });
  }
});

// Test Sentry integration
router.post('/test', (req, res) => {
  try {
    const { type = 'message', message, level = 'info' } = req.body;

    switch (type) {
      case 'error':
        // Test error capture
        const testError = new Error(message || 'Backend Sentry test error - this is intentional');
        backendSentryService.captureError(testError, {
          test: true,
          source: 'api-test',
          timestamp: new Date().toISOString()
        });
        break;

      case 'message':
        // Test message capture
        backendSentryService.captureMessage(
          message || 'Backend Sentry test message',
          level,
          {
            test: true,
            source: 'api-test',
            timestamp: new Date().toISOString()
          }
        );
        break;

      case 'breadcrumb':
        // Test breadcrumb
        backendSentryService.addBreadcrumb(
          message || 'Backend Sentry test breadcrumb',
          'test',
          level,
          {
            test: true,
            source: 'api-test',
            timestamp: new Date().toISOString()
          }
        );
        break;

      case 'full':
        // Full test
        backendSentryService.testSentry();
        break;

      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid test type. Use: error, message, breadcrumb, or full',
          timestamp: new Date().toISOString()
        });
    }

    res.json({
      success: true,
      message: `Sentry ${type} test completed`,
      type,
      sentryStatus: backendSentryService.getStatus(),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    backendSentryService.captureError(error, {
      endpoint: '/api/sentry/test',
      method: 'POST',
      body: req.body
    });

    res.status(500).json({
      success: false,
      error: 'Sentry test failed',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Set user context
router.post('/user', (req, res) => {
  try {
    const { userId, email, username, ...additionalData } = req.body;

    if (!userId && !email && !username) {
      return res.status(400).json({
        success: false,
        error: 'At least one of userId, email, or username is required',
        timestamp: new Date().toISOString()
      });
    }

    const userData = {
      id: userId,
      email,
      username,
      ...additionalData
    };

    backendSentryService.setUser(userData);

    backendSentryService.captureMessage(
      'User context updated',
      'info',
      { userContext: userData }
    );

    res.json({
      success: true,
      message: 'User context updated in Sentry',
      userData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    backendSentryService.captureError(error, {
      endpoint: '/api/sentry/user',
      method: 'POST',
      body: req.body
    });

    res.status(500).json({
      success: false,
      error: 'Failed to set user context',
      timestamp: new Date().toISOString()
    });
  }
});

// Add custom breadcrumb
router.post('/breadcrumb', (req, res) => {
  try {
    const { message, category = 'custom', level = 'info', data = {} } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required for breadcrumb',
        timestamp: new Date().toISOString()
      });
    }

    backendSentryService.addBreadcrumb(message, category, level, data);

    res.json({
      success: true,
      message: 'Breadcrumb added to Sentry',
      breadcrumb: { message, category, level, data },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    backendSentryService.captureError(error, {
      endpoint: '/api/sentry/breadcrumb',
      method: 'POST',
      body: req.body
    });

    res.status(500).json({
      success: false,
      error: 'Failed to add breadcrumb',
      timestamp: new Date().toISOString()
    });
  }
});

// Monitor API performance
router.post('/monitor', (req, res) => {
  try {
    const { url, method, duration, statusCode, error } = req.body;

    if (!url || !method || duration === undefined || !statusCode) {
      return res.status(400).json({
        success: false,
        error: 'url, method, duration, and statusCode are required',
        timestamp: new Date().toISOString()
      });
    }

    const startTime = Date.now() - duration;
    backendSentryService.monitorAPICall(
      url,
      method,
      startTime,
      statusCode,
      error ? new Error(error) : null
    );

    res.json({
      success: true,
      message: 'API call monitored in Sentry',
      monitoring: { url, method, duration, statusCode, error },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    backendSentryService.captureError(error, {
      endpoint: '/api/sentry/monitor',
      method: 'POST',
      body: req.body
    });

    res.status(500).json({
      success: false,
      error: 'Failed to monitor API call',
      timestamp: new Date().toISOString()
    });
  }
});

// Get Sentry configuration
router.get('/config', (req, res) => {
  try {
    const config = {
      enabled: backendSentryService.isAvailable(),
      environment: process.env.SENTRY_ENVIRONMENT_BACKEND || 'development',
      dsn: process.env.SENTRY_DSN_BACKEND ? 
        `${process.env.SENTRY_DSN_BACKEND.substring(0, 20)}...` : 
        'Not configured',
      features: {
        errorTracking: true,
        performanceMonitoring: true,
        breadcrumbs: true,
        userContext: true,
        apiMonitoring: true
      },
      endpoints: {
        status: '/api/sentry/status',
        test: '/api/sentry/test',
        user: '/api/sentry/user',
        breadcrumb: '/api/sentry/breadcrumb',
        monitor: '/api/sentry/monitor'
      }
    };

    res.json({
      success: true,
      data: config,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get Sentry configuration',
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;

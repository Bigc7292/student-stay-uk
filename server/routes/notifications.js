// Push Notifications API Routes with Sentry Monitoring
const express = require('express');
const router = express.Router();
const { backendSentryService } = require('../sentry');

// Mock notification subscriptions storage (replace with database)
let subscriptions = [];

// Subscribe to push notifications
router.post('/subscribe', async (req, res) => {
  const startTime = Date.now();

  try {
    const { subscription, userInfo } = req.body;

    if (!subscription || !subscription.endpoint) {
      backendSentryService.monitorAPICall(
        '/api/notifications/subscribe',
        'POST',
        startTime,
        400
      );

      return res.status(400).json({
        success: false,
        error: 'Invalid subscription data',
        timestamp: new Date().toISOString()
      });
    }

    backendSentryService.addBreadcrumb(
      'User subscribing to push notifications',
      'notification',
      'info',
      { 
        endpoint: subscription.endpoint.substring(0, 50) + '...',
        userInfo: userInfo || 'anonymous'
      }
    );

    // Store subscription (in real app, save to database)
    const subscriptionData = {
      id: Date.now().toString(),
      subscription,
      userInfo: userInfo || {},
      subscribedAt: new Date().toISOString()
    };

    subscriptions.push(subscriptionData);

    backendSentryService.monitorAPICall(
      '/api/notifications/subscribe',
      'POST',
      startTime,
      200
    );

    backendSentryService.captureMessage(
      'New push notification subscription',
      'info',
      { 
        subscription: subscriptionData,
        totalSubscriptions: subscriptions.length
      }
    );

    res.json({
      success: true,
      message: 'Successfully subscribed to push notifications',
      subscriptionId: subscriptionData.id,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    backendSentryService.captureError(error, {
      endpoint: '/api/notifications/subscribe',
      method: 'POST',
      body: req.body
    });

    backendSentryService.monitorAPICall(
      '/api/notifications/subscribe',
      'POST',
      startTime,
      500,
      error
    );

    res.status(500).json({
      success: false,
      error: 'Failed to subscribe to notifications',
      timestamp: new Date().toISOString()
    });
  }
});

// Unsubscribe from push notifications
router.post('/unsubscribe', async (req, res) => {
  const startTime = Date.now();

  try {
    const { endpoint } = req.body;

    if (!endpoint) {
      backendSentryService.monitorAPICall(
        '/api/notifications/unsubscribe',
        'POST',
        startTime,
        400
      );

      return res.status(400).json({
        success: false,
        error: 'Endpoint required for unsubscribe',
        timestamp: new Date().toISOString()
      });
    }

    backendSentryService.addBreadcrumb(
      'User unsubscribing from push notifications',
      'notification',
      'info',
      { endpoint: endpoint.substring(0, 50) + '...' }
    );

    // Remove subscription
    const initialLength = subscriptions.length;
    subscriptions = subscriptions.filter(sub => sub.subscription.endpoint !== endpoint);
    const removed = initialLength - subscriptions.length;

    backendSentryService.monitorAPICall(
      '/api/notifications/unsubscribe',
      'POST',
      startTime,
      200
    );

    if (removed > 0) {
      backendSentryService.captureMessage(
        'Push notification unsubscription',
        'info',
        { 
          endpoint: endpoint.substring(0, 50) + '...',
          totalSubscriptions: subscriptions.length
        }
      );
    }

    res.json({
      success: true,
      message: removed > 0 ? 'Successfully unsubscribed' : 'Subscription not found',
      removed,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    backendSentryService.captureError(error, {
      endpoint: '/api/notifications/unsubscribe',
      method: 'POST',
      body: req.body
    });

    backendSentryService.monitorAPICall(
      '/api/notifications/unsubscribe',
      'POST',
      startTime,
      500,
      error
    );

    res.status(500).json({
      success: false,
      error: 'Failed to unsubscribe from notifications',
      timestamp: new Date().toISOString()
    });
  }
});

// Send push notification
router.post('/send', async (req, res) => {
  const startTime = Date.now();

  try {
    const { title, body, data, targetUsers } = req.body;

    if (!title || !body) {
      backendSentryService.monitorAPICall(
        '/api/notifications/send',
        'POST',
        startTime,
        400
      );

      return res.status(400).json({
        success: false,
        error: 'Title and body are required',
        timestamp: new Date().toISOString()
      });
    }

    backendSentryService.addBreadcrumb(
      'Sending push notification',
      'notification',
      'info',
      { 
        title,
        targetUsers: targetUsers || 'all',
        totalSubscriptions: subscriptions.length
      }
    );

    // In a real implementation, you would use web-push library here
    // For now, just simulate sending
    const notificationPayload = {
      title,
      body,
      data: data || {},
      timestamp: new Date().toISOString()
    };

    let sentCount = 0;
    let failedCount = 0;

    // Simulate sending to subscriptions
    for (const subscription of subscriptions) {
      try {
        // Here you would use web-push to send actual notifications
        // await webpush.sendNotification(subscription.subscription, JSON.stringify(notificationPayload));
        sentCount++;
      } catch (error) {
        failedCount++;
        backendSentryService.captureError(error, {
          context: 'push-notification-send',
          subscription: subscription.id
        });
      }
    }

    backendSentryService.monitorAPICall(
      '/api/notifications/send',
      'POST',
      startTime,
      200
    );

    backendSentryService.captureMessage(
      `Push notification sent: ${title}`,
      'info',
      { 
        notification: notificationPayload,
        sent: sentCount,
        failed: failedCount,
        total: subscriptions.length
      }
    );

    res.json({
      success: true,
      message: 'Notification sent successfully',
      sent: sentCount,
      failed: failedCount,
      total: subscriptions.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    backendSentryService.captureError(error, {
      endpoint: '/api/notifications/send',
      method: 'POST',
      body: req.body
    });

    backendSentryService.monitorAPICall(
      '/api/notifications/send',
      'POST',
      startTime,
      500,
      error
    );

    res.status(500).json({
      success: false,
      error: 'Failed to send notification',
      timestamp: new Date().toISOString()
    });
  }
});

// Get notification statistics
router.get('/stats', async (req, res) => {
  const startTime = Date.now();

  try {
    backendSentryService.addBreadcrumb(
      'Fetching notification statistics',
      'api',
      'info'
    );

    const stats = {
      totalSubscriptions: subscriptions.length,
      activeSubscriptions: subscriptions.filter(sub => 
        new Date(sub.subscribedAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      ).length,
      oldestSubscription: subscriptions.length > 0 ? 
        Math.min(...subscriptions.map(sub => new Date(sub.subscribedAt).getTime())) : null,
      newestSubscription: subscriptions.length > 0 ? 
        Math.max(...subscriptions.map(sub => new Date(sub.subscribedAt).getTime())) : null
    };

    backendSentryService.monitorAPICall(
      '/api/notifications/stats',
      'GET',
      startTime,
      200
    );

    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    backendSentryService.captureError(error, {
      endpoint: '/api/notifications/stats',
      method: 'GET'
    });

    backendSentryService.monitorAPICall(
      '/api/notifications/stats',
      'GET',
      startTime,
      500,
      error
    );

    res.status(500).json({
      success: false,
      error: 'Failed to fetch notification statistics',
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;

import React, { useState } from 'react';
import { Bug, AlertTriangle, Activity, User, TestTube, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { sentryService } from '@/services/sentryService';

const SentrySettings = () => {
  const [sentryStatus] = useState(sentryService.getStatus());
  const [testMessage, setTestMessage] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');

  const handleTestError = () => {
    try {
      // Intentionally throw an error for testing
      throw new Error('Test error from Sentry Settings - this is intentional for testing');
    } catch (error) {
      sentryService.captureError(error as Error, {
        test: true,
        source: 'sentry-settings',
        timestamp: new Date().toISOString()
      });
      alert('Test error sent to Sentry! Check your Sentry dashboard.');
    }
  };

  const handleTestMessage = () => {
    if (!testMessage.trim()) {
      alert('Please enter a test message');
      return;
    }

    sentryService.captureMessage(testMessage, 'info', {
      test: true,
      source: 'sentry-settings',
      timestamp: new Date().toISOString()
    });
    
    setTestMessage('');
    alert('Test message sent to Sentry! Check your Sentry dashboard.');
  };

  const handleSetUser = () => {
    if (!userEmail && !userName) {
      alert('Please enter either email or name');
      return;
    }

    sentryService.setUser({
      email: userEmail || undefined,
      username: userName || undefined,
      id: userEmail || userName || 'test-user'
    });

    alert('User context updated in Sentry!');
  };

  const handleTestBreadcrumb = () => {
    sentryService.addBreadcrumb(
      'User clicked test breadcrumb button',
      'user-action',
      'info',
      {
        component: 'SentrySettings',
        timestamp: new Date().toISOString()
      }
    );
    alert('Breadcrumb added! This will appear in the next error or message.');
  };

  const handleTestSentry = () => {
    sentryService.testSentry();
    alert('Sentry test completed! Check your dashboard and console.');
  };

  const getStatusColor = (initialized: boolean, enabled: boolean) => {
    if (initialized && enabled) return 'bg-green-500';
    if (enabled) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getStatusText = (initialized: boolean, enabled: boolean) => {
    if (initialized && enabled) return 'Active';
    if (enabled) return 'Configured';
    return 'Disabled';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bug className="w-6 h-6 text-red-600" />
            <span>Sentry Error Tracking</span>
            <Badge 
              className={`ml-2 ${getStatusColor(sentryStatus.initialized, sentryStatus.enabled)}`}
            >
              {getStatusText(sentryStatus.initialized, sentryStatus.enabled)}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">Status</div>
              <div className={`font-semibold ${sentryStatus.initialized ? 'text-green-600' : 'text-red-600'}`}>
                {sentryStatus.initialized ? 'Initialized' : 'Not Initialized'}
              </div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">Environment</div>
              <div className="font-semibold text-blue-600">
                {sentryStatus.environment}
              </div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">DSN</div>
              <div className="font-semibold text-gray-600 text-xs">
                {sentryStatus.dsn}
              </div>
            </div>
          </div>

          {/* Configuration Status */}
          {sentryStatus.initialized ? (
            <Alert>
              <Activity className="h-4 w-4" />
              <AlertDescription>
                Sentry is active and monitoring your application for errors and performance issues.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Sentry is not properly configured. Check your DSN and environment settings.
              </AlertDescription>
            </Alert>
          )}

          {/* Testing Section */}
          {sentryStatus.initialized && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center space-x-2">
                <TestTube className="w-5 h-5" />
                <span>Test Sentry Integration</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Test Error */}
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Test Error Capture</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Send a test error to verify error tracking is working.
                  </p>
                  <Button onClick={handleTestError} variant="outline" className="w-full">
                    Send Test Error
                  </Button>
                </div>

                {/* Test Message */}
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Test Message</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Send a custom message to Sentry.
                  </p>
                  <div className="space-y-2">
                    <Input
                      placeholder="Enter test message"
                      value={testMessage}
                      onChange={(e) => setTestMessage(e.target.value)}
                    />
                    <Button onClick={handleTestMessage} variant="outline" className="w-full">
                      Send Test Message
                    </Button>
                  </div>
                </div>

                {/* Test User Context */}
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Set User Context</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Associate errors with user information.
                  </p>
                  <div className="space-y-2">
                    <Input
                      placeholder="User email"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                    />
                    <Input
                      placeholder="User name"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                    />
                    <Button onClick={handleSetUser} variant="outline" className="w-full">
                      <User className="w-4 h-4 mr-2" />
                      Set User Context
                    </Button>
                  </div>
                </div>

                {/* Test Breadcrumb */}
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Test Breadcrumb</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Add a breadcrumb for debugging context.
                  </p>
                  <Button onClick={handleTestBreadcrumb} variant="outline" className="w-full">
                    Add Test Breadcrumb
                  </Button>
                </div>
              </div>

              {/* Comprehensive Test */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium mb-2">Run Complete Test</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Test all Sentry features at once (breadcrumb + message).
                </p>
                <Button onClick={handleTestSentry} className="w-full">
                  <TestTube className="w-4 h-4 mr-2" />
                  Run Complete Sentry Test
                </Button>
              </div>
            </div>
          )}

          {/* Sentry Dashboard Link */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-2 flex items-center space-x-2">
              <ExternalLink className="w-4 h-4" />
              <span>Sentry Dashboard</span>
            </h4>
            <p className="text-sm text-gray-600 mb-3">
              View errors, performance data, and user sessions in your Sentry dashboard.
            </p>
            <Button 
              onClick={() => window.open('https://sentry.io/', '_blank')}
              variant="outline"
              className="w-full"
            >
              Open Sentry Dashboard
            </Button>
          </div>

          {/* Setup Instructions */}
          <div className="text-sm text-gray-600 bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Sentry Features Active:</h4>
            <ul className="space-y-1">
              <li>• Real-time error tracking and alerting</li>
              <li>• Performance monitoring and tracing</li>
              <li>• User session recording and replay</li>
              <li>• Component error boundaries</li>
              <li>• API call monitoring and breadcrumbs</li>
              <li>• Custom context and user tracking</li>
            </ul>
          </div>

          {/* Technical Details */}
          <details className="mt-4">
            <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
              Technical Configuration
            </summary>
            <div className="mt-2 p-3 bg-gray-50 rounded text-xs">
              <pre className="whitespace-pre-wrap">
                {sentryService.getSetupInstructions()}
              </pre>
            </div>
          </details>
        </CardContent>
      </Card>
    </div>
  );
};

export default SentrySettings;

import React, { useState } from 'react';
import { CheckCircle, XCircle, Loader, AlertTriangle, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface TestResult {
  api: string;
  status: 'testing' | 'success' | 'error' | 'not-configured';
  message: string;
  details?: string;
}

const APIKeyTester: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isTestingAll, setIsTestingAll] = useState(false);

  const updateTestResult = (api: string, status: TestResult['status'], message: string, details?: string) => {
    setTestResults(prev => {
      const existing = prev.find(r => r.api === api);
      if (existing) {
        return prev.map(r => r.api === api ? { ...r, status, message, details } : r);
      }
      return [...prev, { api, status, message, details }];
    });
  };

  const testGoogleMapsAPI = async () => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey || apiKey === 'your_google_maps_api_key_here') {
      updateTestResult('Google Maps', 'not-configured', 'API key not configured');
      return;
    }

    updateTestResult('Google Maps', 'testing', 'Testing API key...');

    try {
      // Test 1: Geocoding API
      const geocodeResponse = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=London&key=${apiKey}`
      );
      
      if (!geocodeResponse.ok) {
        throw new Error(`HTTP ${geocodeResponse.status}: ${geocodeResponse.statusText}`);
      }

      const geocodeData = await geocodeResponse.json();
      
      if (geocodeData.status === 'OK') {
        updateTestResult(
          'Google Maps', 
          'success', 
          'API key is working! ✅',
          `Geocoding successful. Found ${geocodeData.results.length} results for London.`
        );
      } else if (geocodeData.status === 'REQUEST_DENIED') {
        updateTestResult(
          'Google Maps', 
          'error', 
          'API key denied ❌',
          `Error: ${geocodeData.error_message || 'Request denied. Check API key restrictions.'}`
        );
      } else if (geocodeData.status === 'OVER_QUERY_LIMIT') {
        updateTestResult(
          'Google Maps', 
          'error', 
          'Quota exceeded ⚠️',
          'API key is valid but quota exceeded. Try again later.'
        );
      } else {
        updateTestResult(
          'Google Maps', 
          'error', 
          `API Error: ${geocodeData.status}`,
          geocodeData.error_message || 'Unknown error occurred'
        );
      }
    } catch (error) {
      updateTestResult(
        'Google Maps', 
        'error', 
        'Connection failed ❌',
        `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  const testAnalyticsAPI = () => {
    const analyticsId = import.meta.env.VITE_ANALYTICS_ID;
    
    if (!analyticsId || analyticsId === 'G-XXXXXXXXXX') {
      updateTestResult('Google Analytics', 'not-configured', 'Analytics ID not configured');
      return;
    }

    updateTestResult('Google Analytics', 'testing', 'Checking Analytics ID format...');

    if (analyticsId.startsWith('G-') && analyticsId.length > 5) {
      updateTestResult(
        'Google Analytics', 
        'success', 
        'Analytics ID format is valid ✅',
        `ID: ${analyticsId}`
      );
    } else {
      updateTestResult(
        'Google Analytics', 
        'error', 
        'Invalid Analytics ID format ❌',
        'Analytics ID should start with "G-" and be longer than 5 characters'
      );
    }
  };

  const testOpenAIAPI = async () => {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    
    if (!apiKey || apiKey === 'your_openai_api_key_here') {
      updateTestResult('OpenAI', 'not-configured', 'API key not configured');
      return;
    }

    updateTestResult('OpenAI', 'testing', 'Testing OpenAI API key...');

    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        updateTestResult(
          'OpenAI', 
          'success', 
          'OpenAI API key is working! ✅',
          `Access to ${data.data?.length || 0} models`
        );
      } else if (response.status === 401) {
        updateTestResult(
          'OpenAI', 
          'error', 
          'Invalid API key ❌',
          'The API key is not valid or has been revoked'
        );
      } else if (response.status === 429) {
        updateTestResult(
          'OpenAI', 
          'error', 
          'Rate limit exceeded ⚠️',
          'API key is valid but rate limit exceeded'
        );
      } else {
        updateTestResult(
          'OpenAI', 
          'error', 
          `HTTP ${response.status} Error`,
          'API key may be valid but request failed'
        );
      }
    } catch (error) {
      updateTestResult(
        'OpenAI', 
        'error', 
        'Connection failed ❌',
        `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  const testAllAPIs = async () => {
    setIsTestingAll(true);
    setTestResults([]);
    
    // Test APIs sequentially to avoid rate limits
    await testGoogleMapsAPI();
    await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
    
    testAnalyticsAPI();
    await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
    
    await testOpenAIAPI();
    
    setIsTestingAll(false);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'testing':
        return <Loader className="w-5 h-5 text-blue-600 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'not-configured':
        return <AlertTriangle className="w-5 h-5 text-gray-400" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'testing':
        return 'border-blue-200 bg-blue-50';
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'not-configured':
        return 'border-gray-200 bg-gray-50';
      default:
        return 'border-gray-200';
    }
  };

  return (
    <div className="space-y-6" role="main" aria-labelledby="api-tester-title">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 id="api-tester-title" className="text-3xl font-bold">
            API Key Tester
          </h1>
          <p className="text-gray-600 mt-2">
            Test your API keys to ensure they're working correctly
          </p>
        </div>
        <Button 
          onClick={testAllAPIs} 
          disabled={isTestingAll}
          className="flex items-center space-x-2"
        >
          {isTestingAll ? (
            <Loader className="w-4 h-4 animate-spin" />
          ) : (
            <CheckCircle className="w-4 h-4" />
          )}
          <span>{isTestingAll ? 'Testing...' : 'Test All APIs'}</span>
        </Button>
      </div>

      {/* Individual API Tests */}
      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Individual API Tests</span>
              <Badge variant="outline">
                {testResults.filter(r => r.status === 'success').length} / {testResults.length} Working
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <Button
                variant="outline"
                onClick={testGoogleMapsAPI}
                className="flex items-center justify-between p-4 h-auto"
              >
                <div className="flex items-center space-x-3">
                  <span className="font-medium">Google Maps API</span>
                  <Badge variant="secondary">Most Important</Badge>
                </div>
                <ExternalLink className="w-4 h-4" />
              </Button>

              <Button
                variant="outline"
                onClick={testAnalyticsAPI}
                className="flex items-center justify-between p-4 h-auto"
              >
                <div className="flex items-center space-x-3">
                  <span className="font-medium">Google Analytics</span>
                  <Badge variant="outline">Optional</Badge>
                </div>
                <ExternalLink className="w-4 h-4" />
              </Button>

              <Button
                variant="outline"
                onClick={testOpenAIAPI}
                className="flex items-center justify-between p-4 h-auto"
              >
                <div className="flex items-center space-x-3">
                  <span className="font-medium">OpenAI API</span>
                  <Badge variant="outline">AI Features</Badge>
                </div>
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Test Results */}
        {testResults.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {testResults.map((result) => (
                  <div
                    key={result.api}
                    className={`p-4 rounded-lg border-2 ${getStatusColor(result.status)}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(result.status)}
                        <span className="font-medium">{result.api}</span>
                      </div>
                      <Badge 
                        variant={result.status === 'success' ? 'default' : 
                                result.status === 'error' ? 'destructive' : 'secondary'}
                      >
                        {result.status}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium mb-1">{result.message}</p>
                    {result.details && (
                      <p className="text-xs text-gray-600">{result.details}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Help Section */}
        <Card>
          <CardHeader>
            <CardTitle>Need Help?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div>
                <h4 className="font-medium text-green-600 mb-1">✅ If tests pass:</h4>
                <p className="text-gray-600">Your API keys are working correctly! You can now use all the features.</p>
              </div>
              
              <div>
                <h4 className="font-medium text-red-600 mb-1">❌ If tests fail:</h4>
                <ul className="text-gray-600 space-y-1 ml-4">
                  <li>• Check that the API key is correctly copied</li>
                  <li>• Verify the API is enabled in the provider's console</li>
                  <li>• Check domain restrictions and quotas</li>
                  <li>• Ensure billing is set up (for paid APIs)</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-gray-600 mb-1">⚠️ Common Issues:</h4>
                <ul className="text-gray-600 space-y-1 ml-4">
                  <li>• <strong>REQUEST_DENIED</strong>: API not enabled or domain restricted</li>
                  <li>• <strong>OVER_QUERY_LIMIT</strong>: Quota exceeded, try again later</li>
                  <li>• <strong>401 Unauthorized</strong>: Invalid API key</li>
                  <li>• <strong>Network Error</strong>: Check internet connection</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default APIKeyTester;

import React, { useState } from 'react';
import { CheckCircle, XCircle, Loader, AlertTriangle, Play } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface TestResult {
  api: string;
  status: 'testing' | 'success' | 'error' | 'not-configured';
  message: string;
  details?: string;
  data?: any;
}

const APITester: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isTestingAll, setIsTestingAll] = useState(false);

  // Debug: Log when component loads
  React.useEffect(() => {
    console.log('🧪 APITester component loaded successfully');
  }, []);

  const updateTestResult = (api: string, status: TestResult['status'], message: string, details?: string, data?: any) => {
    setTestResults(prev => {
      const existing = prev.find(r => r.api === api);
      if (existing) {
        return prev.map(r => r.api === api ? { ...r, status, message, details, data } : r);
      }
      return [...prev, { api, status, message, details, data }];
    });
  };

  const testRapidAPIZoopla = async () => {
    console.log('🔍 Testing RapidAPI Zoopla clicked!');
    const rapidApiKey = import.meta.env.VITE_RAPIDAPI_KEY;
    const rapidApiHost = import.meta.env.VITE_RAPIDAPI_HOST;

    console.log('🔑 API Key:', rapidApiKey ? 'Present' : 'Missing');
    console.log('🏠 API Host:', rapidApiHost);

    if (!rapidApiKey || rapidApiKey === 'your_rapidapi_key_here') {
      updateTestResult('RapidAPI Zoopla', 'not-configured', 'RapidAPI key not configured');
      return;
    }

    updateTestResult('RapidAPI Zoopla', 'testing', 'Testing Zoopla API via RapidAPI...');

    try {
      // Test with Manchester postcode
      const response = await fetch(`https://${rapidApiHost}/rent/M1`, {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': rapidApiKey,
          'X-RapidAPI-Host': rapidApiHost
        }
      });

      if (response.ok) {
        const data = await response.json();
        updateTestResult(
          'RapidAPI Zoopla', 
          'success', 
          'Zoopla API working! ✅',
          `Found ${Array.isArray(data) ? data.length : 'some'} properties in Manchester`,
          data
        );
      } else if (response.status === 401) {
        updateTestResult(
          'RapidAPI Zoopla', 
          'error', 
          'Invalid API key ❌',
          'The RapidAPI key is not valid or subscription expired'
        );
      } else if (response.status === 429) {
        updateTestResult(
          'RapidAPI Zoopla', 
          'error', 
          'Rate limit exceeded ⚠️',
          'API key is valid but rate limit exceeded'
        );
      } else {
        updateTestResult(
          'RapidAPI Zoopla', 
          'error', 
          `HTTP ${response.status} Error`,
          'API request failed'
        );
      }
    } catch (error) {
      updateTestResult(
        'RapidAPI Zoopla', 
        'error', 
        'Connection failed ❌',
        `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  const testApifyOpenRent = async () => {
    const apifyToken = import.meta.env.VITE_APIFY_TOKEN;
    const openrentActor = import.meta.env.VITE_OPENRENT_ACTOR;
    
    if (!apifyToken || apifyToken === 'your_apify_token_here') {
      updateTestResult('Apify OpenRent', 'not-configured', 'Apify token not configured');
      return;
    }

    updateTestResult('Apify OpenRent', 'testing', 'Testing OpenRent scraper via Apify...');

    try {
      const response = await fetch(
        `https://api.apify.com/v2/acts/${openrentActor}/run-sync-get-dataset-items?token=${apifyToken}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            startUrls: ['https://www.openrent.com/properties-to-rent/manchester'],
            includeDuplicates: false,
            proxyConfiguration: {}
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        updateTestResult(
          'Apify OpenRent',
          'success',
          'OpenRent scraper working! ✅',
          `Scraped ${Array.isArray(data) ? data.length : 'some'} properties from OpenRent`,
          data
        );
      } else {
        const errorData = await response.json().catch(() => ({}));

        if (response.status === 401) {
          updateTestResult(
            'Apify OpenRent',
            'error',
            'Invalid Apify token ❌',
            'The Apify token is not valid or expired'
          );
        } else if (response.status === 402 || errorData.error?.type === 'actor-is-not-rented') {
          updateTestResult(
            'Apify OpenRent',
            'error',
            'Subscription required ⚠️',
            'OpenRent scraper requires paid Apify subscription. Free trial has expired. Go to: https://console.apify.com/actors/2FaMg8VBCurDiflaN'
          );
        } else {
          updateTestResult(
            'Apify OpenRent',
            'error',
            `HTTP ${response.status} Error`,
            errorData.error?.message || 'Apify API request failed'
          );
        }
      }
    } catch (error) {
      updateTestResult(
        'Apify OpenRent', 
        'error', 
        'Connection failed ❌',
        `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  const testRealPropertyService = async () => {
    updateTestResult('Real Property Service', 'testing', 'Testing integrated property service...');

    try {
      const { realPropertyService } = await import('../services/realPropertyService');
      
      const searchFilters = {
        location: 'Manchester',
        maxPrice: 1000,
        radius: 2000
      };

      const properties = await realPropertyService.searchProperties(searchFilters);
      
      if (properties.length > 0) {
        updateTestResult(
          'Real Property Service', 
          'success', 
          'Property service working! ✅',
          `Found ${properties.length} properties from integrated APIs`,
          properties.slice(0, 3) // Show first 3 properties
        );
      } else {
        updateTestResult(
          'Real Property Service', 
          'error', 
          'No properties found ⚠️',
          'Service is working but no properties returned for Manchester'
        );
      }
    } catch (error) {
      updateTestResult(
        'Real Property Service', 
        'error', 
        'Service failed ❌',
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  const testAllAPIs = async () => {
    setIsTestingAll(true);
    setTestResults([]);
    
    // Test APIs sequentially
    await testRapidAPIZoopla();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testApifyOpenRent();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testRealPropertyService();
    
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
            Real Property API Tester
          </h1>
          <p className="text-gray-600 mt-2">
            Test real property APIs to replace mock data
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
            <Play className="w-4 h-4" />
          )}
          <span>{isTestingAll ? 'Testing...' : 'Test All Property APIs'}</span>
        </Button>
      </div>

      {/* Individual API Tests */}
      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Property Data APIs</span>
              <Badge variant="outline">
                {testResults.filter(r => r.status === 'success').length} / {testResults.length} Working
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <Button
                variant="outline"
                onClick={testRapidAPIZoopla}
                className="flex items-center justify-between p-4 h-auto"
              >
                <div className="flex items-center space-x-3">
                  <span className="font-medium">RapidAPI Zoopla</span>
                  <Badge variant="secondary">UK Property Data</Badge>
                </div>
                <Play className="w-4 h-4" />
              </Button>

              <Button
                variant="outline"
                onClick={testApifyOpenRent}
                className="flex items-center justify-between p-4 h-auto"
              >
                <div className="flex items-center space-x-3">
                  <span className="font-medium">Apify OpenRent</span>
                  <Badge variant="secondary">Rental Scraper</Badge>
                </div>
                <Play className="w-4 h-4" />
              </Button>

              <Button
                variant="outline"
                onClick={testRealPropertyService}
                className="flex items-center justify-between p-4 h-auto"
              >
                <div className="flex items-center space-x-3">
                  <span className="font-medium">Integrated Property Service</span>
                  <Badge variant="default">Combined APIs</Badge>
                </div>
                <Play className="w-4 h-4" />
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
                      <p className="text-xs text-gray-600 mb-2">{result.details}</p>
                    )}
                    {result.data && (
                      <details className="text-xs">
                        <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                          View Sample Data
                        </summary>
                        <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-32">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Configuration Status */}
        <Card>
          <CardHeader>
            <CardTitle>API Configuration Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-3 border rounded-lg">
                <h4 className="font-medium mb-2">RapidAPI (Zoopla)</h4>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>API Key:</span>
                    <Badge variant={import.meta.env.VITE_RAPIDAPI_KEY ? 'default' : 'secondary'}>
                      {import.meta.env.VITE_RAPIDAPI_KEY ? 'Configured' : 'Missing'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Host:</span>
                    <span className="text-xs font-mono">{import.meta.env.VITE_RAPIDAPI_HOST || 'Not set'}</span>
                  </div>
                </div>
              </div>

              <div className="p-3 border rounded-lg">
                <h4 className="font-medium mb-2">Apify (OpenRent)</h4>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Token:</span>
                    <Badge variant={import.meta.env.VITE_APIFY_TOKEN ? 'default' : 'secondary'}>
                      {import.meta.env.VITE_APIFY_TOKEN ? 'Configured' : 'Missing'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Actor:</span>
                    <span className="text-xs font-mono">{import.meta.env.VITE_OPENRENT_ACTOR || 'Not set'}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default APITester;

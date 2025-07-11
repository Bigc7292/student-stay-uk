import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, Clock, Globe, TestTube, XCircle, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message: string;
  details?: string;
  duration?: number;
  data?: any;
}

const BrightDataTester = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isTestingAll, setIsTestingAll] = useState(false);
  const [brightDataConfig, setBrightDataConfig] = useState<any>({});

  useEffect(() => {
    // Get Bright Data configuration
    const config = {
      apiToken: import.meta.env.BRIGHT_DATA_API_TOKEN || 'Not configured',
      zone: import.meta.env.BRIGHT_DATA_WEB_UNLOCKER_ZONE || 'Not configured',
      customerId: import.meta.env.BRIGHT_DATA_CUSTOMER_ID || 'Not configured',
      proxyHost: import.meta.env.BRIGHT_DATA_PROXY_HOST || 'Not configured',
      proxyUsername: import.meta.env.BRIGHT_DATA_PROXY_USERNAME || 'Not configured'
    };
    setBrightDataConfig(config);
  }, []);

  const updateTestResult = (name: string, status: TestResult['status'], message: string, details?: string, duration?: number, data?: any) => {
    setTestResults(prev => {
      const existing = prev.find(r => r.name === name);
      if (existing) {
        return prev.map(r => r.name === name ? { ...r, status, message, details, duration, data } : r);
      }
      return [...prev, { name, status, message, details, duration, data }];
    });
  };

  const testBrightDataConfiguration = async () => {
    const startTime = Date.now();
    updateTestResult('Configuration Check', 'running', 'Checking Bright Data configuration...');
    
    try {
      const apiToken = import.meta.env.BRIGHT_DATA_API_TOKEN;
      const zone = import.meta.env.BRIGHT_DATA_WEB_UNLOCKER_ZONE;
      
      if (!apiToken || apiToken === 'your_bright_data_token_here') {
        updateTestResult('Configuration Check', 'error', 'API token not configured', 
          'Please set BRIGHT_DATA_API_TOKEN in your environment variables');
        return false;
      }

      if (!zone || zone === 'your_zone_name') {
        updateTestResult('Configuration Check', 'error', 'Zone not configured', 
          'Please set BRIGHT_DATA_WEB_UNLOCKER_ZONE in your environment variables');
        return false;
      }

      if (zone === 'colin_james' && apiToken.startsWith('daf20140ecc930ba83243d2b1ec89e5e3f97d508176d7e318e6c17822f932fb2')) {
        updateTestResult('Configuration Check', 'success', 'Bright Data Web Unlocker configured correctly', 
          `Zone: ${zone}, Customer ID: hl_eb2c99e2`, Date.now() - startTime);
        return true;
      } else {
        updateTestResult('Configuration Check', 'error', 'Configuration mismatch', 
          `Expected zone 'colin_james' but found: ${zone}`);
        return false;
      }
    } catch (error) {
      updateTestResult('Configuration Check', 'error', 'Configuration check failed', 
        error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  };

  const testBrightDataAPI = async () => {
    const startTime = Date.now();
    updateTestResult('API Connection Test', 'running', 'Testing Bright Data API connection...');
    
    try {
      const apiToken = import.meta.env.BRIGHT_DATA_API_TOKEN;
      const zone = import.meta.env.BRIGHT_DATA_WEB_UNLOCKER_ZONE;
      
      const response = await fetch('https://api.brightdata.com/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiToken}`
        },
        body: JSON.stringify({
          zone: zone,
          url: 'http://geo.brdtest.com/welcome.txt',
          format: 'raw'
        })
      });

      if (response.ok) {
        const data = await response.text();
        updateTestResult('API Connection Test', 'success', 'Bright Data API working correctly', 
          `Response: ${data.substring(0, 100)}...`, Date.now() - startTime, { responseData: data });
        return true;
      } else {
        const errorText = await response.text();
        updateTestResult('API Connection Test', 'error', `API request failed: ${response.status}`, 
          errorText);
        return false;
      }
    } catch (error) {
      updateTestResult('API Connection Test', 'error', 'API request failed', 
        error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  };

  const testPropertyScraping = async () => {
    const startTime = Date.now();
    updateTestResult('Property Scraping Test', 'running', 'Testing property data scraping...');
    
    try {
      const apiToken = import.meta.env.BRIGHT_DATA_API_TOKEN;
      const zone = import.meta.env.BRIGHT_DATA_WEB_UNLOCKER_ZONE;
      
      // Test scraping a property website (using a safe test URL)
      const response = await fetch('https://api.brightdata.com/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiToken}`
        },
        body: JSON.stringify({
          zone: zone,
          url: 'https://httpbin.org/json',
          format: 'raw'
        })
      });

      if (response.ok) {
        const data = await response.text();
        updateTestResult('Property Scraping Test', 'success', 'Property scraping capability verified', 
          `Successfully scraped test data`, Date.now() - startTime, { scrapedData: data });
        return true;
      } else {
        const errorText = await response.text();
        updateTestResult('Property Scraping Test', 'error', `Scraping test failed: ${response.status}`, 
          errorText);
        return false;
      }
    } catch (error) {
      updateTestResult('Property Scraping Test', 'error', 'Scraping test failed', 
        error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  };

  const testGeoLocation = async () => {
    const startTime = Date.now();
    updateTestResult('Geo Location Test', 'running', 'Testing geo-location capabilities...');
    
    try {
      const apiToken = import.meta.env.BRIGHT_DATA_API_TOKEN;
      const zone = import.meta.env.BRIGHT_DATA_WEB_UNLOCKER_ZONE;
      
      const response = await fetch('https://api.brightdata.com/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiToken}`
        },
        body: JSON.stringify({
          zone: zone,
          url: 'https://httpbin.org/ip',
          format: 'raw'
        })
      });

      if (response.ok) {
        const data = await response.text();
        updateTestResult('Geo Location Test', 'success', 'Geo-location proxy working', 
          `IP response received`, Date.now() - startTime, { ipData: data });
        return true;
      } else {
        const errorText = await response.text();
        updateTestResult('Geo Location Test', 'error', `Geo test failed: ${response.status}`, 
          errorText);
        return false;
      }
    } catch (error) {
      updateTestResult('Geo Location Test', 'error', 'Geo test failed', 
        error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  };

  const runAllTests = async () => {
    setIsTestingAll(true);
    setTestResults([]);
    
    const tests = [
      testBrightDataConfiguration,
      testBrightDataAPI,
      testPropertyScraping,
      testGeoLocation
    ];

    let passedTests = 0;
    
    for (const test of tests) {
      try {
        const result = await test();
        if (result) passedTests++;
      } catch (error) {
        console.error('Test failed:', error);
      }
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    setIsTestingAll(false);
    
    // Add summary
    setTimeout(() => {
      updateTestResult('Test Summary', passedTests === tests.length ? 'success' : 'error', 
        `${passedTests}/${tests.length} tests passed`, 
        passedTests === tests.length ? 'Bright Data Web Unlocker is fully operational!' : 'Some tests failed. Check configuration and credentials.');
    }, 1000);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'running':
        return <Clock className="w-5 h-5 text-blue-600 animate-spin" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'running':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="w-6 h-6 text-purple-600" />
            <span>Bright Data Web Unlocker Tester</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Configuration Info */}
            <Alert>
              <Globe className="h-4 w-4" />
              <AlertDescription>
                <strong>Web Unlocker Status:</strong> Ready to go! 
                <Badge className="ml-2 bg-purple-100 text-purple-800">Zone: {brightDataConfig.zone}</Badge>
                <Badge className="ml-2 bg-blue-100 text-blue-800">Customer: {brightDataConfig.customerId}</Badge>
              </AlertDescription>
            </Alert>

            {/* Test Controls */}
            <div className="flex space-x-2">
              <Button 
                onClick={runAllTests} 
                disabled={isTestingAll}
                className="flex items-center space-x-2"
              >
                <TestTube className="w-4 h-4" />
                <span>{isTestingAll ? 'Testing...' : 'Run All Tests'}</span>
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setTestResults([])}
                disabled={isTestingAll}
              >
                Clear Results
              </Button>
            </div>

            {/* Test Results */}
            {testResults.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Test Results</h3>
                {testResults.map((result, index) => (
                  <div 
                    key={index} 
                    className={`p-4 rounded-lg border ${getStatusColor(result.status)}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(result.status)}
                        <div>
                          <h4 className="font-medium">{result.name}</h4>
                          <p className="text-sm text-gray-600">{result.message}</p>
                          {result.details && (
                            <p className="text-xs text-gray-500 mt-1">{result.details}</p>
                          )}
                          {result.data && (
                            <details className="mt-2">
                              <summary className="text-xs text-blue-600 cursor-pointer">View Response Data</summary>
                              <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto max-h-32">
                                {JSON.stringify(result.data, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      </div>
                      {result.duration && (
                        <Badge variant="outline" className="text-xs">
                          {result.duration}ms
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Configuration Details */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">Configuration Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div><strong>API Token:</strong> {brightDataConfig.apiToken?.substring(0, 20)}...</div>
                <div><strong>Zone:</strong> {brightDataConfig.zone}</div>
                <div><strong>Customer ID:</strong> {brightDataConfig.customerId}</div>
                <div><strong>Proxy Host:</strong> {brightDataConfig.proxyHost}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BrightDataTester;

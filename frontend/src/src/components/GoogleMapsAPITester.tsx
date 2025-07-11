import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { mapsService } from '@/services/mapsService';
import { AlertCircle, CheckCircle, Clock, MapPin, TestTube, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message: string;
  details?: string;
  duration?: number;
}

const GoogleMapsAPITester = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isTestingAll, setIsTestingAll] = useState(false);
  const [currentAPIKey, setCurrentAPIKey] = useState<string>('');

  useEffect(() => {
    // Get current API key
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 
                   localStorage.getItem('google_maps_api_key') || 
                   'Not configured';
    setCurrentAPIKey(apiKey);
  }, []);

  const updateTestResult = (name: string, status: TestResult['status'], message: string, details?: string, duration?: number) => {
    setTestResults(prev => {
      const existing = prev.find(r => r.name === name);
      if (existing) {
        return prev.map(r => r.name === name ? { ...r, status, message, details, duration } : r);
      }
      return [...prev, { name, status, message, details, duration }];
    });
  };

  const testAPIKeyConfiguration = async () => {
    const startTime = Date.now();
    updateTestResult('API Key Configuration', 'running', 'Checking API key configuration...');
    
    try {
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      
      if (!apiKey || apiKey === 'your_google_maps_api_key_here') {
        updateTestResult('API Key Configuration', 'error', 'API key not configured', 
          'Please set VITE_GOOGLE_MAPS_API_KEY in your environment variables');
        return false;
      }

      if (apiKey === 'AIzaSyB8SD-e7NsRs3r3pLwiU6jBO5qLmwVfhO0') {
        updateTestResult('API Key Configuration', 'success', 'New API key configured correctly', 
          `Key: ${apiKey.substring(0, 20)}...`, Date.now() - startTime);
        return true;
      } else {
        updateTestResult('API Key Configuration', 'error', 'Unexpected API key found', 
          `Expected new key but found: ${apiKey.substring(0, 20)}...`);
        return false;
      }
    } catch (error) {
      updateTestResult('API Key Configuration', 'error', 'Configuration check failed', 
        error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  };

  const testGeocodingAPI = async () => {
    const startTime = Date.now();
    updateTestResult('Geocoding API', 'running', 'Testing geocoding service...');
    
    try {
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=Manchester+University&key=${apiKey}`
      );
      const data = await response.json();
      
      if (data.status === 'OK') {
        const location = data.results[0].geometry.location;
        updateTestResult('Geocoding API', 'success', 'Geocoding working correctly', 
          `Manchester University: ${location.lat}, ${location.lng}`, Date.now() - startTime);
        return true;
      } else {
        updateTestResult('Geocoding API', 'error', `Geocoding failed: ${data.status}`, 
          data.error_message || 'No error message provided');
        return false;
      }
    } catch (error) {
      updateTestResult('Geocoding API', 'error', 'Geocoding request failed', 
        error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  };

  const testMapsService = async () => {
    const startTime = Date.now();
    updateTestResult('Maps Service', 'running', 'Testing maps service initialization...');
    
    try {
      if (!mapsService.isAPIAvailable()) {
        updateTestResult('Maps Service', 'error', 'Maps service reports API not available');
        return false;
      }

      await mapsService.loadGoogleMaps();
      updateTestResult('Maps Service', 'success', 'Maps service loaded successfully', 
        'Google Maps JavaScript API loaded', Date.now() - startTime);
      return true;
    } catch (error) {
      updateTestResult('Maps Service', 'error', 'Maps service failed to load', 
        error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  };

  const testPlacesAPI = async () => {
    const startTime = Date.now();
    updateTestResult('Places API', 'running', 'Testing places search...');

    try {
      // Wait for Google Maps to be loaded
      if (!window.google || !window.google.maps || !window.google.maps.places) {
        updateTestResult('Places API', 'error', 'Google Maps Places library not loaded',
          'Make sure the Google Maps API is loaded with places library');
        return false;
      }

      // Create a temporary map element for places service
      const tempDiv = document.createElement('div');
      const tempMap = new window.google.maps.Map(tempDiv, {
        center: { lat: 53.4668, lng: -2.2339 }, // Manchester
        zoom: 13
      });

      // Create places service
      const service = new window.google.maps.places.PlacesService(tempMap);

      // Use Promise to handle the callback-based API
      const searchPromise = new Promise<boolean>((resolve) => {
        const request = {
          query: 'student accommodation Manchester',
          location: new window.google.maps.LatLng(53.4668, -2.2339),
          radius: 5000
        };

        service.textSearch(request, (results, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
            updateTestResult('Places API', 'success', 'Places API working correctly',
              `Found ${results.length} places`, Date.now() - startTime);
            resolve(true);
          } else {
            updateTestResult('Places API', 'error', `Places API failed: ${status}`,
              'Check API key permissions and Places API enablement');
            resolve(false);
          }
        });
      });

      return await searchPromise;
    } catch (error) {
      updateTestResult('Places API', 'error', 'Places API request failed',
        error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  };

  const runAllTests = async () => {
    setIsTestingAll(true);
    setTestResults([]);
    
    const tests = [
      testAPIKeyConfiguration,
      testGeocodingAPI,
      testMapsService,
      testPlacesAPI
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
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setIsTestingAll(false);
    
    // Add summary
    setTimeout(() => {
      updateTestResult('Test Summary', passedTests === tests.length ? 'success' : 'error', 
        `${passedTests}/${tests.length} tests passed`, 
        passedTests === tests.length ? 'All Google Maps APIs are working correctly!' : 'Some tests failed. Check API key configuration.');
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
            <TestTube className="w-6 h-6 text-blue-600" />
            <span>Google Maps API Tester</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Current API Key Info */}
            <Alert>
              <MapPin className="h-4 w-4" />
              <AlertDescription>
                <strong>Current API Key:</strong> {currentAPIKey.substring(0, 20)}...
                {currentAPIKey === 'AIzaSyB8SD-e7NsRs3r3pLwiU6jBO5qLmwVfhO0' && (
                  <Badge className="ml-2 bg-green-100 text-green-800">New Key</Badge>
                )}
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GoogleMapsAPITester;

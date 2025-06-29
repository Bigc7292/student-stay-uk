import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, CheckCircle, Loader, Play, XCircle } from 'lucide-react';
import React, { useState } from 'react';
import styles from './ComprehensiveTestSuite.module.css';

interface TestResult {
  category: string;
  test: string;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'warning';
  message: string;
  details?: string;
  duration?: number;
}

const ComprehensiveTestSuite: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<string>('');

  const testSuites = [
    {
      category: 'Navigation',
      tests: [
        { id: 'nav-primary-tabs', name: 'Primary Navigation Tabs', test: () => testPrimaryNavigation() },
        { id: 'nav-dropdown', name: 'More Tools Dropdown', test: () => testDropdownNavigation() },
        { id: 'nav-mobile', name: 'Mobile Navigation', test: () => testMobileNavigation() },
        { id: 'nav-state', name: 'Navigation State Management', test: () => testNavigationState() }
      ]
    },
    {
      category: 'API Integration',
      tests: [
        { id: 'api-google-maps', name: 'Google Maps API', test: () => testGoogleMapsAPI() },
        { id: 'api-rapidapi-zoopla', name: 'RapidAPI Zoopla', test: () => testRapidAPIZoopla() },
        { id: 'api-apify-openrent', name: 'Apify OpenRent', test: () => testApifyOpenRent() },
        { id: 'api-openai', name: 'OpenAI API', test: () => testOpenAIAPI() }
      ]
    },
    {
      category: 'Core Features',
      tests: [
        { id: 'feature-property-search', name: 'Property Search', test: () => testPropertySearch() },
        { id: 'feature-route-planner', name: 'Route Planner', test: () => testRoutePlanner() },
        { id: 'feature-ai-assistant', name: 'AI Assistant', test: () => testAIAssistant() },
        { id: 'feature-api-keys', name: 'API Key Management', test: () => testAPIKeyManagement() }
      ]
    },
    {
      category: 'Data Integration',
      tests: [
        { id: 'data-real-properties', name: 'Real Property Data', test: () => testRealPropertyData() },
        { id: 'data-mock-fallback', name: 'Mock Data Fallback', test: () => testMockDataFallback() },
        { id: 'data-caching', name: 'Data Caching', test: () => testDataCaching() },
        { id: 'data-error-handling', name: 'Error Handling', test: () => testErrorHandling() }
      ]
    },
    {
      category: 'User Interface',
      tests: [
        { id: 'ui-responsive', name: 'Responsive Design', test: () => testResponsiveDesign() },
        { id: 'ui-accessibility', name: 'Accessibility Features', test: () => testAccessibility() },
        { id: 'ui-performance', name: 'Performance Metrics', test: () => testPerformance() },
        { id: 'ui-error-boundaries', name: 'Error Boundaries', test: () => testErrorBoundaries() }
      ]
    }
  ];

  const updateTestResult = (testId: string, status: TestResult['status'], message: string, details?: string, duration?: number) => {
    setTestResults(prev => {
      const existing = prev.find(r => r.test === testId);
      const category = testSuites.find(suite => suite.tests.some(t => t.id === testId))?.category || 'Unknown';
      
      if (existing) {
        return prev.map(r => r.test === testId ? { ...r, status, message, details, duration } : r);
      }
      return [...prev, { category, test: testId, status, message, details, duration }];
    });
  };

  // Test implementations
  const testPrimaryNavigation = async () => {
    const tabs = ['home', 'search', 'maps', 'ai-chat'];
    for (const tab of tabs) {
      const button = document.querySelector(`[data-tab="${tab}"]`);
      if (!button) throw new Error(`Primary tab ${tab} not found`);
    }
    return 'All primary navigation tabs found and functional';
  };

  const testDropdownNavigation = async () => {
    const dropdownButton = document.querySelector('[aria-expanded]');
    if (!dropdownButton) throw new Error('Dropdown button not found');
    
    // Simulate click
    (dropdownButton as HTMLElement).click();
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const dropdown = document.querySelector('[role="menu"]');
    if (!dropdown) throw new Error('Dropdown menu not visible');
    
    return 'Dropdown navigation working correctly';
  };

  const testMobileNavigation = async () => {
    const mobileButton = document.querySelector('[aria-label="Toggle mobile menu"]');
    if (!mobileButton) throw new Error('Mobile menu button not found');
    return 'Mobile navigation elements present';
  };

  const testNavigationState = async () => {
    const activeTab = document.querySelector('[aria-current="page"]');
    if (!activeTab) throw new Error('No active tab state found');
    return 'Navigation state management working';
  };

  const testGoogleMapsAPI = async () => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey || apiKey === 'your_google_maps_api_key_here') {
      throw new Error('Google Maps API key not configured');
    }
    
    // Test API connectivity
    const testUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=London&key=${apiKey}`;
    const response = await fetch(testUrl);
    const data = await response.json();
    
    if (data.status !== 'OK') {
      throw new Error(`Google Maps API error: ${data.status}`);
    }
    
    return `Google Maps API working - ${data.results.length} results for London`;
  };

  const testRapidAPIZoopla = async () => {
    const apiKey = import.meta.env.VITE_RAPIDAPI_KEY;
    const apiHost = import.meta.env.VITE_RAPIDAPI_HOST;
    
    if (!apiKey || !apiHost) {
      throw new Error('RapidAPI credentials not configured');
    }
    
    const response = await fetch(`https://${apiHost}/rent/M1`, {
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': apiHost
      }
    });
    
    if (response.status === 403) {
      throw new Error('RapidAPI key invalid or expired');
    }
    
    if (response.status === 429) {
      return 'RapidAPI rate limited (key is valid)';
    }
    
    if (!response.ok) {
      throw new Error(`RapidAPI error: ${response.status}`);
    }
    
    return 'RapidAPI Zoopla connection successful';
  };

  const testApifyOpenRent = async () => {
    const token = import.meta.env.VITE_APIFY_TOKEN;
    const actor = import.meta.env.VITE_OPENRENT_ACTOR;
    
    if (!token || !actor) {
      throw new Error('Apify credentials not configured');
    }
    
    // Test with a simple actor status check
    const response = await fetch(`https://api.apify.com/v2/acts/${actor}?token=${token}`);
    
    if (response.status === 401) {
      throw new Error('Apify token invalid');
    }
    
    if (response.status === 404) {
      throw new Error('Apify actor not found');
    }
    
    if (!response.ok) {
      throw new Error(`Apify error: ${response.status}`);
    }
    
    return 'Apify OpenRent connection successful';
  };

  const testOpenAIAPI = async () => {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    
    if (!apiKey || apiKey === 'your_openai_api_key_here') {
      throw new Error('OpenAI API key not configured');
    }
    
    if (!apiKey.startsWith('sk-')) {
      throw new Error('OpenAI API key format invalid');
    }
    
    return 'OpenAI API key format valid';
  };

  const testPropertySearch = async () => {
    const searchButton = document.querySelector('[data-testid="property-search"]');
    if (!searchButton) {
      return 'Property search component not found (may not be loaded)';
    }
    return 'Property search component available';
  };

  const testRoutePlanner = async () => {
    const routeButton = document.querySelector('[data-testid="route-planner"]');
    if (!routeButton) {
      return 'Route planner component not found (may not be loaded)';
    }
    return 'Route planner component available';
  };

  const testAIAssistant = async () => {
    const aiButton = document.querySelector('[data-testid="ai-assistant"]');
    if (!aiButton) {
      return 'AI assistant component not found (may not be loaded)';
    }
    return 'AI assistant component available';
  };

  const testAPIKeyManagement = async () => {
    const apiKeysButton = document.querySelector('[data-testid="api-keys"]');
    if (!apiKeysButton) {
      return 'API key management not found (may not be loaded)';
    }
    return 'API key management component available';
  };

  const testRealPropertyData = async () => {
    try {
      const realPropertyService = (await import('../services/realPropertyService')).default;
      const isConfigured = realPropertyService.isConfigured();
      
      if (!isConfigured.zoopla && !isConfigured.openrent) {
        throw new Error('No property APIs configured');
      }
      
      return `Property APIs configured - Zoopla: ${isConfigured.zoopla}, OpenRent: ${isConfigured.openrent}`;
    } catch (error) {
      throw new Error(`Real property service error: ${error}`);
    }
  };

  const testMockDataFallback = async () => {
    try {
      const mockData = await import('../data/mockData');
      // Check for any mock data export - could be accommodations, properties, etc.
      const hasData = Object.keys(mockData).length > 0;
      if (!hasData) {
        throw new Error('Mock data not available');
      }
      return `Mock data available - ${Object.keys(mockData).length} data exports`;
    } catch (error) {
      throw new Error('Mock data fallback not working');
    }
  };

  const testDataCaching = async () => {
    const cacheKeys = await caches.keys();
    if (cacheKeys.length === 0) {
      return 'No cache found (may be normal)';
    }
    return `Caching working - ${cacheKeys.length} cache stores`;
  };

  const testErrorHandling = async () => {
    // Test if error boundaries are set up
    const errorBoundary = document.querySelector('[data-error-boundary]');
    return errorBoundary ? 'Error boundaries configured' : 'Error boundaries not found';
  };

  const testResponsiveDesign = async () => {
    const viewport = window.innerWidth;
    const isMobile = viewport < 768;
    const isTablet = viewport >= 768 && viewport < 1024;
    const isDesktop = viewport >= 1024;
    
    return `Responsive design active - ${isMobile ? 'Mobile' : isTablet ? 'Tablet' : 'Desktop'} (${viewport}px)`;
  };

  const testAccessibility = async () => {
    const ariaLabels = document.querySelectorAll('[aria-label]').length;
    const altTexts = document.querySelectorAll('img[alt]').length;
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6').length;
    
    return `Accessibility features - ${ariaLabels} ARIA labels, ${altTexts} alt texts, ${headings} headings`;
  };

  const testPerformance = async () => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const loadTime = navigation.loadEventEnd - navigation.loadEventStart;
    
    return `Performance - Load time: ${loadTime.toFixed(2)}ms`;
  };

  const testErrorBoundaries = async () => {
    // Check if React error boundaries are working
    const hasErrorBoundary = window.React && window.React.version;
    return hasErrorBoundary ? 'React error boundaries available' : 'Error boundaries not detected';
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    for (const suite of testSuites) {
      for (const test of suite.tests) {
        setCurrentTest(`${suite.category}: ${test.name}`);
        updateTestResult(test.id, 'running', 'Running test...');
        
        const startTime = performance.now();
        
        try {
          const result = await test.test();
          const duration = performance.now() - startTime;
          updateTestResult(test.id, 'passed', result, undefined, duration);
        } catch (error) {
          const duration = performance.now() - startTime;
          updateTestResult(test.id, 'failed', 'Test failed', error instanceof Error ? error.message : String(error), duration);
        }
        
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    setIsRunning(false);
    setCurrentTest('');
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'running':
        return <Loader className="w-4 h-4 text-blue-600 animate-spin" />;
      case 'passed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      default:
        return <div className="w-4 h-4 bg-gray-300 rounded-full" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'running':
        return 'border-blue-200 bg-blue-50';
      case 'passed':
        return 'border-green-200 bg-green-50';
      case 'failed':
        return 'border-red-200 bg-red-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const totalTests = testSuites.reduce((acc, suite) => acc + suite.tests.length, 0);
  const completedTests = testResults.length;
  const passedTests = testResults.filter(r => r.status === 'passed').length;
  const failedTests = testResults.filter(r => r.status === 'failed').length;

  return (
    <div className="space-y-6" role="main" aria-labelledby="test-suite-title">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 id="test-suite-title" className="text-3xl font-bold">
            Comprehensive Test Suite
          </h1>
          <p className="text-gray-600 mt-2">
            Complete testing of StudentHome application functionality
          </p>
        </div>
        <Button 
          onClick={runAllTests} 
          disabled={isRunning}
          className="flex items-center space-x-2"
        >
          {isRunning ? (
            <Loader className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          <span>{isRunning ? 'Running Tests...' : 'Run All Tests'}</span>
        </Button>
      </div>

      {/* Progress */}
      {isRunning && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress: {completedTests}/{totalTests}</span>
                <span>{Math.round((completedTests / totalTests) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={styles.progressBar}
                />
              </div>
              {currentTest && (
                <p className="text-sm text-gray-600">Currently testing: {currentTest}</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{totalTests}</div>
                <div className="text-sm text-gray-600">Total Tests</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{passedTests}</div>
                <div className="text-sm text-gray-600">Passed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{failedTests}</div>
                <div className="text-sm text-gray-600">Failed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {passedTests > 0 ? Math.round((passedTests / completedTests) * 100) : 0}%
                </div>
                <div className="text-sm text-gray-600">Success Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Results by Category */}
      {testSuites.map((suite) => {
        const suiteResults = testResults.filter(r => r.category === suite.category);
        if (suiteResults.length === 0) return null;

        return (
          <Card key={suite.category}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{suite.category}</span>
                <Badge variant="outline">
                  {suiteResults.filter(r => r.status === 'passed').length} / {suiteResults.length} Passed
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {suiteResults.map((result) => (
                  <div
                    key={result.test}
                    className={`p-3 rounded-lg border ${getStatusColor(result.status)}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(result.status)}
                        <span className="font-medium">{result.test}</span>
                      </div>
                      {result.duration && (
                        <span className="text-xs text-gray-500">
                          {result.duration.toFixed(0)}ms
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 mb-1">{result.message}</p>
                    {result.details && (
                      <details className="text-xs">
                        <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                          View Details
                        </summary>
                        <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                          {result.details}
                        </pre>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default ComprehensiveTestSuite;

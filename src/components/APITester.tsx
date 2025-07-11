import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface TestResult {
  service: string;
  status: 'success' | 'error' | 'loading';
  message: string;
  details?: string;
  data?: any;
}

const APITester: React.FC = () => {
  const [results, setResults] = useState<TestResult[]>([]);

  const testService = async (serviceName: string, testFn: () => Promise<any>) => {
    setResults(prev => [
      ...prev.filter(r => r.service !== serviceName),
      { service: serviceName, status: 'loading', message: 'Testing...' }
    ]);

    try {
      const data = await testFn();
      setResults(prev => prev.map(r => 
        r.service === serviceName 
          ? { ...r, status: 'success', message: 'Service working correctly', data }
          : r
      ));
    } catch (error: any) {
      setResults(prev => prev.map(r => 
        r.service === serviceName 
          ? { 
              ...r, 
              status: 'error', 
              message: 'Service failed', 
              details: error.message || 'Unknown error'
            }
          : r
      ));
    }
  };

  const testAllServices = () => {
    console.log('Testing all services...');
    setResults([]);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>API Service Tester</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={testAllServices} className="mb-4">
            Test All Services
          </Button>
          
          <div className="space-y-3">
            {results.map((result) => (
              <div key={result.service} className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{result.service}</span>
                  <Badge variant={result.status === 'success' ? 'default' : result.status === 'error' ? 'destructive' : 'secondary'}>
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
                    <pre className="bg-gray-50 p-2 rounded mt-2 overflow-auto max-h-40">
                      {typeof result.data === 'string' ? result.data : JSON.stringify(result.data, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default APITester;
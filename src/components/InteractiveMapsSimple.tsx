import React from 'react';
import { MapPin, AlertCircle, Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

const InteractiveMapsSimple = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="w-6 h-6 text-blue-600" />
            <span>Interactive Maps</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Maps component is temporarily unavailable. Please refresh the page to try again.
            </AlertDescription>
          </Alert>
          
          <div className="mt-6 p-8 bg-gray-50 rounded-lg text-center">
            <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Maps Loading...</h3>
            <p className="text-gray-600 mb-4">
              The interactive maps feature is currently loading. This includes:
            </p>
            <ul className="text-sm text-gray-600 space-y-1 mb-6">
              <li>• University campus locations</li>
              <li>• Student accommodation mapping</li>
              <li>• Route planning to amenities</li>
              <li>• Nearby services and transport</li>
            </ul>
            <Button 
              onClick={() => window.location.reload()} 
              className="flex items-center space-x-2"
            >
              <Settings className="w-4 h-4" />
              <span>Refresh Page</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InteractiveMapsSimple;

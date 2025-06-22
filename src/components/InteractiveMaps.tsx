import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, MapPin, Settings } from 'lucide-react';

const InteractiveMaps = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MapPin className="w-6 h-6 text-blue-600" />
              <span>Interactive Campus & Accommodation Maps</span>
            </div>
            <Button variant="ghost" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Interactive maps are temporarily unavailable. Please configure your Google Maps API key to enable full functionality.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="p-6 bg-gray-50 rounded-lg text-center">
              <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Maps Coming Soon</h3>
              <p className="text-gray-600 mb-4">
                Interactive maps with university locations, student accommodations, and route planning will be available once configured.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                <div className="p-3 bg-white rounded border">
                  <h4 className="font-medium mb-2">🏫 University Locations</h4>
                  <p>Find and explore UK universities on an interactive map</p>
                </div>
                <div className="p-3 bg-white rounded border">
                  <h4 className="font-medium mb-2">🏠 Student Accommodations</h4>
                  <p>Browse student housing options near your chosen university</p>
                </div>
                <div className="p-3 bg-white rounded border">
                  <h4 className="font-medium mb-2">🗺️ Route Planning</h4>
                  <p>Plan walking routes from accommodation to university</p>
                </div>
                <div className="p-3 bg-white rounded border">
                  <h4 className="font-medium mb-2">📍 Area Insights</h4>
                  <p>Get safety, transport, and cost of living information</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">Alternative Options</h4>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('navigate-to-tab', { detail: 'routes' }));
                  }}
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  Use Route Planner Tool
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('navigate-to-tab', { detail: 'search' }));
                  }}
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  Search for Properties
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InteractiveMaps;

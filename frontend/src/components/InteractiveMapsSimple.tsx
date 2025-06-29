import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, MapPin } from 'lucide-react';

const InteractiveMapsSimple = () => (
  <div className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MapPin className="w-6 h-6 text-blue-600" />
          <span>Interactive Maps (Fallback)</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Alert className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            The full interactive maps experience is currently unavailable. Please check your internet connection or try again later.
          </AlertDescription>
        </Alert>
        <div className="p-6 bg-gray-50 rounded-lg text-center">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Basic Map Fallback</h3>
          <p className="text-gray-600 mb-4">
            Map features are limited in fallback mode. For the best experience, enable the full Interactive Maps feature.
          </p>
        </div>
      </CardContent>
    </Card>
  </div>
);

export default InteractiveMapsSimple;

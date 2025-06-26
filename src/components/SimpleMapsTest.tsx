import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, MapPin } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';

const SimpleMapsTest: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [initAttempted, setInitAttempted] = useState(false);

  // Callback ref to ensure element is available
  const mapCallbackRef = useCallback((node: HTMLDivElement | null) => {
    if (node && !initAttempted) {
      mapRef.current = node;
      console.log('🗺️ SimpleMapsTest: Map container attached via callback ref');
      setInitAttempted(true);
      // Small delay to ensure the element is fully rendered
      setTimeout(() => {
        initializeSimpleMap();
      }, 100);
    }
  }, [initAttempted]);

  const initializeSimpleMap = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🗺️ SimpleMapsTest: Starting initialization...');
      
      // Check if Google Maps is already loaded
      if (!window.google || !window.google.maps) {
        console.log('🗺️ SimpleMapsTest: Google Maps not loaded, loading now...');
        
        // Load Google Maps API
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyB8SD-e7NsRs3r3pLwiU6jBO5qLmwVfhO0&libraries=places&loading=async`;
        script.async = true;
        script.defer = true;
        
        const loadPromise = new Promise<void>((resolve, reject) => {
          script.onload = () => {
            console.log('🗺️ SimpleMapsTest: Google Maps API loaded');
            resolve();
          };
          script.onerror = () => {
            console.error('🗺️ SimpleMapsTest: Failed to load Google Maps API');
            reject(new Error('Failed to load Google Maps API'));
          };
        });
        
        document.head.appendChild(script);
        await loadPromise;
      } else {
        console.log('🗺️ SimpleMapsTest: Google Maps already loaded');
      }
      
      // Wait for map container with retries
      let retries = 0;
      const maxRetries = 30;

      while (!mapRef.current && retries < maxRetries) {
        console.log(`🗺️ SimpleMapsTest: Waiting for map container... (attempt ${retries + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 100));
        retries++;
      }

      if (!mapRef.current) {
        console.error('🗺️ SimpleMapsTest: Map container not found after waiting');
        throw new Error('Map container not available');
      }

      console.log('🗺️ SimpleMapsTest: Map container found!');
      
      console.log('🗺️ SimpleMapsTest: Creating map...');
      
      // Create simple map
      const mapInstance = new window.google.maps.Map(mapRef.current, {
        center: { lat: 53.4668, lng: -2.2339 }, // Manchester University
        zoom: 15,
        mapTypeId: 'roadmap'
      });
      
      // Add a simple marker
      new window.google.maps.Marker({
        position: { lat: 53.4668, lng: -2.2339 },
        map: mapInstance,
        title: 'University of Manchester',
        animation: window.google.maps.Animation.DROP
      });
      
      setMap(mapInstance);
      setIsLoading(false);
      
      console.log('🗺️ SimpleMapsTest: Map created successfully!');
      
    } catch (err) {
      console.error('🗺️ SimpleMapsTest: Initialization failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize map');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log('🗺️ SimpleMapsTest: Component mounted');
    if (!initAttempted) {
      const timer = setTimeout(() => {
        if (!initAttempted) {
          setInitAttempted(true);
          initializeSimpleMap();
        }
      }, 1000); // Increased delay to ensure DOM is ready

      return () => clearTimeout(timer);
    }
  }, [initAttempted]);

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="w-6 h-6 text-red-600" />
            <span>Simple Maps Test - Error</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Error:</strong> {error}
            </AlertDescription>
          </Alert>
          <Button onClick={initializeSimpleMap}>
            🔄 Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MapPin className="w-6 h-6 text-blue-600" />
          <span>Simple Maps Test</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading simple map test...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div
              ref={mapCallbackRef}
              className="w-full h-96 rounded-lg border simple-maps-test-map"
            />
            <Alert>
              <MapPin className="h-4 w-4" />
              <AlertDescription>
                <strong>Simple Map Test:</strong> This is a basic Google Maps implementation to test if the API is working correctly in the React app.
              </AlertDescription>
            </Alert>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SimpleMapsTest;

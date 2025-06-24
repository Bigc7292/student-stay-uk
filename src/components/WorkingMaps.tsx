// Ensure google.maps types are available
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Navigation, Settings } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';

declare global {
  // Remove redeclaration of google if types are installed
  // interface Window {
  //   google: unknown;
  //   initWorkingMaps: () => void;
  // }
  interface Window {
    initWorkingMaps: () => void;
  }
}

const WorkingMaps: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [map, setMap] = useState<unknown>(null);

  const loadGoogleMapsAPI = () => {
    return new Promise<void>((resolve, reject) => {
      // Check if already loaded
      if (window.google && window.google.maps) {
        console.log('🗺️ WorkingMaps: Google Maps already loaded');
        resolve();
        return;
      }

      console.log('🗺️ WorkingMaps: Loading Google Maps API...');

      // Create callback function
      window.initWorkingMaps = () => {
        console.log('🗺️ WorkingMaps: Google Maps API loaded successfully');
        resolve();
      };

      // Create script element
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=s4fm_2SM8Kly196qcszrM-FX9IM=&libraries=places&loading=async&callback=initWorkingMaps`;
      script.async = true;
      script.defer = true;
      script.onerror = () => {
        console.error('🗺️ WorkingMaps: Failed to load Google Maps API');
        reject(new Error('Failed to load Google Maps API'));
      };

      document.head.appendChild(script);
    });
  };

  const initializeMap = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🗺️ WorkingMaps: Starting initialization...');

      // Load Google Maps API
      await loadGoogleMapsAPI();

      // Element should already be available since we checked before calling this function
      if (!mapRef.current) {
        throw new Error('Map container not available');
      }

      console.log('🗺️ WorkingMaps: Creating map...');

      // Create map
      const mapInstance = new window.google.maps.Map(mapRef.current, {
        center: { lat: 53.4668, lng: -2.2339 }, // Manchester University
        zoom: 15,
        mapTypeId: 'roadmap',
        streetViewControl: true,
        fullscreenControl: true,
        mapTypeControl: true,
        zoomControl: true,
      });

      // Add markers
      const locations = [
        {
          lat: 53.4668,
          lng: -2.2339,
          title: 'University of Manchester',
          type: 'university'
        },
        {
          lat: 53.4631,
          lng: -2.2339,
          title: 'Student Accommodation - City Centre',
          type: 'accommodation'
        },
        {
          lat: 53.4808,
          lng: -2.2426,
          title: 'Manchester Metropolitan University',
          type: 'university'
        }
      ];

      locations.forEach(location => {
        const marker = new window.google.maps.Marker({
          position: { lat: location.lat, lng: location.lng },
          map: mapInstance,
          title: location.title,
          animation: window.google.maps.Animation.DROP
        });

        // Add info window
        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="max-width: 200px;">
              <h3 style="margin: 0 0 8px 0;">${location.title}</h3>
              <p style="margin: 0; color: #666;">Type: ${location.type}</p>
            </div>
          `
        });

        marker.addListener('click', () => {
          infoWindow.open(mapInstance, marker);
        });
      });

      setMap(mapInstance);
      setIsLoading(false);

      console.log('🗺️ WorkingMaps: Map initialized successfully!');

    } catch (err) {
      console.error('🗺️ WorkingMaps: Initialization failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize map');
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    console.log('🗺️ WorkingMaps: Component mounted');

    // Use a more aggressive approach to wait for the element
    const checkAndInitialize = () => {
      // Try to find the element by ID as well
      const elementById = document.getElementById('working-map-container');
      const elementByRef = mapRef.current;

      console.log('🗺️ WorkingMaps: Checking elements...');
      console.log('🗺️ Element by ID:', !!elementById);
      console.log('🗺️ Element by ref:', !!elementByRef);

      if (elementByRef || elementById) {
        console.log('🗺️ WorkingMaps: Map container found, initializing...');
        // Use whichever element we found
        if (!mapRef.current && elementById) {
          mapRef.current = elementById as HTMLDivElement;
        }
        initializeMap();
      } else {
        console.log('🗺️ WorkingMaps: Map container not ready, retrying...');
        setTimeout(checkAndInitialize, 500);
      }
    };

    // Start checking after a longer delay to ensure React has rendered
    const timer = setTimeout(checkAndInitialize, 1500);

    return () => clearTimeout(timer);
  }, [initializeMap]);

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="w-6 h-6 text-red-600" />
            <span>Working Maps - Error</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <MapPin className="h-4 w-4" />
            <AlertDescription>
              <strong>Error:</strong> {error}
            </AlertDescription>
          </Alert>
          <Button onClick={initializeMap}>
            🔄 Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MapPin className="w-6 h-6 text-blue-600" />
            <span>Working Maps Test</span>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Navigation className="w-4 h-4 mr-2" />
              My Location
            </Button>
            <Button variant="ghost" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading working maps...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div
              ref={mapRef}
              id="working-map-container"
              className="w-full h-96 rounded-lg border bg-gray-200 min-h-[400px]"
            />
            <Alert>
              <MapPin className="h-4 w-4" />
              <AlertDescription>
                <strong>Working Maps:</strong> This is a simplified Google Maps implementation that should work reliably. 
                Click markers to see location details.
              </AlertDescription>
            </Alert>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WorkingMaps;

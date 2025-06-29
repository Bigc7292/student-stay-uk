import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Navigation, Settings } from 'lucide-react';
import React, { useCallback, useRef, useState } from 'react';

const DirectMaps: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const lastContainerRef = useRef<HTMLDivElement | null>(null);

  const loadGoogleMapsAPI = () => {
    return new Promise<void>((resolve, reject) => {
      // Check if already loaded
      if (window.google && window.google.maps) {
        console.log('🗺️ DirectMaps: Google Maps already loaded');
        resolve();
        return;
      }

      console.log('🗺️ DirectMaps: Loading Google Maps API...');

      // Create callback function
      (window as unknown as { initDirectMaps: () => void }).initDirectMaps = () => {
        console.log('🗺️ DirectMaps: Google Maps API loaded successfully');
        resolve();
      };

      // Create script element
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=s4fm_2SM8Kly196qcszrM-FX9IM=&libraries=places&loading=async&callback=initDirectMaps`;
      script.async = true;
      script.defer = true;
      script.onerror = () => {
        console.error('🗺️ DirectMaps: Failed to load Google Maps API');
        reject(new Error('Failed to load Google Maps API'));
      };

      document.head.appendChild(script);
    });
  };

  // Callback ref to ensure map is initialized only when container is attached
  const initializeMap = useCallback(async (mapContainer: HTMLDivElement) => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🗺️ DirectMaps: Starting initialization...');

      // Load Google Maps API
      await loadGoogleMapsAPI();

      console.log('🗺️ DirectMaps: Container dimensions:', mapContainer.offsetWidth, 'x', mapContainer.offsetHeight);

      // Create map
      const mapInstance = new window.google.maps.Map(mapContainer, {
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

      console.log('🗺️ DirectMaps: Map initialized successfully!');

    } catch (err) {
      console.error('🗺️ DirectMaps: Initialization failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize map');
      setIsLoading(false);
    }
  }, []);

  const setMapContainerRef = useCallback((node: HTMLDivElement | null) => {
    mapContainerRef.current = node;
    lastContainerRef.current = node;
    if (node) {
      initializeMap(node);
    }
  }, [initializeMap]);

  // Retry handler for button
  const handleRetry = () => {
    if (lastContainerRef.current) {
      initializeMap(lastContainerRef.current);
    }
  };

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="w-6 h-6 text-red-600" />
            <span>Direct Maps - Error</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <MapPin className="h-4 w-4" />
            <AlertDescription>
              <strong>Error:</strong> {error}
            </AlertDescription>
          </Alert>
          <Button onClick={handleRetry}>
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
            <MapPin className="w-6 h-6 text-green-600" />
            <span>Direct Maps Test</span>
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
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading direct maps...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div
              ref={setMapContainerRef}
              className="w-full h-96 rounded-lg border bg-green-100 direct-maps-container"
            />
            <Alert>
              <MapPin className="h-4 w-4" />
              <AlertDescription>
                <strong>Direct Maps:</strong> This uses a callback ref to guarantee the map container is present before initializing the map. Click markers to see location details.
              </AlertDescription>
            </Alert>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DirectMaps;

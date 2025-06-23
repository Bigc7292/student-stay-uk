import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { mapsService } from '@/services/mapsService';
import {
    AlertCircle,
    Camera,
    Eye,
    Home,
    Map as MapIcon,
    MapPin,
    Navigation,
    Route,
    Satellite,
    School,
    Settings,
    Star
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

interface MapLocation {
  lat: number;
  lng: number;
  name: string;
  type: 'university' | 'accommodation' | 'transport' | 'amenity';
  description?: string;
  price?: string;
  rating?: number;
  contact?: string;
  website?: string;
}

const InteractiveMaps = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const streetViewRef = useRef<HTMLDivElement>(null);

  // State declarations first
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [streetView, setStreetView] = useState<google.maps.StreetViewPanorama | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<MapLocation | null>(null);
  const [mapType, setMapType] = useState<'roadmap' | 'satellite' | 'hybrid' | 'terrain'>('roadmap');
  const [showStreetView, setShowStreetView] = useState(false);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);

  // Simple initialization flag to prevent multiple initializations
  const [initAttempted, setInitAttempted] = useState(false);

  // Sample locations for demonstration
  const sampleLocations: MapLocation[] = useMemo(() => [
    {
      lat: 53.4668,
      lng: -2.2339,
      name: "University of Manchester",
      type: "university",
      description: "Leading research university in Manchester city centre",
      rating: 4.5
    },
    {
      lat: 53.4631,
      lng: -2.2339,
      name: "Student Accommodation - City Centre",
      type: "accommodation",
      description: "Modern studio apartments for students",
      price: "£650/month",
      rating: 4.2,
      contact: "+44 161 123 4567"
    },
    {
      lat: 53.4808,
      lng: -2.2426,
      name: "Manchester Metropolitan University",
      type: "university",
      description: "Modern university with excellent facilities",
      rating: 4.3
    },
    {
      lat: 53.4722,
      lng: -2.2235,
      name: "Student Housing - Northern Quarter",
      type: "accommodation",
      description: "Shared houses in trendy Northern Quarter",
      price: "£450/month",
      rating: 4.0
    }
  ], []);

  const showInfoWindow = useCallback((marker: google.maps.Marker, location: MapLocation) => {
    const infoWindow = new window.google.maps.InfoWindow({
      content: `
        <div style="max-width: 250px;">
          <h3 style="margin: 0 0 8px 0;">${location.name}</h3>
          <p style="margin: 0; color: #666;">Type: ${location.type}</p>
          ${location.price ? `<p style='margin: 0; color: #2d7a2d;'>Price: ${location.price}</p>` : ''}
          ${location.rating ? `<p style='margin: 0; color: #eab308;'>Rating: ${location.rating}</p>` : ''}
        </div>
      `
    });
    infoWindow.open(map, marker);
  }, [map]);

  // Move initializeMap above all hooks that reference it
  const initializeMap = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🗺️ Initializing Google Maps...');

      // Check if API key is available
      const isAPIAvailable = mapsService.isAPIAvailable();
      console.log('🗺️ API availability check:', isAPIAvailable);

      if (!isAPIAvailable) {
        console.error('🗺️ Google Maps API key not available');
        throw new Error('Google Maps API key not configured');
      }

      console.log('🗺️ API key available, loading Google Maps API...');

      // Load Google Maps API
      await mapsService.loadGoogleMaps();

      console.log('🗺️ Google Maps API loaded successfully');

      if (!mapRef.current) {
        console.error('🗺️ Map container element not found');
        throw new Error('Map container element not available');
      }

      console.log('🗺️ Map container element found, creating map instance...');
      console.log('🗺️ Map container dimensions:', mapRef.current.offsetWidth, 'x', mapRef.current.offsetHeight);
      console.log('🗺️ window.google available:', !!window.google);
      console.log('🗺️ window.google.maps available:', !!(window.google && window.google.maps));

      // Create map directly instead of using mapsService
      if (!window.google || !window.google.maps) {
        throw new Error('Google Maps API not loaded properly');
      }

      const mapInstance = new window.google.maps.Map(mapRef.current, {
        center: { lat: 53.4808, lng: -2.2426 }, // Manchester center
        zoom: 13,
        mapTypeId: mapType,
        streetViewControl: true,
        fullscreenControl: true,
        mapTypeControl: true,
        zoomControl: true,
        scaleControl: true,
        rotateControl: true,
        gestureHandling: 'cooperative'
      });

      console.log('🗺️ Map instance created:', mapInstance);
      setMap(mapInstance);

      console.log('🗺️ Adding markers...');

      // Add markers for sample locations
      const newMarkers = sampleLocations.map((location, index) => {
        console.log(`🗺️ Creating marker ${index + 1}:`, location.name);

        const marker = new window.google.maps.Marker({
          position: { lat: location.lat, lng: location.lng },
          map: mapInstance,
          title: location.name,
          animation: window.google.maps.Animation.DROP
        });

        // Add click listener to marker
        marker.addListener('click', () => {
          setSelectedLocation(location);
          showInfoWindow(marker, location);
        });

        console.log(`🗺️ Marker ${index + 1} created successfully`);
        return marker;
      });

      setMarkers(newMarkers);
      console.log('🗺️ All markers added:', newMarkers.length);

      // Initialize Street View
      if (streetViewRef.current) {
        console.log('🗺️ Initializing Street View...');
        const streetViewInstance = new window.google.maps.StreetViewPanorama(
          streetViewRef.current,
          {
            position: { lat: 53.4668, lng: -2.2339 },
            pov: { heading: 34, pitch: 10 },
            visible: false
          }
        );
        setStreetView(streetViewInstance);
        mapInstance.setStreetView(streetViewInstance);
      }

      console.log('🗺️ Maps initialized successfully!');
      console.log('🗺️ Final map state:', { map: mapInstance, markers: newMarkers.length, isLoading: false });
      setIsLoading(false);
    } catch (err) {
      console.error('🗺️ Maps initialization failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize map');
      setIsLoading(false);
    }
  }, [mapType, sampleLocations, showInfoWindow]);

  // Callback ref to ensure element is available when set
  const mapCallbackRef = useCallback((node: HTMLDivElement | null) => {
    if (node && !initAttempted) {
      mapRef.current = node;
      console.log('🗺️ InteractiveMaps: Map container attached via callback ref');
      setInitAttempted(true);
      // Small delay to ensure the element is fully rendered
      setTimeout(() => {
        initializeMap();
        getUserLocation();
      }, 100);
    }
  }, [initAttempted, initializeMap]);

  useEffect(() => {
    console.log('🗺️ InteractiveMaps useEffect triggered, initAttempted:', initAttempted);
    if (!initAttempted) {
      setInitAttempted(true);

      // Wait for DOM element to be available
      const checkAndInitialize = () => {
        if (mapRef.current) {
          console.log('🗺️ InteractiveMaps: Map container found, initializing...');
          initializeMap();
          getUserLocation();
        } else {
          console.log('🗺️ InteractiveMaps: Map container not ready, retrying...');
          setTimeout(checkAndInitialize, 500);
        }
      };

      // Start checking after a small delay
      const timer = setTimeout(checkAndInitialize, 100);

      return () => clearTimeout(timer);
    }
  }, [initAttempted, initializeMap]);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.log('Geolocation error:', error);
          // Default to Manchester if geolocation fails
          setUserLocation({ lat: 53.4808, lng: -2.2426 });
        }
      );
    } else {
      setUserLocation({ lat: 53.4808, lng: -2.2426 });
    }
  };

  const getMarkerIcon = (type: string) => {
    const iconBase = 'https://maps.google.com/mapfiles/kml/shapes/';
    switch (type) {
      case 'university':
        return {
          url: iconBase + 'schools_maps.png',
          scaledSize: new window.google.maps.Size(32, 32)
        };
      case 'accommodation':
        return {
          url: iconBase + 'homegardenbusiness_maps.png',
          scaledSize: new window.google.maps.Size(32, 32)
        };
      case 'transport':
        return {
          url: iconBase + 'bus_maps.png',
          scaledSize: new window.google.maps.Size(32, 32)
        };
      default:
        return {
          url: iconBase + 'placemark_circle.png',
          scaledSize: new window.google.maps.Size(32, 32)
        };
    }
  };

  // Make function globally available for info window buttons
  useEffect(() => {
    (window as { showStreetViewForLocation?: (lat: number, lng: number) => void }).showStreetViewForLocation = (lat: number, lng: number) => {
      if (streetView) {
        streetView.setPosition({ lat, lng });
        streetView.setVisible(true);
        setShowStreetView(true);
      }
    };
  }, [streetView]);

  const changeMapType = (newType: 'roadmap' | 'satellite' | 'hybrid' | 'terrain') => {
    setMapType(newType);
    if (map) {
      map.setMapTypeId(newType);
    }
  };

  const toggleStreetView = () => {
    if (streetView && selectedLocation) {
      streetView.setPosition({ lat: selectedLocation.lat, lng: selectedLocation.lng });
      streetView.setVisible(!showStreetView);
      setShowStreetView(!showStreetView);
    }
  };

  const centerOnUserLocation = () => {
    if (map && userLocation) {
      map.setCenter(userLocation);
      map.setZoom(15);
      
      // Add user location marker
      new window.google.maps.Marker({
        position: userLocation,
        map: map,
        title: 'Your Location',
        icon: {
          url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
          scaledSize: new window.google.maps.Size(32, 32)
        }
      });
    }
  };

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="w-6 h-6 text-red-600" />
              <span>Interactive Maps - Configuration Required</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Error:</strong> {error}
              </AlertDescription>
            </Alert>

            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Debug Information:</h3>
              <div className="text-sm space-y-1">
                <p><strong>API Key Available:</strong> {mapsService.isAPIAvailable() ? 'Yes' : 'No'}</p>
                <p><strong>Environment:</strong> {import.meta.env.MODE}</p>
                <p><strong>VITE_GOOGLE_MAPS_API_KEY:</strong> {import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? 'Set' : 'Not set'}</p>
              </div>
            </div>

            <div className="mb-4">
              <Button
                onClick={() => {
                  setError(null);
                  initializeMap();
                }}
                className="mr-2"
              >
                🔄 Retry Initialization
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  console.log('🗺️ Manual debug info:');
                  console.log('API Key available:', mapsService.isAPIAvailable());
                  console.log('Environment:', import.meta.env.MODE);
                  console.log('VITE_GOOGLE_MAPS_API_KEY:', import.meta.env.VITE_GOOGLE_MAPS_API_KEY);
                }}
              >
                🔍 Debug Console
              </Button>
            </div>

            <div className="p-6 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Setup Instructions:</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Go to <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google Cloud Console</a></li>
                <li>Enable Maps JavaScript API, Places API, and Geocoding API</li>
                <li>Create an API key and add it to your environment variables</li>
                <li>Restart the application</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MapPin className="w-6 h-6 text-blue-600" />
              <span>Interactive Campus & Accommodation Maps</span>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={centerOnUserLocation}>
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
                <p className="text-gray-600">Loading interactive maps...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Map Controls */}
              <div className="flex flex-wrap gap-2 mb-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">View:</span>
                  <Button
                    variant={mapType === 'roadmap' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => changeMapType('roadmap')}
                  >
                    <MapIcon className="w-4 h-4 mr-1" />
                    Map
                  </Button>
                  <Button
                    variant={mapType === 'satellite' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => changeMapType('satellite')}
                  >
                    <Satellite className="w-4 h-4 mr-1" />
                    Satellite
                  </Button>
                  <Button
                    variant={mapType === 'hybrid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => changeMapType('hybrid')}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Hybrid
                  </Button>
                </div>
                {selectedLocation && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleStreetView}
                  >
                    <Camera className="w-4 h-4 mr-1" />
                    Street View
                  </Button>
                )}
              </div>

              {/* Main Map */}
              <div className="relative">
                <div
                  ref={mapCallbackRef}
                  className="w-full h-96 rounded-lg border bg-blue-100 interactive-maps-container"
                />
                
                {/* Street View Overlay */}
                {showStreetView && (
                  <div className="absolute top-2 right-2 w-64 h-48 bg-white rounded-lg shadow-lg border overflow-hidden">
                    <div className="flex items-center justify-between p-2 bg-gray-50 border-b">
                      <span className="text-sm font-medium">Street View</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowStreetView(false)}
                      >
                        ×
                      </Button>
                    </div>
                    <div ref={streetViewRef} className="w-full h-full" />
                  </div>
                )}
              </div>

              {/* Location Info */}
              {selectedLocation && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-2">{selectedLocation.name}</h3>
                        <p className="text-gray-600 mb-2">{selectedLocation.description}</p>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary">
                            {selectedLocation.type === 'university' ? <School className="w-3 h-3 mr-1" /> : <Home className="w-3 h-3 mr-1" />}
                            {selectedLocation.type}
                          </Badge>
                          {selectedLocation.price && (
                            <Badge variant="outline" className="text-green-600">
                              {selectedLocation.price}
                            </Badge>
                          )}
                          {selectedLocation.rating && (
                            <Badge variant="outline" className="text-yellow-600">
                              <Star className="w-3 h-3 mr-1" />
                              {selectedLocation.rating}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col space-y-2 ml-4">
                        <Button size="sm" onClick={toggleStreetView}>
                          <Camera className="w-4 h-4 mr-1" />
                          Street View
                        </Button>
                        <Button size="sm" variant="outline">
                          <Route className="w-4 h-4 mr-1" />
                          Directions
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Legend */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="p-3 bg-white rounded border">
                  <h4 className="font-medium mb-2 flex items-center">
                    <School className="w-4 h-4 mr-2 text-blue-600" />
                    Universities
                  </h4>
                  <p className="text-gray-600">Major UK universities and campuses</p>
                </div>
                <div className="p-3 bg-white rounded border">
                  <h4 className="font-medium mb-2 flex items-center">
                    <Home className="w-4 h-4 mr-2 text-green-600" />
                    Student Housing
                  </h4>
                  <p className="text-gray-600">Verified student accommodation options</p>
                </div>
                <div className="p-3 bg-white rounded border">
                  <h4 className="font-medium mb-2 flex items-center">
                    <Camera className="w-4 h-4 mr-2 text-purple-600" />
                    Street View
                  </h4>
                  <p className="text-gray-600">360° street-level imagery</p>
                </div>
              </div>

              {/* Features Info */}
              <Alert>
                <MapPin className="h-4 w-4" />
                <AlertDescription>
                  <strong>Interactive Features:</strong> Click markers for details, use map controls for different views (Map, Satellite, Hybrid),
                  and click "Street View" to explore locations at street level. Use "My Location" to center the map on your current position.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InteractiveMaps;

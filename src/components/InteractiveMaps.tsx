
import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Store, Utensils, Dumbbell, ShoppingBag, University, Route, Settings, Key, AlertCircle, GraduationCap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Lazy import services to prevent server errors
let mapsService: any = null;
let locationService: any = null;

// Initialize services asynchronously
const initializeServices = async () => {
  try {
    if (!mapsService) {
      const { mapsService: ms } = await import('@/services/mapsService');
      mapsService = ms;
    }
    if (!locationService) {
      const { locationService: ls } = await import('@/services/locationService');
      locationService = ls;
    }
  } catch (error) {
    console.error('Failed to load map services:', error);
  }
};

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

const InteractiveMaps = () => {
  const [selectedUniversity, setSelectedUniversity] = useState('');
  const [selectedAccommodation, setSelectedAccommodation] = useState('');
  const [mapMode, setMapMode] = useState('university'); // 'university' or 'accommodation'
  const [isStreetView, setIsStreetView] = useState(false);
  const [routeVisible, setRouteVisible] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [routeInfo, setRouteInfo] = useState<any>(null);
  const [locationData, setLocationData] = useState<any>(null);
  const [showLocationInsights, setShowLocationInsights] = useState(false);
  const [isLoadingLocationData, setIsLoadingLocationData] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const streetViewRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const streetViewInstance = useRef<any>(null);
  const directionsRenderer = useRef<any>(null);
  const markers = useRef<any[]>([]);

  // Comprehensive list of UK universities with coordinates
  const ukUniversities = [
    { name: "University of Oxford", lat: 51.7548, lng: -1.2544, city: "Oxford" },
    { name: "University of Cambridge", lat: 52.2043, lng: 0.1218, city: "Cambridge" },
    { name: "Imperial College London", lat: 51.4988, lng: -0.1749, city: "London" },
    { name: "London School of Economics", lat: 51.5146, lng: -0.1162, city: "London" },
    { name: "University College London", lat: 51.5246, lng: -0.1340, city: "London" },
    { name: "King's College London", lat: 51.5118, lng: -0.1160, city: "London" },
    { name: "University of Edinburgh", lat: 55.9445, lng: -3.1892, city: "Edinburgh" },
    { name: "University of Manchester", lat: 53.4668, lng: -2.2339, city: "Manchester" },
    { name: "University of Bristol", lat: 51.4585, lng: -2.6021, city: "Bristol" },
    { name: "University of Warwick", lat: 52.3793, lng: -1.5615, city: "Coventry" },
    { name: "University of Glasgow", lat: 55.8719, lng: -4.2883, city: "Glasgow" },
    { name: "Durham University", lat: 54.7686, lng: -1.5740, city: "Durham" },
    { name: "University of St Andrews", lat: 56.3398, lng: -2.7967, city: "St Andrews" },
    { name: "University of Bath", lat: 51.3811, lng: -2.3286, city: "Bath" },
    { name: "University of York", lat: 53.9480, lng: -1.0535, city: "York" },
    { name: "University of Exeter", lat: 50.7356, lng: -3.5309, city: "Exeter" },
    { name: "University of Birmingham", lat: 52.4508, lng: -1.9305, city: "Birmingham" },
    { name: "University of Leeds", lat: 53.8067, lng: -1.5550, city: "Leeds" },
    { name: "University of Sheffield", lat: 53.3811, lng: -1.4701, city: "Sheffield" },
    { name: "University of Nottingham", lat: 52.9399, lng: -1.1956, city: "Nottingham" },
    { name: "University of Southampton", lat: 50.9097, lng: -1.4044, city: "Southampton" },
    { name: "University of Liverpool", lat: 53.4064, lng: -2.9666, city: "Liverpool" },
    { name: "Newcastle University", lat: 54.9799, lng: -1.6147, city: "Newcastle" },
    { name: "Cardiff University", lat: 51.4816, lng: -3.1791, city: "Cardiff" },
    { name: "Queen Mary University of London", lat: 51.5245, lng: -0.0402, city: "London" },
    { name: "Lancaster University", lat: 54.0104, lng: -2.7877, city: "Lancaster" },
    { name: "University of Leicester", lat: 52.6211, lng: -1.1239, city: "Leicester" },
    { name: "University of Surrey", lat: 51.2430, lng: -0.5891, city: "Guildford" },
    { name: "Loughborough University", lat: 52.7683, lng: -1.2256, city: "Loughborough" },
    { name: "University of East Anglia", lat: 52.6221, lng: 1.2407, city: "Norwich" }
  ];

  // Mock accommodation data with coordinates
  const accommodations = [
    {
      id: 1,
      name: "City Centre Student Studios",
      lat: 53.4668,
      lng: -2.2300,
      university: "University of Manchester",
      price: 180,
      amenities: ["Wi-Fi", "Laundry", "24/7 Security"]
    },
    {
      id: 2,
      name: "Campus View Apartments",
      lat: 51.7580,
      lng: -1.2600,
      university: "University of Oxford",
      price: 220,
      amenities: ["Wi-Fi", "Gym", "Study Rooms"]
    },
    {
      id: 3,
      name: "Edinburgh Student Lodge",
      lat: 55.9500,
      lng: -3.1800,
      university: "University of Edinburgh",
      price: 160,
      amenities: ["Wi-Fi", "Kitchen", "Common Room"]
    }
  ];

  // Nearby amenities types
  const amenityTypes = [
    { type: 'supermarket', name: 'Supermarkets', icon: Store, color: 'bg-green-500' },
    { type: 'restaurant', name: 'Restaurants', icon: Utensils, color: 'bg-red-500' },
    { type: 'gym', name: 'Gyms', icon: Dumbbell, color: 'bg-blue-500' },
    { type: 'shopping_mall', name: 'Shopping', icon: ShoppingBag, color: 'bg-purple-500' }
  ];

  useEffect(() => {
    const init = async () => {
      await initializeServices();
      await initializeMap();
    };
    init();
  }, []);

  const initializeMap = async () => {
    if (!mapRef.current) return;

    setIsLoading(true);
    setError(null);

    try {
      if (!mapsService) {
        setError('Maps service not available. Please refresh the page.');
        setIsLoading(false);
        return;
      }

      if (!mapsService.isAPIAvailable()) {
        setError('Google Maps API key not configured. Please add your API key in settings.');
        setIsLoading(false);
        return;
      }

      await mapsService.loadGoogleMaps();

      // Initialize map
      mapInstance.current = mapsService.createMap(mapRef.current, {
        center: { lat: 54.7023, lng: -3.2765 }, // UK center
        zoom: 6
      });

      // Initialize directions renderer
      directionsRenderer.current = mapsService.createDirectionsRenderer(mapInstance.current);

      // Initialize Street View
      if (streetViewRef.current && window.google) {
        streetViewInstance.current = new window.google.maps.StreetViewPanorama(
          streetViewRef.current,
          {
            position: { lat: 51.7548, lng: -1.2544 },
            pov: { heading: 165, pitch: 0 },
            zoom: 1,
            visible: false
          }
        );
        mapInstance.current.setStreetView(streetViewInstance.current);
      }

      setIsLoading(false);
    } catch (err) {
      setError(`Failed to load Google Maps: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setIsLoading(false);
    }
  };

  const handleUniversitySelect = async (universityName: string) => {
    setSelectedUniversity(universityName);
    const university = ukUniversities.find(u => u.name === universityName);

    if (university && mapInstance.current) {
      // Clear existing markers
      clearMarkers();

      const location = {
        lat: university.lat,
        lng: university.lng,
        name: university.name,
        type: 'university' as const
      };

      mapInstance.current.setCenter({ lat: university.lat, lng: university.lng });
      mapInstance.current.setZoom(16);

      // Add university marker
      const marker = mapsService.createMarker(mapInstance.current, location, {
        icon: {
          url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiMzQjgyRjYiLz4KPHN2ZyB4PSI4IiB5PSI4IiB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIj4KPHA+PHBhdGggZD0iTTQgMTBoMTZsLTggOEw0IDEweiIvPjwvcD4KPC9zdmc+Cjwvc3ZnPg==',
          scaledSize: new window.google.maps.Size(32, 32)
        }
      });

      if (marker) {
        markers.current.push(marker);

        // Add info window
        const infoWindow = mapsService.createInfoWindow(`
          <div class="p-2">
            <h3 class="font-bold">${university.name}</h3>
            <p class="text-sm text-gray-600">${university.city}</p>
          </div>
        `);

        marker.addListener('click', () => {
          infoWindow.open(mapInstance.current, marker);
        });
      }

      // Search for nearby amenities
      await searchNearbyAmenities({ lat: university.lat, lng: university.lng });
    }
  };

  const handleAccommodationSelect = async (accommodationId: string) => {
    setSelectedAccommodation(accommodationId);
    const accommodation = accommodations.find(a => a.id === parseInt(accommodationId));

    if (accommodation && mapInstance.current) {
      // Clear existing markers and routes
      clearMarkers();
      clearRoute();

      const location = {
        lat: accommodation.lat,
        lng: accommodation.lng,
        name: accommodation.name,
        type: 'accommodation' as const,
        details: accommodation
      };

      mapInstance.current.setCenter({ lat: accommodation.lat, lng: accommodation.lng });
      mapInstance.current.setZoom(15);

      // Add accommodation marker
      const marker = mapsService.createMarker(mapInstance.current, location, {
        icon: {
          url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiNFRjQ0NDQiLz4KPHN2ZyB4PSI4IiB5PSI4IiB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIj4KPHA+PHBhdGggZD0iTTMgOWw5LTcgOS03djExbC05IDdMMyAyMFY5eiIvPjwvcD4KPC9zdmc+Cjwvc3ZnPg==',
          scaledSize: new window.google.maps.Size(32, 32)
        }
      });

      if (marker) {
        markers.current.push(marker);

        // Add info window
        const infoWindow = mapsService.createInfoWindow(`
          <div class="p-3">
            <h3 class="font-bold">${accommodation.name}</h3>
            <p class="text-sm text-gray-600">£${accommodation.price}/week</p>
            <p class="text-xs text-gray-500 mt-1">${accommodation.amenities.join(', ')}</p>
          </div>
        `);

        marker.addListener('click', () => {
          infoWindow.open(mapInstance.current, marker);
        });
      }

      // Search for nearby amenities
      await searchNearbyAmenities({ lat: accommodation.lat, lng: accommodation.lng });

      // Load location insights
      await loadLocationInsights({ lat: accommodation.lat, lng: accommodation.lng }, accommodation.location);

      // Show route to university if accommodation is selected
      const university = ukUniversities.find(u => u.name === accommodation.university);
      if (university) {
        await showRouteToUniversity(
          { lat: accommodation.lat, lng: accommodation.lng },
          { lat: university.lat, lng: university.lng }
        );
      }
    }
  };

  const searchNearbyAmenities = async (center: { lat: number; lng: number }) => {
    if (!mapInstance.current) return;

    for (const amenity of amenityTypes) {
      try {
        const results = await mapsService.searchNearbyPlaces(
          mapInstance.current,
          center,
          amenity.type,
          1000
        );

        results.slice(0, 5).forEach(place => {
          const location = {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
            name: place.name,
            type: 'amenity' as const,
            details: { amenityType: amenity.name }
          };

          const marker = mapsService.createMarker(mapInstance.current, location, {
            icon: {
              url: `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTIiIGZpbGw9IiM2MzY2RjEiLz4KPC9zdmc+`,
              scaledSize: new window.google.maps.Size(20, 20)
            }
          });

          if (marker) {
            markers.current.push(marker);

            const infoWindow = mapsService.createInfoWindow(`
              <div class="p-2">
                <strong>${place.name}</strong><br/>
                <span class="text-sm text-gray-600">${amenity.name}</span>
              </div>
            `);

            marker.addListener('click', () => {
              infoWindow.open(mapInstance.current, marker);
            });
          }
        });
      } catch (error) {
        console.warn(`Failed to search for ${amenity.name}:`, error);
      }
    }
  };

  const showRouteToUniversity = async (start: { lat: number; lng: number }, end: { lat: number; lng: number }) => {
    if (!directionsRenderer.current) return;

    try {
      const routeInfo = await mapsService.calculateRoute(start, end, 'WALKING');

      if (routeInfo) {
        // Show route on map using directions service
        const directionsService = new window.google.maps.DirectionsService();
        const request = {
          origin: start,
          destination: end,
          travelMode: window.google.maps.TravelMode.WALKING
        };

        directionsService.route(request, (result: any, status: any) => {
          if (status === 'OK') {
            directionsRenderer.current.setDirections(result);
            setRouteVisible(true);
            setRouteInfo(routeInfo);
          }
        });
      }
    } catch (error) {
      console.warn('Failed to calculate route:', error);
    }
  };

  const toggleStreetView = () => {
    if (!streetViewInstance.current) return;

    setIsStreetView(!isStreetView);
    streetViewInstance.current.setVisible(!isStreetView);
  };

  const clearRoute = () => {
    if (directionsRenderer.current) {
      directionsRenderer.current.setDirections({ routes: [] });
      setRouteVisible(false);
      setRouteInfo(null);
    }
  };

  const clearMarkers = () => {
    markers.current.forEach(marker => {
      marker.setMap(null);
    });
    markers.current = [];
  };

  const handleSaveApiKey = () => {
    if (apiKey.trim() && mapsService) {
      mapsService.setApiKey(apiKey.trim());
      setShowSettings(false);
      setApiKey('');

      // Reinitialize map with new API key
      initializeMap();
    }
  };

  const loadLocationInsights = async (coordinates: { lat: number; lng: number }, location: string) => {
    setIsLoadingLocationData(true);
    try {
      const [transitInfo, safetyData, costData, areaInsights] = await Promise.all([
        locationService.getTransitInfo(coordinates),
        locationService.getSafetyData(coordinates),
        locationService.getCostOfLivingData(location),
        locationService.getAreaInsights(coordinates, location)
      ]);

      setLocationData({
        transit: transitInfo,
        safety: safetyData,
        cost: costData,
        insights: areaInsights,
        coordinates,
        location
      });
    } catch (error) {
      console.error('Failed to load location insights:', error);
    } finally {
      setIsLoadingLocationData(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MapPin className="w-6 h-6 text-blue-600" />
              <span>Interactive Campus & Accommodation Maps</span>
              <Badge
                variant={mapsService?.isAPIAvailable() ? "default" : "outline"}
                className="ml-2"
              >
                {mapsService?.isAPIAvailable() ? "Maps Enabled" : "Setup Required"}
              </Badge>
            </div>
            <Dialog open={showSettings} onOpenChange={setShowSettings}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Settings className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center space-x-2">
                    <Key className="w-5 h-5" />
                    <span>Google Maps Settings</span>
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-3">
                      {mapsService?.getAPISetupInstructions() || 'Loading maps service...'}
                    </p>
                    <Input
                      type="password"
                      placeholder="Enter your Google Maps API key"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="mb-3"
                    />
                    <Button onClick={handleSaveApiKey} disabled={!apiKey.trim()}>
                      Save API Key
                    </Button>
                  </div>
                  <div className="text-xs text-gray-500">
                    <p>Current status: {mapsService?.isAPIAvailable() ? "Google Maps enabled" : "API key required"}</p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Error Alert */}
          {error && (
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Loading Google Maps...</p>
              </div>
            </div>
          )}

          {/* Controls */}
          {!error && !isLoading && (
            <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex space-x-2">
              <Button
                variant={mapMode === 'university' ? 'default' : 'outline'}
                onClick={() => setMapMode('university')}
                className="flex items-center space-x-1"
              >
                <University className="w-4 h-4" />
                <span>Universities</span>
              </Button>
              <Button
                variant={mapMode === 'accommodation' ? 'default' : 'outline'}
                onClick={() => setMapMode('accommodation')}
                className="flex items-center space-x-1"
              >
                <MapPin className="w-4 h-4" />
                <span>Accommodations</span>
              </Button>
            </div>
            
            <Button
              variant={isStreetView ? 'default' : 'outline'}
              onClick={toggleStreetView}
              className="flex items-center space-x-1"
            >
              <Navigation className="w-4 h-4" />
              <span>Street View</span>
            </Button>
            
            {routeVisible && (
              <Button
                variant="outline"
                onClick={clearRoute}
                className="flex items-center space-x-1"
              >
                <Route className="w-4 h-4" />
                <span>Clear Route</span>
              </Button>
            )}
          </div>
          )}

          {/* University Selection */}
          {!error && !isLoading && (
          {mapMode === 'university' && (
            <div className="mb-4">
              <Select value={selectedUniversity} onValueChange={handleUniversitySelect}>
                <SelectTrigger className="w-full max-w-md">
                  <SelectValue placeholder="Select a UK University" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {ukUniversities.map((university) => (
                    <SelectItem key={university.name} value={university.name}>
                      {university.name} - {university.city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Accommodation Selection */}
          {mapMode === 'accommodation' && (
            <div className="mb-4 space-y-4">
              <Select value={selectedAccommodation} onValueChange={handleAccommodationSelect}>
                <SelectTrigger className="w-full max-w-md">
                  <SelectValue placeholder="Select Student Accommodation" />
                </SelectTrigger>
                <SelectContent>
                  {accommodations.map((accommodation) => (
                    <SelectItem key={accommodation.id} value={accommodation.id.toString()}>
                      {accommodation.name} - £{accommodation.price}/week
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Amenity Legend */}
              <div className="flex flex-wrap gap-2">
                <span className="text-sm font-medium">Nearby Amenities:</span>
                {amenityTypes.map((amenity) => {
                  const Icon = amenity.icon;
                  return (
                    <Badge key={amenity.type} variant="secondary" className="flex items-center space-x-1">
                      <Icon className="w-3 h-3" />
                      <span>{amenity.name}</span>
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          {/* Map Container */}
          <div className="relative">
            <div 
              ref={mapRef} 
              className="w-full h-96 rounded-lg border"
              style={{ display: isStreetView ? 'none' : 'block' }}
            />
            <div 
              ref={streetViewRef} 
              className="w-full h-96 rounded-lg border"
              style={{ display: isStreetView ? 'block' : 'none' }}
            />
            
            {/* Map Instructions */}
            <div className="absolute top-2 left-2 bg-white p-2 rounded shadow-lg text-xs max-w-xs">
              <p className="font-semibold mb-1">How to use:</p>
              <ul className="space-y-1 text-gray-600">
                <li>• Select a university or accommodation from the dropdown</li>
                <li>• Click markers for more information</li>
                <li>• Use Street View to explore areas virtually</li>
                <li>• Walking routes show your daily commute</li>
              </ul>
            </div>
          </div>

          {/* Route Information */}
          {routeInfo && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">Route Information</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Distance:</span> {routeInfo.distance}
                </div>
                <div>
                  <span className="font-medium">Walking Time:</span> {routeInfo.duration}
                </div>
              </div>
              <p className="text-sm text-blue-700 mt-2">
                The blue line shows your walking route from accommodation to university.
                Click and drag waypoints to customize your preferred path.
              </p>
            </div>
          )}

          {/* Location Insights Toggle */}
          {locationData && (
            <div className="mt-4">
              <Button
                variant="outline"
                onClick={() => setShowLocationInsights(!showLocationInsights)}
                className="w-full"
              >
                <MapPin className="w-4 h-4 mr-2" />
                {showLocationInsights ? 'Hide' : 'Show'} Area Insights
              </Button>
            </div>
          )}

          {/* Location Insights Panel */}
          {showLocationInsights && locationData && (
            <div className="mt-4 space-y-4">
              {/* Safety Information */}
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-3 flex items-center">
                  <span className="mr-2">🛡️</span>
                  Safety Score: {locationData.safety.overallScore}/10
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="font-medium">Crime Rate:</span> {locationData.safety.crimeRate}/1000
                  </div>
                  <div>
                    <span className="font-medium">Police Station:</span> {Math.round(locationData.safety.nearbyPoliceStations[0]?.distance || 0)}m
                  </div>
                </div>
                <div className="mt-2">
                  <p className="text-xs text-green-700">
                    {locationData.safety.safetyTips[0]}
                  </p>
                </div>
              </div>

              {/* Transit Information */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-3 flex items-center">
                  <span className="mr-2">🚌</span>
                  Public Transport
                </h4>
                <div className="space-y-2">
                  {locationData.transit.nearbyStops.slice(0, 2).map((stop: any, index: number) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{stop.name}</span>
                      <span className="text-blue-600">{stop.distance}m</span>
                    </div>
                  ))}
                </div>
                {locationData.transit.accessibility.wheelchairAccessible && (
                  <p className="text-xs text-blue-700 mt-2">♿ Wheelchair accessible</p>
                )}
              </div>

              {/* Cost of Living */}
              <div className="p-4 bg-yellow-50 rounded-lg">
                <h4 className="font-semibold text-yellow-800 mb-3 flex items-center">
                  <span className="mr-2">💰</span>
                  Cost of Living (Index: {locationData.cost.overallIndex})
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="font-medium">Groceries:</span> £{locationData.cost.averageCosts.groceriesWeekly}/week
                  </div>
                  <div>
                    <span className="font-medium">Meal Out:</span> £{locationData.cost.averageCosts.mealOut}
                  </div>
                  <div>
                    <span className="font-medium">Bus Ticket:</span> £{locationData.cost.averageCosts.busTicket}
                  </div>
                  <div>
                    <span className="font-medium">Gym:</span> £{locationData.cost.averageCosts.gymMembership}/month
                  </div>
                </div>
                {locationData.cost.studentDiscounts.available && (
                  <p className="text-xs text-yellow-700 mt-2">
                    🎓 {locationData.cost.studentDiscounts.percentage}% student discounts available
                  </p>
                )}
              </div>

              {/* Area Insights */}
              <div className="p-4 bg-purple-50 rounded-lg">
                <h4 className="font-semibold text-purple-800 mb-3 flex items-center">
                  <span className="mr-2">📊</span>
                  Area Insights
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="font-medium">Student Population:</span> {locationData.insights.demographics.studentPopulation}%
                  </div>
                  <div>
                    <span className="font-medium">Walk Score:</span> {locationData.insights.transport.walkScore}/100
                  </div>
                  <div>
                    <span className="font-medium">Nightlife:</span> {locationData.insights.lifestyle.nightlife}/100
                  </div>
                  <div>
                    <span className="font-medium">Green Space:</span> {locationData.insights.lifestyle.greenSpace}/100
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoadingLocationData && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Loading area insights...</p>
            </div>
          )}

          {/* Route Planning Integration */}
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-3 flex items-center">
              <Navigation className="w-5 h-5 mr-2" />
              Comprehensive Route Planning
            </h4>
            <p className="text-sm text-gray-700 mb-3">
              Plan routes to university, supermarkets, gyms, home, and more with our dedicated Route Planner.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Navigate to route planner
                  window.dispatchEvent(new CustomEvent('navigate-to-tab', { detail: 'routes' }));
                }}
                className="flex items-center space-x-1 text-blue-700 border-blue-300 hover:bg-blue-100"
              >
                <Navigation className="w-3 h-3" />
                <span>Route Planner</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (searchLocation) {
                    mapsService.openGoogleMapsDirections(
                      searchLocation,
                      'university near ' + searchLocation,
                      'walking'
                    );
                  }
                }}
                className="flex items-center space-x-1 text-green-700 border-green-300 hover:bg-green-100"
              >
                <GraduationCap className="w-3 h-3" />
                <span>To University</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InteractiveMaps;

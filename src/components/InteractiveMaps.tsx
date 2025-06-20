
import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Store, Utensils, Dumbbell, ShoppingBag, University, Route } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

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
  const mapRef = useRef<HTMLDivElement>(null);
  const streetViewRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const streetViewInstance = useRef<any>(null);
  const directionsService = useRef<any>(null);
  const directionsRenderer = useRef<any>(null);

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
    // Load Google Maps API
    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=YOUR_GOOGLE_MAPS_API_KEY&libraries=places&callback=initMap`;
      script.async = true;
      script.defer = true;
      
      window.initMap = initializeMap;
      document.head.appendChild(script);
    } else {
      initializeMap();
    }
  }, []);

  const initializeMap = () => {
    if (!mapRef.current || !window.google) return;

    // Initialize map
    mapInstance.current = new window.google.maps.Map(mapRef.current, {
      center: { lat: 54.7023, lng: -3.2765 }, // UK center
      zoom: 6,
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true
    });

    // Initialize directions service
    directionsService.current = new window.google.maps.DirectionsService();
    directionsRenderer.current = new window.google.maps.DirectionsRenderer({
      draggable: true,
      panel: null
    });
    directionsRenderer.current.setMap(mapInstance.current);

    // Initialize Street View
    if (streetViewRef.current) {
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
  };

  const handleUniversitySelect = (universityName: string) => {
    setSelectedUniversity(universityName);
    const university = ukUniversities.find(u => u.name === universityName);
    
    if (university && mapInstance.current) {
      const position = { lat: university.lat, lng: university.lng };
      
      mapInstance.current.setCenter(position);
      mapInstance.current.setZoom(16);
      
      // Add university marker
      new window.google.maps.Marker({
        position,
        map: mapInstance.current,
        title: university.name,
        icon: {
          url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiMzQjgyRjYiLz4KPHN2ZyB4PSI4IiB5PSI4IiB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIj4KPHA+PHBhdGggZD0iTTQgMTBoMTZsLTggOEw0IDEweiIvPjwvcD4KPC9zdmc+Cjwvc3ZnPg==',
          scaledSize: new window.google.maps.Size(32, 32)
        }
      });
    }
  };

  const handleAccommodationSelect = (accommodationId: string) => {
    setSelectedAccommodation(accommodationId);
    const accommodation = accommodations.find(a => a.id === parseInt(accommodationId));
    
    if (accommodation && mapInstance.current) {
      const position = { lat: accommodation.lat, lng: accommodation.lng };
      
      mapInstance.current.setCenter(position);
      mapInstance.current.setZoom(15);
      
      // Add accommodation marker
      new window.google.maps.Marker({
        position,
        map: mapInstance.current,
        title: accommodation.name,
        icon: {
          url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiNFRjQ0NDQiLz4KPHN2ZyB4PSI4IiB5PSI4IiB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIj4KPHA+PHBhdGggZD0iTTMgOWw5LTcgOS03djExbC05IDdMMyAyMFY5eiIvPjwvcD4KPC9zdmc+Cjwvc3ZnPg==',
          scaledSize: new window.google.maps.Size(32, 32)
        }
      });
      
      // Search for nearby amenities
      searchNearbyAmenities(position);
      
      // Show route to university if accommodation is selected
      const university = ukUniversities.find(u => u.name === accommodation.university);
      if (university) {
        showRouteToUniversity(position, { lat: university.lat, lng: university.lng });
      }
    }
  };

  const searchNearbyAmenities = (center: { lat: number; lng: number }) => {
    if (!window.google || !mapInstance.current) return;
    
    const service = new window.google.maps.places.PlacesService(mapInstance.current);
    
    amenityTypes.forEach(amenity => {
      const request = {
        location: center,
        radius: 1000,
        type: amenity.type
      };
      
      service.nearbySearch(request, (results: any[], status: any) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
          results.slice(0, 5).forEach(place => {
            const marker = new window.google.maps.Marker({
              position: place.geometry.location,
              map: mapInstance.current,
              title: place.name,
              icon: {
                url: `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTIiIGZpbGw9IiM2MzY2RjEiLz4KPC9zdmc+`,
                scaledSize: new window.google.maps.Size(20, 20)
              }
            });
            
            const infoWindow = new window.google.maps.InfoWindow({
              content: `<div><strong>${place.name}</strong><br/>${amenity.name}</div>`
            });
            
            marker.addListener('click', () => {
              infoWindow.open(mapInstance.current, marker);
            });
          });
        }
      });
    });
  };

  const showRouteToUniversity = (start: { lat: number; lng: number }, end: { lat: number; lng: number }) => {
    if (!directionsService.current || !directionsRenderer.current) return;
    
    const request = {
      origin: start,
      destination: end,
      travelMode: window.google.maps.TravelMode.WALKING
    };
    
    directionsService.current.route(request, (result: any, status: any) => {
      if (status === 'OK') {
        directionsRenderer.current.setDirections(result);
        setRouteVisible(true);
      }
    });
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
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="w-6 h-6 text-blue-600" />
            <span>Interactive Campus & Accommodation Maps</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Controls */}
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

          {/* University Selection */}
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

          {/* Additional Information */}
          {selectedAccommodation && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">Route Information</h4>
              <p className="text-sm text-blue-700">
                The blue line shows your walking route from accommodation to university. 
                Click and drag waypoints to customize your preferred path.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InteractiveMaps;

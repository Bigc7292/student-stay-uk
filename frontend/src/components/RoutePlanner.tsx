import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Clock, Car, Bike, Footprints, Bus, Home, GraduationCap, ShoppingCart, Dumbbell, Coffee, Hospital, Briefcase, Users, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { mapsService } from '@/services/mapsService';

interface RouteDestination {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  category: string;
  description: string;
  searchTerms: string[];
}

interface RouteResult {
  destination: RouteDestination;
  distance: string;
  duration: string;
  mode: string;
  steps?: any[];
}

const RoutePlanner: React.FC = () => {
  const [userLocation, setUserLocation] = useState<string>('');
  const [selectedDestinations, setSelectedDestinations] = useState<string[]>([]);
  const [travelMode, setTravelMode] = useState<'walking' | 'driving' | 'bicycling' | 'transit'>('walking');
  const [routeResults, setRouteResults] = useState<RouteResult[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [mapVisible, setMapVisible] = useState(false);

  const destinations: RouteDestination[] = [
    {
      id: 'university',
      name: 'University/College',
      icon: GraduationCap,
      category: 'Education',
      description: 'Your main campus or university',
      searchTerms: ['university', 'college', 'campus', 'school']
    },
    {
      id: 'home',
      name: 'Home/Family',
      icon: Home,
      category: 'Personal',
      description: 'Family home or hometown',
      searchTerms: ['home', 'family home', 'parents house']
    },
    {
      id: 'supermarket',
      name: 'Supermarket',
      icon: ShoppingCart,
      category: 'Shopping',
      description: 'Grocery stores and supermarkets',
      searchTerms: ['supermarket', 'grocery store', 'Tesco', 'Sainsburys', 'ASDA', 'Morrisons']
    },
    {
      id: 'gym',
      name: 'Gym/Fitness Center',
      icon: Dumbbell,
      category: 'Health & Fitness',
      description: 'Gyms, fitness centers, and sports facilities',
      searchTerms: ['gym', 'fitness center', 'sports center', 'PureGym', 'The Gym']
    },
    {
      id: 'hospital',
      name: 'Hospital/Medical Center',
      icon: Hospital,
      category: 'Healthcare',
      description: 'Hospitals, clinics, and medical facilities',
      searchTerms: ['hospital', 'medical center', 'clinic', 'GP surgery', 'NHS']
    },
    {
      id: 'work',
      name: 'Work/Part-time Job',
      icon: Briefcase,
      category: 'Work',
      description: 'Workplace or part-time job location',
      searchTerms: ['work', 'job', 'office', 'workplace']
    },
    {
      id: 'cafe',
      name: 'Cafes/Study Spots',
      icon: Coffee,
      category: 'Social',
      description: 'Cafes, coffee shops, and study locations',
      searchTerms: ['cafe', 'coffee shop', 'Starbucks', 'Costa', 'study space']
    },
    {
      id: 'friends',
      name: 'Friends/Social Areas',
      icon: Users,
      category: 'Social',
      description: 'Friends\' places and social gathering spots',
      searchTerms: ['friends', 'social area', 'meeting point', 'hangout spot']
    },
    {
      id: 'entertainment',
      name: 'Entertainment/Nightlife',
      icon: Star,
      category: 'Entertainment',
      description: 'Cinemas, pubs, clubs, and entertainment venues',
      searchTerms: ['cinema', 'pub', 'club', 'restaurant', 'entertainment', 'nightlife']
    }
  ];

  const travelModes = [
    { id: 'walking', name: 'Walking', icon: Footprints, description: 'Walking directions' },
    { id: 'driving', name: 'Driving', icon: Car, description: 'Driving directions' },
    { id: 'bicycling', name: 'Cycling', icon: Bike, description: 'Cycling directions' },
    { id: 'transit', name: 'Public Transport', icon: Bus, description: 'Public transport directions' }
  ];

  const handleDestinationToggle = (destinationId: string) => {
    setSelectedDestinations(prev => 
      prev.includes(destinationId)
        ? prev.filter(id => id !== destinationId)
        : [...prev, destinationId]
    );
  };

  const calculateRoutes = async () => {
    if (!userLocation.trim() || selectedDestinations.length === 0) {
      alert('Please enter your location and select at least one destination');
      return;
    }

    setIsCalculating(true);
    setRouteResults([]);

    try {
      // First, geocode the user's location
      const userCoords = await mapsService.geocodeAddress(userLocation);
      if (!userCoords) {
        alert('Could not find your location. Please check the address and try again.');
        setIsCalculating(false);
        return;
      }

      const results: RouteResult[] = [];

      for (const destId of selectedDestinations) {
        const destination = destinations.find(d => d.id === destId);
        if (!destination) continue;

        try {
          // Search for places of this type near the user
          const places = await mapsService.searchPlacesByType(
            userCoords,
            destination.searchTerms[0],
            2000 // 2km radius
          );

          if (places.length > 0) {
            // Calculate route to the nearest place
            const nearestPlace = places[0];
            const route = await mapsService.calculateRoute(
              userCoords,
              nearestPlace.coordinates,
              travelMode.toUpperCase() as any
            );

            if (route) {
              const result: RouteResult = {
                destination,
                distance: route.distance,
                duration: route.duration,
                mode: travelMode,
                steps: route.steps
              };
              results.push(result);
            } else {
              // Fallback with estimated data
              const fallbackResult: RouteResult = {
                destination,
                distance: 'Route not available',
                duration: 'Unknown',
                mode: travelMode
              };
              results.push(fallbackResult);
            }
          } else {
            // No places found, add with unknown data
            const noPlaceResult: RouteResult = {
              destination,
              distance: 'Not found nearby',
              duration: 'Unknown',
              mode: travelMode
            };
            results.push(noPlaceResult);
          }

          // Add delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (error) {
          console.error(`Error calculating route to ${destination.name}:`, error);
          // Add error result
          const errorResult: RouteResult = {
            destination,
            distance: 'Error',
            duration: 'Error',
            mode: travelMode
          };
          results.push(errorResult);
        }
      }

      setRouteResults(results);
    } catch (error) {
      console.error('Error calculating routes:', error);
      alert('Error calculating routes. Please check your Google Maps API key and try again.');
    } finally {
      setIsCalculating(false);
    }
  };

  const openInGoogleMaps = (destination: RouteDestination) => {
    const query = `${destination.searchTerms[0]} near ${userLocation}`;
    const modeParam = travelMode === 'driving' ? 'driving' :
                     travelMode === 'bicycling' ? 'bicycling' :
                     travelMode === 'transit' ? 'transit' : 'walking';

    // Use the enhanced mapsService method
    mapsService.openGoogleMapsDirections(userLocation, query, modeParam);
  };

  const getTravelModeIcon = (mode: string) => {
    const modeData = travelModes.find(m => m.id === mode);
    if (!modeData) return <Footprints className="w-4 h-4" />;
    const Icon = modeData.icon;
    return <Icon className="w-4 h-4" />;
  };

  const groupedDestinations = destinations.reduce((acc, dest) => {
    if (!acc[dest.category]) acc[dest.category] = [];
    acc[dest.category].push(dest);
    return acc;
  }, {} as Record<string, RouteDestination[]>);

  return (
    <div className="space-y-6" role="main" aria-labelledby="route-planner-title">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 id="route-planner-title" className="text-3xl font-bold flex items-center space-x-2">
            <Navigation className="w-8 h-8 text-blue-600" />
            <span>Route Planner</span>
          </h1>
          <p className="text-gray-600 mt-2">
            Plan your routes to university, home, and essential locations
          </p>
        </div>
        <Badge variant="outline" className="flex items-center space-x-1">
          <MapPin className="w-3 h-3" />
          <span>Google Maps Powered</span>
        </Badge>
      </div>

      {/* Location Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            <span>Your Location</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Input
              placeholder="Enter your accommodation address or postcode..."
              value={userLocation}
              onChange={(e) => setUserLocation(e.target.value)}
              className="text-lg"
            />
            <p className="text-sm text-gray-500 mt-1">
              e.g., "123 Student Street, Manchester M1 1AA" or "M1 1AA"
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Travel Mode</label>
            <Select value={travelMode} onValueChange={(value: any) => setTravelMode(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {travelModes.map((mode) => {
                  const Icon = mode.icon;
                  return (
                    <SelectItem key={mode.id} value={mode.id}>
                      <div className="flex items-center space-x-2">
                        <Icon className="w-4 h-4" />
                        <span>{mode.name}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Destination Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Destinations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {Object.entries(groupedDestinations).map(([category, dests]) => (
              <div key={category}>
                <h3 className="font-medium text-gray-700 mb-3">{category}</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {dests.map((destination) => {
                    const Icon = destination.icon;
                    const isSelected = selectedDestinations.includes(destination.id);
                    
                    return (
                      <button
                        key={destination.id}
                        onClick={() => handleDestinationToggle(destination.id)}
                        className={`p-4 rounded-lg border-2 text-left transition-all ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center space-x-3 mb-2">
                          <Icon className={`w-5 h-5 ${isSelected ? 'text-blue-600' : 'text-gray-600'}`} />
                          <span className="font-medium">{destination.name}</span>
                        </div>
                        <p className="text-sm text-gray-600">{destination.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {selectedDestinations.length} destination{selectedDestinations.length !== 1 ? 's' : ''} selected
            </div>
            <Button
              onClick={calculateRoutes}
              disabled={!userLocation.trim() || selectedDestinations.length === 0 || isCalculating}
              className="flex items-center space-x-2"
            >
              {isCalculating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Calculating...</span>
                </>
              ) : (
                <>
                  <Navigation className="w-4 h-4" />
                  <span>Calculate Routes</span>
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Route Results */}
      {routeResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-green-600" />
              <span>Route Results</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {routeResults.map((result, index) => {
                const Icon = result.destination.icon;
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-4">
                      <Icon className="w-6 h-6 text-blue-600" />
                      <div>
                        <h3 className="font-medium">{result.destination.name}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            {getTravelModeIcon(result.mode)}
                            <span>{result.duration}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-3 h-3" />
                            <span>{result.distance}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openInGoogleMaps(result.destination)}
                        className="flex items-center space-x-1"
                      >
                        <Navigation className="w-3 h-3" />
                        <span>Open in Maps</span>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">💡 Pro Tips</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Click "Open in Maps" to get turn-by-turn directions</li>
                <li>• Try different travel modes to compare journey times</li>
                <li>• Save frequently used routes for quick access</li>
                <li>• Check public transport options for cost-effective travel</li>
                <li>• Consider cycling for short distances and exercise</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setSelectedDestinations(['university']);
                setTravelMode('walking');
              }}
              className="flex items-center space-x-2 p-4 h-auto"
            >
              <GraduationCap className="w-5 h-5 text-blue-600" />
              <div className="text-left">
                <div className="font-medium">To University</div>
                <div className="text-xs text-gray-500">Walking route</div>
              </div>
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                setSelectedDestinations(['supermarket', 'gym']);
                setTravelMode('bicycling');
              }}
              className="flex items-center space-x-2 p-4 h-auto"
            >
              <Bike className="w-5 h-5 text-green-600" />
              <div className="text-left">
                <div className="font-medium">Daily Errands</div>
                <div className="text-xs text-gray-500">Cycling route</div>
              </div>
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                setSelectedDestinations(['home']);
                setTravelMode('transit');
              }}
              className="flex items-center space-x-2 p-4 h-auto"
            >
              <Bus className="w-5 h-5 text-purple-600" />
              <div className="text-left">
                <div className="font-medium">Home Visit</div>
                <div className="text-xs text-gray-500">Public transport</div>
              </div>
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                setSelectedDestinations(['cafe', 'entertainment']);
                setTravelMode('walking');
              }}
              className="flex items-center space-x-2 p-4 h-auto"
            >
              <Star className="w-5 h-5 text-orange-600" />
              <div className="text-left">
                <div className="font-medium">Social Life</div>
                <div className="text-xs text-gray-500">Walking route</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RoutePlanner;

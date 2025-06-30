// Google Maps Service with free tier support
export interface MapLocation {
  lat: number;
  lng: number;
  name: string;
  type: 'university' | 'accommodation' | 'amenity';
  details?: unknown;
}

export interface RouteInfo {
  distance: string;
  duration: string;
  steps: google.maps.DirectionsStep[];
}

// Define Coordinates interface
export interface Coordinates {
  lat: number;
  lng: number;
}

class MapsService {
  private apiKey: string = '';
  private isMapLoaded: boolean = false;
  private loadPromise: Promise<void> | null = null;

  constructor() {
    // Load API key from environment variable if available
    this.apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  }

  // Set API key (users can add their own free Google Maps API key)
  setApiKey(key: string) {
    this.apiKey = key;
    localStorage.setItem('google_maps_api_key', key);
    this.isMapLoaded = false; // Force reload with new key
  }

  // Check if API is available
  isAPIAvailable(): boolean {
    return !!this.apiKey;
  }

  // Check if Maps API is loaded
  isLoaded(): boolean {
    return this.isMapLoaded && !!window.google;
  }

  // Get setup instructions for users
  getAPISetupInstructions(): string {
    return `To enable Google Maps:
1. Go to https://console.cloud.google.com/
2. Create a new project or select existing
3. Enable Maps JavaScript API and Places API
4. Create credentials (API Key)
5. Restrict the key to your domain for security
6. Add your API key in the Maps settings

Free tier includes 28,000 map loads per month!`;
  }

  // Load Google Maps API
  async loadGoogleMaps(): Promise<void> {
    if (this.isMapLoaded && window.google) {
      return Promise.resolve();
    }

    if (this.loadPromise) {
      return this.loadPromise;
    }

    if (!this.apiKey) {
      throw new Error('Google Maps API key not set');
    }

    this.loadPromise = new Promise((resolve, reject) => {
      if (window.google) {
        this.isMapLoaded = true;
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${this.apiKey}&libraries=places,geometry&callback=initGoogleMaps`;
      script.async = true;
      script.defer = true;

      (window as unknown as { initGoogleMaps: () => void }).initGoogleMaps = () => {
        this.isMapLoaded = true;
        resolve();
      };

      script.onerror = () => {
        reject(new Error('Failed to load Google Maps API'));
      };

      document.head.appendChild(script);
    });

    return this.loadPromise;
  }

  // Create map instance
  createMap(element: HTMLElement, options: google.maps.MapOptions = {}): google.maps.Map {
    if (!window.google) {
      throw new Error('Google Maps not loaded');
    }
    const defaultOptions: google.maps.MapOptions = {
      center: { lat: 54.7023, lng: -3.2765 }, // UK center
      zoom: 6,
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
      zoomControl: true,
      ...options
    };
    return new window.google.maps.Map(element, defaultOptions);
  }

  // Create marker
  createMarker(map: google.maps.Map, location: MapLocation, options: google.maps.MarkerOptions = {}): google.maps.Marker | null {
    if (!window.google) return null;
    const defaultOptions: google.maps.MarkerOptions = {
      position: { lat: location.lat, lng: location.lng },
      map: map,
      title: location.name,
      ...options
    };
    return new window.google.maps.Marker(defaultOptions);
  }

  // Search nearby places
  async searchNearbyPlaces(
    map: google.maps.Map,
    center: { lat: number; lng: number },
    type: string,
    radius: number = 1000
  ): Promise<google.maps.places.PlaceResult[]> {
    if (!window.google) return [];
    return new Promise((resolve) => {
      const service = new window.google.maps.places.PlacesService(map);
      const request: google.maps.places.PlaceSearchRequest = {
        location: center,
        radius: radius,
        type: type as string // Google Maps expects string or string[]
      };
      service.nearbySearch(request, (results: google.maps.places.PlaceResult[] | null, status: google.maps.places.PlacesServiceStatus) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
          resolve(results);
        } else {
          resolve([]);
        }
      });
    });
  }

  // Calculate route
  async calculateRoute(
    start: { lat: number; lng: number },
    end: { lat: number; lng: number },
    travelMode: google.maps.TravelMode = google.maps.TravelMode.WALKING
  ): Promise<RouteInfo | null> {
    if (!window.google) return null;
    return new Promise((resolve) => {
      const directionsService = new window.google.maps.DirectionsService();
      const request: google.maps.DirectionsRequest = {
        origin: start,
        destination: end,
        travelMode: travelMode
      };
      directionsService.route(request, (result: google.maps.DirectionsResult, status: google.maps.DirectionsStatus) => {
        if (status === 'OK' && result.routes.length > 0) {
          const route = result.routes[0].legs[0];
          resolve({
            distance: route.distance?.text || '',
            duration: route.duration?.text || '',
            steps: route.steps
          });
        } else {
          resolve(null);
        }
      });
    });
  }

  // Get place details
  async getPlaceDetails(placeId: string): Promise<google.maps.places.PlaceResult | null> {
    if (!window.google) return null;
    return new Promise((resolve) => {
      const service = new window.google.maps.places.PlacesService(
        document.createElement('div')
      );
      service.getDetails(
        { placeId: placeId },
        (place: google.maps.places.PlaceResult | null, status: google.maps.places.PlacesServiceStatus) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
            resolve(place);
          } else {
            resolve(null);
          }
        }
      );
    });
  }

  // Geocode address
  async geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
    if (!window.google) return null;
    return new Promise((resolve) => {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address: address }, (results: google.maps.GeocoderResult[] | null, status: google.maps.GeocoderStatus) => {
        if (status === 'OK' && results && results.length > 0) {
          const location = results[0].geometry.location;
          resolve({
            lat: location.lat(),
            lng: location.lng()
          });
        } else {
          resolve(null);
        }
      });
    });
  }

  // Create info window
  createInfoWindow(content: string): google.maps.InfoWindow | null {
    if (!window.google) return null;
    return new window.google.maps.InfoWindow({
      content: content
    });
  }

  // Create directions renderer
  createDirectionsRenderer(map: google.maps.Map, options: google.maps.DirectionsRendererOptions = {}): google.maps.DirectionsRenderer | null {
    if (!window.google) return null;
    const renderer = new window.google.maps.DirectionsRenderer({
      draggable: true,
      ...options
    });
    renderer.setMap(map);
    return renderer;
  }

  // Calculate multiple routes to different destinations
  async calculateMultipleRoutes(
    origin: Coordinates,
    destinations: Array<{ name: string; coordinates: Coordinates; type: string }>,
    travelMode: google.maps.TravelMode = google.maps.TravelMode.WALKING
  ): Promise<Array<{ destination: { name: string; coordinates: Coordinates; type: string }; route: RouteInfo | null }>> {
    const results: Array<{ destination: { name: string; coordinates: Coordinates; type: string }; route: RouteInfo | null }> = [];
    for (const destination of destinations) {
      const route = await this.calculateRoute(origin, destination.coordinates, travelMode);
      results.push({ destination, route });
      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return results;
  }

  // Search for places of a specific type near a location
  async searchPlacesByType(
    location: Coordinates,
    type: string,
    radius: number = 1000
  ): Promise<Array<{ name: string; coordinates: Coordinates; placeId: string }>> {
    if (!this.isLoaded() || !window.google) {
      return [];
    }
    return new Promise((resolve) => {
      const service = new window.google.maps.places.PlacesService(
        document.createElement('div')
      );
      const request: google.maps.places.PlaceSearchRequest = {
        location: new window.google.maps.LatLng(location.lat, location.lng),
        radius: radius,
        type: type as string
      };
      service.nearbySearch(request, (results: google.maps.places.PlaceResult[] | null, status: google.maps.places.PlacesServiceStatus) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
          const places = results.slice(0, 5).map(place => ({
            name: place.name,
            coordinates: {
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng()
            },
            placeId: place.place_id
          }));
          resolve(places);
        } else {
          console.warn(`Places search failed for ${type}:`, status);
          resolve([]);
        }
      });
    });
  }

  // Open Google Maps with directions
  openGoogleMapsDirections(
    origin: string,
    destination: string,
    travelMode: 'driving' | 'walking' | 'bicycling' | 'transit' = 'walking'
  ): void {
    const baseUrl = 'https://www.google.com/maps/dir/';
    const params = new URLSearchParams({
      api: '1',
      origin: origin,
      destination: destination,
      travelmode: travelMode
    });

    const url = `${baseUrl}?${params.toString()}`;
    window.open(url, '_blank');
  }

  // Get route URL for sharing
  getRouteShareUrl(
    origin: string,
    destination: string,
    travelMode: 'driving' | 'walking' | 'bicycling' | 'transit' = 'walking'
  ): string {
    const params = new URLSearchParams({
      api: '1',
      origin: origin,
      destination: destination,
      travelmode: travelMode
    });

    return `https://www.google.com/maps/dir/?${params.toString()}`;
  }

  // Find nearest places of interest
  async findNearestPlaces(
    userLocation: Coordinates,
    placeTypes: string[]
  ): Promise<Record<string, Array<{ name: string; coordinates: Coordinates; distance?: string }>>> {
    const results: Record<string, Array<{ name: string; coordinates: Coordinates; distance?: string }>> = {};

    for (const placeType of placeTypes) {
      try {
        const places = await this.searchPlacesByType(userLocation, placeType, 2000);
        results[placeType] = places;
      } catch (error) {
        console.warn(`Failed to find ${placeType}:`, error);
        results[placeType] = [];
      }
    }

    return results;
  }
}

export const mapsService = new MapsService();

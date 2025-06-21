// Commute Time Calculator using free APIs
export interface CommuteInfo {
  distance: string;
  duration: string;
  mode: 'walking' | 'transit' | 'driving' | 'cycling';
  steps?: any[];
  cost?: number;
}

export interface Location {
  lat: number;
  lng: number;
  address: string;
}

class CommuteService {
  private apiKey: string | null = null;

  constructor() {
    // Try to get API key from environment or localStorage
    this.apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
                  localStorage.getItem('google_maps_api_key') ||
                  null;
  }

  // Set API key
  setApiKey(key: string) {
    this.apiKey = key;
    localStorage.setItem('google_maps_api_key', key);
  }

  // Check if API is available
  isAPIAvailable(): boolean {
    return !!this.apiKey;
  }

  // Calculate commute time using Google Maps API
  async calculateCommute(
    from: Location,
    to: Location,
    mode: 'walking' | 'transit' | 'driving' | 'cycling' = 'transit'
  ): Promise<CommuteInfo | null> {
    if (!this.apiKey) {
      // Fallback to estimated calculations
      return this.estimateCommute(from, to, mode);
    }

    try {
      const travelMode = this.getTravelMode(mode);
      const url = `https://maps.googleapis.com/maps/api/directions/json?` +
        `origin=${from.lat},${from.lng}&` +
        `destination=${to.lat},${to.lng}&` +
        `mode=${travelMode}&` +
        `key=${this.apiKey}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.routes.length > 0) {
        const route = data.routes[0];
        const leg = route.legs[0];

        return {
          distance: leg.distance.text,
          duration: leg.duration.text,
          mode: mode,
          steps: leg.steps,
          cost: this.estimateCost(leg.distance.value, mode)
        };
      }

      return null;
    } catch (error) {
      console.error('Failed to calculate commute:', error);
      return this.estimateCommute(from, to, mode);
    }
  }

  // Fallback estimation when API is not available
  private estimateCommute(
    from: Location,
    to: Location,
    mode: 'walking' | 'transit' | 'driving' | 'cycling'
  ): CommuteInfo {
    const distance = this.calculateDistance(from.lat, from.lng, to.lat, to.lng);
    const distanceKm = distance;
    const distanceMiles = distance * 0.621371;

    let duration: string;
    let cost = 0;

    switch (mode) {
      case 'walking':
        duration = `${Math.round(distanceKm * 12)} mins`; // ~5 km/h
        break;
      case 'cycling':
        duration = `${Math.round(distanceKm * 4)} mins`; // ~15 km/h
        break;
      case 'driving':
        duration = `${Math.round(distanceKm * 2)} mins`; // ~30 km/h in city
        cost = distanceKm * 0.45; // £0.45 per km (fuel + wear)
        break;
      case 'transit':
      default:
        duration = `${Math.round(distanceKm * 3)} mins`; // ~20 km/h average
        cost = this.estimateTransitCost(distanceKm);
        break;
    }

    return {
      distance: `${distanceKm.toFixed(1)} km`,
      duration,
      mode,
      cost: Math.round(cost * 100) / 100
    };
  }

  // Calculate distance between two points using Haversine formula
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private getTravelMode(mode: string): string {
    switch (mode) {
      case 'walking': return 'walking';
      case 'cycling': return 'bicycling';
      case 'driving': return 'driving';
      case 'transit': return 'transit';
      default: return 'transit';
    }
  }

  private estimateCost(distanceMeters: number, mode: string): number {
    const distanceKm = distanceMeters / 1000;
    
    switch (mode) {
      case 'driving':
        return distanceKm * 0.45; // £0.45 per km
      case 'transit':
        return this.estimateTransitCost(distanceKm);
      default:
        return 0;
    }
  }

  private estimateTransitCost(distanceKm: number): number {
    // UK public transport cost estimation
    if (distanceKm < 5) return 2.50; // Short journey
    if (distanceKm < 15) return 4.50; // Medium journey
    return 6.50; // Long journey
  }

  // Get multiple commute options
  async getCommuteOptions(from: Location, to: Location): Promise<CommuteInfo[]> {
    const modes: ('walking' | 'transit' | 'cycling')[] = ['walking', 'transit', 'cycling'];
    const results: CommuteInfo[] = [];

    for (const mode of modes) {
      try {
        const commute = await this.calculateCommute(from, to, mode);
        if (commute) {
          results.push(commute);
        }
      } catch (error) {
        console.warn(`Failed to calculate ${mode} commute:`, error);
      }
    }

    return results;
  }

  // Geocode address to coordinates
  async geocodeAddress(address: string): Promise<Location | null> {
    if (!this.apiKey) {
      // Return mock coordinates for common UK cities
      return this.getMockLocation(address);
    }

    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?` +
        `address=${encodeURIComponent(address)}&` +
        `key=${this.apiKey}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.results.length > 0) {
        const result = data.results[0];
        return {
          lat: result.geometry.location.lat,
          lng: result.geometry.location.lng,
          address: result.formatted_address
        };
      }

      return null;
    } catch (error) {
      console.error('Failed to geocode address:', error);
      return this.getMockLocation(address);
    }
  }

  // Mock location data for common UK universities and cities
  private getMockLocation(address: string): Location | null {
    const mockLocations: { [key: string]: Location } = {
      'manchester': { lat: 53.4808, lng: -2.2426, address: 'Manchester, UK' },
      'london': { lat: 51.5074, lng: -0.1278, address: 'London, UK' },
      'birmingham': { lat: 52.4862, lng: -1.8904, address: 'Birmingham, UK' },
      'leeds': { lat: 53.8008, lng: -1.5491, address: 'Leeds, UK' },
      'liverpool': { lat: 53.4084, lng: -2.9916, address: 'Liverpool, UK' },
      'bristol': { lat: 51.4545, lng: -2.5879, address: 'Bristol, UK' },
      'sheffield': { lat: 53.3811, lng: -1.4701, address: 'Sheffield, UK' },
      'nottingham': { lat: 52.9548, lng: -1.1581, address: 'Nottingham, UK' },
      'newcastle': { lat: 54.9783, lng: -1.6178, address: 'Newcastle, UK' },
      'edinburgh': { lat: 55.9533, lng: -3.1883, address: 'Edinburgh, UK' },
      'glasgow': { lat: 55.8642, lng: -4.2518, address: 'Glasgow, UK' },
      'cardiff': { lat: 51.4816, lng: -3.1791, address: 'Cardiff, UK' },
      'oxford': { lat: 51.7520, lng: -1.2577, address: 'Oxford, UK' },
      'cambridge': { lat: 52.2053, lng: 0.1218, address: 'Cambridge, UK' }
    };

    const searchKey = address.toLowerCase();
    for (const [key, location] of Object.entries(mockLocations)) {
      if (searchKey.includes(key)) {
        return location;
      }
    }

    return null;
  }

  // Calculate commute score (lower is better)
  calculateCommuteScore(commute: CommuteInfo): number {
    let score = 0;
    
    // Duration score (minutes)
    const durationMinutes = parseInt(commute.duration.replace(/\D/g, ''));
    score += durationMinutes * 2; // 2 points per minute
    
    // Mode preference score
    switch (commute.mode) {
      case 'walking':
        score += durationMinutes > 20 ? 50 : 0; // Penalty for long walks
        break;
      case 'cycling':
        score += 10; // Slight preference for cycling
        break;
      case 'transit':
        score += 20; // Account for waiting time
        break;
      case 'driving':
        score += 30; // Account for parking and traffic
        break;
    }
    
    // Cost score
    if (commute.cost) {
      score += commute.cost * 5; // 5 points per pound
    }
    
    return score;
  }
}

export const commuteService = new CommuteService();

# API Documentation

This document describes the external APIs used by StudentHome and the internal service interfaces.

## External APIs

### 1. Google Maps API
**Purpose**: Maps, geocoding, and places data
**Cost**: Free tier available (28,000 requests/month)
**Documentation**: https://developers.google.com/maps

#### Required APIs
- Maps JavaScript API
- Geocoding API
- Places API
- Directions API

#### Configuration
```typescript
// Environment variable
VITE_GOOGLE_MAPS_API_KEY=your_api_key

// Usage in code
const { isLoaded } = useJsApiLoader({
  id: 'google-map-script',
  googleMapsApiKey: process.env.VITE_GOOGLE_MAPS_API_KEY || '',
  libraries: ['places', 'geometry']
});
```

#### Key Methods
```typescript
// Geocoding
geocodeAddress(address: string): Promise<Coordinates>
reverseGeocode(coordinates: Coordinates): Promise<string>

// Places
searchNearby(location: Coordinates, type: string): Promise<Place[]>
getPlaceDetails(placeId: string): Promise<PlaceDetails>

// Directions
calculateRoute(origin: Coordinates, destination: Coordinates): Promise<Route>
```

### 2. UK Police API
**Purpose**: Crime data and safety information
**Cost**: Free
**Documentation**: https://data.police.uk/docs/

#### Endpoints Used
```typescript
// Crime data
GET https://data.police.uk/api/crimes-at-location?lat={lat}&lng={lng}&date={date}

// Police forces
GET https://data.police.uk/api/forces

// Neighbourhoods
GET https://data.police.uk/api/{force}/neighbourhoods
```

#### Implementation
```typescript
async getSafetyData(coordinates: Coordinates): Promise<SafetyData> {
  const response = await fetch(
    `https://data.police.uk/api/crimes-at-location?lat=${coordinates.lat}&lng=${coordinates.lng}&date=2024-01`
  );
  return this.transformPoliceData(await response.json());
}
```

### 3. Transport for London (TfL) API
**Purpose**: London transport information
**Cost**: Free
**Documentation**: https://api.tfl.gov.uk/

#### Endpoints Used
```typescript
// Stop points
GET https://api.tfl.gov.uk/StopPoint?lat={lat}&lon={lng}&radius={radius}

// Journey planning
GET https://api.tfl.gov.uk/Journey/JourneyResults/{from}/to/{to}

// Line status
GET https://api.tfl.gov.uk/Line/Mode/{mode}/Status
```

### 4. National Rail API
**Purpose**: UK rail information
**Cost**: Free registration required
**Documentation**: https://www.nationalrail.co.uk/developers

#### Implementation
```typescript
async getNationalRailData(coordinates: Coordinates): Promise<TransitInfo | null> {
  // Implementation depends on specific API access
  // Currently returns mock data
  return null;
}
```

### 5. University APIs
**Purpose**: Official accommodation data
**Cost**: Free (varies by university)

#### Common Endpoints
```typescript
// University of Manchester example
GET https://www.manchester.ac.uk/api/accommodation/search

// Imperial College London example
GET https://www.imperial.ac.uk/api/accommodation/available
```

## Internal Service APIs

### 1. Authentication Service

#### Interface
```typescript
interface AuthService {
  register(userData: RegisterData): Promise<User>;
  login(email: string, password: string): Promise<User>;
  logout(): Promise<void>;
  getCurrentUser(): User | null;
  updateProfile(updates: Partial<User>): Promise<User>;
  saveSearch(searchData: SearchData): Promise<void>;
  getFavorites(): Promise<string[]>;
  addToFavorites(accommodationId: string): Promise<void>;
  removeFromFavorites(accommodationId: string): Promise<void>;
  onAuthStateChange(callback: (user: User | null) => void): () => void;
}
```

#### Types
```typescript
interface User {
  id: string;
  name: string;
  email: string;
  preferences: UserPreferences;
  savedSearches: SearchData[];
  favoriteAccommodations: string[];
  createdAt: Date;
  lastLogin: Date;
}

interface UserPreferences {
  university?: string;
  budget?: number;
  location?: string;
  roomType?: 'studio' | 'shared' | 'ensuite';
  amenities?: string[];
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  university: string;
}
```

### 2. Data Service

#### Interface
```typescript
interface DataService {
  getAccommodationListings(
    location: string,
    budget: number,
    roomType?: string
  ): Promise<Accommodation[]>;
  getMarketData(location: string): Promise<MarketData>;
  searchAccommodations(criteria: SearchCriteria): Promise<Accommodation[]>;
}
```

#### Types
```typescript
interface Accommodation {
  id: string;
  title: string;
  price: number;
  location: string;
  lat: number;
  lng: number;
  type: 'studio' | 'shared' | 'ensuite';
  amenities: string[];
  rating: number;
  reviews: number;
  available: boolean;
  university: string;
  images: string[];
  description: string;
  source?: string;
  lastUpdated?: Date;
}

interface MarketData {
  averagePrice: number;
  priceChange: number;
  availability: number;
  demandLevel: 'low' | 'medium' | 'high';
  bestTimeToBook: string;
}
```

### 3. Maps Service

#### Interface
```typescript
interface MapsService {
  isLoaded(): boolean;
  loadGoogleMaps(): Promise<void>;
  setApiKey(apiKey: string): void;
  geocodeAddress(address: string): Promise<Coordinates>;
  reverseGeocode(coordinates: Coordinates): Promise<string>;
  searchNearby(location: Coordinates, type: string): Promise<Place[]>;
  calculateRoute(origin: Coordinates, destination: Coordinates): Promise<Route>;
}
```

### 4. Location Service

#### Interface
```typescript
interface LocationService {
  getTransitInfo(coordinates: Coordinates): Promise<TransitInfo>;
  getSafetyData(coordinates: Coordinates): Promise<SafetyData>;
  getCostOfLivingData(location: string): Promise<CostOfLivingData>;
  getAreaInsights(coordinates: Coordinates, location: string): Promise<AreaInsights>;
}
```

### 5. AI Service

#### Interface
```typescript
interface AIService {
  generateResponse(prompt: string): Promise<string>;
  analyzeReviews(reviews: Review[]): Promise<ReviewAnalysis>;
  getRecommendations(user: User, accommodations: Accommodation[]): Promise<Accommodation[]>;
  chatWithAI(message: string, context?: ChatContext): Promise<string>;
}
```

### 6. Performance Service

#### Interface
```typescript
interface PerformanceService {
  getMetrics(): Partial<PerformanceMetrics>;
  getPerformanceScore(): number;
  getRecommendations(): string[];
  markEvent(name: string): void;
  measureBetween(name: string, startMark: string, endMark: string): number;
  disconnect(): void;
}
```

## API Error Handling

### Error Types
```typescript
interface APIError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
}

// Common error codes
enum ErrorCodes {
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_LIMIT_EXCEEDED = 'API_LIMIT_EXCEEDED',
  INVALID_API_KEY = 'INVALID_API_KEY',
  DATA_NOT_FOUND = 'DATA_NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR'
}
```

### Error Handling Strategy
```typescript
async function handleAPICall<T>(apiCall: () => Promise<T>): Promise<T> {
  try {
    return await apiCall();
  } catch (error) {
    if (error instanceof NetworkError) {
      // Retry with exponential backoff
      return retryWithBackoff(apiCall);
    } else if (error instanceof RateLimitError) {
      // Wait and retry
      await delay(error.retryAfter);
      return apiCall();
    } else {
      // Log error and return fallback
      console.error('API call failed:', error);
      throw new APIError({
        code: 'API_CALL_FAILED',
        message: 'Failed to fetch data',
        details: error
      });
    }
  }
}
```

## Rate Limiting

### Google Maps API
- **Geocoding**: 50 requests/second
- **Places**: 100 requests/second
- **Directions**: 50 requests/second

### UK Police API
- **Rate Limit**: 15 requests/second
- **Daily Limit**: None specified

### Implementation
```typescript
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  
  async checkLimit(apiName: string, limit: number, window: number): Promise<void> {
    const now = Date.now();
    const requests = this.requests.get(apiName) || [];
    
    // Remove old requests outside the window
    const validRequests = requests.filter(time => now - time < window);
    
    if (validRequests.length >= limit) {
      const oldestRequest = Math.min(...validRequests);
      const waitTime = window - (now - oldestRequest);
      await delay(waitTime);
    }
    
    validRequests.push(now);
    this.requests.set(apiName, validRequests);
  }
}
```

## Caching Strategy

### Cache Levels
1. **Browser Cache**: HTTP caching headers
2. **Service Worker Cache**: Offline support
3. **Memory Cache**: Runtime caching
4. **Local Storage**: Persistent caching

### Cache Implementation
```typescript
class APICache {
  private cache = new Map<string, CacheEntry>();
  
  async get<T>(key: string, fetcher: () => Promise<T>, ttl: number): Promise<T> {
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.data;
    }
    
    const data = await fetcher();
    this.cache.set(key, { data, timestamp: Date.now() });
    return data;
  }
}
```

## API Testing

### Mock Implementations
```typescript
// Mock data service for testing
export const mockDataService: DataService = {
  getAccommodationListings: vi.fn().mockResolvedValue(mockAccommodations),
  getMarketData: vi.fn().mockResolvedValue(mockMarketData),
  searchAccommodations: vi.fn().mockResolvedValue(mockAccommodations)
};
```

### Integration Tests
```typescript
describe('Data Service Integration', () => {
  it('should fetch real accommodation data', async () => {
    const listings = await dataService.getAccommodationListings('Manchester', 200);
    expect(listings).toBeDefined();
    expect(listings.length).toBeGreaterThan(0);
  });
});
```

## API Monitoring

### Metrics to Track
- **Response Times**: Average, P95, P99
- **Error Rates**: By API and error type
- **Rate Limit Usage**: Percentage of limits used
- **Cache Hit Rates**: Effectiveness of caching

### Implementation
```typescript
class APIMonitor {
  trackRequest(apiName: string, startTime: number, success: boolean) {
    const duration = Date.now() - startTime;
    
    // Send metrics to monitoring service
    this.sendMetric({
      name: `api.${apiName}.duration`,
      value: duration,
      tags: { success: success.toString() }
    });
  }
}
```

## Security Considerations

### API Key Management
- Store in environment variables
- Restrict API keys by domain/IP
- Rotate keys regularly
- Monitor usage for anomalies

### Data Validation
```typescript
function validateCoordinates(lat: number, lng: number): boolean {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

function sanitizeSearchQuery(query: string): string {
  return query.replace(/[<>\"']/g, '').trim().substring(0, 100);
}
```

### CORS Configuration
```typescript
// Allowed origins for API requests
const allowedOrigins = [
  'https://studenthome.com',
  'https://www.studenthome.com',
  'http://localhost:5173' // Development only
];
```

This API documentation provides a comprehensive guide for developers working with the StudentHome application's data layer and external integrations.

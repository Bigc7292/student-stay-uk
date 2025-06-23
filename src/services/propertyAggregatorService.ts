
// Import the actual service instances instead of classes
import { openRentService } from './openRentService';
import { rightmoveService } from './rightmoveService';

interface Property {
  id: string;
  title: string;
  location: string;
  price: number;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  images: string[];
  description: string;
  amenities: string[];
  source: string;
  url: string;
}

interface PropertySearchResult {
  properties: Property[];
  total: number;
  page: number;
  hasMore: boolean;
  sources: string[];
  searchTime: number;
}

interface PropertySearchFilters {
  location: string;
  maxPrice: number;
  minPrice: number;
  bedrooms: number;
  furnished: boolean;
  billsIncluded: boolean;
  availableFrom: string;
  radius: number;
  propertyType?: 'studio' | 'shared' | 'flat' | 'house' | 'room';
}

export class PropertyAggregatorService {
  constructor() {
    // Services are already instantiated
  }

  async searchProperties(searchParams: {
    location: string;
    maxPrice: number;
    minPrice: number;
    bedrooms: number;
    furnished: boolean;
    billsIncluded: boolean;
    availableFrom: string;
    radius: number;
    propertyType?: string;
  }): Promise<PropertySearchResult> {
    const startTime = Date.now();

    // Convert propertyType to the correct enum value
    const propertyType = this.normalizePropertyType(searchParams.propertyType);
    
    const searchFilters: PropertySearchFilters = {
      ...searchParams,
      propertyType
    };

    try {
      // Use mock data for demonstration since we don't have real API keys
      const mockProperties: Property[] = [
        {
          id: 'prop1',
          title: 'Modern Student Studio',
          location: searchParams.location,
          price: Math.min(searchParams.maxPrice - 100, 800),
          propertyType: 'studio',
          bedrooms: 1,
          bathrooms: 1,
          images: ['/placeholder.svg'],
          description: 'A modern studio perfect for students',
          amenities: ['WiFi', 'Furnished', 'Bills Included'],
          source: 'OpenRent',
          url: '#'
        },
        {
          id: 'prop2',
          title: 'Shared House Room',
          location: searchParams.location,
          price: Math.min(searchParams.maxPrice - 200, 600),
          propertyType: 'shared',
          bedrooms: 1,
          bathrooms: 1,
          images: ['/placeholder.svg'],
          description: 'Comfortable room in shared house',
          amenities: ['WiFi', 'Garden', 'Near Transport'],
          source: 'Rightmove',
          url: '#'
        }
      ];

      return {
        properties: mockProperties,
        total: mockProperties.length,
        page: 1,
        hasMore: false,
        sources: ['OpenRent', 'Rightmove'],
        searchTime: Date.now() - startTime
      };
    } catch (error) {
      console.error('Error searching properties:', error);
      return {
        properties: [],
        total: 0,
        page: 1,
        hasMore: false,
        sources: [],
        searchTime: Date.now() - startTime
      };
    }
  }

  private normalizePropertyType(propertyType?: string): 'studio' | 'shared' | 'flat' | 'house' | 'room' {
    if (!propertyType || propertyType === 'any') {
      return 'studio';
    }
    
    const validTypes: Array<'studio' | 'shared' | 'flat' | 'house' | 'room'> = 
      ['studio', 'shared', 'flat', 'house', 'room'];
    
    if (validTypes.includes(propertyType as any)) {
      return propertyType as 'studio' | 'shared' | 'flat' | 'house' | 'room';
    }
    
    return 'studio';
  }
}

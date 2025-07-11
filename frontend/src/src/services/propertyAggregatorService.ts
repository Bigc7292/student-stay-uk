// Import the actual service instances instead of classes
import { mockProperties as allMockProperties } from '../data/mockData';

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
      // Filter mock properties by location and other filters
      const filteredProperties: Property[] = allMockProperties
        .filter((prop) => {
          // Location match (case-insensitive, partial match)
          const locationMatch = searchParams.location
            ? prop.location.toLowerCase().includes(searchParams.location.toLowerCase())
            : true;
          // Price range
          const priceMatch =
            (typeof searchParams.minPrice === 'number' ? prop.price >= searchParams.minPrice : true) &&
            (typeof searchParams.maxPrice === 'number' ? prop.price <= searchParams.maxPrice : true);
          // Bedrooms (mockData does not have bedrooms, so default to true)
          const bedroomsMatch = true;
          // Furnished (if specified)
          const furnishedMatch =
            typeof searchParams.furnished === 'boolean' ? prop.amenities.includes('Furnished') === searchParams.furnished : true;
          // Property type (normalize for mockData)
          const propertyTypeMatch = searchFilters.propertyType
            ? prop.propertyType.toLowerCase().includes(searchFilters.propertyType)
            : true;
          return locationMatch && priceMatch && bedroomsMatch && furnishedMatch && propertyTypeMatch;
        })
        .map((prop) => ({
          ...prop,
          id: String(prop.id),
          images: prop.photos || [prop.image],
          source: 'MockData',
          url: '#',
          bedrooms: 1, // default for mock data
          bathrooms: 1 // default for mock data
        }));

      return {
        properties: filteredProperties,
        total: filteredProperties.length,
        page: 1,
        hasMore: false,
        sources: ['MockData'],
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
    const validTypes: Array<'studio' | 'shared' | 'flat' | 'house' | 'room'> = [
      'studio', 'shared', 'flat', 'house', 'room'
    ];
    if (validTypes.includes(propertyType as 'studio' | 'shared' | 'flat' | 'house' | 'room')) {
      return propertyType as 'studio' | 'shared' | 'flat' | 'house' | 'room';
    }
    return 'studio';
  }
}

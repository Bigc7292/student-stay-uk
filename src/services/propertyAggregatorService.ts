import { ZooplaService } from './zooplaService';
import { OpenRentService } from './openRentService';
import { RightmoveService } from './rightmoveService';

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

export class PropertyAggregatorService {
  private zooplaService: ZooplaService;
  private openRentService: OpenRentService;
  private rightmoveService: RightmoveService;

  constructor() {
    this.zooplaService = new ZooplaService();
    this.openRentService = new OpenRentService();
    this.rightmoveService = new RightmoveService();
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

    let zooplaResults: PropertySearchResult = {
      properties: [],
      total: 0,
      page: 1,
      hasMore: false,
      sources: [],
      searchTime: 0
    };
    let openRentResults: PropertySearchResult = {
      properties: [],
      total: 0,
      page: 1,
      hasMore: false,
      sources: [],
      searchTime: 0
    };
    let rightmoveResults: PropertySearchResult = {
      properties: [],
      total: 0,
      page: 1,
      hasMore: false,
      sources: [],
      searchTime: 0
    };

    const searchParamsWithType = {
      ...searchParams,
      propertyType: searchParams.propertyType || 'any'
    };

    // Search using individual services
    try {
      if (searchParamsWithType.propertyType === 'any' || searchParamsWithType.propertyType === 'studio') {
        zooplaResults = await this.zooplaService.searchProperties(searchParamsWithType);
      }
      
      if (searchParamsWithType.propertyType === 'any' || searchParamsWithType.propertyType === 'shared') {
        openRentResults = await this.openRentService.searchProperties(searchParamsWithType);
      }
      
      if (searchParamsWithType.propertyType === 'any' || searchParamsWithType.propertyType === 'apartment') {
        rightmoveResults = await this.rightmoveService.searchProperties(searchParamsWithType);
      }

      const allProperties = [
        ...zooplaResults.properties,
        ...openRentResults.properties,
        ...rightmoveResults.properties
      ];
      const total = zooplaResults.total + openRentResults.total + rightmoveResults.total;

      return {
        properties: allProperties,
        total: total,
        page: 1,
        hasMore: false,
        sources: ['Zoopla', 'OpenRent', 'Rightmove'],
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
}

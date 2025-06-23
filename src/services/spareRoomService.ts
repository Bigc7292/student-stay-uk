
import { ApifyClient } from 'apify-client';

export interface SpareRoomProperty {
  id: string;
  title: string;
  price: number;
  location: string;
  bedrooms: number;
  bathrooms: number;
  furnished: boolean;
  billsIncluded: boolean;
  availableFrom: string;
  description: string;
  images: string[];
  landlordType: string;
  propertyType: string;
  url: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface SpareRoomSearchParams {
  location: string;
  maxPrice: number;
  minPrice: number;
  bedrooms: number;
  furnished: boolean;
  billsIncluded: boolean;
  availableFrom: string;
  radius: number;
}

class SpareRoomService {
  private client: ApifyClient;
  private readonly actorId = 'dtrungtin/spareroom-scraper';
  private readonly baseUrl = 'https://www.spareroom.co.uk';
  private readonly apiKey: string;

  constructor() {
    this.apiKey = import.meta.env.VITE_APIFY_API_KEY || '';
    this.client = new ApifyClient({
      token: this.apiKey
    });
    console.info('🏠 SpareRoom Apify scraper service initialized');
  }

  async searchProperties(params: SpareRoomSearchParams): Promise<SpareRoomProperty[]> {
    if (!this.apiKey) {
      console.warn('SpareRoom: Apify API key not configured, returning mock data');
      return this.getMockProperties();
    }

    try {
      const input = {
        location: params.location,
        maxPrice: params.maxPrice,
        minPrice: params.minPrice,
        furnished: params.furnished,
        billsIncluded: params.billsIncluded,
        maxResults: 50
      };

      console.info('🔍 SpareRoom: Starting property search...', input);

      const run = await this.client.actor(this.actorId).call(input);
      const { items } = await this.client.dataset(run.defaultDatasetId).listItems();

      const properties = items.map(item => this.transformScrapedProperty(item));
      
      console.info(`✅ SpareRoom: Found ${properties.length} properties`);
      return properties;

    } catch (error) {
      console.error('❌ SpareRoom: Search failed:', error);
      return this.getMockProperties();
    }
  }

  private transformScrapedProperty(item: any): SpareRoomProperty {
    return {
      id: item.id || `spareroom-${Date.now()}-${Math.random()}`,
      title: item.title || 'Property Available',
      price: this.parsePrice(item.price),
      location: item.location || 'Location not specified',
      bedrooms: this.parseBedrooms(item.bedrooms),
      bathrooms: item.bathrooms || 1,
      furnished: this.parseFurnished(item.furnished),
      billsIncluded: this.parseBillsIncluded(item.bills),
      availableFrom: item.availableFrom || 'Available now',
      description: item.description || 'No description available',
      images: this.parseImages(item.images),
      landlordType: item.landlordType || 'Private',
      propertyType: item.propertyType || 'Room',
      url: item.url || this.baseUrl,
      coordinates: item.coordinates
    };
  }

  private parsePrice(price: any): number {
    if (typeof price === 'number') return price;
    if (typeof price === 'string') {
      const numericPrice = price.replace(/[£,]/g, '');
      return parseInt(numericPrice) || 0;
    }
    return 0;
  }

  private parseBedrooms(bedrooms: any): number {
    if (typeof bedrooms === 'number') return bedrooms;
    if (typeof bedrooms === 'string') {
      return parseInt(bedrooms) || 1;
    }
    return 1;
  }

  private parseFurnished(furnished: any): boolean {
    if (typeof furnished === 'boolean') return furnished;
    if (typeof furnished === 'string') {
      return furnished.toLowerCase().includes('furnished');
    }
    return false;
  }

  private parseBillsIncluded(bills: any): boolean {
    if (typeof bills === 'boolean') return bills;
    if (typeof bills === 'string') {
      return bills.toLowerCase().includes('included');
    }
    return false;
  }

  private parseImages(images: any): string[] {
    if (Array.isArray(images)) {
      return images.filter(img => typeof img === 'string');
    }
    return [];
  }

  private getMockProperties(): SpareRoomProperty[] {
    return [
      {
        id: 'spareroom-mock-1',
        title: 'Spacious Double Room in City Centre',
        price: 650,
        location: 'Manchester City Centre',
        bedrooms: 1,
        bathrooms: 1,
        furnished: true,
        billsIncluded: true,
        availableFrom: 'Available now',
        description: 'Beautiful double room in a modern flat share. All bills included, fully furnished.',
        images: ['/placeholder.svg'],
        landlordType: 'Private',
        propertyType: 'Room',
        url: this.baseUrl,
        coordinates: { lat: 53.4808, lng: -2.2426 }
      }
    ];
  }

  getServiceInfo() {
    return {
      name: 'SpareRoom',
      isConfigured: !!this.apiKey,
      baseUrl: this.baseUrl,
      actorId: this.actorId
    };
  }
}

export const spareRoomService = new SpareRoomService();

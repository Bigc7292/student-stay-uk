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

// Import the Property interface from types/Property
import type { Property } from '../types/Property';

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

  async searchProperties(params: SpareRoomSearchParams): Promise<Property[]> {
    if (!this.apiKey) {
      console.warn('SpareRoom: Apify API key not configured, returning mock data');
      const mockProperties = this.getMockProperties();
      return mockProperties.map(prop => this.transformToStandardProperty(prop));
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
      return properties.map(prop => this.transformToStandardProperty(prop));

    } catch (error) {
      console.error('❌ SpareRoom: Search failed:', error);
      const mockProperties = this.getMockProperties();
      return mockProperties.map(prop => this.transformToStandardProperty(prop));
    }
  }

  // Transform SpareRoomProperty to standard Property interface
  private transformToStandardProperty(spareRoomProp: SpareRoomProperty): Property {
    return {
      id: spareRoomProp.id,
      title: spareRoomProp.title,
      address: spareRoomProp.location, // Map location to address
      price: spareRoomProp.price,
      bedrooms: spareRoomProp.bedrooms,
      bathrooms: spareRoomProp.bathrooms,
      description: spareRoomProp.description,
      images: spareRoomProp.images,
      url: spareRoomProp.url,
      source: 'spareRoom',
      // Optionally add features, amenities, etc. as extra fields
      features: [
        spareRoomProp.furnished ? 'Furnished' : 'Unfurnished',
        spareRoomProp.billsIncluded ? 'Bills Included' : 'Bills Not Included',
        `${spareRoomProp.bedrooms} Bedroom${spareRoomProp.bedrooms > 1 ? 's' : ''}`,
        `${spareRoomProp.bathrooms} Bathroom${spareRoomProp.bathrooms > 1 ? 's' : ''}`
      ],
      amenities: this.extractAmenities(spareRoomProp.description),
      available: true,
      qualityScore: this.calculateQualityScore(spareRoomProp),
      studentSuitability: this.calculateStudentSuitability(spareRoomProp)
    };
  }

  private extractAmenities(description: string): string[] {
    const amenities: string[] = [];
    const lowerDesc = description.toLowerCase();
    
    if (lowerDesc.includes('wifi') || lowerDesc.includes('internet')) amenities.push('WiFi');
    if (lowerDesc.includes('parking')) amenities.push('Parking');
    if (lowerDesc.includes('garden')) amenities.push('Garden');
    if (lowerDesc.includes('gym')) amenities.push('Gym');
    if (lowerDesc.includes('washing')) amenities.push('Washing Machine');
    if (lowerDesc.includes('dishwasher')) amenities.push('Dishwasher');
    
    return amenities;
  }

  private calculateQualityScore(property: SpareRoomProperty): number {
    let score = 50; // Base score
    
    if (property.images.length > 0) score += 20;
    if (property.description.length > 100) score += 10;
    if (property.furnished) score += 10;
    if (property.billsIncluded) score += 10;
    
    return Math.min(score, 100);
  }

  private calculateStudentSuitability(property: SpareRoomProperty): number {
    let score = 60; // Base score for SpareRoom (generally student-friendly)
    
    if (property.billsIncluded) score += 15;
    if (property.furnished) score += 15;
    if (property.price < 600) score += 10; // Affordable for students
    
    return Math.min(score, 100);
  }

  private transformScrapedProperty(item: Record<string, unknown>): SpareRoomProperty {
    return {
      id: String(item.id ?? `spareroom-${Date.now()}-${Math.random()}`),
      title: String(item.title ?? 'Property Available'),
      price: this.parsePrice(String(item.price ?? '0')),
      location: String(item.location ?? 'Location not specified'),
      bedrooms: this.parseBedrooms(String(item.bedrooms ?? '1')),
      bathrooms: Number(item.bathrooms ?? 1),
      furnished: this.parseFurnished(String(item.furnished ?? 'false')),
      billsIncluded: this.parseBillsIncluded(String(item.bills ?? 'false')),
      availableFrom: String(item.availableFrom ?? 'Available now'),
      description: String(item.description ?? 'No description available'),
      images: this.parseImages(item.images ?? []),
      landlordType: String(item.landlordType ?? 'Private'),
      propertyType: String(item.propertyType ?? 'Room'),
      url: String(item.url ?? this.baseUrl),
      coordinates: typeof item.coordinates === 'object' && item.coordinates !== null && 'lat' in item.coordinates && 'lng' in item.coordinates ? item.coordinates as { lat: number; lng: number } : undefined
    };
  }

  private parsePrice(price: string): number {
    if (typeof price === 'number') return price;
    if (typeof price === 'string') {
      const numericPrice = price.replace(/[£,]/g, '');
      return parseInt(numericPrice) || 0;
    }
    return 0;
  }

  private parseBedrooms(bedrooms: string): number {
    if (typeof bedrooms === 'number') return bedrooms;
    if (typeof bedrooms === 'string') {
      return parseInt(bedrooms) || 1;
    }
    return 1;
  }

  private parseFurnished(furnished: string): boolean {
    if (typeof furnished === 'boolean') return furnished;
    if (typeof furnished === 'string') {
      return furnished.toLowerCase().includes('furnished');
    }
    return false;
  }

  private parseBillsIncluded(bills: string): boolean {
    if (typeof bills === 'boolean') return bills;
    if (typeof bills === 'string') {
      return bills.toLowerCase().includes('included');
    }
    return false;
  }

  private parseImages(images: unknown): string[] {
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

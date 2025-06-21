// Rightmove API Service - Apify Scraper Integration
// High-quality property data from UK's #1 property platform

interface RightmoveProperty {
  id: string;
  title: string;
  price: number;
  location: string;
  postcode?: string;
  bedrooms: number;
  bathrooms: number;
  description: string;
  images: string[];
  available: boolean;
  availableFrom?: string;
  propertyType: string;
  furnished: boolean;
  billsIncluded: boolean;
  features: string[];
  agent?: {
    name: string;
    phone?: string;
    verified: boolean;
  };
  url: string;
  postedDate?: string;
  propertySize?: string;
  councilTaxBand?: string;
  epcRating?: string;
}

interface RightmoveSearchFilters {
  location: string;
  maxPrice?: number;
  minPrice?: number;
  bedrooms?: number;
  propertyType?: 'flat' | 'house' | 'bungalow' | 'land' | 'commercial';
  furnished?: boolean;
  billsIncluded?: boolean;
  availableFrom?: string;
  radius?: number; // miles from location
}

class RightmoveService {
  private apifyToken: string;
  private actorId: string;
  private enabled: boolean;
  private baseRightmoveUrl: string;

  constructor() {
    this.apifyToken = 'apify_api_fVf8kjfA4OKeIc8hAWyWtt96sGVYPp3T5NhJ';
    this.actorId = 'XoodS5Tyd3a9NLxlv'; // Rightmove scraper actor ID
    this.enabled = true;
    this.baseRightmoveUrl = 'https://www.rightmove.co.uk';
    
    console.log('🏠 Rightmove Apify scraper service initialized');
  }

  // Check if Rightmove scraper is available
  isAvailable(): boolean {
    return this.enabled && !!this.apifyToken;
  }

  // Search for properties using Apify scraper
  async searchProperties(filters: RightmoveSearchFilters): Promise<RightmoveProperty[]> {
    if (!this.isAvailable()) {
      console.log('🏠 Rightmove scraper not available, skipping search');
      return [];
    }

    try {
      console.log('🏠 Starting Rightmove scraper search...');
      
      // Build Rightmove search URL
      const searchUrl = this.buildRightmoveSearchUrl(filters);
      console.log('🔍 Rightmove search URL:', searchUrl);

      // Dynamic import of Apify client
      const { ApifyClient } = await import('apify-client');
      
      // Initialize the ApifyClient
      const client = new ApifyClient({
        token: this.apifyToken,
      });

      // Prepare Actor input
      const input = {
        startUrls: [{ url: searchUrl }],
        maxItems: 100, // Limit for faster processing
        proxyConfiguration: {
          useApifyProxy: true
        }
      };

      console.log('🚀 Running Rightmove scraper...');

      // Run the Actor and wait for it to finish
      const run = await client.actor(this.actorId).call(input);

      // Fetch Actor results from the run's dataset
      const { items } = await client.dataset(run.defaultDatasetId).listItems();
      
      console.log(`✅ Rightmove scraper completed: ${items.length} properties found`);

      // Transform scraped data to our standard format
      const properties = this.transformScrapedData(items);
      
      console.log(`🏠 Processed ${properties.length} Rightmove properties`);
      return properties;
      
    } catch (error) {
      console.error('❌ Rightmove scraper error:', error);
      throw new Error(`Rightmove scraper failed: ${error.message}`);
    }
  }

  // Build Rightmove search URL for scraping
  private buildRightmoveSearchUrl(filters: RightmoveSearchFilters): string {
    const params = new URLSearchParams();
    
    // Location (required) - convert to Rightmove format
    const locationId = this.formatLocationForRightmove(filters.location);
    params.append('locationIdentifier', locationId);
    
    // Sort by price (low to high) for students
    params.append('sortType', '6');
    params.append('index', '0');
    params.append('channel', 'RENT');
    params.append('viewType', 'LIST');
    
    // Property type
    if (filters.propertyType) {
      params.append('propertyTypes', filters.propertyType);
    } else {
      params.append('propertyTypes', 'flat'); // Default to flats for students
    }
    
    // Price range
    if (filters.minPrice) {
      params.append('minPrice', filters.minPrice.toString());
    }
    if (filters.maxPrice) {
      params.append('maxPrice', filters.maxPrice.toString());
    }
    
    // Bedrooms
    if (filters.bedrooms) {
      params.append('minBedrooms', filters.bedrooms.toString());
      params.append('maxBedrooms', filters.bedrooms.toString());
    }
    
    // Furnished
    if (filters.furnished !== undefined) {
      params.append('furnishTypes', filters.furnished ? 'furnished' : 'unfurnished');
    }
    
    // Radius
    if (filters.radius) {
      params.append('radius', filters.radius.toString());
    }
    
    const searchPath = '/property-to-rent/find.html';
    const fullUrl = `${this.baseRightmoveUrl}${searchPath}?${params.toString()}`;
    
    return fullUrl;
  }

  // Format location for Rightmove search
  private formatLocationForRightmove(location: string): string {
    // Rightmove uses specific location identifiers
    // This is a simplified mapping - in production, you'd use Rightmove's location API
    const locationMap: Record<string, string> = {
      'manchester': 'REGION%5E87490',
      'london': 'REGION%5E87490',
      'birmingham': 'REGION%5E87490',
      'leeds': 'REGION%5E87490',
      'edinburgh': 'REGION%5E87490',
      'glasgow': 'REGION%5E87490',
      'liverpool': 'REGION%5E87490',
      'bristol': 'REGION%5E87490'
    };

    const lowerLocation = location.toLowerCase();
    return locationMap[lowerLocation] || 'REGION%5E87490'; // Default to Manchester
  }

  // Transform scraped data from Apify to our standard format
  private transformScrapedData(items: any[]): RightmoveProperty[] {
    if (!items || !Array.isArray(items)) {
      return [];
    }

    return items.map((property: any) => this.transformScrapedProperty(property));
  }

  // Transform single scraped property data
  private transformScrapedProperty(property: any): RightmoveProperty {
    return {
      id: `rightmove-${property.id || Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: property.title || property.displayAddress || 'Property',
      price: this.parsePrice(property.price || property.rent),
      location: property.location || property.displayAddress || '',
      postcode: property.postcode,
      bedrooms: this.parseNumber(property.bedrooms) || 1,
      bathrooms: this.parseNumber(property.bathrooms) || 1,
      description: property.description || property.summary || '',
      images: this.extractImages(property.images || property.propertyImages),
      available: property.available !== false,
      availableFrom: property.availableFrom || property.letAvailableDate,
      propertyType: property.propertyType || property.propertySubType || 'flat',
      furnished: this.parseBoolean(property.furnished),
      billsIncluded: this.parseBoolean(property.billsIncluded),
      features: this.extractFeatures(property.features || property.keyFeatures),
      agent: property.agent ? {
        name: property.agent.name || property.contactUrl || 'Agent',
        phone: property.agent.phone,
        verified: true // Rightmove agents are generally verified
      } : undefined,
      url: property.url || property.propertyUrl || '',
      postedDate: property.addedOrReduced || property.firstVisibleDate,
      propertySize: property.size,
      councilTaxBand: property.councilTaxBand,
      epcRating: property.epcRating
    };
  }

  // Helper methods
  private parsePrice(priceStr: any): number {
    if (typeof priceStr === 'number') return priceStr;
    if (!priceStr) return 0;
    
    const cleanPrice = priceStr.toString().replace(/[£,\s]/g, '');
    const price = parseFloat(cleanPrice);
    return isNaN(price) ? 0 : price;
  }

  private parseNumber(numStr: any): number {
    if (typeof numStr === 'number') return numStr;
    if (!numStr) return 0;
    
    const num = parseInt(numStr.toString());
    return isNaN(num) ? 0 : num;
  }

  private parseBoolean(value: any): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      const lower = value.toLowerCase();
      return lower === 'true' || lower === 'yes' || lower === 'furnished' || lower === 'y';
    }
    return false;
  }

  private extractImages(images: any): string[] {
    if (!images) return [];
    if (Array.isArray(images)) return images.filter(img => typeof img === 'string');
    if (typeof images === 'string') return [images];
    return [];
  }

  private extractFeatures(features: any): string[] {
    if (!features) return [];
    if (Array.isArray(features)) return features;
    if (typeof features === 'string') return features.split(',').map(f => f.trim());
    return [];
  }

  // Enable/disable service
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    console.log(`🏠 Rightmove scraper ${enabled ? 'enabled' : 'disabled'}`);
  }

  // Get service status
  getStatus(): { available: boolean; enabled: boolean; configured: boolean; scraper: string } {
    return {
      available: this.isAvailable(),
      enabled: this.enabled,
      configured: !!this.apifyToken,
      scraper: 'Apify Rightmove Scraper (XoodS5Tyd3a9NLxlv)'
    };
  }

  // Test the scraper
  async testScraper(): Promise<{ success: boolean; message: string; sampleData?: any }> {
    try {
      console.log('🧪 Testing Rightmove scraper...');
      
      const testFilters: RightmoveSearchFilters = {
        location: 'Manchester',
        maxPrice: 1000,
        propertyType: 'flat'
      };

      const results = await this.searchProperties(testFilters);
      
      return {
        success: true,
        message: `✅ Rightmove scraper test successful! Found ${results.length} properties.`,
        sampleData: results.slice(0, 2)
      };
    } catch (error) {
      return {
        success: false,
        message: `❌ Rightmove scraper test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}

// Export singleton instance
export const rightmoveService = new RightmoveService();
export type { RightmoveProperty, RightmoveSearchFilters };

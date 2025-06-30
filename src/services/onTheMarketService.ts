// OnTheMarket API Service - Apify Scraper Integration
// Professional property listings from UK's major platform

interface OnTheMarketProperty {
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
  tenure?: string;
}

interface OnTheMarketSearchFilters {
  location: string;
  maxPrice?: number;
  minPrice?: number;
  bedrooms?: number;
  propertyType?: 'flat' | 'house' | 'bungalow' | 'maisonette' | 'studio';
  furnished?: boolean;
  billsIncluded?: boolean;
  availableFrom?: string;
  radius?: number;
}

class OnTheMarketService {
  private apifyToken: string;
  private actorId: string;
  private enabled: boolean;
  private baseOnTheMarketUrl: string;

  constructor() {
    this.apifyToken = 'apify_api_fVf8kjfA4OKeIc8hAWyWtt96sGVYPp3T5NhJ';
    this.actorId = 'dhrumil/onthemarket-scraper'; // Primary OnTheMarket scraper
    this.enabled = true;
    this.baseOnTheMarketUrl = 'https://www.onthemarket.com';
    
    console.log('🏠 OnTheMarket Apify scraper service initialized');
  }

  // Check if OnTheMarket scraper is available
  isAvailable(): boolean {
    return this.enabled && !!this.apifyToken;
  }

  // Search for properties using Apify scraper
  async searchProperties(filters: OnTheMarketSearchFilters): Promise<OnTheMarketProperty[]> {
    if (!this.isAvailable()) {
      console.log('🏠 OnTheMarket scraper not available, skipping search');
      return [];
    }

    try {
      console.log('🏠 Starting OnTheMarket scraper search...');
      
      // Build OnTheMarket search URL
      const searchUrl = this.buildOnTheMarketSearchUrl(filters);
      console.log('🔍 OnTheMarket search URL:', searchUrl);

      // Dynamic import of Apify client
      const { ApifyClient } = await import('apify-client');
      
      // Initialize the ApifyClient
      const client = new ApifyClient({
        token: this.apifyToken,
      });

      // Prepare Actor input
      const input = {
        startUrls: [{ url: searchUrl }],
        maxItems: 100,
        proxyConfiguration: {
          useApifyProxy: true
        }
      };

      console.log('🚀 Running OnTheMarket scraper...');

      // Run the Actor and wait for it to finish
      const run = await client.actor(this.actorId).call(input);

      // Fetch Actor results from the run's dataset
      const { items } = await client.dataset(run.defaultDatasetId).listItems();
      
      console.log(`✅ OnTheMarket scraper completed: ${items.length} properties found`);

      // Transform scraped data to our standard format
      const properties = this.transformScrapedData(items);
      
      console.log(`🏠 Processed ${properties.length} OnTheMarket properties`);
      return properties;
      
    } catch (error) {
      console.error('❌ OnTheMarket scraper error:', error);
      throw new Error(`OnTheMarket scraper failed: ${error.message}`);
    }
  }

  // Build OnTheMarket search URL for scraping
  private buildOnTheMarketSearchUrl(filters: OnTheMarketSearchFilters): string {
    const params = new URLSearchParams();
    
    // Location (required) - convert to OnTheMarket format
    const locationId = this.formatLocationForOnTheMarket(filters.location);
    params.append('location', locationId);
    
    // Property type
    if (filters.propertyType) {
      params.append('property-type', filters.propertyType);
    }
    
    // Price range
    if (filters.minPrice) {
      params.append('min-price', filters.minPrice.toString());
    }
    if (filters.maxPrice) {
      params.append('max-price', filters.maxPrice.toString());
    }
    
    // Bedrooms
    if (filters.bedrooms) {
      params.append('min-bedrooms', filters.bedrooms.toString());
    }
    
    // Furnished
    if (filters.furnished !== undefined) {
      params.append('furnished', filters.furnished ? 'furnished' : 'unfurnished');
    }
    
    // Radius
    if (filters.radius) {
      params.append('radius', filters.radius.toString());
    }
    
    // Sort by price (low to high) for students
    params.append('sort', 'price-asc');
    params.append('view', 'grid');
    
    const searchPath = '/to-rent/property';
    const fullUrl = `${this.baseOnTheMarketUrl}${searchPath}?${params.toString()}`;
    
    return fullUrl;
  }

  // Format location for OnTheMarket search
  private formatLocationForOnTheMarket(location: string): string {
    // OnTheMarket uses location names and postcodes
    const locationMap: Record<string, string> = {
      'manchester': 'manchester',
      'london': 'london',
      'birmingham': 'birmingham',
      'leeds': 'leeds',
      'edinburgh': 'edinburgh',
      'glasgow': 'glasgow',
      'liverpool': 'liverpool',
      'bristol': 'bristol',
      'nottingham': 'nottingham',
      'sheffield': 'sheffield'
    };

    const lowerLocation = location.toLowerCase();
    return locationMap[lowerLocation] || location.toLowerCase();
  }

  // Transform scraped data from Apify to our standard format
  private transformScrapedData(items: any[]): OnTheMarketProperty[] {
    if (!items || !Array.isArray(items)) {
      return [];
    }

    return items.map((property: any) => this.transformScrapedProperty(property));
  }

  // Transform single scraped property data
  private transformScrapedProperty(property: any): OnTheMarketProperty {
    return {
      id: `onthemarket-${property.id || Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: property.title || property.address || 'Property',
      price: this.parsePrice(property.price || property.rent),
      location: property.location || property.address || '',
      postcode: property.postcode,
      bedrooms: this.parseNumber(property.bedrooms) || 1,
      bathrooms: this.parseNumber(property.bathrooms) || 1,
      description: property.description || property.summary || '',
      images: this.extractImages(property.images || property.photos),
      available: property.available !== false,
      availableFrom: property.availableFrom || property.available_date,
      propertyType: property.propertyType || property.type || 'flat',
      furnished: this.parseBoolean(property.furnished),
      billsIncluded: this.parseBoolean(property.billsIncluded),
      features: this.extractFeatures(property.features || property.amenities),
      agent: property.agent ? {
        name: property.agent.name || property.agentName || 'Agent',
        phone: property.agent.phone || property.agentPhone,
        verified: true // OnTheMarket agents are generally verified
      } : undefined,
      url: property.url || property.propertyUrl || '',
      postedDate: property.postedDate || property.addedDate,
      propertySize: property.size || property.floorArea,
      councilTaxBand: property.councilTaxBand,
      epcRating: property.epcRating,
      tenure: property.tenure
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

  // Test the scraper
  async testScraper(): Promise<{ success: boolean; message: string; sampleData?: any }> {
    try {
      console.log('🧪 Testing OnTheMarket scraper...');
      
      const testFilters: OnTheMarketSearchFilters = {
        location: 'Manchester',
        maxPrice: 1200,
        propertyType: 'flat'
      };

      const results = await this.searchProperties(testFilters);
      
      return {
        success: true,
        message: `✅ OnTheMarket scraper test successful! Found ${results.length} properties.`,
        sampleData: results.slice(0, 2)
      };
    } catch (error) {
      return {
        success: false,
        message: `❌ OnTheMarket scraper test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Get service status
  getStatus(): { available: boolean; enabled: boolean; configured: boolean; scraper: string } {
    return {
      available: this.isAvailable(),
      enabled: this.enabled,
      configured: !!this.apifyToken,
      scraper: 'Apify OnTheMarket Scraper (dhrumil/onthemarket-scraper)'
    };
  }

  // Enable/disable service
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    console.log(`🏠 OnTheMarket scraper ${enabled ? 'enabled' : 'disabled'}`);
  }

  // Set alternative scraper (lexis-solutions version)
  useAlternativeScraper(): void {
    this.actorId = 'lexis-solutions/onthemarket-com-scraper';
    console.log('🔄 Switched to alternative OnTheMarket scraper');
  }
}

// Export singleton instance
export const onTheMarketService = new OnTheMarketService();
export type { OnTheMarketProperty, OnTheMarketSearchFilters };

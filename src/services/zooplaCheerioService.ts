// Zoopla Cheerio API Service - Apify Scraper Integration
// Backup Zoopla data extraction using Cheerio scraper

interface PriceHistoryEntry {
  date: string;
  price: number;
  event: string;
}

interface RawZooplaScrapedProperty {
  id?: string;
  title?: string;
  price?: string | number;
  rent?: string | number;
  location?: string;
  address?: string;
  postcode?: string;
  bedrooms?: string | number;
  bathrooms?: string | number;
  description?: string;
  summary?: string;
  images?: string[] | string;
  photos?: string[] | string;
  available?: boolean;
  availableFrom?: string;
  available_date?: string;
  propertyType?: string;
  type?: string;
  furnished?: boolean | string;
  billsIncluded?: boolean | string;
  features?: string[] | string;
  amenities?: string[] | string;
  agent?: {
    name?: string;
    phone?: string;
    verified?: boolean;
    agentName?: string;
    agentPhone?: string;
  };
  url?: string;
  propertyUrl?: string;
  postedDate?: string;
  addedDate?: string;
  size?: string;
  floorArea?: string;
  councilTaxBand?: string;
  epcRating?: string;
  rentalYield?: string | number;
  priceHistory?: PriceHistoryEntry[];
}

interface ZooplaCheerioProperty {
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
  rentalYield?: number;
  priceHistory?: PriceHistoryEntry[];
}

interface ZooplaCheerioSearchFilters {
  location: string;
  maxPrice?: number;
  minPrice?: number;
  bedrooms?: number;
  propertyType?: 'flats' | 'houses' | 'bungalows' | 'land';
  furnished?: boolean;
  billsIncluded?: boolean;
  availableFrom?: string;
  radius?: number;
}

class ZooplaCheerioService {
  private apifyToken: string;
  private actorId: string;
  private enabled: boolean;
  private baseZooplaUrl: string;

  constructor() {
    this.apifyToken = import.meta.env.VITE_APIFY_TOKEN || '';
    this.actorId = 'memo23/zoopla-cheerio-scraper'; // Zoopla Cheerio scraper
    this.enabled = !!this.apifyToken;
    this.baseZooplaUrl = 'https://www.zoopla.co.uk';
    if (!this.apifyToken) {
      console.warn('ZooplaCheerioService: No Apify token configured, Apify features disabled.');
    } else {
      console.log('🏠 Zoopla Cheerio scraper service initialized');
    }
  }

  // Check if Zoopla Cheerio scraper is available
  isAvailable(): boolean {
    return this.enabled && !!this.apifyToken;
  }

  // Search for properties using Apify scraper
  async searchProperties(filters: ZooplaCheerioSearchFilters): Promise<ZooplaCheerioProperty[]> {
    if (!this.isAvailable()) {
      console.log('🏠 Zoopla Cheerio scraper not available, skipping search');
      return [];
    }

    try {
      console.log('🏠 Starting Zoopla Cheerio scraper search...');
      
      // Build Zoopla search URL
      const searchUrl = this.buildZooplaSearchUrl(filters);
      console.log('🔍 Zoopla Cheerio search URL:', searchUrl);

      // Dynamic import of Apify client
      let ApifyClient;
      try {
        ({ ApifyClient } = await import('apify-client'));
      } catch (importErr) {
        console.error('Failed to import apify-client:', importErr);
        return [];
      }
      
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

      console.log('🚀 Running Zoopla Cheerio scraper...');

      // Run the Actor and wait for it to finish
      const run = await client.actor(this.actorId).call(input);

      // Fetch Actor results from the run's dataset
      const { items } = await client.dataset(run.defaultDatasetId).listItems();
      
      console.log(`✅ Zoopla Cheerio scraper completed: ${items.length} properties found`);

      // Transform scraped data to our standard format
      const properties = this.transformScrapedData(items);
      
      console.log(`🏠 Processed ${properties.length} Zoopla properties`);
      return properties;
      
    } catch (error) {
      console.error('❌ Zoopla Cheerio scraper error:', error);
      throw new Error(`Zoopla Cheerio scraper failed: ${error.message}`);
    }
  }

  // Build Zoopla search URL for scraping
  private buildZooplaSearchUrl(filters: ZooplaCheerioSearchFilters): string {
    const params = new URLSearchParams();
    
    // Location (required)
    const locationSlug = this.formatLocationForZoopla(filters.location);
    
    // Price range
    if (filters.minPrice) {
      params.append('price_min', filters.minPrice.toString());
    }
    if (filters.maxPrice) {
      params.append('price_max', filters.maxPrice.toString());
    }
    
    // Bedrooms
    if (filters.bedrooms) {
      params.append('beds_min', filters.bedrooms.toString());
    }
    
    // Property type
    if (filters.propertyType) {
      params.append('property_type', filters.propertyType);
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
    params.append('sort', 'price_asc');
    params.append('view_type', 'list');
    
    const searchPath = `/to-rent/${locationSlug}`;
    const fullUrl = `${this.baseZooplaUrl}${searchPath}?${params.toString()}`;
    
    return fullUrl;
  }

  // Format location for Zoopla search
  private formatLocationForZoopla(location: string): string {
    // Zoopla uses location slugs in URLs
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
      'sheffield': 'sheffield',
      'newcastle': 'newcastle-upon-tyne',
      'cardiff': 'cardiff'
    };

    const lowerLocation = location.toLowerCase();
    return locationMap[lowerLocation] || location.toLowerCase().replace(/\s+/g, '-');
  }

  // Transform scraped data from Apify to our standard format
  private transformScrapedData(items: RawZooplaScrapedProperty[]): ZooplaCheerioProperty[] {
    if (!items || !Array.isArray(items)) {
      return [];
    }

    return items.map((property: RawZooplaScrapedProperty) => this.transformScrapedProperty(property));
  }

  // Transform single scraped property data
  private transformScrapedProperty(property: RawZooplaScrapedProperty): ZooplaCheerioProperty {
    return {
      id: `zoopla-cheerio-${property.id || Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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
        name: property.agent.name || 'Agent',
        phone: property.agent.phone,
        verified: true // Zoopla agents are generally verified
      } : undefined,
      url: property.url || property.propertyUrl || '',
      postedDate: property.postedDate || property.addedDate,
      propertySize: property.size || property.floorArea,
      councilTaxBand: property.councilTaxBand,
      epcRating: property.epcRating,
      rentalYield: this.parseNumber(property.rentalYield),
      priceHistory: property.priceHistory || []
    };
  }

  // Helper methods
  private parsePrice(priceStr: unknown): number {
    if (typeof priceStr === 'number') return priceStr;
    if (!priceStr) return 0;
    
    const cleanPrice = priceStr.toString().replace(/[£,\s]/g, '');
    const price = parseFloat(cleanPrice);
    return isNaN(price) ? 0 : price;
  }

  private parseNumber(numStr: unknown): number {
    if (typeof numStr === 'number') return numStr;
    if (!numStr) return 0;
    
    const num = parseFloat(numStr.toString());
    return isNaN(num) ? 0 : num;
  }

  private parseBoolean(value: unknown): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      const lower = value.toLowerCase();
      return lower === 'true' || lower === 'yes' || lower === 'furnished' || lower === 'y';
    }
    return false;
  }

  private extractImages(images: unknown): string[] {
    if (!images) return [];
    if (Array.isArray(images)) return images.filter(img => typeof img === 'string');
    if (typeof images === 'string') return [images];
    return [];
  }

  private extractFeatures(features: unknown): string[] {
    if (!features) return [];
    if (Array.isArray(features)) return features;
    if (typeof features === 'string') return features.split(',').map(f => f.trim());
    return [];
  }

  // Test the scraper
  async testScraper(): Promise<{ success: boolean; message: string; sampleData?: ZooplaCheerioProperty[] }> {
    try {
      console.log('🧪 Testing Zoopla Cheerio scraper...');
      
      const testFilters: ZooplaCheerioSearchFilters = {
        location: 'Manchester',
        maxPrice: 1000,
        propertyType: 'flats'
      };

      const results = await this.searchProperties(testFilters);
      
      return {
        success: true,
        message: `✅ Zoopla Cheerio scraper test successful! Found ${results.length} properties.`,
        sampleData: results.slice(0, 2)
      };
    } catch (error) {
      return {
        success: false,
        message: `❌ Zoopla Cheerio scraper test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Get service status
  getStatus(): { available: boolean; enabled: boolean; configured: boolean; scraper: string } {
    return {
      available: this.isAvailable(),
      enabled: this.enabled,
      configured: !!this.apifyToken,
      scraper: 'Apify Zoopla Cheerio Scraper (memo23/zoopla-cheerio-scraper)'
    };
  }

  // Enable/disable service
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    console.log(`🏠 Zoopla Cheerio scraper ${enabled ? 'enabled' : 'disabled'}`);
  }

  // Compare with existing Zoopla RapidAPI data
  async compareWithRapidAPI(filters: ZooplaCheerioSearchFilters): Promise<{ cheerio: ZooplaCheerioProperty[]; rapidapi: ZooplaCheerioProperty[]; comparison: { cheerioCount: number; rapidApiCount: number; overlap: number; uniqueToCheerio: number; uniqueToRapidApi: number } }> {
    try {
      // Get data from Cheerio scraper
      const cheerioData = await this.searchProperties(filters);
      
      // This would integrate with your existing Zoopla RapidAPI service
      // const rapidApiData = await zooplaService.searchProperties(filters);
      const rapidApiData: ZooplaCheerioProperty[] = []; // Placeholder
      
      const comparison = {
        cheerioCount: cheerioData.length,
        rapidApiCount: rapidApiData.length,
        overlap: 0, // Calculate overlap based on property IDs/addresses
        uniqueToCheerio: cheerioData.length,
        uniqueToRapidApi: rapidApiData.length
      };
      
      return {
        cheerio: cheerioData,
        rapidapi: rapidApiData,
        comparison
      };
      
    } catch (error) {
      throw new Error(`Comparison failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Export singleton instance
export const zooplaCheerioService = new ZooplaCheerioService();
export type { ZooplaCheerioProperty, ZooplaCheerioSearchFilters };


// SpareRoom API Service - Apify Scraper Integration
// High-quality property data for student flatshares and rentals

interface SpareRoomProperty {
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
  landlord?: {
    name: string;
    verified: boolean;
  };
  url: string;
  postedDate?: string;
  contactInfo?: {
    name?: string;
    phone?: string;
    email?: string;
  };
}

interface SpareRoomSearchFilters {
  location: string;
  maxPrice?: number;
  minPrice?: number;
  bedrooms?: number;
  propertyType?: 'room' | 'studio' | 'flat' | 'house';
  furnished?: boolean;
  billsIncluded?: boolean;
  availableFrom?: string;
}

class SpareRoomService {
  private apifyToken: string;
  private actorId: string;
  private enabled: boolean;
  private baseSpareRoomUrl: string;

  constructor() {
    this.apifyToken = 'apify_api_fVf8kjfA4OKeIc8hAWyWtt96sGVYPp3T5NhJ';
    this.actorId = 'vpaEwE1LNrXYV1UHa'; // SpareRoom scraper actor ID
    this.enabled = true; // Always enabled with Apify integration
    this.baseSpareRoomUrl = 'https://www.spareroom.co.uk';

    console.log('🏠 SpareRoom Apify scraper service initialized');
  }

  // Check if SpareRoom scraper is available
  isAvailable(): boolean {
    return this.enabled && !!this.apifyToken;
  }

  // Search for properties using Apify scraper
  async searchProperties(filters: SpareRoomSearchFilters): Promise<SpareRoomProperty[]> {
    if (!this.isAvailable()) {
      console.log('🏠 SpareRoom scraper not available, skipping search');
      return [];
    }

    try {
      console.log('🏠 Starting SpareRoom scraper search...');

      // Build SpareRoom search URL
      const searchUrl = this.buildSpareRoomSearchUrl(filters);
      console.log('🔍 SpareRoom search URL:', searchUrl);

      // Dynamic import of Apify client (for better bundle optimization)
      const { ApifyClient } = await import('apify-client');

      // Initialize the ApifyClient
      const client = new ApifyClient({
        token: this.apifyToken,
      });

      // Prepare Actor input
      const input = {
        startUrls: [{ url: searchUrl }],
        includeDuplicates: false,
        proxyConfiguration: {
          useApifyProxy: true
        }
      };

      console.log('🚀 Running SpareRoom scraper...');

      // Run the Actor and wait for it to finish
      const run = await client.actor(this.actorId).call(input);

      // Fetch Actor results from the run's dataset
      const { items } = await client.dataset(run.defaultDatasetId).listItems();

      console.log(`✅ SpareRoom scraper completed: ${items.length} properties found`);

      // Transform scraped data to our standard format
      const properties = this.transformScrapedData(items);

      console.log(`🏠 Processed ${properties.length} SpareRoom properties`);
      return properties;

    } catch (error) {
      console.error('❌ SpareRoom scraper error:', error);
      throw new Error(`SpareRoom scraper failed: ${error.message}`);
    }
  }

  // Get property details by ID
  async getPropertyDetails(propertyId: string): Promise<SpareRoomProperty | null> {
    if (!this.isAvailable()) {
      return null;
    }

    try {
      const response = await fetch(`${this.baseUrl}/flatshares/${propertyId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`SpareRoom API error: ${response.status}`);
      }

      const data = await response.json();
      return this.transformSingleProperty(data);
      
    } catch (error) {
      console.error('🏠 SpareRoom property details error:', error);
      return null;
    }
  }

  // Build SpareRoom search URL for scraping
  private buildSpareRoomSearchUrl(filters: SpareRoomSearchFilters): string {
    const params = new URLSearchParams();

    // Location (required) - convert to SpareRoom format
    const location = this.formatLocationForSpareRoom(filters.location);
    params.append('search_id', Date.now().toString()); // Unique search ID
    params.append('mode', 'list'); // List view for better scraping

    // Add location to the base URL path
    let searchPath = '/flatshare/';
    if (location) {
      searchPath += `?where=${encodeURIComponent(location)}`;
      params.delete('search_id'); // Remove if we have location in path
    }

    // Price range
    if (filters.minPrice) {
      params.append('min_rent', filters.minPrice.toString());
    }
    if (filters.maxPrice) {
      params.append('max_rent', filters.maxPrice.toString());
    }

    // Bedrooms
    if (filters.bedrooms) {
      params.append('rooms', filters.bedrooms.toString());
    }

    // Property type mapping
    if (filters.propertyType) {
      const typeMap: Record<string, string> = {
        'room': 'room',
        'studio': 'studio',
        'flat': 'flat',
        'house': 'house'
      };
      params.append('property_type', typeMap[filters.propertyType] || 'room');
    }

    // Furnished
    if (filters.furnished !== undefined) {
      params.append('furnished', filters.furnished ? 'furnished' : 'unfurnished');
    }

    // Bills included
    if (filters.billsIncluded !== undefined) {
      params.append('bills_inc', filters.billsIncluded ? 'Y' : 'N');
    }

    // Available from
    if (filters.availableFrom) {
      params.append('available_from', filters.availableFrom);
    }

    // Student-friendly parameters
    params.append('students_ok', 'Y');
    params.append('sort_by', 'price_low_to_high');
    params.append('per_page', '50'); // More results for better data

    const queryString = params.toString();
    const fullUrl = `${this.baseSpareRoomUrl}${searchPath}${queryString ? (searchPath.includes('?') ? '&' : '?') + queryString : ''}`;

    return fullUrl;
  }

  // Format location for SpareRoom search
  private formatLocationForSpareRoom(location: string): string {
    // Handle university names and convert to SpareRoom-friendly format
    const universityMap: Record<string, string> = {
      'manchester university': 'Manchester',
      'university of manchester': 'Manchester',
      'ucl': 'London',
      'university college london': 'London',
      'imperial college': 'London',
      'kings college london': 'London',
      'lse': 'London',
      'london school of economics': 'London',
      'birmingham university': 'Birmingham',
      'university of birmingham': 'Birmingham',
      'leeds university': 'Leeds',
      'university of leeds': 'Leeds',
      'edinburgh university': 'Edinburgh',
      'university of edinburgh': 'Edinburgh'
    };

    const lowerLocation = location.toLowerCase();
    return universityMap[lowerLocation] || location;
  }

  // Transform scraped data from Apify to our standard format
  private transformScrapedData(items: any[]): SpareRoomProperty[] {
    if (!items || !Array.isArray(items)) {
      return [];
    }

    return items.map((property: any) => this.transformScrapedProperty(property));
  }

  // Transform single scraped property data
  private transformScrapedProperty(property: any): SpareRoomProperty {
    return {
      id: `spareroom-${property.id || Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: property.title || property.headline || 'Property',
      price: this.parsePrice(property.price || property.rent),
      location: property.location || property.area || '',
      postcode: property.postcode,
      bedrooms: this.parseNumber(property.bedrooms) || 1,
      bathrooms: this.parseNumber(property.bathrooms) || 1,
      description: property.description || property.details || '',
      images: this.extractImages(property.images || property.photos),
      available: property.available !== false,
      availableFrom: property.availableFrom || property.available_from || property.dateAvailable,
      propertyType: property.propertyType || property.property_type || 'room',
      furnished: this.parseBoolean(property.furnished),
      billsIncluded: this.parseBoolean(property.billsIncluded || property.bills_included),
      features: this.extractFeatures(property.features || property.amenities),
      landlord: property.contactInfo ? {
        name: property.contactInfo.name || 'Landlord',
        verified: false
      } : undefined,
      url: property.url || property.link || '',
      postedDate: property.postedDate || property.posted_date,
      contactInfo: property.contactInfo ? {
        name: property.contactInfo.name,
        phone: property.contactInfo.phone,
        email: property.contactInfo.email
      } : undefined
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
      return lower === 'true' || lower === 'yes' || lower === 'y' || lower === '1';
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

  // Set Apify token (for dynamic configuration)
  setApifyToken(token: string): void {
    this.apifyToken = token;
    console.log('🏠 SpareRoom Apify token updated');
  }

  // Enable/disable service
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    console.log(`🏠 SpareRoom scraper ${enabled ? 'enabled' : 'disabled'}`);
  }

  // Get API setup instructions
  getAPISetupInstructions(): string {
    return `SpareRoom Scraper Setup:
1. Service is ready to use with Apify integration
2. Uses professional scraping infrastructure
3. Provides real-time property data from SpareRoom.co.uk
4. Supports all major search filters and parameters
5. Returns structured data perfect for AI processing

Features:
- Unlimited usage with Apify subscription
- Real-time data updates
- Student-friendly property filtering
- Cross-platform compatibility
- High-quality structured data output`;
  }

  // Get service status
  getStatus(): { available: boolean; enabled: boolean; configured: boolean; scraper: string } {
    return {
      available: this.isAvailable(),
      enabled: this.enabled,
      configured: !!this.apifyToken,
      scraper: 'Apify SpareRoom Scraper (vpaEwE1LNrXYV1UHa)'
    };
  }

  // Test the scraper with a simple search
  async testScraper(): Promise<{ success: boolean; message: string; sampleData?: any }> {
    try {
      console.log('🧪 Testing SpareRoom scraper...');

      const testFilters: SpareRoomSearchFilters = {
        location: 'London',
        maxPrice: 1000,
        propertyType: 'room'
      };

      const results = await this.searchProperties(testFilters);

      return {
        success: true,
        message: `✅ SpareRoom scraper test successful! Found ${results.length} properties.`,
        sampleData: results.slice(0, 2) // Return first 2 properties as sample
      };
    } catch (error) {
      return {
        success: false,
        message: `❌ SpareRoom scraper test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}

// Export singleton instance
export const spareRoomService = new SpareRoomService();
export type { SpareRoomProperty, SpareRoomSearchFilters };


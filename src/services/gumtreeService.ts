// Gumtree API Service - Apify Scraper Integration
// Budget-friendly property data for students

interface GumtreeProperty {
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
  seller?: {
    name: string;
    phone?: string;
    verified: boolean;
  };
  url: string;
  postedDate?: string;
  category: string;
}

interface GumtreeSearchFilters {
  location: string;
  maxPrice?: number;
  minPrice?: number;
  bedrooms?: number;
  propertyType?: 'flat' | 'house' | 'room' | 'studio';
  furnished?: boolean;
  billsIncluded?: boolean;
  availableFrom?: string;
  radius?: number;
}

// Import the Property interface from PropertyServiceManager
import type { Property } from './PropertyServiceManager';

class GumtreeService {
  private apifyToken: string;
  private actorId: string;
  private enabled: boolean;
  private baseGumtreeUrl: string;

  constructor() {
    this.apifyToken = 'apify_api_fVf8kjfA4OKeIc8hAWyWtt96sGVYPp3T5NhJ';
    this.actorId = 'sync-network/gumtree-com-listing-scraper'; // Gumtree scraper actor ID
    this.enabled = true;
    this.baseGumtreeUrl = 'https://www.gumtree.com';
    
    console.log('🏠 Gumtree Apify scraper service initialized');
  }

  // Check if Gumtree scraper is available
  isAvailable(): boolean {
    return this.enabled && !!this.apifyToken;
  }

  // Search for properties using Apify scraper - now returns standard Property[]
  async searchProperties(filters: GumtreeSearchFilters): Promise<Property[]> {
    if (!this.isAvailable()) {
      console.log('🏠 Gumtree scraper not available, skipping search');
      return [];
    }

    try {
      console.log('🏠 Starting Gumtree scraper search...');
      
      // Build Gumtree search URL
      const searchUrl = this.buildGumtreeSearchUrl(filters);
      console.log('🔍 Gumtree search URL:', searchUrl);

      // Dynamic import of Apify client
      const { ApifyClient } = await import('apify-client');
      
      // Initialize the ApifyClient
      const client = new ApifyClient({
        token: this.apifyToken,
      });

      // Prepare Actor input
      const input = {
        startUrls: [{ url: searchUrl }],
        maxItems: 50, // Limit for faster processing
        proxyConfiguration: {
          useApifyProxy: true
        }
      };

      console.log('🚀 Running Gumtree scraper...');

      // Run the Actor and wait for it to finish
      const run = await client.actor(this.actorId).call(input);

      // Fetch Actor results from the run's dataset
      const { items } = await client.dataset(run.defaultDatasetId).listItems();
      
      console.log(`✅ Gumtree scraper completed: ${items.length} properties found`);

      // Transform scraped data to our standard format
      const gumtreeProperties = this.transformScrapedData(items);
      const standardProperties = gumtreeProperties.map(prop => this.transformToStandardProperty(prop));
      
      console.log(`🏠 Processed ${standardProperties.length} Gumtree properties`);
      return standardProperties;
      
    } catch (error) {
      console.error('❌ Gumtree scraper error:', error);
      throw new Error(`Gumtree scraper failed: ${error.message}`);
    }
  }

  // Transform GumtreeProperty to standard Property interface
  private transformToStandardProperty(gumtreeProp: GumtreeProperty): Property {
    return {
      id: gumtreeProp.id,
      title: gumtreeProp.title,
      price: gumtreeProp.price,
      location: gumtreeProp.location,
      features: gumtreeProp.features,
      amenities: this.extractAmenities(gumtreeProp.description),
      images: gumtreeProp.images,
      available: gumtreeProp.available,
      qualityScore: this.calculateQualityScore(gumtreeProp),
      studentSuitability: this.calculateStudentSuitability(gumtreeProp)
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

  private calculateQualityScore(property: GumtreeProperty): number {
    let score = 40; // Base score for Gumtree (lower than agencies)
    
    if (property.images.length > 0) score += 20;
    if (property.description.length > 100) score += 15;
    if (property.seller?.verified) score += 15;
    if (property.features.length > 2) score += 10;
    
    return Math.min(score, 100);
  }

  private calculateStudentSuitability(property: GumtreeProperty): number {
    let score = 60; // Base score (good for budget-conscious students)
    
    if (property.furnished) score += 15;
    if (property.billsIncluded) score += 10;
    if (property.price < 500) score += 15; // Very affordable for students
    
    return Math.min(score, 100);
  }

  // Build Gumtree search URL for scraping
  private buildGumtreeSearchUrl(filters: GumtreeSearchFilters): string {
    const params = new URLSearchParams();
    
    // Location
    if (filters.location) {
      params.append('search_location', filters.location);
    }
    
    // Price range
    if (filters.minPrice) {
      params.append('min_price', filters.minPrice.toString());
    }
    if (filters.maxPrice) {
      params.append('max_price', filters.maxPrice.toString());
    }
    
    // Property type and category
    const category = this.mapPropertyTypeToCategory(filters.propertyType);
    
    // Build the search path for property rentals
    const searchPath = '/property-to-rent';
    const fullUrl = `${this.baseGumtreeUrl}${searchPath}?${params.toString()}`;
    
    return fullUrl;
  }

  // Map property type to Gumtree category
  private mapPropertyTypeToCategory(propertyType?: string): string {
    const typeMap: Record<string, string> = {
      'flat': 'flats-houses',
      'house': 'flats-houses',
      'room': 'property-to-share',
      'studio': 'flats-houses'
    };
    
    return typeMap[propertyType || 'flat'] || 'flats-houses';
  }

  // Transform scraped data from Apify to our standard format
  private transformScrapedData(items: any[]): GumtreeProperty[] {
    if (!items || !Array.isArray(items)) {
      return [];
    }

    return items
      .filter(item => this.isPropertyListing(item))
      .map((property: any) => this.transformScrapedProperty(property));
  }

  // Check if item is a property listing
  private isPropertyListing(item: any): boolean {
    const title = (item.title || '').toLowerCase();
    const description = (item.description || '').toLowerCase();
    
    // Filter for rental properties
    const rentalKeywords = ['rent', 'let', 'rental', 'room', 'flat', 'house', 'studio', 'accommodation'];
    const hasRentalKeyword = rentalKeywords.some(keyword => 
      title.includes(keyword) || description.includes(keyword)
    );
    
    // Exclude sales and non-property items
    const excludeKeywords = ['sale', 'buy', 'purchase', 'car', 'job', 'service'];
    const hasExcludeKeyword = excludeKeywords.some(keyword => 
      title.includes(keyword)
    );
    
    return hasRentalKeyword && !hasExcludeKeyword;
  }

  // Transform single scraped property data
  private transformScrapedProperty(property: any): GumtreeProperty {
    return {
      id: `gumtree-${property.id || Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: property.title || 'Property',
      price: this.parsePrice(property.price),
      location: property.location || property.area || '',
      postcode: property.postcode,
      bedrooms: this.extractBedrooms(property.title, property.description),
      bathrooms: this.extractBathrooms(property.title, property.description),
      description: property.description || '',
      images: this.extractImages(property.images),
      available: true, // Assume available if listed
      availableFrom: property.availableFrom,
      propertyType: this.extractPropertyType(property.title, property.description),
      furnished: this.extractFurnished(property.title, property.description),
      billsIncluded: this.extractBillsIncluded(property.title, property.description),
      features: this.extractFeatures(property.description),
      seller: property.seller ? {
        name: property.seller.name || 'Seller',
        phone: property.seller.phone,
        verified: false // Gumtree sellers are not automatically verified
      } : undefined,
      url: property.url || '',
      postedDate: property.postedDate || property.date,
      category: property.category || 'property'
    };
  }

  // Helper methods for data extraction
  private parsePrice(priceStr: any): number {
    if (typeof priceStr === 'number') return priceStr;
    if (!priceStr) return 0;
    
    const cleanPrice = priceStr.toString().replace(/[£,\s]/g, '');
    const price = parseFloat(cleanPrice);
    return isNaN(price) ? 0 : price;
  }

  private extractBedrooms(title: string, description: string): number {
    const text = `${title} ${description}`.toLowerCase();
    const bedroomMatch = text.match(/(\d+)\s*(bed|bedroom)/);
    return bedroomMatch ? parseInt(bedroomMatch[1]) : 1;
  }

  private extractBathrooms(title: string, description: string): number {
    const text = `${title} ${description}`.toLowerCase();
    const bathroomMatch = text.match(/(\d+)\s*(bath|bathroom)/);
    return bathroomMatch ? parseInt(bathroomMatch[1]) : 1;
  }

  private extractPropertyType(title: string, description: string): string {
    const text = `${title} ${description}`.toLowerCase();
    
    if (text.includes('studio')) return 'studio';
    if (text.includes('house')) return 'house';
    if (text.includes('room')) return 'room';
    return 'flat';
  }

  private extractFurnished(title: string, description: string): boolean {
    const text = `${title} ${description}`.toLowerCase();
    return text.includes('furnished') && !text.includes('unfurnished');
  }

  private extractBillsIncluded(title: string, description: string): boolean {
    const text = `${title} ${description}`.toLowerCase();
    return text.includes('bills included') || text.includes('all bills') || text.includes('inc bills');
  }

  private extractImages(images: any): string[] {
    if (!images) return [];
    if (Array.isArray(images)) return images.filter(img => typeof img === 'string');
    if (typeof images === 'string') return [images];
    return [];
  }

  private extractFeatures(description: string): string[] {
    if (!description) return [];
    
    const features: string[] = [];
    const text = description.toLowerCase();
    
    if (text.includes('parking')) features.push('Parking');
    if (text.includes('garden')) features.push('Garden');
    if (text.includes('balcony')) features.push('Balcony');
    if (text.includes('wifi') || text.includes('internet')) features.push('WiFi');
    if (text.includes('washing machine')) features.push('Washing Machine');
    if (text.includes('dishwasher')) features.push('Dishwasher');
    if (text.includes('gym')) features.push('Gym');
    if (text.includes('student')) features.push('Student Friendly');
    
    return features;
  }

  // Add the missing getServiceInfo method to match PropertyService interface
  getServiceInfo() {
    return {
      name: 'Gumtree',
      isConfigured: !!this.apifyToken
    };
  }

  // Test the scraper
  async testScraper(): Promise<{ success: boolean; message: string; sampleData?: any }> {
    try {
      console.log('🧪 Testing Gumtree scraper...');
      
      const testFilters: GumtreeSearchFilters = {
        location: 'Manchester',
        maxPrice: 800,
        propertyType: 'room'
      };

      const results = await this.searchProperties(testFilters);
      
      return {
        success: true,
        message: `✅ Gumtree scraper test successful! Found ${results.length} properties.`,
        sampleData: results.slice(0, 2)
      };
    } catch (error) {
      return {
        success: false,
        message: `❌ Gumtree scraper test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Get service status
  getStatus(): { available: boolean; enabled: boolean; configured: boolean; scraper: string } {
    return {
      available: this.isAvailable(),
      enabled: this.enabled,
      configured: !!this.apifyToken,
      scraper: 'Apify Gumtree Scraper (sync-network/gumtree-com-listing-scraper)'
    };
  }
}

// Export singleton instance
export const gumtreeService = new GumtreeService();
export type { GumtreeProperty, GumtreeSearchFilters };

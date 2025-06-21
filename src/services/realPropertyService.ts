// Real Property Data Service - Integrates 3rd party APIs
// Replaces all mock data with real property listings

export interface StandardProperty {
  id: string;
  title: string;
  price: number;
  priceType: 'weekly' | 'monthly' | 'yearly';
  location: string;
  postcode?: string;
  lat?: number;
  lng?: number;
  type: 'studio' | 'shared' | 'ensuite' | 'house' | 'flat';
  bedrooms: number;
  bathrooms: number;
  amenities: string[];
  description: string;
  images: string[];
  available: boolean;
  availableFrom?: string;
  university?: string;
  distanceToUni?: string;
  rating?: number;
  reviews?: number;
  landlord?: {
    name: string;
    verified: boolean;
    rating?: number;
  };
  source: 'zoopla' | 'openrent' | 'rightmove';
  sourceUrl?: string;
  lastUpdated: Date;
  features?: string[];
  bills?: {
    included: boolean;
    details?: string[];
  };
}

export interface SearchFilters {
  location: string;
  maxPrice?: number;
  minPrice?: number;
  propertyType?: string;
  bedrooms?: number;
  radius?: number;
  university?: string;
}

class RealPropertyService {
  private rapidApiKey: string;
  private rapidApiHost: string;
  private apifyToken: string;
  private openrentActor: string;

  constructor() {
    this.rapidApiKey = import.meta.env.VITE_RAPIDAPI_KEY || '';
    this.rapidApiHost = import.meta.env.VITE_RAPIDAPI_HOST || 'uk-properties.p.rapidapi.com';
    this.apifyToken = import.meta.env.VITE_APIFY_TOKEN || '';
    this.openrentActor = import.meta.env.VITE_OPENRENT_ACTOR || 'vivid-softwares~openrent-scraper';
  }

  // Main search function that combines all APIs
  async searchProperties(filters: SearchFilters): Promise<StandardProperty[]> {
    const results: StandardProperty[] = [];

    try {
      // Search Zoopla via RapidAPI (Primary source)
      if (this.rapidApiKey) {
        console.log('🔍 Searching Zoopla via RapidAPI...');
        const zooplaResults = await this.searchZoopla(filters);
        results.push(...zooplaResults);
        console.log(`✅ Found ${zooplaResults.length} properties from Zoopla`);
      }

      // Search OpenRent via Apify (Secondary source - requires paid subscription)
      if (this.apifyToken) {
        try {
          console.log('🔍 Searching OpenRent via Apify...');
          const openrentResults = await this.searchOpenRent(filters);
          results.push(...openrentResults);
          console.log(`✅ Found ${openrentResults.length} properties from OpenRent`);
        } catch (error: any) {
          if (error.message.includes('actor-is-not-rented')) {
            console.warn('⚠️ OpenRent scraper requires paid subscription - skipping');
          } else {
            console.error('❌ OpenRent API error:', error);
          }
        }
      }

      // Sort by relevance and price
      const sortedResults = this.sortAndFilterResults(results, filters);
      console.log(`🎯 Returning ${sortedResults.length} total properties`);
      return sortedResults;
    } catch (error) {
      console.error('Error searching properties:', error);
      return [];
    }
  }

  // Search Zoopla properties via RapidAPI
  private async searchZoopla(filters: SearchFilters): Promise<StandardProperty[]> {
    try {
      // Extract postcode or area from location
      const outcode = this.extractPostcode(filters.location);

      console.log(`🔍 Testing Zoopla API with outcode: ${outcode}`);
      const url = `https://${this.rapidApiHost}/rent/${outcode}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': this.rapidApiKey,
          'X-RapidAPI-Host': this.rapidApiHost
        }
      });

      if (!response.ok) {
        throw new Error(`Zoopla API error: ${response.status}`);
      }

      const data = await response.json();
      return this.transformZooplaData(data, filters);
    } catch (error) {
      console.error('Zoopla search error:', error);
      return [];
    }
  }

  // Search OpenRent properties via Apify
  private async searchOpenRent(filters: SearchFilters): Promise<StandardProperty[]> {
    try {
      // Construct OpenRent search URLs
      const searchUrls = this.buildOpenRentUrls(filters);
      
      const response = await fetch(
        `https://api.apify.com/v2/acts/${this.openrentActor}/run-sync-get-dataset-items?token=${this.apifyToken}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            startUrls: searchUrls,
            includeDuplicates: false,
            proxyConfiguration: {}
          })
        }
      );

      if (!response.ok) {
        throw new Error(`OpenRent API error: ${response.status}`);
      }

      const data = await response.json();
      return this.transformOpenRentData(data, filters);
    } catch (error) {
      console.error('OpenRent search error:', error);
      return [];
    }
  }

  // Transform Zoopla data to standard format
  private transformZooplaData(data: any, filters: SearchFilters): StandardProperty[] {
    if (!data || !Array.isArray(data)) return [];

    return data.map((property: any) => {
      const standardProperty: StandardProperty = {
        id: `zoopla-${property.id || Math.random().toString(36)}`,
        title: property.title || property.address || 'Property',
        price: this.parsePrice(property.price || property.rent),
        priceType: 'monthly',
        location: property.address || property.location || filters.location,
        postcode: property.postcode,
        lat: property.latitude,
        lng: property.longitude,
        type: this.standardizePropertyType(property.property_type || property.type),
        bedrooms: parseInt(property.bedrooms) || 1,
        bathrooms: parseInt(property.bathrooms) || 1,
        amenities: this.extractAmenities(property.features || property.description),
        description: property.description || property.summary || '',
        images: this.extractImages(property.images || property.photos),
        available: true,
        availableFrom: property.available_from,
        rating: property.rating ? parseFloat(property.rating) : undefined,
        reviews: property.review_count ? parseInt(property.review_count) : undefined,
        source: 'zoopla',
        sourceUrl: property.url || property.link,
        lastUpdated: new Date(),
        features: property.features || [],
        bills: {
          included: property.bills_included || false,
          details: property.bill_details || []
        }
      };

      return standardProperty;
    }).filter(property => property.price > 0);
  }

  // Transform OpenRent data to standard format
  private transformOpenRentData(data: any, filters: SearchFilters): StandardProperty[] {
    if (!data || !Array.isArray(data)) return [];

    return data.map((property: any) => {
      const standardProperty: StandardProperty = {
        id: `openrent-${property.id || Math.random().toString(36)}`,
        title: property.title || property.headline || 'Property',
        price: this.parsePrice(property.price || property.rent),
        priceType: property.price_period === 'week' ? 'weekly' : 'monthly',
        location: property.address || property.location || filters.location,
        postcode: property.postcode,
        lat: property.lat || property.latitude,
        lng: property.lng || property.longitude,
        type: this.standardizePropertyType(property.property_type || property.type),
        bedrooms: parseInt(property.bedrooms) || 1,
        bathrooms: parseInt(property.bathrooms) || 1,
        amenities: this.extractAmenities(property.amenities || property.description),
        description: property.description || property.details || '',
        images: this.extractImages(property.images || property.photos),
        available: property.available !== false,
        availableFrom: property.available_from || property.available_date,
        landlord: {
          name: property.landlord_name || 'Landlord',
          verified: property.landlord_verified || false,
          rating: property.landlord_rating ? parseFloat(property.landlord_rating) : undefined
        },
        source: 'openrent',
        sourceUrl: property.url || property.link,
        lastUpdated: new Date(),
        features: property.features || [],
        bills: {
          included: property.bills_included || false,
          details: property.bills || []
        }
      };

      return standardProperty;
    }).filter(property => property.price > 0);
  }

  // Helper functions
  private extractPostcode(location: string): string {
    // Extract postcode or use location as is
    const postcodeMatch = location.match(/([A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2})/i);
    if (postcodeMatch) {
      return postcodeMatch[1].replace(/\s/g, '').toUpperCase();
    }
    
    // If no postcode, try to extract area code
    const areaMatch = location.match(/([A-Z]{1,2}[0-9][A-Z0-9]?)/i);
    if (areaMatch) {
      return areaMatch[1].toUpperCase();
    }
    
    return location.replace(/\s/g, '').toUpperCase();
  }

  private buildOpenRentUrls(filters: SearchFilters): string[] {
    const baseUrl = 'https://www.openrent.com';
    const location = filters.location.toLowerCase().replace(/\s+/g, '-');
    
    const urls = [
      `${baseUrl}/properties-to-rent/${location}`,
    ];

    // Add specific search parameters
    if (filters.maxPrice) {
      urls.push(`${baseUrl}/properties-to-rent/${location}?max_price=${filters.maxPrice}`);
    }

    if (filters.bedrooms) {
      urls.push(`${baseUrl}/properties-to-rent/${location}?bedrooms=${filters.bedrooms}`);
    }

    return urls;
  }

  private parsePrice(priceStr: any): number {
    if (typeof priceStr === 'number') return priceStr;
    if (!priceStr) return 0;
    
    const cleanPrice = priceStr.toString().replace(/[£,\s]/g, '');
    const price = parseFloat(cleanPrice);
    return isNaN(price) ? 0 : price;
  }

  private standardizePropertyType(type: any): StandardProperty['type'] {
    if (!type) return 'flat';
    
    const typeStr = type.toString().toLowerCase();
    
    if (typeStr.includes('studio')) return 'studio';
    if (typeStr.includes('shared') || typeStr.includes('room')) return 'shared';
    if (typeStr.includes('ensuite')) return 'ensuite';
    if (typeStr.includes('house')) return 'house';
    
    return 'flat';
  }

  private extractAmenities(text: any): string[] {
    if (!text) return [];
    
    const amenityKeywords = [
      'wifi', 'internet', 'broadband',
      'parking', 'garage',
      'garden', 'balcony', 'terrace',
      'gym', 'fitness',
      'laundry', 'washing machine',
      'dishwasher', 'microwave',
      'central heating', 'heating',
      'furnished', 'unfurnished',
      'pets allowed', 'pet friendly',
      'bills included',
      'near university', 'student friendly'
    ];

    const textStr = text.toString().toLowerCase();
    return amenityKeywords.filter(keyword => textStr.includes(keyword));
  }

  private extractImages(images: any): string[] {
    if (!images) return [];
    if (Array.isArray(images)) return images.filter(img => typeof img === 'string');
    if (typeof images === 'string') return [images];
    return [];
  }

  private sortAndFilterResults(results: StandardProperty[], filters: SearchFilters): StandardProperty[] {
    let filtered = results;

    // Apply price filters
    if (filters.minPrice) {
      filtered = filtered.filter(p => p.price >= filters.minPrice!);
    }
    if (filters.maxPrice) {
      filtered = filtered.filter(p => p.price <= filters.maxPrice!);
    }

    // Apply bedroom filter
    if (filters.bedrooms) {
      filtered = filtered.filter(p => p.bedrooms >= filters.bedrooms!);
    }

    // Sort by price (ascending) and then by rating (descending)
    filtered.sort((a, b) => {
      if (a.price !== b.price) return a.price - b.price;
      return (b.rating || 0) - (a.rating || 0);
    });

    // Remove duplicates based on title and location
    const seen = new Set();
    filtered = filtered.filter(property => {
      const key = `${property.title}-${property.location}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return filtered;
  }

  // Get property details by ID
  async getPropertyDetails(id: string): Promise<StandardProperty | null> {
    // For now, return null as we'd need specific detail endpoints
    // This could be enhanced with individual property detail APIs
    return null;
  }

  // Check if APIs are configured
  isConfigured(): { zoopla: boolean; openrent: boolean } {
    return {
      zoopla: !!this.rapidApiKey,
      openrent: !!this.apifyToken
    };
  }
}

export const realPropertyService = new RealPropertyService();

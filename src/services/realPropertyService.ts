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
  source: 'zoopla' | 'openrent' | 'rightmove' | 'gumtree' | 'onthemarket' | 'demo';
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
        } catch (error: unknown) {
          if (typeof error === 'object' && error !== null && 'message' in error && typeof (error as { message?: string }).message === 'string') {
            if ((error as { message: string }).message.includes('actor-is-not-rented')) {
              console.warn('⚠️ OpenRent scraper requires paid subscription - skipping');
            } else {
              console.error('❌ OpenRent API error:', error);
            }
          } else {
            console.error('❌ OpenRent API error:', error);
          }
        }
      }

      // If we have few results, try backup scrapers
      if (results.length < 10) {
        console.log('🔄 Low results, trying backup scrapers...');
        await this.tryBackupScrapers(filters, results);
      }

      // If still no results, provide mock data for demo
      if (results.length === 0) {
        console.log('📝 No results from APIs, providing demo properties...');
        results.push(...this.getMockProperties(filters));
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

  // Try backup scrapers when main APIs fail or return few results
  private async tryBackupScrapers(filters: SearchFilters, results: StandardProperty[]): Promise<void> {
    try {
      // Dynamic import to avoid loading all scrapers upfront
      const { gumtreeService } = await import('./gumtreeService');
      const { onTheMarketService } = await import('./onTheMarketService');

      // Convert filters to scraper format
      const allowedGumtreeTypes = ['flat', 'house', 'room', 'studio'] as const;
      const allowedOnTheMarketTypes = ['flat', 'house', 'bungalow', 'maisonette', 'studio'] as const;
      // Only pass propertyType if it matches allowed values
      const gumtreeType = allowedGumtreeTypes.includes(filters.propertyType as typeof allowedGumtreeTypes[number])
        ? filters.propertyType as typeof allowedGumtreeTypes[number]
        : undefined;
      const otmType = allowedOnTheMarketTypes.includes(filters.propertyType as typeof allowedOnTheMarketTypes[number])
        ? filters.propertyType as typeof allowedOnTheMarketTypes[number]
        : undefined;
      const gumtreeFilters = {
        ...filters,
        ...(gumtreeType ? { propertyType: gumtreeType } : {})
      };
      const otmFilters = {
        ...filters,
        ...(otmType ? { propertyType: otmType } : {})
      };

      // Try Gumtree scraper (budget-friendly properties)
      try {
        console.log('🔍 Trying Gumtree scraper...');
        const gumtreeResults = await gumtreeService.searchProperties(gumtreeFilters);
        const converted = this.convertGumtreeResults(gumtreeResults);
        results.push(...converted);
        console.log(`✅ Found ${converted.length} properties from Gumtree`);
      } catch (error) {
        console.warn('⚠️ Gumtree scraper failed:', error);
      }

      // Try OnTheMarket scraper (professional listings)
      try {
        console.log('🔍 Trying OnTheMarket scraper...');
        const otmResults = await onTheMarketService.searchProperties(otmFilters);
        const converted = this.convertOnTheMarketResults(otmResults);
        results.push(...converted);
        console.log(`✅ Found ${converted.length} properties from OnTheMarket`);
      } catch (error) {
        console.warn('⚠️ OnTheMarket scraper failed:', error);
      }

    } catch (error) {
      console.warn('⚠️ Failed to load backup scrapers:', error);
    }
  }

  // Convert Gumtree results to standard format
  private convertGumtreeResults(gumtreeResults: import('./gumtreeService').GumtreeProperty[]): StandardProperty[] {
    return gumtreeResults.map((property) => ({
      id: property.id,
      title: property.title,
      price: property.price,
      priceType: 'monthly',
      location: property.location,
      postcode: property.postcode,
      // Gumtree does not provide lat/lng
      lat: undefined,
      lng: undefined,
      type: property.propertyType as StandardProperty['type'],
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      amenities: property.features || [],
      description: property.description,
      images: property.images,
      available: property.available,
      availableFrom: property.availableFrom,
      university: undefined,
      distanceToUni: undefined,
      rating: undefined,
      reviews: undefined,
      landlord: property.seller ? { name: property.seller.name, verified: property.seller.verified } : undefined,
      source: 'gumtree',
      sourceUrl: property.url,
      lastUpdated: property.postedDate ? new Date(property.postedDate) : new Date(),
      features: property.features,
      bills: { included: property.billsIncluded, details: [] }
    }));
  }

  // Convert OnTheMarket results to standard format
  private convertOnTheMarketResults(otmResults: import('./onTheMarketService').OnTheMarketProperty[]): StandardProperty[] {
    return otmResults.map((property) => ({
      id: property.id,
      title: property.title,
      price: property.price,
      priceType: 'monthly',
      location: property.location,
      postcode: property.postcode,
      lat: undefined,
      lng: undefined,
      type: property.propertyType as StandardProperty['type'],
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      amenities: property.features || [],
      description: property.description,
      images: property.images,
      available: property.available,
      availableFrom: property.availableFrom,
      university: undefined,
      distanceToUni: undefined,
      rating: undefined,
      reviews: undefined,
      landlord: property.agent ? { name: property.agent.name, verified: property.agent.verified } : undefined,
      source: 'onthemarket',
      sourceUrl: property.url,
      lastUpdated: property.postedDate ? new Date(property.postedDate) : new Date(),
      features: property.features,
      bills: { included: property.billsIncluded, details: [] }
    }));
  }

  // Search Zoopla properties via RapidAPI
  private async searchZoopla(filters: SearchFilters): Promise<StandardProperty[]> {
    // Check if we should skip Zoopla due to recent errors
    if (!this.shouldUseZoopla()) {
      console.log('⚠️ Skipping Zoopla due to recent API errors (rate limited or quota exceeded)');
      return [];
    }

    try {
      // Extract postcode or area from location
      const outcode = this.extractPostcode(filters.location);

      console.log(`🔍 Testing Zoopla API with outcode: ${outcode}`);
      const url = `https://${this.rapidApiHost}/rent/${outcode}`;

      // Check if we're in a browser environment and online
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        console.warn('⚠️ Device is offline, skipping Zoopla API call');
        return [];
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': this.rapidApiKey,
          'X-RapidAPI-Host': this.rapidApiHost
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        this.recordZooplaError(response.status);

        if (response.status === 403) {
          console.warn('🚫 Zoopla API: Access forbidden (likely subscription required or rate limited)');
        } else if (response.status === 429) {
          console.warn('⏰ Zoopla API: Rate limit exceeded');
        }

        throw new Error(`Zoopla API error: ${response.status}`);
      }

      const data = await response.json();
      this.recordZooplaSuccess();
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
  private transformZooplaData(data: Record<string, unknown>[], filters: SearchFilters): StandardProperty[] {
    return data.map((property) => ({
      id: typeof property.id === 'string' ? property.id : '',
      title: typeof property.title === 'string' ? property.title : (typeof property.address === 'string' ? property.address : 'Property'),
      price: this.parsePrice(typeof property.price === 'string' || typeof property.price === 'number' ? property.price : 0),
      priceType: 'monthly',
      location: typeof property.address === 'string' ? property.address : (typeof property.location === 'string' ? property.location : filters.location),
      postcode: typeof property.postcode === 'string' ? property.postcode : undefined,
      lat: typeof property.latitude === 'number' ? property.latitude : undefined,
      lng: typeof property.longitude === 'number' ? property.longitude : undefined,
      type: this.standardizePropertyType(typeof property.property_type === 'string' ? property.property_type : (typeof property.type === 'string' ? property.type : 'flat')),
      bedrooms: typeof property.bedrooms === 'string' ? parseInt(property.bedrooms) : 1,
      bathrooms: typeof property.bathrooms === 'string' ? parseInt(property.bathrooms) : 1,
      amenities: this.extractAmenities(typeof property.features === 'string' ? property.features : (typeof property.description === 'string' ? property.description : '')),
      description: typeof property.description === 'string' ? property.description : (typeof property.summary === 'string' ? property.summary : ''),
      images: this.extractImages(Array.isArray(property.images) ? property.images as string[] : (Array.isArray(property.photos) ? property.photos as string[] : [])),
      available: typeof property.available === 'boolean' ? property.available : true,
      availableFrom: typeof property.available_from === 'string' ? property.available_from : undefined,
      university: typeof property.university === 'string' ? property.university : undefined,
      distanceToUni: typeof property.distanceToUni === 'string' ? property.distanceToUni : undefined,
      rating: typeof property.rating === 'string' ? parseFloat(property.rating) : undefined,
      reviews: typeof property.reviews === 'number' ? property.reviews : undefined,
      landlord: typeof property.landlord === 'object' && property.landlord !== null ? property.landlord as StandardProperty['landlord'] : undefined,
      source: 'zoopla',
      sourceUrl: typeof property.sourceUrl === 'string' ? property.sourceUrl : undefined,
      lastUpdated: property.lastUpdated instanceof Date ? property.lastUpdated : new Date(),
      features: Array.isArray(property.features) ? property.features as string[] : [],
      bills: typeof property.bills === 'object' && property.bills !== null ? property.bills as StandardProperty['bills'] : { included: false }
    }));
  }

  // Transform OpenRent data to standard format
  private transformOpenRentData(data: Record<string, unknown>[], filters: SearchFilters): StandardProperty[] {
    return data.map((property) => ({
      id: typeof property.id === 'string' ? property.id : '',
      title: typeof property.title === 'string' ? property.title : (typeof property.address === 'string' ? property.address : 'Property'),
      price: this.parsePrice(typeof property.price === 'string' || typeof property.price === 'number' ? property.price : 0),
      priceType: 'monthly',
      location: typeof property.address === 'string' ? property.address : (typeof property.location === 'string' ? property.location : filters.location),
      postcode: typeof property.postcode === 'string' ? property.postcode : undefined,
      lat: typeof property.latitude === 'number' ? property.latitude : undefined,
      lng: typeof property.longitude === 'number' ? property.longitude : undefined,
      type: this.standardizePropertyType(typeof property.property_type === 'string' ? property.property_type : (typeof property.type === 'string' ? property.type : 'flat')),
      bedrooms: typeof property.bedrooms === 'string' ? parseInt(property.bedrooms) : 1,
      bathrooms: typeof property.bathrooms === 'string' ? parseInt(property.bathrooms) : 1,
      amenities: this.extractAmenities(typeof property.features === 'string' ? property.features : (typeof property.description === 'string' ? property.description : '')),
      description: typeof property.description === 'string' ? property.description : (typeof property.summary === 'string' ? property.summary : ''),
      images: this.extractImages(Array.isArray(property.images) ? property.images as string[] : (Array.isArray(property.photos) ? property.photos as string[] : [])),
      available: typeof property.available === 'boolean' ? property.available : true,
      availableFrom: typeof property.available_from === 'string' ? property.available_from : undefined,
      university: typeof property.university === 'string' ? property.university : undefined,
      distanceToUni: typeof property.distanceToUni === 'string' ? property.distanceToUni : undefined,
      rating: typeof property.rating === 'string' ? parseFloat(property.rating) : undefined,
      reviews: typeof property.reviews === 'number' ? property.reviews : undefined,
      landlord: typeof property.landlord === 'object' && property.landlord !== null ? property.landlord as StandardProperty['landlord'] : undefined,
      source: 'openrent',
      sourceUrl: typeof property.sourceUrl === 'string' ? property.sourceUrl : undefined,
      lastUpdated: property.lastUpdated instanceof Date ? property.lastUpdated : new Date(),
      features: Array.isArray(property.features) ? property.features as string[] : [],
      bills: typeof property.bills === 'object' && property.bills !== null ? property.bills as StandardProperty['bills'] : { included: false }
    }));
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

  private parsePrice(priceStr: string | number): number {
    if (typeof priceStr === 'number') return priceStr;
    if (!priceStr) return 0;
    
    const cleanPrice = priceStr.toString().replace(/[£,\s]/g, '');
    const price = parseFloat(cleanPrice);
    return isNaN(price) ? 0 : price;
  }

  private standardizePropertyType(type: string): StandardProperty['type'] {
    if (!type) return 'flat';
    
    const typeStr = type.toString().toLowerCase();
    
    if (typeStr.includes('studio')) return 'studio';
    if (typeStr.includes('shared') || typeStr.includes('room')) return 'shared';
    if (typeStr.includes('ensuite')) return 'ensuite';
    if (typeStr.includes('house')) return 'house';
    
    return 'flat';
  }

  private extractAmenities(text: string): string[] {
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

  private extractImages(images: string[] | undefined): string[] {
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

  // Zoopla error management
  private shouldUseZoopla(): boolean {
    const lastError = localStorage.getItem('zoopla_last_error');
    const lastErrorTime = localStorage.getItem('zoopla_last_error_time');

    if (lastError && (lastError.includes('403') || lastError.includes('429'))) {
      const errorTime = parseInt(lastErrorTime || '0');
      const hoursSinceError = (Date.now() - errorTime) / (1000 * 60 * 60);

      // Wait 2 hours before retrying after rate limit/forbidden errors
      if (hoursSinceError < 2) {
        return false;
      }
    }

    return true;
  }

  private recordZooplaError(status: number): void {
    localStorage.setItem('zoopla_last_error', status.toString());
    localStorage.setItem('zoopla_last_error_time', Date.now().toString());
  }

  private recordZooplaSuccess(): void {
    localStorage.removeItem('zoopla_last_error');
    localStorage.removeItem('zoopla_last_error_time');
  }

  // Get mock properties for demo when APIs fail
  private getMockProperties(filters: SearchFilters): StandardProperty[] {
    const location = filters.location || 'Manchester';
    const maxPrice = filters.maxPrice || 1000;

    return [
      {
        id: 'demo-1',
        title: `Modern Studio Apartment in ${location}`,
        price: Math.min(650, maxPrice - 50),
        priceType: 'monthly' as const,
        location: `${location} City Centre`,
        postcode: 'M1 1AA',
        lat: 53.4808,
        lng: -2.2426,
        type: 'studio' as const,
        bedrooms: 1,
        bathrooms: 1,
        amenities: ['WiFi', 'Furnished', 'Bills Included', 'Near University'],
        description: `Beautiful modern studio in the heart of ${location}. Perfect for students with all bills included and excellent transport links to universities.`,
        images: ['/api/placeholder/400/300'],
        available: true,
        availableFrom: new Date().toISOString(),
        source: 'demo' as const,
        sourceUrl: '#',
        lastUpdated: new Date(),
        features: ['WiFi', 'Furnished', 'Bills Included', 'Near University'],
        bills: { included: true, details: ['Electricity', 'Gas', 'Water', 'Internet'] }
      },
      {
        id: 'demo-2',
        title: `Shared House - ${location}`,
        price: Math.min(450, maxPrice - 100),
        priceType: 'monthly' as const,
        location: `${location} Student Area`,
        postcode: 'M14 6HR',
        lat: 53.4808,
        lng: -2.2426,
        type: 'shared' as const,
        bedrooms: 1,
        bathrooms: 1,
        amenities: ['WiFi', 'Garden', 'Parking', 'Student Friendly'],
        description: `Friendly house share in popular student area. Great transport links and close to shops and amenities.`,
        images: ['/api/placeholder/400/300'],
        available: true,
        availableFrom: new Date().toISOString(),
        source: 'demo' as const,
        sourceUrl: '#',
        lastUpdated: new Date(),
        features: ['WiFi', 'Garden', 'Parking', 'Student Friendly'],
        bills: { included: false, details: [] }
      },
      {
        id: 'demo-3',
        title: `One Bedroom Flat - ${location}`,
        price: Math.min(750, maxPrice),
        priceType: 'monthly' as const,
        location: `${location} Suburb`,
        postcode: 'M20 2RN',
        lat: 53.4808,
        lng: -2.2426,
        type: 'flat' as const,
        bedrooms: 1,
        bathrooms: 1,
        amenities: ['WiFi', 'Furnished', 'Balcony', 'Transport Links'],
        description: `Spacious one bedroom flat with modern amenities. Quiet area with excellent transport connections.`,
        images: ['/api/placeholder/400/300'],
        available: true,
        availableFrom: new Date().toISOString(),
        source: 'demo' as const,
        sourceUrl: '#',
        lastUpdated: new Date(),
        features: ['WiFi', 'Furnished', 'Balcony', 'Transport Links'],
        bills: { included: false, details: [] }
      }
    ].filter(property => property.price <= maxPrice);
  }

  // Check if APIs are configured
  isConfigured(): { zoopla: boolean; openrent: boolean } {
    return {
      zoopla: !!this.rapidApiKey,
      openrent: !!this.apifyToken
    };
  }
}

export default new RealPropertyService();

// Bright Data Zoopla Dataset API Service
// Real property listings with actual images from Zoopla via Bright Data
import { PropertyDataUKProperty, PropertySearchFilters } from './propertyDataUKService';

export interface ZooplaProperty {
  id: string;
  title: string;
  price: number;
  priceType: string;
  location: string;
  postcode: string;
  bedrooms: number;
  bathrooms: number;
  propertyType: string;
  furnished: boolean;
  available: boolean;
  description: string;
  images: string[];
  landlord: {
    name: string;
    verified: boolean;
    phone?: string;
    email?: string;
  };
  listingUrl: string;
  dateAdded: string;
  features: string[];
  floorArea?: number;
  councilTaxBand?: string;
  energyRating?: string;
}

export interface ZooplaRequest {
  property_type: 'to rent' | 'For sale';
  location: string;
  min_price?: number;
  max_price?: number;
  bedrooms?: number;
  property_types?: string[];
}

class BrightDataZooplaService {
  private readonly apiKey = 'daf20140ecc930ba83243d2b1ec89e5e3f97d508176d7e318e6c17822f932fb2';
  private readonly baseUrl = 'https://api.brightdata.com/datasets/v3';
  private readonly datasetId = 'gd_lnabksndfp1pegwzh';
  private readonly timeout = 120000; // 2 minutes for data collection

  // Trigger property data collection from Zoopla
  async triggerPropertyCollection(filters: PropertySearchFilters[]): Promise<string> {
    try {
      console.log('🚀 Triggering Bright Data Zoopla collection...');

      const requests: ZooplaRequest[] = filters.map(filter => ({
        property_type: 'to rent',
        location: filter.location,
        min_price: filter.minPrice,
        max_price: filter.maxPrice,
        bedrooms: filter.bedrooms,
        property_types: filter.propertyType ? [this.mapPropertyType(filter.propertyType)] : undefined
      }));

      const response = await fetch(`${this.baseUrl}/trigger?dataset_id=${this.datasetId}&include_errors=true&type=discover_new&discover_by=input_filters`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requests)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Bright Data trigger failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Bright Data collection triggered:', data);
      
      return data.snapshot_id || data.id || 'latest';
    } catch (error) {
      console.error('❌ Failed to trigger Bright Data collection:', error);
      throw error;
    }
  }

  // Check collection progress
  async checkProgress(snapshotId?: string): Promise<{ status: string; progress: number }> {
    try {
      const url = snapshotId && snapshotId !== 'latest'
        ? `${this.baseUrl}/progress/${snapshotId}`
        : `${this.baseUrl}/progress/`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        }
      });

      if (!response.ok) {
        console.warn(`Progress check failed: ${response.status}`);
        return { status: 'unknown', progress: 0 };
      }

      const data = await response.json();
      return {
        status: data.status || 'running',
        progress: data.progress || 0
      };
    } catch (error) {
      console.error('❌ Failed to check progress:', error);
      return { status: 'error', progress: 0 };
    }
  }

  // Get collected property data
  async getPropertyData(snapshotId?: string): Promise<ZooplaProperty[]> {
    try {
      console.log('📥 Fetching Bright Data Zoopla results...');

      const url = snapshotId && snapshotId !== 'latest'
        ? `${this.baseUrl}/snapshot/${snapshotId}?format=json`
        : `${this.baseUrl}/snapshot/?format=json`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        }
      });

      if (!response.ok) {
        console.warn(`Data fetch failed: ${response.status}`);
        return [];
      }

      const data = await response.json();
      console.log('✅ Bright Data results received:', Array.isArray(data) ? data.length : 'unknown count', 'properties');

      return this.transformZooplaProperties(data);
    } catch (error) {
      console.error('❌ Failed to fetch property data:', error);
      return [];
    }
  }

  // Search properties with automatic collection and waiting
  async searchProperties(filters: PropertySearchFilters): Promise<PropertyDataUKProperty[]> {
    try {
      console.log('🔍 Starting Bright Data Zoopla search for:', filters.location);

      // First try to get existing data
      let properties = await this.getPropertyData();
      
      // Filter existing data by location
      const filteredProperties = properties.filter(prop => 
        prop.location.toLowerCase().includes(filters.location.toLowerCase())
      );

      if (filteredProperties.length > 0) {
        console.log(`✅ Found ${filteredProperties.length} existing properties for ${filters.location}`);
        return this.transformToStandardFormat(filteredProperties, filters);
      }

      // If no existing data, trigger new collection
      console.log('🚀 No existing data found, triggering new collection...');
      const snapshotId = await this.triggerPropertyCollection([filters]);

      // Wait for collection to complete
      properties = await this.waitForResults(snapshotId);

      // Transform to our standard format
      return this.transformToStandardFormat(properties, filters);
    } catch (error) {
      console.error('❌ Bright Data Zoopla search failed:', error);
      return [];
    }
  }

  // Search multiple cities for carousel
  async searchMultipleCities(cities: string[]): Promise<PropertyDataUKProperty[]> {
    try {
      console.log('🌍 Searching multiple cities via Bright Data Zoopla:', cities);

      // Try to get existing data first
      let allProperties = await this.getPropertyData();

      if (allProperties.length === 0) {
        // If no existing data, trigger collection for all cities
        const filters = cities.map(city => ({
          location: city,
          maxPrice: 800,
          propertyType: 'flat' as const
        }));

        const snapshotId = await this.triggerPropertyCollection(filters);
        allProperties = await this.waitForResults(snapshotId);
      }

      // Distribute properties across cities
      const cityProperties: PropertyDataUKProperty[] = [];
      
      cities.forEach(city => {
        const cityProps = allProperties
          .filter(prop => prop.location.toLowerCase().includes(city.toLowerCase()))
          .slice(0, 2) // 2 properties per city
          .map(prop => this.transformToStandardFormat([prop], { location: city })[0])
          .filter(Boolean);
        
        cityProperties.push(...cityProps);
      });

      // If we don't have enough properties, add some general ones
      if (cityProperties.length < 6) {
        const generalProps = allProperties
          .slice(0, 8 - cityProperties.length)
          .map((prop, index) => this.transformToStandardFormat([prop], { location: cities[index % cities.length] })[0])
          .filter(Boolean);
        
        cityProperties.push(...generalProps);
      }

      // Shuffle and return
      return cityProperties
        .sort(() => Math.random() - 0.5)
        .slice(0, 8);
    } catch (error) {
      console.error('❌ Multi-city Zoopla search failed:', error);
      return [];
    }
  }

  // Wait for collection results with timeout
  private async waitForResults(snapshotId: string): Promise<ZooplaProperty[]> {
    const startTime = Date.now();
    const maxWaitTime = this.timeout;

    console.log('⏳ Waiting for Bright Data Zoopla collection to complete...');

    while (Date.now() - startTime < maxWaitTime) {
      const progress = await this.checkProgress(snapshotId);
      
      console.log(`📊 Collection progress: ${progress.progress}% (${progress.status})`);

      if (progress.status === 'completed' || progress.status === 'success') {
        return await this.getPropertyData(snapshotId);
      }

      if (progress.status === 'failed' || progress.status === 'error') {
        console.warn('⚠️ Collection failed, trying to get existing data...');
        return await this.getPropertyData();
      }

      // Wait 10 seconds before checking again
      await new Promise(resolve => setTimeout(resolve, 10000));
    }

    // Timeout - try to get any available results
    console.warn('⚠️ Collection timeout - attempting to get available results');
    return await this.getPropertyData(snapshotId);
  }

  // Transform Zoopla properties to our standard format
  private transformToStandardFormat(properties: ZooplaProperty[], filters: PropertySearchFilters): PropertyDataUKProperty[] {
    return properties.map((prop, index) => ({
      id: prop.id || `zoopla-${index}`,
      title: prop.title || `Property in ${filters.location}`,
      price: prop.price || 0,
      priceType: prop.priceType === 'monthly' ? 'monthly' : 'weekly',
      location: prop.location || filters.location,
      postcode: prop.postcode || '',
      bedrooms: prop.bedrooms || 1,
      bathrooms: prop.bathrooms || 1,
      propertyType: prop.propertyType || 'flat',
      furnished: prop.furnished || false,
      available: prop.available !== false,
      description: prop.description || `${prop.bedrooms || 1} bedroom property in ${filters.location}`,
      images: prop.images || [],
      landlord: prop.landlord || {
        name: 'Property Agent',
        verified: false
      }
    }));
  }

  // Transform raw Bright Data Zoopla response
  private transformZooplaProperties(data: any): ZooplaProperty[] {
    if (!data) return [];
    
    // Handle different response formats
    let properties = [];
    if (Array.isArray(data)) {
      properties = data;
    } else if (data.results && Array.isArray(data.results)) {
      properties = data.results;
    } else if (data.data && Array.isArray(data.data)) {
      properties = data.data;
    } else {
      console.warn('Unexpected data format from Bright Data:', typeof data);
      return [];
    }

    return properties.map((item, index) => ({
      id: item.id || item.property_id || item.listing_id || `zoopla-${index}`,
      title: item.title || item.property_title || item.address || item.display_address,
      price: this.parsePrice(item.price || item.rent_price || item.rental_price),
      priceType: this.parsePriceType(item.price || item.rent_price || item.rental_price),
      location: item.location || item.area || item.address || item.display_address,
      postcode: item.postcode || item.postal_code || '',
      bedrooms: parseInt(item.bedrooms || item.num_bedrooms) || 1,
      bathrooms: parseInt(item.bathrooms || item.num_bathrooms) || 1,
      propertyType: this.normalizePropertyType(item.property_type || item.type || item.listing_type),
      furnished: item.furnished === true || item.furnished === 'Yes' || item.furnishing === 'Furnished',
      available: item.available !== false && item.status !== 'Let',
      description: item.description || item.summary || item.short_description || '',
      images: this.extractImages(item.images || item.photos || item.image_urls || item.gallery || []),
      landlord: {
        name: item.agent_name || item.landlord_name || item.branch_name || 'Property Agent',
        verified: item.agent_verified || false,
        phone: item.agent_phone || item.contact_phone,
        email: item.agent_email || item.contact_email
      },
      listingUrl: item.url || item.listing_url || item.details_url || '',
      dateAdded: item.date_added || item.listed_date || item.first_published_date || new Date().toISOString(),
      features: this.extractFeatures(item.features || item.key_features || item.amenities || []),
      floorArea: item.floor_area || item.size || item.square_feet,
      councilTaxBand: item.council_tax_band,
      energyRating: item.energy_rating || item.epc_rating
    }));
  }

  // Helper methods
  private mapPropertyType(type: string): string {
    const mapping = {
      'flat': 'Flat',
      'house': 'House',
      'studio': 'Studio',
      'shared': 'House Share'
    };
    return mapping[type] || 'Flat';
  }

  private normalizePropertyType(type: string): string {
    if (!type) return 'flat';
    const lower = type.toLowerCase();
    if (lower.includes('house')) return 'house';
    if (lower.includes('studio')) return 'studio';
    if (lower.includes('share') || lower.includes('room')) return 'shared';
    return 'flat';
  }

  private parsePrice(priceString: any): number {
    if (typeof priceString === 'number') return priceString;
    if (!priceString) return 0;
    const numbers = String(priceString).replace(/[^\d]/g, '');
    return numbers ? parseInt(numbers) : 0;
  }

  private parsePriceType(priceString: any): string {
    if (!priceString) return 'weekly';
    const str = String(priceString).toLowerCase();
    if (str.includes('month') || str.includes('pcm')) return 'monthly';
    return 'weekly';
  }

  private extractImages(images: any): string[] {
    if (!images) return [];
    if (typeof images === 'string') return [images];
    if (Array.isArray(images)) {
      return images
        .filter(img => img && (typeof img === 'string' || img.url))
        .map(img => typeof img === 'string' ? img : (img.url || img.src))
        .filter(url => url && (url.startsWith('http') || url.startsWith('//')))
        .map(url => url.startsWith('//') ? `https:${url}` : url)
        .slice(0, 10); // Limit to 10 images
    }
    return [];
  }

  private extractFeatures(features: any): string[] {
    if (!features) return [];
    if (Array.isArray(features)) {
      return features
        .filter(feature => typeof feature === 'string')
        .slice(0, 10);
    }
    return [];
  }

  // Service info
  getServiceInfo() {
    return {
      name: 'Bright Data Zoopla',
      isConfigured: !!this.apiKey,
      datasetId: this.datasetId,
      apiKey: this.apiKey ? 'Configured' : 'Missing'
    };
  }
}

export const brightDataZooplaService = new BrightDataZooplaService();

// Real Property Listings Service
// Integrates with actual property listing APIs to get real property photos and details
import { PropertySearchFilters } from '@/types/property';

export interface RealPropertyListing {
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
  images: string[]; // Real property photos
  landlord: {
    name: string;
    verified: boolean;
    phone?: string;
    email?: string;
  };
  listingUrl?: string;
  listingSource: 'openrent' | 'rightmove' | 'zoopla';
  dateAdded?: string;
  features?: string[];
}

class RealPropertyListingsService {
  private readonly apifyApiKey = 'apify_api_fVf8kjfA4OKeIc8hAWyWtt96sGVYPp3T5NhJ';
  private readonly timeout = 30000;

  // OpenRent scraper via Apify
  async searchOpenRentProperties(filters: PropertySearchFilters): Promise<RealPropertyListing[]> {
    try {
      console.log('🏠 Searching OpenRent for real property listings...');
      
      const runInput = {
        location: filters.location,
        maxPrice: filters.maxPrice || 1000,
        minPrice: filters.minPrice || 100,
        propertyType: this.mapPropertyTypeToOpenRent(filters.propertyType),
        bedrooms: filters.bedrooms,
        maxResults: 20
      };

      // Start Apify actor run
      const runResponse = await fetch('https://api.apify.com/v2/acts/vivid-softwares~openrent-scraper/runs', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apifyApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startUrls: [{ url: 'https://www.openrent.com/' }],
          ...runInput
        })
      });

      if (!runResponse.ok) {
        throw new Error(`Apify run failed: ${runResponse.status}`);
      }

      const runData = await runResponse.json();
      const runId = runData.data.id;

      // Wait for run to complete and get results
      const results = await this.waitForApifyResults(runId);
      
      return this.transformOpenRentData(results, filters);
    } catch (error) {
      console.error('❌ OpenRent search failed:', error);
      return [];
    }
  }

  // Rightmove scraper via Apify
  async searchRightmoveProperties(filters: PropertySearchFilters): Promise<RealPropertyListing[]> {
    try {
      console.log('🏠 Searching Rightmove for real property listings...');
      
      const runInput = {
        location: filters.location,
        maxPrice: filters.maxPrice || 1000,
        minPrice: filters.minPrice || 100,
        propertyType: this.mapPropertyTypeToRightmove(filters.propertyType),
        bedrooms: filters.bedrooms,
        maxResults: 15
      };

      // Start Rightmove Apify actor run
      const runResponse = await fetch('https://api.apify.com/v2/acts/XoodS5Tyd3a9NLxlv/runs', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apifyApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(runInput)
      });

      if (!runResponse.ok) {
        throw new Error(`Rightmove Apify run failed: ${runResponse.status}`);
      }

      const runData = await runResponse.json();
      const runId = runData.data.id;

      // Wait for run to complete and get results
      const results = await this.waitForApifyResults(runId);
      
      return this.transformRightmoveData(results, filters);
    } catch (error) {
      console.error('❌ Rightmove search failed:', error);
      return [];
    }
  }

  // Wait for Apify actor run to complete and return results
  private async waitForApifyResults(runId: string, maxWaitTime = 60000): Promise<any[]> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      try {
        // Check run status
        const statusResponse = await fetch(`https://api.apify.com/v2/actor-runs/${runId}`, {
          headers: {
            'Authorization': `Bearer ${this.apifyApiKey}`,
          }
        });

        const statusData = await statusResponse.json();
        const status = statusData.data.status;

        if (status === 'SUCCEEDED') {
          // Get results
          const resultsResponse = await fetch(`https://api.apify.com/v2/actor-runs/${runId}/dataset/items`, {
            headers: {
              'Authorization': `Bearer ${this.apifyApiKey}`,
            }
          });

          if (resultsResponse.ok) {
            return await resultsResponse.json();
          }
        } else if (status === 'FAILED' || status === 'ABORTED') {
          throw new Error(`Apify run ${status.toLowerCase()}`);
        }

        // Wait 3 seconds before checking again
        await new Promise(resolve => setTimeout(resolve, 3000));
      } catch (error) {
        console.warn('Error checking Apify run status:', error);
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    throw new Error('Apify run timeout');
  }

  // Transform OpenRent data to our format
  private transformOpenRentData(data: any[], filters: PropertySearchFilters): RealPropertyListing[] {
    return data.map((item, index) => ({
      id: `openrent-${item.id || index}`,
      title: item.title || `Property in ${filters.location}`,
      price: this.parsePrice(item.price),
      priceType: this.parsePriceType(item.price),
      location: item.location || filters.location,
      postcode: item.postcode || '',
      bedrooms: item.bedrooms || filters.bedrooms || 1,
      bathrooms: item.bathrooms || 1,
      propertyType: item.propertyType || filters.propertyType || 'flat',
      furnished: item.furnished !== false,
      available: true,
      description: item.description || `${item.bedrooms || 1} bedroom property in ${filters.location}`,
      images: this.extractImages(item.images || item.photos || []),
      landlord: {
        name: item.landlord?.name || 'Property Owner',
        verified: item.landlord?.verified || false,
        phone: item.landlord?.phone,
        email: item.landlord?.email
      },
      listingUrl: item.url,
      listingSource: 'openrent',
      dateAdded: item.dateAdded,
      features: item.features || []
    }));
  }

  // Transform Rightmove data to our format
  private transformRightmoveData(data: any[], filters: PropertySearchFilters): RealPropertyListing[] {
    return data.map((item, index) => ({
      id: `rightmove-${item.id || index}`,
      title: item.title || `Property in ${filters.location}`,
      price: this.parsePrice(item.price),
      priceType: this.parsePriceType(item.price),
      location: item.location || filters.location,
      postcode: item.postcode || '',
      bedrooms: item.bedrooms || filters.bedrooms || 1,
      bathrooms: item.bathrooms || 1,
      propertyType: item.propertyType || filters.propertyType || 'flat',
      furnished: item.furnished !== false,
      available: true,
      description: item.description || `${item.bedrooms || 1} bedroom property in ${filters.location}`,
      images: this.extractImages(item.images || item.photos || []),
      landlord: {
        name: item.agent?.name || 'Estate Agent',
        verified: item.agent?.verified || false,
        phone: item.agent?.phone,
        email: item.agent?.email
      },
      listingUrl: item.url,
      listingSource: 'rightmove',
      dateAdded: item.dateAdded,
      features: item.features || []
    }));
  }

  // Helper methods
  private mapPropertyTypeToOpenRent(type?: string): string {
    const mapping = {
      'flat': 'flat',
      'house': 'house',
      'studio': 'studio',
      'shared': 'room'
    };
    return mapping[type || 'flat'] || 'flat';
  }

  private mapPropertyTypeToRightmove(type?: string): string {
    const mapping = {
      'flat': 'flats',
      'house': 'houses',
      'studio': 'flats',
      'shared': 'flats'
    };
    return mapping[type || 'flat'] || 'flats';
  }

  private parsePrice(priceString: string): number {
    if (!priceString) return 0;
    const numbers = priceString.match(/\d+/g);
    return numbers ? parseInt(numbers[0]) : 0;
  }

  private parsePriceType(priceString: string): string {
    if (!priceString) return 'weekly';
    const lower = priceString.toLowerCase();
    if (lower.includes('month')) return 'monthly';
    if (lower.includes('week')) return 'weekly';
    return 'weekly';
  }

  private extractImages(images: any[]): string[] {
    if (!Array.isArray(images)) return [];
    
    return images
      .filter(img => typeof img === 'string' || (img && img.url))
      .map(img => typeof img === 'string' ? img : img.url)
      .filter(url => url && url.startsWith('http'))
      .slice(0, 6); // Limit to 6 images max
  }

  // Get service info
  getServiceInfo() {
    return {
      name: 'Real Property Listings',
      isConfigured: !!this.apifyApiKey,
      sources: ['OpenRent', 'Rightmove'],
      apiKey: this.apifyApiKey ? 'Configured' : 'Missing'
    };
  }
}

export const realPropertyListingsService = new RealPropertyListingsService();

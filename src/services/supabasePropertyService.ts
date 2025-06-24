import { supabase, TABLES } from '@/lib/supabase';
import type { PropertyDataUKProperty } from '@/services/propertyDataUKService';

// Frontend filter interface matching the UI components
export interface PropertySearchFilters {
  location?: string;
  maxPrice?: number;
  minPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  propertyType?: 'any' | 'studio' | 'shared' | 'flat' | 'house' | 'room' | 'apartment';
  furnished?: boolean;
  available?: boolean;
  amenities?: string[];
  roomOnly?: boolean;
  priceType?: 'weekly' | 'monthly';
  limit?: number;
  offset?: number;
}

// Database property interface
export interface DatabaseProperty {
  id: string;
  title: string;
  price: number;
  price_type: 'weekly' | 'monthly';
  location: string;
  full_address?: string;
  postcode?: string;
  bedrooms: number;
  bathrooms: number;
  property_type: string;
  furnished: boolean;
  available: boolean;
  description?: string;
  landlord_name?: string;
  features?: string; // JSON string
  source: string;
  source_url?: string;
  created_at: string;
  updated_at: string;
}

export interface DatabasePropertyImage {
  id: string;
  property_id: string;
  image_url: string;
  alt_text?: string;
  is_primary?: boolean;
}

export interface DatabaseUniversity {
  id: string;
  name: string;
  location: string;
  postcode?: string;
  rightmove_url?: string;
}

class SupabasePropertyService {
  
  /**
   * Search properties with comprehensive filtering
   */
  async searchProperties(filters: PropertySearchFilters): Promise<PropertyDataUKProperty[]> {
    try {
      console.log('🔍 Searching Supabase properties with filters:', filters);

      // Build the query
      let query = supabase
        .from(TABLES.PROPERTIES)
        .select(`
          *,
          property_images:property_images(*)
        `);

      // Apply filters
      if (filters.location) {
        // Search in location, full_address, and postcode
        query = query.or(`location.ilike.%${filters.location}%,full_address.ilike.%${filters.location}%,postcode.ilike.%${filters.location}%`);
      }

      if (filters.minPrice) {
        query = query.gte('price', filters.minPrice);
      }

      if (filters.maxPrice) {
        query = query.lte('price', filters.maxPrice);
      }

      if (filters.bedrooms && filters.bedrooms > 0) {
        query = query.gte('bedrooms', filters.bedrooms);
      }

      if (filters.bathrooms && filters.bathrooms > 0) {
        query = query.gte('bathrooms', filters.bathrooms);
      }

      if (filters.propertyType && filters.propertyType !== 'any') {
        // Map frontend types to database types
        const typeMapping: Record<string, string[]> = {
          'studio': ['studio'],
          'shared': ['shared', 'room'],
          'flat': ['flat', 'apartment'],
          'house': ['house'],
          'room': ['room', 'shared'],
          'apartment': ['apartment', 'flat']
        };

        const dbTypes = typeMapping[filters.propertyType] || [filters.propertyType];
        query = query.in('property_type', dbTypes);
      }

      if (filters.furnished !== undefined) {
        query = query.eq('furnished', filters.furnished);
      }

      if (filters.available !== undefined) {
        query = query.eq('available', filters.available);
      }

      if (filters.priceType) {
        query = query.eq('price_type', filters.priceType);
      }

      // Apply amenities filter if provided
      if (filters.amenities && filters.amenities.length > 0) {
        // Search in features JSON field
        const amenityConditions = filters.amenities.map(amenity => 
          `features.cs."${amenity}"`
        ).join(',');
        query = query.or(amenityConditions);
      }

      // Apply pagination
      const limit = filters.limit || 50;
      const offset = filters.offset || 0;
      query = query.range(offset, offset + limit - 1);

      // Order by relevance (price, then created_at)
      query = query.order('price', { ascending: true });
      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error('❌ Supabase search error:', error);
        throw error;
      }

      console.log(`✅ Found ${data?.length || 0} properties in Supabase`);

      // Transform to frontend format
      return (data || []).map(this.transformToFrontendProperty);

    } catch (error) {
      console.error('❌ Property search failed:', error);
      throw error;
    }
  }

  /**
   * Get properties by location (for location-based filtering)
   */
  async getPropertiesByLocation(location: string, limit = 20): Promise<PropertyDataUKProperty[]> {
    try {
      const { data, error } = await supabase
        .from(TABLES.PROPERTIES)
        .select(`
          *,
          property_images:property_images(*)
        `)
        .eq('location', location)
        .eq('available', true)
        .order('price', { ascending: true })
        .limit(limit);

      if (error) throw error;

      return (data || []).map(this.transformToFrontendProperty);
    } catch (error) {
      console.error('❌ Get properties by location failed:', error);
      throw error;
    }
  }

  /**
   * Get all unique locations for location filter dropdown
   */
  async getAvailableLocations(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from(TABLES.PROPERTIES)
        .select('location')
        .eq('available', true);

      if (error) throw error;

      // Get unique locations and sort
      const locations = [...new Set(data?.map(p => p.location) || [])];
      return locations.sort();
    } catch (error) {
      console.error('❌ Get locations failed:', error);
      return [];
    }
  }

  /**
   * Get universities for university-based filtering
   */
  async getUniversities(): Promise<DatabaseUniversity[]> {
    try {
      const { data, error } = await supabase
        .from(TABLES.UNIVERSITIES)
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('❌ Get universities failed:', error);
      return [];
    }
  }

  /**
   * Get property by ID with images
   */
  async getPropertyById(id: string): Promise<PropertyDataUKProperty | null> {
    try {
      const { data, error } = await supabase
        .from(TABLES.PROPERTIES)
        .select(`
          *,
          property_images:property_images(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      return data ? this.transformToFrontendProperty(data) : null;
    } catch (error) {
      console.error('❌ Get property by ID failed:', error);
      return null;
    }
  }

  /**
   * Get property statistics for dashboard
   */
  async getPropertyStats() {
    try {
      const [
        { count: totalProperties },
        { count: availableProperties },
        { data: locationStats },
        { data: priceStats }
      ] = await Promise.all([
        supabase.from(TABLES.PROPERTIES).select('*', { count: 'exact', head: true }),
        supabase.from(TABLES.PROPERTIES).select('*', { count: 'exact', head: true }).eq('available', true),
        supabase.from(TABLES.PROPERTIES).select('location').eq('available', true),
        supabase.from(TABLES.PROPERTIES).select('price, price_type').eq('available', true)
      ]);

      // Calculate location distribution
      const locations = locationStats?.map(p => p.location) || [];
      const locationCounts = locations.reduce((acc, loc) => {
        acc[loc] = (acc[loc] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Calculate price statistics
      const prices = priceStats?.map(p => p.price) || [];
      const avgPrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
      const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
      const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

      return {
        totalProperties: totalProperties || 0,
        availableProperties: availableProperties || 0,
        uniqueLocations: Object.keys(locationCounts).length,
        topLocations: Object.entries(locationCounts)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 10)
          .map(([location, count]) => ({ location, count })),
        priceStats: {
          average: Math.round(avgPrice),
          min: minPrice,
          max: maxPrice
        }
      };
    } catch (error) {
      console.error('❌ Get property stats failed:', error);
      return {
        totalProperties: 0,
        availableProperties: 0,
        uniqueLocations: 0,
        topLocations: [],
        priceStats: { average: 0, min: 0, max: 0 }
      };
    }
  }

  /**
   * Transform database property to frontend format
   */
  private transformToFrontendProperty(dbProperty: any): PropertyDataUKProperty {
    // Parse features from JSON string
    let features: string[] = [];
    if (dbProperty.features) {
      try {
        features = JSON.parse(dbProperty.features);
      } catch (error) {
        console.warn('Failed to parse features JSON:', error);
        features = [];
      }
    }

    // Transform images to array of URLs for compatibility
    const imageUrls = (dbProperty.property_images || []).map((img: any) => img.image_url);

    // Also create detailed image objects for components that need them
    const imageObjects = (dbProperty.property_images || []).map((img: any) => ({
      url: img.image_url,
      alt: img.alt_text || 'Property image',
      isPrimary: img.is_primary || false
    }));

    return {
      id: dbProperty.id,
      title: dbProperty.title,
      price: dbProperty.price,
      priceType: dbProperty.price_type,
      location: dbProperty.location,
      address: dbProperty.full_address || dbProperty.location,
      postcode: dbProperty.postcode || '',
      bedrooms: dbProperty.bedrooms,
      bathrooms: dbProperty.bathrooms,
      propertyType: dbProperty.property_type,
      furnished: dbProperty.furnished,
      available: dbProperty.available,
      description: dbProperty.description || '',
      landlord: dbProperty.landlord_name || 'Private Landlord',
      features: features,
      images: imageUrls, // Array of URL strings for carousel compatibility
      imageObjects: imageObjects, // Detailed objects for other components
      source: dbProperty.source,
      sourceUrl: dbProperty.source_url,
      addedDate: dbProperty.created_at,
      // Add mock data for fields not in database
      rating: 4.2,
      reviewCount: Math.floor(Math.random() * 50) + 10,
      verified: true,
      amenities: features, // Use features as amenities
      nearbyPlaces: [
        { type: 'university' as const, name: 'Local University', distance: 800, walkTime: 10 },
        { type: 'transport' as const, name: 'Bus Stop', distance: 100, walkTime: 2 },
        { type: 'restaurant' as const, name: 'Local Cafe', distance: 150, walkTime: 2 }
      ]
    };
  }
}

// Export singleton instance
export const supabasePropertyService = new SupabasePropertyService();

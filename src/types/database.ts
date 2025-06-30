// Comprehensive types for StudentHome application

// Database types
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

// Frontend filter types
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

// Application state types
export interface AppState {
  user: User | null;
  properties: PropertyDataUKProperty[];
  filters: PropertySearchFilters;
  loading: boolean;
  error: string | null;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface PropertySearchResponse {
  properties: PropertyDataUKProperty[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Configuration types
export interface DatabaseConfig {
  url: string;
  anonKey: string;
  serviceRoleKey?: string;
}

export interface APIConfig {
  supabase: DatabaseConfig;
  googleMaps: { apiKey: string; enabled: boolean };
  openai: { apiKey: string; enabled: boolean };
  apify: { token: string; enabled: boolean };
}

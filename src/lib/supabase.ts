import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Database table names
export const TABLES = {
  PROPERTIES: 'properties',
  UNIVERSITIES: 'universities',
  LOCATIONS: 'locations',
  PROPERTY_IMAGES: 'property_images',
  SCRAPED_DATA: 'scraped_data'
} as const;

// Property data types for Supabase
export interface SupabaseProperty {
  id?: string;
  title: string;
  price: number;
  price_type: 'weekly' | 'monthly' | 'yearly';
  location: string;
  postcode?: string;
  bedrooms: number;
  bathrooms: number;
  property_type: string;
  furnished: boolean;
  available: boolean;
  description?: string;
  landlord_name?: string;
  landlord_verified?: boolean;
  crime_rating?: string;
  crimes_per_thousand?: number;
  safety_score?: number;
  source: string; // 'rightmove', 'zoopla', 'openrent', etc.
  source_url?: string;
  scraped_at: string;
  created_at?: string;
  updated_at?: string;
}

export interface SupabasePropertyImage {
  id?: string;
  property_id: string;
  image_url: string;
  alt_text?: string;
  is_primary: boolean;
  created_at?: string;
}

export interface SupabaseLocation {
  id?: string;
  name: string;
  postcode: string;
  latitude?: number;
  longitude?: number;
  region: string;
  country: string;
  created_at?: string;
}

export interface SupabaseUniversity {
  id?: string;
  name: string;
  location: string;
  postcode: string;
  latitude?: number;
  longitude?: number;
  website?: string;
  created_at?: string;
}

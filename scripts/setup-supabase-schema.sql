-- StudentHome Platform Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create locations table
CREATE TABLE IF NOT EXISTS locations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  postcode VARCHAR(20),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  region VARCHAR(100),
  country VARCHAR(100) DEFAULT 'UK',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create universities table
CREATE TABLE IF NOT EXISTS universities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  postcode VARCHAR(20),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  website VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create properties table
CREATE TABLE IF NOT EXISTS properties (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  price_type VARCHAR(20) DEFAULT 'weekly' CHECK (price_type IN ('weekly', 'monthly', 'yearly')),
  location VARCHAR(255) NOT NULL,
  postcode VARCHAR(20),
  bedrooms INTEGER DEFAULT 1,
  bathrooms INTEGER DEFAULT 1,
  property_type VARCHAR(100) DEFAULT 'flat',
  furnished BOOLEAN DEFAULT false,
  available BOOLEAN DEFAULT true,
  description TEXT,
  landlord_name VARCHAR(255),
  landlord_verified BOOLEAN DEFAULT false,
  crime_rating VARCHAR(50),
  crimes_per_thousand INTEGER,
  safety_score INTEGER,
  source VARCHAR(50) NOT NULL, -- 'rightmove', 'zoopla', 'openrent', etc.
  source_url VARCHAR(1000),
  scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create property_images table
CREATE TABLE IF NOT EXISTS property_images (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  image_url VARCHAR(1000) NOT NULL,
  alt_text VARCHAR(255),
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create scraped_data table for raw scraped content
CREATE TABLE IF NOT EXISTS scraped_data (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  source VARCHAR(50) NOT NULL,
  source_url VARCHAR(1000),
  raw_data JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_properties_location ON properties(location);
CREATE INDEX IF NOT EXISTS idx_properties_price ON properties(price);
CREATE INDEX IF NOT EXISTS idx_properties_bedrooms ON properties(bedrooms);
CREATE INDEX IF NOT EXISTS idx_properties_available ON properties(available);
CREATE INDEX IF NOT EXISTS idx_properties_source ON properties(source);
CREATE INDEX IF NOT EXISTS idx_properties_postcode ON properties(postcode);
CREATE INDEX IF NOT EXISTS idx_property_images_property_id ON property_images(property_id);
CREATE INDEX IF NOT EXISTS idx_scraped_data_source ON scraped_data(source);
CREATE INDEX IF NOT EXISTS idx_scraped_data_processed ON scraped_data(processed);

-- Enable Row Level Security (RLS)
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraped_data ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Public read access for locations" ON locations FOR SELECT USING (true);
CREATE POLICY "Public read access for universities" ON universities FOR SELECT USING (true);
CREATE POLICY "Public read access for properties" ON properties FOR SELECT USING (true);
CREATE POLICY "Public read access for property_images" ON property_images FOR SELECT USING (true);

-- Create policies for authenticated users to insert/update
CREATE POLICY "Authenticated users can insert properties" ON properties FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update properties" ON properties FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert property_images" ON property_images FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert scraped_data" ON scraped_data FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON locations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_universities_updated_at BEFORE UPDATE ON universities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ENHANCED STUDENTHOME DATABASE SCHEMA
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. UNIVERSITIES TABLE (Enhanced)
-- ============================================
CREATE TABLE IF NOT EXISTS universities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  postcode VARCHAR(20),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  website VARCHAR(500),
  rightmove_url VARCHAR(1000),
  student_population INTEGER,
  accommodation_info TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. PROPERTIES TABLE (Enhanced)
-- ============================================
CREATE TABLE IF NOT EXISTS properties (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  price_type VARCHAR(20) DEFAULT 'weekly' CHECK (price_type IN ('weekly', 'monthly', 'yearly')),
  location VARCHAR(255) NOT NULL,
  full_address TEXT,
  postcode VARCHAR(20),
  bedrooms INTEGER DEFAULT 1 CHECK (bedrooms >= 0),
  bathrooms INTEGER DEFAULT 1 CHECK (bathrooms >= 0),
  property_type VARCHAR(100) DEFAULT 'flat',
  property_size VARCHAR(50), -- e.g., "1,442 sq. ft."
  furnished BOOLEAN DEFAULT false,
  available BOOLEAN DEFAULT true,
  available_date DATE,
  description TEXT,
  landlord_name VARCHAR(255),
  landlord_verified BOOLEAN DEFAULT false,
  landlord_contact VARCHAR(255),
  crime_rating VARCHAR(50),
  crimes_per_thousand INTEGER,
  safety_score INTEGER CHECK (safety_score >= 0 AND safety_score <= 100),
  transport_links TEXT,
  nearby_amenities TEXT,
  university_id UUID REFERENCES universities(id),
  university_distance_miles DECIMAL(5, 2),
  source VARCHAR(50) NOT NULL,
  source_url TEXT,
  rightmove_id VARCHAR(50),
  scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. PROPERTY_IMAGES TABLE (Enhanced)
-- ============================================
CREATE TABLE IF NOT EXISTS property_images (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  alt_text VARCHAR(255),
  is_primary BOOLEAN DEFAULT false,
  image_type VARCHAR(50) DEFAULT 'interior', -- 'interior', 'exterior', 'floorplan', 'map'
  image_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 4. GUIDES TABLE (New)
-- ============================================
CREATE TABLE IF NOT EXISTS guides (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  guide_type VARCHAR(50) NOT NULL, -- 'rental_guide', 'student_guide'
  category VARCHAR(100),
  source_url TEXT,
  author VARCHAR(255),
  published_date DATE,
  tags TEXT[], -- Array of tags
  helpful_votes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 5. PROPERTY_FEATURES TABLE (Enhanced)
-- ============================================
CREATE TABLE IF NOT EXISTS property_features (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  feature_category VARCHAR(100) NOT NULL, -- 'amenities', 'transport', 'safety', 'bills'
  feature_name VARCHAR(100) NOT NULL,
  feature_value VARCHAR(255),
  is_included BOOLEAN DEFAULT true,
  additional_cost DECIMAL(8, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 6. LOCATION_DATA TABLE (New)
-- ============================================
CREATE TABLE IF NOT EXISTS location_data (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  postcode VARCHAR(20) NOT NULL UNIQUE,
  area_name VARCHAR(255),
  city VARCHAR(100),
  region VARCHAR(100),
  country VARCHAR(100) DEFAULT 'UK',
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  average_rent_1bed DECIMAL(8, 2),
  average_rent_2bed DECIMAL(8, 2),
  average_rent_3bed DECIMAL(8, 2),
  crime_rate_per_1000 INTEGER,
  safety_rating VARCHAR(20),
  transport_score INTEGER CHECK (transport_score >= 0 AND transport_score <= 100),
  amenities_score INTEGER CHECK (amenities_score >= 0 AND amenities_score <= 100),
  student_population INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 7. SCRAPED_DATA TABLE (Enhanced)
-- ============================================
CREATE TABLE IF NOT EXISTS scraped_data (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  source VARCHAR(50) NOT NULL,
  source_url TEXT,
  data_type VARCHAR(50) NOT NULL, -- 'property', 'university', 'guide', 'location'
  raw_data JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  processing_errors TEXT,
  scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- CREATE ENHANCED INDEXES
-- ============================================

-- Properties indexes
CREATE INDEX IF NOT EXISTS idx_properties_location ON properties(location);
CREATE INDEX IF NOT EXISTS idx_properties_price ON properties(price);
CREATE INDEX IF NOT EXISTS idx_properties_bedrooms ON properties(bedrooms);
CREATE INDEX IF NOT EXISTS idx_properties_available ON properties(available);
CREATE INDEX IF NOT EXISTS idx_properties_university_id ON properties(university_id);
CREATE INDEX IF NOT EXISTS idx_properties_postcode ON properties(postcode);
CREATE INDEX IF NOT EXISTS idx_properties_property_type ON properties(property_type);
CREATE INDEX IF NOT EXISTS idx_properties_furnished ON properties(furnished);
CREATE INDEX IF NOT EXISTS idx_properties_price_type ON properties(price_type);

-- Universities indexes
CREATE INDEX IF NOT EXISTS idx_universities_name ON universities(name);
CREATE INDEX IF NOT EXISTS idx_universities_location ON universities(location);

-- Guides indexes
CREATE INDEX IF NOT EXISTS idx_guides_type ON guides(guide_type);
CREATE INDEX IF NOT EXISTS idx_guides_category ON guides(category);
CREATE INDEX IF NOT EXISTS idx_guides_tags ON guides USING GIN(tags);

-- Property features indexes
CREATE INDEX IF NOT EXISTS idx_property_features_property_id ON property_features(property_id);
CREATE INDEX IF NOT EXISTS idx_property_features_category ON property_features(feature_category);

-- Location data indexes
CREATE INDEX IF NOT EXISTS idx_location_data_postcode ON location_data(postcode);
CREATE INDEX IF NOT EXISTS idx_location_data_city ON location_data(city);

-- Scraped data indexes
CREATE INDEX IF NOT EXISTS idx_scraped_data_source ON scraped_data(source);
CREATE INDEX IF NOT EXISTS idx_scraped_data_type ON scraped_data(data_type);
CREATE INDEX IF NOT EXISTS idx_scraped_data_processed ON scraped_data(processed);

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraped_data ENABLE ROW LEVEL SECURITY;

-- ============================================
-- CREATE ACCESS POLICIES
-- ============================================

-- Public read access policies
CREATE POLICY "public_read_universities" ON universities FOR SELECT USING (true);
CREATE POLICY "public_read_properties" ON properties FOR SELECT USING (true);
CREATE POLICY "public_read_property_images" ON property_images FOR SELECT USING (true);
CREATE POLICY "public_read_guides" ON guides FOR SELECT USING (true);
CREATE POLICY "public_read_property_features" ON property_features FOR SELECT USING (true);
CREATE POLICY "public_read_location_data" ON location_data FOR SELECT USING (true);

-- Service role full access policies
CREATE POLICY "service_all_universities" ON universities FOR ALL USING (true);
CREATE POLICY "service_all_properties" ON properties FOR ALL USING (true);
CREATE POLICY "service_all_property_images" ON property_images FOR ALL USING (true);
CREATE POLICY "service_all_guides" ON guides FOR ALL USING (true);
CREATE POLICY "service_all_property_features" ON property_features FOR ALL USING (true);
CREATE POLICY "service_all_location_data" ON location_data FOR ALL USING (true);
CREATE POLICY "service_all_scraped_data" ON scraped_data FOR ALL USING (true);

-- ============================================
-- CREATE FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to calculate distance between properties and universities
CREATE OR REPLACE FUNCTION calculate_distance(lat1 DECIMAL, lon1 DECIMAL, lat2 DECIMAL, lon2 DECIMAL)
RETURNS DECIMAL AS $$
BEGIN
    -- Haversine formula for distance calculation in miles
    RETURN (
        3959 * acos(
            cos(radians(lat1)) * cos(radians(lat2)) * 
            cos(radians(lon2) - radians(lon1)) + 
            sin(radians(lat1)) * sin(radians(lat2))
        )
    );
END;
$$ language 'plpgsql';

-- ============================================
-- CREATE TRIGGERS
-- ============================================
CREATE TRIGGER update_universities_updated_at 
    BEFORE UPDATE ON universities 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_properties_updated_at 
    BEFORE UPDATE ON properties 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_guides_updated_at 
    BEFORE UPDATE ON guides 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_location_data_updated_at 
    BEFORE UPDATE ON location_data 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

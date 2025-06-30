# Supabase Database Setup for StudentHome Platform

## 🎯 Quick Setup Instructions

### Step 1: Access Your Supabase Dashboard
1. Go to: https://supabase.com/dashboard/project/uymlnzyeuvburduuteym
2. Click on **"SQL Editor"** in the left sidebar
3. Click **"New Query"**

### Step 2: Create the Database Schema
Copy and paste this SQL code into the SQL Editor and click **"Run"**:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create properties table
CREATE TABLE IF NOT EXISTS properties (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  price_type VARCHAR(20) DEFAULT 'weekly',
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
  source VARCHAR(50) NOT NULL,
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

-- Create scraped_data table
CREATE TABLE IF NOT EXISTS scraped_data (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  source VARCHAR(50) NOT NULL,
  source_url VARCHAR(1000),
  raw_data JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create locations table
CREATE TABLE IF NOT EXISTS locations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  postcode VARCHAR(20),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  region VARCHAR(100),
  country VARCHAR(100) DEFAULT 'UK',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_properties_location ON properties(location);
CREATE INDEX IF NOT EXISTS idx_properties_price ON properties(price);
CREATE INDEX IF NOT EXISTS idx_properties_bedrooms ON properties(bedrooms);
CREATE INDEX IF NOT EXISTS idx_properties_available ON properties(available);

-- Enable Row Level Security
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraped_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE universities ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Public read access for properties" ON properties FOR SELECT USING (true);
CREATE POLICY "Public read access for property_images" ON property_images FOR SELECT USING (true);
CREATE POLICY "Public read access for locations" ON locations FOR SELECT USING (true);
CREATE POLICY "Public read access for universities" ON universities FOR SELECT USING (true);

-- Allow service role to insert data
CREATE POLICY "Service role can insert properties" ON properties FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role can insert property_images" ON property_images FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role can insert scraped_data" ON scraped_data FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role can insert locations" ON locations FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role can insert universities" ON universities FOR INSERT WITH CHECK (true);
```

### Step 3: Verify Tables Were Created
1. Go to **"Table Editor"** in the left sidebar
2. You should see these tables:
   - `properties`
   - `property_images`
   - `scraped_data`
   - `locations`
   - `universities`

### Step 4: Run the Data Import
After creating the tables, run this command in your terminal:

```bash
node scripts/import-scraped-data.js
```

## 🔧 Troubleshooting

### If you get permission errors:
1. Make sure you're using the **Service Role Key** (not the anon key)
2. Check that RLS policies are correctly set up
3. Verify the tables exist in the Table Editor

### If the import still fails:
1. Check the error messages for specific issues
2. Verify your environment variables are correct
3. Make sure the scraped_data.json file exists

## 📊 Expected Results

After successful import, you should have:
- **244 property records** from Rightmove
- **Thousands of property images**
- **Real student accommodation data** across UK cities
- **Organized, searchable database** ready for frontend integration

## 🎯 Next Steps

Once the data is imported:
1. Connect frontend property search to Supabase
2. Replace mock data with real property listings
3. Implement filtering by location, price, bedrooms
4. Add property details view with real images

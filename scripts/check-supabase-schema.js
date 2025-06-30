import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Required: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSupabaseSchema() {
  console.log('🔍 Checking Supabase database schema...\n');
  
  try {
    // Check if tables exist by trying to query them
    const tables = ['properties', 'property_images', 'universities', 'guides'];
    const tableStatus = {};
    
    for (const tableName of tables) {
      try {
        console.log(`📋 Checking table: ${tableName}`);
        
        // Try to get table structure by querying with limit 0
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(0);
        
        if (error) {
          console.log(`❌ Table '${tableName}' error:`, error.message);
          tableStatus[tableName] = { exists: false, error: error.message };
        } else {
          console.log(`✅ Table '${tableName}' exists`);
          
          // Get row count
          const { count } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true });
          
          tableStatus[tableName] = { exists: true, rowCount: count || 0 };
          console.log(`   Rows: ${count || 0}`);
        }
      } catch (error) {
        console.log(`❌ Table '${tableName}' check failed:`, error.message);
        tableStatus[tableName] = { exists: false, error: error.message };
      }
    }
    
    console.log('\n📊 Table Status Summary:');
    Object.entries(tableStatus).forEach(([table, status]) => {
      if (status.exists) {
        console.log(`✅ ${table}: EXISTS (${status.rowCount} rows)`);
      } else {
        console.log(`❌ ${table}: MISSING - ${status.error}`);
      }
    });
    
    // Check if we need to create tables
    const missingTables = Object.entries(tableStatus)
      .filter(([, status]) => !status.exists)
      .map(([table]) => table);
    
    if (missingTables.length > 0) {
      console.log(`\n⚠️ Missing tables: ${missingTables.join(', ')}`);
      console.log('🔧 Need to create database schema first!');
      return false;
    } else {
      console.log('\n✅ All required tables exist!');
      
      // Show sample data structure if tables have data
      for (const tableName of tables) {
        if (tableStatus[tableName].rowCount > 0) {
          console.log(`\n📋 Sample data from ${tableName}:`);
          const { data } = await supabase
            .from(tableName)
            .select('*')
            .limit(1);
          
          if (data && data.length > 0) {
            const sampleRow = data[0];
            console.log('   Columns:', Object.keys(sampleRow).join(', '));
          }
        }
      }
      
      return true;
    }
    
  } catch (error) {
    console.error('❌ Error checking schema:', error.message);
    return false;
  }
}

async function createRequiredTables() {
  console.log('\n🔧 Creating required database tables...\n');
  
  try {
    // Create universities table
    console.log('📋 Creating universities table...');
    const universitiesSQL = `
      CREATE TABLE IF NOT EXISTS universities (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        location TEXT NOT NULL,
        postcode TEXT,
        rightmove_url TEXT,
        scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    
    const { error: universitiesError } = await supabase.rpc('exec_sql', { sql: universitiesSQL });
    if (universitiesError) {
      console.log('⚠️ Universities table:', universitiesError.message);
    } else {
      console.log('✅ Universities table created');
    }
    
    // Create properties table
    console.log('📋 Creating properties table...');
    const propertiesSQL = `
      CREATE TABLE IF NOT EXISTS properties (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        title TEXT NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        price_type TEXT DEFAULT 'weekly' CHECK (price_type IN ('weekly', 'monthly')),
        location TEXT NOT NULL,
        full_address TEXT,
        postcode TEXT,
        bedrooms INTEGER DEFAULT 1,
        bathrooms INTEGER DEFAULT 1,
        property_type TEXT DEFAULT 'flat',
        furnished BOOLEAN DEFAULT true,
        available BOOLEAN DEFAULT true,
        description TEXT,
        landlord_name TEXT,
        features JSONB,
        floor_area TEXT,
        energy_rating TEXT,
        council_tax_band TEXT,
        deposit TEXT,
        min_tenancy TEXT,
        max_tenancy TEXT,
        bills_included BOOLEAN DEFAULT false,
        parking BOOLEAN DEFAULT false,
        garden BOOLEAN DEFAULT false,
        balcony BOOLEAN DEFAULT false,
        source TEXT DEFAULT 'rightmove',
        source_url TEXT,
        rightmove_id TEXT,
        added_date TEXT,
        scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    
    const { error: propertiesError } = await supabase.rpc('exec_sql', { sql: propertiesSQL });
    if (propertiesError) {
      console.log('⚠️ Properties table:', propertiesError.message);
    } else {
      console.log('✅ Properties table created');
    }
    
    // Create property_images table
    console.log('📋 Creating property_images table...');
    const imagesSQL = `
      CREATE TABLE IF NOT EXISTS property_images (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
        image_url TEXT NOT NULL,
        alt_text TEXT,
        is_primary BOOLEAN DEFAULT false,
        image_order INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    
    const { error: imagesError } = await supabase.rpc('exec_sql', { sql: imagesSQL });
    if (imagesError) {
      console.log('⚠️ Property images table:', imagesError.message);
    } else {
      console.log('✅ Property images table created');
    }
    
    // Create guides table
    console.log('📋 Creating guides table...');
    const guidesSQL = `
      CREATE TABLE IF NOT EXISTS guides (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT,
        guide_type TEXT,
        source_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    
    const { error: guidesError } = await supabase.rpc('exec_sql', { sql: guidesSQL });
    if (guidesError) {
      console.log('⚠️ Guides table:', guidesError.message);
    } else {
      console.log('✅ Guides table created');
    }
    
    // Create indexes for better performance
    console.log('📋 Creating indexes...');
    const indexesSQL = `
      CREATE INDEX IF NOT EXISTS idx_properties_location ON properties(location);
      CREATE INDEX IF NOT EXISTS idx_properties_price ON properties(price);
      CREATE INDEX IF NOT EXISTS idx_properties_bedrooms ON properties(bedrooms);
      CREATE INDEX IF NOT EXISTS idx_properties_available ON properties(available);
      CREATE INDEX IF NOT EXISTS idx_property_images_property_id ON property_images(property_id);
      CREATE INDEX IF NOT EXISTS idx_property_images_primary ON property_images(is_primary);
    `;
    
    const { error: indexesError } = await supabase.rpc('exec_sql', { sql: indexesSQL });
    if (indexesError) {
      console.log('⚠️ Indexes:', indexesError.message);
    } else {
      console.log('✅ Indexes created');
    }
    
    console.log('\n✅ Database schema setup complete!');
    return true;
    
  } catch (error) {
    console.error('❌ Error creating tables:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Supabase Schema Checker & Setup\n');
  
  const schemaExists = await checkSupabaseSchema();
  
  if (!schemaExists) {
    console.log('\n🔧 Setting up database schema...');
    const setupSuccess = await createRequiredTables();
    
    if (setupSuccess) {
      console.log('\n✅ Schema setup complete! Ready for data import.');
      console.log('🎯 You can now run: node scripts/clean-import-comprehensive-data.js');
    } else {
      console.log('\n❌ Schema setup failed. Please check Supabase permissions.');
    }
  } else {
    console.log('\n🎯 Database is ready! You can proceed with data import.');
    console.log('🎯 Run: node scripts/clean-import-comprehensive-data.js');
  }
}

main();

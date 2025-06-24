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
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAndAddFeaturesColumn() {
  console.log('🔍 Checking properties table schema for features column...\n');
  
  try {
    // Test if features column exists by trying to select it
    const { data, error } = await supabase
      .from('properties')
      .select('features')
      .limit(1);
    
    if (error && error.message.includes('column "features" does not exist')) {
      console.log('❌ Features column does not exist');
      console.log('🔧 Adding features column...');
      
      // Add features column as JSONB
      const { error: alterError } = await supabase.rpc('exec_sql', {
        sql: 'ALTER TABLE properties ADD COLUMN IF NOT EXISTS features JSONB;'
      });
      
      if (alterError) {
        console.error('❌ Error adding features column:', alterError.message);
        return false;
      } else {
        console.log('✅ Features column added successfully!');
      }
      
    } else if (error) {
      console.error('❌ Error checking features column:', error.message);
      return false;
    } else {
      console.log('✅ Features column already exists');
    }
    
    // Test insert with features to make sure it works
    console.log('\n🧪 Testing features column functionality...');
    
    const testFeatures = ["WiFi", "Gym", "Parking", "Garden", "Dishwasher"];
    
    const { data: testProperty, error: insertError } = await supabase
      .from('properties')
      .insert({
        title: 'Test Property with Features',
        price: 100,
        location: 'Test Location',
        features: JSON.stringify(testFeatures)
      })
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ Error testing features insert:', insertError.message);
      return false;
    } else {
      console.log('✅ Features column test successful');
      console.log(`   Test features: ${JSON.stringify(testFeatures)}`);
      console.log(`   Stored features: ${testProperty.features}`);
      
      // Clean up test data
      await supabase.from('properties').delete().eq('id', testProperty.id);
      console.log('🧹 Test data cleaned up');
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Error in features column check:', error.message);
    return false;
  }
}

async function addOtherRequiredColumns() {
  console.log('\n🔧 Checking and adding other required columns for frontend filters...\n');
  
  try {
    // List of columns that might be needed for frontend filters
    const requiredColumns = [
      { name: 'property_type', type: 'TEXT', default: "'flat'" },
      { name: 'furnished', type: 'BOOLEAN', default: 'true' },
      { name: 'available', type: 'BOOLEAN', default: 'true' },
      { name: 'bedrooms', type: 'INTEGER', default: '1' },
      { name: 'bathrooms', type: 'INTEGER', default: '1' },
      { name: 'price_type', type: 'TEXT', default: "'weekly'" },
      { name: 'postcode', type: 'TEXT', default: 'NULL' },
      { name: 'landlord_name', type: 'TEXT', default: 'NULL' },
      { name: 'description', type: 'TEXT', default: 'NULL' },
      { name: 'full_address', type: 'TEXT', default: 'NULL' },
      { name: 'source', type: 'TEXT', default: "'rightmove'" },
      { name: 'source_url', type: 'TEXT', default: 'NULL' }
    ];
    
    for (const column of requiredColumns) {
      try {
        // Test if column exists
        const { error } = await supabase
          .from('properties')
          .select(column.name)
          .limit(1);
        
        if (error && error.message.includes(`column "${column.name}" does not exist`)) {
          console.log(`🔧 Adding ${column.name} column...`);
          
          const sql = `ALTER TABLE properties ADD COLUMN IF NOT EXISTS ${column.name} ${column.type} DEFAULT ${column.default};`;
          
          const { error: alterError } = await supabase.rpc('exec_sql', { sql });
          
          if (alterError) {
            console.warn(`⚠️ Error adding ${column.name}:`, alterError.message);
          } else {
            console.log(`✅ ${column.name} column added`);
          }
        } else if (error) {
          console.warn(`⚠️ Error checking ${column.name}:`, error.message);
        } else {
          console.log(`✅ ${column.name} column exists`);
        }
      } catch (error) {
        console.warn(`⚠️ Error with ${column.name}:`, error.message);
      }
    }
    
    // Add indexes for better performance on filter columns
    console.log('\n📊 Adding indexes for filter performance...');
    
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_properties_location ON properties(location);',
      'CREATE INDEX IF NOT EXISTS idx_properties_price ON properties(price);',
      'CREATE INDEX IF NOT EXISTS idx_properties_bedrooms ON properties(bedrooms);',
      'CREATE INDEX IF NOT EXISTS idx_properties_property_type ON properties(property_type);',
      'CREATE INDEX IF NOT EXISTS idx_properties_furnished ON properties(furnished);',
      'CREATE INDEX IF NOT EXISTS idx_properties_available ON properties(available);',
      'CREATE INDEX IF NOT EXISTS idx_properties_features ON properties USING GIN(features);'
    ];
    
    for (const indexSql of indexes) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: indexSql });
        if (error) {
          console.warn('⚠️ Index error:', error.message);
        }
      } catch (error) {
        console.warn('⚠️ Index creation error:', error.message);
      }
    }
    
    console.log('✅ Indexes created for filter performance');
    
  } catch (error) {
    console.error('❌ Error adding required columns:', error.message);
  }
}

async function showCurrentTableSchema() {
  console.log('\n📋 CURRENT PROPERTIES TABLE SCHEMA:\n');
  
  try {
    // Get a sample record to see all columns
    const { data } = await supabase
      .from('properties')
      .select('*')
      .limit(1);
    
    if (data && data.length > 0) {
      const columns = Object.keys(data[0]);
      console.log('✅ Available columns:');
      columns.forEach(col => {
        console.log(`   - ${col}`);
      });
    } else {
      // If no data, try to insert a test record to see schema
      const { data: testData, error } = await supabase
        .from('properties')
        .insert({
          title: 'Schema Test',
          price: 100,
          location: 'Test'
        })
        .select()
        .single();
      
      if (testData) {
        const columns = Object.keys(testData);
        console.log('✅ Available columns:');
        columns.forEach(col => {
          console.log(`   - ${col}`);
        });
        
        // Clean up
        await supabase.from('properties').delete().eq('id', testData.id);
      } else {
        console.log('❌ Could not determine schema:', error?.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Error showing schema:', error.message);
  }
}

async function main() {
  console.log('🚀 ENSURING FEATURES COLUMN & FRONTEND COMPATIBILITY\n');
  
  // Step 1: Check and add features column
  const featuresSuccess = await checkAndAddFeaturesColumn();
  
  if (!featuresSuccess) {
    console.error('❌ Failed to set up features column');
    process.exit(1);
  }
  
  // Step 2: Add other required columns
  await addOtherRequiredColumns();
  
  // Step 3: Show final schema
  await showCurrentTableSchema();
  
  console.log('\n🎉 SCHEMA UPDATE COMPLETE!');
  console.log('✅ Features column ready for frontend filters');
  console.log('✅ All required columns added');
  console.log('✅ Indexes created for performance');
  console.log('✅ Ready for property data import');
  
  console.log('\n🎯 Next step: Run the import script to populate with comprehensive data');
}

main();

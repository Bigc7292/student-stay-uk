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

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addFeaturesColumnDirect() {
  console.log('🔧 Adding features column directly to properties table...\n');
  
  try {
    // Use direct SQL to add the features column
    console.log('📋 Adding features column as JSONB...');
    
    // Add the features column
    const { data, error } = await supabase
      .rpc('exec_sql', {
        sql: 'ALTER TABLE properties ADD COLUMN IF NOT EXISTS features JSONB;'
      });
    
    if (error) {
      console.error('❌ Error adding features column:', error.message);
      
      // Try alternative approach - direct query
      console.log('🔄 Trying alternative approach...');
      
      const { error: altError } = await supabase
        .from('properties')
        .select('features')
        .limit(0);
      
      if (altError && altError.message.includes('does not exist')) {
        console.log('❌ Features column definitely does not exist');
        console.log('💡 You may need to add it manually in Supabase dashboard');
        console.log('   SQL: ALTER TABLE properties ADD COLUMN features JSONB;');
      }
      
    } else {
      console.log('✅ Features column added successfully!');
    }
    
    // Test the column
    console.log('\n🧪 Testing features column...');
    
    const testFeatures = ["WiFi", "Gym", "Parking"];
    
    const { data: testData, error: testError } = await supabase
      .from('properties')
      .insert({
        title: 'Test Property with Features',
        price: 100,
        location: 'Test Location',
        source: 'test',
        features: JSON.stringify(testFeatures)
      })
      .select()
      .single();
    
    if (testError) {
      console.error('❌ Error testing features:', testError.message);
    } else {
      console.log('✅ Features column test successful!');
      console.log(`   Features stored: ${testData.features}`);
      
      // Clean up
      await supabase.from('properties').delete().eq('id', testData.id);
      console.log('🧹 Test data cleaned up');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

addFeaturesColumnDirect();

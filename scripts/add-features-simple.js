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

async function addFeaturesColumn() {
  console.log('🔧 Adding features column to properties table...\n');
  
  try {
    // First, let's see what columns currently exist
    console.log('📋 Checking current table structure...');
    
    const { data: testData, error: testError } = await supabase
      .from('properties')
      .insert({
        title: 'Test Property',
        price: 100,
        location: 'Test Location'
      })
      .select()
      .single();
    
    if (testData) {
      console.log('✅ Current columns:', Object.keys(testData).join(', '));
      
      // Check if features column exists
      if (testData.hasOwnProperty('features')) {
        console.log('✅ Features column already exists!');
      } else {
        console.log('❌ Features column missing - will be added during import');
      }
      
      // Clean up test data
      await supabase.from('properties').delete().eq('id', testData.id);
      console.log('🧹 Test data cleaned up');
    } else {
      console.log('❌ Error testing table:', testError?.message);
    }
    
    console.log('\n✅ Table check complete!');
    console.log('💡 The features column will be handled during the import process');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

addFeaturesColumn();

#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

console.log('🧪 Testing Supabase Connection for StudentHome Platform\n');

// Get environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('📋 Configuration Check:');
console.log(`   URL: ${supabaseUrl || '❌ Missing'}`);
console.log(`   Anon Key: ${supabaseAnonKey ? '✅ Present' : '❌ Missing'}`);
console.log(`   Service Key: ${supabaseServiceKey ? '✅ Present' : '❌ Missing'}\n`);

if (!supabaseUrl || !supabaseAnonKey) {
  console.log('❌ Missing required Supabase environment variables!');
  console.log('   Please run: node scripts/get-supabase-keys.js');
  console.log('   Then update your .env.local file with the correct keys.\n');
  process.exit(1);
}

async function testConnection() {
  try {
    console.log('🔗 Testing connection with anon key...');
    
    // Test with anon key (frontend connection)
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Test basic connection
    const { data: healthCheck, error: healthError } = await supabase
      .from('properties')
      .select('count')
      .limit(1);
    
    if (healthError) {
      console.log('❌ Connection failed:', healthError.message);
      return false;
    }
    
    console.log('✅ Basic connection successful!');
    
    // Test property count
    const { count, error: countError } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.log('⚠️  Could not get property count:', countError.message);
    } else {
      console.log(`📊 Properties in database: ${count || 0}`);
    }
    
    // Test sample property fetch
    const { data: sampleProperties, error: sampleError } = await supabase
      .from('properties')
      .select('id, title, price, location, bedrooms')
      .limit(3);
    
    if (sampleError) {
      console.log('⚠️  Could not fetch sample properties:', sampleError.message);
    } else {
      console.log(`\n📋 Sample Properties (${sampleProperties?.length || 0} found):`);
      sampleProperties?.forEach((prop, index) => {
        console.log(`   ${index + 1}. ${prop.title}`);
        console.log(`      £${prop.price}/week - ${prop.location} - ${prop.bedrooms} bed`);
      });
    }
    
    // Test property images
    const { data: imageCount, error: imageError } = await supabase
      .from('property_images')
      .select('*', { count: 'exact', head: true });
    
    if (!imageError) {
      console.log(`\n🖼️  Property images in database: ${imageCount || 0}`);
    }
    
    console.log('\n✅ Supabase connection test completed successfully!');
    console.log('🚀 Your frontend can now connect to real property data.');
    
    return true;
    
  } catch (error) {
    console.log('❌ Connection test failed:', error.message);
    return false;
  }
}

// Run the test
testConnection()
  .then(success => {
    if (success) {
      console.log('\n🎉 Next steps:');
      console.log('   1. Restart your frontend development server');
      console.log('   2. The PropertyCarousel should now load real data');
      console.log('   3. Search filters will work with your database');
      console.log('   4. All mock data will be replaced with real properties');
    } else {
      console.log('\n🔧 Troubleshooting:');
      console.log('   1. Verify your API keys are correct');
      console.log('   2. Check that your database tables exist');
      console.log('   3. Ensure RLS policies allow public read access');
      console.log('   4. Run: node scripts/get-supabase-keys.js for help');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.log('❌ Test script error:', error.message);
    process.exit(1);
  });

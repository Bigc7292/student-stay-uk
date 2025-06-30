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

async function testDatabaseConnection() {
  console.log('🧪 Testing Supabase database connection...\n');
  
  try {
    // Test 1: Get available locations
    console.log('📍 Testing location fetch...');
    const { data: locationData, error: locationError } = await supabase
      .from('properties')
      .select('location')
      .eq('available', true);

    if (locationError) throw locationError;

    const locations = [...new Set(locationData?.map(p => p.location) || [])];
    console.log(`✅ Found ${locations.length} locations`);
    console.log('   Sample locations:', locations.slice(0, 5).join(', '));

    // Test 2: Get property statistics
    console.log('\n📊 Testing property statistics...');
    const { count: totalProperties } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true });

    const { count: availableProperties } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true })
      .eq('available', true);

    console.log('✅ Property statistics:');
    console.log(`   Total properties: ${totalProperties || 0}`);
    console.log(`   Available properties: ${availableProperties || 0}`);
    console.log(`   Unique locations: ${locations.length}`);

    // Test 3: Search properties
    console.log('\n🔍 Testing property search...');
    const { data: searchResults, error: searchError } = await supabase
      .from('properties')
      .select(`
        *,
        property_images:property_images(*)
      `)
      .eq('location', locations[0] || 'London')
      .eq('available', true)
      .limit(5);

    if (searchError) throw searchError;

    console.log(`✅ Found ${searchResults?.length || 0} properties in search`);

    if (searchResults && searchResults.length > 0) {
      const sample = searchResults[0];
      console.log('   Sample property:');
      console.log(`     Title: ${sample.title}`);
      console.log(`     Price: £${sample.price} ${sample.price_type}`);
      console.log(`     Location: ${sample.location}`);
      console.log(`     Images: ${sample.property_images?.length || 0}`);
    }
    
    console.log('\n🎉 ALL DATABASE TESTS PASSED!');
    console.log('✅ Supabase connection is working correctly');
    console.log('✅ Property data is accessible');
    console.log('✅ Search functionality is operational');
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    console.log('\n💡 Troubleshooting steps:');
    console.log('1. Check your .env file has correct Supabase credentials');
    console.log('2. Verify Supabase project is active');
    console.log('3. Ensure property data has been imported');
    console.log('4. Check network connectivity');
    process.exit(1);
  }
}

testDatabaseConnection();

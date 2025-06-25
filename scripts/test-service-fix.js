#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

console.log('🧪 Testing SupabasePropertyService Fix\n');

// Simulate the service logic
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testServiceFix() {
  try {
    console.log('1. 📸 Getting properties with images...');
    
    // Get property IDs that have images (same as service)
    const { data: imageRefs } = await supabase
      .from('property_images')
      .select('property_id');
    
    const propertyIdsWithImages = [...new Set(imageRefs?.map(img => img.property_id) || [])];
    console.log(`   Found ${propertyIdsWithImages.length} properties with images`);
    
    console.log('\n2. 🔍 Testing Glasgow search with image filter...');
    
    // Test Glasgow search with image filter
    const { data: glasgowWithImages, error: glasgowError } = await supabase
      .from('properties')
      .select(`
        *,
        property_images:property_images(*)
      `)
      .in('id', propertyIdsWithImages)
      .or(`location.ilike.%Glasgow%,full_address.ilike.%Glasgow%,postcode.ilike.%Glasgow%`)
      .eq('available', true)
      .lte('price', 800)
      .order('price', { ascending: true })
      .limit(2);
    
    if (glasgowError) {
      console.log(`   ❌ Query failed: ${glasgowError.message}`);
    } else {
      console.log(`   ✅ Found ${glasgowWithImages?.length || 0} Glasgow properties with images`);
      glasgowWithImages?.forEach((prop, idx) => {
        console.log(`   ${idx + 1}. ${prop.title}`);
        console.log(`      Images: ${prop.property_images?.length || 0}`);
        if (prop.property_images?.length > 0) {
          console.log(`      First image: ${prop.property_images[0].image_url}`);
        }
      });
    }
    
    console.log('\n3. 🌍 Testing any location with image filter...');
    
    // Test any location with image filter
    const { data: anyWithImages, error: anyError } = await supabase
      .from('properties')
      .select(`
        *,
        property_images:property_images(*)
      `)
      .in('id', propertyIdsWithImages)
      .eq('available', true)
      .lte('price', 800)
      .order('price', { ascending: true })
      .limit(5);
    
    if (anyError) {
      console.log(`   ❌ Query failed: ${anyError.message}`);
    } else {
      console.log(`   ✅ Found ${anyWithImages?.length || 0} properties with images (any location)`);
      anyWithImages?.forEach((prop, idx) => {
        console.log(`   ${idx + 1}. ${prop.title} (${prop.location})`);
        console.log(`      Images: ${prop.property_images?.length || 0}`);
      });
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

testServiceFix()
  .then(() => {
    console.log('\n✅ Service fix test completed!');
    process.exit(0);
  })
  .catch(error => {
    console.log('❌ Test failed:', error.message);
    process.exit(1);
  });

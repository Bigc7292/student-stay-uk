#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

console.log('🎠 Testing PropertyCarousel Data Flow\n');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.log('❌ Missing Supabase environment variables!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testCarouselData() {
  try {
    console.log('1. 🔍 Testing exact PropertyCarousel query...');
    
    // This mimics the exact query from PropertyCarousel loadFallbackProperties
    const cities = ['Glasgow', 'Cardiff', 'Manchester', 'London', 'Leeds'];
    
    for (const city of cities.slice(0, 2)) { // Test first 2 cities
      console.log(`\n📍 Testing ${city}...`);
      
      const { data, error } = await supabase
        .from('properties')
        .select(`
          *,
          property_images:property_images(*)
        `)
        .or(`location.ilike.%${city}%,full_address.ilike.%${city}%,postcode.ilike.%${city}%`)
        .eq('available', true)
        .lte('price', 800)
        .order('price', { ascending: true })
        .order('created_at', { ascending: false })
        .limit(2);
      
      if (error) {
        console.log(`   ❌ Query failed: ${error.message}`);
        continue;
      }
      
      console.log(`   ✅ Found ${data?.length || 0} properties`);
      
      data?.forEach((prop, idx) => {
        console.log(`   ${idx + 1}. ${prop.title}`);
        console.log(`      Raw property_images: ${prop.property_images?.length || 0}`);
        
        if (prop.property_images && prop.property_images.length > 0) {
          console.log(`      First image URL: ${prop.property_images[0].image_url}`);
          console.log(`      All image URLs: ${prop.property_images.map(img => img.image_url).join(', ')}`);
        } else {
          console.log(`      ⚠️ No images found for this property`);
        }
        
        // Test the transformation logic
        const imageUrls = (prop.property_images || []).map((img) => img.image_url);
        console.log(`      Transformed images array: ${imageUrls.length} URLs`);
        console.log('');
      });
    }
    
    console.log('2. 🎯 Testing properties that definitely have images...');
    
    // Get a property we know has images
    const { data: propWithImages, error: propError } = await supabase
      .from('properties')
      .select(`
        *,
        property_images:property_images(*)
      `)
      .eq('id', '75126a97-ace8-4018-8a1e-afd18ae67a12')
      .single();
    
    if (!propError && propWithImages) {
      console.log(`\n✅ Test property: ${propWithImages.title}`);
      console.log(`   Location: ${propWithImages.location}`);
      console.log(`   Raw images: ${propWithImages.property_images?.length || 0}`);
      
      if (propWithImages.property_images?.length > 0) {
        console.log(`   Image URLs:`);
        propWithImages.property_images.forEach((img, idx) => {
          console.log(`     ${idx + 1}. ${img.image_url}`);
        });
        
        // Test transformation
        const transformedUrls = propWithImages.property_images.map(img => img.image_url);
        console.log(`   Transformed: ${transformedUrls.length} URLs`);
      }
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

testCarouselData()
  .then(() => {
    console.log('\n✅ PropertyCarousel data test completed!');
    process.exit(0);
  })
  .catch(error => {
    console.log('❌ Test failed:', error.message);
    process.exit(1);
  });

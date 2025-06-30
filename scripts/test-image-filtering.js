#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

console.log('🧪 Testing Image Filtering Fix\n');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testImageFiltering() {
  try {
    console.log('1. 📸 Getting property IDs with images...');
    
    const { data: imageRefs } = await supabase
      .from('property_images')
      .select('property_id');
    
    const propertyIdsWithImages = [...new Set(imageRefs?.map(img => img.property_id) || [])];
    console.log(`   Found ${propertyIdsWithImages.length} properties with images`);
    
    console.log('\n2. 🔍 Testing carousel query with image filter...');
    
    const { data, error } = await supabase
      .from('properties')
      .select(`
        *,
        property_images:property_images(*)
      `)
      .in('id', propertyIdsWithImages)
      .eq('available', true)
      .lte('price', 800)
      .order('price', { ascending: true })
      .limit(8);
    
    if (error) {
      console.log('   ❌ Query failed:', error.message);
      return;
    }
    
    console.log(`   ✅ Query returned ${data?.length || 0} properties`);
    
    let propertiesWithImages = 0;
    let propertiesWithoutImages = 0;
    
    data?.forEach((prop, idx) => {
      const imageCount = prop.property_images?.length || 0;
      console.log(`   ${idx + 1}. ${prop.title} (${prop.location}): ${imageCount} images`);
      
      if (imageCount > 0) {
        propertiesWithImages++;
      } else {
        propertiesWithoutImages++;
        console.log('      ⚠️ This property has no images but was returned!');
      }
    });
    
    console.log(`\n📊 Results:`);
    console.log(`   ✅ Properties with images: ${propertiesWithImages}`);
    console.log(`   ❌ Properties without images: ${propertiesWithoutImages}`);
    
    if (propertiesWithoutImages === 0) {
      console.log('\n🎉 SUCCESS: All returned properties have images!');
    } else {
      console.log('\n⚠️ ISSUE: Some properties without images are still being returned');
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

testImageFiltering()
  .then(() => {
    console.log('\n✅ Image filtering test completed!');
    process.exit(0);
  })
  .catch(error => {
    console.log('❌ Test failed:', error.message);
    process.exit(1);
  });

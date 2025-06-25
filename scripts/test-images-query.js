#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

console.log('🔍 Testing Property Images Query\n');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.log('❌ Missing Supabase environment variables!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testImagesQuery() {
  try {
    console.log('🔍 Testing property query with images join...');
    
    const { data, error } = await supabase
      .from('properties')
      .select(`
        *,
        property_images:property_images(*)
      `)
      .ilike('location', '%Glasgow%')
      .limit(2);
    
    if (error) {
      console.log('❌ Query error:', error);
      return;
    }
    
    console.log(`✅ Properties found: ${data?.length || 0}`);
    
    data?.forEach((prop, idx) => {
      console.log(`\n${idx + 1}. ${prop.title}`);
      console.log(`   Location: ${prop.location}`);
      console.log(`   Images: ${prop.property_images?.length || 0}`);
      
      if (prop.property_images?.length > 0) {
        console.log(`   First image: ${prop.property_images[0].image_url}`);
        console.log(`   Primary image: ${prop.property_images.find(img => img.is_primary)?.image_url || 'None set as primary'}`);
      } else {
        console.log('   ⚠️ No images found for this property');
      }
    });
    
    // Test with a specific property that we know has images
    console.log('\n🔍 Testing with specific property ID...');
    const { data: specificProp, error: specificError } = await supabase
      .from('properties')
      .select(`
        *,
        property_images:property_images(*)
      `)
      .eq('id', '75126a97-ace8-4018-8a1e-afd18ae67a12')
      .single();
    
    if (!specificError && specificProp) {
      console.log(`✅ Specific property: ${specificProp.title}`);
      console.log(`   Images: ${specificProp.property_images?.length || 0}`);
      if (specificProp.property_images?.length > 0) {
        console.log(`   Sample images:`);
        specificProp.property_images.slice(0, 3).forEach((img, idx) => {
          console.log(`     ${idx + 1}. ${img.image_url}`);
        });
      }
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

testImagesQuery()
  .then(() => {
    console.log('\n✅ Image query test completed!');
    process.exit(0);
  })
  .catch(error => {
    console.log('❌ Test failed:', error.message);
    process.exit(1);
  });

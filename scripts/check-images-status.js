#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

console.log('🖼️  Checking Image Status in StudentHome Database\n');

// Get environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.log('❌ Missing Supabase environment variables!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkImageStatus() {
  try {
    console.log('📊 Checking database tables and image data...\n');
    
    // Check property_images table directly
    console.log('📋 Checking property_images table...');
    
    // Check property_images table
    const { count: imageCount, error: imageError } = await supabase
      .from('property_images')
      .select('*', { count: 'exact', head: true });

    if (imageError) {
      console.log('❌ property_images table error:', imageError.message);
    } else {
      console.log(`🖼️  property_images table: ${imageCount || 0} records`);

      if (imageCount > 0) {
        // Get sample images
        const { data: sampleImages, error: sampleError } = await supabase
          .from('property_images')
          .select('property_id, image_url, is_primary')
          .limit(5);

        if (!sampleError && sampleImages) {
          console.log('\n📸 Sample images:');
          sampleImages.forEach((img, idx) => {
            console.log(`   ${idx + 1}. Property ${img.property_id}: ${img.image_url.substring(0, 60)}...`);
          });
        }
      }
    }
    
    // Check properties table for image data
    const { data: propertiesWithImages, error: propError } = await supabase
      .from('properties')
      .select('id, title, images')
      .not('images', 'is', null)
      .limit(5);
    
    if (!propError && propertiesWithImages) {
      console.log(`\n🏠 Properties with images field: ${propertiesWithImages.length}`);
      propertiesWithImages.forEach((prop, idx) => {
        const imageCount = Array.isArray(prop.images) ? prop.images.length : 0;
        console.log(`   ${idx + 1}. ${prop.title}: ${imageCount} images`);
      });
    }
    
    // Check for any image URLs in properties table
    const { data: sampleProps, error: sampleError } = await supabase
      .from('properties')
      .select('id, title, images, source_url')
      .limit(3);
    
    if (!sampleError && sampleProps) {
      console.log('\n🔍 Sample property data:');
      sampleProps.forEach((prop, idx) => {
        console.log(`   ${idx + 1}. ${prop.title}`);
        console.log(`      Images: ${JSON.stringify(prop.images)}`);
        console.log(`      Source: ${prop.source_url || 'N/A'}`);
      });
    }
    
  } catch (error) {
    console.log('❌ Error checking image status:', error.message);
  }
}

// Run the check
checkImageStatus()
  .then(() => {
    console.log('\n✅ Image status check completed!');
    process.exit(0);
  })
  .catch(error => {
    console.log('❌ Check failed:', error.message);
    process.exit(1);
  });

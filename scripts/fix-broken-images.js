#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

console.log('🔧 Fixing Broken Image URLs\n');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function analyzeBrokenImages() {
  try {
    console.log('1. 🔍 Analyzing image URLs...');
    
    const { data: images, error } = await supabase
      .from('property_images')
      .select('*')
      .limit(5000); // Get all images
    
    if (error) {
      console.log('❌ Error fetching images:', error.message);
      return;
    }
    
    console.log(`📊 Total images in database: ${images.length}`);
    
    let brokenRightmove = 0;
    let workingRightmove = 0;
    let otherImages = 0;
    let emptyUrls = 0;
    
    const brokenImages = [];
    
    images.forEach(img => {
      if (!img.image_url || img.image_url.trim() === '') {
        emptyUrls++;
      } else if (img.image_url.includes('rightmove.co.uk')) {
        if (img.image_url.includes(':443')) {
          workingRightmove++;
        } else {
          brokenRightmove++;
          brokenImages.push(img);
        }
      } else {
        otherImages++;
      }
    });
    
    console.log(`\n📈 Image URL Analysis:`);
    console.log(`✅ Working Rightmove URLs (with :443): ${workingRightmove}`);
    console.log(`❌ Broken Rightmove URLs (without :443): ${brokenRightmove}`);
    console.log(`🔗 Other image sources: ${otherImages}`);
    console.log(`⚠️ Empty/null URLs: ${emptyUrls}`);
    
    if (brokenRightmove > 0) {
      console.log(`\n🔧 Sample broken URLs (first 5):`);
      brokenImages.slice(0, 5).forEach((img, idx) => {
        console.log(`${idx + 1}. ${img.image_url}`);
        const fixed = img.image_url.replace('https://media.rightmove.co.uk/', 'https://media.rightmove.co.uk:443/');
        console.log(`   Fixed: ${fixed}`);
      });
      
      return brokenImages;
    }
    
    return [];
    
  } catch (error) {
    console.log('❌ Analysis failed:', error.message);
    return [];
  }
}

async function fixBrokenImages(brokenImages) {
  if (brokenImages.length === 0) {
    console.log('\n✅ No broken images to fix!');
    return;
  }
  
  console.log(`\n2. 🔧 Fixing ${brokenImages.length} broken Rightmove URLs...`);
  
  let fixed = 0;
  let failed = 0;
  
  // Process in batches to avoid overwhelming the database
  const batchSize = 50;
  for (let i = 0; i < brokenImages.length; i += batchSize) {
    const batch = brokenImages.slice(i, i + batchSize);
    
    console.log(`   Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(brokenImages.length/batchSize)}...`);
    
    for (const img of batch) {
      try {
        const fixedUrl = img.image_url.replace('https://media.rightmove.co.uk/', 'https://media.rightmove.co.uk:443/');
        
        const { error } = await supabase
          .from('property_images')
          .update({ image_url: fixedUrl })
          .eq('id', img.id);
        
        if (error) {
          console.log(`   ❌ Failed to fix image ${img.id}: ${error.message}`);
          failed++;
        } else {
          fixed++;
        }
      } catch (error) {
        console.log(`   ❌ Error fixing image ${img.id}: ${error.message}`);
        failed++;
      }
    }
    
    // Small delay between batches
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`\n📊 Fix Results:`);
  console.log(`✅ Successfully fixed: ${fixed} images`);
  console.log(`❌ Failed to fix: ${failed} images`);
  
  if (fixed > 0) {
    console.log(`\n🎉 SUCCESS: Fixed ${fixed} broken Rightmove image URLs!`);
    console.log(`   All Rightmove URLs now include :443 port for proper access`);
  }
}

async function main() {
  try {
    const brokenImages = await analyzeBrokenImages();
    await fixBrokenImages(brokenImages);
    
    console.log('\n✅ Image URL fix process completed!');
    console.log('   Refresh your browser to see the fixed images in the carousel.');
    
  } catch (error) {
    console.log('❌ Process failed:', error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.log('❌ Script failed:', error.message);
    process.exit(1);
  });

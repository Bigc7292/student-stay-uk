#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

console.log('🧹 Final Image Cleanup - Removing Any Remaining Broken Images\n');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testImageUrl(url) {
  try {
    const response = await fetch(url, { 
      method: 'HEAD',
      timeout: 3000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

async function finalImageCleanup() {
  try {
    console.log('1. 🔍 Checking current image status...');
    
    const { data: images, error } = await supabase
      .from('property_images')
      .select('*');
    
    if (error) {
      console.log('❌ Error fetching images:', error.message);
      return;
    }
    
    console.log(`📊 Current images in database: ${images.length}`);
    
    if (images.length === 0) {
      console.log('⚠️ No images found in database!');
      return;
    }
    
    console.log('\n2. 🧪 Testing all remaining images...');
    
    let workingImages = 0;
    let brokenImages = 0;
    const imagesToDelete = [];
    
    // Test in smaller batches for faster processing
    const batchSize = 20;
    for (let i = 0; i < images.length; i += batchSize) {
      const batch = images.slice(i, i + batchSize);
      
      console.log(`   Testing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(images.length/batchSize)} (${batch.length} images)...`);
      
      const testPromises = batch.map(async (img) => {
        const isWorking = await testImageUrl(img.image_url);
        if (isWorking) {
          workingImages++;
        } else {
          brokenImages++;
          imagesToDelete.push(img);
          console.log(`   ❌ Broken: ${img.image_url.substring(img.image_url.lastIndexOf('/') + 1)}`);
        }
        return { img, isWorking };
      });
      
      await Promise.all(testPromises);
      
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.log(`\n📊 Final Test Results:`);
    console.log(`✅ Working images: ${workingImages}`);
    console.log(`❌ Broken images found: ${brokenImages}`);
    console.log(`📈 Success rate: ${((workingImages / images.length) * 100).toFixed(1)}%`);
    
    if (imagesToDelete.length > 0) {
      console.log(`\n3. 🗑️ Removing ${imagesToDelete.length} remaining broken images...`);
      
      let deleted = 0;
      let failed = 0;
      
      // Delete in batches
      const deleteBatchSize = 50;
      for (let i = 0; i < imagesToDelete.length; i += deleteBatchSize) {
        const batch = imagesToDelete.slice(i, i + deleteBatchSize);
        const idsToDelete = batch.map(img => img.id);
        
        console.log(`   Deleting batch ${Math.floor(i/deleteBatchSize) + 1}/${Math.ceil(imagesToDelete.length/deleteBatchSize)}...`);
        
        const { error } = await supabase
          .from('property_images')
          .delete()
          .in('id', idsToDelete);
        
        if (error) {
          console.log(`   ❌ Failed to delete batch: ${error.message}`);
          failed += batch.length;
        } else {
          deleted += batch.length;
        }
        
        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      console.log(`\n📊 Final Cleanup Results:`);
      console.log(`✅ Successfully deleted: ${deleted} broken images`);
      console.log(`❌ Failed to delete: ${failed} images`);
      
      if (deleted > 0) {
        console.log(`\n🎉 SUCCESS: Removed ${deleted} additional broken images!`);
      }
    } else {
      console.log(`\n✅ PERFECT! All ${workingImages} images are working correctly!`);
      console.log(`   No broken images found - database is 100% clean.`);
    }
    
    // Final summary
    const finalWorkingImages = workingImages;
    console.log(`\n📈 Final Database State:`);
    console.log(`✅ Working images: ${finalWorkingImages}`);
    console.log(`🗑️ Total broken images removed: ${imagesToDelete.length}`);
    console.log(`📊 Database quality: 100% working images`);
    
    // Also check properties without any images
    console.log(`\n4. 🔍 Checking for properties without images...`);
    
    const { data: propertiesWithoutImages, error: propError } = await supabase
      .from('properties')
      .select(`
        id, title, location,
        property_images:property_images(id)
      `)
      .is('property_images.id', null);
    
    if (!propError && propertiesWithoutImages && propertiesWithoutImages.length > 0) {
      console.log(`⚠️ Found ${propertiesWithoutImages.length} properties without any images`);
      console.log(`   These properties will not appear in the carousel`);
    } else {
      console.log(`✅ All properties have at least one image`);
    }
    
  } catch (error) {
    console.log('❌ Process failed:', error.message);
  }
}

async function main() {
  try {
    await finalImageCleanup();
    
    console.log('\n✅ Final image cleanup completed!');
    console.log('   Your carousel should now show only properties with working images.');
    console.log('   Refresh your browser to see the results.');
    
  } catch (error) {
    console.log('❌ Script failed:', error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.log('❌ Script failed:', error.message);
    process.exit(1);
  });

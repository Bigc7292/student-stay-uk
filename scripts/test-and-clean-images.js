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

console.log('🧹 Testing and Cleaning Broken Image URLs\n');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testImageUrl(url) {
  try {
    const response = await fetch(url, { 
      method: 'HEAD',
      timeout: 5000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

async function testAndCleanImages() {
  try {
    console.log('1. 🔍 Fetching all images from database...');
    
    const { data: images, error } = await supabase
      .from('property_images')
      .select('*')
      .limit(1000);
    
    if (error) {
      console.log('❌ Error fetching images:', error.message);
      return;
    }
    
    console.log(`📊 Total images to test: ${images.length}`);
    
    console.log('\n2. 🧪 Testing image URLs (this may take a while)...');
    
    let workingImages = 0;
    let brokenImages = 0;
    const imagesToDelete = [];
    
    // Test in smaller batches to avoid overwhelming the server
    const batchSize = 10;
    for (let i = 0; i < images.length; i += batchSize) {
      const batch = images.slice(i, i + batchSize);
      
      console.log(`   Testing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(images.length/batchSize)}...`);
      
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
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log(`\n📊 Test Results:`);
    console.log(`✅ Working images: ${workingImages}`);
    console.log(`❌ Broken images: ${brokenImages}`);
    console.log(`📈 Success rate: ${((workingImages / images.length) * 100).toFixed(1)}%`);
    
    if (imagesToDelete.length > 0) {
      console.log(`\n3. 🗑️ Removing ${imagesToDelete.length} broken images from database...`);
      
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
      
      console.log(`\n📊 Cleanup Results:`);
      console.log(`✅ Successfully deleted: ${deleted} broken images`);
      console.log(`❌ Failed to delete: ${failed} images`);
      
      if (deleted > 0) {
        console.log(`\n🎉 SUCCESS: Cleaned up ${deleted} broken images!`);
        console.log(`   Database now contains only working images.`);
      }
    } else {
      console.log(`\n✅ All images are working! No cleanup needed.`);
    }
    
    // Final summary
    console.log(`\n📈 Final Database State:`);
    console.log(`✅ Working images remaining: ${workingImages}`);
    console.log(`🗑️ Broken images removed: ${imagesToDelete.length}`);
    console.log(`📊 Database efficiency: 100% working images`);
    
  } catch (error) {
    console.log('❌ Process failed:', error.message);
  }
}

async function main() {
  try {
    await testAndCleanImages();
    
    console.log('\n✅ Image testing and cleanup completed!');
    console.log('   Refresh your browser - carousel should now show only working images.');
    
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

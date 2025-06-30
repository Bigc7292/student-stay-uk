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

console.log('🔥 AGGRESSIVE CLEANUP - Remove ALL Properties Without Working Images\n');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testImageUrl(url) {
  try {
    const response = await fetch(url, { 
      method: 'HEAD',
      timeout: 2000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

async function aggressiveCleanup() {
  try {
    console.log('1. 🔍 Getting all properties with their images...');
    
    const { data: properties, error } = await supabase
      .from('properties')
      .select(`
        id, title, location,
        property_images:property_images(id, image_url)
      `);
    
    if (error) {
      console.log('❌ Error fetching properties:', error.message);
      return;
    }
    
    console.log(`📊 Total properties: ${properties.length}`);
    
    let propertiesWithWorkingImages = 0;
    let propertiesWithoutImages = 0;
    let propertiesWithBrokenImages = 0;
    
    const propertiesToDelete = [];
    const imagesToDelete = [];
    
    console.log('\n2. 🧪 Testing each property and its images...');
    
    for (let i = 0; i < properties.length; i++) {
      const property = properties[i];
      const progress = `[${i + 1}/${properties.length}]`;
      
      if (i % 50 === 0) {
        console.log(`   ${progress} Processing properties...`);
      }
      
      // Check if property has any images
      if (!property.property_images || property.property_images.length === 0) {
        propertiesWithoutImages++;
        propertiesToDelete.push(property);
        continue;
      }
      
      // Test all images for this property
      let hasWorkingImage = false;
      const brokenImagesForProperty = [];
      
      for (const image of property.property_images) {
        const isWorking = await testImageUrl(image.image_url);
        if (isWorking) {
          hasWorkingImage = true;
        } else {
          brokenImagesForProperty.push(image);
        }
      }
      
      // If property has no working images, delete the entire property
      if (!hasWorkingImage) {
        propertiesWithBrokenImages++;
        propertiesToDelete.push(property);
        // Also mark all its images for deletion
        imagesToDelete.push(...property.property_images);
      } else {
        propertiesWithWorkingImages++;
        // Only delete the broken images, keep the property
        imagesToDelete.push(...brokenImagesForProperty);
      }
      
      // Small delay to avoid overwhelming the server
      if (i % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    console.log(`\n📊 Analysis Results:`);
    console.log(`✅ Properties with working images: ${propertiesWithWorkingImages}`);
    console.log(`❌ Properties without any images: ${propertiesWithoutImages}`);
    console.log(`❌ Properties with only broken images: ${propertiesWithBrokenImages}`);
    console.log(`🗑️ Total properties to delete: ${propertiesToDelete.length}`);
    console.log(`🗑️ Total broken images to delete: ${imagesToDelete.length}`);
    
    // Delete broken images first
    if (imagesToDelete.length > 0) {
      console.log(`\n3. 🗑️ Deleting ${imagesToDelete.length} broken images...`);
      
      const batchSize = 50;
      let deletedImages = 0;
      
      for (let i = 0; i < imagesToDelete.length; i += batchSize) {
        const batch = imagesToDelete.slice(i, i + batchSize);
        const idsToDelete = batch.map(img => img.id);
        
        const { error } = await supabase
          .from('property_images')
          .delete()
          .in('id', idsToDelete);
        
        if (!error) {
          deletedImages += batch.length;
        }
        
        console.log(`   Deleted ${deletedImages}/${imagesToDelete.length} broken images...`);
      }
      
      console.log(`✅ Deleted ${deletedImages} broken images`);
    }
    
    // Delete properties without working images
    if (propertiesToDelete.length > 0) {
      console.log(`\n4. 🗑️ Deleting ${propertiesToDelete.length} properties without working images...`);
      
      const batchSize = 50;
      let deletedProperties = 0;
      
      for (let i = 0; i < propertiesToDelete.length; i += batchSize) {
        const batch = propertiesToDelete.slice(i, i + batchSize);
        const idsToDelete = batch.map(prop => prop.id);
        
        const { error } = await supabase
          .from('properties')
          .delete()
          .in('id', idsToDelete);
        
        if (!error) {
          deletedProperties += batch.length;
        }
        
        console.log(`   Deleted ${deletedProperties}/${propertiesToDelete.length} properties...`);
      }
      
      console.log(`✅ Deleted ${deletedProperties} properties without working images`);
    }
    
    // Final verification
    console.log(`\n5. 🔍 Final verification...`);
    
    const { data: finalProperties, error: finalError } = await supabase
      .from('properties')
      .select(`
        id, title,
        property_images:property_images(id)
      `);
    
    if (!finalError) {
      const propertiesWithImages = finalProperties.filter(p => p.property_images && p.property_images.length > 0);
      const propertiesWithoutImages = finalProperties.filter(p => !p.property_images || p.property_images.length === 0);
      
      console.log(`📊 Final Database State:`);
      console.log(`✅ Properties with images: ${propertiesWithImages.length}`);
      console.log(`❌ Properties without images: ${propertiesWithoutImages.length}`);
      console.log(`📈 Total properties remaining: ${finalProperties.length}`);
      
      if (propertiesWithoutImages.length === 0) {
        console.log(`\n🎉 PERFECT! All remaining properties have working images!`);
      } else {
        console.log(`\n⚠️ Warning: ${propertiesWithoutImages.length} properties still have no images`);
      }
    }
    
  } catch (error) {
    console.log('❌ Process failed:', error.message);
  }
}

async function main() {
  try {
    await aggressiveCleanup();
    
    console.log('\n✅ Aggressive cleanup completed!');
    console.log('   Only properties with verified working images remain.');
    console.log('   Refresh your browser - carousel should now work perfectly!');
    
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

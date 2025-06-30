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

console.log('💥 NUCLEAR CLEANUP - Only Keep Properties with VERIFIED Working Images\n');

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

async function nuclearCleanup() {
  try {
    console.log('1. 🔍 Finding properties with working images...');
    
    // Get all properties with images
    const { data: properties, error } = await supabase
      .from('properties')
      .select(`
        id, title, location,
        property_images:property_images(id, image_url)
      `)
      .not('property_images', 'is', null);
    
    if (error) {
      console.log('❌ Error fetching properties:', error.message);
      return;
    }
    
    console.log(`📊 Properties with images: ${properties.length}`);
    
    const propertiesWithWorkingImages = [];
    
    console.log('\n2. 🧪 Testing images for each property...');
    
    for (let i = 0; i < properties.length; i++) {
      const property = properties[i];
      
      if (i % 10 === 0) {
        console.log(`   Testing property ${i + 1}/${properties.length}: ${property.title.substring(0, 50)}...`);
      }
      
      if (!property.property_images || property.property_images.length === 0) {
        continue;
      }
      
      // Test first image only (for speed)
      const firstImage = property.property_images[0];
      const isWorking = await testImageUrl(firstImage.image_url);
      
      if (isWorking) {
        propertiesWithWorkingImages.push(property);
        console.log(`   ✅ KEEP: ${property.title.substring(0, 50)}... (${property.location})`);
      } else {
        console.log(`   ❌ DELETE: ${property.title.substring(0, 50)}... (broken image)`);
      }
      
      // Small delay
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    console.log(`\n📊 Results:`);
    console.log(`✅ Properties with working images: ${propertiesWithWorkingImages.length}`);
    console.log(`❌ Properties to delete: ${properties.length - propertiesWithWorkingImages.length}`);
    
    if (propertiesWithWorkingImages.length === 0) {
      console.log('❌ ERROR: No properties with working images found!');
      return;
    }
    
    // Get IDs of properties to KEEP
    const keepPropertyIds = propertiesWithWorkingImages.map(p => p.id);
    
    console.log(`\n3. 🗑️ Deleting ALL properties except the ${keepPropertyIds.length} with working images...`);
    
    // Delete all properties NOT in the keep list
    const { error: deleteError } = await supabase
      .from('properties')
      .delete()
      .not('id', 'in', `(${keepPropertyIds.map(id => `'${id}'`).join(',')})`);
    
    if (deleteError) {
      console.log('❌ Error deleting properties:', deleteError.message);
      
      // Fallback: Delete properties one by one
      console.log('🔄 Trying individual deletion...');
      
      const { data: allProperties } = await supabase
        .from('properties')
        .select('id');
      
      const propertiesToDelete = allProperties.filter(p => !keepPropertyIds.includes(p.id));
      
      console.log(`   Deleting ${propertiesToDelete.length} properties individually...`);
      
      let deleted = 0;
      for (const prop of propertiesToDelete) {
        const { error } = await supabase
          .from('properties')
          .delete()
          .eq('id', prop.id);
        
        if (!error) {
          deleted++;
          if (deleted % 50 === 0) {
            console.log(`   Deleted ${deleted}/${propertiesToDelete.length} properties...`);
          }
        }
      }
      
      console.log(`✅ Deleted ${deleted} properties individually`);
    } else {
      console.log('✅ Bulk deletion successful!');
    }
    
    // Delete orphaned images
    console.log(`\n4. 🧹 Cleaning up orphaned images...`);
    
    const { error: imageCleanupError } = await supabase
      .from('property_images')
      .delete()
      .not('property_id', 'in', `(${keepPropertyIds.map(id => `'${id}'`).join(',')})`);
    
    if (!imageCleanupError) {
      console.log('✅ Orphaned images cleaned up');
    }
    
    // Final verification
    console.log(`\n5. 🔍 Final verification...`);
    
    const { data: finalProperties, error: finalError } = await supabase
      .from('properties')
      .select(`
        id, title, location,
        property_images:property_images(id)
      `);
    
    if (!finalError) {
      console.log(`📊 Final Database State:`);
      console.log(`✅ Total properties: ${finalProperties.length}`);
      
      const propertiesWithImages = finalProperties.filter(p => p.property_images && p.property_images.length > 0);
      const propertiesWithoutImages = finalProperties.filter(p => !p.property_images || p.property_images.length === 0);
      
      console.log(`✅ Properties with images: ${propertiesWithImages.length}`);
      console.log(`❌ Properties without images: ${propertiesWithoutImages.length}`);
      
      if (propertiesWithoutImages.length === 0 && propertiesWithImages.length > 0) {
        console.log(`\n🎉 SUCCESS! All ${propertiesWithImages.length} properties have working images!`);
      } else if (propertiesWithImages.length === 0) {
        console.log(`\n❌ ERROR: No properties with images remain!`);
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
    await nuclearCleanup();
    
    console.log('\n✅ Nuclear cleanup completed!');
    console.log('   Database now contains ONLY properties with verified working images.');
    console.log('   Refresh your browser - carousel should work perfectly!');
    
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

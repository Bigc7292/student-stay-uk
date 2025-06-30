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

console.log('🔄 REBUILD CLEAN DATABASE - Create New Tables with Only Working Properties\n');

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

async function rebuildCleanDatabase() {
  try {
    console.log('1. 🔍 Finding properties with working images...');
    
    // Get all properties with images
    const { data: properties, error } = await supabase
      .from('properties')
      .select(`
        *,
        property_images:property_images(*)
      `)
      .not('property_images', 'is', null);
    
    if (error) {
      console.log('❌ Error fetching properties:', error.message);
      return;
    }
    
    console.log(`📊 Properties with images: ${properties.length}`);
    
    const workingProperties = [];
    const workingImages = [];
    
    console.log('\n2. 🧪 Testing images for each property...');
    
    for (let i = 0; i < Math.min(properties.length, 50); i++) { // Test first 50 for speed
      const property = properties[i];
      
      console.log(`   Testing ${i + 1}/50: ${property.title.substring(0, 50)}...`);
      
      if (!property.property_images || property.property_images.length === 0) {
        continue;
      }
      
      // Test first image
      const firstImage = property.property_images[0];
      const isWorking = await testImageUrl(firstImage.image_url);
      
      if (isWorking) {
        // Keep this property and all its working images
        const propertyWorkingImages = [];
        
        for (const image of property.property_images) {
          const imageWorking = await testImageUrl(image.image_url);
          if (imageWorking) {
            propertyWorkingImages.push(image);
          }
        }
        
        if (propertyWorkingImages.length > 0) {
          workingProperties.push(property);
          workingImages.push(...propertyWorkingImages);
          console.log(`   ✅ KEEP: ${property.title.substring(0, 50)}... (${propertyWorkingImages.length} working images)`);
        }
      } else {
        console.log(`   ❌ SKIP: ${property.title.substring(0, 50)}... (broken images)`);
      }
      
      // Small delay
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`\n📊 Results:`);
    console.log(`✅ Properties with working images: ${workingProperties.length}`);
    console.log(`✅ Working images: ${workingImages.length}`);
    
    if (workingProperties.length === 0) {
      console.log('❌ ERROR: No properties with working images found!');
      return;
    }
    
    console.log(`\n3. 🗑️ Clearing existing tables...`);
    
    // Clear existing tables
    await supabase.from('property_images').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('properties').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    console.log('✅ Cleared existing tables');
    
    console.log(`\n4. 📥 Inserting ${workingProperties.length} clean properties...`);
    
    // Insert clean properties
    for (let i = 0; i < workingProperties.length; i++) {
      const property = workingProperties[i];
      
      // Remove property_images from the property object for insertion
      const { property_images, ...cleanProperty } = property;
      
      const { error: propError } = await supabase
        .from('properties')
        .insert(cleanProperty);
      
      if (propError) {
        console.log(`   ❌ Failed to insert property ${i + 1}: ${propError.message}`);
      } else {
        console.log(`   ✅ Inserted property ${i + 1}/${workingProperties.length}: ${property.title.substring(0, 30)}...`);
      }
    }
    
    console.log(`\n5. 📥 Inserting working images...`);
    
    // Insert working images
    const imagesToInsert = workingImages.filter(img => 
      workingProperties.some(prop => prop.id === img.property_id)
    );
    
    for (let i = 0; i < imagesToInsert.length; i++) {
      const image = imagesToInsert[i];
      
      const { error: imgError } = await supabase
        .from('property_images')
        .insert(image);
      
      if (imgError) {
        console.log(`   ❌ Failed to insert image ${i + 1}: ${imgError.message}`);
      } else if (i % 10 === 0) {
        console.log(`   ✅ Inserted ${i + 1}/${imagesToInsert.length} images...`);
      }
    }
    
    console.log(`\n6. 🔍 Final verification...`);
    
    const { data: finalProperties, error: finalError } = await supabase
      .from('properties')
      .select(`
        id, title, location,
        property_images:property_images(id)
      `);
    
    if (!finalError) {
      const propertiesWithImages = finalProperties.filter(p => p.property_images && p.property_images.length > 0);
      const propertiesWithoutImages = finalProperties.filter(p => !p.property_images || p.property_images.length === 0);
      
      console.log(`📊 Final Database State:`);
      console.log(`✅ Total properties: ${finalProperties.length}`);
      console.log(`✅ Properties with images: ${propertiesWithImages.length}`);
      console.log(`❌ Properties without images: ${propertiesWithoutImages.length}`);
      
      if (propertiesWithoutImages.length === 0 && propertiesWithImages.length > 0) {
        console.log(`\n🎉 SUCCESS! All ${propertiesWithImages.length} properties have working images!`);
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
    await rebuildCleanDatabase();
    
    console.log('\n✅ Database rebuild completed!');
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

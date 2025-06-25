#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

console.log('🚨 EMERGENCY FIX - ADDING IMAGES TO EXISTING PROPERTIES\n');

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

function fixImageUrl(originalUrl) {
  if (originalUrl.startsWith('http')) {
    return originalUrl;
  }
  return `https://media.rightmove.co.uk/${originalUrl}`;
}

async function fixImagesNow() {
  try {
    console.log('1. 📖 Reading comprehensive property data...');
    
    const dataPath = path.join(__dirname, '../comprehensive_uk_properties_complete.json');
    const rawData = fs.readFileSync(dataPath, 'utf8');
    const data = JSON.parse(rawData);
    
    console.log('2. 🔍 Getting current properties from database...');
    
    const { data: currentProperties, error: propError } = await supabase
      .from('properties')
      .select('id, title');
    
    if (propError) {
      console.log('❌ Error fetching properties:', propError.message);
      return;
    }
    
    console.log(`✅ Found ${currentProperties.length} properties in database`);
    
    console.log('3. 🧪 Finding matching properties with working images...');
    
    let addedImages = 0;
    let processedProperties = 0;
    
    for (const dbProperty of currentProperties) {
      processedProperties++;
      console.log(`\n   Processing ${processedProperties}/${currentProperties.length}: ${dbProperty.title.substring(0, 50)}...`);
      
      // Find matching property in scraped data
      const matchingProperty = data.properties.find(p => 
        p.title && p.title.trim() === dbProperty.title.trim()
      );
      
      if (!matchingProperty || !matchingProperty.images || matchingProperty.images.length === 0) {
        console.log(`     ⚠️ No matching property or images found`);
        continue;
      }
      
      console.log(`     📸 Testing ${matchingProperty.images.length} images...`);
      
      const workingImages = [];
      
      for (let i = 0; i < matchingProperty.images.length; i++) {
        const image = matchingProperty.images[i];
        const fixedUrl = fixImageUrl(image.url);
        
        const isWorking = await testImageUrl(fixedUrl);
        if (isWorking) {
          workingImages.push({
            id: crypto.randomUUID(),
            property_id: dbProperty.id,
            image_url: fixedUrl,
            alt_text: image.alt || `Property image ${i + 1}`,
            is_primary: i === 0,
            created_at: new Date().toISOString()
          });
        }
        
        // Small delay
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      if (workingImages.length > 0) {
        console.log(`     ✅ Found ${workingImages.length} working images, inserting...`);
        
        const { error: imgError } = await supabase
          .from('property_images')
          .insert(workingImages);
        
        if (imgError) {
          console.log(`     ❌ Failed to insert images: ${imgError.message}`);
        } else {
          addedImages += workingImages.length;
          console.log(`     ✅ Successfully added ${workingImages.length} images`);
        }
      } else {
        console.log(`     ❌ No working images found`);
      }
    }
    
    console.log(`\n📊 EMERGENCY FIX Results:`);
    console.log(`✅ Processed properties: ${processedProperties}`);
    console.log(`✅ Added images: ${addedImages}`);
    
    // Final verification
    console.log(`\n4. 🔍 Final verification...`);
    
    const { data: finalProperties, error: finalError } = await supabase
      .from('properties')
      .select(`
        id, title,
        property_images:property_images(id)
      `);
    
    if (!finalError) {
      const totalImages = finalProperties.reduce((sum, p) => sum + (p.property_images?.length || 0), 0);
      const propertiesWithImages = finalProperties.filter(p => p.property_images && p.property_images.length > 0);
      
      console.log(`📊 Final Database State:`);
      console.log(`✅ Total properties: ${finalProperties.length}`);
      console.log(`✅ Total images: ${totalImages}`);
      console.log(`✅ Properties with images: ${propertiesWithImages.length}`);
      console.log(`📈 Image coverage: ${((propertiesWithImages.length / finalProperties.length) * 100).toFixed(1)}%`);
      
      if (totalImages > 0) {
        console.log(`\n🎉 SUCCESS! Fixed the image problem!`);
        console.log(`   Your carousel now has ${totalImages} working images!`);
      } else {
        console.log(`\n❌ STILL NO IMAGES! Need to investigate further.`);
      }
    }
    
  } catch (error) {
    console.log('❌ Emergency fix failed:', error.message);
  }
}

async function main() {
  try {
    await fixImagesNow();
    
    console.log('\n✅ Emergency image fix completed!');
    console.log('   Refresh your browser to see the results!');
    
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

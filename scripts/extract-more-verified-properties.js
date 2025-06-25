#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

console.log('🎯 EXTRACTING MORE VERIFIED PROPERTIES FROM COMPREHENSIVE DATA\n');

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

async function extractMoreProperties() {
  try {
    console.log('1. 📖 Reading comprehensive property data...');
    
    const dataPath = path.join(__dirname, '../comprehensive_uk_properties_complete.json');
    const rawData = fs.readFileSync(dataPath, 'utf8');
    const data = JSON.parse(rawData);
    
    console.log(`📊 Total properties available: ${data.properties.length}`);
    
    console.log('\n2. 🔍 Getting current properties from database...');
    
    const { data: currentProperties, error: propError } = await supabase
      .from('properties')
      .select('title');
    
    if (propError) {
      console.log('❌ Error fetching current properties:', propError.message);
      return;
    }
    
    const currentTitles = new Set(currentProperties.map(p => p.title.trim()));
    console.log(`✅ Found ${currentProperties.length} existing properties in database`);
    
    console.log('\n3. 🎯 Selecting diverse properties from different cities...');
    
    // Group properties by location/city
    const propertiesByLocation = {};
    
    for (const property of data.properties) {
      if (!property.images || property.images.length === 0) continue;
      if (currentTitles.has(property.title?.trim())) continue; // Skip existing properties
      
      const location = property.location || 'Unknown';
      if (!propertiesByLocation[location]) {
        propertiesByLocation[location] = [];
      }
      propertiesByLocation[location].push(property);
    }
    
    const locations = Object.keys(propertiesByLocation);
    console.log(`📍 Found properties in ${locations.length} different locations`);
    console.log(`🏙️ Sample locations: ${locations.slice(0, 10).join(', ')}`);
    
    // Select properties from different locations
    const selectedProperties = [];
    const maxPerLocation = 5; // Max 5 properties per location
    const maxTotalProperties = 100; // Max 100 new properties
    
    for (const location of locations) {
      if (selectedProperties.length >= maxTotalProperties) break;
      
      const locationProperties = propertiesByLocation[location];
      const toTake = Math.min(maxPerLocation, locationProperties.length, maxTotalProperties - selectedProperties.length);
      
      selectedProperties.push(...locationProperties.slice(0, toTake));
      
      if (toTake > 0) {
        console.log(`   📍 Selected ${toTake} properties from ${location}`);
      }
    }
    
    console.log(`\n📊 Selected ${selectedProperties.length} properties for verification`);
    
    console.log('\n4. 🧪 VERIFYING IMAGES FOR SELECTED PROPERTIES...');
    
    const verifiedProperties = [];
    let tested = 0;
    let verified = 0;
    
    for (const property of selectedProperties) {
      tested++;
      
      if (tested % 10 === 0) {
        console.log(`   Tested ${tested}/${selectedProperties.length} properties...`);
      }
      
      // Fix image URLs
      const fixedImages = property.images.map(img => ({
        ...img,
        url: fixImageUrl(img.url)
      }));
      
      // Test first image
      const firstImageUrl = fixedImages[0].url;
      const isWorking = await testImageUrl(firstImageUrl);
      
      if (isWorking) {
        // Test a few more images to ensure quality
        const workingImages = [];
        
        for (let i = 0; i < Math.min(fixedImages.length, 3); i++) {
          const image = fixedImages[i];
          const imageWorking = await testImageUrl(image.url);
          
          if (imageWorking) {
            workingImages.push(image);
          }
          
          // Small delay
          await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        if (workingImages.length > 0) {
          verifiedProperties.push({
            ...property,
            images: workingImages
          });
          verified++;
          
          if (verified % 5 === 0) {
            console.log(`   ✅ Verified ${verified} properties with working images`);
          }
        }
      }
    }
    
    console.log(`\n📊 VERIFICATION RESULTS:`);
    console.log(`✅ Properties tested: ${tested}`);
    console.log(`✅ Properties with working images: ${verified}`);
    console.log(`📈 Success rate: ${((verified / tested) * 100).toFixed(1)}%`);
    
    if (verified === 0) {
      console.log('\n❌ No new properties with working images found.');
      console.log('   Your existing 279 images are still the best option.');
      return;
    }
    
    console.log(`\n5. 📥 IMPORTING ${verified} NEW VERIFIED PROPERTIES...`);
    
    let importedProperties = 0;
    let importedImages = 0;
    let failedProperties = 0;
    
    for (const property of verifiedProperties) {
      try {
        // Generate UUID for property
        const propertyId = crypto.randomUUID();
        
        // Prepare property data
        const propertyData = {
          id: propertyId,
          title: property.title || 'Untitled Property',
          price: property.price || 0,
          price_type: property.price_type || 'monthly',
          location: property.location || 'Unknown',
          full_address: property.full_address || property.location || 'Unknown',
          postcode: property.postcode || null,
          bedrooms: property.bedrooms || 1,
          bathrooms: property.bathrooms || 1,
          property_type: property.property_type || 'house',
          furnished: property.furnished !== false,
          available: property.available !== false,
          description: property.description || property.title || 'No description available',
          landlord_name: property.landlord_name || 'Unknown',
          source: 'rightmove',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        // Insert property
        const { error: propError } = await supabase
          .from('properties')
          .insert(propertyData);
        
        if (propError) {
          console.log(`   ❌ Failed to insert property: ${propError.message}`);
          failedProperties++;
          continue;
        }
        
        importedProperties++;
        
        // Import verified images
        const imageData = property.images.map((image, index) => ({
          id: crypto.randomUUID(),
          property_id: propertyId,
          image_url: image.url,
          alt_text: image.alt || `Property image ${index + 1}`,
          is_primary: index === 0,
          created_at: new Date().toISOString()
        }));
        
        const { error: imgError } = await supabase
          .from('property_images')
          .insert(imageData);
        
        if (!imgError) {
          importedImages += imageData.length;
        }
        
        if (importedProperties % 10 === 0) {
          console.log(`   ✅ Imported ${importedProperties}/${verified} properties...`);
        }
        
      } catch (error) {
        console.log(`   ❌ Error processing property: ${error.message}`);
        failedProperties++;
      }
    }
    
    console.log(`\n📊 IMPORT RESULTS:`);
    console.log(`✅ Successfully imported: ${importedProperties} properties`);
    console.log(`✅ Successfully imported: ${importedImages} images`);
    console.log(`❌ Failed: ${failedProperties} properties`);
    console.log(`📈 Import success rate: ${((importedProperties / verified) * 100).toFixed(1)}%`);
    
    // Final verification
    console.log(`\n6. 🔍 Final database state...`);
    
    const { data: finalProperties, error: finalError } = await supabase
      .from('properties')
      .select(`
        id, title, location,
        property_images:property_images(id)
      `);
    
    if (!finalError) {
      const totalImages = finalProperties.reduce((sum, p) => sum + (p.property_images?.length || 0), 0);
      const propertiesWithImages = finalProperties.filter(p => p.property_images && p.property_images.length > 0);
      
      console.log(`📊 FINAL DATABASE STATE:`);
      console.log(`✅ Total properties: ${finalProperties.length}`);
      console.log(`✅ Total images: ${totalImages}`);
      console.log(`✅ Properties with images: ${propertiesWithImages.length}`);
      console.log(`📈 Image coverage: ${((propertiesWithImages.length / finalProperties.length) * 100).toFixed(1)}%`);
      
      if (importedProperties > 0) {
        console.log(`\n🎉 SUCCESS! Added ${importedProperties} NEW properties with ${importedImages} verified images!`);
        console.log(`   Your carousel now has ${totalImages} total working images!`);
        console.log(`   Properties from diverse locations across the UK!`);
      }
    }
    
  } catch (error) {
    console.log('❌ Extraction failed:', error.message);
  }
}

async function main() {
  try {
    await extractMoreProperties();
    
    console.log('\n✅ Property extraction completed!');
    console.log('   Refresh your browser to see the expanded carousel!');
    
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

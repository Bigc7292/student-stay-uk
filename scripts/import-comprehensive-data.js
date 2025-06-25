#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

console.log('📥 Importing Comprehensive Property Data (4,565 Properties)\n');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function importComprehensiveData() {
  try {
    console.log('1. 📖 Reading comprehensive property data...');
    
    const dataPath = path.join(__dirname, '../comprehensive_uk_properties_complete.json');
    const rawData = fs.readFileSync(dataPath, 'utf8');
    const data = JSON.parse(rawData);
    
    console.log(`📊 Found ${data.properties.length} properties to import`);
    
    if (data.properties.length === 0) {
      console.log('❌ No properties found in data file!');
      return;
    }
    
    console.log('\n2. 🗑️ Clearing existing data...');
    
    // Clear existing tables
    await supabase.from('property_images').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('properties').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    console.log('✅ Cleared existing data');
    
    console.log('\n3. 📥 Importing properties...');
    
    let importedProperties = 0;
    let importedImages = 0;
    let skippedProperties = 0;
    
    // Import in batches
    const batchSize = 50;
    for (let i = 0; i < data.properties.length; i += batchSize) {
      const batch = data.properties.slice(i, i + batchSize);
      
      console.log(`   Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(data.properties.length/batchSize)}...`);
      
      for (const property of batch) {
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
            furnished: property.furnished !== false, // Default to true
            available: property.available !== false, // Default to true
            description: property.description || property.title || 'No description available',
            landlord_name: property.landlord_name || 'Unknown',
            features: property.features || [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          // Insert property
          const { error: propError } = await supabase
            .from('properties')
            .insert(propertyData);
          
          if (propError) {
            console.log(`   ❌ Failed to insert property: ${propError.message}`);
            skippedProperties++;
            continue;
          }
          
          importedProperties++;
          
          // Import images if they exist
          if (property.images && property.images.length > 0) {
            const imageData = property.images.map((image, index) => ({
              id: crypto.randomUUID(),
              property_id: propertyId,
              image_url: image.url.startsWith('http') 
                ? image.url 
                : `https://media.rightmove.co.uk:443/dir/crop/10:9-16:9/${image.url}`,
              alt_text: image.alt || `Property image ${index + 1}`,
              is_primary: index === 0, // First image is primary
              image_order: index + 1,
              created_at: new Date().toISOString()
            }));
            
            const { error: imgError } = await supabase
              .from('property_images')
              .insert(imageData);
            
            if (!imgError) {
              importedImages += imageData.length;
            }
          }
          
        } catch (error) {
          console.log(`   ❌ Error processing property: ${error.message}`);
          skippedProperties++;
        }
      }
      
      // Progress update
      console.log(`   ✅ Imported ${importedProperties} properties, ${importedImages} images so far...`);
      
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`\n📊 Import Results:`);
    console.log(`✅ Successfully imported: ${importedProperties} properties`);
    console.log(`✅ Successfully imported: ${importedImages} images`);
    console.log(`❌ Skipped: ${skippedProperties} properties`);
    console.log(`📈 Success rate: ${((importedProperties / data.properties.length) * 100).toFixed(1)}%`);
    
    // Final verification
    console.log(`\n4. 🔍 Final verification...`);
    
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
      console.log(`📈 Image coverage: ${((propertiesWithImages.length / finalProperties.length) * 100).toFixed(1)}%`);
      
      if (propertiesWithImages.length > 100) {
        console.log(`\n🎉 SUCCESS! Imported ${propertiesWithImages.length} properties with images!`);
        console.log(`   This is a MASSIVE improvement from the 39 properties we had before!`);
      }
    }
    
  } catch (error) {
    console.log('❌ Import failed:', error.message);
  }
}

async function main() {
  try {
    await importComprehensiveData();
    
    console.log('\n✅ Comprehensive data import completed!');
    console.log('   Your carousel should now have THOUSANDS of properties to choose from!');
    console.log('   Refresh your browser to see the massive improvement!');
    
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

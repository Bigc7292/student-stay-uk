#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

console.log('🔍 CHECKING CURRENT DATABASE STATE\n');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkDatabase() {
  try {
    console.log('📊 Fetching database statistics...');
    
    // Get properties count
    const { data: properties, error: propError } = await supabase
      .from('properties')
      .select('id, title, location');
    
    if (propError) {
      console.log('❌ Error fetching properties:', propError.message);
      return;
    }
    
    // Get images count
    const { data: images, error: imgError } = await supabase
      .from('property_images')
      .select('id, property_id');
    
    if (imgError) {
      console.log('❌ Error fetching images:', imgError.message);
      return;
    }
    
    console.log('\n📊 CURRENT DATABASE STATE:');
    console.log('✅ Total Properties:', properties.length);
    console.log('✅ Total Images:', images.length);
    
    if (properties.length > 0) {
      console.log('📈 Average images per property:', (images.length / properties.length).toFixed(1));
      
      // Check properties with images
      const propertiesWithImages = properties.filter(prop => 
        images.some(img => img.property_id === prop.id)
      );
      
      const propertiesWithoutImages = properties.filter(prop => 
        !images.some(img => img.property_id === prop.id)
      );
      
      console.log('✅ Properties with images:', propertiesWithImages.length);
      console.log('❌ Properties without images:', propertiesWithoutImages.length);
      console.log('📈 Image coverage:', ((propertiesWithImages.length / properties.length) * 100).toFixed(1) + '%');
      
      console.log('\n🏠 Sample properties:');
      properties.slice(0, 5).forEach((prop, index) => {
        const imageCount = images.filter(img => img.property_id === prop.id).length;
        console.log(`   ${index + 1}. ${prop.title.substring(0, 50)}... (${imageCount} images)`);
      });
      
      if (properties.length >= 36) {
        console.log('\n🎉 SUCCESS: You have enough properties for a great carousel!');
      } else {
        console.log('\n⚠️ Note: You have fewer than 36 properties. Consider importing more data.');
      }
    } else {
      console.log('\n❌ No properties found in database!');
    }
    
  } catch (error) {
    console.log('❌ Database check failed:', error.message);
  }
}

async function main() {
  try {
    await checkDatabase();
    console.log('\n✅ Database check completed!');
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

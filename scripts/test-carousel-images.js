import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testCarouselImages() {
  console.log('🖼️ Testing carousel images from database...\n');
  
  try {
    // Get properties with images for carousel
    const { data: properties, error } = await supabase
      .from('properties')
      .select(`
        id,
        title,
        price,
        price_type,
        location,
        property_images:property_images(*)
      `)
      .eq('available', true)
      .limit(10);

    if (error) throw error;

    console.log(`📊 Found ${properties?.length || 0} properties for carousel\n`);

    if (properties && properties.length > 0) {
      for (let i = 0; i < Math.min(5, properties.length); i++) {
        const property = properties[i];
        console.log(`🏠 Property ${i + 1}: ${property.title}`);
        console.log(`   📍 Location: ${property.location}`);
        console.log(`   💰 Price: £${property.price} ${property.price_type}`);
        console.log(`   🖼️ Images: ${property.property_images?.length || 0}`);
        
        if (property.property_images && property.property_images.length > 0) {
          property.property_images.slice(0, 3).forEach((img, idx) => {
            console.log(`      ${idx + 1}. ${img.image_url}`);
          });
          if (property.property_images.length > 3) {
            console.log(`      ... and ${property.property_images.length - 3} more images`);
          }
        } else {
          console.log('      ❌ No images found');
        }
        console.log('');
      }

      // Test image URL accessibility
      console.log('🔗 Testing image URL accessibility...\n');
      
      const sampleImages = properties
        .filter(p => p.property_images && p.property_images.length > 0)
        .slice(0, 3)
        .map(p => p.property_images[0].image_url);

      for (const imageUrl of sampleImages) {
        try {
          console.log(`Testing: ${imageUrl}`);
          
          // Test if URL is accessible
          const response = await fetch(imageUrl, { method: 'HEAD' });
          
          if (response.ok) {
            console.log(`✅ Image accessible (${response.status})`);
          } else {
            console.log(`❌ Image not accessible (${response.status})`);
          }
        } catch (error) {
          console.log(`❌ Image failed to load: ${error.message}`);
        }
      }

      // Summary
      const propertiesWithImages = properties.filter(p => p.property_images && p.property_images.length > 0);
      const totalImages = properties.reduce((sum, p) => sum + (p.property_images?.length || 0), 0);
      
      console.log('\n📊 CAROUSEL IMAGE SUMMARY:');
      console.log(`   🏠 Total properties: ${properties.length}`);
      console.log(`   🖼️ Properties with images: ${propertiesWithImages.length}`);
      console.log(`   📸 Total images: ${totalImages}`);
      console.log(`   📈 Image coverage: ${((propertiesWithImages.length / properties.length) * 100).toFixed(1)}%`);
      
      if (propertiesWithImages.length === 0) {
        console.log('\n❌ NO IMAGES FOUND FOR CAROUSEL!');
        console.log('💡 Possible solutions:');
        console.log('   1. Check if images were imported correctly');
        console.log('   2. Verify image URLs in database');
        console.log('   3. Run image import script again');
      } else {
        console.log('\n✅ CAROUSEL IMAGES READY!');
        console.log('🎯 Images should display in the carousel');
      }

    } else {
      console.log('❌ No properties found in database');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testCarouselImages();
